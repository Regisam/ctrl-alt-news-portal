import type { Request, Response } from 'express';
import { getFeedStreamService } from '../services/FeedStreamService.js';
import { DeltaEncoder } from '../services/DeltaEncoder.js';

/**
 * GET /api/feed/stream?userId={id}
 *
 * Server-Sent Events endpoint for real-time personalized feed updates
 *
 * Query params:
 * - userId (required): User identifier
 * - lastMessageId (optional): For reconnection, get missed messages
 *
 * Response: text/event-stream
 * - connection_established: Initial confirmation
 * - batch_update: Batched delta updates (500ms interval)
 * - heartbeat: Keep-alive ping (30s)
 * - error: Error messages
 */
export async function handleFeedStream(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { userId, lastMessageId } = req.query;

    // Validate required parameters
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId query parameter is required' });
      return;
    }

    const feedStreamService = getFeedStreamService();

    // If reconnecting, send missed messages first
    if (lastMessageId && typeof lastMessageId === 'string') {
      const messageId = parseInt(lastMessageId, 10);
      if (!isNaN(messageId)) {
        const missedMessages = feedStreamService.getReconnectionQueue(
          userId,
          messageId
        );

        if (missedMessages.length > 0) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Access-Control-Allow-Origin', '*');

          // Send reconnection data (missed messages)
          const reconnectMessage = {
            type: 'reconnection_data',
            userId,
            missedMessageCount: missedMessages.length,
            updates: missedMessages.map((item) => ({
              messageId: item.messageId,
              timestamp: item.timestamp,
              delta: item.delta.delta,
            })),
            timestamp: Date.now(),
          };

          res.write(`data: ${JSON.stringify(reconnectMessage)}\n\n`);
        }
      }
    }

    // Register connection with SSE service
    feedStreamService.addConnection(userId, res);

    // Handle client disconnect
    req.on('close', () => {
      feedStreamService.removeConnection(userId);
    });

    // Cleanup on error
    req.on('error', (error) => {
      console.error(`Error in feed stream for user ${userId}:`, error);
      feedStreamService.removeConnection(userId);
    });

    // Handle response close/end
    res.on('close', () => {
      feedStreamService.removeConnection(userId);
    });

    res.on('error', (error) => {
      console.error(`Response error for user ${userId}:`, error);
      feedStreamService.removeConnection(userId);
    });
  } catch (error) {
    console.error('Error in feed stream endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/feed/stream/update
 *
 * Server endpoint to broadcast delta updates to connected clients
 * Called by internal ranking service when feed changes occur
 *
 * Request body:
 * - userId: string (target user)
 * - delta: FeedDelta (from DeltaEncoder)
 */
export async function broadcastFeedUpdate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { userId, delta } = req.body;

    // Validate input
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    if (!delta || typeof delta !== 'object') {
      res.status(400).json({ error: 'delta is required' });
      return;
    }

    const feedStreamService = getFeedStreamService();

    // Queue update for batching
    feedStreamService.queueUpdate(userId, delta);

    res.status(202).json({
      status: 'queued',
      userId,
      pendingMessages: feedStreamService.getPendingMessageCount(userId),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error broadcasting feed update:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/feed/stream/health
 *
 * Health check endpoint for SSE service
 * Returns active connection count and message queue size
 */
export async function feedStreamHealth(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const feedStreamService = getFeedStreamService();

    res.status(200).json({
      status: 'healthy',
      activeConnections: feedStreamService.getActiveConnections(),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error checking feed stream health:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
