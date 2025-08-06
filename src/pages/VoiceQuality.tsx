import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Volume2, Mic, Settings, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function VoiceQuality() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Voice Quality</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and optimize your voice interaction experience
          </p>
        </div>
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
          Real-time
        </Badge>
      </div>

      {/* Voice Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Audio Input Quality */}
        <Card className="glass hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audio Input Quality</CardTitle>
            <Mic className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">92%</div>
            <Progress value={92} className="mt-2" />
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
              Excellent clarity
            </div>
          </CardContent>
        </Card>

        {/* Audio Output Quality */}
        <Card className="glass hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audio Output Quality</CardTitle>
            <Volume2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">87%</div>
            <Progress value={87} className="mt-2" />
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
              High fidelity
            </div>
          </CardContent>
        </Card>

        {/* Voice Recognition Accuracy */}
        <Card className="glass hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recognition Accuracy</CardTitle>
            <Settings className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">95%</div>
            <Progress value={95} className="mt-2" />
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
              Optimal performance
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Voice System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Microphone Status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-3">
                <Mic className="h-4 w-4 text-primary" />
                <span className="font-medium">Microphone</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Connected</span>
              </div>
            </div>

            {/* Speech Recognition */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-primary" />
                <span className="font-medium">Speech Recognition</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>

            {/* Text-to-Speech */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-primary" />
                <span className="font-medium">Text-to-Speech</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Ready</span>
              </div>
            </div>

            {/* Voice Processing */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Voice Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 font-medium">Optimizing</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="bg-gradient-primary hover:bg-gradient-primary/90 text-primary-foreground">
              <Volume2 className="h-4 w-4 mr-2" />
              Test Audio Output
            </Button>
            <Button variant="outline">
              <Mic className="h-4 w-4 mr-2" />
              Test Microphone
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Audio Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}