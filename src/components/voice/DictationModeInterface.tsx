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
    <div className={cn("space-y-4", className)}>
      {/* Recording Controls */}
      <div className="flex items-center justify-center">
        {!isRecording && !finalTranscript ? (
          <Button
            onClick={handleStartRecording}
            size="lg"
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Mic className="w-6 h-6 text-primary-foreground" />
          </Button>
        ) : isRecording ? (
          <Button
            onClick={handleStopRecording}
            size="lg"
            variant="destructive"
            className="w-16 h-16 rounded-full transition-all duration-300 shadow-lg animate-pulse"
          >
            <Square className="w-6 h-6" />
          </Button>
        ) : null}
      </div>

      {/* Status Display */}
      <div className="text-center">
        {isRecording && (
          <p className="text-primary font-medium animate-pulse">
            🎤 Listening... Speak your message
          </p>
        )}
        {showProcessing && (
          <p className="text-muted-foreground">
            Processing your voice...
          </p>
        )}
        {finalTranscript && !editMode && (
          <p className="text-foreground">
            ✓ Ready to send
          </p>
        )}
      </div>

      {/* Transcript Display/Edit */}
      {currentTranscript && (
        <div className="space-y-3">
          {editMode ? (
            <div className="space-y-2">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                placeholder="Edit your message..."
                className="min-h-[100px] resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} size="sm" variant="default">
                  Save Changes
                </Button>
                <Button onClick={() => setEditMode(false)} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-lg p-4 border">
              <p className="text-foreground whitespace-pre-wrap">{currentTranscript}</p>
            </div>
          )}

          {/* Action Buttons */}
          {finalTranscript && !editMode && (
            <div className="flex gap-2 justify-center">
              <Button onClick={handleEdit} size="sm" variant="outline">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleSendTranscript} size="sm" variant="default">
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
              <Button onClick={handleReset} size="sm" variant="ghost">
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