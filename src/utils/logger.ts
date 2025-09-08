/**
 * Enhanced production-safe logging utility
 * Filters out sensitive information, PII patterns, and provides structured logging
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  userId?: string;
  component?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isDebugEnabled = import.meta.env.VITE_DEBUG_MODE === 'true';
  
  // PII patterns to detect and redact
  private piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit card
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone number
  ];
  
  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;
    
    if (str.length > 2000) {
      str = str.substring(0, 2000) + '...[TRUNCATED]';
    }

    let sanitized = str;
    
    // Replace PII patterns
    this.piiPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[PII_REDACTED]');
    });

    return sanitized;
  }
  
  private sanitize(data: unknown, depth = 0): unknown {
    // Prevent infinite recursion
    if (depth > 10) return '[DEEP_OBJECT]';
    
    if (data === null || data === undefined) return data;
    
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }
    
    if (data instanceof Error) {
      return {
        name: data.name,
        message: this.sanitizeString(data.message),
        stack: this.isDevelopment ? data.stack : '[REDACTED]'
      };
    }
    
    if (Array.isArray(data)) {
      if (data.length > 100) {
        return `[ARRAY_TOO_LARGE:${data.length}]`;
      }
      return data.map(item => this.sanitize(item, depth + 1));
    }
    
    if (typeof data !== 'object') return data;
    
    const sensitiveKeys = [
      'password', 'token', 'api_key', 'secret', 'auth', 'credential',
      'email', 'phone', 'ssn', 'credit_card', 'personal_info', 'jwt',
      'session', 'cookie', 'csrf', 'bearer', 'authorization',
      'apikey', 'x-api-key', 'access_token', 'refresh_token'
    ];
    
    const sanitized: any = { ...data };
    
    for (const key in sanitized) {
      const keyLower = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key], depth + 1);
      } else if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeString(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  private createLogEntry(
    level: LogLevel,
    message: string,
    options: {
      correlationId?: string;
      userId?: string;
      component?: string;
      error?: Error;
      metadata?: Record<string, unknown>;
    } = {}
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: options.correlationId,
      userId: options.userId,
      component: options.component,
      error: options.error?.message,
      metadata: options.metadata ? this.sanitize(options.metadata) : undefined,
    };
  }
  
  private log(entry: LogEntry) {
    if (this.isDevelopment) {
      const logFn = entry.level === 'error' ? console.error : 
                   entry.level === 'warn' ? console.warn : 
                   console.log;
      
      logFn(`[${entry.level.toUpperCase()}] ${entry.message}`, {
        ...entry,
        message: undefined // Don't duplicate message
      });
    } else {
      // In production, only log errors and warnings
      if (entry.level === 'error' || entry.level === 'warn') {
        console.log(JSON.stringify(entry));
      }
    }
  }
  
  error(message: string, options?: {
    correlationId?: string;
    userId?: string;
    component?: string;
    error?: Error;
    metadata?: Record<string, unknown>;
  }) {
    this.log(this.createLogEntry('error', message, options));
  }
  
  warn(message: string, options?: {
    correlationId?: string;
    userId?: string;
    component?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.log(this.createLogEntry('warn', message, options));
  }
  
  info(message: string, options?: {
    correlationId?: string;
    userId?: string;
    component?: string;
    metadata?: Record<string, unknown>;
  }) {
    this.log(this.createLogEntry('info', message, options));
  }
  
  debug(message: string, options?: {
    correlationId?: string;
    userId?: string;
    component?: string;
    metadata?: Record<string, unknown>;
  }) {
    if (this.isDevelopment || this.isDebugEnabled) {
      this.log(this.createLogEntry('debug', message, options));
    }
  }
  
  /**
   * Convenience method for logging user actions
   */
  userAction(action: string, userId?: string, metadata?: Record<string, unknown>) {
    this.info('User action performed', {
      userId: userId ? `user_${userId.substring(0, 8)}***` : undefined,
      component: 'user_interaction',
      metadata: { action, ...metadata }
    });
  }
  
  /**
   * Convenience method for logging API calls
   */
  apiCall(method: string, endpoint: string, status?: number, duration?: number, metadata?: Record<string, unknown>) {
    const level = status && status >= 400 ? 'warn' : 'info';
    const sanitizedEndpoint = endpoint.replace(/\/[a-f0-9-]{36}/gi, '/[UUID]'); // Replace UUIDs
    
    this[level]('API call completed', {
      component: 'api_client',
      metadata: {
        method,
        endpoint: sanitizedEndpoint,
        status,
        duration,
        ...metadata
      }
    });
  }
  
  /**
   * Convenience method for logging performance metrics
   */
  performance(metric: string, value: number, unit: string, metadata?: Record<string, unknown>) {
    this.info('Performance metric recorded', {
      component: 'performance_monitor',
      metadata: {
        metric,
        value,
        unit,
        ...metadata
      }
    });
  }
}

export const logger = new Logger();