import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import logger from './logger.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  articleId?: string;
}

interface CommentMessage {
  type: 'new_comment' | 'comment_updated' | 'comment_deleted' | 'karma_changed';
  clientTimestamp?: number;
  serverId?: string;
  data: Record<string, unknown>;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const SOCKET_TIMEOUT = 5 * 60 * 1000; // 5 minutes

export function initializeWebSocket(httpServer: Server): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: HEARTBEAT_INTERVAL,
    pingTimeout: 60000,
  });

  // JWT authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      (socket as AuthenticatedSocket).userId = decoded.userId;
      next();
    } catch (error) {
      logger.warn('WebSocket auth failed', { error: String(error) });
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    logger.info('WebSocket client connected', { userId, socketId: socket.id });

    // Auto-join user to personal notification room
    if (userId) {
      socket.join(`user_${userId}`);
      logger.info('Client joined notification room', { userId, socketId: socket.id });
    }

    // Join article room
    socket.on('join_article', (articleId: string) => {
      if (!articleId) {
        socket.emit('error', { message: 'Invalid article ID' });
        return;
      }

      socket.leave(`article_${(socket as any).currentArticleId}`);
      socket.join(`article_${articleId}`);
      (socket as any).currentArticleId = articleId;
      (socket as AuthenticatedSocket).articleId = articleId;

      logger.info('Client joined article room', { userId, articleId, socketId: socket.id });
    });

    // Listen for comment events from client (optimistic updates)
    socket.on('create_comment', (payload: Record<string, unknown>) => {
      const { content, articleId: payloadArticleId, clientTimestamp } = payload;
      const articleId = (socket as AuthenticatedSocket).articleId || payloadArticleId;

      if (!articleId || !userId) {
        socket.emit('error', { message: 'Missing required fields' });
        return;
      }

      logger.debug('Comment creation event received', { userId, articleId, clientTimestamp });

      // Server will process and broadcast to room
      // Broadcasting is handled by server routes after DB insert
    });

    // Upvote event
    socket.on('upvote_comment', (payload: Record<string, unknown>) => {
      const { commentId, clientTimestamp } = payload;
      (socket as any).lastUpvoteTimestamp = clientTimestamp;

      logger.debug('Upvote event received', { userId, commentId, clientTimestamp });
    });

    // Downvote event
    socket.on('downvote_comment', (payload: Record<string, unknown>) => {
      const { commentId, clientTimestamp } = payload;
      (socket as any).lastDownvoteTimestamp = clientTimestamp;

      logger.debug('Downvote event received', { userId, commentId, clientTimestamp });
    });

    // Handle heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { userId, socketId: socket.id });
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error('WebSocket socket error', { error: String(error), userId, socketId: socket.id });
    });

    // Set socket timeout
    const timeoutHandle = setTimeout(() => {
      if (socket.connected) {
        logger.warn('Socket timeout, disconnecting', { userId, socketId: socket.id });
        socket.disconnect(true);
      }
    }, SOCKET_TIMEOUT);

    socket.on('disconnect', () => {
      clearTimeout(timeoutHandle);
    });
  });

  return io;
}

// Broadcast helpers
export function broadcastCommentEvent(io: SocketIOServer, articleId: string, message: CommentMessage) {
  io.to(`article_${articleId}`).emit('comment_event', {
    ...message,
    serverId: message.serverId || undefined,
  });
}

export function broadcastKarmaUpdate(io: SocketIOServer, articleId: string, commentId: string, newKarmaCount: number) {
  io.to(`article_${articleId}`).emit('comment_event', {
    type: 'karma_changed',
    data: {
      commentId,
      karmaCount: newKarmaCount,
    },
    serverId: undefined,
  });
}
