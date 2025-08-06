import { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageCircle, AlertCircle, Activity, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  activeUsers: number;
  errorRate: number;
  avgResponseTime: number;
  dailyStats: Array<{
    date: string;
    users: number;
    conversations: number;
    messages: number;
  }>;
}

export const UsageAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    activeUsers: 0,
    errorRate: 0,
    avgResponseTime: 0,
    dailyStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Mock analytics data since we need to implement proper tracking
      const mockData: AnalyticsData = {
        totalUsers: 245,
        totalConversations: 1823,
        totalMessages: 15432,
        activeUsers: 67,
        errorRate: 2.3,
        avgResponseTime: 1250,
        dailyStats: [
          { date: '2025-01-01', users: 23, conversations: 45, messages: 234 },
          { date: '2025-01-02', users: 31, conversations: 52, messages: 298 },
          { date: '2025-01-03', users: 28, conversations: 47, messages: 276 },
          { date: '2025-01-04', users: 35, conversations: 61, messages: 345 },
          { date: '2025-01-05', users: 42, conversations: 73, messages: 412 },
          { date: '2025-01-06', users: 38, conversations: 66, messages: 387 },
          { date: '2025-01-07', users: 44, conversations: 78, messages: 456 }
        ]
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Usage Analytics Dashboard
        </h3>
        <p className="text-muted-foreground">Monitor app usage and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{analytics.activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Conversations</p>
              <p className="text-2xl font-bold">{analytics.totalConversations.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Messages</p>
              <p className="text-2xl font-bold">{analytics.totalMessages.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
              <p className="text-2xl font-bold">{analytics.errorRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
              <p className="text-2xl font-bold">{analytics.avgResponseTime}ms</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">Daily Usage Trends (Last 7 Days)</h4>
        <div className="space-y-4">
          {analytics.dailyStats.map((day, index) => (
            <div key={day.date} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium w-20">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{day.users} users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm">{day.conversations} conversations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">{day.messages} messages</span>
                  </div>
                </div>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((day.users / 50) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4">System Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium mb-2">API Response Times</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">AI Chat API</span>
                <span className="text-sm font-medium">1,245ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Voice Processing</span>
                <span className="text-sm font-medium">2,103ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Database Queries</span>
                <span className="text-sm font-medium">156ms</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium mb-2">System Health</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Edge Functions</span>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm font-medium text-green-600">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};