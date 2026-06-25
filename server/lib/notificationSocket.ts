import { logger } from '../logger.js';

// AC1-4: WebSocket notification types
export interface SocketConnection {
  id: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
}

export interface NotificationEvent {
  id: string;
  type: string;
  userId: string;
  actorId: string;
  actorName: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
  timestamp: Date;
}

class NotificationSocketManager {
  private connections: Map<string, SocketConnection> = new Map();
  private messageQueue: Map<string, NotificationEvent[]> = new Map();
  private presenceData: Map<string, PresenceUpdate> = new Map();

  // AC2: Handle connection
  handleConnection(socketId: string, userId: string): SocketConnection {
    const connection: SocketConnection = {
      id: socketId,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set(['notifications', `user:${userId}`]),
    };

    this.connections.set(socketId, connection);

    // AC4: Track presence
    this.presenceData.set(userId, {
      userId,
      status: 'online',
      timestamp: new Date(),
    });

    logger.info('WebSocket connected', { socketId, userId });

    return connection;
  }

  // AC2: Handle disconnection
  handleDisconnection(socketId: string): string | null {
    const connection = this.connections.get(socketId);

    if (!connection) return null;

    this.connections.delete(socketId);

    // AC4: Update presence (check if user has other connections)
    const hasOtherConnections = Array.from(this.connections.values()).some(
      (c) => c.userId === connection.userId
    );

    if (!hasOtherConnections) {
      this.presenceData.set(connection.userId, {
        userId: connection.userId,
        status: 'offline',
        timestamp: new Date(),
      });
    }

    logger.info('WebSocket disconnected', { socketId, userId: connection.userId });

    return connection.userId;
  }

  // AC3: Queue notification
  queueNotification(event: NotificationEvent): void {
    const userId = event.userId;

    if (!this.messageQueue.has(userId)) {
      this.messageQueue.set(userId, []);
    }

    // AC5: Maintain ordering
    this.messageQueue.get(userId)!.push(event);

    // Keep last 100 messages per user
    const queue = this.messageQueue.get(userId)!;
    if (queue.length > 100) {
      queue.shift();
    }

    logger.debug('Notification queued', { userId, type: event.type });
  }

  // AC3: Get pending notifications
  getPendingNotifications(userId: string): NotificationEvent[] {
    const notifications = this.messageQueue.get(userId) || [];
    // AC5: Maintain order
    return notifications.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  // AC3: Clear pending notifications
  clearPendingNotifications(userId: string): void {
    this.messageQueue.delete(userId);
  }

  // AC8: Get user connections
  getUserConnections(userId: string): SocketConnection[] {
    return Array.from(this.connections.values()).filter((c) => c.userId === userId);
  }

  // AC9: Subscribe to event
  subscribe(socketId: string, eventType: string): boolean {
    const connection = this.connections.get(socketId);

    if (!connection) return false;

    connection.subscriptions.add(eventType);
    logger.debug('Subscribed to event', { socketId, eventType });

    return true;
  }

  // AC9: Unsubscribe from event
  unsubscribe(socketId: string, eventType: string): boolean {
    const connection = this.connections.get(socketId);

    if (!connection) return false;

    connection.subscriptions.delete(eventType);
    logger.debug('Unsubscribed from event', { socketId, eventType });

    return true;
  }

  // AC9: Check if socket is subscribed
  isSubscribed(socketId: string, eventType: string): boolean {
    const connection = this.connections.get(socketId);

    if (!connection) return false;

    return connection.subscriptions.has(eventType) || connection.subscriptions.has('notifications');
  }

  // AC4: Get presence
  getPresence(userId: string): PresenceUpdate | null {
    return this.presenceData.get(userId) || null;
  }

  // AC4: Get all online users
  getOnlineUsers(): PresenceUpdate[] {
    return Array.from(this.presenceData.values()).filter((p) => p.status === 'online');
  }

  // AC2: Update activity
  updateActivity(socketId: string): void {
    const connection = this.connections.get(socketId);

    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  // AC11: Get connection stats
  getStats() {
    const onlineUsers = this.getOnlineUsers();

    return {
      totalConnections: this.connections.size,
      totalUsers: new Set(Array.from(this.connections.values()).map((c) => c.userId)).size,
      onlineUsers: onlineUsers.length,
      queuedNotifications: Array.from(this.messageQueue.values()).reduce((sum, arr) => sum + arr.length, 0),
      oldestConnection:
        this.connections.size > 0
          ? Math.min(
              ...Array.from(this.connections.values()).map((c) =>
                Date.now() - c.connectedAt.getTime()
              )
            ) / 1000
          : 0,
    };
  }

  // Cleanup idle connections
  cleanup(maxIdleMs: number = 30 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;

    for (const [socketId, connection] of this.connections.entries()) {
      if (now - connection.lastActivity.getTime() > maxIdleMs) {
        this.connections.delete(socketId);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Socket cleanup', { removed });
    }

    return removed;
  }

  // Clear all
  clear(): void {
    this.connections.clear();
    this.messageQueue.clear();
    this.presenceData.clear();
    logger.info('Notification socket manager cleared');
  }
}

export const notificationSocketManager = new NotificationSocketManager();

// Cleanup every 5 minutes
setInterval(() => {
  notificationSocketManager.cleanup();
}, 5 * 60 * 1000);
