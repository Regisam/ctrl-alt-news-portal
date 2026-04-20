import type { Router, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import logger from '../../logger';
import { verifyJWT, type AuthRequest } from '../../middleware/auth';
import { isAdmin } from '../../middleware/isAdmin';

export function setupAdminUsersRoute(router: Router): void {
  // GET /api/admin/users - List all users with pagination, filtering, sorting
  router.get(
    '/api/admin/users',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
        const role = (req.query.role as string) || undefined;
        const status = (req.query.status as string) || undefined;
        const search = (req.query.search as string) || undefined;
        const sort = (req.query.sort as string) || 'createdAt';
        const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';

        const skip = (page - 1) * limit;

        // Build where clause for filters
        const where: any = {};
        if (role) where.role = role;
        if (status === 'ACTIVE') where.isActive = true;
        if (status === 'INACTIVE') where.isActive = false;
        if (search) {
          where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Get total count
        const total = await prisma.user.count({ where });

        // Get paginated users with activity counts
        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            _count: {
              select: {
                articles: true,
                comments: true,
              },
            },
          },
          orderBy: { [sort]: order },
          skip,
          take: limit,
        });

        const data = users.map((user) => ({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          lastLogin: user.lastLoginAt,
          articlesCount: user._count.articles,
          commentsCount: user._count.comments,
          createdAt: user.createdAt,
        }));

        logger.info('Admin users list retrieved', {
          userId: req.userId,
          page,
          limit,
          total,
        });

        res.status(200).json({
          success: true,
          data: {
            users: data,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
            },
          },
        });
      } catch (error) {
        logger.error('Error fetching admin users', {
          error: error instanceof Error ? error.message : String(error),
          userId: req.userId,
        });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch users',
        });
      }
    }
  );

  // GET /api/admin/users/:id - Get user detail with activity
  router.get(
    '/api/admin/users/:id',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            bio: true,
            avatarUrl: true,
            role: true,
            karma: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                articles: true,
                comments: true,
                bookmarks: true,
              },
            },
          },
        });

        if (!user) {
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        logger.info('Admin user detail retrieved', {
          userId: req.userId,
          targetUserId: id,
        });

        res.status(200).json({
          success: true,
          data: {
            ...user,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          },
        });
      } catch (error) {
        logger.error('Error fetching admin user detail', {
          error: error instanceof Error ? error.message : String(error),
          userId: req.userId,
        });
        res.status(500).json({
          success: false,
          error: 'Failed to fetch user',
        });
      }
    }
  );

  // PUT /api/admin/users/:id/role - Change user role
  router.put(
    '/api/admin/users/:id/role',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['USER', 'EDITOR', 'ADMIN'];
        if (!validRoles.includes(role)) {
          res.status(400).json({
            success: false,
            error: 'Invalid role',
          });
          return;
        }

        // Prevent last admin from being demoted
        if (role !== 'ADMIN') {
          const adminCount = await prisma.user.count({
            where: { role: 'ADMIN', isActive: true },
          });
          const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { role: true },
          });

          if (targetUser?.role === 'ADMIN' && adminCount <= 1) {
            res.status(400).json({
              success: false,
              error: 'Cannot demote the last admin user',
            });
            return;
          }
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data: { role },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        logger.info('Admin user role changed', {
          userId: req.userId,
          targetUserId: id,
          newRole: role,
        });

        res.status(200).json({
          success: true,
          data: updatedUser,
        });
      } catch (error) {
        logger.error('Error changing user role', {
          error: error instanceof Error ? error.message : String(error),
          userId: req.userId,
        });
        res.status(500).json({
          success: false,
          error: 'Failed to change user role',
        });
      }
    }
  );

  // PUT /api/admin/users/:id/status - Deactivate/reactivate user
  router.put(
    '/api/admin/users/:id/status',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
          res.status(400).json({
            success: false,
            error: 'isActive must be boolean',
          });
          return;
        }

        // Prevent deactivating self
        if (!isActive && id === req.userId) {
          res.status(400).json({
            success: false,
            error: 'Cannot deactivate yourself',
          });
          return;
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data: { isActive },
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        });

        logger.info('Admin user status changed', {
          userId: req.userId,
          targetUserId: id,
          isActive,
        });

        res.status(200).json({
          success: true,
          data: {
            ...updatedUser,
            status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
          },
        });
      } catch (error) {
        logger.error('Error changing user status', {
          error: error instanceof Error ? error.message : String(error),
          userId: req.userId,
        });
        res.status(500).json({
          success: false,
          error: 'Failed to change user status',
        });
      }
    }
  );
}
