-- Fix the handle_new_user function with proper search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, role)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      CASE 
        WHEN NEW.email = 'admin@airchatbot.com' THEN 'master_admin'::public.app_role
        ELSE 'user'::public.app_role
      END
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE public.profiles 
    SET 
      display_name = COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
      role = CASE 
        WHEN NEW.email = 'admin@airchatbot.com' THEN 'master_admin'::public.app_role
        ELSE 'user'::public.app_role
      END
    WHERE user_id = NEW.id;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';