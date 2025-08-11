import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value?: string;
  lastChecked: Date;
  description?: string;
}

interface SystemHealthMonitorProps {
  className?: string;
}

export const SystemHealthMonitor = ({ className }: SystemHealthMonitorProps) => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkDatabaseHealth = async (): Promise<HealthMetric> => {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const latency = Date.now() - start;
      
      if (error) {
        return {
          name: 'Database',
          status: 'error',
          value: `Error: ${error.message}`,
          lastChecked: new Date(),
          description: 'Database connection failed'
        };
      }
      
      return {
        name: 'Database',
        status: latency > 1000 ? 'warning' : 'healthy',
        value: `${latency}ms`,
        lastChecked: new Date(),
        description: 'Database response time'
      };
    } catch (error) {
      logger.error('Database health check failed', { 
        component: 'SystemHealthMonitor',
        error: error as Error
      });
      
      return {
        name: 'Database',
        status: 'error',
        value: 'Connection failed',
        lastChecked: new Date(),
        description: 'Unable to connect to database'
      };
    }
  };

  const checkEdgeFunctionHealth = async (): Promise<HealthMetric> => {
    try {
      const start = Date.now();
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          question: 'health check',
          health_check: true
        }
      });
      
      const latency = Date.now() - start;
      
      if (error) {
        return {
          name: 'AI Chat Function',
          status: 'error',
          value: `Error: ${error.message}`,
          lastChecked: new Date(),
          description: 'Edge function not responding'
        };
      }
      
      return {
        name: 'AI Chat Function',
        status: latency > 5000 ? 'warning' : 'healthy',
        value: `${latency}ms`,
        lastChecked: new Date(),
        description: 'Edge function response time'
      };
    } catch (error) {
      logger.error('Edge function health check failed', { 
        component: 'SystemHealthMonitor',
        error: error as Error
      });
      
      return {
        name: 'AI Chat Function',
        status: 'error',
        value: 'Function unavailable',
        lastChecked: new Date(),
        description: 'Edge function is not responding'
      };
    }
  };

  const checkAuthHealth = async (): Promise<HealthMetric> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return {
          name: 'Authentication',
          status: 'warning',
          value: 'Service issue',
          lastChecked: new Date(),
          description: 'Auth service experiencing issues'
        };
      }
      
      return {
        name: 'Authentication',
        status: 'healthy',
        value: session ? 'Authenticated' : 'Ready',
        lastChecked: new Date(),
        description: 'Auth service operational'
      };
    } catch (error) {
      logger.error('Auth health check failed', { 
        component: 'SystemHealthMonitor',
        error: error as Error
      });
      
      return {
        name: 'Authentication',
        status: 'error',
        value: 'Service unavailable',
        lastChecked: new Date(),
        description: 'Cannot connect to auth service'
      };
    }
  };

  const runHealthChecks = async () => {
    setIsLoading(true);
    
    try {
      const [dbHealth, functionHealth, authHealth] = await Promise.all([
        checkDatabaseHealth(),
        checkEdgeFunctionHealth(),
        checkAuthHealth()
      ]);
      
      setMetrics([dbHealth, functionHealth, authHealth]);
    } catch (error) {
      logger.error('Health check suite failed', { 
        component: 'SystemHealthMonitor',
        error: error as Error
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthChecks();
    
    // Refresh every 30 seconds
    const interval = setInterval(runHealthChecks, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const overallStatus = metrics.some(m => m.status === 'error') ? 'error' :
                      metrics.some(m => m.status === 'warning') ? 'warning' : 'healthy';

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Health
          <Badge 
            variant={overallStatus === 'healthy' ? 'default' : 'destructive'}
            className={getStatusColor(overallStatus)}
          >
            {overallStatus.toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time monitoring of system components
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(metric.status)}`} />
                  <div>
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {metric.lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {overallStatus === 'error' && (
              <Alert variant="destructive">
                <AlertDescription>
                  One or more system components are experiencing issues. Please check the status above.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};