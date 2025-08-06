import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const { role, isMasterAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for both auth and role loading to complete
    if (loading || roleLoading) return;

    // If not authenticated, redirect to auth page
    if (!user) {
      navigate('/auth');
      return;
    }

    // If user just signed in and is master admin, redirect to admin dashboard
    if (isMasterAdmin() && window.location.pathname === '/') {
      navigate('/admin');
      return;
    }
  }, [user, loading, roleLoading, isMasterAdmin, navigate]);

  // Show loading while determining auth state
  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  return <>{children}</>;
};