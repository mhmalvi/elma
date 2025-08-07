import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AudioManagerState {
  isInitialized: boolean;
  audioContext: AudioContext | null;
  currentlyPlaying: 'none' | 'tts' | 'system';
  volume: number;
  isMuted: boolean;
  error: string | null;
}

export interface UseUnifiedAudioManagerReturn {
  audioState: AudioManagerState;
  initialize: () => Promise<void>;
  playAudio: (audio: HTMLAudioElement, type: 'tts' | 'system') => Promise<void>;
  stopAudio: () => void;
  stopAll: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  getAudioContext: () => AudioContext | null;
}

export const useUnifiedAudioManager = (): UseUnifiedAudioManagerReturn => {
  const { toast } = useToast();
  
  const [audioState, setAudioState] = useState<AudioManagerState>({
    isInitialized: false,
    audioContext: null,
    currentlyPlaying: 'none',
    volume: 1.0,
    isMuted: false,
    error: null
  });

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio system
  const initialize = useCallback(async () => {
    try {
      console.log('[UnifiedAudioManager] Initializing audio system');

      // Create audio context if not exists
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 44100,
          latencyHint: 'interactive'
        });
      }

      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create master gain node
      if (!gainNodeRef.current) {
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = audioState.volume;
      }

      setAudioState(prev => ({
        ...prev,
        isInitialized: true,
        audioContext: audioContextRef.current,
        error: null
      }));

      console.log('[UnifiedAudioManager] Audio system initialized successfully');

    } catch (error) {
      console.error('[UnifiedAudioManager] Failed to initialize audio:', error);
      
      setAudioState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize audio',
        isInitialized: false
      }));

      toast({
        title: "Audio Error",
        description: "Failed to initialize audio system. Some features may not work properly.",
        variant: "destructive",
      });
    }
  }, [audioState.volume, toast]);

  // Play audio with centralized management
  const playAudio = useCallback(async (audio: HTMLAudioElement, type: 'tts' | 'system'): Promise<void> => {
    try {
      console.log('[UnifiedAudioManager] Playing audio type:', type);

      // Stop any currently playing audio
      stopAudio();

      // Ensure audio context is initialized
      if (!audioState.isInitialized) {
        await initialize();
      }

      // Set up audio element
      audio.volume = audioState.isMuted ? 0 : audioState.volume;
      audio.preload = 'auto';

      // Create source and connect to gain node if possible
      if (audioContextRef.current && gainNodeRef.current) {
        try {
          const source = audioContextRef.current.createMediaElementSource(audio);
          source.connect(gainNodeRef.current);
        } catch (error) {
          // Source already connected or other audio context error
          console.warn('[UnifiedAudioManager] Audio context connection warning:', error);
        }
      }

      // Set up event handlers
      const handleEnded = () => {
        setAudioState(prev => ({ ...prev, currentlyPlaying: 'none' }));
        currentAudioRef.current = null;
      };

      const handleError = (error: Event) => {
        console.error('[UnifiedAudioManager] Audio playback error:', error);
        setAudioState(prev => ({ 
          ...prev, 
          currentlyPlaying: 'none',
          error: 'Audio playback failed'
        }));
        currentAudioRef.current = null;
      };

      audio.addEventListener('ended', handleEnded, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      // Start playback
      currentAudioRef.current = audio;
      setAudioState(prev => ({ ...prev, currentlyPlaying: type, error: null }));
      
      await audio.play();

      console.log('[UnifiedAudioManager] Audio playback started successfully');

    } catch (error) {
      console.error('[UnifiedAudioManager] Error playing audio:', error);
      
      setAudioState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Audio playback failed',
        currentlyPlaying: 'none'
      }));

      currentAudioRef.current = null;
      throw error;
    }
  }, [audioState.isInitialized, audioState.isMuted, audioState.volume, initialize]);

  // Stop current audio
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      console.log('[UnifiedAudioManager] Stopping current audio');
      
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
      
      setAudioState(prev => ({ ...prev, currentlyPlaying: 'none' }));
    }
  }, []);

  // Stop all audio and reset system
  const stopAll = useCallback(() => {
    console.log('[UnifiedAudioManager] Stopping all audio');
    
    // Stop current audio
    stopAudio();

    // Stop Web Speech API if active
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Reset state
    setAudioState(prev => ({ 
      ...prev, 
      currentlyPlaying: 'none',
      error: null 
    }));
  }, [stopAudio]);

  // Set volume
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    console.log('[UnifiedAudioManager] Setting volume to:', clampedVolume);
    
    setAudioState(prev => ({ ...prev, volume: clampedVolume }));

    // Update gain node
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume;
    }

    // Update current audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = audioState.isMuted ? 0 : clampedVolume;
    }
  }, [audioState.isMuted]);

  // Mute audio
  const mute = useCallback(() => {
    console.log('[UnifiedAudioManager] Muting audio');
    
    setAudioState(prev => ({ ...prev, isMuted: true }));

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = 0;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.volume = 0;
    }
  }, []);

  // Unmute audio
  const unmute = useCallback(() => {
    console.log('[UnifiedAudioManager] Unmuting audio');
    
    setAudioState(prev => ({ ...prev, isMuted: false }));

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = audioState.volume;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.volume = audioState.volume;
    }
  }, [audioState.volume]);

  // Get audio context
  const getAudioContext = useCallback(() => {
    return audioContextRef.current;
  }, []);

  // Auto-initialize on first use
  useEffect(() => {
    if (!audioState.isInitialized) {
      // Delay initialization to avoid permission issues
      const timer = setTimeout(() => {
        initialize();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [audioState.isInitialized, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAll]);

  return {
    audioState,
    initialize,
    playAudio,
    stopAudio,
    stopAll,
    setVolume,
    mute,
    unmute,
    getAudioContext
  };
};