import { describe, it, expect, vi } from 'vitest';

// Mock Deno.env for testing
const mockEnv = {
  'ENVIRONMENT': 'development',
  'ALLOWED_ORIGINS': 'https://example.com,https://test.com'
};

// Mock the CORS utilities
const getAllowedOrigins = (): string[] => {
  const isDev = mockEnv['ENVIRONMENT'] !== 'production';
  
  const baseOrigins = [
    'https://lsmkivtgjzyjgvzqiqfy.supabase.co',
  ];

  if (isDev) {
    baseOrigins.push(
      'http://localhost:8080',
      'http://127.0.0.1:8080', 
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    );
  }

  const customOrigins = mockEnv['ALLOWED_ORIGINS'];
  if (customOrigins) {
    baseOrigins.push(...customOrigins.split(',').map(o => o.trim()));
  }

  return baseOrigins;
};

const validateOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes(origin);
};

const DEFAULT_CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
};

const createCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0];

  return {
    ...DEFAULT_CORS_HEADERS,
    'Access-Control-Allow-Origin': allowedOrigin
  };
};

const handleCorsPreflightRequest = (req: Request): Response | null => {
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
};

describe('CORS Utilities', () => {
  describe('getAllowedOrigins', () => {
    it('should include production origins', () => {
      const origins = getAllowedOrigins();
      expect(origins).toContain('https://lsmkivtgjzyjgvzqiqfy.supabase.co');
    });

    it('should include development origins in dev environment', () => {
      const origins = getAllowedOrigins();
      expect(origins).toContain('http://localhost:8080');
      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('http://localhost:5173');
    });

    it('should include custom origins from environment', () => {
      const origins = getAllowedOrigins();
      expect(origins).toContain('https://example.com');
      expect(origins).toContain('https://test.com');
    });
  });

  describe('validateOrigin', () => {
    it('should validate allowed origins', () => {
      expect(validateOrigin('http://localhost:8080')).toBe(true);
      expect(validateOrigin('https://lsmkivtgjzyjgvzqiqfy.supabase.co')).toBe(true);
      expect(validateOrigin('https://example.com')).toBe(true);
    });

    it('should reject disallowed origins', () => {
      expect(validateOrigin('https://malicious.com')).toBe(false);
      expect(validateOrigin('http://evil.example.com')).toBe(false);
    });

    it('should reject null origin', () => {
      expect(validateOrigin(null)).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(validateOrigin('HTTP://LOCALHOST:8080')).toBe(false);
    });

    it('should validate exact matches only', () => {
      expect(validateOrigin('http://localhost:8080/evil')).toBe(false);
      expect(validateOrigin('http://localhost:8081')).toBe(false);
    });
  });

  describe('createCorsHeaders', () => {
    it('should create headers with allowed origin', () => {
      const headers = createCorsHeaders('http://localhost:8080');
      
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:8080');
      expect(headers['Access-Control-Allow-Headers']).toBe('authorization, x-client-info, apikey, content-type');
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, OPTIONS');
      expect(headers['Access-Control-Max-Age']).toBe('86400');
      expect(headers['Vary']).toBe('Origin');
    });

    it('should fallback to first allowed origin for disallowed origin', () => {
      const headers = createCorsHeaders('https://malicious.com');
      const allowedOrigins = getAllowedOrigins();
      
      expect(headers['Access-Control-Allow-Origin']).toBe(allowedOrigins[0]);
    });

    it('should fallback to first allowed origin for null origin', () => {
      const headers = createCorsHeaders(null);
      const allowedOrigins = getAllowedOrigins();
      
      expect(headers['Access-Control-Allow-Origin']).toBe(allowedOrigins[0]);
    });
  });

  describe('handleCorsPreflightRequest', () => {
    it('should return null for non-OPTIONS requests', () => {
      const req = new Request('https://example.com', { method: 'GET' });
      const result = handleCorsPreflightRequest(req);
      expect(result).toBeNull();
    });

    it('should return 403 for disallowed origin', () => {
      const req = new Request('https://example.com', { 
        method: 'OPTIONS',
        headers: { 'origin': 'https://malicious.com' }
      });
      
      const result = handleCorsPreflightRequest(req);
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(403);
    });

    it('should return 204 with CORS headers for allowed origin', () => {
      const req = new Request('https://example.com', { 
        method: 'OPTIONS',
        headers: { 'origin': 'http://localhost:8080' }
      });
      
      const result = handleCorsPreflightRequest(req);
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(204);
      
      const corsHeader = result!.headers.get('Access-Control-Allow-Origin');
      expect(corsHeader).toBe('http://localhost:8080');
    });

    it('should return 403 for null origin', () => {
      const req = new Request('https://example.com', { 
        method: 'OPTIONS'
      });
      
      const result = handleCorsPreflightRequest(req);
      expect(result).toBeInstanceOf(Response);
      expect(result!.status).toBe(403);
    });
  });
});