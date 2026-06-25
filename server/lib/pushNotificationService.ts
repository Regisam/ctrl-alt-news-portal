import { logger } from '../logger.js';

// AC1-11: Push notification types
export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  createdAt: Date;
  active: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface PushMetrics {
  sent: number;
  failed: number;
  clicked: number;
  dismissed: number;
  delivered: number;
}

class PushNotificationService {
  private subscriptions: Map<string, PushSubscription> = new Map();
  private userSubscriptions: Map<string, Set<string>> = new Map();
  private metrics: PushMetrics = {
    sent: 0,
    failed: 0,
    clicked: 0,
    dismissed: 0,
    delivered: 0,
  };

  private readonly VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
  private readonly VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
  private readonly VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@ctrlaltnews.com';

  // AC6: Add subscription
  addSubscription(userId: string, subscriptionObj: any): PushSubscription {
    const subscription: PushSubscription = {
      id: `sub-${Date.now()}-${Math.random()}`,
      userId,
      endpoint: subscriptionObj.endpoint,
      auth: subscriptionObj.keys.auth,
      p256dh: subscriptionObj.keys.p256dh,
      createdAt: new Date(),
      active: true,
    };

    this.subscriptions.set(subscription.id, subscription);

    // AC6: Track user subscriptions
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }

    this.userSubscriptions.get(userId)!.add(subscription.id);

    logger.info('Push subscription added', { userId, subscriptionId: subscription.id });

    return subscription;
  }

  // AC6: Remove subscription
  removeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) return false;

    this.subscriptions.delete(subscriptionId);

    const userSubs = this.userSubscriptions.get(subscription.userId);
    if (userSubs) {
      userSubs.delete(subscriptionId);
    }

    logger.info('Push subscription removed', { subscriptionId });

    return true;
  }

  // AC6: Get user subscriptions
  getUserSubscriptions(userId: string): PushSubscription[] {
    const subIds = this.userSubscriptions.get(userId) || new Set();
    return Array.from(subIds)
      .map((id) => this.subscriptions.get(id))
      .filter((sub): sub is PushSubscription => sub !== undefined && sub.active);
  }

  // AC3: Send push notification to user
  async sendToUser(userId: string, notification: PushNotification): Promise<number> {
    const subscriptions = this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      logger.debug('No active subscriptions for user', { userId });
      return 0;
    }

    // AC8: Batch send to multiple subscriptions
    const results = await Promise.all(
      subscriptions.map((sub) => this.sendToSubscription(sub, notification))
    );

    const successful = results.filter((r) => r).length;
    this.metrics.sent += successful;

    return successful;
  }

  // AC3: Send to specific subscription
  private async sendToSubscription(subscription: PushSubscription, notification: PushNotification): Promise<boolean> {
    try {
      // AC3: In production, use web-push library
      // const result = await webpush.sendNotification(
      //   { endpoint: subscription.endpoint, keys: { auth: subscription.auth, p256dh: subscription.p256dh } },
      //   JSON.stringify(notification)
      // );

      // AC10: Mock delivery
      logger.debug('Push notification sent', {
        subscriptionId: subscription.id,
        title: notification.title,
      });

      this.metrics.delivered++;
      return true;
    } catch (error) {
      logger.error('Failed to send push notification', { error, subscriptionId: subscription.id });

      // AC11: Handle invalid subscriptions
      if ((error as any).statusCode === 410) {
        subscription.active = false;
      }

      this.metrics.failed++;
      return false;
    }
  }

  // AC8: Broadcast to all users
  async broadcast(notification: PushNotification): Promise<number> {
    let totalSent = 0;

    for (const userId of this.userSubscriptions.keys()) {
      const sent = await this.sendToUser(userId, notification);
      totalSent += sent;
    }

    logger.info('Broadcast notification sent', { totalCount: totalSent });

    return totalSent;
  }

  // AC8: Broadcast to users by category
  async broadcastByCategory(
    category: string,
    notification: PushNotification,
    userCategories: Map<string, string[]>
  ): Promise<number> {
    let totalSent = 0;

    for (const [userId, categories] of userCategories.entries()) {
      if (categories.includes(category)) {
        const sent = await this.sendToUser(userId, notification);
        totalSent += sent;
      }
    }

    logger.info('Category broadcast sent', { category, totalCount: totalSent });

    return totalSent;
  }

  // AC7: Track notification click
  trackClick(subscriptionId: string, data: any): void {
    this.metrics.clicked++;
    logger.debug('Notification clicked', { subscriptionId, data });
  }

  // AC7: Track notification dismiss
  trackDismiss(subscriptionId: string): void {
    this.metrics.dismissed++;
    logger.debug('Notification dismissed', { subscriptionId });
  }

  // AC10: Get metrics
  getMetrics() {
    const deliveryRate =
      this.metrics.sent > 0 ? ((this.metrics.delivered / this.metrics.sent) * 100).toFixed(2) : '0';

    const clickRate =
      this.metrics.delivered > 0 ? ((this.metrics.clicked / this.metrics.delivered) * 100).toFixed(2) : '0';

    return {
      ...this.metrics,
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: Array.from(this.subscriptions.values()).filter((s) => s.active).length,
      deliveryRate: `${deliveryRate}%`,
      clickRate: `${clickRate}%`,
    };
  }

  // AC5: Get VAPID public key
  getVAPIDPublicKey(): string {
    return this.VAPID_PUBLIC_KEY;
  }

  // Clear data
  clear(): void {
    this.subscriptions.clear();
    this.userSubscriptions.clear();
    logger.info('Push notification service cleared');
  }
}

export const pushNotificationService = new PushNotificationService();
