// WebSocket message types for real-time comment updates

export type CommentEventType = 'new_comment' | 'comment_updated' | 'comment_deleted' | 'karma_changed';

export interface CommentMessage {
  type: CommentEventType;
  clientTimestamp?: number;
  serverId?: string;
  data: Record<string, unknown>;
}

export interface NewCommentMessage extends CommentMessage {
  type: 'new_comment';
  data: {
    commentId: string;
    content: string;
    authorId: string;
    authorName: string;
    articleId: string;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CommentUpdatedMessage extends CommentMessage {
  type: 'comment_updated';
  data: {
    commentId: string;
    content: string;
    updatedAt: string;
  };
}

export interface CommentDeletedMessage extends CommentMessage {
  type: 'comment_deleted';
  data: {
    commentId: string;
    deletedAt: string;
  };
}

export interface KarmaChangedMessage extends CommentMessage {
  type: 'karma_changed';
  data: {
    commentId: string;
    karmaCount: number;
    upvotes: number;
    downvotes: number;
  };
}

export interface OptimisticUpdatePayload {
  clientTimestamp: number;
  data: Record<string, unknown>;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError?: string;
  lastHeartbeat?: number;
}

export type NotificationEventType = 'notification';

export interface NotificationMessage {
  type: 'notification';
  data: {
    id: string;
    userId: string;
    type: 'REPLY' | 'MENTION' | 'KARMA_MILESTONE';
    content: string;
    read: boolean;
    createdAt: string;
    relatedCommentId?: string;
    triggeredBy?: {
      id: string;
      username?: string;
      avatarUrl?: string;
    };
  };
}
