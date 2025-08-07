import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { useStreamingTTSEngine } from '@/hooks/useStreamingTTSEngine';
import { useUnifiedAudioManager } from '@/hooks/useUnifiedAudioManager';
import { useRealTimeVAD } from '@/hooks/useRealTimeVAD';
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
  
  const [sessionState, setSessionState] = useState<LiveSessionState>({
    isActive: false,
    conversationState: 'idle',
    currentLanguage: 'en',
    turnCount: 0,
    conversationHistory: [],
    error: null,
    sessionId: null
  });

  // Advanced voice components
  const sttHook = useAdvancedVoiceSTT();
  const ttsEngine = useStreamingTTSEngine();
  const audioManager = useUnifiedAudioManager();
  const vadDetector = useRealTimeVAD();

  // Session management refs
  const isProcessingRef = useRef(false);
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();
  const interruptionRef = useRef(false);

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

      // Stream the response with premium voice
      await ttsEngine.startStreaming(aiResponse, sessionState.currentLanguage);

      // Auto-resume listening after speaking (if not interrupted)
      if (!interruptionRef.current && sessionState.isActive) {
        setTimeout(() => {
          if (!interruptionRef.current && sessionState.isActive) {
            resumeListening();
          }
        }, 500);
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
  }, [userId, sessionState.sessionId, sessionState.currentLanguage, sessionState.isActive, addToHistory, ttsEngine, toast]);

  // Resume listening after AI response
  const resumeListening = useCallback(() => {
    if (!sessionState.isActive || interruptionRef.current) return;
    
    console.log('[AdvancedLiveSession] Resuming listening...');
    
    setSessionState(prev => ({
      ...prev,
      conversationState: 'listening'
    }));

    // Start VAD and STT
    vadDetector.startDetection();
    sttHook.startListening(sessionState.currentLanguage);
  }, [sessionState.isActive, sessionState.currentLanguage, vadDetector, sttHook]);

  // Handle STT final transcript
  useEffect(() => {
    if (sttHook.sttState.transcript && 
        sessionState.conversationState === 'listening' && 
        sessionState.isActive &&
        !isProcessingRef.current) {
      
      const transcript = sttHook.sttState.transcript.trim();
      
      if (transcript.length > 2) {
        console.log('[AdvancedLiveSession] Processing final transcript:', transcript);
        
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

  // Monitor voice activity for instant interruption
  useEffect(() => {
    if (vadDetector.isVoiceDetected && 
        sessionState.conversationState === 'speaking' && 
        sessionState.isActive) {
      
      console.log('[AdvancedLiveSession] Voice detected during AI speech - interrupting');
      interrupt();
    }
  }, [vadDetector.isVoiceDetected, sessionState.conversationState, sessionState.isActive]);

  // Update conversation state based on TTS activity
  useEffect(() => {
    if (!ttsEngine.isStreaming && 
        sessionState.conversationState === 'speaking' && 
        sessionState.isActive &&
        !interruptionRef.current) {
      
      console.log('[AdvancedLiveSession] TTS finished - auto-resuming listening');
      
      // Brief delay before resuming listening
      setTimeout(() => {
        if (sessionState.isActive && !interruptionRef.current) {
          resumeListening();
        }
      }, 300);
    }
  }, [ttsEngine.isStreaming, sessionState.conversationState, sessionState.isActive, resumeListening]);

  // Start continuous live session
  const startSession = useCallback(async () => {
    try {
      console.log('[AdvancedLiveSession] Starting live session');
      
      // Initialize audio manager
      await audioManager.initialize();
      
      // Generate session ID
      const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setSessionState(prev => ({
        ...prev,
        isActive: true,
        conversationState: 'listening',
        sessionId,
        error: null,
        turnCount: 0
      }));

      // Start VAD and STT
      vadDetector.startDetection();
      await sttHook.startListening(sessionState.currentLanguage);

      toast({
        title: "🎤 Live Session Started",
        description: "Start speaking naturally. I'm listening...",
      });

    } catch (error) {
      console.error('[AdvancedLiveSession] Error starting session:', error);
      
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start session'
      }));

      toast({
        title: "Session Error",
        description: "Failed to start live session. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  }, [audioManager, vadDetector, sttHook, sessionState.currentLanguage, toast]);

  // End session
  const endSession = useCallback(() => {
    console.log('[AdvancedLiveSession] Ending live session');
    
    interruptionRef.current = true;
    isProcessingRef.current = false;

    // Stop all audio processes
    ttsEngine.stopStreaming();
    audioManager.stopAll();
    vadDetector.stopDetection();
    sttHook.stopListening();

    // Clear timeouts
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

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
  }, [ttsEngine, audioManager, vadDetector, sttHook, toast]);

  // Interrupt AI speech and resume listening
  const interrupt = useCallback(() => {
    console.log('[AdvancedLiveSession] Interrupting AI speech');
    
    interruptionRef.current = true;
    
    // Stop TTS immediately
    ttsEngine.stopStreaming();
    audioManager.stopAudio();
    
    // Brief delay before resuming listening
    setTimeout(() => {
      interruptionRef.current = false;
      if (sessionState.isActive) {
        resumeListening();
      }
    }, 200);
  }, [ttsEngine, audioManager, sessionState.isActive, resumeListening]);

  // Change language
  const changeLanguage = useCallback((language: string) => {
    console.log('[AdvancedLiveSession] Changing language to:', language);
    
    setSessionState(prev => ({
      ...prev,
      currentLanguage: language
    }));

    // Update STT and TTS language
    sttHook.changeLanguage(language);
    ttsEngine.updateLanguage(language);

    // Restart listening if active
    if (sessionState.isActive && sessionState.conversationState === 'listening') {
      sttHook.stopListening();
      setTimeout(() => {
        sttHook.startListening(language);
      }, 100);
    }
  }, [sttHook, ttsEngine, sessionState.isActive, sessionState.conversationState]);

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