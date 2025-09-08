import { describe, it, expect, vi } from 'vitest';

// Mock the Edge Functions shared utilities
const mapErrorToStatus = (error: any): number => {
  const message = String(error?.message || error).toLowerCase();
  
  if (message.includes('unauthorized') || message.includes('jwt') || message.includes('auth')) {
    return 401;
  }
  
  if (message.includes('invalid') || message.includes('required') || message.includes('validation')) {
    return 400;
  }
  
  if (message.includes('rate limit')) {
    return 429;
  }
  
  if (message.includes('timeout') || message.includes('aborted') || error?.name === 'AbortError') {
    return 504;
  }
  
  if (message.includes('not configured') || message.includes('missing') || message.includes('key')) {
    return 500;
  }
  
  if (message.includes('unavailable') || message.includes('connection')) {
    return 503;
  }
  
  if (message.includes('forbidden') || message.includes('origin')) {
    return 403;
  }
  
  return 502;
};

const safeLog = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...(sanitizedData && { data: sanitizedData })
  };

  console[level](JSON.stringify(logEntry));
};

const sanitizeLogData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'auth', 'authorization',
    'email', 'phone', 'ssn', 'credit_card', 'api_key'
  ];

  const sanitized = { ...data };

  for (const key in sanitized) {
    const keyLower = key.toLowerCase();
    
    if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    } else if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '...[TRUNCATED]';
    }
  }

  return sanitized;
};

describe('Error Utilities', () => {
  describe('mapErrorToStatus', () => {
    it('should map authentication errors to 401', () => {
      expect(mapErrorToStatus(new Error('Unauthorized'))).toBe(401);
      expect(mapErrorToStatus(new Error('JWT token expired'))).toBe(401);
      expect(mapErrorToStatus(new Error('Authentication failed'))).toBe(401);
    });

    it('should map validation errors to 400', () => {
      expect(mapErrorToStatus(new Error('Invalid input'))).toBe(400);
      expect(mapErrorToStatus(new Error('Field is required'))).toBe(400);
      expect(mapErrorToStatus(new Error('Validation failed'))).toBe(400);
    });

    it('should map rate limit errors to 429', () => {
      expect(mapErrorToStatus(new Error('Rate limit exceeded'))).toBe(429);
    });

    it('should map timeout errors to 504', () => {
      expect(mapErrorToStatus(new Error('Request timeout'))).toBe(504);
      expect(mapErrorToStatus({ name: 'AbortError', message: 'Aborted' })).toBe(504);
    });

    it('should map configuration errors to 500', () => {
      expect(mapErrorToStatus(new Error('API key not configured'))).toBe(500);
      expect(mapErrorToStatus(new Error('Missing environment variable'))).toBe(500);
    });

    it('should map service unavailable errors to 503', () => {
      expect(mapErrorToStatus(new Error('Service unavailable'))).toBe(503);
      expect(mapErrorToStatus(new Error('Connection failed'))).toBe(503);
    });

    it('should map forbidden errors to 403', () => {
      expect(mapErrorToStatus(new Error('Forbidden'))).toBe(403);
      expect(mapErrorToStatus(new Error('Origin not allowed'))).toBe(403);
    });

    it('should default to 502 for unknown errors', () => {
      expect(mapErrorToStatus(new Error('Something went wrong'))).toBe(502);
      expect(mapErrorToStatus('Unknown error')).toBe(502);
    });

    it('should handle null and undefined errors', () => {
      expect(mapErrorToStatus(null)).toBe(502);
      expect(mapErrorToStatus(undefined)).toBe(502);
    });
  });

  describe('sanitizeLogData', () => {
    it('should redact sensitive keys', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        api_key: 'key_123',
        email: 'john@example.com',
        message: 'Hello world'
      };

      const result = sanitizeLogData(data);

      expect(result.username).toBe('john');
      expect(result.password).toBe('[REDACTED]');
      expect(result.api_key).toBe('[REDACTED]');
      expect(result.email).toBe('[REDACTED]');
      expect(result.message).toBe('Hello world');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          password: 'secret',
          profile: {
            token: 'abc123'
          }
        },
        config: {
          api_key: 'key_456'
        }
      };

      const result = sanitizeLogData(data);

      expect(result.user.name).toBe('John');
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.profile.token).toBe('[REDACTED]');
      expect(result.config.api_key).toBe('[REDACTED]');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(1500);
      const data = { longText: longString };

      const result = sanitizeLogData(data);

      expect(result.longText).toBe('a'.repeat(1000) + '...[TRUNCATED]');
    });

    it('should handle non-object inputs', () => {
      expect(sanitizeLogData('string')).toBe('string');
      expect(sanitizeLogData(123)).toBe(123);
      expect(sanitizeLogData(null)).toBe(null);
      expect(sanitizeLogData(undefined)).toBe(undefined);
    });

    it('should preserve arrays', () => {
      const data = {
        items: ['item1', 'item2'],
        secrets: ['password123', 'token456']
      };

      const result = sanitizeLogData(data);

      expect(result.items).toEqual(['item1', 'item2']);
      expect(result.secrets).toBe('[REDACTED]');
    });
  });

  describe('safeLog', () => {
    it('should log with proper structure', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      safeLog('info', 'Test message', { user: 'john', password: 'secret' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"level":"info"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle different log levels', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      safeLog('error', 'Error message');
      safeLog('warn', 'Warning message');

      expect(errorSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });
});