import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';
import { v4 as uuidv4 } from 'uuid';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.id = requestId;

  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    request_id: requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    user_agent: req.get('user-agent'),
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    const logData: any = {
      request_id: requestId,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms: duration,
      content_length: res.get('content-length') || 0,
    };

    // Log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else if (duration > 1000) {
      logger.warn('Slow request detected', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}
