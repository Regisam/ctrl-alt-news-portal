import { logger } from '../logger.js';

// AC1: Notification types
export type NotificationType = 'comment_reply' | 'reaction' | 'new_follower' | 'mention' | 'article_published';

// AC3: Notification object
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  targetId: string; // article/comment/user ID
  targetType: 'article' | 'comment' | 'user';
  message: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  batchId?: string; // AC5: for batching
}

// AC4: User preferences
export interface NotificationPreferences {
  userId: string;
  commentReplies: boolean;
  reactions: boolean;
  newFollowers: boolean;
  mentions: boolean;
  articlePublished: boolean;
  quietHoursStart?: string; // HH:MM format
  quietHoursEnd?: string; // HH:MM format
  batchingEnabled: boolean;
  batchingWindowMinutes: number;
}

class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private userNotifications: Map<string, string[]> = new Map(); // userId -> notificationIds
  private preferences: Map<string, NotificationPreferences> = new Map();
  private recentNotifications: Map<string, Set<string>> = new Map(); // dedup tracking
  private dedupWindow = 5 * 60 * 1000; // 5 minutes

  // AC1: Create notification
  createNotification(
    userId: string,
    type: NotificationType,
    actorId: string,
    actorName: string,
    targetId: string,
    targetType: 'article' | 'comment' | 'user',
    message: string
  ): Notification | null {
    // AC11: Check for duplicates
    const dedupKey = `${userId}:${type}:${actorId}:${targetId}`;
    const recentKey = `${userId}:${type}`;

    if (!this.recentNotifications.has(recentKey)) {
      this.recentNotifications.set(recentKey, new Set());
    }

    const recent = this.recentNotifications.get(recentKey)!;
    if (recent.has(dedupKey)) {
      return null; // Duplicate notification
    }

    // AC4: Check preferences
    const prefs = this.getOrCreatePreferences(userId);
    const notificationEnabled = this.isNotificationEnabled(type, prefs);

    if (!notificationEnabled) {
      return null;
    }

    // AC6: Check quiet hours
    if (this.isQuietHours(prefs)) {
      return null;
    }

    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const notification: Notification = {
      id,
      userId,
      type,
      actorId,
      actorName,
      targetId,
      targetType,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    this.notifications.set(id, notification);

    // Track by user
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }
    this.userNotifications.get(userId)!.push(id);

    // Track for deduplication
    recent.add(dedupKey);
    setTimeout(() => recent.delete(dedupKey), this.dedupWindow);

    logger.info('Notification created', { id, userId, type });

    return notification;
  }

  // AC7: Mark as read
  markAsRead(notificationId: string, userId: string): boolean {
    const notif = this.notifications.get(notificationId);

    if (!notif || notif.userId !== userId) {
      return false;
    }

    notif.read = true;
    notif.readAt = new Date().toISOString();

    return true;
  }

  // AC7: Mark all as read
  markAllAsRead(userId: string): number {
    const notifIds = this.userNotifications.get(userId) || [];
    let count = 0;

    for (const id of notifIds) {
      const notif = this.notifications.get(id);
      if (notif && !notif.read) {
        notif.read = true;
        notif.readAt = new Date().toISOString();
        count += 1;
      }
    }

    return count;
  }

  // AC8: Get unread count
  getUnreadCount(userId: string): number {
    const notifIds = this.userNotifications.get(userId) || [];
    return notifIds.filter((id) => {
      const notif = this.notifications.get(id);
      return notif && !notif.read;
    }).length;
  }

  // AC9: Get notification feed (paginated)
  getNotificationFeed(userId: string, page: number = 1, pageSize: number = 20): {
    notifications: Notification[];
    total: number;
    page: number;
    pageSize: number;
  } {
    const notifIds = this.userNotifications.get(userId) || [];
    const sorted = notifIds
      .map((id) => this.notifications.get(id))
      .filter((n) => n) as Notification[];

    // Sort by date (newest first)
    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      notifications: sorted.slice(start, end),
      total: sorted.length,
      page,
      pageSize,
    };
  }

  // AC4: Get preferences
  getPreferences(userId: string): NotificationPreferences | null {
    return this.preferences.get(userId) || null;
  }

  // AC4: Update preferences
  updatePreferences(userId: string, updates: Partial<NotificationPreferences>): NotificationPreferences {
    const prefs = this.getOrCreatePreferences(userId);

    if (updates.commentReplies !== undefined) prefs.commentReplies = updates.commentReplies;
    if (updates.reactions !== undefined) prefs.reactions = updates.reactions;
    if (updates.newFollowers !== undefined) prefs.newFollowers = updates.newFollowers;
    if (updates.mentions !== undefined) prefs.mentions = updates.mentions;
    if (updates.articlePublished !== undefined) prefs.articlePublished = updates.articlePublished;
    if (updates.quietHoursStart !== undefined) prefs.quietHoursStart = updates.quietHoursStart;
    if (updates.quietHoursEnd !== undefined) prefs.quietHoursEnd = updates.quietHoursEnd;
    if (updates.batchingEnabled !== undefined) prefs.batchingEnabled = updates.batchingEnabled;
    if (updates.batchingWindowMinutes !== undefined) prefs.batchingWindowMinutes = updates.batchingWindowMinutes;

    this.preferences.set(userId, prefs);

    logger.info('Notification preferences updated', { userId });

    return prefs;
  }

  // Get notification
  getNotification(notificationId: string): Notification | null {
    return this.notifications.get(notificationId) || null;
  }

  // Delete notification
  deleteNotification(notificationId: string, userId: string): boolean {
    const notif = this.notifications.get(notificationId);

    if (!notif || notif.userId !== userId) {
      return false;
    }

    this.notifications.delete(notificationId);

    const notifIds = this.userNotifications.get(userId);
    if (notifIds) {
      const idx = notifIds.indexOf(notificationId);
      if (idx > -1) {
        notifIds.splice(idx, 1);
      }
    }

    return true;
  }

  // Private helper: get or create preferences
  private getOrCreatePreferences(userId: string): NotificationPreferences {
    if (!this.preferences.has(userId)) {
      this.preferences.set(userId, {
        userId,
        commentReplies: true,
        reactions: true,
        newFollowers: true,
        mentions: true,
        articlePublished: true,
        batchingEnabled: true,
        batchingWindowMinutes: 5,
      });
    }

    return this.preferences.get(userId)!;
  }

  // AC4: Check if notification is enabled
  private isNotificationEnabled(type: NotificationType, prefs: NotificationPreferences): boolean {
    switch (type) {
      case 'comment_reply':
        return prefs.commentReplies;
      case 'reaction':
        return prefs.reactions;
      case 'new_follower':
        return prefs.newFollowers;
      case 'mention':
        return prefs.mentions;
      case 'article_published':
        return prefs.articlePublished;
      default:
        return true;
    }
  }

  // AC6: Check if within quiet hours
  private isQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Simple comparison (doesn't handle day boundaries)
    return currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd;
  }

  // Get stats
  getStats(): {
    totalNotifications: number;
    unreadNotifications: number;
    notificationsPerType: Record<NotificationType, number>;
  } {
    const allNotifs = Array.from(this.notifications.values());
    const unread = allNotifs.filter((n) => !n.read).length;

    const perType: Record<NotificationType, number> = {
      comment_reply: 0,
      reaction: 0,
      new_follower: 0,
      mention: 0,
      article_published: 0,
    };

    for (const notif of allNotifs) {
      perType[notif.type] += 1;
    }

    return {
      totalNotifications: allNotifs.length,
      unreadNotifications: unread,
      notificationsPerType: perType,
    };
  }
}

export const notificationManager = new NotificationManager();
