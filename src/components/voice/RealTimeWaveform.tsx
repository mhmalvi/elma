import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface RealTimeWaveformProps {
  isActive?: boolean;
  audioLevel?: number;
  bars?: number;
  variant?: 'circular' | 'linear' | 'radial';
  color?: 'primary' | 'accent' | 'spiritual';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RealTimeWaveform = ({ 
  isActive = false,
  audioLevel = 0,
  bars = 12,
  variant = 'circular',
  color = 'primary',
  size = 'md',
  className 
}: RealTimeWaveformProps) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Simulate real-time audio data
  useEffect(() => {
    if (!isActive) {
      setWaveformData(Array(bars).fill(0.1));
      return;
    }

    const interval = setInterval(() => {
      const newData = Array.from({ length: bars }, (_, i) => {
        const baseLevel = audioLevel || Math.random();
        const wave = Math.sin((Date.now() / 200) + (i * 0.5)) * 0.3 + 0.7;
        return Math.max(0.1, Math.min(1, baseLevel * wave));
      });
      setWaveformData(newData);
    }, 50);

    return () => clearInterval(interval);
  }, [isActive, audioLevel, bars]);

  const sizeClasses = {
    sm: { container: 'w-16 h-16', bar: 'w-1' },
    md: { container: 'w-20 h-20', bar: 'w-1.5' },
    lg: { container: 'w-24 h-24', bar: 'w-2' }
  };

  const colorClasses = {
    primary: 'bg-primary',
    accent: 'bg-accent',
    spiritual: 'bg-spiritual'
  };

  if (variant === 'circular') {
    return (
      <div className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size].container,
        className
      )}>
        {waveformData.map((level, index) => {
          const angle = (360 / bars) * index;
          const height = 4 + (level * 12);
          
          return (
            <div
              key={index}
              className={cn(
                "absolute rounded-full transition-all duration-75",
                colorClasses[color],
                sizeClasses[size].bar,
                { 'animate-pulse': isActive }
              )}
              style={{
                height: `${height}px`,
                transform: `rotate(${angle}deg) translateY(-${sizeClasses[size].container === 'w-16 h-16' ? '24' : sizeClasses[size].container === 'w-20 h-20' ? '30' : '36'}px)`,
                transformOrigin: `center ${sizeClasses[size].container === 'w-16 h-16' ? '32' : sizeClasses[size].container === 'w-20 h-20' ? '40' : '48'}px`,
                opacity: 0.6 + (level * 0.4)
              }}
            />
          );
        })}
      </div>
    );
  }

  if (variant === 'radial') {
    return (
      <div className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size].container,
        className
      )}>
        {waveformData.map((level, index) => {
          const radius = 8 + (level * 16);
          
          return (
            <div
              key={index}
              className={cn(
                "absolute rounded-full border-2 transition-all duration-100",
                {
                  'border-primary': color === 'primary',
                  'border-accent': color === 'accent',
                  'border-spiritual': color === 'spiritual'
                },
                { 'animate-ping': isActive && level > 0.7 }
              )}
              style={{
                width: `${radius}px`,
                height: `${radius}px`,
                opacity: 0.3 + (level * 0.7),
                animationDelay: `${index * 100}ms`
              }}
            />
          );
        })}
      </div>
    );
  }

  // Linear variant
  return (
    <div className={cn(
      "flex items-center justify-center space-x-1",
      className
    )}>
      {waveformData.map((level, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full transition-all duration-75",
            colorClasses[color],
            sizeClasses[size].bar,
            { 'animate-pulse': isActive }
          )}
          style={{
            height: `${4 + (level * 20)}px`,
            opacity: 0.6 + (level * 0.4),
            animationDelay: `${index * 50}ms`
          }}
        />
      ))}
    </div>
  );
};