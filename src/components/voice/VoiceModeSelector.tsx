import React from 'react';
import { Mic, MessageCircle, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { cn } from '@/lib/utils';
interface VoiceModeSelectorProps {
  className?: string;
}
export const VoiceModeSelector = ({
  className
}: VoiceModeSelectorProps) => {
  const {
    currentMode,
    setMode,
    isActive
  } = useVoiceMode();
  const handleModeSelect = (mode: 'dictation' | 'live') => {
    if (isActive) return; // Prevent mode switching during active session
    setMode(mode);
  };
  return <div className={cn("relative flex bg-secondary/30 rounded-full p-1.5 backdrop-blur-sm border border-border/20", className)}>
      {/* Dictation Mode Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleModeSelect('dictation')} 
        disabled={isActive} 
        className={cn(
          "relative z-10 transition-all duration-300 rounded-full p-3",
          currentMode === 'dictation' ? "text-primary-foreground shadow-none" : "text-muted-foreground hover:text-foreground",
          isActive && "opacity-50 cursor-not-allowed"
        )}
        title="Voice memo"
      >
        <Mic className="w-5 h-5" />
      </Button>

      {/* Live Conversation Mode Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => handleModeSelect('live')} 
        disabled={isActive} 
        className={cn(
          "relative z-10 transition-all duration-300 rounded-full p-3",
          currentMode === 'live' ? "text-primary-foreground shadow-none" : "text-muted-foreground hover:text-foreground",
          isActive && "opacity-50 cursor-not-allowed"
        )}
        title="Live conversation"
      >
        <MessageCircle className="w-5 h-5" />
      </Button>

      {/* Animated Background Slider */}
      <div className={cn(
        "absolute top-1.5 bottom-1.5 bg-primary rounded-full transition-all duration-300 ease-out shadow-lg w-12",
        currentMode === 'dictation' ? "left-1.5" :
        currentMode === 'live' ? "right-1.5" :
        "opacity-0"
      )} />
    </div>;
};