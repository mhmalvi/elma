import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioStreamQueue } from './useAudioStreamQueue';
import { useVoiceActivityDetection } from './useVoiceActivityDetection';
import { useConversationStateMachine } from './useConversationStateMachine';
import { useAdvancedVoiceSTT } from './useAdvancedVoiceSTT';
import { useGlobalAudioManager } from './useGlobalAudioManager';
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

  // GLOBAL AUDIO MANAGER - Single source of truth for all audio operations
  const audioManager = useGlobalAudioManager();
  const [systemState, setSystemState] = useState<'normal' | 'emergency_stop' | 'push_to_talk'>('normal');

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingMessageRef = useRef<string>('');
  const currentMessageIdRef = useRef<string>('');

  // Initialize audio streaming queue with GLOBAL MANAGER controls
  const audioQueue = useAudioStreamQueue({
    onChunkStart: (chunk) => {
      // Request TTS operation from global manager
      audioManager.requestOperation('tts', 
        () => {
          console.log('TTS: Starting audio chunk (manager approved)');
          stateMachine.aiStartsResponding();
          // FORCE stop all input systems when TTS starts
          vadDetection.stopListening();
          sttEngine.stopListening?.();
        },
        () => {
          console.log('TTS: DENIED by audio manager');
        }
      );
    },
    onChunkComplete: (chunk) => {
      console.log('TTS: Chunk complete');
    },
    onQueueEmpty: () => {
      console.log('TTS: Queue empty - speech complete');
      audioManager.releaseOperation('tts');
      stateMachine.aiStopsResponding();
      vadDetection.onTTSStop?.();
      
      // MANDATORY cooldown after TTS
      setTimeout(() => {
        if (stateMachine.isVoiceMode && !audioManager.isSystemDisabled && systemState === 'normal') {
          console.log('TTS: Cooldown complete, can resume listening');
        }
      }, 2000);
    },
    onInterrupted: () => {
      console.log('TTS: EMERGENCY INTERRUPT');
      audioManager.releaseOperation('tts');
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

  // VAD with GLOBAL MANAGER integration
  const vadDetection = useVoiceActivityDetection(
    {
      threshold: 0.4,
      minSpeechDuration: 800,
      silenceDuration: 2000,
      confidenceThreshold: 0.85
    },
    () => {
      // Request VAD operation from global manager
      audioManager.requestOperation('vad',
        () => {
          if (systemState === 'push_to_talk') {
            console.log('VAD: BLOCKED - push-to-talk mode active');
            audioManager.releaseOperation('vad');
            return;
          }

          if (stateMachine.state === 'listening') {
            console.log('VAD: User speech detected (manager approved)');
            stateMachine.userStartsSpeaking();
          }
        },
        () => {
          console.log('VAD: BLOCKED by audio manager');
        }
      );
    },
    () => {
      if (audioManager.canStart('vad') && stateMachine.state === 'listening') {
        stateMachine.userStopsSpeaking();
      }
      audioManager.releaseOperation('vad');
    },
    audioManager.isSystemDisabled || audioManager.currentOperation === 'tts'
  );

  // Initialize STT engine with EMERGENCY controls
  const sttEngine = useAdvancedVoiceSTT();

  // Handle transcript changes from STT with GLOBAL MANAGER checks
  useEffect(() => {
    // HARD BLOCK: No STT processing when system is locked by manager
    if (audioManager.isSystemDisabled || audioManager.currentOperation === 'tts') {
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
  }, [sttEngine.sttState.transcript, sttEngine.sttState.interimTranscript, audioManager.isSystemDisabled]);

  // EMERGENCY SYSTEM CONTROLS using Global Audio Manager
  const emergencyStop = useCallback(() => {
    console.log('EMERGENCY STOP: Using Global Audio Manager');
    audioManager.emergencyStop();
    
    // Clean shutdown sequence
    setChatState(prev => ({
      ...prev,
      error: 'Voice mode disabled - Click Reset to restart'
    }));
  }, [audioManager]);

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
    if (stateMachine.state === 'processing' || stateMachine.state === 'speaking') {
      console.log('Guard: Preventing duplicate send while AI is processing/speaking');
      return;
    }

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
          question: transcript
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
  }, []);

  const enhancedEmergencyStop = useCallback(() => {
    emergencyStop();
    // Additional cleanup for enhanced emergency stop
    vadDetection.stopListening();
    sttEngine.stopListening?.();
    audioQueue.interrupt(true);
    stateMachine.reset();
  }, [emergencyStop, vadDetection, sttEngine, audioQueue, stateMachine]);

  const resetVoiceSystem = useCallback(async () => {
    console.log('RESET: Restarting voice system using Global Audio Manager');
    await audioManager.resetSystem();
    setSystemState('normal');
    
    setChatState(prev => ({
      ...prev,
      error: null
    }));
  }, [audioManager]);

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
    if (audioManager.isSystemDisabled) {
      console.log('Recovery blocked - use reset instead');
      return;
    }
    
    console.log('MANUAL VOICE MODE RECOVERY initiated');
    vadDetection.resetCircuitBreaker?.();
    
    if (stateMachine.isVoiceMode && systemState === 'normal' && audioManager.canStart('vad')) {
      vadDetection.startListening();
      sttEngine.startListening?.();
    }
  }, [vadDetection, stateMachine, sttEngine, audioManager, systemState]);

  // Voice mode controls with GLOBAL MANAGER safeguards
  const toggleVoiceMode = useCallback(() => {
    if (audioManager.isSystemDisabled) {
      console.log('Voice mode blocked - system disabled');
      return;
    }
    stateMachine.toggleVoiceMode();
  }, [stateMachine, audioManager]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (stateMachine.isVoiceMode) {
      stateMachine.toggleVoiceMode(); // Switch out of voice mode for text input
    }
    await handleUserMessage(text);
  }, [stateMachine, handleUserMessage]);

  const speakText = useCallback(async (text: string) => {
    if (!text?.trim()) return;
    // Interrupt any ongoing TTS before starting new playback
    audioQueue.interrupt(true);
    // Queue the provided text for TTS playback
    audioQueue.addToBuffer(text);
    audioQueue.flushBuffer();
  }, [audioQueue]);

  const interruptAI = useCallback(() => {
    audioQueue.interrupt(true);
    stateMachine.interrupt();
    audioManager.releaseOperation('tts'); // Release TTS lock
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, [audioQueue, stateMachine, audioManager]);

  return {
    // State
    state: stateMachine.state,
    isVoiceMode: stateMachine.isVoiceMode,
    messages: chatState.messages,
    currentTranscript: chatState.currentTranscript,
    error: chatState.error,
    systemState,
    isSystemDisabled: audioManager.isSystemDisabled,
    
    // Voice status
    isUserSpeaking: vadDetection.isUserSpeaking,
    audioLevel: vadDetection.audioLevel,
    confidence: vadDetection.confidence,
    isVADDisabled: vadDetection.isDisabled,
    
    // Actions
    toggleVoiceMode,
    sendTextMessage,
    speakText,
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