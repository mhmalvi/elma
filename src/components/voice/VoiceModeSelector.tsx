import React from 'react';
import { Mic, MessageCircle, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { cn } from '@/lib/utils';

interface VoiceModeSelectorProps {
  className?: string;
}

export const VoiceModeSelector = ({ className }: VoiceModeSelectorProps) => {
  const { currentMode, setMode, isActive } = useVoiceMode();

  const handleModeSelect = (mode: 'dictation' | 'live') => {
    if (isActive) return; // Prevent mode switching during active session
    setMode(mode);
  };

  return (
    <div className={cn("relative flex bg-card/95 backdrop-blur-md rounded-full p-1 border shadow-lg", className)}>
      {/* Animated Background Slider */}
      <div
        className={cn(
          "absolute top-1 bottom-1 rounded-full transition-all duration-500 ease-out shadow-md",
          currentMode === null 
            ? "left-1 w-[calc(33.333%-0.25rem)] bg-muted"
            : currentMode === 'dictation' 
            ? "left-[calc(33.333%+0.25rem)] w-[calc(33.333%-0.25rem)] bg-primary"
            : "right-1 w-[calc(33.333%-0.25rem)] bg-primary"
        )}
      />
      
      {/* Text Chat Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMode(null)}
        disabled={isActive}
        className={cn(
          "relative z-10 flex items-center justify-center transition-all duration-300 rounded-full p-3 flex-1",
          currentMode === null ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          isActive && "opacity-50 cursor-not-allowed"
        )}
        title="Text chat mode"
      >
        <Type className="w-5 h-5" />
      </Button>

      {/* Dictation Mode Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleModeSelect('dictation')}
        disabled={isActive}
        className={cn(
          "relative z-10 flex items-center justify-center transition-all duration-300 rounded-full p-3 flex-1",
          currentMode === 'dictation' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          isActive && "opacity-50 cursor-not-allowed"
        )}
        title="Voice memo mode"
      >
        <Mic className="w-5 h-5" />
      </Button>

      {/* Live Talk Mode Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleModeSelect('live')}
        disabled={isActive}
        className={cn(
          "relative z-10 flex items-center justify-center transition-all duration-300 rounded-full p-3 flex-1",
          currentMode === 'live' ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          isActive && "opacity-50 cursor-not-allowed"
        )}
        title="Live conversation mode"
      >
        <MessageCircle className="w-5 h-5" />
      </Button>
    </div>
  );
};