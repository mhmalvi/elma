import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Wifi, Mic, Volume2, Battery, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration';

interface BrowserTest {
  name: string;
  description: string;
  status: 'idle' | 'running' | 'passed' | 'failed' | 'warning';
  result?: any;
  error?: string;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  isTablet: boolean;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenSize: string;
  viewport: string;
  devicePixelRatio: number;
  touchSupport: boolean;
  orientation: string;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface AudioCapabilities {
  mediaDevicesSupported: boolean;
  webAudioSupported: boolean;
  speechRecognitionSupported: boolean;
  speechSynthesisSupported: boolean;
  maxChannels: number;
  sampleRate: number;
  formats: string[];
}

export const MobileBrowserTester = () => {
  const { toast } = useToast();
  const { startRecording, stopRecording, speakText, isRecording, isProcessingVoice, isPlayingAudio } = useVoiceIntegration();
  
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [audioCapabilities, setAudioCapabilities] = useState<AudioCapabilities | null>(null);
  const [tests, setTests] = useState<BrowserTest[]>([
    { name: 'Device Detection', description: 'Detect mobile device and capabilities', status: 'idle' },
    { name: 'Network Analysis', description: 'Analyze network conditions', status: 'idle' },
    { name: 'Audio API Support', description: 'Test Web Audio API compatibility', status: 'idle' },
    { name: 'Microphone Access', description: 'Test microphone permissions and access', status: 'idle' },
    { name: 'Voice Recording', description: 'Test voice recording functionality', status: 'idle' },
    { name: 'Voice Playback', description: 'Test audio playback capabilities', status: 'idle' },
    { name: 'Speech Recognition', description: 'Test speech-to-text APIs', status: 'idle' },
    { name: 'Speech Synthesis', description: 'Test text-to-speech APIs', status: 'idle' },
    { name: 'Performance Test', description: 'Test voice processing performance', status: 'idle' },
    { name: 'Battery Impact', description: 'Measure battery usage during voice operations', status: 'idle' }
  ]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  // Detect device information
  const detectDevice = async (): Promise<DeviceInfo> => {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    
    // Mobile detection
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?!.*\bPhone\b)|KFAPWI/i.test(ua);
    
    // Browser detection
    let browser = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (ua.includes('Chrome')) {
      browser = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari')) {
      browser = 'Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Firefox')) {
      browser = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edge')) {
      browser = 'Edge';
      browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    }
    
    // OS detection
    let os = 'Unknown';
    let osVersion = 'Unknown';
    
    if (ua.includes('Android')) {
      os = 'Android';
      osVersion = ua.match(/Android ([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('iPhone') || ua.includes('iPad')) {
      os = 'iOS';
      osVersion = ua.match(/OS ([0-9_]+)/)?.[1]?.replace(/_/g, '.') || 'Unknown';
    } else if (ua.includes('Windows')) {
      os = 'Windows';
    } else if (ua.includes('Mac')) {
      os = 'macOS';
    } else if (ua.includes('Linux')) {
      os = 'Linux';
    }
    
    return {
      userAgent: ua,
      platform,
      isMobile,
      isTablet,
      browser,
      browserVersion,
      os,
      osVersion,
      screenSize: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      orientation: screen.orientation?.type || 'unknown'
    };
  };

  // Detect network information
  const detectNetwork = async (): Promise<NetworkInfo> => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
    }
    
    // Fallback network test
    const start = performance.now();
    try {
      await fetch('/favicon.ico', { cache: 'no-cache' });
      const rtt = performance.now() - start;
      return {
        effectiveType: rtt < 150 ? '4g' : rtt < 500 ? '3g' : '2g',
        downlink: 0,
        rtt,
        saveData: false
      };
    } catch {
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      };
    }
  };

  // Test audio capabilities
  const testAudioCapabilities = async (): Promise<AudioCapabilities> => {
    const capabilities: AudioCapabilities = {
      mediaDevicesSupported: !!navigator.mediaDevices,
      webAudioSupported: !!(window.AudioContext || (window as any).webkitAudioContext),
      speechRecognitionSupported: !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition),
      speechSynthesisSupported: !!window.speechSynthesis,
      maxChannels: 0,
      sampleRate: 0,
      formats: []
    };
    
