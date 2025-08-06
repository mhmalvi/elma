import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'master_admin' | 'admin' | 'moderator' | 'user';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export const useRole = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const hasRole = (requiredRole: AppRole) => {
    if (!profile) return false;
    
    // Master admin has all permissions
    if (profile.role === 'master_admin') return true;
    
    // Check specific role
    return profile.role === requiredRole;
  };

  const isMasterAdmin = () => profile?.role === 'master_admin';
  const isAdmin = () => hasRole('admin');
  const isModerator = () => hasRole('moderator');
  const isUser = () => profile?.role === 'user';

  return {
    profile,
    role: profile?.role || 'user',
    loading,
    hasRole,
    isMasterAdmin,
    isAdmin,
    isModerator,
    isUser
  };
};