/**
 * Production-safe logging utility
 * Filters out sensitive information and provides structured logging
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
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  private sanitize(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sensitiveKeys = [
      'password', 'token', 'api_key', 'secret', 'auth', 'credential',
      'email', 'phone', 'ssn', 'credit_card', 'personal_info'
    ];
    
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      if (sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
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
    if (this.isDevelopment) {
      this.log(this.createLogEntry('debug', message, options));
    }
  }
}

export const logger = new Logger();