import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PremiumAIAvatar } from './PremiumAIAvatar';
import { PremiumLanguageSelector } from './PremiumLanguageSelector';
import { PremiumWaveformVisualizer } from './PremiumWaveformVisualizer';
import { SmartStatusIndicator } from './SmartStatusIndicator';
import { useAdvancedVoiceSTT } from '@/hooks/useAdvancedVoiceSTT';
import { 
  Mic, 
  Square, 
  Send, 
  Edit3, 
  RotateCcw,
  CheckCircle,
  Save,
  X
} from 'lucide-react';
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

  return (
    <div className={cn(
      "w-full space-y-4 p-4 rounded-lg bg-card border",
      className
    )}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Edit3 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Voice Memo Studio
          </h2>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Record, review, and perfect your voice notes before sending
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

      {/* Recording Interface */}
      <div className="relative flex flex-col items-center space-y-8">
        {/* AI Avatar */}
        <div className="relative">
          <PremiumAIAvatar
            isListening={sttState.isListening}
            isThinking={sttState.isProcessing}
            size="xl"
          />
          
          {/* Status badge */}
          <div className="absolute -top-2 -right-2">
            <Badge 
              variant={sttState.isListening ? "default" : hasTranscript ? "secondary" : "outline"}
              className="text-xs animate-fade-in"
            >
              {sttState.isListening ? 'Recording' : hasTranscript ? 'Ready' : 'Standby'}
            </Badge>
          </div>
        </div>

        {/* Waveform Visualizer */}
        <div className="w-64">
          <PremiumWaveformVisualizer
            isActive={sttState.isListening}
            frequency="high"
            style="detailed"
            color="primary"
            bars={10}
          />
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-4">
          {!sttState.isListening ? (
            <Button
              onClick={handleStartRecording}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-primary hover:bg-primary/90 shadow-xl hover:scale-110 transition-all duration-300"
            >
              <Mic className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              size="lg"
              variant="destructive"
              className="w-16 h-16 rounded-full shadow-xl hover:scale-110 transition-all duration-300 animate-gentle-pulse"
            >
              <Square className="w-6 h-6" />
            </Button>
          )}

          {hasTranscript && !sttState.isListening && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="animate-slide-in-up"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Status Indicator */}
      <SmartStatusIndicator
        status={getRecordingStatus()}
        confidence={sttState.confidence}
        language={currentLanguage}
        isOnline={true}
        wordCount={sttState.wordCount}
        characterCount={sttState.characterCount}
        message={showSuccess ? "Sent successfully!" : undefined}
      />

      {/* Transcript Area */}
      {hasTranscript && (
        <Card className="p-6 bg-card/60 backdrop-blur-xl border border-primary/20 animate-slide-in-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Voice Transcript
              </h4>
              
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    onClick={handleEdit}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button
                      onClick={handleSaveEdit}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-spiritual"
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Transcript Display/Editor */}
            {isEditing ? (
              <Textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                className="min-h-[120px] resize-none focus:ring-2 focus:ring-primary/20"
                placeholder="Edit your transcript..."
              />
            ) : (
              <div className="min-h-[120px] p-4 bg-muted/30 rounded-lg text-sm leading-relaxed">
                {editedTranscript}
              </div>
            )}

            {/* Transcript Stats */}
            <div className="flex justify-between items-center text-xs text-muted-foreground border-t border-border/20 pt-3">
              <div className="flex gap-4">
                <span>{sttState.wordCount} words</span>
                <span>{sttState.characterCount} characters</span>
              </div>
              
              {sttState.confidence > 0 && (
                <div className="flex items-center gap-2">
                  <span>Accuracy:</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(sttState.confidence * 100)}%
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      {hasTranscript && !sttState.isListening && !isEditing && (
        <div className="flex justify-center gap-4 animate-slide-in-up">
          <Button
            onClick={handleSendTranscript}
            size="lg"
            className="bg-gradient-primary hover:bg-primary/90 shadow-lg hover:scale-105 transition-all duration-300"
            disabled={showSuccess}
          >
            {showSuccess ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Display */}
      {sttState.error && (
        <Card className="p-4 bg-destructive/10 border border-destructive/20 animate-slide-in-up">
          <div className="text-sm text-destructive text-center">
            {sttState.error}
          </div>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-center text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
        {!hasTranscript ? (
          "Click the microphone to start recording your voice memo. Speak clearly and take your time."
        ) : !isEditing ? (
          "Review your transcript above. You can edit it before sending or record again."
        ) : (
          "Edit your transcript to make any corrections, then save your changes."
        )}
      </div>
    </div>
  );
};