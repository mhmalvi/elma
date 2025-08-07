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
    listening: ['processing', 'idle', 'interrupted', 'speaking'],
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
          if (currentState === 'processing' || currentState === 'listening') {
            newState = 'speaking';
          }
          break;

        case 'AI_STOPS_RESPONDING':
          if (currentState === 'speaking') {
            // CRITICAL FIX: Don't auto-resume listening, require manual action
            newState = 'idle';
          }
          break;

        case 'INTERRUPT':
          if (currentState === 'speaking') {
            newState = 'interrupted';
          }
          break;

        case 'RESET':
          // CRITICAL FIX: Manual reset only goes to idle, requires explicit voice activation
          newState = 'idle';
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

  // Add debounce to prevent rapid state transitions
  const lastTransitionTimeRef = useRef<number>(0);
  
  const debouncedTransition = useCallback((event: StateTransitionEvent) => {
    const now = Date.now();
    // Critical: Increase debounce time to prevent rapid loops
    if (now - lastTransitionTimeRef.current < 500) { // Increased from 100ms to 500ms
      console.log('State transition debounced');
      return false;
    }
    lastTransitionTimeRef.current = now;
    return transition(event);
  }, [transition]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const toggleVoiceMode = useCallback(() => {
    debouncedTransition({ type: 'VOICE_MODE_TOGGLE' });
  }, [debouncedTransition]);

  const userStartsSpeaking = useCallback(() => {
    debouncedTransition({ type: 'USER_STARTS_SPEAKING' });
  }, [debouncedTransition]);

  const userStopsSpeaking = useCallback(() => {
    debouncedTransition({ type: 'USER_STOPS_SPEAKING' });
  }, [debouncedTransition]);

  const aiStartsResponding = useCallback(() => {
    debouncedTransition({ type: 'AI_STARTS_RESPONDING' });
  }, [debouncedTransition]);

  const aiStopsResponding = useCallback(() => {
    debouncedTransition({ type: 'AI_STOPS_RESPONDING' });
  }, [debouncedTransition]);

  const interrupt = useCallback(() => {
    debouncedTransition({ type: 'INTERRUPT' });
  }, [debouncedTransition]);

  const reset = useCallback(() => {
    debouncedTransition({ type: 'RESET' });
  }, [debouncedTransition]);

  // New function for safe voice mode restart
  const startVoiceMode = useCallback(() => {
    if (!stateMachine.isVoiceMode) {
      toggleVoiceMode();
    } else {
      debouncedTransition({ type: 'VOICE_MODE_TOGGLE' });
    }
  }, [stateMachine.isVoiceMode, toggleVoiceMode, debouncedTransition]);

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
    reset,
    startVoiceMode // New safe voice mode starter
  };
};