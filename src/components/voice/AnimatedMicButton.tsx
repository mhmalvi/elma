import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedMicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AnimatedMicButton = ({ 
  isRecording, 
  isProcessing, 
  onToggle,
  size = 'lg',
  className 
}: AnimatedMicButtonProps) => {
  const [rippleKey, setRippleKey] = useState(0);

  const handleClick = () => {
    setRippleKey(prev => prev + 1);
    onToggle();
  };

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6', 
    xl: 'w-8 h-8'
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-500",
          sizeClasses[size],
          isRecording 
            ? "animate-pulse scale-150 bg-primary/20 shadow-[0_0_30px_theme(colors.primary/0.4)]"
            : isProcessing
            ? "scale-125 bg-primary/10 shadow-[0_0_20px_theme(colors.primary/0.2)]"
            : "scale-100 bg-transparent"
        )}
      />

      {/* Waveform Rings */}
      {isRecording && (
        <>
          <div className={cn(
            "absolute rounded-full animate-ping",
            sizeClasses[size],
            "scale-125 bg-primary/30"
          )} />
          <div className={cn(
            "absolute rounded-full animate-ping animation-delay-150",
            sizeClasses[size], 
            "scale-110 bg-primary/20"
          )} />
          <div className={cn(
            "absolute rounded-full animate-ping animation-delay-300",
            sizeClasses[size],
            "scale-105 bg-primary/10"  
          )} />
        </>
      )}

      {/* Ripple Effect */}
      <div
        key={rippleKey}
        className={cn(
          "absolute rounded-full bg-primary/30 pointer-events-none",
          sizeClasses[size],
          "animate-[ping_0.6s_cubic-bezier(0,0,0.2,1)]"
        )}
      />

      {/* Main Button */}
      <Button
        onClick={handleClick}
        disabled={isProcessing}
        className={cn(
          "relative rounded-full border-0 transition-all duration-300 shadow-lg hover:shadow-xl",
          sizeClasses[size],
          isRecording 
            ? "bg-destructive hover:bg-destructive/90 animate-pulse shadow-[0_0_20px_theme(colors.destructive/0.4)]"
            : isProcessing
            ? "bg-primary/50 cursor-not-allowed"
            : "bg-primary hover:bg-primary/90 hover:scale-105 shadow-[0_0_15px_theme(colors.primary/0.3)]",
          className
        )}
      >
        {/* Button Content */}
        <div className="relative flex items-center justify-center">
          {isProcessing ? (
            <div className={cn(
              "border-2 border-white border-t-transparent rounded-full animate-spin",
              iconSizes[size]
            )} />
          ) : isRecording ? (
            <Square className={cn(iconSizes[size], "text-white")} />
          ) : (
            <Mic className={cn(iconSizes[size], "text-white")} />
          )}
        </div>

        {/* Inner Glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-300",
            isRecording
              ? "bg-gradient-to-r from-white/20 to-transparent opacity-100"
              : "opacity-0"
          )}
        />
      </Button>
    </div>
  );
};