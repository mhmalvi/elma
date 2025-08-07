import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PremiumAIAvatar } from './PremiumAIAvatar';
import { PremiumLanguageSelector } from './PremiumLanguageSelector';
import { PremiumWaveformVisualizer } from './PremiumWaveformVisualizer';
import { CompactStatusIndicator } from './CompactStatusIndicator';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { useAdvancedTTS } from '@/hooks/useAdvancedTTS';
import { Mic, MicOff, Square, Volume2, VolumeX, Pause, Play, RotateCcw, MessageCircle } from 'lucide-react';
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
  return <div className={cn("w-full space-y-2 p-3 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-xl border border-primary/20", className)}>
      {/* Ultra Compact Live Mode Interface */}
      <div className="relative flex items-center justify-between gap-3">
        {/* Language Selector - Minimal */}
        <div className="flex-shrink-0">
          <PremiumLanguageSelector currentLanguage={currentLanguage} detectedLanguage={sttState.detectedLanguage} onLanguageChange={handleLanguageChange} isListening={sttState.isListening} />
        </div>

        {/* Central AI Avatar with Live Animations */}
        <div className="flex-1 flex flex-col items-center space-y-2">
          <div className="relative">
            <PremiumAIAvatar isListening={sttState.isListening} isSpeaking={ttsState.isSpeaking} isThinking={sttState.isProcessing} size="md" />
            {/* Live mode pulse rings */}
            {isActive && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping scale-110" />
                <div className="absolute inset-0 rounded-full border border-accent/20 animate-pulse scale-125" />
              </>
            )}
          </div>
          
          {/* Compact Waveform */}
          <div className="w-32 h-6">
            <PremiumWaveformVisualizer isActive={sttState.isListening || ttsState.isSpeaking} frequency={sttState.isListening ? 'high' : 'medium'} style="ambient" color="accent" bars={6} />
          </div>
        </div>

        {/* Control Button - Live Mode Style */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {ttsState.isSpeaking && (
            <Button onClick={handleInterrupt} variant="ghost" size="sm" className="h-8 w-8 rounded-xl border border-accent/30 hover:bg-accent/10">
              <VolumeX className="w-3 h-3" />
            </Button>
          )}
          
          <Button onClick={handleToggleConversation} className={cn("h-12 w-12 rounded-2xl transition-all duration-300 shadow-lg", "hover:scale-105", isActive ? "bg-destructive hover:bg-destructive/90 animate-pulse" : "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90")}>
            {isActive ? <Square className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Compact Status Row */}
      <div className="w-full">
        <CompactStatusIndicator 
          status={getConversationStatus()} 
          confidence={sttState.confidence} 
          language={currentLanguage} 
          isOnline={true}
          provider={ttsState.isSpeaking ? 'elevenlabs' : null}
          className="w-full" 
        />
      </div>

      {/* Live Transcript Display - Compact */}
      {(sttState.transcript || sttState.interimTranscript) && <Card className="p-3 bg-card/40 backdrop-blur-xl border border-accent/20 animate-slide-in-up">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xs text-accent">Live Transcript</h4>
              <Button onClick={clearTranscript} variant="ghost" size="sm" className="h-6 w-6 p-0 text-xs">
                <RotateCcw className="w-2.5 h-2.5" />
              </Button>
            </div>
            
            <div className="min-h-[40px] text-xs leading-relaxed">
              {sttState.transcript && <span className="text-foreground">{sttState.transcript}</span>}
              {sttState.interimTranscript && <span className="text-muted-foreground italic">
                  {sttState.interimTranscript}
                </span>}
            </div>
            
            {sttState.confidence > 0 && <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <Progress value={sttState.confidence * 100} className="h-1 w-12" />
                <span>{Math.round(sttState.confidence * 100)}%</span>
              </div>}
          </div>
        </Card>}

      {/* Error Display - Compact */}
      {sttState.error && <Card className="p-2 bg-destructive/10 border border-destructive/20">
          <div className="text-xs text-destructive text-center">
            {sttState.error}
          </div>
        </Card>}

      {/* Help Text */}
      
    </div>;
};