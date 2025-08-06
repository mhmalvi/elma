import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveformVisualizerProps {
  isActive: boolean;
  isListening: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VoiceWaveformVisualizer = ({ 
  isActive, 
  isListening,
  size = 'md',
  className 
}: VoiceWaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const sizeConfig = {
    sm: { width: 150, height: 60, bars: 20 },
    md: { width: 200, height: 80, bars: 30 },
    lg: { width: 300, height: 120, bars: 50 }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    if (isListening && !audioContext) {
      initializeAudioContext();
    }
    
    if (isActive) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isActive, isListening]);

  const initializeAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyserNode = ctx.createAnalyser();
      const source = ctx.createMediaStreamSource(stream);
      
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      
      setAudioContext(ctx);
      setAnalyser(analyserNode);
    } catch (error) {
      console.log('[Waveform] Could not access microphone:', error);
    }
  };

  const startAnimation = () => {
    if (!animationRef.current) {
      animate();
    }
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  };

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isActive) {
      if (analyser && isListening) {
        // Real audio visualization
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        drawRealWaveform(ctx, dataArray);
      } else {
        // Fake animation when not listening
        drawFakeWaveform(ctx);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  const drawRealWaveform = (ctx: CanvasRenderingContext2D, dataArray: Uint8Array) => {
    const barWidth = config.width / config.bars;
    const barSpacing = barWidth * 0.2;
    const effectiveBarWidth = barWidth - barSpacing;

    for (let i = 0; i < config.bars; i++) {
      const dataIndex = Math.floor((i / config.bars) * dataArray.length);
      const amplitude = dataArray[dataIndex] / 255;
      const barHeight = amplitude * config.height * 0.8;
      
      const x = i * barWidth + barSpacing / 2;
      const y = (config.height - barHeight) / 2;

      // Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, config.height);
      gradient.addColorStop(0, 'hsl(174, 60%, 51%)');
      gradient.addColorStop(1, 'hsl(174, 60%, 41%)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, effectiveBarWidth, barHeight);
    }
  };

  const drawFakeWaveform = (ctx: CanvasRenderingContext2D) => {
    const barWidth = config.width / config.bars;
    const barSpacing = barWidth * 0.2;
    const effectiveBarWidth = barWidth - barSpacing;
    const time = Date.now() * 0.005;

    for (let i = 0; i < config.bars; i++) {
      const amplitude = Math.sin(time + i * 0.5) * 0.5 + 0.5;
      const barHeight = amplitude * config.height * 0.6 + 10;
      
      const x = i * barWidth + barSpacing / 2;
      const y = (config.height - barHeight) / 2;

      // Gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, config.height);
      gradient.addColorStop(0, 'hsl(174, 60%, 51%)');
      gradient.addColorStop(1, 'hsl(174, 60%, 41%)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, effectiveBarWidth, barHeight);
    }
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        width={config.width}
        height={config.height}
        className={cn(
          "rounded-lg transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-30"
        )}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};