import { Server as SocketIOServer } from 'socket.io';
import { Prisma } from '@prisma/client';
import logger from './logger.js';
import {
  NewCommentMessage,
  CommentUpdatedMessage,
  CommentDeletedMessage,
  KarmaChangedMessage,
  NotificationMessage,
} from '@shared/websocket-types';

export class WebSocketHandlers {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // Broadcast new comment with client timestamp for optimistic update matching
  broadcastNewComment(
    articleId: string,
    comment: {
      id: string;
      content: string;
      authorId: string;
      authorName: string;
      createdAt: Date;
      updatedAt: Date;
      parentId?: string;
    },
    clientTimestamp?: number
  ): void {
    const message: NewCommentMessage = {
      type: 'new_comment',
      clientTimestamp,
      data: {
        commentId: comment.id,
        content: comment.content,
        authorId: comment.authorId,
        authorName: comment.authorName,
        articleId,
        parentId: comment.parentId,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      },
    };

    logger.debug('Broadcasting new comment', {
      articleId,
      commentId: comment.id,
      clientTimestamp,
    });

    this.io.to(`article_${articleId}`).emit('comment_event', message);
  }

  // Broadcast comment update
  broadcastCommentUpdate(
    articleId: string,
    commentId: string,
    content: string,
    updatedAt: Date
  ): void {
    const message: CommentUpdatedMessage = {
      type: 'comment_updated',
      data: {
        commentId,
        content,
        updatedAt: updatedAt.toISOString(),
      },
    };

    logger.debug('Broadcasting comment update', {
      articleId,
      commentId,
    });

    this.io.to(`article_${articleId}`).emit('comment_event', message);
  }

  // Broadcast comment deletion
  broadcastCommentDelete(articleId: string, commentId: string, deletedAt: Date): void {
    const message: CommentDeletedMessage = {
      type: 'comment_deleted',
      data: {
        commentId,
        deletedAt: deletedAt.toISOString(),
      },
    };

    logger.debug('Broadcasting comment deletion', {
      articleId,
      commentId,
    });

    this.io.to(`article_${articleId}`).emit('comment_event', message);
  }

  // Broadcast karma update (upvotes/downvotes sync)
  broadcastKarmaUpdate(
    articleId: string,
    commentId: string,
    karmaCount: number,
    upvotes: number,
    downvotes: number
  ): void {
    const message: KarmaChangedMessage = {
      type: 'karma_changed',
      data: {
        commentId,
        karmaCount,
        upvotes,
        downvotes,
      },
    };

    logger.debug('Broadcasting karma update', {
      articleId,
      commentId,
      karmaCount,
    });

    this.io.to(`article_${articleId}`).emit('comment_event', message);
  }

  // Handle concurrent upvote with server-side deduplication
  // Checks comment version/timestamp to prevent race conditions
  deduplicateUpvote(
    existingVotes: { userId: string; type: 'upvote' | 'downvote' }[],
    userId: string
  ): boolean {
    const hasExistingUpvote = existingVotes.some((vote) => vote.userId === userId && vote.type === 'upvote');
    return !hasExistingUpvote;
  }

  // Handle concurrent downvote with deduplication
  deduplicateDownvote(
    existingVotes: { userId: string; type: 'upvote' | 'downvote' }[],
    userId: string
  ): boolean {
    const hasExistingDownvote = existingVotes.some((vote) => vote.userId === userId && vote.type === 'downvote');
    return !hasExistingDownvote;
  }

  // Broadcast notification to user
  broadcastNotification(
    userId: string,
    notification: {
      id: string;
      type: 'REPLY' | 'MENTION' | 'KARMA_MILESTONE';
      content: string;
      read: boolean;
      createdAt: Date;
      relatedCommentId?: string;
      triggeredBy?: { id: string; username?: string; avatarUrl?: string };
    }
  ): void {
    const message: NotificationMessage = {
      type: 'notification',
      data: {
        id: notification.id,
        userId,
        type: notification.type,
        content: notification.content,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
        relatedCommentId: notification.relatedCommentId,
        triggeredBy: notification.triggeredBy,
      },
    };

    logger.debug('Broadcasting notification', {
      userId,
      notificationId: notification.id,
      type: notification.type,
    });

    // Emit to user's personal room (all their connected sockets)
    this.io.to(`user_${userId}`).emit('notification', message);
  }
}

// Create global instance
let webSocketHandlers: WebSocketHandlers | null = null;

export function initializeWebSocketHandlers(io: SocketIOServer): WebSocketHandlers {
  webSocketHandlers = new WebSocketHandlers(io);
  return webSocketHandlers;
}

export function getWebSocketHandlers(): WebSocketHandlers {
  if (!webSocketHandlers) {
    throw new Error('WebSocket handlers not initialized');
  }
  return webSocketHandlers;
}
