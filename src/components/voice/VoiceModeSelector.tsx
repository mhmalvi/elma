import React from 'react';
import { Mic, MessageSquare } from 'lucide-react';
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
    <div className={cn("relative flex bg-secondary/30 rounded-full p-1 backdrop-blur-sm border border-border/20", className)}>
      {/* Animated Background Slider */}
      <div
        className={cn(
          "absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-300 ease-out shadow-lg",
          currentMode === 'dictation' ? "left-1 right-1/2 mr-0.5" : currentMode === 'live' ? "right-1 left-1/2 ml-0.5" : "opacity-0"
        )}
      />
      
      {/* Dictation Mode Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleModeSelect('dictation')}
        disabled={isActive}
        className={cn(
          "relative z-10 flex items-center gap-2 transition-all duration-300 rounded-full px-4 py-2",
          currentMode === 'dictation' ? "text-primary-foreground shadow-none" : "text-muted-foreground hover:text-foreground",
          isActive && "opacity-50 cursor-not-allowed"
        )}
      >
        <Mic className="w-4 h-4" />
        <span className="font-medium">Dictation</span>
      </Button>

      {/* Live Conversation Mode Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleModeSelect('live')}
        disabled={isActive}
        className={cn(
          "relative z-10 flex items-center gap-2 transition-all duration-300 rounded-full px-4 py-2",
          currentMode === 'live' ? "text-primary-foreground shadow-none" : "text-muted-foreground hover:text-foreground",
          isActive && "opacity-50 cursor-not-allowed"
        )}
      >
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">Live Talk</span>
      </Button>
    </div>
  );
};