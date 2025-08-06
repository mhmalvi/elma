import React, { useState, useEffect } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LiveTranscriptBubbleProps {
  transcript: string;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export const LiveTranscriptBubble = ({ 
  transcript, 
  isListening, 
  isProcessing,
  isSpeaking = false,
  className 
}: LiveTranscriptBubbleProps) => {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    setShowBubble(isListening || isProcessing || !!transcript || isSpeaking);
  }, [isListening, isProcessing, transcript, isSpeaking]);

  if (!showBubble) return null;

  const getStatusText = () => {
    if (isSpeaking) return "AI is speaking...";
    if (isProcessing) return "Processing...";
    if (isListening && !transcript) return "Listening...";
    return transcript || "Ready";
  };

  const getStatusIcon = () => {
    if (isSpeaking) return <Volume2 className="w-4 h-4 text-primary animate-pulse" />;
    if (isProcessing) return (
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    );
    if (isListening) return <Mic className="w-4 h-4 text-primary animate-pulse" />;
    return null;
  };

  return (
    <Card className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md",
      "bg-card/95 backdrop-blur-md border shadow-lg",
      "animate-fade-in transition-all duration-300",
      showBubble ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
      className
    )}>
      <div className="p-4 space-y-3">
        {/* Status Header */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-muted-foreground">
            {isListening ? "You're saying:" : isSpeaking ? "AI Response:" : "Status:"}
          </span>
        </div>

        {/* Transcript Content */}
        <div className="min-h-[2rem]">
          <p className={cn(
            "text-sm leading-relaxed transition-all duration-200",
            transcript ? "text-foreground" : "text-muted-foreground italic"
          )}>
            {getStatusText()}
            {isListening && transcript && (
              <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
            )}
          </p>
        </div>

        {/* Visual Waveform */}
        {(isListening || isSpeaking) && (
          <div className="flex items-center justify-center gap-1 h-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 bg-primary rounded-full transition-all duration-200",
                  isListening || isSpeaking ? "animate-pulse" : ""
                )}
                style={{
                  height: `${Math.random() * 16 + 8}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Arrow */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-4 h-4 bg-card border-r border-b border-border rotate-45" />
      </div>
    </Card>
  );
};