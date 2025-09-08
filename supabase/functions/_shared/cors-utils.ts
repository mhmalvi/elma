/**
 * Shared CORS utilities for Supabase Edge Functions
 * Provides standardized CORS validation and header management
 */

export const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Vary': 'Origin'
};

// Environment-aware allowed origins
export const getAllowedOrigins = (): string[] => {
  const isDev = Deno.env.get('ENVIRONMENT') !== 'production';
  
  const baseOrigins = [
    'https://lsmkivtgjzyjgvzqiqfy.supabase.co', // Production Supabase domain
  ];

  if (isDev) {
    baseOrigins.push(
      'http://localhost:8080',
      'http://127.0.0.1:8080', 
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite dev server
      'http://127.0.0.1:5173'
    );
  }

  // Add custom domains from environment
  const customOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (customOrigins) {
    baseOrigins.push(...customOrigins.split(',').map(o => o.trim()));
  }

  return baseOrigins;
};

/**
 * Validates if the request origin is allowed
 */
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

/**
 * Creates dynamic CORS headers based on the request origin
 */
export function createCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]; // Fallback to first allowed origin

  return {
    ...DEFAULT_CORS_HEADERS,
    'Access-Control-Allow-Origin': allowedOrigin
  };
}

/**
 * Handles OPTIONS preflight requests
 */
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;

  const origin = req.headers.get('origin');
  
  if (!validateOrigin(origin)) {
    return new Response('Forbidden - Origin not allowed', { 
      status: 403,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  const corsHeaders = createCorsHeaders(origin);
  return new Response(null, { 
    status: 204,
    headers: corsHeaders 
  });
}

/**
 * Validates request origin and returns appropriate error response
 */
export function validateRequestOrigin(req: Request): Response | null {
  const origin = req.headers.get('origin');
  
  if (!validateOrigin(origin)) {
    return new Response(
      JSON.stringify({ 
        error: 'Origin not allowed',
        success: false,
        code: 'INVALID_ORIGIN'
      }), 
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return null;
}