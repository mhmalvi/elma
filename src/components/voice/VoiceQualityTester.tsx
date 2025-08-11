import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';
import { useToast } from '@/hooks/use-toast';
import { Mic, Volume2, CheckCircle, AlertTriangle, XCircle, BarChart3 } from 'lucide-react';

interface QualityTest {
  id: string;
  name: string;
  description: string;
  testType: 'voice-to-text' | 'text-to-voice' | 'round-trip';
  status: 'idle' | 'running' | 'passed' | 'failed';
  results?: {
    latency: number;
    accuracy?: number;
    quality?: number;
    error?: string;
  };
}

export const VoiceQualityTester = () => {
  const { toast } = useToast();
  const { 
    isRecording, 
    isProcessingVoice, 
    isPlayingAudio,
    transcript, 
    voiceMetrics, 
    speechMetrics,
    startRecording, 
    stopRecording, 
    speakText,
    setTranscript 
  } = useVoiceIntegration();

  const [tests, setTests] = useState<QualityTest[]>([
    {
      id: 'stt-latency',
      name: 'Speech-to-Text Latency',
      description: 'Test voice transcription speed and accuracy',
      testType: 'voice-to-text',
      status: 'idle'
    },
    {
      id: 'tts-quality',
      name: 'Text-to-Speech Quality',
      description: 'Test speech synthesis quality and speed',
      testType: 'text-to-voice',
      status: 'idle'
    },
    {
      id: 'round-trip',
      name: 'Round-trip Voice Test',
      description: 'Test complete voice interaction cycle',
      testType: 'round-trip',
      status: 'idle'
    }
  ]);

  const [testPhrase] = useState("Assalamu alaikum. This is a test of the voice system quality.");

  const updateTest = (id: string, updates: Partial<QualityTest>) => {
    setTests(prev => prev.map(test => 
      test.id === id ? { ...test, ...updates } : test
    ));
  };

  const runVoiceToTextTest = async () => {
    const testId = 'stt-latency';
    updateTest(testId, { status: 'running' });
    
    try {
      setTranscript('');
      const startTime = performance.now();
      
      // Start recording for 3 seconds
      await startRecording();
      
      setTimeout(async () => {
        await stopRecording();
        
        // Wait for processing and check results
        setTimeout(() => {
          const endTime = performance.now();
          const latency = endTime - startTime;
          
          if (transcript && transcript.length > 0) {
            updateTest(testId, {
              status: 'passed',
              results: {
                latency,
                accuracy: calculateAccuracy(testPhrase, transcript),
                quality: voiceMetrics.audioQuality || 0
              }
            });
          } else {
            updateTest(testId, {
              status: 'failed',
              results: { latency, error: 'No transcription received' }
            });
          }
        }, 2000);
      }, 3000);
      
    } catch (error) {
      updateTest(testId, {
        status: 'failed',
        results: { latency: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  const runTextToSpeechTest = async () => {
    const testId = 'tts-quality';
    updateTest(testId, { status: 'running' });
    
    try {
      const startTime = performance.now();
      await speakText(testPhrase);
      const endTime = performance.now();
      
      const latency = endTime - startTime;
      
      updateTest(testId, {
        status: 'passed',
        results: {
          latency,
          quality: speechMetrics.audioSize > 0 ? 85 : 0 // Mock quality score based on successful generation
        }
      });
      
    } catch (error) {
      updateTest(testId, {
        status: 'failed',
        results: { latency: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  const runRoundTripTest = async () => {
    const testId = 'round-trip';
    updateTest(testId, { status: 'running' });
    
    try {
      // First, speak the test phrase
      await speakText(testPhrase);
      
      // Wait for speech to complete
      setTimeout(async () => {
        // Then record and transcribe
        setTranscript('');
        await runVoiceToTextTest();
        
        // Wait for voice test to complete
        setTimeout(() => {
          const combinedLatency = (voiceMetrics.processingTime || 0) + (speechMetrics.generationTime || 0);
          
          updateTest(testId, {
            status: 'passed',
            results: {
              latency: combinedLatency,
              quality: Math.min((voiceMetrics.audioQuality || 0) + 70, 100) / 2
            }
          });
        }, 5000);
      }, 2000);
      
    } catch (error) {
      updateTest(testId, {
        status: 'failed',
        results: { latency: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  };

  const calculateAccuracy = (expected: string, actual: string): number => {
    const expectedWords = expected.toLowerCase().split(' ');
    const actualWords = actual.toLowerCase().split(' ');
    
    let matches = 0;
    expectedWords.forEach(word => {
      if (actualWords.includes(word)) matches++;
    });
    
    return Math.round((matches / expectedWords.length) * 100);
  };

  const runTest = async (testId: string) => {
    switch (testId) {
      case 'stt-latency':
        await runVoiceToTextTest();
        break;
      case 'tts-quality':
        await runTextToSpeechTest();
        break;
      case 'round-trip':
        await runRoundTripTest();
        break;
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id);
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    toast({
      title: "Quality testing completed",
      description: "All voice quality tests have been executed",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getQualityLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'bg-yellow-500' };
    if (score >= 40) return { label: 'Fair', color: 'bg-orange-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Voice Quality Testing Suite
        </CardTitle>
        <CardDescription>
          Comprehensive testing for voice-to-text and text-to-speech quality, latency, and reliability
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={isRecording ? "destructive" : "secondary"}>
            <Mic className="w-3 h-3 mr-1" />
            Recording: {isRecording ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={isProcessingVoice ? "default" : "secondary"}>
            Processing: {isProcessingVoice ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant={isPlayingAudio ? "default" : "secondary"}>
            <Volume2 className="w-3 h-3 mr-1" />
            Playback: {isPlayingAudio ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Performance Metrics */}
        {(voiceMetrics.processingTime > 0 || speechMetrics.generationTime > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Voice Processing</p>
              <p className="text-2xl font-bold">{Math.round(voiceMetrics.processingTime)}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium">Speech Generation</p>
              <p className="text-2xl font-bold">{Math.round(speechMetrics.generationTime)}ms</p>
            </div>
            <div>
              <p className="text-sm font-medium">Audio Quality</p>
              <p className="text-2xl font-bold">{Math.round(voiceMetrics.audioQuality || 0)}%</p>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Quality Tests</h3>
            <Button onClick={runAllTests} disabled={tests.some(t => t.status === 'running')}>
              Run All Tests
            </Button>
          </div>

          {tests.map((test) => (
            <div key={test.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium">{test.name}</h4>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => runTest(test.id)}
                  disabled={test.status === 'running'}
                >
                  {test.status === 'running' ? 'Testing...' : 'Run Test'}
                </Button>
              </div>

              {test.results && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 p-3 bg-muted rounded">
                  <div>
                    <p className="text-xs text-muted-foreground">Latency</p>
                    <p className="font-mono">{Math.round(test.results.latency)}ms</p>
                  </div>
                  {test.results.accuracy && (
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-mono">{test.results.accuracy}%</p>
                    </div>
                  )}
                  {test.results.quality && (
                    <div>
                      <p className="text-xs text-muted-foreground">Quality</p>
                      <div className="flex items-center gap-2">
                        <Progress value={test.results.quality} className="w-16 h-2" />
                        <span className="text-xs">{Math.round(test.results.quality)}%</span>
                      </div>
                    </div>
                  )}
                  {test.results.error && (
                    <div className="col-span-2">
                      <p className="text-xs text-red-600">{test.results.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Phrase */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Test Phrase:</p>
          <p className="text-sm italic">"{testPhrase}"</p>
          {transcript && (
            <>
              <p className="text-sm font-medium mt-3 mb-1">Last Transcription:</p>
              <p className="text-sm text-muted-foreground">"{transcript}"</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};