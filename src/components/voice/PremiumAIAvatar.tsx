import React from 'react';
import { cn } from '@/lib/utils';

interface PremiumAIAvatarProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const PremiumAIAvatar = ({ 
  isListening = false, 
  isSpeaking = false, 
  isThinking = false, 
  size = 'lg',
  className 
}: PremiumAIAvatarProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const getAvatarState = () => {
    if (isListening) return 'listening';
    if (isSpeaking) return 'speaking';
    if (isThinking) return 'thinking';
    return 'idle';
  };

  const state = getAvatarState();

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      {/* Outer animated rings */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-1000",
        state === 'listening' && "animate-gentle-pulse bg-primary/10 shadow-lg shadow-primary/20",
        state === 'speaking' && "animate-breathe bg-accent/10 shadow-xl shadow-accent/30",
        state === 'thinking' && "animate-smooth-glow bg-spiritual/10 shadow-lg shadow-spiritual/20"
      )} />
      
      {/* Middle ring */}
      <div className={cn(
        "absolute inset-2 rounded-full transition-all duration-800",
        state === 'listening' && "bg-primary/20 animate-pulse",
        state === 'speaking' && "bg-accent/20 animate-ping",
        state === 'thinking' && "bg-spiritual/20 animate-spin"
      )} />
      
      {/* Core avatar */}
      <div className={cn(
        "relative z-10 rounded-full flex items-center justify-center bg-gradient-primary text-primary-foreground transition-all duration-600",
        "shadow-lg backdrop-blur-xl border border-primary/20",
        sizeClasses[size],
        state === 'listening' && "scale-110 shadow-primary/30",
        state === 'speaking' && "scale-105 shadow-accent/40", 
        state === 'thinking' && "animate-gentle-pulse shadow-spiritual/30"
      )}>
        {/* AI Logo/Icon */}
        <div className={cn(
          "w-1/2 h-1/2 rounded-full bg-primary-foreground/90 flex items-center justify-center font-bold text-primary",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm", 
          size === 'lg' && "text-lg",
          size === 'xl' && "text-xl"
        )}>
          AI
        </div>
        
        {/* Dynamic state indicators */}
        {state === 'speaking' && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-accent rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>
      
      {/* Ambient glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-1000 pointer-events-none",
        state === 'listening' && "bg-primary/5 blur-xl scale-150",
        state === 'speaking' && "bg-accent/5 blur-xl scale-160",
        state === 'thinking' && "bg-spiritual/5 blur-xl scale-140"
      )} />
    </div>
  );
};