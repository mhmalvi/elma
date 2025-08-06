import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully."
          });
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully."
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || null
          }
        }
      });

      if (error) {
        // Handle specific signup errors with better messaging
        let errorMessage = error.message;
        
        if (error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('weak password')) {
          errorMessage = 'Password is too weak. Please use at least 6 characters with numbers and letters.';
        } else if (error.message.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        }
        
        toast({
          title: "Sign up failed",
          description: errorMessage,
          variant: "destructive"
        });
        return { data: null, error };
      }

      // If signup successful but email confirmation is disabled, user will be signed in immediately
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration. You can also continue without confirming."
        });
      } else if (data.user) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to AirChatBot. You're now signed in."
        });
      }

      return { data, error: null };
    } catch (err) {
      const unexpectedError = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast({
        title: "Sign up failed",
        description: unexpectedError,
        variant: "destructive"
      });
      return { data: null, error: err as any };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }

    return { data, error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Clear any cached data and redirect to auth page
      window.location.href = '/auth';
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`
    });

    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive"
      });
      return { data: null, error };
    }

    toast({
      title: "Check your email",
      description: "We've sent you a password reset link."
    });

    return { data, error: null };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };
};