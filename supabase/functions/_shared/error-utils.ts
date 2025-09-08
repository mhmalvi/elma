/**
 * Shared error handling utilities for Supabase Edge Functions
 * Provides standardized error mapping, logging, and response formatting
 */

export interface ErrorResponse {
  error: string;
  success: false;
  requestId?: string;
  timestamp?: string;
  code?: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  requestId?: string;
  timestamp?: string;
}

/**
 * Maps error types to appropriate HTTP status codes
 */
export function mapErrorToStatus(error: any): number {
  const message = String(error?.message || error).toLowerCase();
  
  // Authentication errors
  if (message.includes('unauthorized') || message.includes('jwt') || message.includes('auth')) {
    return 401;
  }
  
  // Validation errors
  if (message.includes('invalid') || message.includes('required') || message.includes('validation')) {
    return 400;
  }
  
  // Rate limiting
  if (message.includes('rate limit')) {
    return 429;
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('aborted') || error?.name === 'AbortError') {
    return 504;
  }
  
  // Configuration errors
  if (message.includes('not configured') || message.includes('missing') || message.includes('key')) {
    return 500;
  }
  
  // Service unavailable
  if (message.includes('unavailable') || message.includes('connection')) {
    return 503;
  }
  
  // Forbidden/Origin errors
  if (message.includes('forbidden') || message.includes('origin')) {
    return 403;
  }
  
  // Default to bad gateway for external API errors
  return 502;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: any, 
  requestId?: string,
  additionalInfo?: Record<string, any>
): { response: Response; status: number } {
  const status = mapErrorToStatus(error);
  const errorResponse: ErrorResponse = {
    error: String(error?.message || error || 'Unknown error'),
    success: false,
    requestId,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };

  return {
    response: new Response(JSON.stringify(errorResponse), {
      status,
      headers: { 'Content-Type': 'application/json' }
    }),
    status
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId?: string,
  additionalInfo?: Record<string, any>
): Response {
  const successResponse: SuccessResponse<T> = {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString(),
    ...additionalInfo
  };

  return new Response(JSON.stringify(successResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Safe logging utility that filters PII and sensitive information
 */
export function safeLog(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  const timestamp = new Date().toISOString();
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...(sanitizedData && { data: sanitizedData })
  };

  console[level](JSON.stringify(logEntry));
}

/**
 * Removes sensitive information from log data
 */
function sanitizeLogData(data: any): any {
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
      // Truncate very long strings
      sanitized[key] = sanitized[key].substring(0, 1000) + '...[TRUNCATED]';
    }
  }

  return sanitized;
}

/**
 * Utility for retrying operations with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      safeLog('warn', `Operation failed, retrying in ${delay}ms`, { 
        attempt: attempt + 1,
        maxRetries,
        error: error?.message 
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}