-- Enhanced Rate Limiting with Multi-Factor Checks
-- Adds IP-based rate limiting and request fingerprinting for better security

-- Create enhanced rate_limits table with additional factors
CREATE TABLE IF NOT EXISTS public.rate_limits_enhanced (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    window_start timestamp with time zone NOT NULL,
    request_count integer DEFAULT 1,
    ip_address inet,
    user_agent_hash text,
    request_fingerprint text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_enhanced_user_endpoint_window 
ON public.rate_limits_enhanced (user_id, endpoint, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_enhanced_ip_endpoint_window 
ON public.rate_limits_enhanced (ip_address, endpoint, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_enhanced_fingerprint_window 
ON public.rate_limits_enhanced (request_fingerprint, window_start);

CREATE INDEX IF NOT EXISTS idx_rate_limits_enhanced_cleanup 
ON public.rate_limits_enhanced (window_start);

-- Create unique constraint for conflict resolution
CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_enhanced_unique_idx
ON public.rate_limits_enhanced (
    COALESCE(user_id::text, ''), 
    endpoint, 
    window_start,
    COALESCE(ip_address::text, ''),
    COALESCE(request_fingerprint, '')
);

-- RLS policies
ALTER TABLE public.rate_limits_enhanced ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits" ON public.rate_limits_enhanced
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all rate limits
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits_enhanced
    FOR ALL USING (auth.role() = 'service_role');

-- Enhanced rate limiting function with multi-factor checks
CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(
    endpoint_name TEXT,
    max_requests_per_user INTEGER DEFAULT 100,
    max_requests_per_ip INTEGER DEFAULT 200,
    max_requests_per_fingerprint INTEGER DEFAULT 150,
    window_minutes INTEGER DEFAULT 60,
    client_ip TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    request_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_count INTEGER := 0;
    current_ip_count INTEGER := 0;
    current_fingerprint_count INTEGER := 0;
    window_start_time TIMESTAMP WITH TIME ZONE;
    bucket_start TIMESTAMP WITH TIME ZONE;
    client_ip_addr INET;
    ua_hash TEXT;
    current_user_id UUID;
    result JSONB;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Clean up old rate limit records (older than 2 hours)
    DELETE FROM public.rate_limits_enhanced 
    WHERE window_start < NOW() - INTERVAL '2 hours';

    -- Calculate window boundaries
    window_start_time := NOW() - (INTERVAL '1 minute' * window_minutes);
    bucket_start := date_trunc('minute', NOW());

    -- Process IP address
    IF client_ip IS NOT NULL THEN
        BEGIN
            client_ip_addr := client_ip::INET;
        EXCEPTION WHEN others THEN
            client_ip_addr := NULL;
        END;
    END IF;

    -- Hash user agent for privacy
    IF user_agent IS NOT NULL AND length(user_agent) > 0 THEN
        ua_hash := encode(digest(user_agent, 'sha256'), 'hex');
    END IF;

    -- Count current requests by user (if authenticated)
    IF current_user_id IS NOT NULL THEN
        SELECT COALESCE(SUM(request_count), 0) INTO current_user_count
        FROM public.rate_limits_enhanced
        WHERE user_id = current_user_id
          AND endpoint = endpoint_name
          AND window_start >= window_start_time;
    END IF;

    -- Count current requests by IP
    IF client_ip_addr IS NOT NULL THEN
        SELECT COALESCE(SUM(request_count), 0) INTO current_ip_count
        FROM public.rate_limits_enhanced
        WHERE ip_address = client_ip_addr
          AND endpoint = endpoint_name
          AND window_start >= window_start_time;
    END IF;

    -- Count current requests by fingerprint
    IF request_fingerprint IS NOT NULL THEN
        SELECT COALESCE(SUM(request_count), 0) INTO current_fingerprint_count
        FROM public.rate_limits_enhanced
        WHERE request_fingerprint = request_fingerprint
          AND endpoint = endpoint_name
          AND window_start >= window_start_time;
    END IF;

    -- Check all limits
    IF (current_user_id IS NOT NULL AND current_user_count >= max_requests_per_user) THEN
        result := jsonb_build_object(
            'allowed', false,
            'reason', 'user_limit_exceeded',
            'current_count', current_user_count,
            'max_requests', max_requests_per_user,
            'reset_at', bucket_start + (INTERVAL '1 minute' * window_minutes)
        );
    ELSIF (client_ip_addr IS NOT NULL AND current_ip_count >= max_requests_per_ip) THEN
        result := jsonb_build_object(
            'allowed', false,
            'reason', 'ip_limit_exceeded',
            'current_count', current_ip_count,
            'max_requests', max_requests_per_ip,
            'reset_at', bucket_start + (INTERVAL '1 minute' * window_minutes)
        );
    ELSIF (request_fingerprint IS NOT NULL AND current_fingerprint_count >= max_requests_per_fingerprint) THEN
        result := jsonb_build_object(
            'allowed', false,
            'reason', 'fingerprint_limit_exceeded',
            'current_count', current_fingerprint_count,
            'max_requests', max_requests_per_fingerprint,
            'reset_at', bucket_start + (INTERVAL '1 minute' * window_minutes)
        );
    ELSE
        -- Insert or update the rate limit record
        INSERT INTO public.rate_limits_enhanced (
            user_id, 
            endpoint, 
            window_start, 
            request_count,
            ip_address,
            user_agent_hash,
            request_fingerprint
        )
        VALUES (
            current_user_id, 
            endpoint_name, 
            bucket_start, 
            1,
            client_ip_addr,
            ua_hash,
            request_fingerprint
        )
        ON CONFLICT ON CONSTRAINT rate_limits_enhanced_unique_idx
        DO UPDATE SET 
            request_count = rate_limits_enhanced.request_count + 1,
            updated_at = NOW();

        result := jsonb_build_object(
            'allowed', true,
            'remaining_user', max_requests_per_user - (current_user_count + 1),
            'remaining_ip', max_requests_per_ip - (current_ip_count + 1),
            'remaining_fingerprint', max_requests_per_fingerprint - (current_fingerprint_count + 1),
            'reset_at', bucket_start + (INTERVAL '1 minute' * window_minutes)
        );
    END IF;

    RETURN result;
END;
$function$;

-- Backward compatible wrapper function
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
    result JSONB;
BEGIN
    result := public.check_rate_limit_enhanced(
        endpoint_name,
        max_requests,
        max_requests * 2, -- Allow 2x for IP limit
        max_requests + 50, -- Allow 50 extra for fingerprint
        window_minutes
    );
    
    RETURN (result->>'allowed')::BOOLEAN;
END;
$function$;

-- Function to get rate limit status
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
    endpoint_name TEXT,
    window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    window_start_time TIMESTAMP WITH TIME ZONE;
    current_user_id UUID;
    user_count INTEGER := 0;
    result JSONB;
BEGIN
    current_user_id := auth.uid();
    window_start_time := NOW() - (INTERVAL '1 minute' * window_minutes);

    IF current_user_id IS NOT NULL THEN
        SELECT COALESCE(SUM(request_count), 0) INTO user_count
        FROM public.rate_limits_enhanced
        WHERE user_id = current_user_id
          AND endpoint = endpoint_name
          AND window_start >= window_start_time;
    END IF;

    result := jsonb_build_object(
        'endpoint', endpoint_name,
        'current_requests', user_count,
        'window_minutes', window_minutes,
        'window_start', window_start_time,
        'user_id', current_user_id
    );

    RETURN result;
END;
$function$;