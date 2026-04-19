import { useState, useCallback, useRef } from 'react';
import { CommentMessage } from '@shared/websocket-types';

export interface OptimisticComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  articleId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  clientTimestamp?: number;
  isPending?: boolean;
}

export function useOptimisticCommentState() {
  const [comments, setComments] = useState<Map<string, OptimisticComment>>(new Map());
  const pendingUpdatesRef = useRef<Map<number, OptimisticComment>>(new Map());

  // Add optimistic comment before server response
  const addOptimisticComment = useCallback(
    (comment: Omit<OptimisticComment, 'id'>, clientTimestamp: number): string => {
      const id = `optimistic_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const optimisticComment: OptimisticComment = {
        ...comment,
        id,
        clientTimestamp,
        isPending: true,
      };

      setComments((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, optimisticComment);
        return newMap;
      });

      pendingUpdatesRef.current.set(clientTimestamp, optimisticComment);
      return id;
    },
    []
  );

  // Handle server response and match with optimistic update
  const confirmCommentFromServer = useCallback(
    (message: CommentMessage & { clientTimestamp?: number }) => {
      if (message.type !== 'new_comment' || !message.clientTimestamp) {
        return;
      }

      const pendingComment = pendingUpdatesRef.current.get(message.clientTimestamp);
      if (pendingComment) {
        // Replace optimistic comment with server comment
        setComments((prev) => {
          const newMap = new Map(prev);
          newMap.delete(pendingComment.id);

          const serverComment: OptimisticComment = {
            id: String(message.data.commentId),
            content: String(message.data.content),
            authorId: String(message.data.authorId),
            authorName: String(message.data.authorName),
            articleId: String(message.data.articleId),
            parentId: message.data.parentId ? String(message.data.parentId) : undefined,
            createdAt: String(message.data.createdAt),
            updatedAt: String(message.data.updatedAt),
            clientTimestamp: message.clientTimestamp,
            isPending: false,
          };

          newMap.set(serverComment.id, serverComment);
          return newMap;
        });

        pendingUpdatesRef.current.delete(message.clientTimestamp);
      }
    },
    []
  );

  // Handle server broadcast message (either confirming optimistic or new from another client)
  const applyServerMessage = useCallback((message: CommentMessage) => {
    if (message.type === 'new_comment') {
      confirmCommentFromServer(message as CommentMessage & { clientTimestamp?: number });
    } else if (message.type === 'comment_deleted') {
      const commentId = String(message.data.commentId);
      setComments((prev) => {
        const newMap = new Map(prev);
        newMap.delete(commentId);
        return newMap;
      });
    } else if (message.type === 'comment_updated') {
      const commentId = String(message.data.commentId);
      setComments((prev) => {
        const comment = prev.get(commentId);
        if (comment) {
          const newMap = new Map(prev);
          newMap.set(commentId, {
            ...comment,
            content: String(message.data.content),
            updatedAt: String(message.data.updatedAt),
          });
          return newMap;
        }
        return prev;
      });
    }
  }, [confirmCommentFromServer]);

  // Handle conflicts: rollback optimistic on server rejection
  const rollbackOptimisticUpdate = useCallback((clientTimestamp: number) => {
    const pendingComment = pendingUpdatesRef.current.get(clientTimestamp);
    if (pendingComment) {
      setComments((prev) => {
        const newMap = new Map(prev);
        newMap.delete(pendingComment.id);
        return newMap;
      });
      pendingUpdatesRef.current.delete(clientTimestamp);
    }
  }, []);

  return {
    comments: Array.from(comments.values()),
    addOptimisticComment,
    applyServerMessage,
    rollbackOptimisticUpdate,
  };
}
