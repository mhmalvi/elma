import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type VoiceModeType = 'voice' | 'text';

interface VoiceModeSettings {
  autoTTS: boolean;
  interruptible: boolean;
  language: string;
  usePremiumVoice: boolean;
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
  autoTTS: true,
  interruptible: true,
  language: 'en',
  usePremiumVoice: true,
};

const VoiceModeContext = createContext<VoiceModeContextType | undefined>(undefined);

interface VoiceModeProviderProps {
  children: ReactNode;
}

export const VoiceModeProvider = ({ children }: VoiceModeProviderProps) => {
  const [currentMode, setCurrentMode] = useState<VoiceModeType>(() => {
    const saved = localStorage.getItem('voice_mode');
    return (saved as VoiceModeType) || 'text';
  });
  const [isActive, setIsActive] = useState(false);
  const [settings, setSettings] = useState<VoiceModeSettings>(defaultSettings);

  const setMode = useCallback((mode: VoiceModeType) => {
    console.log('[VoiceMode] Switching to mode:', mode);
    setCurrentMode(mode);
    setIsActive(false);
    
    localStorage.setItem('voice_mode', mode);
    
    // Update settings based on mode
    if (mode === 'voice') {
      setSettings(prev => ({
        ...prev,
        autoTTS: true,
        interruptible: true,
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        autoTTS: false,
        interruptible: false,
      }));
    }
  }, []);

  const activateMode = useCallback(() => {
    console.log('[VoiceMode] Activating mode:', currentMode);
    setIsActive(true);
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