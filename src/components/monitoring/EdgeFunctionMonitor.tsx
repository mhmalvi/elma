import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FunctionLog {
  log_timestamp: string;
  function_name: string;
  event_message: string;
  status_code?: number;
  execution_time_ms?: number;
  method?: string;
  level: 'log' | 'error' | 'warn' | 'info';
}

interface FunctionHealth {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastCall?: string;
  averageResponseTime?: number;
  errorRate?: number;
  totalCalls?: number;
}

export const EdgeFunctionMonitor = () => {
  const [logs, setLogs] = useState<FunctionLog[]>([]);
  const [health, setHealth] = useState<FunctionHealth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const functionNames = ['ai-chat', 'voice-to-text', 'text-to-voice', 'query-islamic-content'];

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_recent_function_logs', { 
        limit_count: 100 
      });

      if (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }

      // Cast the data to ensure proper typing
      const typedLogs: FunctionLog[] = (data || []).map((log: any) => ({
        ...log,
        level: log.level as FunctionLog['level']
      }));

      setLogs(typedLogs);
    } catch (error) {
      console.error('Error in fetchLogs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch function logs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateHealth = (functionName: string): FunctionHealth => {
    const functionLogs = logs.filter(log => 
      log.function_name === functionName || 
      log.event_message.includes(functionName)
    );

    if (functionLogs.length === 0) {
      return {
        name: functionName,
        status: 'unknown'
      };
    }

    const recentLogs = functionLogs.slice(0, 10);
    const errorLogs = recentLogs.filter(log => 
      log.level === 'error' || 
      (log.status_code && log.status_code >= 400)
    );
    
    const errorRate = errorLogs.length / recentLogs.length;
    const avgResponseTime = recentLogs
      .filter(log => log.execution_time_ms)
      .reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / recentLogs.length;

    let status: FunctionHealth['status'] = 'healthy';
    if (errorRate > 0.5) status = 'error';
    else if (errorRate > 0.2 || avgResponseTime > 10000) status = 'warning';

    return {
      name: functionName,
      status,
      lastCall: functionLogs[0]?.log_timestamp,
      averageResponseTime: avgResponseTime || undefined,
      errorRate: errorRate * 100,
      totalCalls: functionLogs.length
    };
  };

  const testFunction = async (functionName: string) => {
    setIsLoading(true);
    try {
      let testPayload;
      switch (functionName) {
        case 'ai-chat':
          testPayload = { question: 'Test message' };
          break;
        case 'voice-to-text':
          testPayload = { audio: 'test_audio' };
          break;
        case 'text-to-voice':
          testPayload = { text: 'Test speech' };
          break;
        case 'query-islamic-content':
          testPayload = { query: 'test query' };
          break;
        default:
          testPayload = {};
      }

      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: testPayload
      });
      const duration = Date.now() - startTime;

      if (error) {
        toast({
          title: `${functionName} Test Failed`,
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: `${functionName} Test Passed`,
          description: `Response time: ${duration}ms`,
        });
      }
    } catch (error) {
      toast({
        title: `${functionName} Test Error`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      await fetchLogs(); // Refresh logs after test
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const healthData = functionNames.map(calculateHealth);
    setHealth(healthData);
  }, [logs]);

  const getStatusIcon = (status: FunctionHealth['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: FunctionHealth['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Edge Function Monitor
        </CardTitle>
        <CardDescription>
          Real-time monitoring of Supabase Edge Functions health and performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            onClick={fetchLogs}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Logs
          </Button>
          <Badge variant="outline">
            {logs.length} recent logs
          </Badge>
        </div>

        {/* Function Health Overview */}
        <div className="grid grid-cols-2 gap-4">
          {health.map((func) => (
            <div key={func.name} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(func.status)}
                  <span className="font-medium">{func.name}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(func.status)}`} />
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                {func.lastCall && (
                  <p>Last call: {new Date(func.lastCall).toLocaleTimeString()}</p>
                )}
                {func.averageResponseTime && (
                  <p>Avg response: {Math.round(func.averageResponseTime)}ms</p>
                )}
                {func.errorRate !== undefined && (
                  <p>Error rate: {func.errorRate.toFixed(1)}%</p>
                )}
              </div>

              <Button
                onClick={() => testFunction(func.name)}
                variant="outline"
                size="sm"
                className="w-full mt-2"
                disabled={isLoading}
              >
                Test Function
              </Button>
            </div>
          ))}
        </div>

        {/* Recent Logs */}
        <div>
          <h4 className="font-medium mb-2">Recent Function Logs</h4>
          <ScrollArea className="h-64 border rounded-lg p-3">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No logs available. Click refresh to fetch recent logs.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      log.level === 'error' 
                        ? 'bg-red-50 border-l-2 border-red-500' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{log.function_name}</span>
                      <div className="flex items-center gap-2">
                        {log.status_code && (
                          <Badge variant={log.status_code < 400 ? "default" : "destructive"}>
                            {log.status_code}
                          </Badge>
                        )}
                        {log.execution_time_ms && (
                          <span className="text-xs text-muted-foreground">
                            {log.execution_time_ms}ms
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs">{log.event_message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.log_timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};