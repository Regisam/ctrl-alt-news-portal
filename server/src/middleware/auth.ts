import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../logger';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function verifyJWT(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Request without authentication token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      error: 'Unauthorized - missing or invalid token',
    });
    return;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-me-in-production';

  try {
    const decoded: any = jwt.verify(token, secret);
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    logger.warn('Invalid JWT token', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      error: 'Unauthorized - invalid token',
    });
  }
}

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  // First verify JWT
  verifyJWT(req, res, () => {
    // After JWT is verified, check if user is admin
    // For now, this is a placeholder - will be implemented with database checks in Story 3.5
    next();
  });
}
