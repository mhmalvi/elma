-- Create a function to get recent function logs (simplified version for monitoring)
CREATE OR REPLACE FUNCTION public.get_recent_function_logs(limit_count integer DEFAULT 50)
RETURNS TABLE(
  log_timestamp timestamptz,
  function_name text,
  event_message text,
  status_code integer,
  execution_time_ms integer,
  method text,
  level text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Return mock data for monitoring purposes
  -- In production, this would query actual logs from a logging table
  RETURN QUERY
  SELECT 
    now() as log_timestamp,
    'ai-chat'::text as function_name,
    'Function executed successfully'::text as event_message,
    200 as status_code,
    4750 as execution_time_ms,
    'POST'::text as method,
    'log'::text as level;
END;
$$;