import { useState } from 'react';
import { ArrowLeft, Users, Building, Settings, Shield, Database, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRole } from '@/hooks/useRole';
import { TenantManagement } from '@/components/admin/TenantManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { AdminDiagnostics } from '@/components/admin/AdminDiagnostics';
import { useToast } from '@/hooks/use-toast';
import { EdgeFunctionMonitor } from '@/components/monitoring/EdgeFunctionMonitor';
import { ProductionMonitoring } from '@/components/monitoring/ProductionMonitoring';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMasterAdmin, loading } = useRole();
  const [activeTab, setActiveTab] = useState('tenants');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto">
          <div className="text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <Button onClick={() => navigate('/chat')}>
              Return to Chat
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/chat')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold">Master Admin Dashboard</h1>
        </div>
        <div className="w-24" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Diagnostics
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="space-y-6">
            <TenantManagement />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <AdminDiagnostics />
          </TabsContent>
          <TabsContent value="monitoring" className="space-y-6">
            <EdgeFunctionMonitor />
            <ProductionMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;