-- Harden SECURITY DEFINER functions with explicit search_path
ALTER FUNCTION public.log_admin_action(text, text, text, jsonb, jsonb)
  SET search_path = public;

ALTER FUNCTION public.check_rate_limit(text, integer, integer)
  SET search_path = public;