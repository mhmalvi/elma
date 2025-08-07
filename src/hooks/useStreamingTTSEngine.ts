import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedTTS } from '@/hooks/useAdvancedTTS';
import { useUnifiedAudioManager } from '@/hooks/useUnifiedAudioManager';

export interface StreamingTTSState {
  isStreaming: boolean;
  isLoading: boolean;
  currentChunk: number;
  totalChunks: number;
  streamProgress: number;
  currentProvider: 'elevenlabs' | 'browser' | null;
  error: string | null;
  queueLength: number;
}

export interface StreamingChunk {
  id: string;
  text: string;
  language: string;
  priority: number;
}

export interface UseStreamingTTSEngineReturn {
  streamingState: StreamingTTSState;
  startStreaming: (text: string, language?: string) => Promise<void>;
  addToStream: (text: string, language?: string) => void;
  stopStreaming: () => void;
  clearQueue: () => void;
  pauseStreaming: () => void;
  resumeStreaming: () => void;
  updateLanguage: (language: string) => void;
  isStreaming: boolean;
}

export const useStreamingTTSEngine = (): UseStreamingTTSEngineReturn => {
  const { toast } = useToast();
  const advancedTTS = useAdvancedTTS();
  const audioManager = useUnifiedAudioManager();
  
  const [streamingState, setStreamingState] = useState<StreamingTTSState>({
    isStreaming: false,
    isLoading: false,
    currentChunk: 0,
    totalChunks: 0,
    streamProgress: 0,
    currentProvider: null,
    error: null,
    queueLength: 0
  });

  // Streaming refs
  const chunkQueueRef = useRef<StreamingChunk[]>([]);
  const isProcessingRef = useRef(false);
  const isPausedRef = useRef(false);
  const currentLanguageRef = useRef('en');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Detect language from text
  const detectLanguage = useCallback((text: string): string => {
    const arabicPattern = /[\u0600-\u06FF]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const urduPattern = /[\u0600-\u06FF].*[\u0627-\u06FF]/;
    const hindiPattern = /[\u0900-\u097F]/;
    
    if (arabicPattern.test(text)) return urduPattern.test(text) ? 'ur' : 'ar';
    if (bengaliPattern.test(text)) return 'bn';
    if (hindiPattern.test(text)) return 'hi';
    return 'en';
  }, []);

  // Create streaming chunks from text
  const createStreamingChunks = useCallback((text: string, language: string): StreamingChunk[] => {
    console.log('[StreamingTTSEngine] Creating chunks for text:', text.slice(0, 100));
    
    // Smart sentence splitting
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(sentence => sentence.trim().length > 0);

    if (sentences.length === 0) return [];

    // Create chunks with optimal size for streaming
    const chunks: StreamingChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      // If adding this sentence would make chunk too long, process current chunk
      if (currentChunk.length > 0 && (currentChunk + sentence).length > 200) {
        chunks.push({
          id: `chunk_${chunkIndex}_${Date.now()}`,
          text: currentChunk.trim(),
          language,
          priority: chunkIndex
        });
        chunkIndex++;
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    // Add remaining chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${chunkIndex}_${Date.now()}`,
        text: currentChunk.trim(),
        language,
        priority: chunkIndex
      });
    }

    console.log('[StreamingTTSEngine] Created', chunks.length, 'chunks');
    return chunks;
  }, []);

  // Process chunk queue
  const processChunkQueue = useCallback(async () => {
    if (isProcessingRef.current || isPausedRef.current || chunkQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    try {
      while (chunkQueueRef.current.length > 0 && !isPausedRef.current) {
        const chunk = chunkQueueRef.current.shift();
        if (!chunk) break;

        console.log('[StreamingTTSEngine] Processing chunk:', chunk.text.slice(0, 50));

        setStreamingState(prev => ({
          ...prev,
          currentChunk: chunk.priority + 1,
          queueLength: chunkQueueRef.current.length,
          isLoading: true,
          error: null
        }));

        // Create abort controller for this chunk
        abortControllerRef.current = new AbortController();

        try {
          // Try ElevenLabs first
          const success = await advancedTTS.speak(
            chunk.text, 
            chunk.language, 
            true // usePremium
          );

          if (!success) {
            // Fallback to browser TTS
            console.log('[StreamingTTSEngine] ElevenLabs failed, using browser TTS');
            await advancedTTS.speak(chunk.text, chunk.language, false);
            
            setStreamingState(prev => ({
              ...prev,
              currentProvider: 'browser'
            }));
          } else {
            setStreamingState(prev => ({
              ...prev,
              currentProvider: 'elevenlabs'
            }));
          }

          // Wait for current speech to finish before processing next chunk
          await new Promise<void>((resolve) => {
            const checkFinished = () => {
              if (!advancedTTS.ttsState.isSpeaking || isPausedRef.current) {
                resolve();
              } else {
                setTimeout(checkFinished, 100);
              }
            };
            checkFinished();
          });

        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('[StreamingTTSEngine] Chunk processing aborted');
            break;
          }
          throw error;
        }

        // Update progress
        const totalProcessed = streamingState.totalChunks - chunkQueueRef.current.length;
        const progress = streamingState.totalChunks > 0 ? 
          (totalProcessed / streamingState.totalChunks) * 100 : 0;

        setStreamingState(prev => ({
          ...prev,
          streamProgress: progress,
          isLoading: false
        }));

        // Brief pause between chunks for natural flow
        if (chunkQueueRef.current.length > 0 && !isPausedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      // Streaming complete
      if (chunkQueueRef.current.length === 0) {
        console.log('[StreamingTTSEngine] Streaming complete');
        
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          isLoading: false,
          streamProgress: 100,
          currentChunk: 0,
          totalChunks: 0
        }));
      }

    } catch (error) {
      console.error('[StreamingTTSEngine] Error processing queue:', error);
      
      setStreamingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Streaming failed',
        isStreaming: false,
        isLoading: false
      }));

      toast({
        title: "TTS Error",
        description: "Failed to stream audio. Switching to fallback mode.",
        variant: "destructive",
      });
    } finally {
      isProcessingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [advancedTTS, streamingState.totalChunks, toast]);

  // Start streaming
  const startStreaming = useCallback(async (text: string, language: string = 'en') => {
    try {
      console.log('[StreamingTTSEngine] Starting streaming for:', text.slice(0, 100));

      // Stop any existing streaming
      stopStreaming();

      // Detect language if not provided
      const detectedLanguage = language || detectLanguage(text);
      currentLanguageRef.current = detectedLanguage;

      // Create chunks
      const chunks = createStreamingChunks(text, detectedLanguage);
      
      if (chunks.length === 0) {
        console.warn('[StreamingTTSEngine] No chunks created from text');
        return;
      }

      // Initialize streaming state
      chunkQueueRef.current = chunks;
      isPausedRef.current = false;

      setStreamingState(prev => ({
        ...prev,
        isStreaming: true,
        isLoading: true,
        currentChunk: 0,
        totalChunks: chunks.length,
        streamProgress: 0,
        queueLength: chunks.length,
        error: null
      }));

      // Start processing queue
      await processChunkQueue();

    } catch (error) {
      console.error('[StreamingTTSEngine] Error starting streaming:', error);
      
      setStreamingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start streaming',
        isStreaming: false
      }));
    }
  }, [detectLanguage, createStreamingChunks, processChunkQueue]);

  // Add text to existing stream
  const addToStream = useCallback((text: string, language?: string) => {
    const targetLanguage = language || currentLanguageRef.current;
    const newChunks = createStreamingChunks(text, targetLanguage);
    
    console.log('[StreamingTTSEngine] Adding', newChunks.length, 'chunks to stream');
    
    // Add with higher priority numbers
    const highestPriority = Math.max(0, ...chunkQueueRef.current.map(c => c.priority));
    const prioritizedChunks = newChunks.map((chunk, index) => ({
      ...chunk,
      priority: highestPriority + index + 1
    }));

    chunkQueueRef.current.push(...prioritizedChunks);

    setStreamingState(prev => ({
      ...prev,
      totalChunks: prev.totalChunks + newChunks.length,
      queueLength: chunkQueueRef.current.length
    }));

    // Resume processing if not already running
    if (!isProcessingRef.current && !isPausedRef.current) {
      processChunkQueue();
    }
  }, [currentLanguageRef, createStreamingChunks, processChunkQueue]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    console.log('[StreamingTTSEngine] Stopping streaming');
    
    // Abort current processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Stop TTS
    advancedTTS.stopSpeaking();
    
    // Clear queue and reset state
    chunkQueueRef.current = [];
    isProcessingRef.current = false;
    isPausedRef.current = false;

    setStreamingState(prev => ({
      ...prev,
      isStreaming: false,
      isLoading: false,
      currentChunk: 0,
      totalChunks: 0,
      streamProgress: 0,
      queueLength: 0,
      error: null
    }));
  }, [advancedTTS]);

  // Clear queue without stopping current chunk
  const clearQueue = useCallback(() => {
    console.log('[StreamingTTSEngine] Clearing queue');
    
    chunkQueueRef.current = [];
    
    setStreamingState(prev => ({
      ...prev,
      queueLength: 0,
      totalChunks: prev.currentChunk
    }));
  }, []);

  // Pause streaming
  const pauseStreaming = useCallback(() => {
    console.log('[StreamingTTSEngine] Pausing streaming');
    
    isPausedRef.current = true;
    advancedTTS.stopSpeaking();
    
    setStreamingState(prev => ({ ...prev, isLoading: false }));
  }, [advancedTTS]);

  // Resume streaming
  const resumeStreaming = useCallback(() => {
    console.log('[StreamingTTSEngine] Resuming streaming');
    
    isPausedRef.current = false;
    
    if (chunkQueueRef.current.length > 0) {
      processChunkQueue();
    }
  }, [processChunkQueue]);

  // Update language
  const updateLanguage = useCallback((language: string) => {
    console.log('[StreamingTTSEngine] Updating language to:', language);
    currentLanguageRef.current = language;
  }, []);

  // Monitor TTS state changes
  useEffect(() => {
    if (!advancedTTS.ttsState.isSpeaking && streamingState.isStreaming && !isProcessingRef.current) {
      // TTS finished, continue with next chunk if available
      if (chunkQueueRef.current.length > 0) {
        processChunkQueue();
      }
    }
  }, [advancedTTS.ttsState.isSpeaking, streamingState.isStreaming, processChunkQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    streamingState,
    startStreaming,
    addToStream,
    stopStreaming,
    clearQueue,
    pauseStreaming,
    resumeStreaming,
    updateLanguage,
    isStreaming: streamingState.isStreaming
  };
};