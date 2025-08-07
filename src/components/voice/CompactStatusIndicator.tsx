import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  Brain, 
  Volume2, 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CompactStatusType = 'idle' | 'listening' | 'processing' | 'speaking' | 'success' | 'error';

interface CompactStatusIndicatorProps {
  status: CompactStatusType;
  confidence?: number;
  language?: string;
  isOnline?: boolean;
  message?: string;
  provider?: 'elevenlabs' | 'browser' | null;
  className?: string;
}

export const CompactStatusIndicator = ({
  status,
  confidence = 0,
  language = 'en',
  isOnline = true,
  message,
  provider,
  className
}: CompactStatusIndicatorProps) => {
  
  const getStatusConfig = (status: CompactStatusType) => {
    switch (status) {
      case 'listening':
        return {
          icon: Mic,
          color: 'text-accent',
          bg: 'bg-accent/10',
          border: 'border-accent/30',
          text: 'Listening...',
          animation: 'animate-pulse'
        };
      case 'processing':
        return {
          icon: Brain,
          color: 'text-primary',
          bg: 'bg-primary/10',
          border: 'border-primary/30',
          text: 'Processing...',
          animation: 'animate-bounce'
        };
      case 'speaking':
        return {
          icon: Volume2,
          color: 'text-spiritual',
          bg: 'bg-spiritual/10',
          border: 'border-spiritual/30',
          text: provider === 'elevenlabs' ? 'ElevenLabs' : 'Browser TTS',
          animation: 'animate-pulse'
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'Complete',
          animation: ''
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          text: 'Error',
          animation: ''
        };
      default:
        return {
          icon: Headphones,
          color: 'text-muted-foreground',
          bg: 'bg-muted/30',
          border: 'border-muted',
          text: 'Ready',
          animation: ''
        };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;
  
  // Language display names
  const languageNames = {
    'en': 'EN',
    'ar': 'AR',
    'bn': 'BN',
    'ur': 'UR',
    'hi': 'HI',
    'tr': 'TR',
    'fr': 'FR',
    'de': 'DE'
  };

  return (
    <div className={cn(
      "flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-all duration-300",
      config.bg,
      config.border,
      className
    )}>
      {/* Status Section */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className={cn("flex items-center gap-1.5", config.animation)}>
          <StatusIcon className={cn("w-3.5 h-3.5 flex-shrink-0", config.color)} />
          <span className={cn("text-xs font-medium truncate", config.color)}>
            {message || config.text}
          </span>
        </div>

        {/* Confidence indicator for listening/processing */}
        {confidence > 0 && (status === 'listening' || status === 'processing') && (
          <div className="flex items-center gap-1">
            <Progress value={confidence * 100} className="h-1 w-8" />
            <span className="text-xs text-muted-foreground">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Right section: Language + Connection */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Language Badge */}
        <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
          {languageNames[language as keyof typeof languageNames] || language.toUpperCase()}
        </Badge>
        
        {/* Connection Status */}
        {isOnline ? (
          <Wifi className="w-3 h-3 text-green-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};