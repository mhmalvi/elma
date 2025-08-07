import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PremiumAIAvatar } from './PremiumAIAvatar';
import { PremiumLanguageSelector } from './PremiumLanguageSelector';
import { PremiumWaveformVisualizer } from './PremiumWaveformVisualizer';
import { SmartStatusIndicator } from './SmartStatusIndicator';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { useAdvancedTTS } from '@/hooks/useAdvancedTTS';
import { 
  Mic, 
  MicOff, 
  Square, 
  Volume2, 
  VolumeX,
  Pause,
  Play,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumLiveConversationInterfaceProps {
  onTranscriptStream: (text: string, isFinal: boolean) => void;
  onInterrupt?: () => void;
  className?: string;
}

export const PremiumLiveConversationInterface = ({
  onTranscriptStream,
  onInterrupt,
  className
}: PremiumLiveConversationInterfaceProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  const { 
    sttState, 
    startListening, 
    stopListening, 
    clearTranscript,
    changeLanguage 
  } = useAdvancedVoiceSTT();
  
  const { 
    ttsState, 
    speak, 
    stopSpeaking, 
    pauseResume 
  } = useAdvancedTTS();

  // Handle transcript streaming
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

  const handleToggleConversation = async () => {
    if (isActive) {
      stopListening();
      stopSpeaking();
      setIsActive(false);
    } else {
      clearTranscript();
      await startListening(currentLanguage);
      setIsActive(true);
    }
  };

  const handleInterrupt = () => {
    stopSpeaking();
    onInterrupt?.();
  };

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

  const getConversationStatus = () => {
    if (sttState.isProcessing) return 'processing';
    if (sttState.isListening) return 'listening';
    if (ttsState.isSpeaking) return 'speaking';
    if (sttState.error) return 'error';
    if (sttState.transcript) return 'success';
    return 'idle';
  };

  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto space-y-8 p-8 rounded-3xl",
      "bg-gradient-to-br from-card/80 via-background/90 to-secondary/20",
      "backdrop-blur-xl border border-border/30 shadow-2xl",
      className
    )}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-3 h-3 bg-primary rounded-full animate-gentle-pulse" />
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Live AI Conversation
          </h2>
          <div className="w-3 h-3 bg-accent rounded-full animate-gentle-pulse" />
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Natural, real-time voice conversation with instant AI responses
        </p>
      </div>

      {/* Language Selector */}
      <div className="flex justify-center">
        <PremiumLanguageSelector
          currentLanguage={currentLanguage}
          detectedLanguage={sttState.detectedLanguage}
          onLanguageChange={handleLanguageChange}
          isListening={sttState.isListening}
        />
      </div>

      {/* AI Avatar and Waveform */}
      <div className="relative flex flex-col items-center space-y-8">
        {/* AI Avatar */}
        <div className="relative">
          <PremiumAIAvatar
            isListening={sttState.isListening}
            isSpeaking={ttsState.isSpeaking}
            isThinking={sttState.isProcessing}
            size="xl"
          />
          
          {/* Connection indicator */}
          <div className="absolute -top-2 -right-2">
            <Badge 
              variant={isActive ? "default" : "secondary"}
              className="text-xs animate-fade-in"
            >
              {isActive ? 'Live' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* Waveform Visualizer */}
        <div className="w-64">
          <PremiumWaveformVisualizer
            isActive={sttState.isListening || ttsState.isSpeaking}
            frequency={sttState.isListening ? 'high' : 'medium'}
            style="ambient"
            color={sttState.isListening ? 'primary' : 'accent'}
            bars={12}
          />
        </div>

        {/* Main Control Button */}
        <div className="relative">
          <Button
            onClick={handleToggleConversation}
            size="lg"
            className={cn(
              "w-20 h-20 rounded-full transition-all duration-500 shadow-xl",
              "hover:scale-110 hover:shadow-2xl",
              isActive 
                ? "bg-destructive hover:bg-destructive/90 animate-gentle-pulse" 
                : "bg-gradient-primary hover:bg-primary/90"
            )}
          >
            {isActive ? (
              <Square className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
          
          {/* Action rings */}
          {isActive && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-gentle-pulse scale-125" />
            </>
          )}
        </div>

        {/* Interrupt Button (when AI is speaking) */}
        {ttsState.isSpeaking && (
          <Button
            onClick={handleInterrupt}
            variant="outline"
            size="sm"
            className="animate-slide-in-up border-accent/50 hover:bg-accent/10"
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Interrupt AI
          </Button>
        )}
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SmartStatusIndicator
          status={getConversationStatus()}
          confidence={sttState.confidence}
          language={currentLanguage}
          isOnline={true}
          wordCount={sttState.wordCount}
          characterCount={sttState.characterCount}
        />
        
        {/* TTS Progress */}
        {ttsState.isSpeaking && (
          <Card className="p-4 bg-card/80 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">AI Response</span>
                </div>
                <Button
                  onClick={pauseResume}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  {ttsState.isSpeaking ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
              </div>
              
              <Progress value={ttsState.playbackProgress} className="h-2" />
              
              <div className="text-xs text-muted-foreground">
                Speaking with premium voice synthesis
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Live Transcript Display */}
      {(sttState.transcript || sttState.interimTranscript) && (
        <Card className="p-6 bg-card/60 backdrop-blur-xl border border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Live Transcript</h4>
              <Button
                onClick={clearTranscript}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
            
            <div className="min-h-[80px] text-sm leading-relaxed">
              {sttState.transcript && (
                <span className="text-foreground">{sttState.transcript}</span>
              )}
              {sttState.interimTranscript && (
                <span className="text-muted-foreground italic">
                  {sttState.interimTranscript}
                </span>
              )}
            </div>
            
            {sttState.confidence > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <Progress value={sttState.confidence * 100} className="h-1 w-16" />
                <span>{Math.round(sttState.confidence * 100)}%</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {sttState.error && (
        <Card className="p-4 bg-destructive/10 border border-destructive/20">
          <div className="text-sm text-destructive text-center">
            {sttState.error}
          </div>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
        {!isActive ? (
          "Click the microphone to start a live conversation with AI. Speak naturally and get instant responses."
        ) : (
          "Conversation is live! Speak naturally, and I'll respond in real-time. Click stop to end the session."
        )}
      </div>
    </div>
  );
};