import { useState, useCallback, useRef } from 'react';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';

interface UseVoiceModesReturn {
  handleDictationComplete: (text: string) => void;
  handleLiveTranscriptStream: (text: string, isFinal: boolean) => void;
  handleLiveInterrupt: () => void;
  currentTranscript: string;
  isProcessingVoice: boolean;
}

export const useVoiceModes = (onSendMessage: (text: string) => void): UseVoiceModesReturn => {
  const { currentMode } = useVoiceMode();
  const { isProcessingVoice, speakText, stopAudio } = useVoiceIntegration();
  const [currentTranscript, setCurrentTranscript] = useState('');
  const streamBufferRef = useRef('');
  const streamTimeoutRef = useRef<NodeJS.Timeout>();

  const handleDictationComplete = useCallback((text: string) => {
    console.log('[VoiceModes] Dictation complete:', text);
    if (text.trim()) {
      setCurrentTranscript(text);
      onSendMessage(text);
      setCurrentTranscript('');
    }
  }, [onSendMessage]);

  const handleLiveTranscriptStream = useCallback((text: string, isFinal: boolean) => {
    console.log('[VoiceModes] Live transcript stream:', { text, isFinal });
    
    if (isFinal) {
      // Clear any pending stream timeout
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      
      // Send the final transcript
      if (text.trim()) {
        setCurrentTranscript(text);
        onSendMessage(text);
        setCurrentTranscript('');
        streamBufferRef.current = '';
      }
    } else {
      // Update the current transcript display
      setCurrentTranscript(text);
      streamBufferRef.current = text;
      
      // Set a timeout to send if no updates come
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      
      streamTimeoutRef.current = setTimeout(() => {
        if (streamBufferRef.current.trim()) {
          console.log('[VoiceModes] Stream timeout - sending buffered text');
          onSendMessage(streamBufferRef.current);
          setCurrentTranscript('');
          streamBufferRef.current = '';
        }
      }, 3000); // 3 second timeout for live mode
    }
  }, [onSendMessage]);

  const handleLiveInterrupt = useCallback(() => {
    console.log('[VoiceModes] Live conversation interrupted');
    stopAudio();
    
    // Clear any pending streams
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
    }
    setCurrentTranscript('');
    streamBufferRef.current = '';
  }, [stopAudio]);

  return {
    handleDictationComplete,
    handleLiveTranscriptStream,
    handleLiveInterrupt,
    currentTranscript,
    isProcessingVoice,
  };
};