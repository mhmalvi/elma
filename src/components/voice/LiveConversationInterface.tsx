import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
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

  // Audio visualization component
  const AudioVisualizer = () => (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-primary rounded-full transition-all duration-300",
            isListening ? "animate-pulse" : "",
            `h-${Math.floor(Math.random() * 4) + 2}`
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: isListening ? `${Math.random() * 20 + 10}px` : '8px'
          }}
        />
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Control */}
      <div className="flex items-center justify-center">
        <Button
          onClick={handleToggleConversation}
          size="lg"
          variant={isActive ? "destructive" : "default"}
          className={cn(
            "w-20 h-20 rounded-full transition-all duration-300 shadow-lg",
            isActive && "animate-pulse shadow-xl",
            !isActive && "hover:shadow-xl hover:scale-105"
          )}
        >
          {isActive ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
      </div>

      {/* Status and Visualizer */}
      <div className="text-center space-y-2">
        {isActive ? (
          <>
            <p className="text-primary font-medium">
              {isListening ? "🎤 Listening..." : "💭 Processing..."}
            </p>
            <AudioVisualizer />
          </>
        ) : (
          <p className="text-muted-foreground">Tap to start live conversation</p>
        )}
      </div>

      {/* Live Transcript Display */}
      {sttState.transcript && isActive && (
        <div className="bg-secondary/30 rounded-lg p-3 border">
          <p className="text-sm text-muted-foreground mb-1">You said:</p>
          <p className="text-foreground">
            {sttState.transcript}
            {isListening && (
              <span className="animate-pulse text-primary">●</span>
            )}
          </p>
        </div>
      )}

      {/* Interrupt Button (shown when AI is speaking) */}
      {isSpeaking && isActive && (
        <div className="flex justify-center">
          <Button
            onClick={handleInterrupt}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 animate-fade-in"
          >
            <VolumeX className="w-4 h-4" />
            Interrupt
          </Button>
        </div>
      )}

      {/* Help Text */}
      {isActive && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Speak naturally • AI responds in real-time • Tap mic to stop
          </p>
        </div>
      )}
    </div>
  );
};