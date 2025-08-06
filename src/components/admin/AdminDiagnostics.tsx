import { Monitor, Database, Server, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { VoiceTestSuite } from '@/components/voice/VoiceTestSuite';
import { IslamicContentSeeder } from '@/components/database/IslamicContentSeeder';
import { EdgeFunctionMonitor } from '@/components/monitoring/EdgeFunctionMonitor';
import { AdminSystemStats } from './AdminSystemStats';

export const AdminDiagnostics = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Monitor className="w-6 h-6" />
          System Diagnostics
        </h2>
        <p className="text-muted-foreground">Advanced diagnostics and monitoring tools for master admins</p>
      </div>

      {/* System Statistics */}
      <AdminSystemStats />

      {/* Diagnostic Tools Grid */}
      <div className="grid gap-6">
        {/* Voice System Testing */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Voice Pipeline Testing</h3>
          </div>
          <VoiceTestSuite />
        </Card>

        {/* Database Management */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Islamic Content Database</h3>
          </div>
          <IslamicContentSeeder />
        </Card>

        {/* Edge Function Monitoring */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Edge Function Monitoring</h3>
          </div>
          <EdgeFunctionMonitor />
        </Card>
      </div>
    </div>
  );
};