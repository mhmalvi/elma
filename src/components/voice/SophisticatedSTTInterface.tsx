import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Settings,
  Languages
} from 'lucide-react';
import { useRealtimeSTT, SUPPORTED_LANGUAGES } from '@/hooks/useRealtimeSTT';
import { cn } from '@/lib/utils';

interface SophisticatedSTTInterfaceProps {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onTranscriptFinal?: (transcript: string) => void;
  className?: string;
  autoSend?: boolean;
}

interface AudioVisualState {
  currentLevel: number;
  isActive: boolean;
  hasSound: boolean;
}

// Real-time Audio Visualizer Component
const AudioVisualizer: React.FC<{ audioLevel: number; isActive: boolean; className?: string }> = ({
  audioLevel,
  isActive,
  className
}) => {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Outer ring */}
      <div className={cn(
        "absolute w-24 h-24 rounded-full border-2 transition-all duration-300",
        isActive 
          ? "border-primary animate-pulse scale-110" 
          : "border-muted scale-100"
      )} />
      
      {/* Middle ring - responds to audio level */}
      <div 
        className={cn(
          "absolute w-20 h-20 rounded-full transition-all duration-150",
          isActive && audioLevel > 0.1
            ? "bg-primary/20 scale-105" 
            : "bg-muted/20 scale-100"
        )}
        style={{
          transform: `scale(${1 + (audioLevel * 0.3)})`,
          opacity: isActive ? Math.max(0.3, audioLevel) : 0.2
        }}
      />
      
      {/* Inner microphone button */}
      <div className={cn(
        "relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
        isActive
          ? "bg-red-500 hover:bg-red-600 shadow-lg"
          : "bg-primary hover:bg-primary/90 shadow-md"
      )}>
        {isActive ? (
          <MicOff className="w-6 h-6 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </div>
      
      {/* Waveform visualizer */}
      {isActive && (
        <div className="absolute -bottom-8 flex items-end gap-1 h-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full transition-all duration-150"
              style={{
                height: `${Math.max(4, audioLevel * 20 + Math.sin(Date.now() / 200 + i) * 8)}px`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SophisticatedSTTInterface: React.FC<SophisticatedSTTInterfaceProps> = ({
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
  const [audioLevel, setAudioLevel] = useState<AudioVisualState>({
    currentLevel: 0,
    isActive: false,
    hasSound: false
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Enhanced console logging with STT prefix
  const log = useCallback((message: string, data?: any) => {
    console.log(`[STT] ${message}`, data || '');
  }, []);

  // Start real-time audio monitoring for visualizer
  const startAudioMonitoring = useCallback(async () => {
    try {
      log('Starting audio monitoring for visualizer');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let hasDetectedSound = false;
      
      const updateAudioLevel = () => {
        if (!analyser) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        
        if (normalizedLevel > 0.05) {
          hasDetectedSound = true;
        }
        
        setAudioLevel({
          currentLevel: normalizedLevel,
          isActive: true,
          hasSound: hasDetectedSound
        });
        
        // Periodic logging (reduced frequency for cleaner console)
        if (Math.random() < 0.02) { // 2% chance to log
          log(`Audio level: ${(normalizedLevel * 100).toFixed(1)}%`, {
            hasSound: hasDetectedSound,
            maxLevel: normalizedLevel
          });
        }
        
        if (!hasDetectedSound && Date.now() % 10000 < 50) { // Every 10 seconds
          log('No audio detected - checking microphone status');
        }
        
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      log('Audio monitoring started successfully');
      
    } catch (error) {
      log('Audio monitoring failed', error);
      setAudioLevel(prev => ({ ...prev, isActive: false }));
    }
  }, [log]);

  // Stop audio monitoring
  const stopAudioMonitoring = useCallback(() => {
    log('Stopping audio monitoring');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    analyserRef.current = null;
    setAudioLevel({
      currentLevel: 0,
      isActive: false,
      hasSound: false
    });
  }, [log]);

  // Enhanced start listening with audio monitoring
  const handleStartListening = useCallback(async () => {
    log('User initiated voice input', { language: selectedLanguage });
    
    try {
      // Start visual feedback immediately
      await startAudioMonitoring();
      
      // Start STT
      await startListening(selectedLanguage);
      
      log('Voice input started successfully');
    } catch (error) {
      log('Failed to start voice input', error);
      stopAudioMonitoring();
    }
  }, [selectedLanguage, startListening, startAudioMonitoring, stopAudioMonitoring, log]);

  // Enhanced stop listening
  const handleStopListening = useCallback(() => {
    log('User stopped voice input');
    stopListening();
    stopAudioMonitoring();
  }, [stopListening, stopAudioMonitoring, log]);

  // Handle transcript updates
  useEffect(() => {
    const fullTranscript = sttState.transcript + sttState.interimTranscript;
    
    if (sttState.transcript) {
      log('Final transcript received', { text: sttState.transcript, confidence: sttState.confidence });
    }
    
    if (sttState.interimTranscript) {
      log('Interim transcript', { text: sttState.interimTranscript });
    }
    
    if (fullTranscript && onTranscriptUpdate) {
      onTranscriptUpdate(fullTranscript, sttState.interimTranscript === '');
    }
  }, [sttState.transcript, sttState.interimTranscript, sttState.confidence, onTranscriptUpdate, log]);

  // Handle final transcript
  useEffect(() => {
    if (sttState.transcript && !sttState.isListening && onTranscriptFinal) {
      log('Sending final transcript to chat', { transcript: sttState.transcript });
      onTranscriptFinal(sttState.transcript);
      if (autoSend) {
        clearTranscript();
        log('Auto-cleared transcript');
      }
    }
  }, [sttState.transcript, sttState.isListening, onTranscriptFinal, autoSend, clearTranscript, log]);

  // Handle language change
  const handleLanguageChange = useCallback((langCode: string) => {
    setSelectedLanguage(langCode);
    setLanguage(langCode);
    log('Language changed', { language: langCode });
  }, [setLanguage, log]);

  // Handle errors
  useEffect(() => {
    if (sttState.error) {
      log('STT Error occurred', { error: sttState.error });
      stopAudioMonitoring();
    }
  }, [sttState.error, stopAudioMonitoring, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioMonitoring();
    };
  }, [stopAudioMonitoring]);

  // Get UI state
  const getUIState = () => {
    if (sttState.error) return { text: 'Error - Tap to retry', variant: 'destructive' as const };
    if (sttState.isListening) return { text: 'Listening...', variant: 'default' as const };
    if (sttState.isProcessing) return { text: 'Processing...', variant: 'secondary' as const };
    return { text: 'Tap to speak', variant: 'outline' as const };
  };

  const uiState = getUIState();

  return (
    <Card className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Voice Input
          </h3>
          <p className="text-sm text-muted-foreground">
            Speak naturally for instant transcription
          </p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs"
        >
          <Settings className="w-4 h-4 mr-1" />
          {showAdvanced ? 'Hide' : 'Advanced'}
        </Button>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Languages className="w-4 h-4" />
              Language
            </label>
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
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Web Speech API supported: {sttState.isSupported ? '✅' : '❌'}</p>
            <p>• Selected language: {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}</p>
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex justify-center">
        <Badge 
          variant={uiState.variant} 
          className="px-4 py-2 text-sm animate-fade-in"
        >
          {sttState.isListening && (
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
          )}
          {uiState.text}
        </Badge>
      </div>

      {/* Main Voice Interface */}
      <div className="flex justify-center py-4">
        <Button
          onClick={sttState.isListening ? handleStopListening : handleStartListening}
          disabled={sttState.isProcessing || !sttState.isSupported}
          className="p-0 h-auto bg-transparent hover:bg-transparent focus:bg-transparent"
          variant="ghost"
        >
          <AudioVisualizer
            audioLevel={audioLevel.currentLevel}
            isActive={sttState.isListening}
            className="transition-all duration-300 hover:scale-105"
          />
        </Button>
      </div>

      {/* Language Display */}
      <div className="flex justify-center">
        <Badge variant="outline" className="text-xs">
          {SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}
        </Badge>
      </div>

      {/* Live Transcript Display */}
      <div className="space-y-3">
        <div className="min-h-[100px] p-4 bg-background border rounded-lg">
          {/* Partial transcript (live) */}
          {sttState.interimTranscript && (
            <div className="text-muted-foreground italic animate-fade-in">
              {sttState.interimTranscript}
            </div>
          )}
          
          {/* Final transcript */}
          {sttState.transcript && (
            <div className="text-foreground font-medium animate-fade-in">
              {sttState.transcript}
            </div>
          )}
          
          {/* Placeholder */}
          {!sttState.transcript && !sttState.interimTranscript && (
            <div className="text-muted-foreground/60 text-center py-6">
              {sttState.isListening 
                ? "Speak now..." 
                : "Your speech will appear here"}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {sttState.transcript && (
          <div className="flex justify-center gap-2 animate-fade-in">
            <Button
              variant="outline"
              size="sm"
              onClick={clearTranscript}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => onTranscriptFinal?.(sttState.transcript)}
            >
              Use Transcript
            </Button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {sttState.error && (
        <div className="text-center animate-fade-in">
          <p className="text-sm text-destructive mb-2">{sttState.error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartListening}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Helpful Instructions */}
      <div className="text-center text-xs text-muted-foreground">
        {sttState.isListening 
          ? "Speak clearly and naturally. Tap the microphone to stop." 
          : "Tap the microphone to start voice input"}
      </div>
    </Card>
  );
};