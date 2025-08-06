import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceIntegration } from './useVoiceIntegration';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  source?: {
    verse?: string;
    hadith?: string;
    reference?: string;
  };
}

export const useVoiceChat = () => {
  const { toast } = useToast();
  const voiceIntegration = useVoiceIntegration();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  const initSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition",
        variant: "destructive"
      });
      return false;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionClass();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcriptText = result.transcript;
      setTranscript(transcriptText);
      
      if (result.isFinal) {
        handleUserMessage(transcriptText);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setTranscript('');
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access to use voice features",
          variant: "destructive"
        });
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    return true;
  }, [toast]);

  // Initialize text-to-speech
  const initTextToSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      return true;
    }
    return false;
  }, []);

  // Start voice recording with enhanced voice integration
  const startListening = useCallback(async () => {
    // Use enhanced voice integration for better accuracy
    await voiceIntegration.startRecording();
    setIsListening(true);
    setTranscript('');
  }, [voiceIntegration]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    voiceIntegration.stopRecording();
    setIsListening(false);
  }, [voiceIntegration]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop all speech synthesis
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  // Pause speech synthesis
  const pauseSpeaking = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  // Resume speech synthesis
  const resumeSpeaking = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  // Speak text using enhanced TTS
  const speakText = useCallback(async (text: string) => {
    setIsSpeaking(true);
    await voiceIntegration.speakText(text);
    setIsSpeaking(false);
  }, [voiceIntegration]);

  // Handle user message (voice or text)  
  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true
    };

    setMessages(prev => [...prev, userMessage]);
    setTranscript('');
    voiceIntegration.setTranscript('');
    setIsProcessing(true);

    try {
      // Call enhanced AI chat function with RAG
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { question: text.trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        source: {
          reference: data.islamicSourcesFound > 0 ? "Quran and Hadith" : "General Islamic Knowledge"
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Use enhanced TTS for response
      await speakText(data.response);

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again.",
        isUser: false,
        source: {
          reference: "System message"
        }
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection error",
        description: "Please check your internet connection and try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [speakText, toast, voiceIntegration]);

  // Send text message
  const sendTextMessage = useCallback((text: string) => {
    handleUserMessage(text);
  }, [handleUserMessage]);

  // Clear chat
  const clearMessages = useCallback(() => {
    setMessages([]);
    stopSpeaking();
  }, [stopSpeaking]);

  // Cleanup effect to stop all speech when component unmounts
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Effect to handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSpeaking();
        stopListening();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stopSpeaking, stopListening]);

  // Sync transcript from voice integration
  const currentTranscript = voiceIntegration.transcript || transcript;

  return {
    messages,
    isListening: isListening || voiceIntegration.isRecording,
    isProcessing: isProcessing || voiceIntegration.isProcessingVoice,
    transcript: currentTranscript,
    isSpeaking: isSpeaking || voiceIntegration.isPlayingAudio,
    isPaused,
    startListening,
    stopListening,
    sendTextMessage,
    speakText,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    clearMessages
  };
};