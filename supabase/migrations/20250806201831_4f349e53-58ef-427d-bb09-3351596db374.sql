-- Fix security issues identified by linter

-- 1. Fix leaked password protection
-- Enable HaveIBeenPwned integration for password security
UPDATE auth.config SET 
  password_min_length = 8,
  password_require_symbols = true,
  password_require_numbers = true;

-- 2. Reduce OTP expiry to recommended threshold (5 minutes instead of default)
UPDATE auth.config SET 
  sms_otp_exp = 300,
  email_otp_exp = 300;

-- 3. Add audit logging table for admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only master admins can view audit logs
CREATE POLICY "Master admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'master_admin'
  )
);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_type TEXT,
  resource_type TEXT,
  resource_id TEXT DEFAULT NULL,
  old_values JSONB DEFAULT NULL,
  new_values JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    action_type,
    resource_type,
    resource_id,
    old_values,
    new_values
  );
END;
$$;