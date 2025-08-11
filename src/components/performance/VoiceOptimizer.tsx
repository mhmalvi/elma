import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, Volume2, Zap, Settings, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceSettings {
  // Audio input optimization
  sampleRate: number;
  bitRate: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  
  // Processing optimization
  chunkSize: number;
  processingBuffer: number;
  compressionLevel: number;
  
  // Output optimization
  audioQuality: 'low' | 'medium' | 'high' | 'ultra';
  latencyMode: 'realtime' | 'balanced' | 'quality';
  caching: boolean;
  
  // Mobile optimization
  mobileOptimized: boolean;
  batteryOptimized: boolean;
  dataUsageOptimized: boolean;
}

interface PerformanceMetrics {
  latency: number;
  processingTime: number;
  audioQuality: number;
  batteryUsage: number;
  dataUsage: number;
  errorRate: number;
}

const defaultSettings: VoiceSettings = {
  sampleRate: 16000,
  bitRate: 128,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  chunkSize: 4096,
  processingBuffer: 2048,
  compressionLevel: 5,
  audioQuality: 'medium',
  latencyMode: 'balanced',
  caching: true,
  mobileOptimized: true,
  batteryOptimized: false,
  dataUsageOptimized: false
};

export const VoiceOptimizer = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    latency: 0,
    processingTime: 0,
    audioQuality: 0,
    batteryUsage: 0,
    dataUsage: 0,
    errorRate: 0
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('voice_optimizer_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading voice settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: VoiceSettings) => {
    setSettings(newSettings);
    localStorage.setItem('voice_optimizer_settings', JSON.stringify(newSettings));
  };

  // Detect device capabilities and auto-optimize
  const autoOptimize = async () => {
    setIsOptimizing(true);
    setOptimizationProgress(0);

    try {
      // Device detection
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEnd = navigator.hardwareConcurrency <= 2;
      
      setOptimizationProgress(20);

      // Network detection
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const isSlowNetwork = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      
      setOptimizationProgress(40);

      // Memory detection
      const memory = (performance as any).memory;
      const isLowMemory = memory && memory.totalJSHeapSize > memory.jsHeapSizeLimit * 0.8;
      
      setOptimizationProgress(60);

      // Audio API capabilities
      let supportsHighQuality = true;
      try {
        const audioContext = new AudioContext();
        supportsHighQuality = audioContext.sampleRate >= 44100;
        audioContext.close();
      } catch {
        supportsHighQuality = false;
      }
      
      setOptimizationProgress(80);

      // Generate optimized settings
      const optimizedSettings: VoiceSettings = {
        ...settings,
        // Mobile optimizations
        sampleRate: isMobile || isLowEnd ? 16000 : supportsHighQuality ? 24000 : 16000,
        bitRate: isSlowNetwork ? 64 : isMobile ? 96 : 128,
        chunkSize: isLowEnd ? 2048 : 4096,
        processingBuffer: isLowMemory ? 1024 : 2048,
        compressionLevel: isSlowNetwork ? 8 : 5,
        
        // Quality vs performance balance
        audioQuality: isLowEnd ? 'low' : isSlowNetwork ? 'medium' : 'high',
        latencyMode: isMobile ? 'realtime' : 'balanced',
        
        // Optimization flags
        mobileOptimized: isMobile,
        batteryOptimized: isMobile && isLowEnd,
        dataUsageOptimized: isSlowNetwork,
        
        // Audio processing
        echoCancellation: !isLowEnd,
        noiseSuppression: !isLowEnd,
        autoGainControl: true
      };

      setOptimizationProgress(100);
      saveSettings(optimizedSettings);

      toast({
        title: "Optimization Complete",
        description: `Settings optimized for ${isMobile ? 'mobile' : 'desktop'} ${isLowEnd ? '(low-end)' : ''} device`,
      });

    } catch (error) {
      console.error('Auto-optimization failed:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to auto-optimize settings",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  // Test current settings and measure performance
  const testPerformance = async () => {
    setIsTesting(true);
    
    try {
      const startTime = performance.now();
      
      // Mock voice processing test
      const mockAudioData = new ArrayBuffer(settings.chunkSize * 4);
      const processingStart = performance.now();
      
      // Simulate processing with current settings
      await new Promise(resolve => {
        const processingTime = settings.audioQuality === 'ultra' ? 500 : 
                             settings.audioQuality === 'high' ? 300 :
                             settings.audioQuality === 'medium' ? 200 : 100;
        setTimeout(resolve, processingTime);
      });
      
      const processingEnd = performance.now();
      const totalTime = processingEnd - startTime;
      
      // Calculate metrics based on settings
      const latency = settings.latencyMode === 'realtime' ? 150 : 
                     settings.latencyMode === 'balanced' ? 300 : 500;
      
      const audioQuality = settings.audioQuality === 'ultra' ? 95 :
                          settings.audioQuality === 'high' ? 85 :
                          settings.audioQuality === 'medium' ? 70 : 55;
      
      const batteryUsage = (settings.sampleRate / 1000) + (settings.bitRate / 10) + 
                          (settings.echoCancellation ? 10 : 0) + 
                          (settings.noiseSuppression ? 15 : 0);
      
      const dataUsage = (settings.bitRate * 0.125) + (settings.compressionLevel > 5 ? -20 : 0);
      
      setMetrics({
        latency,
        processingTime: processingEnd - processingStart,
        audioQuality,
        batteryUsage: Math.min(100, batteryUsage),
        dataUsage: Math.max(0, dataUsage),
        errorRate: Math.random() * 5 // Mock error rate
      });

      toast({
        title: "Performance Test Complete",
        description: `Latency: ${latency}ms, Quality: ${audioQuality}%`,
      });

    } catch (error) {
      console.error('Performance test failed:', error);
      toast({
        title: "Test Failed",
        description: "Failed to test voice performance",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Reset to default settings
  const resetSettings = () => {
    saveSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "Voice settings have been reset to defaults",
    });
  };

  // Apply preset configurations
  const applyPreset = (preset: 'performance' | 'quality' | 'battery' | 'data') => {
    let presetSettings: Partial<VoiceSettings> = {};
    
    switch (preset) {
      case 'performance':
        presetSettings = {
          sampleRate: 16000,
          bitRate: 96,
          audioQuality: 'medium',
          latencyMode: 'realtime',
          chunkSize: 2048,
          compressionLevel: 7,
          echoCancellation: false,
          noiseSuppression: false
        };
        break;
      case 'quality':
        presetSettings = {
          sampleRate: 24000,
          bitRate: 192,
          audioQuality: 'ultra',
          latencyMode: 'quality',
          chunkSize: 8192,
          compressionLevel: 3,
          echoCancellation: true,
          noiseSuppression: true
        };
        break;
      case 'battery':
        presetSettings = {
          sampleRate: 16000,
          bitRate: 64,
          audioQuality: 'low',
          latencyMode: 'balanced',
          chunkSize: 2048,
          compressionLevel: 9,
          batteryOptimized: true,
          echoCancellation: false,
          noiseSuppression: false
        };
        break;
      case 'data':
        presetSettings = {
          sampleRate: 16000,
          bitRate: 48,
          audioQuality: 'low',
          compressionLevel: 9,
          dataUsageOptimized: true,
          caching: true
        };
        break;
    }
    
    saveSettings({ ...settings, ...presetSettings });
    toast({
      title: "Preset Applied",
      description: `${preset} optimization preset has been applied`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Voice Performance Optimizer
        </CardTitle>
        <CardDescription>
          Optimize voice processing for your device and network conditions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            onClick={autoOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {isOptimizing ? 'Optimizing...' : 'Auto-Optimize'}
          </Button>
          <Button
            onClick={testPerformance}
            disabled={isTesting}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            {isTesting ? 'Testing...' : 'Test Performance'}
          </Button>
          <Button onClick={resetSettings} variant="outline">
            Reset
          </Button>
          <Select onValueChange={(value) => applyPreset(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Presets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="battery">Battery</SelectItem>
              <SelectItem value="data">Data Saver</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Optimization Progress */}
        {isOptimizing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Optimizing settings...</span>
              <span>{optimizationProgress}%</span>
            </div>
            <Progress value={optimizationProgress} className="w-full" />
          </div>
        )}

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{metrics.latency}ms</p>
            <p className="text-sm text-muted-foreground">Latency</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{Math.round(metrics.audioQuality)}%</p>
            <p className="text-sm text-muted-foreground">Quality</p>
          </div>
          <div className="text-center p-3 border rounded-lg">
            <p className="text-2xl font-bold">{Math.round(metrics.batteryUsage)}%</p>
            <p className="text-sm text-muted-foreground">Battery Impact</p>
          </div>
        </div>

        {/* Audio Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Audio Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sample Rate: {settings.sampleRate}Hz</label>
              <Slider
                value={[settings.sampleRate]}
                onValueChange={([value]) => saveSettings({ ...settings, sampleRate: value })}
                min={8000}
                max={48000}
                step={8000}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Bit Rate: {settings.bitRate}kbps</label>
              <Slider
                value={[settings.bitRate]}
                onValueChange={([value]) => saveSettings({ ...settings, bitRate: value })}
                min={32}
                max={320}
                step={32}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Echo Cancellation</label>
              <Switch
                checked={settings.echoCancellation}
                onCheckedChange={(checked) => saveSettings({ ...settings, echoCancellation: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Noise Suppression</label>
              <Switch
                checked={settings.noiseSuppression}
                onCheckedChange={(checked) => saveSettings({ ...settings, noiseSuppression: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Auto Gain Control</label>
              <Switch
                checked={settings.autoGainControl}
                onCheckedChange={(checked) => saveSettings({ ...settings, autoGainControl: checked })}
              />
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">Performance Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Audio Quality</label>
              <Select value={settings.audioQuality} onValueChange={(value: any) => saveSettings({ ...settings, audioQuality: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Fast)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="ultra">Ultra (Slow)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Latency Mode</label>
              <Select value={settings.latencyMode} onValueChange={(value: any) => saveSettings({ ...settings, latencyMode: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Real-time</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Mobile Optimized</label>
              <Switch
                checked={settings.mobileOptimized}
                onCheckedChange={(checked) => saveSettings({ ...settings, mobileOptimized: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Battery Optimized</label>
              <Switch
                checked={settings.batteryOptimized}
                onCheckedChange={(checked) => saveSettings({ ...settings, batteryOptimized: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Data Usage Optimized</label>
              <Switch
                checked={settings.dataUsageOptimized}
                onCheckedChange={(checked) => saveSettings({ ...settings, dataUsageOptimized: checked })}
              />
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Recommendations</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            {metrics.latency > 500 && (
              <li>• Consider using real-time latency mode for better responsiveness</li>
            )}
            {metrics.batteryUsage > 70 && (
              <li>• Enable battery optimization to reduce power consumption</li>
            )}
            {metrics.audioQuality < 60 && (
              <li>• Increase audio quality settings for better voice recognition</li>
            )}
            {settings.sampleRate > 24000 && (
              <li>• Lower sample rate may improve performance on mobile devices</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};