import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Languages, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useRealtimeSTT } from '@/hooks/useRealtimeSTT';
import { AIAvatar } from './AIAvatar';
import { RealTimeWaveform } from './RealTimeWaveform';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';
import { cn } from '@/lib/utils';

interface LiveConversationInterfaceProps {
  onTranscriptStream: (text: string, isFinal: boolean) => void;
  onInterrupt?: () => void;
  className?: string;
}

export const LiveConversationInterface = ({ 
  onTranscriptStream, 
  onInterrupt,
  className 
}: LiveConversationInterfaceProps) => {
  const { isActive, activateMode, deactivateMode } = useVoiceMode();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const streamTimeoutRef = useRef<NodeJS.Timeout>();

  const { sttState, startListening, stopListening, clearTranscript } = useRealtimeSTT();

  // Stream interim transcripts in real-time
  useEffect(() => {
    if (sttState.transcript && isListening) {
      console.log('[Live] Streaming interim transcript:', sttState.transcript);
      onTranscriptStream(sttState.transcript, false);
      
      // Clear previous timeout and set new one for streaming
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
      
      streamTimeoutRef.current = setTimeout(() => {
        if (sttState.transcript) {
          console.log('[Live] Finalizing streamed transcript');
          onTranscriptStream(sttState.transcript, true);
        }
      }, 1500); // Finalize after 1.5s of no new input
    }
  }, [sttState.transcript, isListening, onTranscriptStream]);

  // Handle final transcripts when listening stops
  useEffect(() => {
    if (!sttState.isListening && sttState.transcript) {
      console.log('[Live] Final transcript received:', sttState.transcript);
      onTranscriptStream(sttState.transcript, true);
      clearTranscript();
    }
  }, [sttState.isListening, sttState.transcript, onTranscriptStream, clearTranscript]);

  // Sync listening state
  useEffect(() => {
    setIsListening(sttState.isListening);
  }, [sttState.isListening]);

  const handleToggleConversation = useCallback(async () => {
    if (!isActive && !isListening) {
      console.log('[Live] Starting live conversation');
      activateMode();
      await startListening();
    } else {
      console.log('[Live] Stopping live conversation');
      stopListening();
      deactivateMode();
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
      }
    }
  }, [isActive, isListening, activateMode, deactivateMode, startListening, stopListening]);

  const handleInterrupt = useCallback(() => {
    console.log('[Live] User interrupting AI');
    setIsSpeaking(false);
    onInterrupt?.();
    
    // Resume listening after interruption
    if (isActive && !isListening) {
      startListening();
    }
  }, [isActive, isListening, startListening, onInterrupt]);

  // Enhanced Audio Visualizer
  const AudioVisualizer = () => (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 bg-gradient-to-t from-primary to-primary/60 rounded-full transition-all duration-300",
            isListening && "animate-pulse"
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isListening ? `${Math.random() * 24 + 12}px` : '8px',
            animationDuration: `${0.6 + Math.random() * 0.8}s`
          }}
        />
      ))}
    </div>
  );

  // Breathing circle animation
  const BreathingCircle = () => (
    <div className="absolute inset-0 rounded-full">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 rounded-full border-2 border-primary/30",
            isActive && "animate-ping"
          )}
          style={{
            animationDelay: `${i * 0.5}s`,
            animationDuration: '2s'
          }}
        />
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-8", className)}>
      {/* Enhanced Header with AI Presence */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex items-center justify-center gap-4">
          <AIAvatar 
            isListening={isListening}
            isSpeaking={isSpeaking}
            isThinking={!isListening && !isSpeaking && isActive}
            size="lg"
          />
          <div className="space-y-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-accent via-primary to-spiritual bg-clip-text text-transparent">
              Live AI Conversation
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Instant responses, natural flow
            </p>
          </div>
        </div>
        
        {/* Live Status & Language */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/30 backdrop-blur-sm">
            <Languages className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Multi-lingual</span>
          </div>
          
          {isActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-medium text-primary">Live Session</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Main Control with Waveform */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Waveform Effects */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RealTimeWaveform 
              isActive={isListening}
              variant="radial"
              color={isListening ? "primary" : "accent"}
              size="lg"
              bars={16}
            />
          </div>
        )}
        
        {/* Outer Ring Effects */}
        {isActive && (
          <>
            <div className="absolute w-44 h-44 border border-primary/20 rounded-full animate-ping" 
                 style={{ animationDuration: '2.5s' }} />
            <div className="absolute w-56 h-56 border border-accent/15 rounded-full animate-pulse" 
                 style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
            <div className="absolute w-68 h-68 border border-spiritual/10 rounded-full animate-pulse" 
                 style={{ animationDelay: '1s', animationDuration: '5s' }} />
          </>
        )}
        
        {/* Main Control Button */}
        <Button
          onClick={handleToggleConversation}
          size="lg"
          className={cn(
            "relative w-28 h-28 rounded-full transition-all duration-500 shadow-2xl",
            "border-4 border-background overflow-hidden group",
            isActive 
              ? "bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80 animate-pulse shadow-destructive/30" 
              : "bg-gradient-to-br from-accent via-primary to-spiritual hover:shadow-primary/40",
            !isActive && "hover:scale-110"
          )}
        >
          {/* Icon */}
          {isActive ? (
            <MicOff className="w-12 h-12 relative z-10 text-destructive-foreground" />
          ) : (
            <Mic className="w-12 h-12 relative z-10 text-white group-hover:animate-pulse" />
          )}
          
          {/* Dynamic Background Effects */}
          {!isActive && (
            <>
              <BreathingCircle />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </>
          )}
          
          {/* Active Ripple Effects */}
          {isActive && (
            <>
              <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" />
              <div className="absolute inset-2 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            </>
          )}
        </Button>
      </div>

      {/* Enhanced Status Display */}
      <div className="flex flex-col items-center space-y-4">
        {isActive ? (
          <div className="space-y-4 animate-fade-in w-full max-w-md">
            {/* Status Indicator */}
            <VoiceStatusIndicator
              status={
                isListening ? 'listening' :
                isSpeaking ? 'speaking' :
                'processing'
              }
              transcript={sttState.transcript}
              confidence={0.92}
            />
            
            {/* Real-time Audio Visualization */}
            <div className="flex justify-center">
              <RealTimeWaveform 
                isActive={isListening}
                variant="linear"
                color={isListening ? "primary" : "accent"}
                size="md"
                bars={11}
              />
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 animate-fade-in">
            <p className="text-lg font-medium text-muted-foreground">Ready for conversation</p>
            <p className="text-sm text-muted-foreground/70">Tap the button to begin instant AI chat</p>
          </div>
        )}
      </div>

      {/* Enhanced Live Transcript Display */}
      {sttState.transcript && isActive && (
        <div className={cn(
          "relative animate-scale-in max-w-lg mx-auto",
          "bg-gradient-to-br from-card/90 to-secondary/40",
          "rounded-2xl p-5 border border-border/40 shadow-xl backdrop-blur-sm"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Live Transcript
            </p>
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                isListening ? "bg-green-500 animate-pulse" : "bg-orange-500"
              )} />
              <span className="text-xs text-muted-foreground">
                {isListening ? 'Active' : 'Processing'}
              </span>
            </div>
          </div>
          
          {/* Transcript Content */}
          <p className="text-foreground/95 leading-relaxed text-base">
            {sttState.transcript}
            {isListening && (
              <span className="inline-flex items-center ml-1.5">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
              </span>
            )}
          </p>
          
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
        </div>
      )}

      {/* Enhanced Interrupt Button */}
      {isSpeaking && isActive && (
        <div className="flex justify-center animate-fade-in">
          <Button
            onClick={handleInterrupt}
            variant="outline"
            size="sm"
            className={cn(
              "group relative overflow-hidden",
              "border-destructive/50 hover:border-destructive",
              "text-destructive hover:text-destructive-foreground",
              "transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-destructive/20"
            )}
          >
            <VolumeX className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Interrupt AI
            <div className="absolute inset-0 bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      )}

      {/* Enhanced Help Text & Tips */}
      <div className="text-center space-y-2 animate-fade-in">
        {isActive ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              🎙️ Speak naturally • ⚡ Instant AI responses • 🛑 Tap to stop
            </p>
            <p className="text-xs text-muted-foreground/70">
              The AI will respond as soon as you pause
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-lg font-medium text-muted-foreground">
              ✨ Next-gen voice conversation
            </p>
            <p className="text-sm text-muted-foreground/80">
              Natural flow • Multi-lingual • Instant responses
            </p>
          </div>
        )}
      </div>
    </div>
  );
};