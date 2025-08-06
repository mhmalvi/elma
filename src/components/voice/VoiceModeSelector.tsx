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
    <div className={cn("flex gap-2 p-2 bg-secondary/50 rounded-lg", className)}>
      {/* Dictation Mode Button */}
      <Button
        variant={currentMode === 'dictation' ? "default" : "ghost"}
        size="sm"
        onClick={() => handleModeSelect('dictation')}
        disabled={isActive}
        className={cn(
          "flex items-center gap-2 transition-all duration-300",
          currentMode === 'dictation' && "bg-primary text-primary-foreground shadow-md",
          isActive && "opacity-50 cursor-not-allowed"
        )}
      >
        <Mic className="w-4 h-4" />
        <span className="hidden sm:inline">Dictation</span>
      </Button>

      {/* Live Conversation Mode Button */}
      <Button
        variant={currentMode === 'live' ? "default" : "ghost"}
        size="sm"
        onClick={() => handleModeSelect('live')}
        disabled={isActive}
        className={cn(
          "flex items-center gap-2 transition-all duration-300",
          currentMode === 'live' && "bg-primary text-primary-foreground shadow-md",
          isActive && "opacity-50 cursor-not-allowed"
        )}
      >
        <MessageSquare className="w-4 h-4" />
        <span className="hidden sm:inline">Live Talk</span>
      </Button>
    </div>
  );
};