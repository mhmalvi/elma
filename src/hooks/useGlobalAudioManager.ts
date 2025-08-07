import { useState, useCallback, useRef, useEffect } from 'react';

type AudioOperation = 'idle' | 'tts' | 'stt' | 'vad' | 'system_disabled';

interface AudioManagerState {
  currentOperation: AudioOperation;
  isAudioContextActive: boolean;
  systemLocked: boolean;
  operationQueue: AudioOperation[];
  error: string | null;
}

interface AudioPermission {
  operation: AudioOperation;
  onGranted: () => void;
  onDenied: () => void;
}

export const useGlobalAudioManager = () => {
  const [managerState, setManagerState] = useState<AudioManagerState>({
    currentOperation: 'idle',
    isAudioContextActive: false,
    systemLocked: false,
    operationQueue: [],
    error: null
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOperationRef = useRef<AudioOperation>('idle');
  const pendingPermissionsRef = useRef<AudioPermission[]>([]);
  const emergencyStopRef = useRef(false);

  // Initialize audio context with proper error handling
  const initializeAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({
          sampleRate: 24000,
          latencyHint: 'interactive'
        });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setManagerState(prev => ({
        ...prev,
        isAudioContextActive: true,
        error: null
      }));

      console.log('Audio Manager: AudioContext initialized successfully');
      return true;
    } catch (error) {
      console.error('Audio Manager: Failed to initialize AudioContext:', error);
      setManagerState(prev => ({
        ...prev,
        error: 'Failed to initialize audio system',
        isAudioContextActive: false
      }));
      return false;
    }
  }, []);

  // Request permission for audio operation with mutual exclusion
  const requestOperation = useCallback((
    operation: AudioOperation,
    onGranted: () => void,
    onDenied: () => void
  ): boolean => {
    // EMERGENCY: If system is disabled, deny all operations
    if (emergencyStopRef.current || managerState.systemLocked) {
      console.log(`Audio Manager: Operation ${operation} DENIED - system disabled/locked`);
      onDenied();
      return false;
    }

    // If idle, grant immediately
    if (activeOperationRef.current === 'idle') {
      console.log(`Audio Manager: Operation ${operation} GRANTED immediately`);
      activeOperationRef.current = operation;
      setManagerState(prev => ({
        ...prev,
        currentOperation: operation
      }));
      onGranted();
      return true;
    }

    // If same operation is running, allow (for continuation)
    if (activeOperationRef.current === operation) {
      console.log(`Audio Manager: Operation ${operation} already active, continuing`);
      onGranted();
      return true;
    }

    // For TTS interrupting anything, allow immediately
    if (operation === 'tts') {
      console.log(`Audio Manager: TTS interrupting ${activeOperationRef.current}`);
      releaseOperation(activeOperationRef.current);
      activeOperationRef.current = operation;
      setManagerState(prev => ({
        ...prev,
        currentOperation: operation
      }));
      onGranted();
      return true;
    }

    // Otherwise, deny the operation
    console.log(`Audio Manager: Operation ${operation} DENIED - ${activeOperationRef.current} is active`);
    onDenied();
    return false;
  }, [managerState.systemLocked]);

  // Release operation lock
  const releaseOperation = useCallback((operation: AudioOperation) => {
    if (activeOperationRef.current === operation || operation === 'system_disabled') {
      console.log(`Audio Manager: Releasing operation ${operation}`);
      activeOperationRef.current = 'idle';
      setManagerState(prev => ({
        ...prev,
        currentOperation: 'idle'
      }));
      
      // Process any pending permissions (not implemented for now to keep it simple)
    }
  }, []);

  // Emergency stop all audio operations
  const emergencyStop = useCallback(() => {
    console.log('Audio Manager: EMERGENCY STOP - Shutting down all audio operations');
    
    emergencyStopRef.current = true;
    activeOperationRef.current = 'system_disabled';
    
    // Force close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    
    setManagerState(prev => ({
      ...prev,
      currentOperation: 'system_disabled',
      isAudioContextActive: false,
      systemLocked: true,
      error: 'Audio system disabled - use reset to restart'
    }));
    
    // Clear any pending permissions
    pendingPermissionsRef.current.forEach(permission => {
      permission.onDenied();
    });
    pendingPermissionsRef.current = [];
  }, []);

  // Reset audio system
  const resetSystem = useCallback(async () => {
    console.log('Audio Manager: Resetting audio system');
    
    emergencyStopRef.current = false;
    activeOperationRef.current = 'idle';
    
    // Clear any existing audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    
    setManagerState(prev => ({
      ...prev,
      currentOperation: 'idle',
      isAudioContextActive: false,
      systemLocked: false,
      error: null,
      operationQueue: []
    }));
    
    // Reinitialize audio context
    await initializeAudioContext();
  }, [initializeAudioContext]);

  // Check if operation can start
  const canStart = useCallback((operation: AudioOperation): boolean => {
    return !emergencyStopRef.current && 
           !managerState.systemLocked && 
           (activeOperationRef.current === 'idle' || activeOperationRef.current === operation);
  }, [managerState.systemLocked]);

  // Force operation (for emergency scenarios)
  const forceOperation = useCallback((operation: AudioOperation) => {
    console.log(`Audio Manager: FORCE operation ${operation}`);
    activeOperationRef.current = operation;
    setManagerState(prev => ({
      ...prev,
      currentOperation: operation
    }));
  }, []);

  // Get audio context (only if manager allows it)
  const getAudioContext = useCallback((): AudioContext | null => {
    if (emergencyStopRef.current || managerState.systemLocked) {
      return null;
    }
    return audioContextRef.current;
  }, [managerState.systemLocked]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.warn);
      }
    };
  }, []);

  return {
    // State
    currentOperation: managerState.currentOperation,
    isAudioContextActive: managerState.isAudioContextActive,
    systemLocked: managerState.systemLocked,
    error: managerState.error,
    isSystemDisabled: emergencyStopRef.current,
    
    // Control functions
    requestOperation,
    releaseOperation,
    emergencyStop,
    resetSystem,
    canStart,
    forceOperation,
    getAudioContext,
    initializeAudioContext
  };
};
