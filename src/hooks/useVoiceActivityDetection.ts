import { useRef, useCallback, useEffect, useState } from 'react';
import { useGlobalAudioManager } from './useGlobalAudioManager';

interface VADConfig {
  threshold?: number;
  minSpeechDuration?: number;
  silenceDuration?: number;
  confidenceThreshold?: number;
}

interface VADState {
  isUserSpeaking: boolean;
  confidence: number;
  audioLevel: number;
  isListening: boolean;
  isDisabled: boolean;
  interruptionCount: number;
  isCircuitBreakerOpen: boolean;
}

const DEFAULT_VAD_CONFIG = {
  threshold: 0.5, // EMERGENCY: Even less sensitive
  minSpeechDuration: 1000, // Require 1 full second of speech
  silenceDuration: 3000, // Wait 3 seconds of silence
  confidenceThreshold: 0.9 // Very high confidence required
};

export const useVoiceActivityDetection = (
  config: Partial<VADConfig> = {},
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void,
  disableWhenPlaying?: boolean
) => {
  const combinedConfig = { ...DEFAULT_VAD_CONFIG, ...config };
  const audioManager = useGlobalAudioManager();
  
  const [vadState, setVADState] = useState<VADState>({
    isUserSpeaking: false,
    confidence: 0,
    audioLevel: 0,
    isListening: false,
    isDisabled: false,
    interruptionCount: 0,
    isCircuitBreakerOpen: false
  });

  // Use refs for internal state that doesn't trigger re-renders
  const internalState = useRef({
    isUserSpeaking: false,
    confidence: 0,
    audioLevel: 0,
    consecutiveSpeechFrames: 0,
    consecutiveSilenceFrames: 0,
    speechStartTime: 0,
    interruptionCount: 0,
    lastInterruptionTime: 0,
    isCircuitBreakerOpen: false,
    lastTTSStopTime: 0, // Track when TTS last stopped
    vadCooldownActive: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const circuitBreakerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vadCooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateRMS = useCallback((dataArray: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / dataArray.length);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !vadState.isListening) {
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const rms = calculateRMS(dataArray);
    const normalizedLevel = Math.min(rms / 128, 1);
    const confidence = Math.min(rms / (combinedConfig.threshold * 255), 1);

    // Emergency circuit breaker check (reduced threshold and increased timeout)
    const now = Date.now();
    if (internalState.current.interruptionCount >= 2 && 
        now - internalState.current.lastInterruptionTime < 30000) {
      if (!internalState.current.isCircuitBreakerOpen) {
        console.log('VAD: EMERGENCY Circuit breaker activated - too many interruptions');
        internalState.current.isCircuitBreakerOpen = true;
        
        setVADState(prev => ({ ...prev, isCircuitBreakerOpen: true }));
        
        // Reset circuit breaker after 30 seconds
        circuitBreakerTimeoutRef.current = setTimeout(() => {
          internalState.current.isCircuitBreakerOpen = false;
          internalState.current.interruptionCount = 0;
          setVADState(prev => ({ ...prev, isCircuitBreakerOpen: false, interruptionCount: 0 }));
          console.log('VAD: Circuit breaker reset');
        }, 30000);
      }
      return; // Skip processing while circuit breaker is open
    }

    // Critical: Skip if TTS is playing OR cooldown is active to prevent feedback
    if (disableWhenPlaying || internalState.current.vadCooldownActive) {
      return;
    }

    // Enhanced cooldown: Don't detect speech too soon after TTS stops
    if (now - internalState.current.lastTTSStopTime < 2000) {
      return;
    }

    // Detect speech based on RMS and confidence threshold (increased sensitivity threshold)
    const isSpeechDetected = rms > combinedConfig.threshold && confidence > combinedConfig.confidenceThreshold;

    if (isSpeechDetected) {
      internalState.current.consecutiveSpeechFrames++;
      internalState.current.consecutiveSilenceFrames = 0;
      
      if (internalState.current.consecutiveSpeechFrames >= 3) { // Require multiple frames
        if (!internalState.current.isUserSpeaking) {
          internalState.current.isUserSpeaking = true;
          internalState.current.speechStartTime = now;
          
          // Critical: Increment interruption counter ONLY if this seems like TTS feedback
          if (disableWhenPlaying && now - internalState.current.lastTTSStopTime < 1000) {
            internalState.current.interruptionCount++;
            internalState.current.lastInterruptionTime = now;
            console.log(`VAD: POSSIBLE TTS FEEDBACK INTERRUPTION detected (${internalState.current.interruptionCount})`);
            
            setVADState(prev => ({ 
              ...prev, 
              interruptionCount: internalState.current.interruptionCount 
            }));
          } else {
            console.log('VAD: Legitimate user speech detected');
          }
          
          setVADState(prev => ({ 
            ...prev, 
            isUserSpeaking: true, 
            confidence,
            audioLevel: normalizedLevel 
          }));
          
          onSpeechStart?.();
        }
      }
    } else {
      internalState.current.consecutiveSilenceFrames++;
      internalState.current.consecutiveSpeechFrames = 0;
      
      if (internalState.current.isUserSpeaking && 
          internalState.current.consecutiveSilenceFrames >= 10) { // Require multiple silent frames
        
        const speechDuration = now - internalState.current.speechStartTime;
        if (speechDuration >= combinedConfig.minSpeechDuration) {
          internalState.current.isUserSpeaking = false;
          
          setVADState(prev => ({ 
            ...prev, 
            isUserSpeaking: false,
            confidence: 0,
            audioLevel: normalizedLevel 
          }));
          
          onSpeechEnd?.();
        }
      }
    }

    // Always update audio levels for visual feedback
    setVADState(prev => ({ 
      ...prev, 
      audioLevel: normalizedLevel,
      confidence: confidence 
    }));

    if (vadState.isListening) {
      requestAnimationFrame(analyzeAudio);
    }
  }, [vadState.isListening, combinedConfig, calculateRMS, onSpeechStart, onSpeechEnd, disableWhenPlaying]);

  const startListening = useCallback(async (): Promise<boolean> => {
    // Check with audio manager first
    if (!audioManager.canStart('vad')) {
      console.log('VAD: Blocked by audio manager');
      return false;
    }

    try {
      console.log('VAD: Starting voice activity detection');
      
      // Enhanced audio constraints for better isolation
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Additional constraints to prevent feedback
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googBeamforming: true,
          googArrayGeometry: true
        } as any
      });

      streamRef.current = stream;
      
      // Use existing audio context or create new one
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      setVADState(prev => ({ 
        ...prev, 
        isListening: true,
        isDisabled: false
      }));

      // Start analysis loop
      analyzeAudio();
      
      return true;
    } catch (error) {
      console.error('VAD: Error starting:', error);
      setVADState(prev => ({ 
        ...prev, 
        isListening: false
      }));
      return false;
    }
  }, [analyzeAudio, audioManager]);

  const stopListening = useCallback(() => {
    console.log('VAD: Stopping voice activity detection');

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Clear all timeouts
    if (circuitBreakerTimeoutRef.current) {
      clearTimeout(circuitBreakerTimeoutRef.current);
      circuitBreakerTimeoutRef.current = null;
    }
    
    if (vadCooldownTimeoutRef.current) {
      clearTimeout(vadCooldownTimeoutRef.current);
      vadCooldownTimeoutRef.current = null;
    }

    // Disconnect audio nodes
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('VAD: Stopped audio track:', track.kind);
      });
      streamRef.current = null;
    }

    // Close audio context if no other processes need it
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    // Reset internal state
    internalState.current = {
      isUserSpeaking: false,
      confidence: 0,
      audioLevel: 0,
      consecutiveSpeechFrames: 0,
      consecutiveSilenceFrames: 0,
      speechStartTime: 0,
      interruptionCount: internalState.current.interruptionCount, // Keep interruption count
      lastInterruptionTime: internalState.current.lastInterruptionTime,
      isCircuitBreakerOpen: internalState.current.isCircuitBreakerOpen,
      lastTTSStopTime: internalState.current.lastTTSStopTime,
      vadCooldownActive: internalState.current.vadCooldownActive
    };

    setVADState(prev => ({
      ...prev,
      isUserSpeaking: false,
      isListening: false,
      audioLevel: 0,
      confidence: 0
    }));
  }, []);

  const resetCircuitBreaker = useCallback(() => {
    internalState.current.isCircuitBreakerOpen = false;
    internalState.current.interruptionCount = 0;
    internalState.current.vadCooldownActive = false;
    setVADState(prev => ({ ...prev, isCircuitBreakerOpen: false, interruptionCount: 0 }));
    
    if (circuitBreakerTimeoutRef.current) {
      clearTimeout(circuitBreakerTimeoutRef.current);
    }
    
    if (vadCooldownTimeoutRef.current) {
      clearTimeout(vadCooldownTimeoutRef.current);
    }
    
    console.log('VAD: Circuit breaker and cooldowns manually reset');
  }, []);

  // New function to be called when TTS stops
  const onTTSStop = useCallback(() => {
    const now = Date.now();
    internalState.current.lastTTSStopTime = now;
    internalState.current.vadCooldownActive = true;
    
    // Set cooldown for 2 seconds after TTS stops
    vadCooldownTimeoutRef.current = setTimeout(() => {
      internalState.current.vadCooldownActive = false;
      console.log('VAD: Cooldown period ended, ready for user speech');
    }, 2000);
    
    console.log('VAD: TTS stopped, cooldown activated');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    vadState,
    startListening,
    stopListening,
    resetCircuitBreaker,
    onTTSStop, // New function for TTS coordination
    isUserSpeaking: vadState.isUserSpeaking,
    audioLevel: vadState.audioLevel,
    confidence: vadState.confidence,
    isListening: vadState.isListening,
    isDisabled: vadState.isDisabled || vadState.isCircuitBreakerOpen
  };
};