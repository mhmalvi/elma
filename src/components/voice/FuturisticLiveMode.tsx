import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PremiumAIAvatar } from './PremiumAIAvatar';
import { PremiumLanguageSelector } from './PremiumLanguageSelector';
import { PremiumWaveformVisualizer } from './PremiumWaveformVisualizer';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { useStreamingTTS } from '@/hooks/useStreamingTTS';
import { Mic, MicOff, Square, VolumeX, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FuturisticLiveModeProps {
  onTranscriptStream: (text: string, isFinal: boolean) => void;
  onInterrupt?: () => void;
  conversationState?: 'idle' | 'listening' | 'processing' | 'speaking';
  className?: string;
}

export const FuturisticLiveMode = ({
  onTranscriptStream,
  onInterrupt,
  conversationState = 'idle',
  className
}: FuturisticLiveModeProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showVisualFeedback, setShowVisualFeedback] = useState(false);
  
  const {
    sttState,
    startListening,
    stopListening,
    clearTranscript,
    changeLanguage
  } = useAdvancedVoiceSTT();

  const {
    isStreaming,
    startStreamingResponse,
    stopStreaming,
    currentProvider
  } = useStreamingTTS();

  // Handle transcript streaming to parent
  useEffect(() => {
    if (sttState.transcript || sttState.interimTranscript) {
      const fullTranscript = sttState.transcript + sttState.interimTranscript;
      const isFinal = Boolean(sttState.transcript && !sttState.isListening);
      onTranscriptStream(fullTranscript, isFinal);
    }
  }, [sttState.transcript, sttState.interimTranscript, sttState.isListening, onTranscriptStream]);

  // Auto-detect language changes
  useEffect(() => {
    if (sttState.detectedLanguage !== currentLanguage) {
      setCurrentLanguage(sttState.detectedLanguage);
    }
  }, [sttState.detectedLanguage, currentLanguage]);

  // Handle conversation state changes for visual feedback
  useEffect(() => {
    setShowVisualFeedback(conversationState !== 'idle');
  }, [conversationState]);

  const handleToggleConversation = async () => {
    if (isActive) {
      stopListening();
      stopStreaming();
      setIsActive(false);
    } else {
      clearTranscript();
      await startListening(currentLanguage);
      setIsActive(true);
    }
  };

  const handleInterrupt = useCallback(() => {
    stopStreaming();
    onInterrupt?.();
  }, [stopStreaming, onInterrupt]);

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    changeLanguage(language);

    // Restart listening with new language if active
    if (isActive) {
      stopListening();
      setTimeout(() => {
        startListening(language);
      }, 100);
    }
  };

  const getAvatarState = () => {
    if (conversationState === 'listening' || sttState.isListening) return 'listening';
    if (conversationState === 'speaking' || isStreaming) return 'speaking';
    if (conversationState === 'processing' || sttState.isProcessing) return 'thinking';
    return 'idle';
  };

  const getStatusText = () => {
    switch (conversationState) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return isActive ? 'Ready' : 'Tap to start';
    }
  };

  const getStatusColor = () => {
    switch (conversationState) {
      case 'listening': return 'text-blue-400';
      case 'processing': return 'text-yellow-400';
      case 'speaking': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      "w-full max-w-md mx-auto p-6 rounded-3xl",
      "bg-gradient-to-br from-background/95 to-background/80",
      "backdrop-blur-xl border border-primary/10",
      "relative overflow-hidden",
      className
    )}>
      {/* Ambient glow effect */}
      {showVisualFeedback && (
        <div className="absolute inset-0 rounded-3xl">
          <div className={cn(
            "absolute inset-0 rounded-3xl animate-pulse",
            conversationState === 'listening' && "bg-blue-500/10",
            conversationState === 'processing' && "bg-yellow-500/10", 
            conversationState === 'speaking' && "bg-green-500/10"
          )} />
        </div>
      )}

      {/* Language selector - minimal */}
      <div className="flex justify-between items-center mb-6">
        <PremiumLanguageSelector
          currentLanguage={currentLanguage}
          detectedLanguage={sttState.detectedLanguage}
          onLanguageChange={handleLanguageChange}
          isListening={sttState.isListening}
        />
        
        {currentProvider && (
          <Badge variant="outline" className="text-xs">
            {currentProvider}
          </Badge>
        )}
      </div>

      {/* Central avatar with dynamic states */}
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <PremiumAIAvatar
            isListening={getAvatarState() === 'listening'}
            isSpeaking={getAvatarState() === 'speaking'}
            isThinking={getAvatarState() === 'thinking'}
            size="lg"
          />
          
          {/* Dynamic pulse rings */}
          {isActive && (
            <>
              <div className={cn(
                "absolute inset-0 rounded-full border-2 animate-ping scale-110",
                conversationState === 'listening' && "border-blue-400/40",
                conversationState === 'processing' && "border-yellow-400/40",
                conversationState === 'speaking' && "border-green-400/40",
                conversationState === 'idle' && "border-primary/30"
              )} />
              <div className={cn(
                "absolute inset-0 rounded-full border animate-pulse scale-125",
                conversationState === 'listening' && "border-blue-400/20",
                conversationState === 'processing' && "border-yellow-400/20",
                conversationState === 'speaking' && "border-green-400/20",
                conversationState === 'idle' && "border-primary/20"
              )} />
            </>
          )}
        </div>

        {/* Immersive waveform visualization */}
        <div className="w-48 h-12">
          <PremiumWaveformVisualizer
            isActive={sttState.isListening || isStreaming}
            frequency={sttState.isListening ? 'high' : isStreaming ? 'medium' : 'low'}
            style="ambient"
            color="accent"
            bars={12}
          />
        </div>

        {/* Status indicator - minimal and elegant */}
        <div className="text-center space-y-2">
          <p className={cn("text-sm font-medium transition-colors", getStatusColor())}>
            {getStatusText()}
          </p>
          
          {sttState.confidence > 0 && conversationState === 'listening' && (
            <div className="flex items-center justify-center gap-2">
              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${sttState.confidence * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(sttState.confidence * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control buttons - minimal and contextual */}
      <div className="flex justify-center items-center gap-4 mt-6">
        {/* Interrupt button - only show when AI is speaking */}
        {(isStreaming || conversationState === 'speaking') && (
          <Button
            onClick={handleInterrupt}
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full border border-destructive/30 hover:bg-destructive/10"
          >
            <VolumeX className="w-4 h-4 text-destructive" />
          </Button>
        )}

        {/* Main conversation toggle */}
        <Button
          onClick={handleToggleConversation}
          className={cn(
            "h-16 w-16 rounded-full transition-all duration-300 shadow-lg",
            "hover:scale-105 active:scale-95",
            isActive
              ? "bg-destructive hover:bg-destructive/90 animate-pulse"
              : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
          )}
        >
          {isActive ? (
            <Square className="w-6 h-6" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* Error display - minimal */}
      {sttState.error && (
        <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-xs text-destructive text-center">
            {sttState.error}
          </p>
        </div>
      )}

      {/* Subtle help text */}
      {!isActive && (
        <p className="text-xs text-muted-foreground text-center mt-4 opacity-70">
          Tap to start a voice conversation
        </p>
      )}
    </div>
  );
};