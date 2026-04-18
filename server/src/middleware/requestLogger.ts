import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../logger';

export const requestLogger = (
  req: Request & { id?: string },
  res: Response,
  next: NextFunction,
): void => {
  // Generate request ID
  req.id = uuidv4();

  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming Request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Outgoing Response', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};
