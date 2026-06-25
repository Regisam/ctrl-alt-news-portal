import { Request, Response, NextFunction } from 'express';
import { authService } from '../lib/authService.js';
import { logger } from '../logger.js';

// AC10: Extend Request with user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

// AC5: Token validation middleware
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractToken(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const payload = authService.verifyToken(token);

    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }
}

// Optional auth (doesn't fail if no token)
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractToken(authHeader);

    if (token) {
      const payload = authService.verifyToken(token);
      if (payload) {
        req.user = {
          userId: payload.userId,
          email: payload.email,
        };
      }
    }

    next();
  } catch (error) {
    logger.debug('Optional auth error', { error });
    next();
  }
}
