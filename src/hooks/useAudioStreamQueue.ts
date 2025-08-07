import { useRef, useCallback } from 'react';

interface AudioChunk {
  id: string;
  text: string;
  timestamp: number;
  isComplete: boolean;
}

interface AudioStreamQueueOptions {
  onChunkStart?: (chunk: AudioChunk) => void;
  onChunkComplete?: (chunk: AudioChunk) => void;
  onQueueEmpty?: () => void;
  onInterrupted?: () => void;
}

export const useAudioStreamQueue = (options: AudioStreamQueueOptions = {}) => {
  const queueRef = useRef<AudioChunk[]>([]);
  const currentChunkRef = useRef<AudioChunk | null>(null);
  const bufferRef = useRef<string>('');
  const isPlayingRef = useRef<boolean>(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const detectSentenceBoundary = useCallback((text: string): boolean => {
    // Detect complete sentences or meaningful chunks
    const sentenceEnders = /[.!?]\s+|[.!?]$/;
    const hasEnder = sentenceEnders.test(text);
    const isLongEnough = text.length > 50; // Minimum chunk size
    return hasEnder || isLongEnough;
  }, []);

  const createChunk = useCallback((text: string, isComplete: boolean = false): AudioChunk => {
    return {
      id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      timestamp: Date.now(),
      isComplete
    };
  }, []);

  const addToBuffer = useCallback((text: string) => {
    bufferRef.current += text;
    
    // Check if we have a complete sentence or meaningful chunk
    if (detectSentenceBoundary(bufferRef.current)) {
      const chunk = createChunk(bufferRef.current, true);
      queueRef.current.push(chunk);
      bufferRef.current = '';
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextChunk();
      }
    }
  }, [detectSentenceBoundary, createChunk]);

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.trim()) {
      const chunk = createChunk(bufferRef.current, true);
      queueRef.current.push(chunk);
      bufferRef.current = '';
      
      if (!isPlayingRef.current) {
        playNextChunk();
      }
    }
  }, [createChunk]);

  const playNextChunk = useCallback(async () => {
    if (queueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentChunkRef.current = null;
      options.onQueueEmpty?.();
      return;
    }

    const chunk = queueRef.current.shift()!;
    currentChunkRef.current = chunk;
    isPlayingRef.current = true;
    
    options.onChunkStart?.(chunk);

    try {
      // Use Web Speech API for immediate playback
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      speechSynthesisRef.current = utterance;
      
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        options.onChunkComplete?.(chunk);
        currentChunkRef.current = null;
        playNextChunk(); // Play next chunk immediately
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        currentChunkRef.current = null;
        playNextChunk(); // Continue with next chunk even on error
      };

      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error playing audio chunk:', error);
      currentChunkRef.current = null;
      playNextChunk(); // Continue with next chunk even on error
    }
  }, [options]);

  const interrupt = useCallback((graceful: boolean = true) => {
    if (graceful && speechSynthesisRef.current) {
      // Graceful interruption - finish current word
      speechSynthesis.cancel();
    } else {
      // Hard interruption
      speechSynthesis.cancel();
    }

    // Clear queue and buffer
    queueRef.current = [];
    bufferRef.current = '';
    currentChunkRef.current = null;
    isPlayingRef.current = false;
    speechSynthesisRef.current = null;
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    options.onInterrupted?.();
  }, [options]);

  const getQueueStatus = useCallback(() => {
    return {
      isPlaying: isPlayingRef.current,
      currentChunk: currentChunkRef.current,
      queueLength: queueRef.current.length,
      bufferContent: bufferRef.current,
      hasContent: queueRef.current.length > 0 || bufferRef.current.length > 0
    };
  }, []);

  return {
    addToBuffer,
    flushBuffer,
    interrupt,
    getQueueStatus,
    isPlaying: isPlayingRef.current
  };
};