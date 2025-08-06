-- First, ensure the app_role enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('master_admin', 'admin', 'moderator', 'user');
    END IF;
END $$;

-- Ensure the role column exists on profiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role app_role DEFAULT 'user' NOT NULL;
    END IF;
END $$;

-- Update the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, role)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      CASE 
        WHEN NEW.email = 'admin@airchatbot.com' THEN 'master_admin'::app_role
        ELSE 'user'::app_role
      END
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.profiles 
    SET 
      display_name = COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      role = CASE 
        WHEN NEW.email = 'admin@airchatbot.com' THEN 'master_admin'::app_role
        ELSE 'user'::app_role
      END
    WHERE user_id = NEW.id;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;