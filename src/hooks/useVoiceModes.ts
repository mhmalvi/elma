import { useState, useCallback, useRef } from 'react';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';

interface UseVoiceModesReturn {
  handleDictationComplete: (text: string) => void;
  handleLiveTranscriptStream: (text: string, isFinal: boolean) => void;
  handleLiveInterrupt: () => void;
  currentTranscript: string;
  isProcessingVoice: boolean;
  conversationState: 'idle' | 'listening' | 'processing' | 'speaking';
}

export const useVoiceModes = (onSendMessage: (text: string) => void): UseVoiceModesReturn => {
  const { currentMode } = useVoiceMode();
  const { isProcessingVoice, speakText, stopAudio } = useVoiceIntegration();
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [conversationState, setConversationState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  
  const streamBufferRef = useRef('');
  const streamTimeoutRef = useRef<NodeJS.Timeout>();
  const lastProcessedTextRef = useRef('');
  const isProcessingMessageRef = useRef(false);

  const handleDictationComplete = useCallback((text: string) => {
    console.log('[VoiceModes] Dictation complete:', text);
    if (text.trim() && !isProcessingMessageRef.current) {
      setCurrentTranscript(text);
      isProcessingMessageRef.current = true;
      setConversationState('processing');
      
      onSendMessage(text);
      
      setTimeout(() => {
        setCurrentTranscript('');
        isProcessingMessageRef.current = false;
        setConversationState('idle');
      }, 500);
    }
  }, [onSendMessage]);

  const handleLiveTranscriptStream = useCallback((text: string, isFinal: boolean) => {
    console.log('[VoiceModes] Live transcript stream:', { text, isFinal, isProcessing: isProcessingMessageRef.current });
    
    // Prevent processing if we're already handling a message
    if (isProcessingMessageRef.current) {
      console.log('[VoiceModes] Skipping - already processing a message');
      return;
    }

    // Check for duplicate content to prevent loops
    if (text.trim() === lastProcessedTextRef.current.trim()) {
      console.log('[VoiceModes] Skipping duplicate text:', text);
      return;
    }
    
    if (isFinal) {
      // Clear any pending stream timeout
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      
      // Send the final transcript only if it's new and meaningful
      if (text.trim() && text.trim().length > 2) {
        console.log('[VoiceModes] Processing final transcript:', text);
        setCurrentTranscript(text);
        lastProcessedTextRef.current = text;
        isProcessingMessageRef.current = true;
        setConversationState('processing');
        
        onSendMessage(text);
        
        // Reset state after processing
        setTimeout(() => {
          setCurrentTranscript('');
          streamBufferRef.current = '';
          isProcessingMessageRef.current = false;
          setConversationState('listening');
        }, 1000);
      }
    } else {
      // Update the current transcript display for interim results
      setCurrentTranscript(text);
      streamBufferRef.current = text;
      setConversationState('listening');
      
      // Clear any existing timeout
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      
      // Set a longer timeout for live mode to avoid premature sending
      streamTimeoutRef.current = setTimeout(() => {
        if (streamBufferRef.current.trim() && 
            streamBufferRef.current.trim().length > 3 && 
            !isProcessingMessageRef.current &&
            streamBufferRef.current.trim() !== lastProcessedTextRef.current.trim()) {
          
          console.log('[VoiceModes] Stream timeout - sending buffered text:', streamBufferRef.current);
          lastProcessedTextRef.current = streamBufferRef.current;
          isProcessingMessageRef.current = true;
          setConversationState('processing');
          
          onSendMessage(streamBufferRef.current);
          
          setTimeout(() => {
            setCurrentTranscript('');
            streamBufferRef.current = '';
            isProcessingMessageRef.current = false;
            setConversationState('listening');
          }, 1000);
        }
      }, 4000); // Increased timeout to prevent premature sending
    }
  }, [onSendMessage]);

  const handleLiveInterrupt = useCallback(() => {
    console.log('[VoiceModes] Live conversation interrupted');
    
    // Stop all audio immediately
    stopAudio();
    
    // Clear all pending processing
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
    }
    
    // Reset all state
    setCurrentTranscript('');
    streamBufferRef.current = '';
    lastProcessedTextRef.current = '';
    isProcessingMessageRef.current = false;
    setConversationState('idle');
  }, [stopAudio]);

  return {
    handleDictationComplete,
    handleLiveTranscriptStream,
    handleLiveInterrupt,
    currentTranscript,
    isProcessingVoice,
    conversationState,
  };
};