import { logger } from '../logger.js';

// AC1 & AC2: Comment with metadata
export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  userName: string;
  content: string;
  parentCommentId?: string; // AC3: for threading
  createdAt: string;
  updatedAt: string;
  editHistory: Array<{ content: string; timestamp: string }>;
  reactions: Record<string, number>; // AC4: like, dislike, helpful
  flagged: boolean; // AC5: moderation
  flagReason?: string;
  deleted: boolean;
}

// AC4: Reaction types
export type ReactionType = 'like' | 'dislike' | 'helpful' | 'insightful';

class CommentManager {
  private comments: Map<string, Comment> = new Map();
  private articleComments: Map<string, string[]> = new Map(); // articleId -> commentIds
  private userComments: Map<string, string[]> = new Map(); // userId -> commentIds
  private userReactions: Map<string, Set<string>> = new Map(); // userId:commentId -> reactions

  // AC1: Create comment
  createComment(
    articleId: string,
    userId: string,
    userName: string,
    content: string,
    parentCommentId?: string
  ): Comment {
    const id = `comment-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    const comment: Comment = {
      id,
      articleId,
      userId,
      userName,
      content,
      parentCommentId,
      createdAt: now,
      updatedAt: now,
      editHistory: [{ content, timestamp: now }],
      reactions: {
        like: 0,
        dislike: 0,
        helpful: 0,
        insightful: 0,
      },
      flagged: false,
      deleted: false,
    };

    this.comments.set(id, comment);

    // AC3: Link to article
    if (!this.articleComments.has(articleId)) {
      this.articleComments.set(articleId, []);
    }
    this.articleComments.get(articleId)!.push(id);

    // Track user comments
    if (!this.userComments.has(userId)) {
      this.userComments.set(userId, []);
    }
    this.userComments.get(userId)!.push(id);

    logger.info('Comment created', { id, articleId, userId });

    return comment;
  }

  // AC6: Edit comment (by author only)
  editComment(commentId: string, userId: string, newContent: string): Comment | null {
    const comment = this.comments.get(commentId);

    if (!comment || comment.userId !== userId || comment.deleted) {
      return null;
    }

    comment.editHistory.push({
      content: newContent,
      timestamp: new Date().toISOString(),
    });

    comment.content = newContent;
    comment.updatedAt = new Date().toISOString();

    logger.info('Comment edited', { commentId, userId });

    return comment;
  }

  // AC6: Delete comment (soft delete)
  deleteComment(commentId: string, userId: string): boolean {
    const comment = this.comments.get(commentId);

    if (!comment || comment.userId !== userId) {
      return false;
    }

    comment.deleted = true;
    comment.content = '[deleted]';
    comment.updatedAt = new Date().toISOString();

    logger.info('Comment deleted', { commentId, userId });

    return true;
  }

  // AC4: Add reaction to comment
  addReaction(commentId: string, userId: string, reactionType: ReactionType): boolean {
    const comment = this.comments.get(commentId);

    if (!comment || comment.deleted) {
      return false;
    }

    const key = `${userId}:${commentId}`;
    if (!this.userReactions.has(key)) {
      this.userReactions.set(key, new Set());
    }

    const reactions = this.userReactions.get(key)!;

    if (!reactions.has(reactionType)) {
      reactions.add(reactionType);
      comment.reactions[reactionType] = (comment.reactions[reactionType] || 0) + 1;

      logger.debug('Reaction added', { commentId, userId, reactionType });

      return true;
    }

    return false;
  }

  // AC4: Remove reaction
  removeReaction(commentId: string, userId: string, reactionType: ReactionType): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    const key = `${userId}:${commentId}`;
    const reactions = this.userReactions.get(key);

    if (reactions && reactions.has(reactionType)) {
      reactions.delete(reactionType);
      comment.reactions[reactionType] = Math.max(0, (comment.reactions[reactionType] || 1) - 1);

      logger.debug('Reaction removed', { commentId, userId, reactionType });

      return true;
    }

    return false;
  }

  // AC5: Flag comment for moderation
  flagComment(commentId: string, reason: string): boolean {
    const comment = this.comments.get(commentId);

    if (!comment) {
      return false;
    }

    comment.flagged = true;
    comment.flagReason = reason;

    logger.warn('Comment flagged', { commentId, reason });

    return true;
  }

  // AC7 & AC8: Get comments for article with sorting
  getArticleComments(
    articleId: string,
    sortBy: 'newest' | 'top' | 'controversial' = 'newest'
  ): Comment[] {
    const commentIds = this.articleComments.get(articleId) || [];
    let comments = commentIds
      .map((id) => this.comments.get(id))
      .filter((c) => c && !c.deleted) as Comment[];

    // AC8: Sort by option
    if (sortBy === 'top') {
      comments.sort((a, b) => {
        const aScore = (a.reactions.like || 0) - (a.reactions.dislike || 0);
        const bScore = (b.reactions.like || 0) - (b.reactions.dislike || 0);
        return bScore - aScore;
      });
    } else if (sortBy === 'controversial') {
      comments.sort((a, b) => {
        const aControversy = Math.min(a.reactions.like || 0, a.reactions.dislike || 0);
        const bControversy = Math.min(b.reactions.like || 0, b.reactions.dislike || 0);
        return bControversy - aControversy;
      });
    } else {
      // newest (default)
      comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // AC3: Separate root and threaded comments
    const rootComments = comments.filter((c) => !c.parentCommentId);
    const threaded = rootComments.map((root) => ({
      ...root,
      replies: comments.filter((c) => c.parentCommentId === root.id),
    }));

    return threaded;
  }

  // AC3: Get threaded/nested comments for a parent
  getCommentReplies(parentCommentId: string): Comment[] {
    return Array.from(this.comments.values())
      .filter((c) => c.parentCommentId === parentCommentId && !c.deleted)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  // Get single comment
  getComment(commentId: string): Comment | null {
    return this.comments.get(commentId) || null;
  }

  // Get user's comments
  getUserComments(userId: string): Comment[] {
    const commentIds = this.userComments.get(userId) || [];
    return commentIds
      .map((id) => this.comments.get(id))
      .filter((c) => c && !c.deleted) as Comment[];
  }

  // Get stats
  getStats(): {
    totalComments: number;
    activeComments: number;
    flaggedComments: number;
    avgReactionsPerComment: number;
  } {
    const allComments = Array.from(this.comments.values());
    const active = allComments.filter((c) => !c.deleted);
    const flagged = allComments.filter((c) => c.flagged);

    const avgReactions =
      active.length > 0
        ? active.reduce(
            (sum, c) =>
              sum + Object.values(c.reactions).reduce((a, b) => a + b, 0),
            0
          ) / active.length
        : 0;

    return {
      totalComments: allComments.length,
      activeComments: active.length,
      flaggedComments: flagged.length,
      avgReactionsPerComment: Math.round(avgReactions * 10) / 10,
    };
  }
}

export const commentManager = new CommentManager();
