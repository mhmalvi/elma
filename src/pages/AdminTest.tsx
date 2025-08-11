import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/hooks/useRole';
import { useToast } from '@/hooks/use-toast';
import { SystemHealthMonitor } from '@/components/monitoring/SystemHealthMonitor';
import { BasicFunctionalityTest } from '@/components/test/BasicFunctionalityTest';

export default function AdminTest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, isMasterAdmin, loading: roleLoading } = useRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/chat')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Admin</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">System Testing & Monitoring</h1>
              <p className="text-muted-foreground">
                Test functionality and monitor system health
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tests">Functionality Tests</TabsTrigger>
            <TabsTrigger value="monitoring">System Health</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            <BasicFunctionalityTest />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <SystemHealthMonitor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}