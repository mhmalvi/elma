import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumAIAvatar } from './PremiumAIAvatar';
import { PremiumLanguageSelector } from './PremiumLanguageSelector';
import { PremiumWaveformVisualizer } from './PremiumWaveformVisualizer';
import { useContinuousVoiceSession } from '@/hooks/useContinuousVoiceSession';
import { 
  Play, 
  Square, 
  VolumeX, 
  Zap, 
  Brain,
  Headphones,
  Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContinuousLiveInterfaceProps {
  userId?: string;
  className?: string;
  onSessionStateChange?: (isActive: boolean) => void;
}

export const ContinuousLiveInterface = ({
  userId,
  className,
  onSessionStateChange
}: ContinuousLiveInterfaceProps) => {
  const {
    sessionState,
    activityState,
    startSession,
    endSession,
    interrupt,
    changeLanguage,
    isSessionActive
  } = useContinuousVoiceSession(userId);

  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [visualMode, setVisualMode] = useState<'minimal' | 'immersive'>('immersive');

  // Notify parent of session state changes
  useEffect(() => {
    onSessionStateChange?.(isSessionActive);
  }, [isSessionActive, onSessionStateChange]);

  // Dynamic visual themes based on conversation state
  const getThemeColors = useCallback(() => {
    switch (sessionState.conversationState) {
      case 'listening':
        return {
          primary: 'from-blue-500/20 to-cyan-500/20',
          accent: 'border-blue-400/30',
          text: 'text-blue-400',
          glow: 'shadow-blue-500/20'
        };
      case 'processing':
        return {
          primary: 'from-yellow-500/20 to-orange-500/20',
          accent: 'border-yellow-400/30',
          text: 'text-yellow-400',
          glow: 'shadow-yellow-500/20'
        };
      case 'speaking':
        return {
          primary: 'from-green-500/20 to-emerald-500/20',
          accent: 'border-green-400/30',
          text: 'text-green-400',
          glow: 'shadow-green-500/20'
        };
      default:
        return {
          primary: 'from-primary/10 to-accent/10',
          accent: 'border-primary/20',
          text: 'text-primary',
          glow: 'shadow-primary/20'
        };
    }
  }, [sessionState.conversationState]);

  const getStatusText = useCallback(() => {
    if (!isSessionActive) return 'Tap to begin conversation';
    
    switch (sessionState.conversationState) {
      case 'listening':
        return activityState.userSpeaking ? 'I hear you...' : 'Listening...';
      case 'processing':
        return 'Understanding...';
      case 'speaking':
        return 'Speaking...';
      default:
        return `Ready • Turn ${sessionState.turnCount}`;
    }
  }, [isSessionActive, sessionState.conversationState, sessionState.turnCount, activityState.userSpeaking]);

  const getAvatarState = useCallback(() => {
    if (sessionState.conversationState === 'listening') return 'listening';
    if (sessionState.conversationState === 'speaking') return 'speaking';
    if (sessionState.conversationState === 'processing') return 'thinking';
    return 'idle';
  }, [sessionState.conversationState]);

  const handleToggleSession = async () => {
    if (isSessionActive) {
      endSession();
    } else {
      await startSession();
    }
  };

  const theme = getThemeColors();

  return (
    <div className={cn(
      "w-full max-w-lg mx-auto relative",
      className
    )}>
      {/* Futuristic container */}
      <div className={cn(
        "relative p-8 rounded-3xl backdrop-blur-xl border-2",
        "bg-gradient-to-br from-background/95 to-background/85",
        theme.accent,
        isSessionActive && "animate-pulse-slow"
      )}>
        
        {/* Dynamic background glow */}
        {isSessionActive && (
          <div className={cn(
            "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-50 animate-pulse",
            theme.primary
          )} />
        )}

        {/* Header controls */}
        <div className="relative z-10 flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Badge 
              variant={isSessionActive ? "default" : "outline"}
              className={cn(
                "text-xs font-medium",
                isSessionActive && theme.text
              )}
            >
              {isSessionActive ? "LIVE" : "OFFLINE"}
            </Badge>
            
            {sessionState.turnCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Turn {sessionState.turnCount}
              </Badge>
            )}
          </div>

          <PremiumLanguageSelector
            currentLanguage={sessionState.currentLanguage}
            onLanguageChange={changeLanguage}
            isListening={sessionState.conversationState === 'listening'}
          />
        </div>

        {/* Central avatar and visualization */}
        <div className="relative z-10 flex flex-col items-center space-y-6">
          
          {/* AI Avatar with dynamic rings */}
          <div className="relative">
            <PremiumAIAvatar
              isListening={getAvatarState() === 'listening'}
              isSpeaking={getAvatarState() === 'speaking'}
              isThinking={getAvatarState() === 'thinking'}
              size="xl"
              className={cn(isSessionActive && theme.glow)}
            />
            
            {/* Pulsing activity rings */}
            {isSessionActive && (
              <>
                <div className={cn(
                  "absolute inset-0 rounded-full border-2 animate-ping scale-110",
                  theme.accent.replace('border-', 'border-').replace('/30', '/40')
                )} />
                <div className={cn(
                  "absolute inset-0 rounded-full border animate-pulse scale-125",
                  theme.accent.replace('border-', 'border-').replace('/30', '/20')
                )} />
                
                {/* Voice activity indicator */}
                {activityState.userSpeaking && (
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-bounce">
                    <Mic className="w-3 h-3 text-white m-0.5" />
                  </div>
                )}
                
                {activityState.aiSpeaking && (
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-500 rounded-full animate-bounce">
                    <Headphones className="w-3 h-3 text-white m-0.5" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Immersive waveform visualization */}
          <div className="w-64 h-16">
          <PremiumWaveformVisualizer
            isActive={isSessionActive}
            frequency={
              sessionState.conversationState === 'listening' ? 'high' :
              sessionState.conversationState === 'speaking' ? 'medium' : 'low'
            }
            style="ambient"
            color="spiritual"
            bars={16}
          />
          </div>

          {/* Status display */}
          <div className="text-center space-y-2">
            <p className={cn(
              "text-lg font-medium transition-all duration-300",
              theme.text,
              isSessionActive && "animate-pulse-text"
            )}>
              {getStatusText()}
            </p>
            
            {/* Conversation history indicator */}
            {sessionState.conversationHistory.length > 0 && (
              <div className="flex justify-center items-center gap-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {sessionState.conversationHistory.length} exchanges
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Control panel */}
        <div className="relative z-10 flex justify-center items-center gap-4 mt-8">
          
          {/* Interrupt button (only when AI is speaking) */}
          {sessionState.conversationState === 'speaking' && (
            <Button
              onClick={interrupt}
              variant="ghost"
              size="sm"
              className={cn(
                "h-12 w-12 rounded-full border-2 transition-all duration-300",
                "border-destructive/30 hover:bg-destructive/10 hover:scale-105",
                "active:scale-95"
              )}
            >
              <VolumeX className="w-5 h-5 text-destructive" />
            </Button>
          )}

          {/* Main session toggle */}
          <Button
            onClick={handleToggleSession}
            className={cn(
              "h-20 w-20 rounded-full transition-all duration-500 shadow-2xl",
              "hover:scale-110 active:scale-95",
              "relative overflow-hidden group",
              isSessionActive
                ? "bg-gradient-to-r from-destructive to-red-600 hover:from-destructive/90 hover:to-red-600/90"
                : "bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:via-accent/90 hover:to-primary/90"
            )}
          >
            {/* Button glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              isSessionActive ? "bg-destructive/20" : "bg-primary/20",
              "animate-pulse"
            )} />
            
            <div className="relative z-10">
              {isSessionActive ? (
                <Square className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </div>
          </Button>

          {/* Advanced controls toggle */}
          <Button
            onClick={() => setShowAdvancedControls(!showAdvancedControls)}
            variant="ghost"
            size="sm"
            className={cn(
              "h-12 w-12 rounded-full border-2 transition-all duration-300",
              "border-primary/30 hover:bg-primary/10 hover:scale-105",
              showAdvancedControls && "bg-primary/10"
            )}
          >
            <Zap className="w-5 h-5 text-primary" />
          </Button>
        </div>

        {/* Advanced controls panel */}
        {showAdvancedControls && (
          <div className="relative z-10 mt-6 p-4 rounded-2xl bg-background/50 border border-primary/20">
            <div className="flex justify-center items-center gap-4">
              <Button
                onClick={() => setVisualMode(visualMode === 'minimal' ? 'immersive' : 'minimal')}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {visualMode === 'minimal' ? 'Immersive' : 'Minimal'} Mode
              </Button>
            </div>
          </div>
        )}

        {/* Error display */}
        {sessionState.error && (
          <div className="relative z-10 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive text-center">
              {sessionState.error}
            </p>
          </div>
        )}

        {/* Subtle help text */}
        {!isSessionActive && (
          <p className="relative z-10 text-xs text-muted-foreground text-center mt-4 opacity-70">
            Start a continuous voice conversation with AI
          </p>
        )}
      </div>
    </div>
  );
};