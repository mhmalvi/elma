-- Add role enum type
CREATE TYPE public.app_role AS ENUM ('master_admin', 'admin', 'moderator', 'user');

-- Add role column to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN role app_role DEFAULT 'user' NOT NULL;

-- Update existing profiles to set role based on email
UPDATE public.profiles 
SET role = CASE 
  WHEN user_id = (SELECT id FROM auth.users WHERE email = 'admin@airchatbot.com' LIMIT 1) THEN 'master_admin'::app_role
  ELSE 'user'::app_role
END;

-- Create RLS policies for role-based access
CREATE POLICY "Master admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'master_admin'
    )
  );

CREATE POLICY "Master admins can update all profiles" 
  ON public.profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'master_admin'
    )
  );

-- Update the handle_new_user function to set roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    CASE 
      WHEN NEW.email = 'admin@airchatbot.com' THEN 'master_admin'::app_role
      ELSE 'user'::app_role
    END
  ) ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role app_role, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = user_uuid 
    AND (role = required_role OR role = 'master_admin')
  );
$$;