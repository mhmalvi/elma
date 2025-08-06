import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2, 
  Languages, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Settings,
  X
} from 'lucide-react';
import { useRealtimeSTT, SUPPORTED_LANGUAGES } from '@/hooks/useRealtimeSTT';
import { cn } from '@/lib/utils';

interface VoiceDebugInterfaceProps {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  onTranscriptFinal?: (transcript: string) => void;
  className?: string;
  autoSend?: boolean;
}

interface AudioLevelState {
  currentLevel: number;
  maxLevel: number;
  isActive: boolean;
  hasSound: boolean;
}

export const VoiceDebugInterface: React.FC<VoiceDebugInterfaceProps> = ({
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
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [audioLevel, setAudioLevel] = useState<AudioLevelState>({
    currentLevel: 0,
    maxLevel: 0,
    isActive: false,
    hasSound: false
  });
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Add debug logging
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
    console.log(`🔍 STT DEBUG: ${message}`);
  }, []);

  // Check microphone permissions
  const checkMicrophonePermission = useCallback(async () => {
    try {
      addDebugLog('Checking microphone permissions...');
      
      if (!navigator.permissions) {
        addDebugLog('Permissions API not supported');
        return 'unknown';
      }

      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionStatus(result.state);
      addDebugLog(`Permission status: ${result.state}`);
      
      result.onchange = () => {
        setPermissionStatus(result.state);
        addDebugLog(`Permission changed to: ${result.state}`);
      };

      return result.state;
    } catch (error) {
      addDebugLog(`Permission check failed: ${error}`);
      return 'unknown';
    }
  }, [addDebugLog]);

  // Real-time audio level monitoring
  const startAudioLevelMonitoring = useCallback(async (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyzerNode = ctx.createAnalyser();
      const microphone = ctx.createMediaStreamSource(stream);
      
      analyzerNode.fftSize = 256;
      analyzerNode.smoothingTimeConstant = 0.8;
      microphone.connect(analyzerNode);
      
      setAudioContext(ctx);
      setAnalyser(analyzerNode);
      
      const dataArray = new Uint8Array(analyzerNode.frequencyBinCount);
      let maxDetected = 0;
      let soundDetected = false;
      
      const updateLevel = () => {
        if (!analyzerNode) return;
        
        analyzerNode.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
        
        maxDetected = Math.max(maxDetected, normalizedLevel);
        
        // Detect if we're getting any sound at all
        if (normalizedLevel > 0.01) {
          soundDetected = true;
        }
        
        setAudioLevel({
          currentLevel: normalizedLevel,
          maxLevel: maxDetected,
          isActive: true,
          hasSound: soundDetected
        });
        
        // Log periodically
        if (Math.random() < 0.1) { // 10% chance to log
          addDebugLog(`Audio level: ${(normalizedLevel * 100).toFixed(1)}% (Max: ${(maxDetected * 100).toFixed(1)}%)`);
          
          if (!soundDetected && Date.now() % 5000 < 100) { // Every 5 seconds
            addDebugLog('⚠️ No audio detected - check if mic is muted or disconnected');
          }
        }
        
        requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      addDebugLog('🎛️ Audio level monitoring started');
      
    } catch (error) {
      addDebugLog(`❌ Audio monitoring failed: ${error}`);
    }
  }, [addDebugLog]);

  // Stop audio monitoring
  const stopAudioLevelMonitoring = useCallback(() => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setAnalyser(null);
    setAudioLevel({
      currentLevel: 0,
      maxLevel: 0,
      isActive: false,
      hasSound: false
    });
    addDebugLog('🔇 Audio level monitoring stopped');
  }, [audioContext, addDebugLog]);

  // Test microphone access with audio level feedback
  const testMicrophoneAccess = useCallback(async () => {
    try {
      addDebugLog('Testing microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      addDebugLog('✅ Microphone access successful');
      
      // Start monitoring immediately for quick feedback
      await startAudioLevelMonitoring(stream);
      
      // Give a few seconds to detect audio
      setTimeout(() => {
        if (!audioLevel.hasSound && audioLevel.isActive) {
          addDebugLog('⚠️ WARNING: No audio detected after 3 seconds!');
          addDebugLog('💡 Troubleshooting: Check if microphone is muted, in use by another app, or physically disconnected');
        }
        
        // Cleanup test
        stream.getTracks().forEach(track => track.stop());
        stopAudioLevelMonitoring();
      }, 3000);
      
      return true;
    } catch (error) {
      addDebugLog(`❌ Microphone test failed: ${error}`);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setShowPermissionDialog(true);
        }
      }
      return false;
    }
  }, [addDebugLog, startAudioLevelMonitoring, stopAudioLevelMonitoring, audioLevel.hasSound, audioLevel.isActive]);

  // Enhanced start listening with comprehensive debugging
  const handleStartListening = useCallback(async () => {
    addDebugLog('🎯 STARTING STT PIPELINE');
    
    // Step 1: Check permissions
    const permStatus = await checkMicrophonePermission();
    if (permStatus === 'denied') {
      addDebugLog('❌ Permission denied - showing help dialog');
      setShowPermissionDialog(true);
      return;
    }

    // Step 2: Quick mic test
    addDebugLog('🔍 Quick microphone test...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      
      // Start monitoring immediately
      await startAudioLevelMonitoring(stream);
      
      // Keep stream for STT but add a warning if no audio detected
      setTimeout(() => {
        if (audioLevel.isActive && !audioLevel.hasSound) {
          addDebugLog('🚨 CRITICAL: No audio detected from microphone!');
          addDebugLog('💡 Your mic may be muted, disconnected, or used by another app');
          addDebugLog('💡 Please check: 1) Mic mute button 2) OS audio settings 3) Close other apps using mic');
        }
      }, 2000);
      
      stream.getTracks().forEach(track => track.stop()); // Clean up test stream
    } catch (error) {
      addDebugLog(`❌ Microphone test failed: ${error}`);
      return;
    }

    // Step 3: Start STT
    addDebugLog('🚀 Starting STT with language: ' + selectedLanguage);
    await startListening(selectedLanguage);
  }, [checkMicrophonePermission, selectedLanguage, startListening, addDebugLog, startAudioLevelMonitoring, audioLevel.isActive, audioLevel.hasSound]);

  // Handle transcript updates with debugging
  useEffect(() => {
    const fullTranscript = sttState.transcript + sttState.interimTranscript;
    
    if (sttState.transcript) {
      addDebugLog(`📝 Final transcript: "${sttState.transcript}"`);
    }
    
    if (sttState.interimTranscript) {
      addDebugLog(`⏳ Interim transcript: "${sttState.interimTranscript}"`);
    }
    
    if (fullTranscript && onTranscriptUpdate) {
      addDebugLog('📤 Sending transcript to parent component');
      onTranscriptUpdate(fullTranscript, sttState.interimTranscript === '');
    }
  }, [sttState.transcript, sttState.interimTranscript, onTranscriptUpdate, addDebugLog]);

  // Handle final transcript
  useEffect(() => {
    if (sttState.transcript && !sttState.isListening && onTranscriptFinal) {
      addDebugLog('✅ Sending final transcript to chat');
      onTranscriptFinal(sttState.transcript);
      if (autoSend) {
        clearTranscript();
        addDebugLog('🧹 Auto-cleared transcript');
      }
    }
  }, [sttState.transcript, sttState.isListening, onTranscriptFinal, autoSend, clearTranscript, addDebugLog]);

  const handleLanguageChange = useCallback((langCode: string) => {
    setSelectedLanguage(langCode);
    setLanguage(langCode);
    addDebugLog(`🌐 Language changed to: ${langCode}`);
  }, [setLanguage, addDebugLog]);

  const getStatusColor = () => {
    if (sttState.error) return 'destructive';
    if (sttState.isListening) return 'default';
    if (sttState.isProcessing) return 'secondary';
    return 'outline';
  };

  const getStatusText = () => {
    if (sttState.error) return 'Error - Click to Retry';
    if (sttState.isListening) return 'Listening - Click to Stop';
    if (sttState.isProcessing) return 'Processing...';
    return 'Ready - Click to Start';
  };

  // Initialize on mount
  useEffect(() => {
    addDebugLog('Voice interface initialized');
    checkMicrophonePermission();
  }, [addDebugLog, checkMicrophonePermission]);

  return (
    <>
      <Card className={cn("p-6 space-y-6", className)}>
        {/* Header with Debug Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Voice Input Debug Interface
            </h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive STT pipeline with full debugging
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={sttState.isSupported ? "default" : "destructive"}>
              {sttState.isSupported ? "Supported" : "Not Supported"}
            </Badge>
          </div>
        </div>

        {/* Permission Status */}
        <Alert className={cn(
          permissionStatus === 'granted' ? 'border-green-200 bg-green-50' :
          permissionStatus === 'denied' ? 'border-red-200 bg-red-50' :
          'border-yellow-200 bg-yellow-50'
        )}>
          <Settings className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Microphone Permission: {permissionStatus === 'granted' ? '✅ Granted' : 
                                     permissionStatus === 'denied' ? '❌ Denied' : 
                                     '⚠️ Unknown'}
            </span>
            {permissionStatus !== 'granted' && (
              <Button size="sm" onClick={() => setShowPermissionDialog(true)}>
                Help
              </Button>
            )}
          </AlertDescription>
        </Alert>

        {/* Language Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Language</label>
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger>
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

        {/* Status Badge */}
        <div className="flex items-center justify-center">
          <Badge variant={getStatusColor()} className="px-4 py-2 text-sm cursor-pointer"
                 onClick={sttState.error ? handleStartListening : undefined}>
            {sttState.isListening && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
            )}
            {sttState.isProcessing && (
              <Loader2 className="w-3 h-3 animate-spin mr-2" />
            )}
            {sttState.error && (
              <RefreshCw className="w-3 h-3 mr-2" />
            )}
            {getStatusText()}
          </Badge>
        </div>

        {/* Audio Level Meter */}
        {audioLevel.isActive && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Real-time Audio Level:</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-mono text-xs px-2 py-1 rounded",
                  audioLevel.hasSound ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                )}>
                  {(audioLevel.currentLevel * 100).toFixed(0)}%
                </span>
                {!audioLevel.hasSound && audioLevel.isActive && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                )}
              </div>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-150",
                  audioLevel.hasSound ? "bg-green-500" : "bg-red-500"
                )}
                style={{ width: `${Math.max(audioLevel.currentLevel * 100, 2)}%` }}
              />
            </div>
            
            {!audioLevel.hasSound && audioLevel.isActive && (
              <Alert variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription>
                  <strong>No audio detected!</strong> Check if your microphone is muted, disconnected, or being used by another app.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main Voice Button */}
        <div className="flex justify-center">
          <Button
            onClick={sttState.isListening ? () => { stopListening(); stopAudioLevelMonitoring(); } : handleStartListening}
            disabled={sttState.isProcessing || !sttState.isSupported}
            className={cn(
              "w-20 h-20 rounded-full transition-all duration-300 shadow-lg",
              sttState.isListening
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : sttState.error
                ? "bg-orange-500 hover:bg-orange-600"
                : audioLevel.isActive && !audioLevel.hasSound
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {sttState.isListening ? (
              <MicOff className="w-8 h-8" />
            ) : audioLevel.isActive && !audioLevel.hasSound ? (
              <VolumeX className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>
        </div>

        {/* Live Transcript Display */}
        <div className="space-y-3">
          <div className="p-4 bg-background border rounded-lg min-h-[120px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Transcript:</span>
                {sttState.confidence > 0 && (
                  <Badge variant="outline">
                    {Math.round(sttState.confidence * 100)}% confidence
                  </Badge>
                )}
              </div>
              
              {/* Final transcript */}
              {sttState.transcript && (
                <div className="text-foreground font-medium">
                  <strong>Final:</strong> {sttState.transcript}
                </div>
              )}
              
              {/* Interim transcript (real-time) */}
              {sttState.interimTranscript && (
                <div className="text-muted-foreground italic">
                  <strong>Live:</strong> {sttState.interimTranscript}
                  <span className="animate-pulse">|</span>
                </div>
              )}
              
              {/* Empty state */}
              {!sttState.transcript && !sttState.interimTranscript && (
                <div className="text-muted-foreground text-center py-4">
                  {sttState.isListening 
                    ? "🎤 Listening for speech... Speak now!" 
                    : "Transcript will appear here when you speak"
                  }
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {(sttState.transcript || sttState.error) && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={clearTranscript}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              
              {sttState.transcript && onTranscriptFinal && (
                <Button
                  size="sm"
                  onClick={() => onTranscriptFinal(sttState.transcript)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Use Transcript
                </Button>
              )}

              {sttState.error && (
                <Button
                  size="sm"
                  onClick={handleStartListening}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Try Again
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {sttState.error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div><strong>Error:</strong> {sttState.error}</div>
                <div className="text-sm">
                  • Check microphone permissions<br/>
                  • Ensure microphone is connected<br/>
                  • Try speaking louder and clearer<br/>
                  • Check if other apps are using microphone
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Logs */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Debug Logs:</label>
          <div className="p-3 bg-muted/20 rounded border text-xs font-mono max-h-32 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <div className="text-muted-foreground">Debug logs will appear here...</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="text-foreground">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* System Info */}
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">System Information</summary>
          <div className="mt-2 p-3 bg-muted/20 rounded text-xs space-y-1">
            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            <div><strong>Language:</strong> {navigator.language}</div>
            <div><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</div>
            <div><strong>Web Speech API:</strong> {'webkitSpeechRecognition' in window || 'SpeechRecognition' in window ? 'Supported' : 'Not Supported'}</div>
            <div><strong>MediaRecorder:</strong> {'MediaRecorder' in window ? 'Supported' : 'Not Supported'}</div>
          </div>
        </details>
      </Card>

      {/* Permission Help Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Microphone Permission Required</DialogTitle>
            <DialogDescription>
              Voice input needs access to your microphone to work properly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <strong>How to enable microphone access:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                  <li>Look for the microphone icon in your browser's address bar</li>
                  <li>Click it and select "Allow" for this website</li>
                  <li>If you don't see the icon, go to your browser settings</li>
                  <li>Find "Privacy and Security" → "Site Settings" → "Microphone"</li>
                  <li>Add this website to the "Allow" list</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={testMicrophoneAccess} className="flex-1">
                <Volume2 className="w-4 h-4 mr-2" />
                Test Microphone
              </Button>
              <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};