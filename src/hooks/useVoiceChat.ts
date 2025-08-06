import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  // Start voice recording
  const startListening = useCallback(() => {
    if (!recognitionRef.current && !initSpeechRecognition()) {
      return;
    }

    try {
      setIsListening(true);
      setTranscript('');
      recognitionRef.current?.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, [initSpeechRecognition]);

  // Stop voice recording
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  // Speak text using TTS
  const speakText = useCallback((text: string) => {
    if (!synthRef.current && !initTextToSpeech()) {
      return;
    }

    // Cancel any ongoing speech
    synthRef.current?.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to use a natural voice
    const voices = synthRef.current?.getVoices() || [];
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang.startsWith('en')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synthRef.current?.speak(utterance);
  }, [initTextToSpeech]);

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
    setIsProcessing(true);

    try {
      // Call Supabase Edge Function
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
          reference: "Quran and Hadith"
        }
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the AI response
      speakText(data.response);

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
  }, [speakText, toast]);

  // Send text message
  const sendTextMessage = useCallback((text: string) => {
    handleUserMessage(text);
  }, [handleUserMessage]);

  // Clear chat
  const clearMessages = useCallback(() => {
    setMessages([]);
    synthRef.current?.cancel();
  }, []);

  return {
    messages,
    isListening,
    isProcessing,
    transcript,
    startListening,
    stopListening,
    sendTextMessage,
    speakText,
    clearMessages
  };
};