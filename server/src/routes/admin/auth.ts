import type { Router, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import logger from '../../logger';
import { verifyJWT, type AuthRequest } from '../../middleware/auth';
import { isAdmin } from '../../middleware/isAdmin';

export function setupAdminAuthRoute(router: Router): void {
  // GET /api/admin/auth/check (protected - requires JWT + admin role)
  router.get(
    '/api/admin/auth/check',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const userId = req.userId;

        if (!userId) {
          logger.warn('Admin auth check without userId', {
            path: req.path,
            ip: req.ip,
          });
          res.status(401).json({
            success: false,
            error: 'Unauthorized - no user ID',
          });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            createdAt: true,
          },
        });

        if (!user) {
          logger.warn('Admin auth check - user not found', {
            userId,
            ip: req.ip,
          });
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        logger.info('Admin auth check successful', {
          userId,
          role: user.role,
        });

        res.status(200).json({
          success: true,
          data: user,
        });
      } catch (error) {
        logger.error('Error checking admin auth', {
          error: error instanceof Error ? error.message : String(error),
          userId: req.userId,
          path: req.path,
        });
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );
}
