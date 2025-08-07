import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PremiumAIAvatar } from './PremiumAIAvatar';
import { PremiumLanguageSelector } from './PremiumLanguageSelector';
import { PremiumWaveformVisualizer } from './PremiumWaveformVisualizer';
import { useAdvancedLiveSession } from '@/hooks/useAdvancedLiveSession';
import { 
  Play, 
  Square, 
  VolumeX, 
  Zap, 
  Brain,
  Headphones,
  Mic,
  Sparkles,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveModeInterfaceProps {
  userId?: string;
  className?: string;
  onSessionStateChange?: (isActive: boolean) => void;
}

export const LiveModeInterface = ({
  userId,
  className,
  onSessionStateChange
}: LiveModeInterfaceProps) => {
  const {
    sessionState,
    startSession,
    endSession,
    interrupt,
    changeLanguage,
    isSessionActive
  } = useAdvancedLiveSession(userId);

  const [visualMode, setVisualMode] = useState<'immersive' | 'minimal'>('immersive');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Notify parent of session state changes
  useEffect(() => {
    onSessionStateChange?.(isSessionActive);
  }, [isSessionActive, onSessionStateChange]);

  // Dynamic visual themes based on conversation state
  const getThemeColors = useCallback(() => {
    switch (sessionState.conversationState) {
      case 'listening':
        return {
          primary: 'from-blue-400/30 to-cyan-400/30',
          accent: 'border-blue-400/40',
          text: 'text-blue-400',
          glow: 'shadow-blue-400/30',
          bg: 'bg-blue-500/5'
        };
      case 'processing':
        return {
          primary: 'from-yellow-400/30 to-orange-400/30',
          accent: 'border-yellow-400/40',
          text: 'text-yellow-400',
          glow: 'shadow-yellow-400/30',
          bg: 'bg-yellow-500/5'
        };
      case 'speaking':
        return {
          primary: 'from-green-400/30 to-emerald-400/30',
          accent: 'border-green-400/40',
          text: 'text-green-400',
          glow: 'shadow-green-400/30',
          bg: 'bg-green-500/5'
        };
      default:
        return {
          primary: 'from-primary/20 to-accent/20',
          accent: 'border-primary/30',
          text: 'text-primary',
          glow: 'shadow-primary/20',
          bg: 'bg-primary/5'
        };
    }
  }, [sessionState.conversationState]);

  const getStatusText = useCallback(() => {
    if (!isSessionActive) return 'Start Live Conversation';
    
    switch (sessionState.conversationState) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Understanding...';
      case 'speaking':
        return 'Speaking...';
      default:
        return `Live Mode Active • Turn ${sessionState.turnCount}`;
    }
  }, [isSessionActive, sessionState.conversationState, sessionState.turnCount]);

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

  if (visualMode === 'minimal') {
    return (
      <div className={cn("w-full max-w-md mx-auto", className)}>
        <Card className={cn(
          "p-6 backdrop-blur-xl border-2 transition-all duration-500",
          "bg-gradient-to-br from-background/95 to-background/90",
          theme.accent,
          isSessionActive && theme.bg
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PremiumAIAvatar
                isListening={getAvatarState() === 'listening'}
                isSpeaking={getAvatarState() === 'speaking'}
                isThinking={getAvatarState() === 'thinking'}
                size="sm"
              />
              
              <div>
                <p className={cn("text-sm font-medium", theme.text)}>
                  {getStatusText()}
                </p>
                {sessionState.turnCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Turn {sessionState.turnCount}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sessionState.conversationState === 'speaking' && (
                <Button
                  onClick={interrupt}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-destructive"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                onClick={handleToggleSession}
                variant={isSessionActive ? "destructive" : "default"}
                size="sm"
                className="h-8 w-8"
              >
                {isSessionActive ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-xl mx-auto relative", className)}>
      {/* Main immersive interface */}
      <div className={cn(
        "relative p-10 rounded-3xl backdrop-blur-2xl border-2 transition-all duration-700",
        "bg-gradient-to-br from-background/95 to-background/85",
        theme.accent,
        isSessionActive && "animate-pulse-subtle"
      )}>
        
        {/* Ambient background glow */}
        {isSessionActive && (
          <div className={cn(
            "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-40 animate-pulse",
            theme.primary
          )} />
        )}

        {/* Floating particles effect */}
        {isSessionActive && (
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-2 h-2 rounded-full opacity-20 animate-float",
                  theme.text.replace('text-', 'bg-')
                )}
                style={{
                  left: `${20 + (i * 12)}%`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + (i * 0.2)}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Header controls */}
        <div className="relative z-10 flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Badge 
              variant={isSessionActive ? "default" : "outline"}
              className={cn(
                "text-xs font-semibold tracking-wide px-3 py-1",
                isSessionActive && cn(theme.text, "animate-pulse")
              )}
            >
              {isSessionActive ? "🔴 LIVE" : "⚫ OFFLINE"}
            </Badge>
            
            {sessionState.turnCount > 0 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                <Brain className="w-3 h-3 mr-1" />
                {sessionState.turnCount} turns
              </Badge>
            )}

            {sessionState.conversationHistory.length > 0 && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                {sessionState.conversationHistory.length} exchanges
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
        <div className="relative z-10 flex flex-col items-center space-y-8">
          
          {/* AI Avatar with dynamic activity rings */}
          <div className="relative">
            <PremiumAIAvatar
              isListening={getAvatarState() === 'listening'}
              isSpeaking={getAvatarState() === 'speaking'}
              isThinking={getAvatarState() === 'thinking'}
              size="xl"
              className={cn(
                "transition-all duration-500",
                isSessionActive && cn(theme.glow, "shadow-2xl")
              )}
            />
            
            {/* Multi-layer activity rings */}
            {isSessionActive && (
              <>
                <div className={cn(
                  "absolute inset-0 rounded-full border-2 animate-ping",
                  theme.accent.replace('border-', 'border-').replace('/40', '/60'),
                  "scale-110"
                )} />
                <div className={cn(
                  "absolute inset-0 rounded-full border animate-pulse",
                  theme.accent.replace('border-', 'border-').replace('/40', '/30'),
                  "scale-125"
                )} />
                <div className={cn(
                  "absolute inset-0 rounded-full border animate-pulse",
                  theme.accent.replace('border-', 'border-').replace('/40', '/20'),
                  "scale-140"
                )} 
                style={{ animationDelay: '1s' }} />
                
                {/* Voice activity indicators */}
                {sessionState.conversationState === 'listening' && (
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-blue-500 rounded-full animate-bounce flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {sessionState.conversationState === 'speaking' && (
                  <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-green-500 rounded-full animate-bounce flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {sessionState.conversationState === 'processing' && (
                  <div className="absolute -top-3 -left-3 w-6 h-6 bg-yellow-500 rounded-full animate-spin flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Immersive waveform visualization */}
          <div className="w-80 h-20">
            <PremiumWaveformVisualizer
              isActive={isSessionActive}
              frequency={
                sessionState.conversationState === 'listening' ? 'high' :
                sessionState.conversationState === 'speaking' ? 'medium' : 'low'
              }
              style="ambient"
              color="spiritual"
              bars={20}
              className="opacity-80"
            />
          </div>

          {/* Status display with enhanced typography */}
          <div className="text-center space-y-3">
            <h2 className={cn(
              "text-2xl font-bold transition-all duration-500 tracking-wide",
              theme.text,
              isSessionActive && "animate-pulse-text"
            )}>
              {getStatusText()}
            </h2>
            
            {isSessionActive && (
              <p className="text-sm text-muted-foreground">
                {sessionState.conversationState === 'listening' && "I'm ready to hear your thoughts..."}
                {sessionState.conversationState === 'processing' && "Processing your message with AI wisdom..."}
                {sessionState.conversationState === 'speaking' && "Sharing insights from Islamic teachings..."}
              </p>
            )}
          </div>
        </div>

        {/* Enhanced control panel */}
        <div className="relative z-10 flex justify-center items-center gap-6 mt-10">
          
          {/* Interrupt button (only when AI is speaking) */}
          {sessionState.conversationState === 'speaking' && (
            <Button
              onClick={interrupt}
              variant="ghost"
              className={cn(
                "h-14 w-14 rounded-full border-2 transition-all duration-300",
                "border-destructive/40 hover:bg-destructive/10 hover:scale-110",
                "active:scale-95 backdrop-blur-xl"
              )}
            >
              <VolumeX className="w-6 h-6 text-destructive" />
            </Button>
          )}

          {/* Main session toggle with enhanced styling */}
          <Button
            onClick={handleToggleSession}
            className={cn(
              "h-24 w-24 rounded-full transition-all duration-700 shadow-2xl",
              "hover:scale-110 active:scale-95 relative overflow-hidden group",
              "backdrop-blur-xl border-2",
              isSessionActive
                ? "bg-gradient-to-r from-destructive via-red-600 to-destructive hover:from-destructive/90 hover:to-red-600/90 border-destructive/50"
                : "bg-gradient-to-r from-primary via-accent to-primary hover:from-primary/90 hover:to-accent/90 border-primary/50"
            )}
          >
            {/* Button glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500",
              isSessionActive ? "bg-destructive/30" : "bg-primary/30",
              "animate-pulse blur-md"
            )} />
            
            <div className="relative z-10">
              {isSessionActive ? (
                <Square className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </div>
          </Button>

          {/* Advanced controls toggle */}
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="ghost"
            className={cn(
              "h-14 w-14 rounded-full border-2 transition-all duration-300",
              "border-primary/40 hover:bg-primary/10 hover:scale-110",
              showAdvanced && "bg-primary/10 border-primary/60",
              "backdrop-blur-xl"
            )}
          >
            <Zap className="w-6 h-6 text-primary" />
          </Button>
        </div>

        {/* Advanced controls panel */}
        {showAdvanced && (
          <div className="relative z-10 mt-8 p-6 rounded-2xl bg-background/60 border border-primary/20 backdrop-blur-xl">
            <div className="flex justify-center items-center gap-4">
              <Button
                onClick={() => setVisualMode('minimal')}
                variant="outline"
                size="sm"
                className="text-xs backdrop-blur-sm"
              >
                Minimal Mode
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-xs backdrop-blur-sm"
                disabled
              >
                Coming Soon: Voice Settings
              </Button>
            </div>
          </div>
        )}

        {/* Error display */}
        {sessionState.error && (
          <div className="relative z-10 mt-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 backdrop-blur-xl">
            <p className="text-sm text-destructive text-center font-medium">
              {sessionState.error}
            </p>
          </div>
        )}

        {/* Elegant help text */}
        {!isSessionActive && (
          <div className="relative z-10 text-center mt-6 space-y-2">
            <p className="text-sm text-muted-foreground opacity-80">
              Experience the future of AI conversation
            </p>
            <p className="text-xs text-muted-foreground opacity-60">
              Natural • Intelligent • Islamic Guidance
            </p>
          </div>
        )}
      </div>
    </div>
  );
};