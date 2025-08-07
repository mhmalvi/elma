import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { useAdvancedTTS } from '@/hooks/useAdvancedTTS';
import { supabase } from '@/integrations/supabase/client';

export interface LiveSessionState {
  isActive: boolean;
  conversationState: 'idle' | 'listening' | 'processing' | 'speaking';
  currentLanguage: string;
  turnCount: number;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  error: string | null;
  sessionId: string | null;
}

export interface UseAdvancedLiveSessionReturn {
  sessionState: LiveSessionState;
  startSession: () => Promise<void>;
  endSession: () => void;
  interrupt: () => void;
  changeLanguage: (language: string) => void;
  isSessionActive: boolean;
}

export const useAdvancedLiveSession = (userId?: string): UseAdvancedLiveSessionReturn => {
  const { toast } = useToast();
  
  // Initialize state with stable object
  const [sessionState, setSessionState] = useState<LiveSessionState>(() => ({
    isActive: false,
    conversationState: 'idle',
    currentLanguage: 'en',
    turnCount: 0,
    conversationHistory: [],
    error: null,
    sessionId: null
  }));

  // Use existing working hooks with error boundaries
  const sttHook = useAdvancedVoiceSTT();
  const ttsHook = useAdvancedTTS();

  // Session management refs
  const isProcessingRef = useRef(false);
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();
  const interruptionRef = useRef(false);
  const lastTranscriptRef = useRef('');

  // Advanced language detection from transcript
  const detectLanguage = useCallback((text: string): string => {
    const arabicPattern = /[\u0600-\u06FF]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const urduPattern = /[\u0600-\u06FF].*[\u0627-\u06FF]/;
    const hindiPattern = /[\u0900-\u097F]/;
    
    if (arabicPattern.test(text)) return urduPattern.test(text) ? 'ur' : 'ar';
    if (bengaliPattern.test(text)) return 'bn';
    if (hindiPattern.test(text)) return 'hi';
    return 'en';
  }, []);

  // Add message to conversation history
  const addToHistory = useCallback((role: 'user' | 'assistant', content: string) => {
    setSessionState(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory,
        { role, content, timestamp: new Date() }
      ]
    }));
  }, []);

  // Process AI message and stream response
  const processAIMessage = useCallback(async (userMessage: string) => {
    if (isProcessingRef.current || interruptionRef.current) return;
    
    isProcessingRef.current = true;
    interruptionRef.current = false;
    
    try {
      console.log('[AdvancedLiveSession] Processing AI message:', userMessage);
      
      setSessionState(prev => ({
        ...prev,
        conversationState: 'processing',
        error: null
      }));

      // Add user message to history
      addToHistory('user', userMessage);

      // Send to AI chat function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          question: userMessage,
          user_id: userId,
          conversation_id: sessionState.sessionId
        }
      });

      if (error) throw new Error(error.message);

      const aiResponse = data?.answer || data?.response || '';
      
      if (!aiResponse || interruptionRef.current) {
        console.log('[AdvancedLiveSession] No response or interrupted');
        return;
      }

      console.log('[AdvancedLiveSession] AI response received:', aiResponse.slice(0, 100));

      // Add AI response to history
      addToHistory('assistant', aiResponse);

      // Start streaming TTS
      setSessionState(prev => ({
        ...prev,
        conversationState: 'speaking',
        turnCount: prev.turnCount + 1
      }));

      // Use existing TTS hook with premium voice
      await ttsHook.speak(aiResponse, sessionState.currentLanguage, true);

      // Auto-resume listening after speaking (if not interrupted)
      if (!interruptionRef.current && sessionState.isActive) {
        setTimeout(() => {
          if (!interruptionRef.current && sessionState.isActive) {
            resumeListening();
          }
        }, 1000);
      }

    } catch (error) {
      console.error('[AdvancedLiveSession] Error processing message:', error);
      
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process message',
        conversationState: 'idle'
      }));

      toast({
        title: "Session Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      isProcessingRef.current = false;
    }
  }, [userId, sessionState.sessionId, sessionState.currentLanguage, sessionState.isActive, addToHistory, ttsHook, toast]);

  // Resume listening after AI response
  const resumeListening = useCallback(() => {
    if (!sessionState.isActive || interruptionRef.current) return;
    
    console.log('[AdvancedLiveSession] Resuming listening...');
    
    setSessionState(prev => ({
      ...prev,
      conversationState: 'listening'
    }));

    // Start STT
    sttHook.startListening(sessionState.currentLanguage);
  }, [sessionState.isActive, sessionState.currentLanguage, sttHook]);

  // Handle STT final transcript
  useEffect(() => {
    if (sttHook.sttState.transcript && 
        sessionState.conversationState === 'listening' && 
        sessionState.isActive &&
        !isProcessingRef.current) {
      
      const transcript = sttHook.sttState.transcript.trim();
      
      // Prevent duplicate processing
      if (transcript.length > 2 && transcript !== lastTranscriptRef.current) {
        console.log('[AdvancedLiveSession] Processing final transcript:', transcript);
        
        lastTranscriptRef.current = transcript;
        
        // Detect and update language if changed
        const detectedLang = detectLanguage(transcript);
        if (detectedLang !== sessionState.currentLanguage) {
          setSessionState(prev => ({ ...prev, currentLanguage: detectedLang }));
        }

        // Process the message
        processAIMessage(transcript);
        
        // Clear transcript
        sttHook.clearTranscript();
      }
    }
  }, [sttHook.sttState.transcript, sessionState.conversationState, sessionState.isActive, sessionState.currentLanguage, detectLanguage, processAIMessage, sttHook]);

  // Update conversation state based on TTS activity
  useEffect(() => {
    if (!ttsHook.ttsState.isSpeaking && 
        sessionState.conversationState === 'speaking' && 
        sessionState.isActive &&
        !interruptionRef.current) {
      
      console.log('[AdvancedLiveSession] TTS finished - auto-resuming listening');
      
      // Brief delay before resuming listening
      setTimeout(() => {
        if (sessionState.isActive && !interruptionRef.current) {
          resumeListening();
        }
      }, 500);
    }
  }, [ttsHook.ttsState.isSpeaking, sessionState.conversationState, sessionState.isActive, resumeListening]);

  // Start continuous live session
  const startSession = useCallback(async () => {
    try {
      console.log('[AdvancedLiveSession] Starting live session');
      
      // Reset refs
      isProcessingRef.current = false;
      interruptionRef.current = false;
      lastTranscriptRef.current = '';
      
      // Generate session ID
      const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[AdvancedLiveSession] Setting session state...');
      
      setSessionState(prev => ({
        ...prev,
        isActive: true,
        conversationState: 'listening',
        sessionId,
        error: null,
        turnCount: 0,
        conversationHistory: []
      }));

      console.log('[AdvancedLiveSession] Starting STT listening...');
      
      // Start STT with current language
      const currentLang = sessionState.currentLanguage || 'en';
      await sttHook.startListening(currentLang);

      console.log('[AdvancedLiveSession] Session started successfully');

      toast({
        title: "🎤 Live Session Started",
        description: "Start speaking naturally. I'm listening...",
      });

    } catch (error) {
      console.error('[AdvancedLiveSession] Error starting session:', error);
      
      setSessionState(prev => ({
        ...prev,
        isActive: false,
        conversationState: 'idle',
        error: error instanceof Error ? error.message : 'Failed to start session'
      }));

      toast({
        title: "Session Error",
        description: "Failed to start live session. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [sttHook, toast]);

  // End session
  const endSession = useCallback(() => {
    console.log('[AdvancedLiveSession] Ending live session');
    
    interruptionRef.current = true;
    isProcessingRef.current = false;

    // Stop all audio processes
    ttsHook.stopSpeaking();
    sttHook.stopListening();

    // Clear timeouts
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

    // Reset refs
    lastTranscriptRef.current = '';

    setSessionState(prev => ({
      ...prev,
      isActive: false,
      conversationState: 'idle',
      sessionId: null
    }));

    toast({
      title: "Session Ended",
      description: "Live conversation session has been stopped.",
    });
  }, [ttsHook, sttHook, toast]);

  // Interrupt AI speech and resume listening
  const interrupt = useCallback(() => {
    console.log('[AdvancedLiveSession] Interrupting AI speech');
    
    interruptionRef.current = true;
    
    // Stop TTS immediately
    ttsHook.stopSpeaking();
    
    // Brief delay before resuming listening
    setTimeout(() => {
      interruptionRef.current = false;
      if (sessionState.isActive) {
        resumeListening();
      }
    }, 300);
  }, [ttsHook, sessionState.isActive, resumeListening]);

  // Change language
  const changeLanguage = useCallback((language: string) => {
    console.log('[AdvancedLiveSession] Changing language to:', language);
    
    setSessionState(prev => ({
      ...prev,
      currentLanguage: language
    }));

    // Update STT language
    sttHook.changeLanguage(language);

    // Restart listening if active
    if (sessionState.isActive && sessionState.conversationState === 'listening') {
      sttHook.stopListening();
      setTimeout(() => {
        sttHook.startListening(language);
      }, 100);
    }
  }, [sttHook, sessionState.isActive, sessionState.conversationState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
    sessionState,
    startSession,
    endSession,
    interrupt,
    changeLanguage,
    isSessionActive: sessionState.isActive
  };
};