import React from 'react';
import { Mic, MicOff, Volume2, Loader2, Languages, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoiceStatusIndicatorProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'interrupted';
  transcript?: string;
  language?: string;
  confidence?: number;
  className?: string;
}

export const VoiceStatusIndicator = ({ 
  status, 
  transcript, 
  language = 'EN',
  confidence = 0,
  className 
}: VoiceStatusIndicatorProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'listening':
        return <Mic className="w-4 h-4 text-primary animate-pulse" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-spiritual animate-spin" />;
      case 'speaking':
        return <Volume2 className="w-4 h-4 text-accent animate-bounce" />;
      case 'error':
        return <MicOff className="w-4 h-4 text-destructive" />;
      case 'interrupted':
        return <Pause className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Mic className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'AI Speaking...';
      case 'error':
        return 'Error detected';
      case 'interrupted':
        return 'Paused';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return 'border-primary/50 bg-primary/5';
      case 'processing':
        return 'border-spiritual/50 bg-spiritual/5';
      case 'speaking':
        return 'border-accent/50 bg-accent/5';
      case 'error':
        return 'border-destructive/50 bg-destructive/5';
      case 'interrupted':
        return 'border-muted/50 bg-muted/5';
      default:
        return 'border-border/30 bg-background/50';
    }
  };

  return (
    <div className={cn(
      "relative backdrop-blur-sm border rounded-xl p-3 transition-all duration-300",
      getStatusColor(),
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-foreground">
            {getStatusText()}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Languages className="w-3 h-3" />
          <span className="font-mono">{language}</span>
        </div>
      </div>
      
      {transcript && (
        <div className="space-y-2">
          <div className="text-sm text-foreground/90 leading-relaxed">
            {transcript}
            {status === 'listening' && (
              <span className="inline-flex items-center ml-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              </span>
            )}
          </div>
          
          {confidence > 0 && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>Confidence:</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    confidence > 0.8 ? "bg-primary" : 
                    confidence > 0.6 ? "bg-spiritual" : "bg-destructive"
                  )}
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
              <span className="font-mono">{Math.round(confidence * 100)}%</span>
            </div>
          )}
        </div>
      )}
      
      {(status === 'listening' || status === 'speaking') && (
        <div className={cn(
          "absolute inset-0 rounded-xl opacity-20 animate-pulse",
          status === 'listening' ? "bg-primary" : "bg-accent"
        )} style={{ animationDuration: '2s' }} />
      )}
    </div>
  );
};