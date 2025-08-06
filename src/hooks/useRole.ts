import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'master_admin' | 'tenant_admin' | 'moderator' | 'user';

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>('user');
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('user');
      setTenants([]);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        // For now, return master_admin for testing
        // TODO: Implement proper role checking once types are updated
        setRole('master_admin');
        setTenants([{ tenant_id: '1', tenant_name: 'Default Organization', tenant_slug: 'default', user_role: 'master_admin' }]);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const hasRole = (requiredRole: AppRole, tenantId?: string) => {
    if (role === 'master_admin') return true;
    
    // Check if user has the required role in specific tenant
    if (tenantId) {
      const tenant = tenants.find(t => t.tenant_id === tenantId);
      return tenant && (tenant.user_role === requiredRole || tenant.user_role === 'master_admin');
    }
    
    return role === requiredRole;
  };

  const isMasterAdmin = () => role === 'master_admin';
  const isTenantAdmin = (tenantId?: string) => hasRole('tenant_admin', tenantId);
  const isModerator = (tenantId?: string) => hasRole('moderator', tenantId);

  return {
    role,
    tenants,
    loading,
    hasRole,
    isMasterAdmin,
    isTenantAdmin,
    isModerator
  };
};