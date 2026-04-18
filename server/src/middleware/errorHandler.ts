import type { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string) {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string) {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource: string) {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message: string) {
    return new AppError(409, 'CONFLICT', message);
  }

  static internal(message: string) {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }

  toJSON() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        status: this.statusCode,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      status: 404,
    },
  });
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = (req as any).id || 'unknown';

  if (err instanceof AppError) {
    logger.warn('AppError', {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
      details: err.details,
    });

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Unexpected error (500)
  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      status: 500,
      requestId,
    },
  });
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
