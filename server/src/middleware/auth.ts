import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../logger';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
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

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // First verify JWT
    verifyJWT(req, res, async () => {
      try {
        // Get user with role
        const { prisma } = await import('../prisma');
        const user = await prisma.user.findUnique({
          where: { id: req.userId },
          select: { role: true },
        });

        if (!user || !roles.includes(user.role)) {
          res.status(403).json({
            success: false,
            error: 'Forbidden - insufficient permissions',
          });
          return;
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to verify permissions',
        });
      }
    });
  };
}

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const roleMiddleware = requireRole('ADMIN');
  roleMiddleware(req, res, next);
}

export function isEditor(req: AuthRequest, res: Response, next: NextFunction): void {
  const roleMiddleware = requireRole('EDITOR', 'ADMIN');
  roleMiddleware(req, res, next);
}
