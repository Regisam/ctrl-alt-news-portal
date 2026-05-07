import type { FeedDelta } from './DeltaEncoder';

interface SSEConnection {
  userId: string;
  response: any;
  connectedAt: number;
  lastHeartbeat: number;
}

interface MessageQueueItem {
  messageId: number;
  delta: FeedDelta;
  timestamp: number;
}

export class FeedStreamService {
  private connections: Map<string, SSEConnection> = new Map();
  private messageQueues: Map<string, MessageQueueItem[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHistory: MessageQueueItem[] = []; // Global history for resend
  private messageIdCounter: number = 0;
  private readonly BATCH_INTERVAL = 500; // ms
  private readonly HEARTBEAT_INTERVAL = 30000; // 30s
  private readonly MESSAGE_HISTORY_LIMIT = 100;

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Register SSE connection for a user
   */
  addConnection(userId: string, response: any): void {
    const connection: SSEConnection = {
      userId,
      response,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
    };

    this.connections.set(userId, connection);
    this.messageQueues.set(userId, []);

    // Send initial SSE headers
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial message with connection timestamp
    const welcomeMsg = {
      type: 'connection_established',
      userId,
      messageId: 0,
      timestamp: Date.now(),
    };
    this.sendSSEMessage(userId, welcomeMsg);
  }

  /**
   * Queue delta update for a user (batched)
   */
  queueUpdate(userId: string, delta: FeedDelta): void {
    const queue = this.messageQueues.get(userId) || [];
    if (!this.messageQueues.has(userId)) {
      this.messageQueues.set(userId, queue);
    }

    // Check if update already in queue (deduplication)
    const isDuplicate = queue.some(
      (item) =>
        item.messageId === delta.messageId &&
        item.timestamp === delta.timestamp
    );
    if (isDuplicate) {
      return;
    }

    // Add to queue
    this.messageIdCounter++;
    const queueItem: MessageQueueItem = {
      messageId: this.messageIdCounter,
      delta,
      timestamp: Date.now(),
    };
    queue.push(queueItem);

    // Schedule batch send if not already scheduled
    if (!this.batchTimers.has(userId)) {
      const timer = setTimeout(() => {
        this.flushQueue(userId);
      }, this.BATCH_INTERVAL);
      this.batchTimers.set(userId, timer);
    }
  }

  /**
   * Flush queued messages for a user
   */
  private flushQueue(userId: string): void {
    const queue = this.messageQueues.get(userId);
    if (!queue || queue.length === 0) {
      return;
    }

    const connection = this.connections.get(userId);
    if (!connection || connection.response.destroyed) {
      // Connection gone, just update history without sending
      queue.forEach((item) => {
        this.messageHistory.push(item);
        if (this.messageHistory.length > this.MESSAGE_HISTORY_LIMIT) {
          this.messageHistory.shift();
        }
      });
      this.messageQueues.set(userId, []);
      return;
    }

    // Sort by messageId to maintain order
    queue.sort((a, b) => a.messageId - b.messageId);

    // Send batched update
    const batchMessage = {
      type: 'batch_update',
      userId,
      count: queue.length,
      updates: queue.map((item) => ({
        messageId: item.messageId,
        timestamp: item.timestamp,
        delta: item.delta.delta,
      })),
      timestamp: Date.now(),
    };

    try {
      connection.response.write(`data: ${JSON.stringify(batchMessage)}\n\n`);
      connection.lastHeartbeat = Date.now();
    } catch (error) {
      console.error(`Error flushing queue for user ${userId}:`, error);
    }

    // Add to message history for resend capability
    queue.forEach((item) => {
      this.messageHistory.push(item);
      // Keep history size bounded
      if (this.messageHistory.length > this.MESSAGE_HISTORY_LIMIT) {
        this.messageHistory.shift();
      }
    });

    // Clear queue
    this.messageQueues.set(userId, []);

    // Clear timer
    const timer = this.batchTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(userId);
    }
  }

  /**
   * Get messages since last received for reconnection
   */
  getReconnectionQueue(
    userId: string,
    lastMessageId: number
  ): MessageQueueItem[] {
    return this.messageHistory.filter((item) => item.messageId > lastMessageId);
  }

  /**
   * Send SSE message to user
   */
  private sendSSEMessage(userId: string, message: any): void {
    const connection = this.connections.get(userId);
    if (!connection) {
      return; // Already removed
    }

    if (connection.response.destroyed) {
      // Don't send, just mark for cleanup
      this.connections.delete(userId);
      return;
    }

    try {
      connection.response.write(`data: ${JSON.stringify(message)}\n\n`);
      connection.lastHeartbeat = Date.now();
    } catch (error) {
      console.error(`Error sending SSE message to user ${userId}:`, error);
      this.connections.delete(userId);
    }
  }

  /**
   * Send heartbeat ping (keeps connection alive)
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const deadConnections: string[] = [];

      this.connections.forEach((connection, userId) => {
        if (connection.response.destroyed) {
          deadConnections.push(userId);
          return;
        }

        const timeSinceHeartbeat = now - connection.lastHeartbeat;
        // If no message sent in 30s, send heartbeat
        if (timeSinceHeartbeat >= this.HEARTBEAT_INTERVAL) {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: now,
            userId,
          };
          this.sendSSEMessage(userId, heartbeat);
        }
      });

      // Clean up dead connections
      deadConnections.forEach((userId) => {
        this.removeConnection(userId);
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Remove connection and cleanup
   */
  removeConnection(userId: string): void {
    // Check if connection exists
    if (!this.connections.has(userId)) {
      return; // Already removed
    }

    // Clear batch timer first
    const timer = this.batchTimers.get(userId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(userId);
    }

    // Don't flush - just clear pending queue
    this.messageQueues.delete(userId);

    // Close response if still open
    const connection = this.connections.get(userId);
    if (connection && !connection.response.destroyed) {
      try {
        connection.response.end();
      } catch (error) {
        console.error(`Error closing connection for user ${userId}:`, error);
      }
    }

    this.connections.delete(userId);
  }

  /**
   * Get active connection count (for monitoring)
   */
  getActiveConnections(): number {
    return this.connections.size;
  }

  /**
   * Get user's pending message count
   */
  getPendingMessageCount(userId: string): number {
    return this.messageQueues.get(userId)?.length || 0;
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Flush all queues
    this.messageQueues.forEach((_, userId) => {
      this.flushQueue(userId);
    });

    // Close all connections
    this.connections.forEach((connection) => {
      if (!connection.response.destroyed) {
        try {
          connection.response.end();
        } catch (error) {
          // Silently ignore errors on shutdown
        }
      }
    });

    this.connections.clear();
    this.messageQueues.clear();
    this.batchTimers.forEach((timer) => clearTimeout(timer));
    this.batchTimers.clear();
  }
}

// Singleton instance
let feedStreamServiceInstance: FeedStreamService | null = null;

export function getFeedStreamService(): FeedStreamService {
  if (!feedStreamServiceInstance) {
    feedStreamServiceInstance = new FeedStreamService();
  }
  return feedStreamServiceInstance;
}
