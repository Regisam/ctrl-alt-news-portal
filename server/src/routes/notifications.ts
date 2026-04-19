import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export function setupNotificationsRoute(router: Router) {
  // GET /api/notifications - Paginated list with unread count
  router.get('/api/notifications', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: {
            userId,
            deletedAt: null,
          },
          include: {
            relatedComment: true,
            triggeredBy: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({
          where: { userId, deletedAt: null },
        }),
        prisma.notification.count({
          where: { userId, read: false, deletedAt: null },
        }),
      ]);

      return res.json({
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // PATCH /api/notifications/:id/read - Mark single notification as read
  router.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      return res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // POST /api/notifications/read-all - Batch mark all as read for user
  router.post('/api/notifications/read-all', async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId as string;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
          deletedAt: null,
        },
        data: { read: true },
      });

      return res.json({
        message: 'All notifications marked as read',
        count: result.count,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  });

  // DELETE /api/notifications/:id - Soft delete single notification
  router.delete('/api/notifications/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const notification = await prisma.notification.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return res.json({ message: 'Notification deleted', notification });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  });
}
