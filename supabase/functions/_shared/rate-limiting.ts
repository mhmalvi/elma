/**
 * Enhanced rate limiting utilities for Supabase Edge Functions
 * Provides multi-factor rate limiting with IP, user, and request fingerprinting
 */

export interface RateLimitConfig {
  endpoint: string;
  maxRequestsPerUser?: number;
  maxRequestsPerIp?: number;
  maxRequestsPerFingerprint?: number;
  windowMinutes?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxRequests?: number;
  remainingUser?: number;
  remainingIp?: number;
  remainingFingerprint?: number;
  resetAt?: string;
}

/**
 * Generates a request fingerprint based on request characteristics
 */
export function generateRequestFingerprint(req: Request): string {
  const url = new URL(req.url);
  const method = req.method;
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  
  // Create a fingerprint from request characteristics
  const fingerprint = `${method}:${url.pathname}:${userAgent.substring(0, 50)}:${acceptLanguage}`;
  
  // Hash the fingerprint for privacy and consistent length
  return btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

/**
 * Extracts client IP from various headers
 */
export function extractClientIp(req: Request): string | null {
  // Check common proxy headers in order of preference
  const headers = [
    'cf-connecting-ip',     // Cloudflare
    'x-real-ip',           // Nginx
    'x-forwarded-for',     // Standard proxy header
    'x-client-ip',         // Other proxies
    'x-forwarded',         // Less common
    'forwarded-for',       // Deprecated
    'forwarded'            // RFC 7239
  ];

  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ip = value.split(',')[0].trim();
      if (isValidIp(ip)) {
        return ip;
      }
    }
  }

  return null;
}

/**
 * Basic IP validation
 */
function isValidIp(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Regex.test(ip)) {
    // Validate IPv4 octets
    const octets = ip.split('.').map(Number);
    return octets.every(octet => octet >= 0 && octet <= 255);
  }
  
  return ipv6Regex.test(ip);
}

/**
 * Enhanced rate limiting check with multiple factors
 */
export async function checkRateLimit(
  supabase: any,
  req: Request,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const clientIp = extractClientIp(req);
  const userAgent = req.headers.get('user-agent');
  const requestFingerprint = generateRequestFingerprint(req);

  const { data, error } = await supabase.rpc('check_rate_limit_enhanced', {
    endpoint_name: config.endpoint,
    max_requests_per_user: config.maxRequestsPerUser || 60,
    max_requests_per_ip: config.maxRequestsPerIp || 120,
    max_requests_per_fingerprint: config.maxRequestsPerFingerprint || 90,
    window_minutes: config.windowMinutes || 1,
    client_ip: clientIp,
    user_agent: userAgent,
    request_fingerprint: requestFingerprint
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow the request if we can't check rate limits
    // But log this for monitoring
    return {
      allowed: true,
      reason: 'rate_limit_check_failed'
    };
  }

  return data as RateLimitResult;
}

/**
 * Backward compatible rate limiting for existing functions
 */
export async function checkSimpleRateLimit(
  supabase: any,
  endpoint: string,
  maxRequests: number = 60,
  windowMinutes: number = 1
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    endpoint_name: endpoint,
    max_requests: maxRequests,
    window_minutes: windowMinutes
  });

  if (error) {
    console.error('Rate limit check failed:', error);
    return true; // Fail open
  }

  return data as boolean;
}

/**
 * Creates appropriate HTTP response for rate limit exceeded
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = result.resetAt 
    ? Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000)
    : 60;

  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'Retry-After': retryAfter.toString(),
    'X-RateLimit-Limit': result.maxRequests?.toString() || '60',
    'X-RateLimit-Remaining': '0',
    'X-RateLimit-Reset': result.resetAt || new Date(Date.now() + 60000).toISOString()
  };

  const body = {
    error: 'Rate limit exceeded',
    success: false,
    details: {
      reason: result.reason,
      currentCount: result.currentCount,
      maxRequests: result.maxRequests,
      resetAt: result.resetAt,
      retryAfter: retryAfter
    }
  };

  return new Response(JSON.stringify(body), {
    status: 429,
    headers
  });
}

/**
 * Adds rate limit headers to successful responses
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  if (result.allowed) {
    const headers = new Headers(response.headers);
    
    if (result.remainingUser !== undefined) {
      headers.set('X-RateLimit-Remaining-User', result.remainingUser.toString());
    }
    if (result.remainingIp !== undefined) {
      headers.set('X-RateLimit-Remaining-IP', result.remainingIp.toString());
    }
    if (result.remainingFingerprint !== undefined) {
      headers.set('X-RateLimit-Remaining-Fingerprint', result.remainingFingerprint.toString());
    }
    if (result.resetAt) {
      headers.set('X-RateLimit-Reset', result.resetAt);
    }

    return new Response(response.body, {
      status: response.status,
      headers
    });
  }

  return response;
}