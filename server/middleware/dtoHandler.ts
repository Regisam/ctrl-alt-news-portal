import { Request, Response, NextFunction } from 'express';
import { ApiResponse, HttpStatus } from '../types/api.js';

// AC3: Extend Response with DTO methods
declare global {
  namespace Express {
    interface Response {
      success<T>(data: T, message?: string, statusCode?: number): Response;
      created<T>(data: T, message?: string): Response;
      badRequest(error: string, details?: unknown): Response;
      notFound(error: string): Response;
      conflict(error: string): Response;
      error(statusCode: number, error: string, details?: unknown): Response;
    }
  }
}

export function dtoHandlerMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // AC7: Success response with timestamp
  res.success = function <T>(data: T, message?: string, statusCode: number = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || 'Success',
      timestamp: new Date().toISOString(),
      statusCode,
    };
    return this.status(statusCode).json(response);
  };

  // Created (201)
  res.created = function <T>(data: T, message?: string) {
    return this.success(data, message || 'Created', HttpStatus.CREATED);
  };

  // AC4: Error responses
  res.badRequest = function (error: string, details?: unknown) {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.BAD_REQUEST,
      ...(details && { details }),
    };
    return this.status(HttpStatus.BAD_REQUEST).json(response);
  };

  res.notFound = function (error: string) {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.NOT_FOUND,
    };
    return this.status(HttpStatus.NOT_FOUND).json(response);
  };

  res.conflict = function (error: string) {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      statusCode: HttpStatus.CONFLICT,
    };
    return this.status(HttpStatus.CONFLICT).json(response);
  };

  res.error = function (statusCode: number, error: string, details?: unknown) {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      statusCode,
      ...(details && { details }),
    };
    return this.status(statusCode).json(response);
  };

  next();
}
