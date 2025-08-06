import React, { useState, useCallback, useEffect } from 'react';
import { Mic, Square, Send, Edit3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useRealtimeSTT } from '@/hooks/useRealtimeSTT';
import { cn } from '@/lib/utils';

interface DictationModeInterfaceProps {
  onTranscriptComplete: (text: string) => void;
  className?: string;
}

export const DictationModeInterface = ({ onTranscriptComplete, className }: DictationModeInterfaceProps) => {
  const { isActive, activateMode, deactivateMode, settings } = useVoiceMode();
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [showProcessing, setShowProcessing] = useState(false);

  const { sttState, startListening, stopListening, clearTranscript } = useRealtimeSTT();

  // Handle transcript changes
  useEffect(() => {
    if (sttState.transcript && !sttState.isListening) {
      console.log('[Dictation] Final transcript received:', sttState.transcript);
      setFinalTranscript(sttState.transcript);
      setIsRecording(false);
      setShowProcessing(false);
      
      if (settings.autoSend) {
        onTranscriptComplete(sttState.transcript);
        handleReset();
      }
    }
  }, [sttState.transcript, sttState.isListening, settings.autoSend, onTranscriptComplete]);

  // Handle recording state changes
  useEffect(() => {
    if (sttState.isListening !== isRecording) {
      setIsRecording(sttState.isListening);
      if (!sttState.isListening && sttState.transcript) {
        setShowProcessing(true);
      }
    }
  }, [sttState.isListening, isRecording]);

  const handleStartRecording = useCallback(async () => {
    console.log('[Dictation] Starting recording');
    setFinalTranscript('');
    setEditMode(false);
    setShowProcessing(false);
    clearTranscript();
    
    activateMode();
    await startListening();
  }, [activateMode, startListening, clearTranscript]);

  const handleStopRecording = useCallback(() => {
    console.log('[Dictation] Stopping recording');
    stopListening();
    setShowProcessing(true);
  }, [stopListening]);

  const handleEdit = useCallback(() => {
    setEditedText(finalTranscript);
    setEditMode(true);
  }, [finalTranscript]);

  const handleSaveEdit = useCallback(() => {
    setFinalTranscript(editedText);
    setEditMode(false);
  }, [editedText]);

  const handleSendTranscript = useCallback(() => {
    const textToSend = editMode ? editedText : finalTranscript;
    if (textToSend.trim()) {
      onTranscriptComplete(textToSend);
      handleReset();
    }
  }, [editMode, editedText, finalTranscript, onTranscriptComplete]);

  const handleReset = useCallback(() => {
    setFinalTranscript('');
    setEditMode(false);
    setEditedText('');
    setIsRecording(false);
    setShowProcessing(false);
    clearTranscript();
    deactivateMode();
  }, [clearTranscript, deactivateMode]);

  const currentTranscript = editMode ? editedText : (finalTranscript || sttState.transcript);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Voice Mode Header */}
      <div className="text-center space-y-2 animate-fade-in">
        <div className="flex items-center justify-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Voice Memo Mode</h3>
        </div>
        <p className="text-sm text-muted-foreground">Record your message, then review and send</p>
      </div>

      {/* Central Recording Area */}
      <div className="flex items-center justify-center relative">
        {/* Animated Background Rings */}
        {isRecording && (
          <>
            <div className="absolute w-32 h-32 border-2 border-primary/30 rounded-full animate-ping" />
            <div className="absolute w-40 h-40 border border-primary/20 rounded-full animate-pulse" 
                 style={{ animationDelay: '0.5s' }} />
            <div className="absolute w-48 h-48 border border-primary/10 rounded-full animate-pulse" 
                 style={{ animationDelay: '1s' }} />
          </>
        )}
        
        {/* Main Recording Button */}
        {!isRecording && !finalTranscript ? (
          <Button
            onClick={handleStartRecording}
            size="lg"
            className={cn(
              "w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70 transition-all duration-500",
              "shadow-2xl hover:shadow-primary/25 hover:scale-110",
              "border-4 border-background relative overflow-hidden"
            )}
          >
            <Mic className="w-8 h-8 text-primary-foreground relative z-10" />
            <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </Button>
        ) : isRecording ? (
          <Button
            onClick={handleStopRecording}
            size="lg"
            variant="destructive"
            className={cn(
              "w-20 h-20 rounded-full transition-all duration-500 shadow-2xl",
              "animate-pulse hover:scale-105 relative overflow-hidden",
              "bg-gradient-to-br from-destructive to-destructive/80"
            )}
          >
            <Square className="w-8 h-8 relative z-10" />
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          </Button>
        ) : (
          /* Success State */
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center animate-scale-in shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Status Display */}
      <div className="text-center min-h-[3rem] flex items-center justify-center">
        {isRecording && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-primary font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Listening... Speak your message
            </p>
            {/* Audio Wave Visualization */}
            <div className="flex items-center justify-center space-x-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 16 + 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.5 + Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {showProcessing && !isRecording && (
          <div className="animate-fade-in">
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Processing your voice...
            </p>
          </div>
        )}
        {finalTranscript && !editMode && !showProcessing && (
          <div className="animate-scale-in">
            <p className="text-green-600 font-medium flex items-center justify-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              Ready to send
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Transcript Display/Edit */}
      {currentTranscript && (
        <div className="space-y-4 animate-fade-in">
          {editMode ? (
            <div className="space-y-3">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Edit your message..."
                className="min-h-[120px] resize-none border-2 border-primary/20 focus:border-primary/40 transition-colors duration-300"
                autoFocus
              />
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleSaveEdit} 
                  size="sm" 
                  variant="default"
                  className="transition-all duration-300 hover:scale-105"
                >
                  Save Changes
                </Button>
                <Button 
                  onClick={() => setEditMode(false)} 
                  size="sm" 
                  variant="outline"
                  className="transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-secondary/60 to-secondary/40 rounded-xl p-6 border border-border/50 shadow-lg">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{currentTranscript}</p>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          {finalTranscript && !editMode && (
            <div className="flex gap-3 justify-center animate-fade-in">
              <Button 
                onClick={handleEdit} 
                size="sm" 
                variant="outline"
                className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button 
                onClick={handleSendTranscript} 
                size="sm" 
                variant="default"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
              <Button 
                onClick={handleReset} 
                size="sm" 
                variant="ghost"
                className="transition-all duration-300 hover:scale-105"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};