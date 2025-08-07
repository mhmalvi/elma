import { useState, useCallback, useRef, useEffect } from 'react';
import { useAdvancedTTS } from './useAdvancedTTS';
import { useToast } from '@/components/ui/use-toast';

interface StreamingChunk {
  id: string;
  text: string;
  language: string;
  priority: 'normal' | 'high';
  timestamp: number;
}

interface RealtimeStreamingState {
  isStreaming: boolean;
  isLoading: boolean;
  queueLength: number;
  currentChunk: string | null;
  streamProgress: number;
  provider: 'elevenlabs' | 'browser' | null;
  error: string | null;
  totalChunks: number;
  processedChunks: number;
}

interface UseRealtimeStreamingTTSReturn {
  streamingState: RealtimeStreamingState;
  isStreaming: boolean;
  provider: 'elevenlabs' | 'browser' | null;
  startStreaming: (text: string, language?: string) => Promise<boolean>;
  addToQueue: (text: string, language?: string, priority?: 'normal' | 'high') => void;
  stopStreaming: () => void;
  clearQueue: () => void;
  pauseStreaming: () => void;
  resumeStreaming: () => void;
}

export const useRealtimeStreamingTTS = (): UseRealtimeStreamingTTSReturn => {
  const { ttsState, speak, stopSpeaking } = useAdvancedTTS();
  const { toast } = useToast();
  
  const [streamingState, setStreamingState] = useState<RealtimeStreamingState>({
    isStreaming: false,
    isLoading: false,
    queueLength: 0,
    currentChunk: null,
    streamProgress: 0,
    provider: null,
    error: null,
    totalChunks: 0,
    processedChunks: 0
  });

  const chunkQueueRef = useRef<StreamingChunk[]>([]);
  const isProcessingRef = useRef(false);
  const isPausedRef = useRef(false);
  const currentChunkIdRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout>();

  // Enhanced language detection
  const detectLanguage = useCallback((text: string): string => {
    const patterns = {
      ar: /[\u0600-\u06FF]/,
      bn: /[\u0980-\u09FF]/,
      ur: /[\u0600-\u06FF].*[\u0627-\u06FF]/,
      hi: /[\u0900-\u097F]/,
      tr: /[çğıöşüÇĞIİÖŞÜ]/,
      fr: /[àâäéèêëïîôöùûüÿç]/,
      de: /[äöüßÄÖÜ]/
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return lang;
    }
    
    return 'en';
  }, []);

  // Intelligent text chunking with natural breaks
  const createStreamingChunks = useCallback((text: string, language: string): StreamingChunk[] => {
    // First split by sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: StreamingChunk[] = [];
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      
      // If adding this sentence would make chunk too long, finalize current chunk
      if (currentChunk && (currentChunk + ' ' + trimmed).length > 120) {
        chunks.push({
          id: `chunk_${Date.now()}_${chunkIndex++}`,
          text: currentChunk.trim(),
          language,
          priority: 'normal',
          timestamp: Date.now()
        });
        currentChunk = trimmed;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${Date.now()}_${chunkIndex}`,
        text: currentChunk.trim(),
        language,
        priority: 'normal',
        timestamp: Date.now()
      });
    }
    
    return chunks.filter(chunk => chunk.text.length > 0);
  }, []);

  // Process chunk queue with smart provider selection
  const processChunkQueue = useCallback(async () => {
    if (isProcessingRef.current || isPausedRef.current || chunkQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    
    // Sort queue by priority and timestamp
    chunkQueueRef.current.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return a.timestamp - b.timestamp;
    });

    const chunk = chunkQueueRef.current.shift();
    if (!chunk) {
      isProcessingRef.current = false;
      return;
    }

    console.log('[RealtimeStreamingTTS] Processing chunk:', chunk.text.slice(0, 30));
    currentChunkIdRef.current = chunk.id;

    try {
      setStreamingState(prev => ({
        ...prev,
        currentChunk: chunk.text,
        isLoading: true,
        queueLength: chunkQueueRef.current.length
      }));

      // Always try premium TTS first (ElevenLabs)
      const success = await speak(chunk.text, chunk.language, true);
      
      const provider = success ? 'elevenlabs' : 'browser';
      
      if (!success) {
        // Fallback to browser TTS
        await speak(chunk.text, chunk.language, false);
      }

      setStreamingState(prev => ({
        ...prev,
        provider,
        isLoading: false,
        processedChunks: prev.processedChunks + 1,
        streamProgress: prev.totalChunks > 0 ? Math.round((prev.processedChunks + 1) / prev.totalChunks * 100) : 0
      }));

      // Wait for TTS to complete before processing next chunk
      await new Promise<void>((resolve) => {
        const checkCompletion = () => {
          if (!ttsState.isSpeaking || isPausedRef.current) {
            resolve();
          } else {
            setTimeout(checkCompletion, 100);
          }
        };
        
        // Start checking after a small delay to ensure TTS starts
        setTimeout(checkCompletion, 250);
      });

    } catch (error) {
      console.error('[RealtimeStreamingTTS] Chunk error:', error);
      setStreamingState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Streaming failed',
        isLoading: false
      }));
    }

    currentChunkIdRef.current = null;
    isProcessingRef.current = false;

    // Process next chunk
    if (chunkQueueRef.current.length > 0 && !isPausedRef.current) {
      // Small delay between chunks for natural flow
      processingTimeoutRef.current = setTimeout(() => {
        processChunkQueue();
      }, 150);
    } else if (chunkQueueRef.current.length === 0) {
      // Streaming complete
      console.log('[RealtimeStreamingTTS] Streaming complete');
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        currentChunk: null,
        streamProgress: 100
      }));
      
      // Reset progress after completion
      setTimeout(() => {
        setStreamingState(prev => ({
          ...prev,
          streamProgress: 0,
          processedChunks: 0,
          totalChunks: 0,
          provider: null
        }));
      }, 1000);
    }
  }, [speak, ttsState.isSpeaking]);

  // Start streaming a complete response
  const startStreaming = useCallback(async (
    text: string, 
    language: string = 'en'
  ): Promise<boolean> => {
    if (!text.trim()) return false;

    console.log('[RealtimeStreamingTTS] Starting stream:', text.slice(0, 50));

    // Clear any existing stream
    stopStreaming();

    const detectedLanguage = language || detectLanguage(text);
    const chunks = createStreamingChunks(text, detectedLanguage);
    
    if (chunks.length === 0) return false;

    // Initialize streaming state
    setStreamingState(prev => ({
      ...prev,
      isStreaming: true,
      isLoading: false,
      queueLength: chunks.length,
      error: null,
      totalChunks: chunks.length,
      processedChunks: 0,
      streamProgress: 0
    }));

    // Add chunks to queue
    chunkQueueRef.current = chunks;
    isPausedRef.current = false;
    
    console.log('[RealtimeStreamingTTS] Created chunks:', chunks.length);

    // Start processing immediately
    processChunkQueue();

    return true;
  }, [detectLanguage, createStreamingChunks, processChunkQueue]);

  // Add individual chunk to queue (for real-time streaming)
  const addToQueue = useCallback((
    text: string, 
    language: string = 'en',
    priority: 'normal' | 'high' = 'normal'
  ) => {
    if (!text.trim()) return;

    const detectedLanguage = language || detectLanguage(text);
    const chunks = createStreamingChunks(text, detectedLanguage);
    
    chunks.forEach(chunk => {
      chunk.priority = priority;
    });

    chunkQueueRef.current.push(...chunks);
    
    setStreamingState(prev => ({
      ...prev,
      isStreaming: true,
      queueLength: chunkQueueRef.current.length,
      totalChunks: prev.totalChunks + chunks.length
    }));

    // Start processing if not already processing
    if (!isProcessingRef.current && !isPausedRef.current) {
      processChunkQueue();
    }
  }, [detectLanguage, createStreamingChunks, processChunkQueue]);

  // Stop all streaming
  const stopStreaming = useCallback(() => {
    console.log('[RealtimeStreamingTTS] Stopping all streaming');
    
    // Clear timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
    // Stop current TTS
    stopSpeaking();
    
    // Clear queue and reset state
    chunkQueueRef.current = [];
    isProcessingRef.current = false;
    isPausedRef.current = false;
    currentChunkIdRef.current = null;
    
    setStreamingState({
      isStreaming: false,
      isLoading: false,
      queueLength: 0,
      currentChunk: null,
      streamProgress: 0,
      provider: null,
      error: null,
      totalChunks: 0,
      processedChunks: 0
    });
  }, [stopSpeaking]);

  // Clear queue without stopping current playback
  const clearQueue = useCallback(() => {
    console.log('[RealtimeStreamingTTS] Clearing queue');
    chunkQueueRef.current = [];
    
    setStreamingState(prev => ({
      ...prev,
      queueLength: 0
    }));
  }, []);

  // Pause streaming
  const pauseStreaming = useCallback(() => {
    console.log('[RealtimeStreamingTTS] Pausing streaming');
    isPausedRef.current = true;
    stopSpeaking();
  }, [stopSpeaking]);

  // Resume streaming
  const resumeStreaming = useCallback(() => {
    console.log('[RealtimeStreamingTTS] Resuming streaming');
    isPausedRef.current = false;
    
    if (chunkQueueRef.current.length > 0 && !isProcessingRef.current) {
      processChunkQueue();
    }
  }, [processChunkQueue]);

  // Update streaming state based on TTS state
  useEffect(() => {
    setStreamingState(prev => ({
      ...prev,
      isStreaming: prev.isStreaming || ttsState.isSpeaking
    }));
  }, [ttsState.isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    streamingState,
    isStreaming: streamingState.isStreaming || ttsState.isSpeaking,
    provider: streamingState.provider,
    startStreaming,
    addToQueue,
    stopStreaming,
    clearQueue,
    pauseStreaming,
    resumeStreaming
  };
};