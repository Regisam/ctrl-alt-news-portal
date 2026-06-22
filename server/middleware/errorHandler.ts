import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';
import { errorAggregator } from '../lib/errorAggregator.js';

export function errorHandlerMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Record error in aggregator
  const errorType = err.name || 'UnknownError';
  const errorMessage = err.message || 'Unknown error';
  const errorStack = err.stack || '';

  errorAggregator.recordError(errorType, errorMessage, errorStack, {
    userId: (_req as any).user?.id,
    method: _req.method,
    path: _req.path,
    status: res.statusCode || 500,
  });

  // Log error
  logger.error('Unhandled error', {
    type: errorType,
    message: errorMessage,
    stack: errorStack,
    path: _req.path,
    method: _req.method,
    status: res.statusCode || 500,
  });

  // Send error response
  res.status(res.statusCode || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred',
    requestId: (_req as any).id,
  });
}

// Wrapper to capture unhandled promise rejections
export function setupErrorHandlers() {
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection', {
      reason: String(reason),
      type: reason?.name || 'UnhandledRejection',
      message: reason?.message || 'Unknown rejection',
    });

    errorAggregator.recordError(
      reason?.name || 'UnhandledRejection',
      reason?.message || String(reason),
      reason?.stack || ''
    );
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      type: error.name,
      message: error.message,
      stack: error.stack,
    });

    errorAggregator.recordError(error.name, error.message, error.stack || '');
    process.exit(1); // Exit on uncaught exception
  });
}
