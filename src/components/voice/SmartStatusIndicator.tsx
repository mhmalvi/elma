import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, Brain, CheckCircle, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
interface SmartStatusIndicatorProps {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'success';
  confidence?: number;
  language?: string;
  isOnline?: boolean;
  message?: string;
  wordCount?: number;
  characterCount?: number;
  className?: string;
}
export const SmartStatusIndicator = ({
  status,
  confidence = 0,
  language = 'en',
  isOnline = true,
  message,
  wordCount,
  characterCount,
  className
}: SmartStatusIndicatorProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          icon: Mic,
          color: 'primary',
          bgColor: 'bg-primary/10',
          text: 'Listening...',
          animation: 'animate-gentle-pulse'
        };
      case 'processing':
        return {
          icon: Brain,
          color: 'spiritual',
          bgColor: 'bg-spiritual/10',
          text: 'Processing...',
          animation: 'animate-spin'
        };
      case 'speaking':
        return {
          icon: Volume2,
          color: 'accent',
          bgColor: 'bg-accent/10',
          text: 'Speaking...',
          animation: 'animate-breathe'
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'spiritual',
          bgColor: 'bg-spiritual/10',
          text: 'Complete',
          animation: 'animate-scale-in'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'destructive',
          bgColor: 'bg-destructive/10',
          text: 'Error',
          animation: 'animate-gentle-pulse'
        };
      default:
        return {
          icon: MicOff,
          color: 'muted-foreground',
          bgColor: 'bg-muted/10',
          text: 'Ready',
          animation: ''
        };
    }
  };
  const config = getStatusConfig();
  const IconComponent = config.icon;
  
  return (
    <Card className={cn(
      "p-4 transition-all duration-300 w-full max-w-md",
      config.bgColor,
      className
    )}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full transition-all duration-300",
            `text-${config.color}`,
            config.animation
          )}>
            <IconComponent className="w-5 h-5" />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{config.text}</span>
              {!isOnline && <WifiOff className="w-3 h-3 text-muted-foreground" />}
            </div>
            
            {message && (
              <p className="text-xs text-muted-foreground">{message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {confidence > 0 && (
            <div className="flex items-center gap-1">
              <span>Accuracy:</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(confidence * 100)}%
              </Badge>
            </div>
          )}
          
          {(wordCount || characterCount) && (
            <div className="flex gap-3">
              {wordCount && <span>{wordCount} words</span>}
              {characterCount && <span>{characterCount} chars</span>}
            </div>
          )}
          
          <Badge variant="outline" className="text-xs">
            {language.toUpperCase()}
          </Badge>
        </div>
      </div>

      {confidence > 0 && confidence < 1 && (
        <div className="mt-3">
          <Progress value={confidence * 100} className="h-1" />
        </div>
      )}
    </Card>
  );
};