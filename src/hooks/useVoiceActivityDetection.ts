import { useRef, useCallback, useEffect, useState } from 'react';

interface VADConfig {
  threshold: number;
  minSpeechDuration: number;
  silenceDuration: number;
  confidenceThreshold: number;
}

interface VADState {
  isUserSpeaking: boolean;
  confidence: number;
  audioLevel: number;
  isListening: boolean;
}

const DEFAULT_VAD_CONFIG: VADConfig = {
  threshold: 0.01,
  minSpeechDuration: 300, // ms
  silenceDuration: 800, // ms
  confidenceThreshold: 0.6
};

export const useVoiceActivityDetection = (
  config: Partial<VADConfig> = {},
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void
) => {
  const [vadState, setVADState] = useState<VADState>({
    isUserSpeaking: false,
    confidence: 0,
    audioLevel: 0,
    isListening: false
  });

  const vadConfig = { ...DEFAULT_VAD_CONFIG, ...config };
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const vadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechStartTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);

  const calculateRMS = useCallback((dataArray: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / dataArray.length);
  }, []);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || isProcessingRef.current) return;

    isProcessingRef.current = true;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const rms = calculateRMS(dataArray);
    const audioLevel = rms;
    const confidence = Math.min(rms / vadConfig.threshold, 1.0);
    
    const isSpeechDetected = rms > vadConfig.threshold && confidence > vadConfig.confidenceThreshold;

    setVADState(prev => ({
      ...prev,
      audioLevel,
      confidence
    }));

    const now = Date.now();

    if (isSpeechDetected && !vadState.isUserSpeaking) {
      // Potential speech start
      if (speechStartTimeRef.current === 0) {
        speechStartTimeRef.current = now;
      } else if (now - speechStartTimeRef.current >= vadConfig.minSpeechDuration) {
        // Confirmed speech start
        setVADState(prev => ({ ...prev, isUserSpeaking: true }));
        onSpeechStart?.();
        speechStartTimeRef.current = 0;
      }
    } else if (!isSpeechDetected && vadState.isUserSpeaking) {
      // Potential speech end
      if (vadTimeoutRef.current) {
        clearTimeout(vadTimeoutRef.current);
      }
      
      vadTimeoutRef.current = setTimeout(() => {
        setVADState(prev => ({ ...prev, isUserSpeaking: false }));
        onSpeechEnd?.();
        speechStartTimeRef.current = 0;
      }, vadConfig.silenceDuration);
    } else if (!isSpeechDetected) {
      // Reset speech start timer if no speech detected
      speechStartTimeRef.current = 0;
    }

    isProcessingRef.current = false;

    if (vadState.isListening) {
      requestAnimationFrame(analyzeAudio);
    }
  }, [vadConfig, vadState.isUserSpeaking, vadState.isListening, calculateRMS, onSpeechStart, onSpeechEnd]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setVADState(prev => ({ ...prev, isListening: true }));
      analyzeAudio();
      
      return true;
    } catch (error) {
      console.error('Error starting voice activity detection:', error);
      return false;
    }
  }, [analyzeAudio]);

  const stopListening = useCallback(() => {
    if (vadTimeoutRef.current) {
      clearTimeout(vadTimeoutRef.current);
      vadTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    speechStartTimeRef.current = 0;

    setVADState({
      isUserSpeaking: false,
      confidence: 0,
      audioLevel: 0,
      isListening: false
    });
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
    isUserSpeaking: vadState.isUserSpeaking,
    confidence: vadState.confidence,
    audioLevel: vadState.audioLevel,
    isListening: vadState.isListening
  };
};