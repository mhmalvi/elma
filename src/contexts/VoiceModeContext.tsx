import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type VoiceModeType = 'dictation' | 'live' | 'continuous' | null;

interface VoiceModeSettings {
  silenceTimeout: number;
  autoSend: boolean;
  interruptible: boolean;
  continuousListening: boolean;
}

interface VoiceModeContextType {
  currentMode: VoiceModeType;
  isActive: boolean;
  settings: VoiceModeSettings;
  setMode: (mode: VoiceModeType) => void;
  activateMode: () => void;
  deactivateMode: () => void;
  updateSettings: (settings: Partial<VoiceModeSettings>) => void;
}

const defaultSettings: VoiceModeSettings = {
  silenceTimeout: 2000,
  autoSend: true,
  interruptible: true,
  continuousListening: false,
};

const VoiceModeContext = createContext<VoiceModeContextType | undefined>(undefined);

interface VoiceModeProviderProps {
  children: ReactNode;
}

export const VoiceModeProvider = ({ children }: VoiceModeProviderProps) => {
  const [currentMode, setCurrentMode] = useState<VoiceModeType>(() => {
    const saved = localStorage.getItem('voice_mode');
    return (saved as VoiceModeType) || null;
  });
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<VoiceModeSettings>(defaultSettings);

  const setMode = useCallback((mode: VoiceModeType) => {
    console.log('[VoiceMode] Switching to mode:', mode);
    setCurrentMode(mode);
    setIsActive(false);
    
    if (mode) {
      localStorage.setItem('voice_mode', mode);
      
      // Update settings based on mode
      if (mode === 'dictation') {
        setSettings(prev => ({
          ...prev,
          silenceTimeout: 2000,
          autoSend: true,
          continuousListening: false,
        }));
      } else if (mode === 'live') {
        setSettings(prev => ({
          ...prev,
          silenceTimeout: 1000,
          autoSend: false,
          continuousListening: true,
        }));
      } else if (mode === 'continuous') {
        setSettings(prev => ({
          ...prev,
          silenceTimeout: 500,
          autoSend: false,
          continuousListening: true,
          interruptible: true,
        }));
      }
    } else {
      localStorage.removeItem('voice_mode');
    }
  }, []);

  const activateMode = useCallback(() => {
    if (currentMode) {
      console.log('[VoiceMode] Activating mode:', currentMode);
      setIsActive(true);
    }
  }, [currentMode]);

  const deactivateMode = useCallback(() => {
    console.log('[VoiceMode] Deactivating mode');
    setIsActive(false);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VoiceModeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const value = {
    currentMode,
    isActive,
    settings,
    setMode,
    activateMode,
    deactivateMode,
    updateSettings,
  };

  return (
    <VoiceModeContext.Provider value={value}>
      {children}
    </VoiceModeContext.Provider>
  );
};

export const useVoiceMode = () => {
  const context = useContext(VoiceModeContext);
  if (context === undefined) {
    throw new Error('useVoiceMode must be used within a VoiceModeProvider');
  }
  return context;
};