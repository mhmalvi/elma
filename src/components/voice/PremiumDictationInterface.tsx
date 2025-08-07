import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PremiumAIAvatar } from './PremiumAIAvatar';
import { PremiumLanguageSelector } from './PremiumLanguageSelector';
import { PremiumWaveformVisualizer } from './PremiumWaveformVisualizer';
import { CompactStatusIndicator } from './CompactStatusIndicator';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { Mic, Square, Send, Edit3, RotateCcw, CheckCircle, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
interface PremiumDictationInterfaceProps {
  onTranscriptComplete: (text: string) => void;
  className?: string;
}
export const PremiumDictationInterface = ({
  onTranscriptComplete,
  className
}: PremiumDictationInterfaceProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showSuccess, setShowSuccess] = useState(false);
  const {
    sttState,
    startListening,
    stopListening,
    clearTranscript,
    changeLanguage
  } = useAdvancedVoiceSTT();

  // Handle transcript changes
  useEffect(() => {
    if (sttState.transcript && !isEditing) {
      setEditedTranscript(sttState.transcript);
    }
  }, [sttState.transcript, isEditing]);

  // Auto-detect language changes
  useEffect(() => {
    if (sttState.detectedLanguage !== currentLanguage) {
      setCurrentLanguage(sttState.detectedLanguage);
    }
  }, [sttState.detectedLanguage, currentLanguage]);
  const handleStartRecording = async () => {
    clearTranscript();
    setEditedTranscript('');
    setIsEditing(false);
    setShowSuccess(false);
    await startListening(currentLanguage);
  };
  const handleStopRecording = () => {
    stopListening();
  };
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    changeLanguage(language);
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleSaveEdit = () => {
    setIsEditing(false);
    // Update the transcript state if needed
  };
  const handleCancelEdit = () => {
    setEditedTranscript(sttState.transcript);
    setIsEditing(false);
  };
  const handleSendTranscript = () => {
    if (editedTranscript.trim()) {
      onTranscriptComplete(editedTranscript.trim());
      setShowSuccess(true);

      // Clear after a delay
      setTimeout(() => {
        clearTranscript();
        setEditedTranscript('');
        setShowSuccess(false);
      }, 2000);
    }
  };
  const handleReset = () => {
    clearTranscript();
    setEditedTranscript('');
    setIsEditing(false);
    setShowSuccess(false);
  };
  const getRecordingStatus = () => {
    if (showSuccess) return 'success';
    if (sttState.isProcessing) return 'processing';
    if (sttState.isListening) return 'listening';
    if (sttState.error) return 'error';
    return 'idle';
  };
  const hasTranscript = Boolean(editedTranscript?.trim());
  return <div className={cn("w-full space-y-2 p-3 rounded-2xl bg-gradient-to-br from-spiritual/5 to-primary/5 backdrop-blur-xl border border-spiritual/20", className)}>
      {/* Ultra Compact Dictation Mode Interface */}
      <div className="relative flex items-center justify-between gap-3">
        {/* Language Selector - Minimal */}
        <div className="flex-shrink-0">
          <PremiumLanguageSelector currentLanguage={currentLanguage} detectedLanguage={sttState.detectedLanguage} onLanguageChange={handleLanguageChange} isListening={sttState.isListening} />
        </div>

        {/* Central AI Avatar with Dictation Animations */}
        <div className="flex-1 flex flex-col items-center space-y-2">
          <div className="relative">
            <PremiumAIAvatar isListening={sttState.isListening} isThinking={sttState.isProcessing} size="md" />
            {/* Dictation mode glow rings */}
            {sttState.isListening && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-spiritual/40 animate-ping scale-110" />
                <div className="absolute inset-0 rounded-full border border-spiritual/30 animate-bounce scale-125" />
              </>
            )}
          </div>
          
          {/* Compact Waveform */}
          <div className="w-32 h-6">
            <PremiumWaveformVisualizer isActive={sttState.isListening} frequency="high" style="detailed" color="spiritual" bars={8} />
          </div>
        </div>

        {/* Control Buttons - Dictation Mode Style */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {hasTranscript && !sttState.isListening && (
            <Button onClick={handleReset} variant="ghost" size="sm" className="h-8 w-8 rounded-xl border border-spiritual/30 hover:bg-spiritual/10">
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
          
          <Button onClick={!sttState.isListening ? handleStartRecording : handleStopRecording} className={cn("h-12 w-12 rounded-2xl transition-all duration-300 shadow-lg", "hover:scale-105", sttState.isListening ? "bg-destructive hover:bg-destructive/90 animate-bounce" : "bg-gradient-to-r from-spiritual to-primary hover:from-spiritual/90 hover:to-primary/90")}>
            {sttState.isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Compact Status Row */}
      <div className="w-full">
        <CompactStatusIndicator 
          status={getRecordingStatus()} 
          confidence={sttState.confidence} 
          language={currentLanguage} 
          isOnline={true}
          message={showSuccess ? "Sent successfully!" : undefined}
          className="w-full" 
        />
      </div>

      {/* Transcript Area */}
      {hasTranscript && <Card className="p-6 bg-card/60 backdrop-blur-xl border border-primary/20 animate-slide-in-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Voice Transcript
              </h4>
              
              <div className="flex items-center gap-2">
                {!isEditing ? <Button onClick={handleEdit} variant="ghost" size="sm" className="text-xs">
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button> : <div className="flex gap-1">
                    <Button onClick={handleSaveEdit} variant="ghost" size="sm" className="text-xs text-spiritual">
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button onClick={handleCancelEdit} variant="ghost" size="sm" className="text-xs text-destructive">
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>}
              </div>
            </div>

            {/* Transcript Display/Editor */}
            {isEditing ? <Textarea value={editedTranscript} onChange={e => setEditedTranscript(e.target.value)} className="min-h-[120px] resize-none focus:ring-2 focus:ring-primary/20" placeholder="Edit your transcript..." /> : <div className="min-h-[120px] p-4 bg-muted/30 rounded-lg text-sm leading-relaxed">
                {editedTranscript}
              </div>}

            {/* Transcript Stats */}
            <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/20 pt-3">
              <div className="flex gap-4">
                <span>{sttState.wordCount} words</span>
                <span>{sttState.characterCount} characters</span>
              </div>
              
              {sttState.confidence > 0 && <div className="flex items-center gap-2">
                  <span>Accuracy:</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(sttState.confidence * 100)}%
                  </Badge>
                </div>}
            </div>
          </div>
        </Card>}

      {/* Action Buttons */}
      {hasTranscript && !sttState.isListening && !isEditing && <div className="flex justify-center gap-4 animate-slide-in-up">
          <Button onClick={handleSendTranscript} size="lg" className="bg-gradient-primary hover:bg-primary/90 shadow-lg hover:scale-105 transition-all duration-300" disabled={showSuccess}>
            {showSuccess ? <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Sent!
              </> : <>
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </>}
          </Button>
        </div>}

      {/* Error Display */}
      {sttState.error && <Card className="p-4 bg-destructive/10 border border-destructive/20 animate-slide-in-up">
          <div className="text-sm text-destructive text-center">
            {sttState.error}
          </div>
        </Card>}

      {/* Help Text */}
      
    </div>;
};