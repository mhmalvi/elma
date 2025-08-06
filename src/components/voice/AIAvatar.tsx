import React from 'react';
import { cn } from '@/lib/utils';

interface AIAvatarProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AIAvatar = ({ 
  isListening = false, 
  isSpeaking = false, 
  isThinking = false,
  size = 'md',
  className 
}: AIAvatarProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const getAvatarState = () => {
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    if (isThinking) return 'thinking';
    return 'idle';
  };

  const state = getAvatarState();

  return (
    <div className={cn("relative flex items-center justify-center", sizeClasses[size], className)}>
      {/* Outer ring animations */}
      <div className={cn(
        "absolute inset-0 rounded-full border-2 transition-all duration-500",
        {
          'border-primary/30 animate-pulse': state === 'listening',
          'border-accent/40 animate-ping': state === 'speaking',
          'border-spiritual/20 animate-spin': state === 'thinking',
          'border-muted/20': state === 'idle'
        }
      )} />
      
      {/* Middle ring */}
      <div className={cn(
        "absolute inset-2 rounded-full border transition-all duration-300",
        {
          'border-primary/50 scale-110': state === 'listening',
          'border-accent/60 scale-105': state === 'speaking',
          'border-spiritual/30': state === 'thinking',
          'border-muted/10': state === 'idle'
        }
      )} />

      {/* Core avatar */}
      <div className={cn(
        "relative rounded-full transition-all duration-300 flex items-center justify-center",
        "bg-gradient-to-br shadow-lg overflow-hidden",
        sizeClasses[size],
        {
          'from-primary/20 to-primary-glow/40 shadow-primary/25': state === 'listening',
          'from-accent/30 to-accent/60 shadow-accent/25': state === 'speaking',
          'from-spiritual/20 to-spiritual/40 shadow-spiritual/25': state === 'thinking',
          'from-muted/20 to-secondary/30 shadow-muted/10': state === 'idle'
        }
      )}>
        
        {/* Avatar face/icon */}
        <div className={cn(
          "relative flex items-center justify-center transition-all duration-300",
          {
            'scale-110': state === 'listening',
            'scale-105': state === 'speaking',
            'animate-pulse': state === 'thinking'
          }
        )}>
          
          {/* Core orb */}
          <div className={cn(
            "w-3 h-3 rounded-full transition-all duration-300",
            {
              'bg-primary animate-pulse': state === 'listening',
              'bg-accent animate-ping': state === 'speaking',
              'bg-spiritual': state === 'thinking',
              'bg-muted-foreground/50': state === 'idle'
            }
          )} />
          
          {/* Speaking animation dots */}
          {state === 'speaking' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-accent rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Glow overlay */}
        <div className={cn(
          "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300",
          "bg-gradient-to-br",
          {
            'opacity-30 from-white/20 to-white/5': state === 'listening' || state === 'speaking',
            'opacity-20 from-white/10 to-white/5': state === 'thinking'
          }
        )} />
      </div>
      
      {/* Outer glow effects */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-30",
            {
              'bg-primary/20': state === 'listening',
              'bg-accent/20': state === 'speaking'
            }
          )} style={{ animationDuration: '2s' }} />
          <div className={cn(
            "absolute -inset-2 rounded-full animate-pulse opacity-20",
            {
              'bg-primary/10': state === 'listening',
              'bg-accent/10': state === 'speaking'
            }
          )} style={{ animationDuration: '3s' }} />
        </>
      )}
    </div>
  );
};