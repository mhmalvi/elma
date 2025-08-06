import React from 'react';
import { Mic, MicOff, Volume2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface VoiceStatusIndicatorProps {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  className?: string;
}

export const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  isConnected,
  isListening,
  isProcessing,
  isSpeaking,
  className
}) => {
  const getStatusText = () => {
    if (!isConnected) return "Disconnected";
    if (isSpeaking) return "AI Speaking";
    if (isProcessing) return "Processing...";
    if (isListening) return "Listening";
    return "Voice Ready";
  };

  const getStatusColor = () => {
    if (!isConnected) return "text-muted-foreground";
    if (isSpeaking) return "text-spiritual";
    if (isProcessing) return "text-primary";
    if (isListening) return "text-primary";
    return "text-muted-foreground";
  };

  const getIndicatorIcon = () => {
    if (!isConnected) return <WifiOff className="w-3 h-3" />;
    if (isSpeaking) return <Volume2 className="w-3 h-3" />;
    if (isListening) return <Mic className="w-3 h-3" />;
    return <Wifi className="w-3 h-3" />;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className={cn(
          "flex items-center gap-2 px-3 py-1 transition-all duration-300",
          "border border-border/50 bg-background/90 backdrop-blur-sm",
          getStatusColor()
        )}
      >
        <div className={cn(
          "flex items-center justify-center",
          isListening && "animate-pulse",
          isSpeaking && "animate-bounce"
        )}>
          {getIndicatorIcon()}
        </div>
        
        <span className="text-xs font-medium">
          {getStatusText()}
        </span>
        
        {(isListening || isSpeaking || isProcessing) && (
          <div className={cn(
            "w-2 h-2 rounded-full",
            isListening && "bg-primary animate-pulse",
            isSpeaking && "bg-spiritual animate-pulse",
            isProcessing && "bg-accent animate-spin"
          )} />
        )}
      </Badge>
      
      {/* Connection quality indicator */}
      {isConnected && (
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((bar) => (
            <div
              key={bar}
              className={cn(
                "w-1 rounded-full transition-all duration-300",
                "bg-primary/30",
                bar === 1 && "h-2",
                bar === 2 && "h-3", 
                bar === 3 && "h-4",
                isConnected && "bg-primary animate-pulse"
              )}
              style={{
                animationDelay: `${bar * 100}ms`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};