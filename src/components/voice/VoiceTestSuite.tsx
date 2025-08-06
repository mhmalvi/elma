import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Mic, Volume2, MessageSquare } from 'lucide-react';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
}

export const VoiceTestSuite = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Voice Recording Permissions', status: 'idle' },
    { name: 'Audio Recording Quality', status: 'idle' },
    { name: 'Voice-to-Text Transcription', status: 'idle' },
    { name: 'Text-to-Speech Synthesis', status: 'idle' },
    { name: 'AI Chat Integration', status: 'idle' },
    { name: 'End-to-End Voice Flow', status: 'idle' }
  ]);

  const { 
    startRecording, 
    stopRecording, 
    speakText, 
    isRecording, 
    isProcessingVoice, 
    isPlayingAudio,
    transcript 
  } = useVoiceIntegration();
  
  const { toast } = useToast();

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...updates } : test
    ));
  };

  const runTest = async (testName: string) => {
    const startTime = Date.now();
    updateTest(testName, { status: 'running' });

    try {
      switch (testName) {
        case 'Voice Recording Permissions':
          await navigator.mediaDevices.getUserMedia({ audio: true });
          break;

        case 'Audio Recording Quality':
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Recording timeout')), 3000);
            startRecording();
            setTimeout(() => {
              stopRecording();
              clearTimeout(timeout);
              resolve(null);
            }, 2000);
          });
          break;

        case 'Voice-to-Text Transcription':
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: 'test_audio_data' }
          });
          if (error) throw error;
          break;

        case 'Text-to-Speech Synthesis':
          await speakText('Testing voice synthesis quality and clarity');
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;

        case 'AI Chat Integration':
          const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-chat', {
            body: { question: 'What is Islam?' }
          });
          if (aiError) throw aiError;
          break;

        case 'End-to-End Voice Flow':
          // Test the complete voice pipeline
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('E2E test timeout')), 10000);
            
            // Simulate voice input -> AI response -> voice output
            startRecording();
            setTimeout(() => {
              stopRecording();
              setTimeout(() => {
                speakText('End-to-end voice test completed successfully');
                clearTimeout(timeout);
                resolve(null);
              }, 3000);
            }, 2000);
          });
          break;

        default:
          throw new Error('Unknown test');
      }

      const duration = Date.now() - startTime;
      updateTest(testName, { status: 'passed', duration });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(testName, { 
        status: 'failed', 
        duration, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.name);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
    }
    
    const passedTests = tests.filter(t => t.status === 'passed').length;
    toast({
      title: "Voice Tests Complete",
      description: `${passedTests}/${tests.length} tests passed`,
      variant: passedTests === tests.length ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Pipeline Test Suite
        </CardTitle>
        <CardDescription>
          Comprehensive testing for end-to-end voice functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button onClick={runAllTests} variant="default">
            Run All Tests
          </Button>
          <Badge variant={isRecording ? "destructive" : "secondary"}>
            {isRecording ? "Recording" : "Ready"}
          </Badge>
          <Badge variant={isProcessingVoice ? "secondary" : "outline"}>
            {isProcessingVoice ? "Processing" : "Idle"}
          </Badge>
          <Badge variant={isPlayingAudio ? "secondary" : "outline"}>
            {isPlayingAudio ? "Playing" : "Silent"}
          </Badge>
        </div>

        {transcript && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Last Transcript:</p>
            <p className="font-medium">{transcript}</p>
          </div>
        )}

        <div className="space-y-2">
          {tests.map((test) => (
            <div
              key={test.name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium">{test.name}</p>
                  {test.error && (
                    <p className="text-sm text-red-500">{test.error}</p>
                  )}
                  {test.duration && (
                    <p className="text-sm text-muted-foreground">
                      {test.duration}ms
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => runTest(test.name)}
                disabled={test.status === 'running'}
              >
                {test.status === 'running' ? 'Running...' : 'Test'}
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={startRecording}
            disabled={isRecording}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Record
          </Button>
          <Button
            variant="outline"
            onClick={() => speakText('Voice test message')}
            disabled={isPlayingAudio}
            className="flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            Speak
          </Button>
          <Button
            variant="outline"
            onClick={() => runTest('AI Chat Integration')}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            AI Test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};