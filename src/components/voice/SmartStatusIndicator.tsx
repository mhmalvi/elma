import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff
} from 'lucide-react';
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
      "p-4 transition-all duration-500 bg-card/80 backdrop-blur-xl border border-border/50",
      "hover:bg-card/90 hover:shadow-lg",
      config.bgColor,
      className
    )}>
      <div className="space-y-4">
        {/* Main Status */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "relative p-2 rounded-xl transition-all duration-300",
            config.bgColor,
            config.animation
          )}>
            <IconComponent className={cn(
              "w-5 h-5",
              `text-${config.color}`
            )} />
            
            {status === 'processing' && (
              <Loader2 className="absolute inset-0 w-5 h-5 m-2 text-spiritual animate-spin" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm">{message || config.text}</h4>
              
              {/* Language indicator */}
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {language.toUpperCase()}
              </Badge>
              
              {/* Online status */}
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-spiritual" />
                ) : (
                  <WifiOff className="w-3 h-3 text-destructive" />
                )}
              </div>
            </div>
            
            {/* Confidence meter */}
            {confidence > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Confidence</span>
                  <span>{Math.round(confidence * 100)}%</span>
                </div>
                <Progress 
                  value={confidence * 100} 
                  className="h-1.5"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional metrics */}
        {(wordCount || characterCount) && (
          <div className="flex gap-4 text-xs text-muted-foreground border-t border-border/20 pt-3">
            {wordCount && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{wordCount}</span>
                <span>words</span>
              </div>
            )}
            {characterCount && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{characterCount}</span>
                <span>chars</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};