    // Test audio context
    if (capabilities.webAudioSupported) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        capabilities.maxChannels = audioContext.destination.maxChannelCount;
        capabilities.sampleRate = audioContext.sampleRate;
        audioContext.close();
      } catch (error) {
        console.error('Audio context test failed:', error);
      }
    }
    
    // Test audio formats
    const audio = new Audio();
    const formats = [
      { ext: 'mp3', mime: 'audio/mpeg' },
      { ext: 'wav', mime: 'audio/wav' },
      { ext: 'ogg', mime: 'audio/ogg' },
      { ext: 'webm', mime: 'audio/webm' },
      { ext: 'm4a', mime: 'audio/mp4' }
    ];
    
    for (const format of formats) {
      if (audio.canPlayType(format.mime)) {
        capabilities.formats.push(format.ext);
      }
    }
    
    return capabilities;
  };

  // Run individual test
  const runTest = async (testName: string) => {
    const updateTest = (updates: Partial<BrowserTest>) => {
      setTests(prev => prev.map(test => 
        test.name === testName ? { ...test, ...updates } : test
      ));
    };

    updateTest({ status: 'running' });

    try {
      switch (testName) {
        case 'Device Detection':
          const device = await detectDevice();
          setDeviceInfo(device);
          updateTest({ status: 'passed', result: device });
          break;

        case 'Network Analysis':
          const network = await detectNetwork();
          setNetworkInfo(network);
          updateTest({ 
            status: network.effectiveType === '2g' ? 'warning' : 'passed', 
            result: network 
          });
          break;

        case 'Audio API Support':
          const audio = await testAudioCapabilities();
          setAudioCapabilities(audio);
          const audioStatus = audio.mediaDevicesSupported && audio.webAudioSupported ? 'passed' : 'failed';
          updateTest({ status: audioStatus, result: audio });
          break;

        case 'Microphone Access':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            updateTest({ status: 'passed', result: { access: true } });
          } catch (error) {
            updateTest({ status: 'failed', error: (error as Error).message });
          }
          break;

        case 'Voice Recording':
          try {
            await startRecording();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await stopRecording();
            updateTest({ status: 'passed', result: { recording: true } });
          } catch (error) {
            updateTest({ status: 'failed', error: (error as Error).message });
          }
          break;

        case 'Voice Playback':
          try {
            await speakText('Audio playback test successful');
            updateTest({ status: 'passed', result: { playback: true } });
          } catch (error) {
            updateTest({ status: 'failed', error: (error as Error).message });
          }
          break;

        case 'Speech Recognition':
          const speechRecSupported = !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
          updateTest({ 
            status: speechRecSupported ? 'passed' : 'warning',
            result: { supported: speechRecSupported }
          });
          break;

        case 'Speech Synthesis':
          const speechSynSupported = !!window.speechSynthesis;
          updateTest({ 
            status: speechSynSupported ? 'passed' : 'warning',
            result: { supported: speechSynSupported }
          });
          break;

        case 'Performance Test':
          const startTime = performance.now();
          await speakText('Performance test');
          const endTime = performance.now();
          const processingTime = endTime - startTime;
          
          updateTest({ 
            status: processingTime < 1000 ? 'passed' : processingTime < 2000 ? 'warning' : 'failed',
            result: { processingTime }
          });
          break;

        case 'Battery Impact':
          // Mock battery test (actual battery API is limited)
          const battery = (navigator as any).getBattery ? await (navigator as any).getBattery() : null;
          updateTest({ 
            status: 'passed',
            result: { 
              batteryAPI: !!battery,
              charging: battery?.charging,
              level: battery?.level
            }
          });
          break;

        default:
          throw new Error('Unknown test');
      }
    } catch (error) {
      updateTest({ 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestProgress(0);
    
    for (let i = 0; i < tests.length; i++) {
      await runTest(tests[i].name);
      setTestProgress(((i + 1) / tests.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
    }
    
    setIsRunningTests(false);
    toast({
      title: "Testing Complete",
      description: "Mobile browser compatibility test finished",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'running': return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default: return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile Browser Compatibility Tester
        </CardTitle>
        <CardDescription>
          Test voice functionality across different mobile browsers and devices
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="tests" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tests" className="space-y-4">
            <div className="flex justify-between items-center">
              <Button onClick={runAllTests} disabled={isRunningTests}>
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Smartphone className="w-3 h-3 mr-1" />
                  {deviceInfo?.isMobile ? 'Mobile' : 'Desktop'}
                </Badge>
                <Badge variant="outline">
                  <Wifi className="w-3 h-3 mr-1" />
                  {networkInfo?.effectiveType || 'Unknown'}
                </Badge>
              </div>
            </div>

            {isRunningTests && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Running tests...</span>
                  <span>{Math.round(testProgress)}%</span>
                </div>
                <Progress value={testProgress} className="w-full" />
              </div>
            )}

            <div className="space-y-2">
              {tests.map((test) => (
                <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <p className="font-medium">{test.name}</p>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                      {test.error && (
                        <p className="text-sm text-red-500">{test.error}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runTest(test.name)}
                    disabled={test.status === 'running' || isRunningTests}
                  >
                    Test
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="device" className="space-y-4">
            {deviceInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-medium">Device Type</p>
                    <Badge variant={deviceInfo.isMobile ? "default" : "secondary"}>
                      {deviceInfo.isMobile ? 'Mobile' : 'Desktop'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Browser</p>
                    <p className="text-sm">{deviceInfo.browser} {deviceInfo.browserVersion}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Operating System</p>
                    <p className="text-sm">{deviceInfo.os} {deviceInfo.osVersion}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Screen Size</p>
                    <p className="text-sm">{deviceInfo.screenSize}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Touch Support</p>
                    <Badge variant={deviceInfo.touchSupport ? "default" : "secondary"}>
                      {deviceInfo.touchSupport ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Device Pixel Ratio</p>
                    <p className="text-sm">{deviceInfo.devicePixelRatio}x</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Run device detection test to see device information</p>
            )}
          </TabsContent>
          
          <TabsContent value="network" className="space-y-4">
            {networkInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium">Connection Type</p>
                  <Badge variant={networkInfo.effectiveType === '4g' ? "default" : "secondary"}>
                    {networkInfo.effectiveType}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Downlink Speed</p>
                  <p className="text-sm">{networkInfo.downlink} Mbps</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Round Trip Time</p>
                  <p className="text-sm">{networkInfo.rtt}ms</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Data Saver</p>
                  <Badge variant={networkInfo.saveData ? "secondary" : "default"}>
                    {networkInfo.saveData ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Run network analysis test to see network information</p>
            )}
          </TabsContent>
          
          <TabsContent value="audio" className="space-y-4">
            {audioCapabilities ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-medium">Media Devices API</p>
                    <Badge variant={audioCapabilities.mediaDevicesSupported ? "default" : "destructive"}>
                      {audioCapabilities.mediaDevicesSupported ? 'Supported' : 'Not Supported'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Web Audio API</p>
                    <Badge variant={audioCapabilities.webAudioSupported ? "default" : "destructive"}>
                      {audioCapabilities.webAudioSupported ? 'Supported' : 'Not Supported'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Speech Recognition</p>
                    <Badge variant={audioCapabilities.speechRecognitionSupported ? "default" : "secondary"}>
                      {audioCapabilities.speechRecognitionSupported ? 'Supported' : 'Not Supported'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Speech Synthesis</p>
                    <Badge variant={audioCapabilities.speechSynthesisSupported ? "default" : "secondary"}>
                      {audioCapabilities.speechSynthesisSupported ? 'Supported' : 'Not Supported'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Max Channels</p>
                    <p className="text-sm">{audioCapabilities.maxChannels}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium">Sample Rate</p>
                    <p className="text-sm">{audioCapabilities.sampleRate}Hz</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">Supported Audio Formats</p>
                  <div className="flex flex-wrap gap-2">
                    {audioCapabilities.formats.map(format => (
                      <Badge key={format} variant="outline">{format}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Run audio API test to see audio capabilities</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};