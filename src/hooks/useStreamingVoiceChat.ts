import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioStreamQueue } from './useAudioStreamQueue';
import { useVoiceActivityDetection } from './useVoiceActivityDetection';
import { useConversationStateMachine } from './useConversationStateMachine';
import { useAdvancedVoiceSTT } from './useAdvancedVoiceSTT';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isProcessing?: boolean;
}

interface StreamingVoiceChatState {
  messages: Message[];
  isConnected: boolean;
  error: string | null;
  currentTranscript: string;
}

export const useStreamingVoiceChat = () => {
  const [chatState, setChatState] = useState<StreamingVoiceChatState>({
    messages: [],
    isConnected: false,
    error: null,
    currentTranscript: ''
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');

  // Initialize audio streaming queue
  const audioQueue = useAudioStreamQueue({
    onChunkStart: (chunk) => {
      console.log('TTS chunk started:', chunk.text.substring(0, 50));
    },
    onChunkComplete: (chunk) => {
      console.log('TTS chunk completed');
    },
    onQueueEmpty: () => {
      console.log('TTS queue empty - AI finished speaking');
      stateMachine.aiStopsResponding();
    },
    onInterrupted: () => {
      console.log('TTS interrupted by user speech');
    }
  });

  // Initialize conversation state machine
  const stateMachine = useConversationStateMachine((newState, prevState) => {
    console.log(`Conversation state: ${prevState} → ${newState}`);
    
    // Auto-start listening when entering listening state
    if (newState === 'listening' && prevState !== 'listening') {
      vadDetection.startListening();
      sttEngine.startListening?.();
    }
    
    // Stop listening when leaving listening state
    if (prevState === 'listening' && newState !== 'listening') {
      vadDetection.stopListening();
      sttEngine.stopListening?.();
    }
  });

  // Initialize voice activity detection
  const vadDetection = useVoiceActivityDetection(
    {
      threshold: 0.01,
      minSpeechDuration: 300,
      silenceDuration: 600,
      confidenceThreshold: 0.7
    },
    () => {
      console.log('VAD: User started speaking');
      stateMachine.userStartsSpeaking();
      
      // Interrupt TTS if AI is speaking
      if (stateMachine.state === 'speaking') {
        audioQueue.interrupt(true);
        stateMachine.interrupt();
      }
    },
    () => {
      console.log('VAD: User stopped speaking');
      stateMachine.userStopsSpeaking();
    }
  );

  // Initialize STT engine
  const sttEngine = useAdvancedVoiceSTT();

  // Handle transcript changes from STT
  useEffect(() => {
    if (sttEngine.sttState.transcript && sttEngine.sttState.transcript.trim()) {
      const transcript = sttEngine.sttState.transcript;
      console.log('Final transcript received:', transcript);
      handleUserMessage(transcript);
      sttEngine.clearTranscript();
    } else if (sttEngine.sttState.interimTranscript) {
      setChatState(prev => ({
        ...prev,
        currentTranscript: sttEngine.sttState.interimTranscript
      }));
    }
  }, [sttEngine.sttState.transcript, sttEngine.sttState.interimTranscript]);

  // Handle STT errors
  useEffect(() => {
    if (sttEngine.sttState.error) {
      console.error('STT Error:', sttEngine.sttState.error);
      setChatState(prev => ({ ...prev, error: sttEngine.sttState.error }));
    }
  }, [sttEngine.sttState.error]);

  const handleUserMessage = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text: transcript,
      isUser: true,
      timestamp: new Date()
    };

    // Add processing message placeholder
    const aiMessageId = `ai_${Date.now()}`;
    const processingMessage: Message = {
      id: aiMessageId,
      text: '',
      isUser: false,
      timestamp: new Date(),
      isProcessing: true
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, processingMessage]
    }));

    currentMessageIdRef.current = aiMessageId;
    streamingMessageRef.current = '';
    
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      stateMachine.aiStartsResponding();

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          message: transcript,
          stream: true
        }
      });

      if (error) throw error;

      // Process streaming response
      if (data?.response) {
        await processStreamingResponse(data.response, aiMessageId);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        setChatState(prev => ({
          ...prev,
          error: error.message,
          messages: prev.messages.filter(m => m.id !== aiMessageId)
        }));
      }
    }
  }, [stateMachine, audioQueue]);

  const processStreamingResponse = useCallback(async (response: string, messageId: string) => {
    const chunks = response.split(' ');
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] + ' ';
      streamingMessageRef.current += chunk;
      
      // Update message in state
      setChatState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: streamingMessageRef.current, isProcessing: false }
            : msg
        )
      }));

      // Add to audio queue for TTS
      audioQueue.addToBuffer(chunk);
      
      // Small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Flush any remaining audio buffer
    audioQueue.flushBuffer();
    
    console.log('AI response complete:', streamingMessageRef.current);
  }, [audioQueue]);

  const toggleVoiceMode = useCallback(() => {
    stateMachine.toggleVoiceMode();
  }, [stateMachine]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (stateMachine.isVoiceMode) {
      stateMachine.toggleVoiceMode(); // Switch out of voice mode for text input
    }
    await handleUserMessage(text);
  }, [stateMachine, handleUserMessage]);

  const interruptAI = useCallback(() => {
    audioQueue.interrupt(true);
    stateMachine.interrupt();
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [audioQueue, stateMachine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      vadDetection.stopListening();
      sttEngine.stopListening?.();
      audioQueue.interrupt(false);
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [vadDetection, sttEngine, audioQueue]);

  return {
    // State
    state: stateMachine.state,
    isVoiceMode: stateMachine.isVoiceMode,
    messages: chatState.messages,
    currentTranscript: chatState.currentTranscript,
    error: chatState.error,
    isUserSpeaking: vadDetection.isUserSpeaking,
    audioLevel: vadDetection.audioLevel,
    confidence: vadDetection.confidence,
    
    // Actions
    toggleVoiceMode,
    sendTextMessage,
    interruptAI,
    
    // Status
    isListening: stateMachine.state === 'listening',
    isProcessing: stateMachine.state === 'processing',
    isSpeaking: stateMachine.state === 'speaking',
    isInterrupted: stateMachine.state === 'interrupted'
  };
};