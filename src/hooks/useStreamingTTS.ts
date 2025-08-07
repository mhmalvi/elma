import { useState, useCallback, useRef, useEffect } from 'react';
import { useAdvancedTTS } from './useAdvancedTTS';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StreamingTTSState {
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  currentProvider: 'elevenlabs' | 'browser' | null;
  streamProgress: number;
}

interface UseStreamingTTSReturn {
  streamState: StreamingTTSState;
  isStreaming: boolean;
  currentProvider: 'elevenlabs' | 'browser' | null;
  startStreamingResponse: (text: string, language?: string) => Promise<boolean>;
  stopStreaming: () => void;
  speakChunk: (chunk: string, language?: string) => Promise<boolean>;
}

export const useStreamingTTS = (): UseStreamingTTSReturn => {
  const { ttsState, speak, stopSpeaking } = useAdvancedTTS();
  const { toast } = useToast();
  
  const [streamState, setStreamState] = useState<StreamingTTSState>({
    isStreaming: false,
    isLoading: false,
    error: null,
    currentProvider: null,
    streamProgress: 0
  });

  const streamQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const currentLanguageRef = useRef('en');
  const streamTimeoutRef = useRef<NodeJS.Timeout>();

  // Language detection helper
  const detectLanguage = useCallback((text: string): string => {
    const arabicPattern = /[\u0600-\u06FF]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const urduPattern = /[\u0600-\u06FF].*[\u0627-\u06FF]/;
    
    if (arabicPattern.test(text)) return 'ar';
    if (bengaliPattern.test(text)) return 'bn';
    if (urduPattern.test(text)) return 'ur';
    
    return 'en';
  }, []);

  // Process streaming queue
  const processStreamQueue = useCallback(async () => {
    if (isPlayingRef.current || streamQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;
    const chunk = streamQueueRef.current.shift();
    
    if (chunk) {
      try {
        console.log('[StreamingTTS] Processing chunk:', chunk.slice(0, 50));
        
        // Use detected language for chunk
        const language = detectLanguage(chunk);
        currentLanguageRef.current = language;
        
        // Update provider info
        setStreamState(prev => ({
          ...prev,
          currentProvider: 'elevenlabs', // Try premium first
          isLoading: true
        }));

        const success = await speak(chunk, language, true);
        
        if (success) {
          setStreamState(prev => ({
            ...prev,
            currentProvider: 'elevenlabs',
            isLoading: false,
            streamProgress: prev.streamProgress + (100 / (streamQueueRef.current.length + 1))
          }));
        } else {
          // Fallback to browser TTS
          const browserSuccess = await speak(chunk, language, false);
          setStreamState(prev => ({
            ...prev,
            currentProvider: browserSuccess ? 'browser' : null,
            isLoading: false
          }));
        }

        // Wait for TTS to finish before processing next chunk
        const waitForTTSComplete = () => {
          return new Promise<void>((resolve) => {
            const checkTTS = () => {
              if (!ttsState.isSpeaking) {
                resolve();
              } else {
                setTimeout(checkTTS, 100);
              }
            };
            checkTTS();
          });
        };

        await waitForTTSComplete();

      } catch (error) {
        console.error('[StreamingTTS] Chunk processing failed:', error);
        setStreamState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Streaming failed',
          isLoading: false
        }));
      }
    }

    isPlayingRef.current = false;

    // Process next chunk if available
    if (streamQueueRef.current.length > 0) {
      setTimeout(() => processStreamQueue(), 250); // Small delay between chunks
    } else {
      // Stream complete
      setStreamState(prev => ({
        ...prev,
        isStreaming: false,
        streamProgress: 100,
        currentProvider: null
      }));
    }
  }, [speak, ttsState.isSpeaking, detectLanguage]);

  // Start streaming a complete response
  const startStreamingResponse = useCallback(async (
    text: string, 
    language: string = 'en'
  ): Promise<boolean> => {
    if (!text.trim()) return false;

    console.log('[StreamingTTS] Starting stream for text:', text.slice(0, 100));

    // Stop any existing stream
    stopStreaming();

    // Detect language if not provided
    const detectedLanguage = language || detectLanguage(text);
    currentLanguageRef.current = detectedLanguage;

    // Split text into chunks for streaming (sentence-based)
    const chunks = splitIntoStreamingChunks(text);
    
    if (chunks.length === 0) return false;

    // Initialize streaming state
    setStreamState({
      isStreaming: true,
      isLoading: false,
      error: null,
      currentProvider: null,
      streamProgress: 0
    });

    // Add chunks to queue
    streamQueueRef.current = chunks;
    console.log('[StreamingTTS] Created chunks:', chunks.length);

    // Start processing queue
    processStreamQueue();

    return true;
  }, [detectLanguage, processStreamQueue]);

  // Speak individual chunk (for real-time streaming)
  const speakChunk = useCallback(async (
    chunk: string, 
    language: string = 'en'
  ): Promise<boolean> => {
    if (!chunk.trim()) return false;

    const detectedLanguage = language || detectLanguage(chunk);
    
    // Add to streaming queue
    streamQueueRef.current.push(chunk);
    
    // Update state
    setStreamState(prev => ({
      ...prev,
      isStreaming: true,
      error: null
    }));

    // Process if not already processing
    if (!isPlayingRef.current) {
      processStreamQueue();
    }

    return true;
  }, [detectLanguage, processStreamQueue]);

  // Stop all streaming
  const stopStreaming = useCallback(() => {
    console.log('[StreamingTTS] Stopping all streaming');
    
    // Clear queue and timeouts
    streamQueueRef.current = [];
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
    }
    
    // Stop current TTS
    stopSpeaking();
    
    // Reset state
    isPlayingRef.current = false;
    setStreamState({
      isStreaming: false,
      isLoading: false,
      error: null,
      currentProvider: null,
      streamProgress: 0
    });
  }, [stopSpeaking]);

  // Split text into streaming chunks
  const splitIntoStreamingChunks = (text: string): string[] => {
    // Split by sentences, preserving punctuation
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;
      
      // If adding this sentence would make chunk too long, save current chunk
      if (currentChunk && (currentChunk + ' ' + trimmedSentence).length > 150) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + trimmedSentence : trimmedSentence;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  };

  // Reset stream progress when TTS stops
  useEffect(() => {
    if (!ttsState.isSpeaking && streamState.streamProgress === 100) {
      const timeout = setTimeout(() => {
        setStreamState(prev => ({ ...prev, streamProgress: 0 }));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [ttsState.isSpeaking, streamState.streamProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    streamState,
    isStreaming: streamState.isStreaming || ttsState.isSpeaking,
    currentProvider: streamState.currentProvider,
    startStreamingResponse,
    stopStreaming,
    speakChunk
  };
};