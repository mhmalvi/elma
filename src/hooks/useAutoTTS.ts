import { useCallback, useRef, useEffect } from 'react';
import { useAdvancedTTS } from './useAdvancedTTS';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useToast } from '@/components/ui/use-toast';

interface AutoTTSOptions {
  autoSpeak: boolean;
  language?: string;
  usePremium?: boolean;
  interruptible?: boolean;
}

interface UseAutoTTSReturn {
  autoSpeak: (text: string, options?: Partial<AutoTTSOptions>) => Promise<boolean>;
  stopAutoSpeak: () => void;
  isAutoSpeaking: boolean;
  currentProvider: 'elevenlabs' | 'browser' | null;
}

export const useAutoTTS = (): UseAutoTTSReturn => {
  const { ttsState, speak, stopSpeaking } = useAdvancedTTS();
  const { currentMode } = useVoiceMode();
  const { toast } = useToast();
  
  const currentProviderRef = useRef<'elevenlabs' | 'browser' | null>(null);
  const isAutoActiveRef = useRef(false);
  const lastTextRef = useRef<string>('');

  // Language detection helper
  const detectLanguage = useCallback((text: string): string => {
    // Simple language detection based on text patterns
    const arabicPattern = /[\u0600-\u06FF]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const urduPattern = /[\u0600-\u06FF].*[\u0627-\u06FF]/;
    
    if (arabicPattern.test(text)) return 'ar';
    if (bengaliPattern.test(text)) return 'bn';
    if (urduPattern.test(text)) return 'ur';
    
    return 'en'; // Default to English
  }, []);

  // Provider hierarchy: ElevenLabs > Browser TTS
  const getProviderHierarchy = useCallback((language: string, usePremium: boolean = true) => {
    const providers: Array<{ type: 'elevenlabs' | 'browser', priority: number }> = [];
    
    if (usePremium) {
      providers.push({ type: 'elevenlabs', priority: 1 });
    }
    providers.push({ type: 'browser', priority: 2 });
    
    return providers.sort((a, b) => a.priority - b.priority);
  }, []);

// Enhanced auto-speak with collision prevention and live mode optimization
  const autoSpeak = useCallback(async (
    text: string, 
    options: Partial<AutoTTSOptions> = {}
  ): Promise<boolean> => {
    const {
      autoSpeak: shouldAutoSpeak = true,
      language,
      usePremium = true,
      interruptible = true
    } = options;

    // Skip if auto-speak is disabled
    if (!shouldAutoSpeak) return false;

    // Skip empty text
    if (!text.trim()) return false;

    // For live mode, be more aggressive about preventing duplicates
    const normalizedText = text.trim().toLowerCase();
    const lastNormalized = lastTextRef.current.trim().toLowerCase();
    
    if (normalizedText === lastNormalized) {
      console.log('[AutoTTS] Skipping duplicate text:', text.slice(0, 30));
      return false;
    }

    // Store current text to prevent duplicates
    lastTextRef.current = text;

    try {
      console.log('[AutoTTS] Starting auto-speak:', { 
        text: text.slice(0, 50), 
        mode: currentMode,
        options 
      });

      // CRITICAL: Stop any existing TTS immediately to prevent collisions
      if (isAutoActiveRef.current || ttsState.isSpeaking) {
        console.log('[AutoTTS] Force stopping previous speech to prevent collision');
        stopSpeaking();
        
        // Longer pause for live mode to ensure clean audio transition
        const pauseTime = currentMode === 'live' ? 200 : 100;
        await new Promise(resolve => setTimeout(resolve, pauseTime));
      }

      isAutoActiveRef.current = true;

      // Detect language if not provided
      const detectedLanguage = language || detectLanguage(text);
      console.log('[AutoTTS] Using language:', detectedLanguage);

      // Enhanced provider hierarchy for live mode
      const providers = getProviderHierarchy(detectedLanguage, usePremium);
      let speechSuccess = false;

      // For live mode, prioritize speed and reliability
      if (currentMode === 'live') {
        providers.sort((a, b) => {
          // Prioritize ElevenLabs for quality, but ensure fallback is ready
          if (a.type === 'elevenlabs') return -1;
          if (b.type === 'elevenlabs') return 1;
          return a.priority - b.priority;
        });
      }

      for (const provider of providers) {
        try {
          console.log(`[AutoTTS] Attempting ${provider.type} provider for live mode`);
          currentProviderRef.current = provider.type;

          const success = await speak(text, detectedLanguage, provider.type === 'elevenlabs');
          
          if (success) {
            speechSuccess = true;
            console.log(`[AutoTTS] Success with ${provider.type} provider`);
            break;
          }
        } catch (error) {
          console.warn(`[AutoTTS] ${provider.type} provider failed:`, error);
          // Immediately try next provider for live mode
          continue;
        }
      }

      if (!speechSuccess) {
        console.error('[AutoTTS] All providers failed');
        currentProviderRef.current = null;
        isAutoActiveRef.current = false;
        
        // Minimal error feedback for live mode to maintain flow
        if (currentMode === 'live') {
          console.warn('[AutoTTS] Live mode: TTS failed, continuing conversation flow');
        } else if (currentMode) {
          toast({
            title: "Voice Playback Error",
            description: "Unable to play voice response. Text is still available.",
            variant: "destructive"
          });
        }
        
        return false;
      }

      return true;

    } catch (error) {
      console.error('[AutoTTS] Auto-speak failed:', error);
      currentProviderRef.current = null;
      isAutoActiveRef.current = false;
      return false;
    }
  }, [speak, stopSpeaking, detectLanguage, getProviderHierarchy, ttsState.isSpeaking, currentMode, toast]);

  // Stop auto-speak with cleanup
  const stopAutoSpeak = useCallback(() => {
    console.log('[AutoTTS] Stopping auto-speak');
    
    isAutoActiveRef.current = false;
    currentProviderRef.current = null;
    lastTextRef.current = '';
    
    stopSpeaking();
  }, [stopSpeaking]);

  // Reset state when TTS finishes
  useEffect(() => {
    if (!ttsState.isSpeaking && isAutoActiveRef.current) {
      console.log('[AutoTTS] Speech finished, resetting state');
      isAutoActiveRef.current = false;
      currentProviderRef.current = null;
    }
  }, [ttsState.isSpeaking]);

  // Cleanup on mode change
  useEffect(() => {
    if (!currentMode) {
      stopAutoSpeak();
    }
  }, [currentMode, stopAutoSpeak]);

  return {
    autoSpeak,
    stopAutoSpeak,
    isAutoSpeaking: isAutoActiveRef.current || ttsState.isSpeaking,
    currentProvider: currentProviderRef.current
  };
};