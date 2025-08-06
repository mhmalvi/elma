import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveformProps {
  isActive: boolean;
  isListening: boolean;
  className?: string;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isActive,
  isListening,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.02;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (isActive) {
        // Draw sophisticated waveform
        const centerY = canvas.height / 2;
        const baseAmplitude = isListening ? 20 : 8;
        
        // Create multiple wave layers for depth
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          
          const amplitude = baseAmplitude * (1 - layer * 0.3);
          const frequency = 0.02 + layer * 0.005;
          const opacity = isListening ? (1 - layer * 0.3) : (0.4 - layer * 0.1);
          
          // Create gradient for each layer
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, `hsla(174, 60%, 41%, 0)`);
          gradient.addColorStop(0.5, `hsla(174, 60%, ${51 + layer * 10}%, ${opacity})`);
          gradient.addColorStop(1, `hsla(174, 60%, 41%, 0)`);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2 - layer * 0.5;
          ctx.lineCap = 'round';
          
          for (let x = 0; x < canvas.width; x += 2) {
            const wave1 = Math.sin(x * frequency + timeRef.current) * amplitude;
            const wave2 = Math.sin(x * frequency * 1.5 + timeRef.current * 1.3) * amplitude * 0.7;
            const wave3 = Math.sin(x * frequency * 0.8 + timeRef.current * 0.8) * amplitude * 0.5;
            
            const y = centerY + wave1 + wave2 + wave3;
            
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          
          ctx.stroke();
        }
        
        // Add particles effect when listening
        if (isListening) {
          for (let i = 0; i < 5; i++) {
            const x = (timeRef.current * 50 + i * 40) % (canvas.width + 20) - 10;
            const y = centerY + Math.sin(timeRef.current * 2 + i) * 15;
            
            const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, 3);
            particleGradient.addColorStop(0, 'hsla(174, 100%, 54%, 0.8)');
            particleGradient.addColorStop(1, 'hsla(174, 100%, 54%, 0)');
            
            ctx.fillStyle = particleGradient;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      if (isActive) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isActive) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, isListening]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className={cn(
        "transition-opacity duration-300",
        isActive ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
};