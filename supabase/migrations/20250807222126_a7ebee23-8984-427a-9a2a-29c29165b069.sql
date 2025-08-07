
-- 1) Ensure a unique index exists for the ON CONFLICT target
CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_user_endpoint_window_idx
  ON public.rate_limits (user_id, endpoint, window_start);

-- 2) Replace the check_rate_limit function to set a minute-bucket for window_start
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  endpoint_name TEXT,
  max_requests INTEGER DEFAULT 100,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
  bucket_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up old rate limit records (older than 1 hour)
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '1 hour';

  -- Count from the start of the current sliding window
  window_start_time := NOW() - (INTERVAL '1 minute' * window_minutes);

  -- Normalize the current bucket to the minute (so ON CONFLICT can aggregate)
  bucket_start := date_trunc('minute', NOW());

  -- Count requests in current window
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM public.rate_limits
  WHERE user_id = auth.uid()
    AND endpoint = endpoint_name
    AND window_start >= window_start_time;

  IF current_count < max_requests THEN
    INSERT INTO public.rate_limits (user_id, endpoint, window_start, request_count)
    VALUES (auth.uid(), endpoint_name, bucket_start, 1)
    ON CONFLICT (user_id, endpoint, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$;
