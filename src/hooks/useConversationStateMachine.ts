import { useState, useCallback, useRef, useEffect } from 'react';

type ConversationState = 'idle' | 'listening' | 'processing' | 'speaking' | 'interrupted';

interface ConversationStateMachine {
  state: ConversationState;
  isVoiceMode: boolean;
  canTransition: boolean;
}

interface StateTransitionEvent {
  type: 'USER_STARTS_SPEAKING' | 'USER_STOPS_SPEAKING' | 'AI_STARTS_RESPONDING' | 'AI_STOPS_RESPONDING' | 'VOICE_MODE_TOGGLE' | 'INTERRUPT' | 'RESET';
  data?: any;
}

export const useConversationStateMachine = (
  onStateChange?: (state: ConversationState, previousState: ConversationState) => void
) => {
  const [stateMachine, setStateMachine] = useState<ConversationStateMachine>({
    state: 'idle',
    isVoiceMode: false,
    canTransition: true
  });

  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransitionRef = useRef<number>(0);

  // State transition matrix
  const validTransitions: Record<ConversationState, ConversationState[]> = {
    idle: ['listening', 'processing'],
    listening: ['processing', 'idle', 'interrupted'],
    processing: ['speaking', 'listening', 'idle'],
    speaking: ['listening', 'interrupted', 'idle'],
    interrupted: ['listening', 'idle', 'processing']
  };

  const transition = useCallback((event: StateTransitionEvent) => {
    const now = Date.now();
    
    // Debounce rapid transitions
    if (now - lastTransitionRef.current < 100) {
      return false;
    }

    setStateMachine(prev => {
      const currentState = prev.state;
      let newState: ConversationState = currentState;
      let newIsVoiceMode = prev.isVoiceMode;

      // Process state transitions based on events
      switch (event.type) {
        case 'VOICE_MODE_TOGGLE':
          newIsVoiceMode = !prev.isVoiceMode;
          newState = newIsVoiceMode ? 'listening' : 'idle';
          break;

        case 'USER_STARTS_SPEAKING':
          if (prev.isVoiceMode) {
            if (currentState === 'speaking') {
              newState = 'interrupted';
            } else if (currentState === 'idle' || currentState === 'listening') {
              newState = 'listening';
            }
          }
          break;

        case 'USER_STOPS_SPEAKING':
          if (prev.isVoiceMode && currentState === 'listening') {
            newState = 'processing';
          }
          break;

        case 'AI_STARTS_RESPONDING':
          if (currentState === 'processing') {
            newState = 'speaking';
          }
          break;

        case 'AI_STOPS_RESPONDING':
          if (currentState === 'speaking' && prev.isVoiceMode) {
            newState = 'listening'; // Auto-resume listening in voice mode
          } else if (currentState === 'speaking') {
            newState = 'idle';
          }
          break;

        case 'INTERRUPT':
          if (currentState === 'speaking') {
            newState = 'interrupted';
          }
          break;

        case 'RESET':
          newState = prev.isVoiceMode ? 'listening' : 'idle';
          break;
      }

      // Validate transition
      const isValidTransition = validTransitions[currentState]?.includes(newState) || newState === currentState;
      
      if (!isValidTransition) {
        console.warn(`Invalid transition from ${currentState} to ${newState}`);
        return prev;
      }

      // State changed
      if (newState !== currentState || newIsVoiceMode !== prev.isVoiceMode) {
        lastTransitionRef.current = now;
        onStateChange?.(newState, currentState);
        
        console.log(`State transition: ${currentState} → ${newState} (voice: ${newIsVoiceMode})`);
        
        return {
          state: newState,
          isVoiceMode: newIsVoiceMode,
          canTransition: true
        };
      }

      return prev;
    });

    return true;
  }, [onStateChange]);

  // Remove auto-transition from interrupted state
  // User must manually recover or explicitly start listening again
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const toggleVoiceMode = useCallback(() => {
    transition({ type: 'VOICE_MODE_TOGGLE' });
  }, [transition]);

  const userStartsSpeaking = useCallback(() => {
    transition({ type: 'USER_STARTS_SPEAKING' });
  }, [transition]);

  const userStopsSpeaking = useCallback(() => {
    transition({ type: 'USER_STOPS_SPEAKING' });
  }, [transition]);

  const aiStartsResponding = useCallback(() => {
    transition({ type: 'AI_STARTS_RESPONDING' });
  }, [transition]);

  const aiStopsResponding = useCallback(() => {
    transition({ type: 'AI_STOPS_RESPONDING' });
  }, [transition]);

  const interrupt = useCallback(() => {
    transition({ type: 'INTERRUPT' });
  }, [transition]);

  const reset = useCallback(() => {
    transition({ type: 'RESET' });
  }, [transition]);

  return {
    state: stateMachine.state,
    isVoiceMode: stateMachine.isVoiceMode,
    canTransition: stateMachine.canTransition,
    toggleVoiceMode,
    userStartsSpeaking,
    userStopsSpeaking,
    aiStartsResponding,
    aiStopsResponding,
    interrupt,
    reset
  };
};