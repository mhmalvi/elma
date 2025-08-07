import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PremiumWaveformVisualizerProps {
  isActive?: boolean;
  frequency?: 'low' | 'medium' | 'high';
  style?: 'minimal' | 'detailed' | 'ambient';
  color?: 'primary' | 'accent' | 'spiritual';
  bars?: number;
  className?: string;
}

export const PremiumWaveformVisualizer = ({
  isActive = false,
  frequency = 'medium',
  style = 'detailed',
  color = 'primary',
  bars = 8,
  className
}: PremiumWaveformVisualizerProps) => {
  const colorClasses = {
    primary: 'bg-primary',
    accent: 'bg-accent', 
    spiritual: 'bg-spiritual'
  };

  const animationDelays = useMemo(() => {
    return Array.from({ length: bars }, (_, i) => i * 0.1);
  }, [bars]);

  const getBarHeight = (index: number) => {
    if (!isActive) return 'h-2';
    
    // Create a more realistic waveform pattern
    const patterns = {
      low: [4, 6, 8, 6, 4, 6, 8, 6],
      medium: [6, 8, 12, 16, 12, 8, 12, 8],
      high: [8, 12, 16, 20, 24, 16, 12, 8]
    };
    
    const pattern = patterns[frequency];
    const height = pattern[index % pattern.length];
    return `h-${Math.max(2, Math.min(24, height))}`;
  };

  const renderMinimalWaveform = () => (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {Array.from({ length: Math.min(bars, 5) }, (_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all duration-300",
            colorClasses[color],
            getBarHeight(i),
            isActive && "animate-waveform opacity-80"
          )}
          style={{
            animationDelay: `${animationDelays[i]}s`
          }}
        />
      ))}
    </div>
  );

  const renderDetailedWaveform = () => (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {Array.from({ length: bars }, (_, i) => (
        <div key={i} className="relative">
          {/* Main bar */}
          <div
            className={cn(
              "w-1.5 rounded-full transition-all duration-300",
              colorClasses[color],
              getBarHeight(i),
              isActive && "animate-waveform"
            )}
            style={{
              animationDelay: `${animationDelays[i]}s`
            }}
          />
          
          {/* Reflection bar */}
          {isActive && (
            <div
              className={cn(
                "absolute top-full w-1.5 h-4 rounded-full opacity-20 blur-sm",
                colorClasses[color],
                "animate-waveform"
              )}
              style={{
                animationDelay: `${animationDelays[i] + 0.05}s`
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderAmbientWaveform = () => (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Background ambient glow */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-all duration-1000",
        isActive && `bg-${color}/10 blur-xl animate-gentle-pulse`
      )} />
      
      {/* Waveform bars */}
      <div className="relative flex items-center gap-1.5">
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 rounded-full transition-all duration-500",
              colorClasses[color],
              getBarHeight(i),
              isActive && "animate-waveform shadow-lg",
              isActive && `shadow-${color}/30`
            )}
            style={{
              animationDelay: `${animationDelays[i]}s`
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {style === 'minimal' && renderMinimalWaveform()}
      {style === 'detailed' && renderDetailedWaveform()}
      {style === 'ambient' && renderAmbientWaveform()}
    </>
  );
};