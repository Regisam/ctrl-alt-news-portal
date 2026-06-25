import { Router } from 'express';
import { pushNotificationService } from '../lib/pushNotificationService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

// AC5: Get VAPID public key (for subscription)
router.get('/vapid-public-key', (_req, res) => {
  try {
    const key = pushNotificationService.getVAPIDPublicKey();

    if (!key) {
      return res.badRequest('VAPID keys not configured');
    }

    res.success({ publicKey: key });
  } catch (error) {
    logger.error('Failed to get VAPID key', { error });
    res.error(500, 'Failed to get VAPID key');
  }
});

// AC2-6: Subscribe to push notifications
router.post('/subscribe', authMiddleware, (req, res) => {
  try {
    const userId = req.user!.userId;
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.badRequest('Invalid subscription object');
    }

    // AC6: Add subscription
    const result = pushNotificationService.addSubscription(userId, subscription);

    res.success({ subscriptionId: result.id, message: 'Subscribed to push notifications' });
  } catch (error) {
    logger.error('Failed to subscribe', { error });
    res.error(500, 'Failed to subscribe');
  }
});

// AC6: Unsubscribe from push
router.post('/unsubscribe/:subscriptionId', authMiddleware, (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const removed = pushNotificationService.removeSubscription(subscriptionId);

    if (!removed) {
      return res.notFound('Subscription not found');
    }

    res.success({ message: 'Unsubscribed from push notifications' });
  } catch (error) {
    logger.error('Failed to unsubscribe', { error });
    res.error(500, 'Failed to unsubscribe');
  }
});

// AC6: Get user subscriptions
router.get('/subscriptions', authMiddleware, (_req, res) => {
  try {
    const userId = _req.user!.userId;

    const subscriptions = pushNotificationService.getUserSubscriptions(userId);

    res.success({
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        endpoint: s.endpoint,
        createdAt: s.createdAt,
        active: s.active,
      })),
      count: subscriptions.length,
    });
  } catch (error) {
    logger.error('Failed to get subscriptions', { error });
    res.error(500, 'Failed to get subscriptions');
  }
});

// AC7: Track notification click
router.post('/track/click', authMiddleware, (req, res) => {
  try {
    const { subscriptionId, data } = req.body;

    if (!subscriptionId) {
      return res.badRequest('subscriptionId is required');
    }

    pushNotificationService.trackClick(subscriptionId, data);

    res.success({ message: 'Click tracked' });
  } catch (error) {
    logger.error('Failed to track click', { error });
    res.error(500, 'Failed to track click');
  }
});

// AC7: Track notification dismiss
router.post('/track/dismiss', authMiddleware, (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.badRequest('subscriptionId is required');
    }

    pushNotificationService.trackDismiss(subscriptionId);

    res.success({ message: 'Dismiss tracked' });
  } catch (error) {
    logger.error('Failed to track dismiss', { error });
    res.error(500, 'Failed to track dismiss');
  }
});

// AC3: Send test notification
router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { title = 'Test Notification', body = 'This is a test notification' } = req.body;

    // AC3: Send to user
    const sent = await pushNotificationService.sendToUser(userId, {
      id: `test-${Date.now()}`,
      title,
      body,
      tag: 'test',
    });

    res.success({ sent, message: `Sent ${sent} test notification(s)` });
  } catch (error) {
    logger.error('Failed to send test notification', { error });
    res.error(500, 'Failed to send test notification');
  }
});

// AC10: Get metrics
router.get('/metrics', authMiddleware, (_req, res) => {
  try {
    const metrics = pushNotificationService.getMetrics();

    res.success({ metrics });
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.error(500, 'Failed to get metrics');
  }
});

export default router;
