import express, { Request, Response } from 'express';
import { logger } from '../../logger.js';

const router = express.Router();

interface CommentFlag {
  flagId: string;
  commentId: string;
  userId: string;
  reason: 'spam' | 'offensive' | 'off-topic' | 'misinformation';
  message?: string;
  flaggedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  flags: CommentFlag[];
  flagCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  createdAt: string;
}

// Mock database
const comments: Map<string, Comment> = new Map();
const userFlags: Map<string, Set<string>> = new Map(); // userId -> Set of flaggedCommentIds

// Initialize mock comments
function initializeMockComments() {
  comments.set('comment_1', {
    id: 'comment_1',
    content: 'This is a great article!',
    authorId: 'user_1',
    flags: [],
    flagCount: 0,
    status: 'APPROVED',
    createdAt: '2026-04-20T10:00:00Z',
  });

  comments.set('comment_2', {
    id: 'comment_2',
    content: 'Spam comment with links',
    authorId: 'user_2',
    flags: [],
    flagCount: 0,
    status: 'PENDING',
    createdAt: '2026-04-21T14:30:00Z',
  });
}

initializeMockComments();

// Middleware: Require authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn('Moderation: No authorization header');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.warn('Moderation: Invalid authorization header');
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  // Mock: extract userId from token
  (req as any).userId = `user_${Math.floor(Math.random() * 2) + 1}`;
  next();
};

// Middleware: Require admin role
const requireAdmin = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn('Moderation: Admin access denied - no auth');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  // Mock: user_2 is admin
  (req as any).userId = 'user_2';
  (req as any).role = 'admin';
  logger.info('Moderation: Admin access granted');
  next();
};

// POST /api/comments/:id/flag - Flag a comment
router.post('/comments/:id/flag', requireAuth, (req: Request, res: Response) => {
  try {
    const commentId = req.params.id;
    const { reason, message } = req.body;
    const userId = (req as any).userId;

    // Validate comment exists
    const comment = comments.get(commentId);
    if (!comment) {
      logger.warn(`Moderation: Comment not found - ${commentId}`);
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Validate reason
    const validReasons = ['spam', 'offensive', 'off-topic', 'misinformation'];
    if (!validReasons.includes(reason)) {
      logger.warn(`Moderation: Invalid flag reason - ${reason}`);
      return res.status(400).json({ success: false, error: 'Invalid flag reason' });
    }

    // Check if user already flagged this comment
    const userFlaggedComments = userFlags.get(userId) || new Set();
    if (userFlaggedComments.has(commentId)) {
      logger.warn(`Moderation: User already flagged comment - ${userId} / ${commentId}`);
      return res.status(400).json({ success: false, error: 'You have already flagged this comment' });
    }

    // Create flag
    const flag: CommentFlag = {
      flagId: `flag_${Date.now()}`,
      commentId,
      userId,
      reason,
      message,
      flaggedAt: new Date().toISOString(),
      status: 'PENDING',
    };

    comment.flags.push(flag);
    comment.flagCount += 1;

    // Track user flag
    userFlaggedComments.add(commentId);
    userFlags.set(userId, userFlaggedComments);

    logger.info(`Moderation: Comment flagged - ${commentId} by ${userId} (${reason})`);

    res.json({
      success: true,
      flag: {
        flagId: flag.flagId,
        commentId,
        reason,
        flaggedAt: flag.flaggedAt,
      },
    });
  } catch (error) {
    logger.error('Moderation: Error flagging comment', { error: String(error) });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/moderation-queue - Get flagged comments for review
router.get('/admin/moderation-queue', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, reason, startDate, endDate, limit = '10', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const offsetNum = parseInt(offset as string) || 0;

    // Filter flagged comments
    let filtered = Array.from(comments.values()).filter((c) => c.flagCount > 0);

    // Filter by status
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    // Filter by reason
    if (reason) {
      filtered = filtered.filter((c) => c.flags.some((f) => f.reason === reason));
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate as string);
      filtered = filtered.filter((c) => new Date(c.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate as string);
      filtered = filtered.filter((c) => new Date(c.createdAt) <= end);
    }

    // Pagination
    const total = filtered.length;
    const queue = filtered.slice(offsetNum, offsetNum + limitNum);

    logger.info(`Moderation: Queue retrieved - ${queue.length}/${total} items`);

    res.json({
      success: true,
      queue: queue.map((c) => ({
        commentId: c.id,
        content: c.content,
        authorId: c.authorId,
        flagCount: c.flagCount,
        flags: c.flags.map((f) => ({
          reason: f.reason,
          message: f.message,
          flaggedAt: f.flaggedAt,
        })),
        status: c.status,
        createdAt: c.createdAt,
      })),
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
        hasMore: offsetNum + limitNum < total,
      },
    });
  } catch (error) {
    logger.error('Moderation: Error retrieving queue', { error: String(error) });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/admin/comments/:id/status - Update comment moderation status
router.patch('/admin/comments/:id/status', requireAdmin, (req: Request, res: Response) => {
  try {
    const commentId = req.params.id;
    const { status } = req.body;

    // Validate comment exists
    const comment = comments.get(commentId);
    if (!comment) {
      logger.warn(`Moderation: Comment not found for status update - ${commentId}`);
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Validate status
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'];
    if (!validStatuses.includes(status)) {
      logger.warn(`Moderation: Invalid status - ${status}`);
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    // Update status
    const oldStatus = comment.status;
    comment.status = status;

    // Mock karma adjustment
    let karmaChange = 0;
    if (status === 'APPROVED') {
      karmaChange = 1;
    } else if (status === 'REJECTED') {
      karmaChange = -5;
    }

    logger.info(`Moderation: Comment status updated - ${commentId} (${oldStatus} → ${status}, karma: ${karmaChange})`);

    res.json({
      success: true,
      comment: {
        commentId: comment.id,
        status: comment.status,
        karmaChange,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Moderation: Error updating comment status', { error: String(error) });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
