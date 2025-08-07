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

  // EMERGENCY SYSTEM STATE - Global audio system control
  const [systemState, setSystemState] = useState<'normal' | 'emergency_stop' | 'push_to_talk'>('normal');
  const [isSystemDisabled, setIsSystemDisabled] = useState(false);
  const systemLockRef = useRef(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');

  // Initialize audio streaming queue with EMERGENCY controls
  const audioQueue = useAudioStreamQueue({
    onChunkStart: (chunk) => {
      if (isSystemDisabled) return;
      console.log('TTS: Starting audio chunk');
      systemLockRef.current = true; // LOCK SYSTEM during TTS
      stateMachine.aiStartsResponding();
      // HARD STOP: Complete shutdown of input systems during TTS
      vadDetection.stopListening();
      sttEngine.stopListening?.();
    },
    onChunkComplete: (chunk) => {
      console.log('TTS: Chunk complete');
    },
    onQueueEmpty: () => {
      console.log('TTS: Queue empty - speech complete');
      systemLockRef.current = false; // UNLOCK SYSTEM
      stateMachine.aiStopsResponding();
      vadDetection.onTTSStop?.();
      
      // MANDATORY cooldown after TTS
      setTimeout(() => {
        if (stateMachine.isVoiceMode && !isSystemDisabled && systemState === 'normal') {
          console.log('TTS: Cooldown complete, resuming listening');
        }
      }, 2000);
    },
    onInterrupted: () => {
      console.log('TTS: EMERGENCY INTERRUPT');
      systemLockRef.current = false; // UNLOCK SYSTEM
      stateMachine.interrupt();
      vadDetection.onTTSStop?.();
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

  // EMERGENCY: Complete VAD shutdown during system lock
  const vadDetection = useVoiceActivityDetection(
    {
      threshold: 0.4,
      minSpeechDuration: 800,
      silenceDuration: 2000,
      confidenceThreshold: 0.85
    },
    () => {
      // HARD BLOCK: No VAD activity during system lock or when disabled
      if (isSystemDisabled || systemLockRef.current || audioQueue.isPlaying) {
        console.log('VAD: BLOCKED - system locked or disabled');
        return;
      }
      
      if (systemState === 'push_to_talk') {
        console.log('VAD: BLOCKED - push-to-talk mode active');
        return;
      }

      if (stateMachine.state === 'listening') {
        console.log('VAD: User speech detected (system unlocked)');
        stateMachine.userStartsSpeaking();
      }
    },
    () => {
      if (!isSystemDisabled && !systemLockRef.current && stateMachine.state === 'listening') {
        stateMachine.userStopsSpeaking();
      }
    },
    isSystemDisabled || systemLockRef.current || audioQueue.isPlaying
  );

  // Initialize STT engine with EMERGENCY controls
  const sttEngine = useAdvancedVoiceSTT();

  // Handle transcript changes from STT with SYSTEM LOCK checks
  useEffect(() => {
    // HARD BLOCK: No STT processing during system lock
    if (isSystemDisabled || systemLockRef.current) {
      return;
    }

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
  }, [sttEngine.sttState.transcript, sttEngine.sttState.interimTranscript, isSystemDisabled]);

  // EMERGENCY SYSTEM CONTROLS (moved up to be available in useEffect)
  const emergencyStop = useCallback(() => {
    console.log('EMERGENCY STOP: Shutting down all audio systems');
    setIsSystemDisabled(true);
    systemLockRef.current = false;
    
    // Clean shutdown sequence
    setChatState(prev => ({
      ...prev,
      error: 'Voice mode disabled - Click Reset to restart'
    }));
  }, []);

  // Handle STT errors with EMERGENCY actions
  useEffect(() => {
    if (sttEngine.sttState.error) {
      console.error('STT Error:', sttEngine.sttState.error);
      setChatState(prev => ({ ...prev, error: sttEngine.sttState.error }));
      
      // Auto-disable system on repeated STT errors
      if (sttEngine.sttState.error.includes('continuous') || sttEngine.sttState.error.includes('loop')) {
        emergencyStop();
      }
    }
  }, [sttEngine.sttState.error, emergencyStop]);

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

  const enhancedEmergencyStop = useCallback(() => {
    emergencyStop();
    // Additional cleanup for enhanced emergency stop
    vadDetection.stopListening();
    sttEngine.stopListening?.();
    audioQueue.interrupt(true);
    stateMachine.reset();
  }, [emergencyStop, vadDetection, sttEngine, audioQueue, stateMachine]);

  const resetVoiceSystem = useCallback(() => {
    console.log('RESET: Restarting voice system');
    setIsSystemDisabled(false);
    systemLockRef.current = false;
    setSystemState('normal');
    
    setChatState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const switchToPushToTalk = useCallback(() => {
    console.log('SWITCHING: Push-to-talk mode');
    vadDetection.stopListening();
    setSystemState('push_to_talk');
    
    setChatState(prev => ({
      ...prev,
      error: null
    }));
  }, [vadDetection]);

  const recoverVoiceMode = useCallback(() => {
    if (isSystemDisabled) {
      console.log('Recovery blocked - use reset instead');
      return;
    }
    
    console.log('MANUAL VOICE MODE RECOVERY initiated');
    vadDetection.resetCircuitBreaker?.();
    systemLockRef.current = false;
    
    if (stateMachine.isVoiceMode && systemState === 'normal') {
      vadDetection.startListening();
      sttEngine.startListening?.();
    }
  }, [vadDetection, stateMachine, sttEngine, isSystemDisabled, systemState]);

  // Voice mode controls with EMERGENCY safeguards
  const toggleVoiceMode = useCallback(() => {
    if (isSystemDisabled) {
      console.log('Voice mode blocked - system disabled');
      return;
    }
    stateMachine.toggleVoiceMode();
  }, [stateMachine, isSystemDisabled]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (stateMachine.isVoiceMode) {
      stateMachine.toggleVoiceMode(); // Switch out of voice mode for text input
    }
    await handleUserMessage(text);
  }, [stateMachine, handleUserMessage]);

  const interruptAI = useCallback(() => {
    audioQueue.interrupt(true);
    stateMachine.interrupt();
    systemLockRef.current = false; // UNLOCK on interrupt
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [audioQueue, stateMachine]);

  return {
    // State
    state: stateMachine.state,
    isVoiceMode: stateMachine.isVoiceMode,
    messages: chatState.messages,
    currentTranscript: chatState.currentTranscript,
    error: chatState.error,
    systemState,
    isSystemDisabled,
    
    // Voice status
    isUserSpeaking: vadDetection.isUserSpeaking,
    audioLevel: vadDetection.audioLevel,
    confidence: vadDetection.confidence,
    isVADDisabled: vadDetection.isDisabled,
    
    // Actions
    toggleVoiceMode,
    sendTextMessage,
    interruptAI,
    recoverVoiceMode,
    
    // EMERGENCY CONTROLS
    emergencyStop: enhancedEmergencyStop,
    resetVoiceSystem,
    switchToPushToTalk,
    
    // Status
    isListening: stateMachine.state === 'listening',
    isProcessing: stateMachine.state === 'processing',
    isSpeaking: stateMachine.state === 'speaking',
    isInterrupted: stateMachine.state === 'interrupted'
  };
};