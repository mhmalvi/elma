import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TTSState {
  isSpeaking: boolean;
  isLoading: boolean;
  error: string | null;
  currentLanguage: string;
  voiceId: string;
  playbackProgress: number;
  duration: number;
}

export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: 'elevenlabs' | 'browser' | 'azure';
  premium: boolean;
}

export const PREMIUM_VOICES: TTSVoice[] = [
  // ElevenLabs Premium Voices
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', language: 'en', gender: 'female', provider: 'elevenlabs', premium: true },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', language: 'en', gender: 'male', provider: 'elevenlabs', premium: true },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', language: 'en', gender: 'female', provider: 'elevenlabs', premium: true },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', language: 'en', gender: 'female', provider: 'elevenlabs', premium: true },
  
  // Browser fallback voices
  { id: 'browser-en-us', name: 'Browser English', language: 'en', gender: 'neutral', provider: 'browser', premium: false },
  { id: 'browser-ar-sa', name: 'Browser Arabic', language: 'ar', gender: 'neutral', provider: 'browser', premium: false },
  { id: 'browser-bn-bd', name: 'Browser Bengali', language: 'bn', gender: 'neutral', provider: 'browser', premium: false },
  { id: 'browser-ur-pk', name: 'Browser Urdu', language: 'ur', gender: 'neutral', provider: 'browser', premium: false },
  { id: 'browser-hi-in', name: 'Browser Hindi', language: 'hi', gender: 'neutral', provider: 'browser', premium: false },
];

