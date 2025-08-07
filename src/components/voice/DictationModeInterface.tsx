import React, { useState, useCallback, useEffect } from 'react';
import { Mic, Square, Send, Edit3, X, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVoiceMode } from '@/contexts/VoiceModeContext';
import { useRealtimeSTT } from '@/hooks/useRealtimeSTT';
import { AIAvatar } from './AIAvatar';
import { RealTimeWaveform } from './RealTimeWaveform';
import { VoiceStatusIndicator } from './VoiceStatusIndicator';
import { LanguageSelector } from './LanguageSelector';
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
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [detectedLanguage, setDetectedLanguage] = useState<string>();

  const { sttState, startListening, stopListening, clearTranscript } = useRealtimeSTT();

  // Handle transcript changes
  useEffect(() => {
    if (sttState.transcript && !sttState.isListening) {
      console.log('[Dictation] Final transcript received:', sttState.transcript);
      setFinalTranscript(sttState.transcript);
      setIsRecording(false);
      setShowProcessing(false);
      
      if (settings.autoTTS) {
        onTranscriptComplete(sttState.transcript);
        handleReset();
      }
    }
  }, [sttState.transcript, sttState.isListening, settings.autoTTS, onTranscriptComplete]);

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
    <div className={cn("space-y-8", className)}>
      {/* Enhanced Header with Language Support */}
      <div className="text-center space-y-4 animate-slide-in-up">
        <div className="flex items-center justify-center gap-4">
          <AIAvatar 
            isListening={isRecording}
            isThinking={showProcessing}
            size="md"
            className="animate-breathe"
          />
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Voice Memo Mode
            </h3>
            <p className="text-sm text-muted-foreground">Record, review, and send with precision</p>
          </div>
        </div>
        
        {/* Language Selector */}
        <LanguageSelector
          currentLanguage={currentLanguage}
          detectedLanguage={detectedLanguage}
          onLanguageChange={setCurrentLanguage}
          className="mx-auto"
        />
      </div>

      {/* Enhanced Central Recording Area */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Effects */}
        {isRecording && (
          <div className="absolute inset-0 flex items-center justify-center">
            <RealTimeWaveform 
              isActive={true}
              variant="circular"
              color="primary"
              size="lg"
              className="animate-gentle-pulse"
            />
          </div>
        )}
        
        {/* Outer Ring Effects */}
        {isRecording && (
          <>
            <div className="absolute w-40 h-40 border border-primary/20 rounded-full animate-gentle-pulse" 
                 style={{ animationDuration: '3s' }} />
            <div className="absolute w-52 h-52 border border-primary/10 rounded-full animate-breathe" 
                 style={{ animationDelay: '0.5s', animationDuration: '4s' }} />
            <div className="absolute w-64 h-64 border border-primary/5 rounded-full animate-breathe" 
                 style={{ animationDelay: '1s', animationDuration: '5s' }} />
          </>
        )}
        
        {/* Main Recording Button */}
        {!isRecording && !finalTranscript ? (
          <Button
            onClick={handleStartRecording}
            size="lg"
            className={cn(
              "relative w-24 h-24 rounded-full transition-all duration-700", // Slower
              "bg-gradient-to-br from-primary via-primary-glow to-primary/90",
              "hover:from-primary/95 hover:to-primary-glow/80",
              "shadow-2xl hover:shadow-primary/30 hover:scale-110",
              "border-4 border-background overflow-hidden group"
            )}
          >
            <Mic className="w-9 h-9 text-primary-foreground relative z-10 group-hover:animate-pulse" />
            
            {/* Breathing effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
            
            {/* Ripple on hover */}
            <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-700 ease-out" />
          </Button>
        ) : isRecording ? (
          <Button
            onClick={handleStopRecording}
            size="lg"
            className={cn(
              "relative w-24 h-24 rounded-full transition-all duration-500",
              "bg-gradient-to-br from-destructive via-destructive/90 to-destructive/80",
              "animate-pulse hover:scale-105 shadow-2xl shadow-destructive/30",
              "border-4 border-background overflow-hidden"
            )}
          >
            <Square className="w-9 h-9 text-destructive-foreground relative z-10" />
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
          </Button>
        ) : (
          /* Enhanced Success State */
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center animate-scale-in shadow-2xl shadow-green-500/30">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            </div>
            {/* Success glow */}
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
          </div>
        )}
      </div>

      {/* Enhanced Status Display */}
      <div className="flex flex-col items-center space-y-4">
        {/* Status Indicator */}
        <VoiceStatusIndicator
          status={
            isRecording ? 'listening' :
            showProcessing ? 'processing' :
            finalTranscript ? 'idle' : 'idle'
          }
          transcript={isRecording ? sttState.transcript : undefined}
          confidence={0.85}
          className="max-w-md"
        />
        
        {/* Real-time Audio Visualization */}
        {isRecording && (
          <div className="flex flex-col items-center space-y-3 animate-fade-in">
            <RealTimeWaveform 
              isActive={true}
              variant="linear"
              color="primary"
              size="md"
              bars={9}
            />
            <p className="text-sm text-primary font-medium animate-pulse">
              Speak clearly for best results
            </p>
          </div>
        )}
        
        {/* Processing State */}
        {showProcessing && !isRecording && (
          <div className="flex flex-col items-center space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-spiritual rounded-full animate-ping" />
              <div className="w-2 h-2 bg-spiritual rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-spiritual rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-sm text-muted-foreground">Transforming speech to text...</p>
          </div>
        )}
        
        {/* Success State */}
        {finalTranscript && !editMode && !showProcessing && (
          <div className="flex items-center gap-2 animate-scale-in">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <p className="text-green-600 font-medium">Perfect! Ready to send</p>
          </div>
        )}
      </div>

      {/* Enhanced Transcript Display/Edit */}
      {currentTranscript && (
        <div className="space-y-5 animate-fade-in">
          {editMode ? (
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  placeholder="Polish your message..."
                  className={cn(
                    "min-h-[140px] resize-none transition-all duration-300",
                    "bg-gradient-to-br from-card to-secondary/20",
                    "border-2 border-primary/20 focus:border-primary/50",
                    "rounded-xl p-4 text-base leading-relaxed",
                    "placeholder:text-muted-foreground/60"
                  )}
                  autoFocus
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {editedText.length} characters
                </div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={handleSaveEdit} 
                  size="sm" 
                  className="bg-gradient-to-r from-primary to-primary-glow hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  onClick={() => setEditMode(false)} 
                  size="sm" 
                  variant="outline"
                  className="hover:scale-105 transition-all duration-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className={cn(
              "relative group cursor-pointer",
              "bg-gradient-to-br from-card/80 to-secondary/30",
              "rounded-2xl p-6 border border-border/30 shadow-xl",
              "backdrop-blur-sm hover:shadow-2xl",
              "transition-all duration-500 hover:scale-[1.02]"
            )}>
              {/* Transcript content */}
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-base">
                {currentTranscript}
              </p>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Word count */}
              <div className="mt-3 text-xs text-muted-foreground/70 flex items-center justify-between">
                <span>{currentTranscript.split(' ').length} words</span>
                <span>Ready for review</span>
              </div>
            </div>
          )}

          {/* Enhanced Action Buttons */}
          {finalTranscript && !editMode && (
            <div className="flex gap-3 justify-center animate-fade-in">
              <Button 
                onClick={handleEdit} 
                size="sm" 
                variant="outline"
                className={cn(
                  "group relative overflow-hidden",
                  "border-primary/30 hover:border-primary/50",
                  "transition-all duration-300 hover:scale-105 hover:shadow-lg"
                )}
              >
                <Edit3 className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Polish
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              
              <Button 
                onClick={handleSendTranscript} 
                size="sm"
                className={cn(
                  "group relative overflow-hidden",
                  "bg-gradient-to-r from-primary via-primary-glow to-primary/90",
                  "hover:from-primary/95 hover:to-primary-glow/80",
                  "transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-primary/20"
                )}
              >
                <Send className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                Send Message
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              
              <Button 
                onClick={handleReset} 
                size="sm" 
                variant="ghost"
                className="hover:scale-105 transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
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