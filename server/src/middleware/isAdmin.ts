import type { Request, Response, NextFunction } from 'express';
import logger from '../logger';
import { prisma } from '../prisma';

export interface AdminRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function isAdmin(req: AdminRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;

    if (!userId) {
      logger.warn('Admin access attempt without authentication', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      res.status(401).json({
        success: false,
        error: 'Unauthorized - authentication required',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, lastLoginAt: true },
    });

    if (!user) {
      logger.warn('Admin access attempt with non-existent user', {
        userId,
        path: req.path,
        ip: req.ip,
      });
      res.status(401).json({
        success: false,
        error: 'Unauthorized - user not found',
      });
      return;
    }

    if (user.role !== 'ADMIN') {
      logger.warn('Admin access denied - insufficient permissions', {
        userId,
        userRole: user.role,
        path: req.path,
        ip: req.ip,
      });
      res.status(403).json({
        success: false,
        error: 'Forbidden - admin access required',
      });
      return;
    }

    // Check session timeout (24 hours of inactivity)
    const ADMIN_SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = new Date();
    const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;

    if (lastLogin) {
      const timeSinceLastLogin = now.getTime() - lastLogin.getTime();
      if (timeSinceLastLogin > ADMIN_SESSION_TIMEOUT) {
        logger.warn('Admin session expired due to inactivity', {
          userId,
          lastLoginAt: lastLogin,
          ip: req.ip,
        });
        res.status(401).json({
          success: false,
          error: 'Unauthorized - session expired due to inactivity',
        });
        return;
      }
    }

    req.userRole = user.role;
    next();
  } catch (error) {
    logger.error('Admin middleware error', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      ip: req.ip,
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
