import { useState, useCallback, useRef, useEffect } from 'react';
import { useAdvancedVoiceSTT } from './useAdvancedVoiceSTT';
import { useRealtimeStreamingTTS } from './useRealtimeStreamingTTS';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContinuousSessionState {
  isActive: boolean;
  conversationState: 'idle' | 'listening' | 'processing' | 'speaking';
  currentLanguage: string;
  sessionId: string | null;
  conversationHistory: Array<{ speaker: 'user' | 'ai'; text: string; timestamp: number }>;
  error: string | null;
  turnCount: number;
}

interface VoiceActivityState {
  userSpeaking: boolean;
  aiSpeaking: boolean;
  lastActivity: number;
  silenceThreshold: number;
}

interface UseContinuousVoiceSessionReturn {
  sessionState: ContinuousSessionState;
  activityState: VoiceActivityState;
  startSession: () => Promise<void>;
  endSession: () => void;
  interrupt: () => void;
  changeLanguage: (language: string) => void;
  isSessionActive: boolean;
}

export const useContinuousVoiceSession = (
  userId?: string
): UseContinuousVoiceSessionReturn => {
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
    startStreaming,
    stopStreaming,
    addToQueue,
    clearQueue
  } = useRealtimeStreamingTTS();

  const [sessionState, setSessionState] = useState<ContinuousSessionState>({
    isActive: false,
    conversationState: 'idle',
    currentLanguage: 'en',
    sessionId: null,
    conversationHistory: [],
    error: null,
    turnCount: 0
  });

  const [activityState, setActivityState] = useState<VoiceActivityState>({
    userSpeaking: false,
    aiSpeaking: false,
    lastActivity: 0,
    silenceThreshold: 1500
  });

  const processingRef = useRef(false);
  const lastTranscriptRef = useRef('');
  const conversationIdRef = useRef<string | null>(null);
  const turnTimeoutRef = useRef<NodeJS.Timeout>();
  const silenceTimeoutRef = useRef<NodeJS.Timeout>();

  // Language detection with improved accuracy
  const detectLanguage = useCallback((text: string): string => {
    const patterns = {
      ar: /[\u0600-\u06FF]/,
      bn: /[\u0980-\u09FF]/,
      ur: /[\u0600-\u06FF].*[\u0627-\u06FF]/,
      hi: /[\u0900-\u097F]/
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return lang;
    }
    
    return 'en';
  }, []);

  // Add message to conversation history
  const addToHistory = useCallback((speaker: 'user' | 'ai', text: string) => {
    setSessionState(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory,
        { speaker, text, timestamp: Date.now() }
      ]
    }));
  }, []);

  // AI processing with enhanced context
  const processAIMessage = useCallback(async (userText: string, language: string) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    
    try {
      setSessionState(prev => ({ ...prev, conversationState: 'processing' }));
      
      // Add user message to history
      addToHistory('user', userText);
      
      console.log('[ContinuousSession] Processing:', { userText, language, sessionId: conversationIdRef.current });

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          question: userText,
          user_id: userId,
          conversation_id: conversationIdRef.current,
          language: language,
          context: sessionState.conversationHistory.slice(-10) // Last 10 messages
        }
      });

      if (error) throw new Error(error.message);

      // Update conversation ID
      if (data.conversation_id) {
        conversationIdRef.current = data.conversation_id;
      }

      const aiResponse = data.answer || data.response;
      if (aiResponse) {
        console.log('[ContinuousSession] AI Response:', aiResponse.slice(0, 50));
        
        // Add AI response to history
        addToHistory('ai', aiResponse);
        
        // Start streaming AI response
        setSessionState(prev => ({ ...prev, conversationState: 'speaking' }));
        await startStreaming(aiResponse, language);
      }

    } catch (error) {
      console.error('[ContinuousSession] AI Error:', error);
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'AI processing failed',
        conversationState: 'idle'
      }));
      
      toast({
        title: "Conversation Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      processingRef.current = false;
    }
  }, [userId, sessionState.conversationHistory, addToHistory, startStreaming, toast]);

  // Voice Activity Detection (VAD)
  const handleVoiceActivity = useCallback(() => {
    const now = Date.now();
    
    setActivityState(prev => ({
      ...prev,
      userSpeaking: sttState.isListening && Boolean(sttState.interimTranscript),
      aiSpeaking: isStreaming,
      lastActivity: now
    }));

    // Interrupt AI if user starts speaking
    if (sttState.isListening && sttState.interimTranscript && isStreaming) {
      console.log('[ContinuousSession] User interruption detected');
      stopStreaming();
      clearQueue();
      setSessionState(prev => ({ ...prev, conversationState: 'listening' }));
    }
  }, [sttState.isListening, sttState.interimTranscript, isStreaming, stopStreaming, clearQueue]);

  // Process final transcripts for continuous conversation
  useEffect(() => {
    if (!sessionState.isActive) return;

    // Only process final transcripts (when STT stops listening)
    if (sttState.transcript && !sttState.isListening && sttState.transcript !== lastTranscriptRef.current) {
      const transcript = sttState.transcript.trim();
      
      if (transcript.length > 2) {
        console.log('[ContinuousSession] New transcript:', transcript);
        lastTranscriptRef.current = transcript;
        
        const detectedLang = detectLanguage(transcript);
        processAIMessage(transcript, detectedLang);
        
        // Clear transcript after processing
        setTimeout(() => clearTranscript(), 500);
        
        // Increment turn count
        setSessionState(prev => ({ ...prev, turnCount: prev.turnCount + 1 }));
      }
    }
  }, [sttState.transcript, sttState.isListening, sessionState.isActive, detectLanguage, processAIMessage, clearTranscript]);

  // Voice activity monitoring
  useEffect(() => {
    handleVoiceActivity();
  }, [handleVoiceActivity]);

  // Automatic return to listening after AI finishes speaking
  useEffect(() => {
    if (!sessionState.isActive) return;

    if (!isStreaming && sessionState.conversationState === 'speaking') {
      // AI finished speaking, return to listening
      console.log('[ContinuousSession] AI finished, returning to listening');
      
      setTimeout(async () => {
        try {
          setSessionState(prev => ({ ...prev, conversationState: 'listening' }));
          await startListening(sessionState.currentLanguage);
        } catch (error) {
          console.error('[ContinuousSession] Failed to restart listening:', error);
        }
      }, 500); // Small delay for natural flow
    }
  }, [isStreaming, sessionState.conversationState, sessionState.isActive, sessionState.currentLanguage, startListening]);

  // Session state management
  useEffect(() => {
    if (!sessionState.isActive) return;

    if (sttState.isListening) {
      setSessionState(prev => ({ ...prev, conversationState: 'listening' }));
    } else if (sttState.isProcessing || processingRef.current) {
      setSessionState(prev => ({ ...prev, conversationState: 'processing' }));
    } else if (isStreaming) {
      setSessionState(prev => ({ ...prev, conversationState: 'speaking' }));
    }
  }, [sessionState.isActive, sttState.isListening, sttState.isProcessing, isStreaming]);

  // Start continuous session
  const startSession = useCallback(async () => {
    try {
      console.log('[ContinuousSession] Starting continuous session');
      
      // Reset state
      setSessionState(prev => ({
        ...prev,
        isActive: true,
        conversationState: 'listening',
        error: null,
        sessionId: `session_${Date.now()}`,
        conversationHistory: [],
        turnCount: 0
      }));
      
      processingRef.current = false;
      lastTranscriptRef.current = '';
      
      // Start listening
      clearTranscript();
      await startListening(sessionState.currentLanguage);
      
      toast({
        title: "🎙️ Live Mode Active",
        description: "Continuous voice conversation started. Speak naturally!",
      });
      
    } catch (error) {
      console.error('[ContinuousSession] Failed to start session:', error);
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start session'
      }));
      
      toast({
        title: "Session Error",
        description: "Failed to start voice session. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  }, [sessionState.currentLanguage, startListening, clearTranscript, toast]);

  // End session
  const endSession = useCallback(() => {
    console.log('[ContinuousSession] Ending session');
    
    // Stop all audio processing
    stopListening();
    stopStreaming();
    clearQueue();
    
    // Clear timeouts
    if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    // Reset state
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      conversationState: 'idle',
      error: null
    }));
    
    setActivityState(prev => ({
      ...prev,
      userSpeaking: false,
      aiSpeaking: false
    }));
    
    processingRef.current = false;
    lastTranscriptRef.current = '';
    conversationIdRef.current = null;
    
    clearTranscript();
  }, [stopListening, stopStreaming, clearQueue, clearTranscript]);

  // Interrupt current activity
  const interrupt = useCallback(() => {
    console.log('[ContinuousSession] Interrupting session');
    
    // Stop AI speech immediately
    stopStreaming();
    clearQueue();
    
    // Reset processing
    processingRef.current = false;
    
    // Return to listening if session is active
    if (sessionState.isActive) {
      setTimeout(async () => {
        try {
          setSessionState(prev => ({ ...prev, conversationState: 'listening' }));
          clearTranscript();
          await startListening(sessionState.currentLanguage);
        } catch (error) {
          console.error('[ContinuousSession] Failed to restart after interrupt:', error);
        }
      }, 200);
    }
  }, [stopStreaming, clearQueue, sessionState.isActive, sessionState.currentLanguage, clearTranscript, startListening]);

  // Change language
  const changeLanguage = useCallback((language: string) => {
    console.log('[ContinuousSession] Changing language to:', language);
    
    setSessionState(prev => ({ ...prev, currentLanguage: language }));
    changeSTTLanguage(language);
    
    // Restart listening with new language if active
    if (sessionState.isActive && sttState.isListening) {
      stopListening();
      setTimeout(() => {
        startListening(language);
      }, 300);
    }
  }, [sessionState.isActive, sttState.isListening, changeSTTLanguage, stopListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
    sessionState,
    activityState,
    startSession,
    endSession,
    interrupt,
    changeLanguage,
    isSessionActive: sessionState.isActive
  };
};