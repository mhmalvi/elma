import { useState, useEffect } from 'react';
import { Users, Building, MessageCircle, Shield, TrendingUp, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface SystemStats {
  totalUsers: number;
  totalTenants: number;
  totalConversations: number;
  totalMessages: number;
  activeAdmins: number;
  recentSignups: number;
}

export const AdminSystemStats = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTenants: 0,
    totalConversations: 0,
    totalMessages: 0,
    activeAdmins: 0,
    recentSignups: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      // Fetch all statistics in parallel
      // Fetch basic statistics
      const usersData = await supabase.from('profiles').select('id, created_at');
      const conversationsData = await supabase.from('conversations').select('id');
      const messagesData = await supabase.from('chat_messages').select('id');

      // Calculate recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentSignups = usersData.data?.filter(user => 
        new Date(user.created_at) > sevenDaysAgo
      ).length || 0;

      setStats({
        totalUsers: usersData.data?.length || 0,
        totalTenants: 1, // Default tenant for now
        totalConversations: conversationsData.data?.length || 0,
        totalMessages: messagesData.data?.length || 0,
        activeAdmins: 1, // Master admin for now
        recentSignups
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Tenants',
      value: stats.totalTenants,
      icon: Building,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Conversations',
      value: stats.totalConversations,
      icon: MessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages,
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'System Admins',
      value: stats.activeAdmins,
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Recent Signups',
      value: stats.recentSignups,
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      subtitle: 'Last 7 days'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.subtitle}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};