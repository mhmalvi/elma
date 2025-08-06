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

  // Smooth, realistic audio data simulation
  useEffect(() => {
    if (!isActive) {
      setWaveformData(Array(bars).fill(0.15));
      return;
    }

    const interval = setInterval(() => {
      const newData = Array.from({ length: bars }, (_, i) => {
        const baseLevel = audioLevel || (0.3 + Math.random() * 0.4);
        const wave = Math.sin((Date.now() / 400) + (i * 0.8)) * 0.2 + 0.6;
        const variance = Math.sin((Date.now() / 150) + (i * 1.2)) * 0.15;
        return Math.max(0.1, Math.min(1, baseLevel * wave + variance));
      });
      setWaveformData(newData);
    }, 80); // Slower, smoother updates

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
          const height = 6 + (level * 16); // Gentler height variation
          
          return (
            <div
              key={index}
              className={cn(
                "absolute rounded-full transition-all duration-200 ease-out", // Slower transition
                colorClasses[color],
                sizeClasses[size].bar
              )}
              style={{
                height: `${height}px`,
                transform: `rotate(${angle}deg) translateY(-${sizeClasses[size].container === 'w-16 h-16' ? '28' : sizeClasses[size].container === 'w-20 h-20' ? '34' : '40'}px)`,
                transformOrigin: `center ${sizeClasses[size].container === 'w-16 h-16' ? '32' : sizeClasses[size].container === 'w-20 h-20' ? '40' : '48'}px`,
                opacity: 0.4 + (level * 0.6),
                animationDelay: `${index * 0.1}s`
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
        const radius = 12 + (level * 20); // Smoother radius changes
        
        return (
          <div
            key={index}
            className={cn(
              "absolute rounded-full border transition-all duration-300 ease-out", // Much slower
              {
                'border-primary/40': color === 'primary',
                'border-accent/40': color === 'accent',
                'border-spiritual/40': color === 'spiritual'
              }
            )}
            style={{
              width: `${radius}px`,
              height: `${radius}px`,
              opacity: 0.2 + (level * 0.5),
              animationDelay: `${index * 200}ms`, // Much slower stagger
              borderWidth: '1.5px'
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
      "flex items-end justify-center space-x-1.5", // More spacing
      className
    )}>
      {waveformData.map((level, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full transition-all duration-300 ease-out", // Much slower
            colorClasses[color],
            sizeClasses[size].bar
          )}
          style={{
            height: `${6 + (level * 24)}px`, // Better height range
            opacity: 0.5 + (level * 0.5),
            animationDelay: `${index * 80}ms` // Slower stagger
          }}
        />
      ))}
    </div>
  );
};