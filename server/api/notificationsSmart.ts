import { Router } from 'express';
import { notificationManager } from '../lib/smartNotificationManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Create notification
router.post('/create', (req, res) => {
  try {
    const { userId, type, actorId, actorName, targetId, targetType, message } = req.body;

    if (!userId || !type || !actorId || !actorName || !targetId || !targetType || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const notification = notificationManager.createNotification(
      userId,
      type,
      actorId,
      actorName,
      targetId,
      targetType,
      message
    );

    if (!notification) {
      return res.status(400).json({ error: 'Notification not created (dedup or preferences)' });
    }

    res.json({
      message: 'Notification created',
      notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create notification', { error });
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// AC7: Mark notification as read
router.put('/:notificationId/read', (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const success = notificationManager.markAsRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification marked as read',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to mark as read', { error });
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// AC7: Mark all as read
router.put('/mark-all-read', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const count = notificationManager.markAllAsRead(userId);

    res.json({
      message: 'All notifications marked as read',
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to mark all as read', { error });
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// AC8: Get unread count
router.get('/unread-count/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const count = notificationManager.getUnreadCount(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      unreadCount: count,
    });
  } catch (error) {
    logger.error('Failed to get unread count', { error });
    res.status(500).json({ error: 'Failed to get count' });
  }
});

// AC9: Get notification feed (paginated)
router.get('/feed/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(50, parseInt(req.query.pageSize as string) || 20);

    const feed = notificationManager.getNotificationFeed(userId, page, pageSize);

    res.json({
      timestamp: new Date().toISOString(),
      feed,
    });
  } catch (error) {
    logger.error('Failed to get notification feed', { error });
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// AC4: Get preferences
router.get('/preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const preferences = notificationManager.getPreferences(userId);

    if (!preferences) {
      // Return default preferences
      return res.json({
        timestamp: new Date().toISOString(),
        preferences: {
          userId,
          commentReplies: true,
          reactions: true,
          newFollowers: true,
          mentions: true,
          articlePublished: true,
          batchingEnabled: true,
          batchingWindowMinutes: 5,
        },
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      preferences,
    });
  } catch (error) {
    logger.error('Failed to get preferences', { error });
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// AC4: Update preferences
router.put('/preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const preferences = notificationManager.updatePreferences(userId, updates);

    res.json({
      message: 'Preferences updated',
      preferences,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to update preferences', { error });
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Delete notification
router.delete('/:notificationId', (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const success = notificationManager.deleteNotification(notificationId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      message: 'Notification deleted',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to delete notification', { error });
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get notification stats
router.get('/stats', (_req, res) => {
  try {
    const stats = notificationManager.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
