import { useState, useCallback, useRef, useEffect } from 'react';
import { useStreamingTTS } from './useStreamingTTS';
import { useAdvancedVoiceSTT } from './useAdvancedVoiceSTT';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeVoiceChatState {
  isActive: boolean;
  conversationState: 'idle' | 'listening' | 'processing' | 'speaking';
  currentLanguage: string;
  error: string | null;
}

interface UseRealtimeVoiceChatReturn {
  chatState: RealtimeVoiceChatState;
  toggleConversation: () => Promise<void>;
  interrupt: () => void;
  changeLanguage: (language: string) => void;
  sendTextMessage: (text: string) => Promise<void>;
}

export const useRealtimeVoiceChat = (
  userId?: string
): UseRealtimeVoiceChatReturn => {
  const { toast } = useToast();
  const {
    sttState,
    startListening,
    stopListening,
    clearTranscript,
    changeLanguage: changeSTTLanguage
  } = useAdvancedVoiceSTT();
  
  const {
    isStreaming,
    startStreamingResponse,
    stopStreaming,
    currentProvider
  } = useStreamingTTS();

  const [chatState, setChatState] = useState<RealtimeVoiceChatState>({
    isActive: false,
    conversationState: 'idle',
    currentLanguage: 'en',
    error: null
  });

  const isProcessingRef = useRef(false);
  const lastProcessedTextRef = useRef('');
  const conversationIdRef = useRef<string | null>(null);

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

  // Process AI response with streaming TTS
  const processAIResponse = useCallback(async (responseText: string, language: string) => {
    try {
      console.log('[RealtimeVoiceChat] Processing AI response:', responseText.slice(0, 50));
      
      setChatState(prev => ({ ...prev, conversationState: 'speaking' }));
      
      // Start streaming the response immediately
      await startStreamingResponse(responseText, language);
      
    } catch (error) {
      console.error('[RealtimeVoiceChat] Error processing AI response:', error);
      setChatState(prev => ({ 
        ...prev, 
        conversationState: 'idle',
        error: error instanceof Error ? error.message : 'Failed to process response'
      }));
    }
  }, [startStreamingResponse]);

  // Send message to AI and get streaming response
  const sendMessageToAI = useCallback(async (text: string, language: string) => {
    if (isProcessingRef.current) {
      console.log('[RealtimeVoiceChat] Already processing, skipping:', text);
      return;
    }

    // Prevent duplicate processing
    if (text.trim() === lastProcessedTextRef.current.trim()) {
      console.log('[RealtimeVoiceChat] Duplicate text, skipping:', text);
      return;
    }

    isProcessingRef.current = true;
    lastProcessedTextRef.current = text;

    try {
      setChatState(prev => ({ ...prev, conversationState: 'processing' }));

      console.log('[RealtimeVoiceChat] Sending to AI:', { text, language, userId });

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          question: text,
          user_id: userId,
          conversation_id: conversationIdRef.current,
          language: language
        }
      });

      if (error) {
        console.error('[RealtimeVoiceChat] AI error:', error);
        throw new Error(error.message || 'AI request failed');
      }

      console.log('[RealtimeVoiceChat] AI response received:', data);

      // Update conversation ID if received
      if (data.conversation_id) {
        conversationIdRef.current = data.conversation_id;
      }

      // Process the AI response with streaming TTS
      const responseText = data.answer || data.response;
      if (responseText) {
        await processAIResponse(responseText, language);
      }

    } catch (error) {
      console.error('[RealtimeVoiceChat] Error in AI processing:', error);
      setChatState(prev => ({ 
        ...prev, 
        conversationState: 'idle',
        error: error instanceof Error ? error.message : 'AI processing failed'
      }));
      
      toast({
        title: "Voice Chat Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      isProcessingRef.current = false;
    }
  }, [userId, processAIResponse, toast]);

  // Handle STT transcript changes
  useEffect(() => {
    const handleTranscript = async () => {
      // Only process final transcripts in live mode
      if (sttState.transcript && !sttState.isListening && chatState.isActive) {
        const transcript = sttState.transcript.trim();
        
        if (transcript && transcript.length > 2) {
          console.log('[RealtimeVoiceChat] Processing transcript:', transcript);
          
          // Detect language and send to AI
          const detectedLanguage = detectLanguage(transcript);
          await sendMessageToAI(transcript, detectedLanguage);
          
          // Clear transcript after processing
          setTimeout(() => {
            clearTranscript();
          }, 500);
        }
      }
    };

    handleTranscript();
  }, [sttState.transcript, sttState.isListening, chatState.isActive, sendMessageToAI, detectLanguage, clearTranscript]);

  // Update conversation state based on STT and TTS states
  useEffect(() => {
    if (!chatState.isActive) return;

    if (isStreaming) {
      setChatState(prev => ({ ...prev, conversationState: 'speaking' }));
    } else if (sttState.isListening) {
      setChatState(prev => ({ ...prev, conversationState: 'listening' }));
    } else if (sttState.isProcessing || isProcessingRef.current) {
      setChatState(prev => ({ ...prev, conversationState: 'processing' }));
    } else {
      setChatState(prev => ({ ...prev, conversationState: 'listening' }));
    }
  }, [chatState.isActive, isStreaming, sttState.isListening, sttState.isProcessing]);

  // Toggle conversation mode
  const toggleConversation = useCallback(async () => {
    if (chatState.isActive) {
      // Stop everything
      stopListening();
      stopStreaming();
      clearTranscript();
      
      setChatState(prev => ({
        ...prev,
        isActive: false,
        conversationState: 'idle',
        error: null
      }));
      
      // Reset processing state
      isProcessingRef.current = false;
      lastProcessedTextRef.current = '';
      
    } else {
      // Start conversation
      try {
        clearTranscript();
        await startListening(chatState.currentLanguage);
        
        setChatState(prev => ({
          ...prev,
          isActive: true,
          conversationState: 'listening',
          error: null
        }));
        
      } catch (error) {
        console.error('[RealtimeVoiceChat] Failed to start conversation:', error);
        setChatState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to start conversation'
        }));
        
        toast({
          title: "Voice Chat Error",
          description: "Failed to start voice conversation. Please check microphone permissions.",
          variant: "destructive"
        });
      }
    }
  }, [chatState.isActive, chatState.currentLanguage, startListening, stopListening, stopStreaming, clearTranscript, toast]);

  // Interrupt current speech and restart listening
  const interrupt = useCallback(() => {
    console.log('[RealtimeVoiceChat] Interrupting conversation');
    
    // Stop streaming TTS immediately
    stopStreaming();
    
    // Reset processing state
    isProcessingRef.current = false;
    
    // Restart listening if conversation is active
    if (chatState.isActive) {
      setTimeout(async () => {
        try {
          clearTranscript();
          await startListening(chatState.currentLanguage);
        } catch (error) {
          console.error('[RealtimeVoiceChat] Failed to restart listening after interrupt:', error);
        }
      }, 100);
    }
  }, [stopStreaming, chatState.isActive, chatState.currentLanguage, clearTranscript, startListening]);

  // Change language
  const changeLanguage = useCallback((language: string) => {
    setChatState(prev => ({ ...prev, currentLanguage: language }));
    changeSTTLanguage(language);
    
    // Restart listening with new language if active
    if (chatState.isActive) {
      stopListening();
      setTimeout(() => {
        startListening(language);
      }, 100);
    }
  }, [chatState.isActive, changeSTTLanguage, stopListening, startListening]);

  // Send text message (for hybrid mode)
  const sendTextMessage = useCallback(async (text: string) => {
    const language = detectLanguage(text);
    await sendMessageToAI(text, language);
  }, [sendMessageToAI, detectLanguage]);

  // Auto-detect language from STT
  useEffect(() => {
    if (sttState.detectedLanguage && sttState.detectedLanguage !== chatState.currentLanguage) {
      setChatState(prev => ({ ...prev, currentLanguage: sttState.detectedLanguage }));
    }
  }, [sttState.detectedLanguage, chatState.currentLanguage]);

  return {
    chatState,
    toggleConversation,
    interrupt,
    changeLanguage,
    sendTextMessage
  };
};