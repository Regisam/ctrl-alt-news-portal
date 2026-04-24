// Sanitization patterns for sensitive data
const SENSITIVE_PATTERNS = {
  password: /password/i,
  token: /token|secret|apikey|api_key|auth/i,
  email: /email/i,
  phone: /phone|mobile/i,
  ssn: /ssn|social_security/i,
  creditcard: /credit_card|card_number|cc_number/i,
};

function sanitizeValue(key: string, value: any): any {
  if (typeof value !== 'string') return value;

  // Check if key matches any sensitive pattern
  for (const [, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    if (pattern.test(key)) {
      return '[REDACTED]';
    }
  }

  return value;
}

function sanitizeContext(context: any): any {
  if (!context) return undefined;

  const sanitized: any = {};

  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = sanitizeValue(key, value);
    }
  }

  return sanitized;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogData {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp?: string;
}

async function sendLogToServer(logData: LogData) {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
  } catch (error) {
    // Fallback to console if server logs unavailable
    console.error('Failed to send log to server:', error);
  }
}

export function log(level: LogLevel, message: string, context?: Record<string, any>) {
  const logData: LogData = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  // Sanitize context before sending
  if (context) {
    logData.context = sanitizeContext(context);
  }

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    const consoleMethod = level === 'warn' || level === 'error' ? console[level] : console.log;
    consoleMethod(`[${level.toUpperCase()}] ${message}`, logData.context || '');
  }

  // Send to server (async, non-blocking)
  sendLogToServer(logData);
}

export const clientLogger = {
  debug: (message: string, context?: Record<string, any>) => log('debug', message, context),
  info: (message: string, context?: Record<string, any>) => log('info', message, context),
  warn: (message: string, context?: Record<string, any>) => log('warn', message, context),
  error: (message: string, context?: Record<string, any>) => log('error', message, context),
};
