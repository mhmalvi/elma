import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

interface BasicFunctionalityTestProps {
  className?: string;
}

export const BasicFunctionalityTest = ({ className }: BasicFunctionalityTestProps) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();

  const updateTestResult = (name: string, update: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(test => 
        test.name === name ? { ...test, ...update } : test
      )
    );
  };

  const testDatabaseConnection = async (): Promise<void> => {
    const testName = 'Database Connection';
    const start = Date.now();
    
    try {
      updateTestResult(testName, { status: 'running' });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      updateTestResult(testName, {
        status: 'passed',
        message: 'Database connection successful',
        duration: Date.now() - start
      });
    } catch (error) {
      logger.error('Database connection test failed', { 
        component: 'BasicFunctionalityTest',
        error: error as Error
      });
      
      updateTestResult(testName, {
        status: 'failed',
        message: `Database connection failed: ${(error as Error).message}`,
        duration: Date.now() - start
      });
    }
  };

  const testAuthentication = async (): Promise<void> => {
    const testName = 'Authentication';
    const start = Date.now();
    
    try {
      updateTestResult(testName, { status: 'running' });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      updateTestResult(testName, {
        status: 'passed',
        message: session ? 'User authenticated' : 'Auth service ready',
        duration: Date.now() - start
      });
    } catch (error) {
      logger.error('Authentication test failed', { 
        component: 'BasicFunctionalityTest',
        error: error as Error
      });
      
      updateTestResult(testName, {
        status: 'failed',
        message: `Authentication test failed: ${(error as Error).message}`,
        duration: Date.now() - start
      });
    }
  };

  const testAIChatFunction = async (): Promise<void> => {
    const testName = 'AI Chat Function';
    const start = Date.now();
    
    try {
      updateTestResult(testName, { status: 'running' });
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          question: 'test message',
          conversation_id: null,
          user_id: null,
          health_check: true
        }
      });
      
      if (error) throw error;
      
      updateTestResult(testName, {
        status: 'passed',
        message: 'AI function responding correctly',
        duration: Date.now() - start
      });
    } catch (error) {
      logger.error('AI Chat function test failed', { 
        component: 'BasicFunctionalityTest',
        error: error as Error
      });
      
      updateTestResult(testName, {
        status: 'failed',
        message: `AI function test failed: ${(error as Error).message}`,
        duration: Date.now() - start
      });
    }
  };

  const testVoiceFeatures = async (): Promise<void> => {
    const testName = 'Voice Features';
    const start = Date.now();
    
    try {
      updateTestResult(testName, { status: 'running' });
      
      // Test speech recognition support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speechSynthesis = window.speechSynthesis;
      
      if (!SpeechRecognition) {
        throw new Error('Speech Recognition not supported');
      }
      
      if (!speechSynthesis) {
        throw new Error('Speech Synthesis not supported');
      }
      
      updateTestResult(testName, {
        status: 'passed',
        message: 'Voice features supported in browser',
        duration: Date.now() - start
      });
    } catch (error) {
      logger.error('Voice features test failed', { 
        component: 'BasicFunctionalityTest',
        error: error as Error
      });
      
      updateTestResult(testName, {
        status: 'failed',
        message: `Voice test failed: ${(error as Error).message}`,
        duration: Date.now() - start
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Initialize test results
    const tests = [
      'Database Connection',
      'Authentication', 
      'AI Chat Function',
      'Voice Features'
    ];
    
    setTestResults(tests.map(name => ({
      name,
      status: 'pending' as const
    })));
    
    // Run tests sequentially
    await testDatabaseConnection();
    await testAuthentication();
    await testAIChatFunction();
    await testVoiceFeatures();
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <Badge variant="default" className="bg-green-500">Passed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge variant="secondary">Running</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  const passedTests = testResults.filter(t => t.status === 'passed').length;
  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const totalTests = testResults.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Basic Functionality Tests
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Tests
          </Button>
        </CardTitle>
        <CardDescription>
          Automated tests for core application functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        {testResults.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Progress: {passedTests + failedTests}/{totalTests}</span>
              <span>
                {passedTests > 0 && <span className="text-green-600">✓ {passedTests}</span>}
                {failedTests > 0 && <span className="text-red-600 ml-2">✗ {failedTests}</span>}
              </span>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {testResults.map((test) => (
            <div key={test.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium">{test.name}</p>
                  {test.message && (
                    <p className="text-sm text-muted-foreground">{test.message}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {test.duration && (
                  <span className="text-xs text-muted-foreground">
                    {test.duration}ms
                  </span>
                )}
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
        </div>
        
        {failedTests > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {failedTests} test(s) failed. Please check the results above and fix any issues before proceeding to production.
            </AlertDescription>
          </Alert>
        )}
        
        {testResults.length > 0 && failedTests === 0 && passedTests === totalTests && (
          <Alert className="mt-4">
            <AlertDescription>
              All tests passed! Core functionality is working correctly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};