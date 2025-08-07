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
  return;
};