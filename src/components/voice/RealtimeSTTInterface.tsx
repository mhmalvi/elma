import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, VolumeX, Loader2, Languages, Activity } from 'lucide-react';
import { useRealtimeSTT, SUPPORTED_LANGUAGES } from '@/hooks/useRealtimeSTT';
import { cn } from '@/lib/utils';

interface RealtimeSTTInterfaceProps {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onTranscriptFinal?: (transcript: string) => void;
  className?: string;
  autoSend?: boolean;
}

export const RealtimeSTTInterface: React.FC<RealtimeSTTInterfaceProps> = ({
  onTranscriptUpdate,
  onTranscriptFinal,
  className,
  autoSend = false
}) => {
  const {
    sttState,
    startListening,
    stopListening,
    clearTranscript,
    setLanguage,
    supportedLanguages
  } = useRealtimeSTT();

  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle transcript updates
  useEffect(() => {
    const fullTranscript = sttState.transcript + sttState.interimTranscript;
    if (fullTranscript && onTranscriptUpdate) {
      onTranscriptUpdate(fullTranscript, sttState.interimTranscript === '');
    }
  }, [sttState.transcript, sttState.interimTranscript, onTranscriptUpdate]);

  // Handle final transcript
  useEffect(() => {
    if (sttState.transcript && !sttState.isListening && onTranscriptFinal) {
      onTranscriptFinal(sttState.transcript);
      if (autoSend) {
        clearTranscript();
      }
    }
  }, [sttState.transcript, sttState.isListening, onTranscriptFinal, autoSend, clearTranscript]);

  const handleLanguageChange = useCallback((langCode: string) => {
    setSelectedLanguage(langCode);
    setLanguage(langCode);
  }, [setLanguage]);

  const handleStartListening = useCallback(async () => {
    await startListening(selectedLanguage);
  }, [startListening, selectedLanguage]);

  const getLanguageName = (code: string) => {
    return supportedLanguages.find(lang => lang.code === code)?.name || 'English';
  };

  const getStatusColor = () => {
    if (sttState.error) return 'destructive';
    if (sttState.isListening) return 'default';
    if (sttState.isProcessing) return 'secondary';
    return 'outline';
  };

  const getStatusText = () => {
    if (sttState.error) return 'Error';
    if (sttState.isListening) return 'Listening...';
    if (sttState.isProcessing) return 'Processing...';
    return 'Ready';
  };

  return (
    <Card className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Real-time Speech-to-Text
          </h3>
          <p className="text-sm text-muted-foreground">
            Speak naturally and see your words appear in real-time
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Languages className="w-4 h-4 mr-2" />
          Advanced
        </Button>
      </div>

      {/* Language Selection (Advanced) */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {lang.code.toUpperCase()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Browser Support Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Browser Support:</span>
              <Badge variant={sttState.isSupported ? "default" : "destructive"}>
                {sttState.isSupported ? "Supported" : "Not Supported"}
              </Badge>
            </div>
            
            {sttState.confidence > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Confidence:</span>
                <Badge variant="outline">
                  {Math.round(sttState.confidence * 100)}%
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center justify-center">
        <Badge variant={getStatusColor()} className="px-4 py-2 text-sm">
          {sttState.isListening && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
          )}
          {sttState.isProcessing && (
            <Loader2 className="w-3 h-3 animate-spin mr-2" />
          )}
          {getStatusText()}
        </Badge>
      </div>

      {/* Main Voice Button */}
      <div className="flex justify-center">
        <Button
          onClick={sttState.isListening ? stopListening : handleStartListening}
          disabled={sttState.isProcessing || !sttState.isSupported}
          className={cn(
            "w-20 h-20 rounded-full transition-all duration-300 shadow-lg",
            sttState.isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {sttState.isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </Button>
      </div>

      {/* Language Badge */}
      <div className="flex justify-center">
        <Badge variant="outline" className="px-3 py-1">
          Speaking in {getLanguageName(selectedLanguage)}
        </Badge>
      </div>

      {/* Live Transcript Display */}
      {(sttState.transcript || sttState.interimTranscript) && (
        <div className="space-y-3">
          <div className="p-4 bg-background border rounded-lg min-h-[80px]">
            <div className="space-y-2">
              {/* Final transcript */}
              {sttState.transcript && (
                <div className="text-foreground font-medium">
                  {sttState.transcript}
                </div>
              )}
              
              {/* Interim transcript (real-time) */}
              {sttState.interimTranscript && (
                <div className="text-muted-foreground italic">
                  {sttState.interimTranscript}
                  <span className="animate-pulse">|</span>
                </div>
              )}
              
              {/* Empty state */}
              {!sttState.transcript && !sttState.interimTranscript && (
                <div className="text-muted-foreground text-center">
                  {sttState.isListening 
                    ? "Listening for speech..." 
                    : "Transcript will appear here"
                  }
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {sttState.transcript && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={clearTranscript}
              >
                Clear
              </Button>
              
              {onTranscriptFinal && (
                <Button
                  size="sm"
                  onClick={() => onTranscriptFinal(sttState.transcript)}
                >
                  Use Transcript
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {sttState.error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <VolumeX className="w-4 h-4" />
            <span className="font-medium">Speech Recognition Error</span>
          </div>
          <p className="text-sm text-destructive">{sttState.error}</p>
          
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearTranscript()}
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>
          {sttState.isListening 
            ? "Speak clearly into your microphone. Transcript appears in real-time."
            : "Click the microphone to start voice input"
          }
        </p>
        {!sttState.isSupported && (
          <p className="text-destructive">
            Voice input is not supported in this browser. Please use Chrome, Firefox, or Safari.
          </p>
        )}
      </div>
    </Card>
  );
};