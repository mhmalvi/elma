import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  MessageCircle,
  Mic,
  Volume2,
  Database,
  Cloud,
  Wifi,
  Server,
  Timer,
  TrendingUp,
  Eye
} from 'lucide-react';

interface SystemMetrics {
  uptime: number;
  response_time: number;
  active_users: number;
  total_requests: number;
  error_rate: number;
  voice_success_rate: number;
  tts_latency: number;
  stt_accuracy: number;
  database_health: number;
  api_health: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface PerformanceData {
  timestamp: string;
  response_time: number;
  active_users: number;
  errors: number;
}

export const ProductionMonitoring = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 99.9,
    response_time: 245,
    active_users: 234,
    total_requests: 15847,
    error_rate: 0.1,
    voice_success_rate: 97.8,
    tts_latency: 1200,
    stt_accuracy: 95.6,
    database_health: 98.5,
    api_health: 99.2
  });
  
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock real-time data simulation
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'warning',
        message: 'ElevenLabs API response time increased to 1.8s (threshold: 1.5s)',
        timestamp: '2024-01-15T14:30:00Z',
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        message: 'Voice transcription accuracy improved to 95.6% (+2.1% from yesterday)',
        timestamp: '2024-01-15T13:45:00Z',
        resolved: true
      },
      {
        id: '3',
        type: 'error',
        message: 'Qdrant vector database connection timeout (resolved after 3 minutes)',
        timestamp: '2024-01-15T12:20:00Z',
        resolved: true
      }
    ];

    const mockPerformanceData: PerformanceData[] = [];
    for (let i = 23; i >= 0; i--) {
      mockPerformanceData.push({
        timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
        response_time: 200 + Math.random() * 100,
        active_users: 180 + Math.random() * 100,
        errors: Math.floor(Math.random() * 5)
      });
    }

    setAlerts(mockAlerts);
    setPerformanceData(mockPerformanceData);
    setLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        response_time: 200 + Math.random() * 100,
        active_users: Math.floor(180 + Math.random() * 100),
        total_requests: prev.total_requests + Math.floor(Math.random() * 10)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertBadge = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Info</Badge>;
    }
  };

  const getHealthStatus = (value: number) => {
    if (value >= 98) return { color: 'text-green-600', bg: 'bg-green-500' };
    if (value >= 95) return { color: 'text-yellow-600', bg: 'bg-yellow-500' };
    return { color: 'text-red-600', bg: 'bg-red-500' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(alert => !alert.resolved);

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Activity className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.uptime}%</div>
            <Progress value={metrics.uptime} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Timer className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.response_time)}ms</div>
            <p className="text-xs text-muted-foreground">Average API response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_users}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.error_rate}%</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Active Alerts ({activeAlerts.length})
            </CardTitle>
            <CardDescription>Issues requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <Alert key={alert.id} className="border-l-4 border-l-yellow-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getAlertBadge(alert.type)}
                      <Button variant="outline" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice System Performance
          </CardTitle>
          <CardDescription>Speech-to-text and text-to-speech metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-medium mb-2">Speech Recognition</h4>
              <div className="text-2xl font-bold mb-1">{metrics.stt_accuracy}%</div>
              <p className="text-sm text-muted-foreground">Accuracy rate</p>
              <Progress value={metrics.stt_accuracy} className="h-2 mt-2" />
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Volume2 className="w-8 h-8 text-accent" />
              </div>
              <h4 className="font-medium mb-2">Text-to-Speech</h4>
              <div className="text-2xl font-bold mb-1">{metrics.tts_latency}ms</div>
              <p className="text-sm text-muted-foreground">Average latency</p>
              <Progress value={100 - (metrics.tts_latency / 20)} className="h-2 mt-2" />
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-medium mb-2">Overall Success</h4>
              <div className="text-2xl font-bold mb-1 text-green-600">{metrics.voice_success_rate}%</div>
              <p className="text-sm text-muted-foreground">Voice pipeline</p>
              <Progress value={metrics.voice_success_rate} className="h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Health Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Service Health Matrix
          </CardTitle>
          <CardDescription>Health status of all critical services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Supabase DB', health: metrics.database_health, icon: Database },
              { name: 'OpenRouter API', health: metrics.api_health, icon: Cloud },
              { name: 'ElevenLabs TTS', health: 96.5, icon: Volume2 },
              { name: 'OpenAI Whisper', health: 98.1, icon: Mic },
              { name: 'Qdrant Vector DB', health: 94.2, icon: Database },
              { name: 'Auth Service', health: 99.8, icon: CheckCircle },
              { name: 'Edge Functions', health: 97.3, icon: Server },
              { name: 'CDN Network', health: 99.1, icon: Wifi }
            ].map((service, index) => {
              const status = getHealthStatus(service.health);
              return (
                <div key={index} className="border rounded-lg p-3 text-center">
                  <service.icon className={`w-6 h-6 mx-auto mb-2 ${status.color}`} />
                  <h4 className="font-medium text-sm mb-1">{service.name}</h4>
                  <div className={`text-lg font-bold ${status.color}`}>
                    {service.health.toFixed(1)}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${status.bg}`}
                      style={{ width: `${service.health}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Activity Log
          </CardTitle>
          <CardDescription>Recent system events and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getAlertBadge(alert.type)}
                  {alert.resolved && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Resolved
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common monitoring and maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Alert Settings</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Server className="w-5 h-5" />
              <span className="text-sm">System Logs</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Activity className="w-5 h-5" />
              <span className="text-sm">Performance</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};