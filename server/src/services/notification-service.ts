import { PrismaClient, NotificationType } from '@prisma/client';
import { getWebSocketHandlers } from '../websocket-handlers';

const prisma = new PrismaClient();

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  content: string;
  relatedCommentId?: string;
  relatedUserId?: string;
}

export class NotificationService {
  // Create a notification
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          content: params.content,
          relatedCommentId: params.relatedCommentId,
          relatedUserId: params.relatedUserId,
        },
        include: {
          triggeredBy: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      });

      // Emit notification via WebSocket if handlers are available
      try {
        const wsHandlers = getWebSocketHandlers();
        const triggeredBy = notification.triggeredBy ? {
          id: notification.triggeredBy.id,
          username: notification.triggeredBy.username || undefined,
          avatarUrl: notification.triggeredBy.avatarUrl || undefined,
        } : undefined;

        wsHandlers.broadcastNotification(params.userId, {
          id: notification.id,
          type: notification.type,
          content: notification.content,
          read: notification.read,
          createdAt: notification.createdAt,
          relatedCommentId: notification.relatedCommentId || undefined,
          triggeredBy,
        });
      } catch (wsError) {
        // WebSocket handlers may not be initialized, continue anyway
        console.debug('WebSocket handlers not available for notification broadcast');
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create reply notification
  static async notifyReply(commentId: string, commentAuthorId: string, replyAuthorId: string) {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { author: true },
      });

      if (!comment) return null;

      const replyAuthor = await prisma.user.findUnique({
        where: { id: replyAuthorId },
        select: { username: true },
      });

      const content = `@${replyAuthor?.username} replied to your comment`;

      return this.createNotification({
        userId: commentAuthorId,
        type: 'REPLY',
        content,
        relatedCommentId: commentId,
        relatedUserId: replyAuthorId,
      });
    } catch (error) {
      console.error('Error creating reply notification:', error);
      return null;
    }
  }

  // Create mention notification
  static async notifyMention(mentionedUsername: string, commentId: string, mentionAuthorId: string) {
    try {
      const mentionedUser = await prisma.user.findUnique({
        where: { username: mentionedUsername },
        select: { id: true },
      });

      if (!mentionedUser) return null;

      const mentionAuthor = await prisma.user.findUnique({
        where: { id: mentionAuthorId },
        select: { username: true },
      });

      const content = `@${mentionAuthor?.username} mentioned you in a comment`;

      return this.createNotification({
        userId: mentionedUser.id,
        type: 'MENTION',
        content,
        relatedCommentId: commentId,
        relatedUserId: mentionAuthorId,
      });
    } catch (error) {
      console.error('Error creating mention notification:', error);
      return null;
    }
  }

  // Create karma milestone notification
  static async notifyKarmaMilestone(userId: string, currentKarma: number) {
    const milestones = [10, 50, 100];
    const newMilestone = milestones.find((m) => currentKarma >= m && currentKarma - 1 < m);

    if (!newMilestone) return null;

    try {
      return this.createNotification({
        userId,
        type: 'KARMA_MILESTONE',
        content: `🎉 Parabéns! Você alcançou ${newMilestone} de karma! | Congrats! You reached ${newMilestone} karma!`,
      });
    } catch (error) {
      console.error('Error creating karma milestone notification:', error);
      return null;
    }
  }

  // Cleanup notifications older than 24 hours
  static async cleanupOldNotifications() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await prisma.notification.updateMany({
        where: {
          createdAt: { lt: oneDayAgo },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      console.log(`Cleaned up ${result.count} old notifications`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }

  // Get unread count for user
  static async getUnreadCount(userId: string) {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          read: false,
          deletedAt: null,
        },
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}