export const useAdvancedTTS = () => {
  const { toast } = useToast();
  
  const [ttsState, setTTSState] = useState<TTSState>({
    isSpeaking: false,
    isLoading: false,
    error: null,
    currentLanguage: 'en',
    voiceId: '9BWtsMINqrJLrRacOk9x', // Default to Aria
    playbackProgress: 0,
    duration: 0
  });

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get optimal voice for language
  const getOptimalVoice = useCallback((language: string, usePremium: boolean = true) => {
    const voices = PREMIUM_VOICES.filter(v => v.language === language);

    if (usePremium) {
      // Prefer a premium ElevenLabs voice for the requested language
      const premiumLanguageMatch = voices.find(v => v.premium && v.provider === 'elevenlabs');
      if (premiumLanguageMatch) return premiumLanguageMatch;

      // If no language-specific premium voice exists, fall back to a default ElevenLabs voice
      const anyPremium = PREMIUM_VOICES.find(v => v.premium && v.provider === 'elevenlabs');
      if (anyPremium) return anyPremium;
    }

    // Fallback to browser voice for the language, then any browser voice
    return voices.find(v => v.provider === 'browser') || PREMIUM_VOICES.find(v => v.provider === 'browser') || PREMIUM_VOICES[0];
  }, []);

  // Enhanced speech synthesis with ElevenLabs
  const speakWithElevenLabs = useCallback(async (text: string, voiceId: string, language: string) => {
    try {
      setTTSState(prev => ({ ...prev, isLoading: true, error: null }));

      // Optimize text for better TTS (limit length for premium voices)
      const optimizedText = text.slice(0, 500); // Reasonable limit for quality

      const requestPayload = {
        text: optimizedText,
        voice: voiceId,
        options: {
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.5,
            use_speaker_boost: true
          }
        }
      };

      console.log('[Advanced TTS] ElevenLabs request:', requestPayload);

      const { data, error } = await supabase.functions.invoke('text-to-voice', {
        body: requestPayload
      });

      if (error) {
        console.error('[Advanced TTS] ElevenLabs error:', error);
        throw error;
      }

      console.log('[Advanced TTS] ElevenLabs response received');

      // Create and play audio
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      currentAudioRef.current = audio;

      // Set up progress tracking
      audio.onloadedmetadata = () => {
        setTTSState(prev => ({ 
          ...prev, 
          duration: audio.duration,
          isLoading: false,
          isSpeaking: true 
        }));

        // Start progress tracking
        progressIntervalRef.current = setInterval(() => {
          if (audio.currentTime && audio.duration) {
            setTTSState(prev => ({
              ...prev,
              playbackProgress: (audio.currentTime / audio.duration) * 100
            }));
          }
        }, 100);
      };

      audio.onended = () => {
        setTTSState(prev => ({
          ...prev,
          isSpeaking: false,
          playbackProgress: 0
        }));
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setTTSState(prev => ({
          ...prev,
          isSpeaking: false,
          isLoading: false,
          error: 'Audio playback failed'
        }));
        
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        
        throw new Error('Audio playback failed');
      };

      await audio.play();
      return true;

    } catch (error) {
      console.error('[Advanced TTS] ElevenLabs failed:', error);
      setTTSState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'TTS failed'
      }));
      return false;
    }
  }, []);

  // Browser speech synthesis fallback
  const speakWithBrowser = useCallback(async (text: string, language: string) => {
    try {
      if (!('speechSynthesis' in window)) {
        throw new Error('Speech synthesis not supported');
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      setTTSState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isSpeaking: true,
        error: null 
      }));

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Try to find the best voice for the language
      const voices = window.speechSynthesis.getVoices();
      const languageMap = {
        'en': 'en-US',
        'ar': 'ar-SA',
        'bn': 'bn-BD',
        'ur': 'ur-PK',
        'hi': 'hi-IN',
        'tr': 'tr-TR',
        'fr': 'fr-FR',
        'de': 'de-DE'
      };

      const targetLang = languageMap[language as keyof typeof languageMap] || 'en-US';
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith(targetLang) || 
        voice.name.includes('Google') ||
        voice.name.includes('Microsoft')
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      } else {
        utterance.lang = targetLang;
      }

      utterance.onstart = () => {
        setTTSState(prev => ({ ...prev, isSpeaking: true }));
      };

      utterance.onend = () => {
        setTTSState(prev => ({ 
          ...prev, 
          isSpeaking: false,
          playbackProgress: 0 
        }));
      };

      utterance.onerror = (error) => {
        console.error('[Advanced TTS] Browser speech error:', error);
        setTTSState(prev => ({
          ...prev,
          isSpeaking: false,
          error: 'Browser speech synthesis failed'
        }));
      };

      window.speechSynthesis.speak(utterance);
      return true;

    } catch (error) {
      console.error('[Advanced TTS] Browser speech failed:', error);
      setTTSState(prev => ({
        ...prev,
        isSpeaking: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Browser TTS failed'
      }));
      return false;
    }
  }, []);

  // Main speak function with intelligent fallback
  const speak = useCallback(async (
    text: string, 
    language: string = 'en', 
    usePremium: boolean = true
  ) => {
    if (!text.trim()) return false;

    // Stop any current speech
    stopSpeaking();

    try {
      setTTSState(prev => ({
        ...prev,
        currentLanguage: language,
        error: null
      }));

      const optimalVoice = getOptimalVoice(language, usePremium);
      
      // Try premium ElevenLabs first if requested and available
      if (usePremium && optimalVoice.premium && optimalVoice.provider === 'elevenlabs') {
        const success = await speakWithElevenLabs(text, optimalVoice.id, language);
        if (success) {
          setTTSState(prev => ({ ...prev, voiceId: optimalVoice.id }));
          return true;
        }
      }

      // Fallback to browser speech synthesis
      console.log('[Advanced TTS] Using browser speech synthesis fallback');
      return await speakWithBrowser(text, language);

    } catch (error) {
      console.error('[Advanced TTS] All TTS methods failed:', error);
      
      toast({
        title: "Speech Error",
        description: "Unable to play audio. Please check your connection.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [getOptimalVoice, speakWithElevenLabs, speakWithBrowser, toast]);

  // Stop all speech
  const stopSpeaking = useCallback(() => {
    console.log('[Advanced TTS] Stopping all speech');

    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Stop audio element
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    // Stop browser speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setTTSState(prev => ({
      ...prev,
      isSpeaking: false,
      isLoading: false,
      playbackProgress: 0
    }));
  }, []);

  // Pause/resume functionality
  const pauseResume = useCallback(() => {
    if (currentAudioRef.current) {
      if (currentAudioRef.current.paused) {
        currentAudioRef.current.play();
        setTTSState(prev => ({ ...prev, isSpeaking: true }));
      } else {
        currentAudioRef.current.pause();
        setTTSState(prev => ({ ...prev, isSpeaking: false }));
      }
    }
  }, []);

  // Change voice
  const changeVoice = useCallback((voiceId: string) => {
    setTTSState(prev => ({ ...prev, voiceId }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  return {
    ttsState,
    speak,
    stopSpeaking,
    pauseResume,
    changeVoice,
    availableVoices: PREMIUM_VOICES
  };
};