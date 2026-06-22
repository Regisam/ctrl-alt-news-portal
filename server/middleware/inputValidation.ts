import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';

// AC3: Sanitize string inputs
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return (
    input
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Escape HTML characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim()
  );
}

// AC3: Sanitize object recursively
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeInput(item));
  }

  if (data !== null && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
}

// AC3: Input validation middleware
export function inputValidationMiddleware(req: Request, res: Response, next: NextFunction) {
  // AC3: Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }

  // AC3: Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query);
  }

  // AC3: Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeInput(req.params);
  }

  // AC3: Check for suspicious patterns (SQL injection attempts)
  const suspiciousPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
  ];

  const requestString = JSON.stringify(req.body || '') + JSON.stringify(req.query || '');

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      logger.warn('Suspicious SQL pattern detected', {
        path: req.path,
        pattern: pattern.source,
      });
      // Don't block, just log and continue (could be legitimate)
    }
  }

  // AC3: Check request size (prevent DoS)
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    logger.warn('Request too large', {
      path: req.path,
      size: contentLength,
      max: maxSize,
    });
    return res.status(413).json({ error: 'Payload too large' });
  }

  next();
}

// AC9: Safe error message (no sensitive data)
export function createSafeErrorMessage(error: any, isDevelopment: boolean = false): string {
  if (isDevelopment) {
    return error?.message || 'An error occurred';
  }

  // Production: generic message
  if (error?.code === 'ENOENT') {
    return 'Resource not found';
  }

  if (error?.code === 'EACCES') {
    return 'Access denied';
  }

  return 'An error occurred. Please try again later.';
}
