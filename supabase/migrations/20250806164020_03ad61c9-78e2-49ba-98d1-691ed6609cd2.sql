-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Master admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master admins can update all profiles" ON public.profiles;

-- Fix the handle_new_user function to work without circular dependencies
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with role based on email, no circular dependency
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