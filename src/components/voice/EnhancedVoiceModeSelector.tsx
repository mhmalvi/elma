import React from 'react';
import { Mic, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { cn } from '@/lib/utils';

interface EnhancedVoiceModeSelectorProps {
  className?: string;
}

export const EnhancedVoiceModeSelector = ({
  className
}: EnhancedVoiceModeSelectorProps) => {
  const {
    currentMode,
    setMode,
    isActive
  } = useVoiceMode();

  const handleModeSelect = (mode: 'dictation' | 'live') => {
    if (isActive) return;
    setMode(mode);
  };

  const modes = [
    {
      id: 'dictation',
      icon: Mic,
      label: 'Voice Memo',
      description: 'Record, review, send'
    },
    {
      id: 'live',
      icon: MessageCircle,
      label: 'Live Chat',
      description: 'Real-time conversation'
    }
  ] as const;

  return (
    <div className={cn(
      "relative backdrop-blur-sm rounded-2xl p-1 border border-border/30",
      "bg-gradient-to-r from-background/80 to-secondary/20",
      "shadow-lg",
      className
    )}>
      {/* Animated background slider */}
      <div className={cn(
        "absolute top-1 bottom-1 bg-gradient-to-r rounded-xl transition-all duration-500 ease-out",
        "shadow-md border border-border/20",
        currentMode === 'dictation' 
          ? "left-1 right-1/2 from-primary/90 to-primary-glow/80" 
          : "left-1/2 right-1 from-accent/90 to-accent/80",
        !currentMode && "opacity-0"
      )} />
      
      {/* Mode buttons */}
      <div className="relative z-10 grid grid-cols-2 gap-1">
        {modes.map((mode) => {
          const isSelected = currentMode === mode.id;
          const Icon = mode.icon;
          
          return (
            <Button
              key={mode.id}
              variant="ghost"
              size="lg"
              onClick={() => handleModeSelect(mode.id)}
              disabled={isActive}
              className={cn(
                "relative h-16 px-4 transition-all duration-300 rounded-xl",
                "flex flex-col items-center justify-center space-y-1",
                "hover:scale-105 hover:shadow-lg",
                isSelected 
                  ? "text-white shadow-none" 
                  : "text-muted-foreground hover:text-foreground",
                isActive && "opacity-50 cursor-not-allowed"
              )}
              title={`${mode.label}: ${mode.description}`}
            >
              {/* Icon with animation */}
              <Icon className={cn(
                "w-5 h-5 transition-all duration-300",
                isSelected && "animate-pulse"
              )} />
              
              {/* Label */}
              <span className="text-xs font-medium leading-tight">
                {mode.label}
              </span>
              
              {/* Hover glow effect */}
              {!isSelected && (
                <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              )}
            </Button>
          );
        })}
      </div>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
      )}
      
      {/* Outer glow when active */}
      {currentMode && (
        <div className={cn(
          "absolute inset-0 rounded-2xl transition-opacity duration-300",
          "ring-2 ring-offset-2 ring-offset-background",
          currentMode === 'dictation' ? "ring-primary/30" : "ring-accent/30",
          isActive ? "opacity-100 animate-pulse" : "opacity-0"
        )} />
      )}
    </div>
  );
};