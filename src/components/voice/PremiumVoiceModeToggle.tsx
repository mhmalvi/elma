import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MessageSquare, 
  Edit3, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMode {
  id: 'dictation' | 'live';
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  badge?: string;
}

const VOICE_MODES: VoiceMode[] = [
  {
    id: 'dictation',
    icon: Edit3,
    title: 'Voice Memo',
    subtitle: 'Dictation Mode',
    description: 'Record, review, and edit your voice notes before sending',
    features: ['Review & Edit', 'Manual Send', 'High Accuracy'],
    badge: 'Precision'
  },
  {
    id: 'live',
    icon: Zap,
    title: 'Live Chat',
    subtitle: 'Real-time Mode',
    description: 'Natural conversation flow with instant AI responses',
    features: ['Real-time', 'Auto-response', 'Voice-to-Voice'],
    badge: 'Premium'
  }
];

interface PremiumVoiceModeToggleProps {
  currentMode: 'dictation' | 'live' | null;
  onModeChange: (mode: 'dictation' | 'live') => void;
  isActive?: boolean;
  className?: string;
}

export const PremiumVoiceModeToggle = ({
  currentMode,
  onModeChange,
  isActive = false,
  className
}: PremiumVoiceModeToggleProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
          Voice Interaction Mode
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred conversation style
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {VOICE_MODES.map((mode) => {
          const IconComponent = mode.icon;
          const isSelected = currentMode === mode.id;
          
          return (
            <Card
              key={mode.id}
              className={cn(
                "relative p-4 cursor-pointer transition-all duration-300 group",
                "hover:scale-[1.02] hover:shadow-lg",
                "bg-card/80 backdrop-blur-sm border border-border/50",
                "max-w-xs mx-auto",
                isSelected && "border-primary/50 bg-primary/5 shadow-md",
                isSelected && isActive && "animate-gentle-pulse"
              )}
              onClick={() => onModeChange(mode.id)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-2 rounded-lg transition-all duration-300",
                    isSelected ? "bg-primary/20" : "bg-muted/50",
                    "group-hover:scale-105"
                  )}>
                    <IconComponent className={cn(
                      "w-5 h-5 transition-colors duration-300",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  
                  {mode.badge && (
                    <Badge 
                      variant={isSelected ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {mode.badge}
                    </Badge>
                  )}
                </div>

                {/* Title & Description */}
                <div className="space-y-1">
                  <div>
                    <h4 className="font-medium text-sm text-foreground">
                      {mode.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {mode.subtitle}
                    </p>
                  </div>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {mode.description}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Features:
                  </div>
                  <div className="space-y-1">
                    {mode.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <ChevronRight className="w-3 h-3 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action indicator */}
                <div className={cn(
                  "flex items-center justify-center pt-2 border-t border-border/20 transition-all duration-300",
                  isSelected && "border-primary/20"
                )}>
                  <Button
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "text-xs transition-all duration-300",
                      isSelected && "animate-gentle-pulse"
                    )}
                  >
                    {isSelected ? 'Active Mode' : 'Select Mode'}
                  </Button>
                </div>
              </div>

              {/* Glow effect for selected */}
              {isSelected && (
                <div className="absolute inset-0 rounded-lg bg-primary/5 blur-xl pointer-events-none" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Status indicator */}
      {currentMode && (
        <div className="text-center">
          <Badge variant="outline" className="text-xs px-3 py-1">
            <Mic className="w-3 h-3 mr-1" />
            {VOICE_MODES.find(m => m.id === currentMode)?.title} Mode Active
          </Badge>
        </div>
      )}
    </div>
  );
};