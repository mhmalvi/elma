import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useRealtimeSTT } from '@/hooks/useRealtimeSTT';
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
    <div className={cn("space-y-6", className)}>
      {/* Voice Mode Header */}
      <div className="text-center space-y-2 animate-fade-in">
        <div className="flex items-center justify-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Live Conversation Mode</h3>
        </div>
        <p className="text-sm text-muted-foreground">Real-time voice conversation with AI</p>
      </div>

      {/* Enhanced Main Control */}
      <div className="flex items-center justify-center relative">
        {/* Animated Background Effects */}
        {isActive && (
          <>
            <div className="absolute w-32 h-32 border border-primary/20 rounded-full animate-ping" 
                 style={{ animationDuration: '2s' }} />
            <div className="absolute w-40 h-40 border border-primary/10 rounded-full animate-pulse" 
                 style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
            <div className="absolute w-48 h-48 border border-primary/5 rounded-full animate-pulse" 
                 style={{ animationDelay: '1s', animationDuration: '4s' }} />
          </>
        )}
        
        <Button
          onClick={handleToggleConversation}
          size="lg"
          variant={isActive ? "destructive" : "default"}
          className={cn(
            "w-24 h-24 rounded-full transition-all duration-500 shadow-2xl relative overflow-hidden",
            "border-4 border-background",
            isActive 
              ? "bg-gradient-to-br from-destructive to-destructive/80 animate-pulse shadow-destructive/25" 
              : "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:shadow-primary/25",
            !isActive && "hover:scale-110"
          )}
        >
          {isActive ? (
            <MicOff className="w-10 h-10 relative z-10" />
          ) : (
            <Mic className="w-10 h-10 relative z-10" />
          )}
          
          {/* Breathing animation overlay */}
          {!isActive && <BreathingCircle />}
          
          {/* Ripple effect on active */}
          {isActive && (
            <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" />
          )}
        </Button>
      </div>

      {/* Enhanced Status and Visualizer */}
      <div className="text-center space-y-3 min-h-[4rem] flex flex-col items-center justify-center">
        {isActive ? (
          <div className="space-y-3 animate-fade-in">
            <p className="text-primary font-medium flex items-center justify-center gap-2">
              <span className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                isListening ? "bg-green-500 animate-pulse" : "bg-orange-500"
              )} />
              {isListening ? "Listening..." : "Processing..."}
            </p>
            <AudioVisualizer />
          </div>
        ) : (
          <div className="animate-fade-in">
            <p className="text-muted-foreground">Tap to start live conversation</p>
          </div>
        )}
      </div>

      {/* Enhanced Live Transcript Display */}
      {sttState.transcript && isActive && (
        <div className="bg-gradient-to-br from-secondary/60 to-secondary/40 rounded-xl p-4 border border-border/50 shadow-lg animate-scale-in">
          <p className="text-xs text-muted-foreground mb-2 font-medium">You said:</p>
          <p className="text-foreground leading-relaxed">
            {sttState.transcript}
            {isListening && (
              <span className="inline-flex items-center ml-1">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </span>
            )}
          </p>
        </div>
      )}

      {/* Enhanced Interrupt Button */}
      {isSpeaking && isActive && (
        <div className="flex justify-center animate-fade-in">
          <Button
            onClick={handleInterrupt}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg border-destructive/50 hover:border-destructive text-destructive hover:text-destructive"
          >
            <VolumeX className="w-4 h-4" />
            Interrupt
          </Button>
        </div>
      )}

      {/* Enhanced Help Text */}
      {isActive && (
        <div className="text-center animate-fade-in">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Speak naturally • AI responds in real-time • Tap mic to stop
          </p>
        </div>
      )}
      
      {!isActive && (
        <div className="text-center animate-fade-in">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Experience seamless voice conversation with instant AI responses
          </p>
        </div>
      )}
    </div>
  );
};