import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface VADState {
  isDetecting: boolean;
  isVoiceDetected: boolean;
  voiceLevel: number;
  noiseLevel: number;
  confidence: number;
  error: string | null;
}

export interface VADConfig {
  threshold: number;
  silenceTimeout: number;
  voiceTimeout: number;
  smoothing: number;
  sensitivity: number;
}

export interface UseRealTimeVADReturn {
  vadState: VADState;
  vadConfig: VADConfig;
  startDetection: () => Promise<void>;
  stopDetection: () => void;
  updateConfig: (config: Partial<VADConfig>) => void;
  isVoiceDetected: boolean;
  voiceLevel: number;
}

const DEFAULT_CONFIG: VADConfig = {
  threshold: 0.01,        // Voice detection threshold
  silenceTimeout: 800,    // ms of silence before declaring end of speech
  voiceTimeout: 100,      // ms of voice before declaring start of speech
  smoothing: 0.8,         // Smoothing factor for audio levels
  sensitivity: 1.0        // Overall sensitivity multiplier
};

export const useRealTimeVAD = (): UseRealTimeVADReturn => {
  const { toast } = useToast();
  
  const [vadState, setVADState] = useState<VADState>({
    isDetecting: false,
    isVoiceDetected: false,
    voiceLevel: 0,
    noiseLevel: 0,
    confidence: 0,
    error: null
  });

  const [vadConfig, setVADConfig] = useState<VADConfig>(DEFAULT_CONFIG);

  // Audio processing refs
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // VAD logic refs
  const smoothedLevelRef = useRef(0);
  const noiseLevelRef = useRef(0);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isVoiceActiveRef = useRef(false);

  // Callbacks for voice activity
  const onVoiceStartRef = useRef<(() => void) | null>(null);
  const onVoiceEndRef = useRef<(() => void) | null>(null);

  // Calculate RMS (Root Mean Square) of audio data
  const calculateRMS = useCallback((dataArray: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    return Math.sqrt(sum / dataArray.length);
  }, []);

  // Audio processing loop
  const processAudio = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    // Get audio data
    analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
    
    // Calculate current audio level
    const currentLevel = calculateRMS(dataArrayRef.current);
    
    // Smooth the audio level
    smoothedLevelRef.current = (
      vadConfig.smoothing * smoothedLevelRef.current + 
      (1 - vadConfig.smoothing) * currentLevel
    );

    // Update noise floor (very slow adaptation)
    noiseLevelRef.current = (
      0.95 * noiseLevelRef.current + 
      0.05 * Math.min(smoothedLevelRef.current, noiseLevelRef.current + 0.001)
    );

    // Calculate relative voice level above noise floor
    const relativeLevel = Math.max(0, smoothedLevelRef.current - noiseLevelRef.current);
    const adjustedThreshold = vadConfig.threshold * vadConfig.sensitivity;
    
    // Voice activity detection
    const isVoiceNow = relativeLevel > adjustedThreshold;
    const confidence = Math.min(1, relativeLevel / adjustedThreshold);

    // Update state
    setVADState(prev => ({
      ...prev,
      voiceLevel: smoothedLevelRef.current,
      noiseLevel: noiseLevelRef.current,
      confidence
    }));

    // Voice activity state machine
    if (isVoiceNow && !isVoiceActiveRef.current) {
      // Potential voice start
      if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      voiceTimerRef.current = setTimeout(() => {
        if (!isVoiceActiveRef.current) {
          console.log('[RealTimeVAD] Voice activity started');
          isVoiceActiveRef.current = true;
          
          setVADState(prev => ({ ...prev, isVoiceDetected: true }));
          
          onVoiceStartRef.current?.();
        }
      }, vadConfig.voiceTimeout);
      
    } else if (!isVoiceNow && isVoiceActiveRef.current) {
      // Potential voice end
      if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      
      silenceTimerRef.current = setTimeout(() => {
        if (isVoiceActiveRef.current) {
          console.log('[RealTimeVAD] Voice activity ended');
          isVoiceActiveRef.current = false;
          
          setVADState(prev => ({ ...prev, isVoiceDetected: false }));
          
          onVoiceEndRef.current?.();
        }
      }, vadConfig.silenceTimeout);
      
    } else if (isVoiceNow && isVoiceActiveRef.current) {
      // Continued voice activity
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }

    // Continue processing
    if (vadState.isDetecting) {
      animationFrameRef.current = requestAnimationFrame(processAudio);
    }
  }, [vadConfig, vadState.isDetecting, calculateRMS]);

  // Start VAD detection
  const startDetection = useCallback(async () => {
    try {
      console.log('[RealTimeVAD] Starting voice activity detection');

      // Request microphone access
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });

      // Resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create analyser
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;

      // Create source and connect
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);

      // Create data array
      dataArrayRef.current = new Float32Array(analyserRef.current.fftSize);

      // Initialize noise level
      noiseLevelRef.current = 0.001;
      smoothedLevelRef.current = 0;
      isVoiceActiveRef.current = false;

      setVADState(prev => ({
        ...prev,
        isDetecting: true,
        error: null
      }));

      // Start processing loop
      animationFrameRef.current = requestAnimationFrame(processAudio);

      console.log('[RealTimeVAD] Voice activity detection started successfully');

    } catch (error) {
      console.error('[RealTimeVAD] Error starting detection:', error);
      
      let errorMessage = 'Failed to start voice detection';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please enable microphone permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please connect a microphone.';
        } else {
          errorMessage = error.message;
        }
      }

      setVADState(prev => ({
        ...prev,
        error: errorMessage,
        isDetecting: false
      }));

      toast({
        title: "VAD Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [processAudio, toast]);

  // Stop VAD detection
  const stopDetection = useCallback(() => {
    console.log('[RealTimeVAD] Stopping voice activity detection');

    // Clear timers
    if (voiceTimerRef.current) clearTimeout(voiceTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Reset refs
    analyserRef.current = null;
    dataArrayRef.current = null;
    isVoiceActiveRef.current = false;

    setVADState(prev => ({
      ...prev,
      isDetecting: false,
      isVoiceDetected: false,
      voiceLevel: 0,
      confidence: 0
    }));
  }, []);

  // Update VAD configuration
  const updateConfig = useCallback((config: Partial<VADConfig>) => {
    console.log('[RealTimeVAD] Updating configuration:', config);
    setVADConfig(prev => ({ ...prev, ...config }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    vadState,
    vadConfig,
    startDetection,
    stopDetection,
    updateConfig,
    isVoiceDetected: vadState.isVoiceDetected,
    voiceLevel: vadState.voiceLevel
  };
};