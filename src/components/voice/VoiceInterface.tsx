import React from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';
import { VoiceWaveform } from './VoiceWaveform';
import { useAdvancedVoice } from '@/hooks/useAdvancedVoice';
import { cn } from '@/lib/utils';

interface VoiceInterfaceProps {
  onTranscriptReceived?: (transcript: string) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  className?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTranscriptReceived,
  onSpeakingChange,
  className
}) => {
  const { voiceState, startListening, stopListening, speakText } = useAdvancedVoice();

  // Handle transcript updates
  React.useEffect(() => {
    if (voiceState.transcript && onTranscriptReceived) {
      onTranscriptReceived(voiceState.transcript);
    }
  }, [voiceState.transcript, onTranscriptReceived]);

  // Handle speaking state changes
  React.useEffect(() => {
    if (onSpeakingChange) {
      onSpeakingChange(voiceState.isSpeaking);
    }
  }, [voiceState.isSpeaking, onSpeakingChange]);

  const handleVoiceToggle = async () => {
    if (voiceState.isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Voice Status Indicator */}
      <VoiceStatusIndicator
        isConnected={voiceState.isConnected}
        isListening={voiceState.isListening}
        isProcessing={voiceState.isProcessing}
        isSpeaking={voiceState.isSpeaking}
        className="mb-2"
      />

      {/* Voice Waveform Visualization */}
      <div className="relative">
        <VoiceWaveform
          isActive={voiceState.isConnected}
          isListening={voiceState.isListening}
          className="absolute inset-0 pointer-events-none"
        />
        
        {/* Main Voice Button */}
        <Button
          onClick={handleVoiceToggle}
          disabled={voiceState.isProcessing}
          className={cn(
            "relative w-16 h-16 rounded-full transition-all duration-300 group",
            "hover:scale-105 active:scale-95 shadow-lg",
            voiceState.isListening
              ? "bg-primary hover:bg-primary/90 text-primary-foreground animate-pulse"
              : "bg-background hover:bg-muted border-2 border-primary/30 hover:border-primary",
            voiceState.isProcessing && "opacity-70 cursor-not-allowed"
          )}
          title={voiceState.isListening ? "Stop listening" : "Start voice input"}
        >
          {/* Microphone Icon */}
          <div className="relative flex items-center justify-center">
            {voiceState.isListening ? (
              <MicOff className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <Mic className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
            )}
            
            {/* Processing Indicator */}
            {voiceState.isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Voice Button Glow Effect */}
          {voiceState.isListening && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          )}
        </Button>
      </div>

      {/* Transcript Display */}
      {voiceState.transcript && (
        <div className="max-w-md p-3 bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-lg">
          <div className="flex items-start gap-2">
            <Send className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">{voiceState.transcript}</p>
              {voiceState.confidence > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${voiceState.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(voiceState.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {voiceState.error && (
        <div className="max-w-md p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{voiceState.error}</p>
        </div>
      )}

      {/* Voice Input Instructions */}
      <div className="text-center max-w-sm">
        <p className="text-xs text-muted-foreground">
          {voiceState.isListening 
            ? "Speak now... I'll stop listening when you're done"
            : "Click the microphone to start voice input"
          }
        </p>
      </div>
    </div>
  );
};