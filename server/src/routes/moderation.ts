import { Router } from 'express';
import type { Response } from 'express';
import { AuthRequest, verifyJWT } from '../middleware/auth';
import { prisma } from '../prisma';
import logger from '../logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const flagCommentSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'offensive', 'other']),
  details: z.string().max(500).optional(),
});

const updateCommentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING']),
  moderatorNote: z.string().max(500).optional(),
});

// POST /api/comments/:id/flag - Flag a comment for moderation
router.post('/comments/:id/flag', verifyJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = flagCommentSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid flag data',
        errors: parseResult.error.flatten(),
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    // Prevent self-flagging
    if (comment.authorId === req.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot flag your own comment',
      });
    }

    const { reason, details } = parseResult.data;

    // Update comment with flag info (increment flag count)
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        status: 'PENDING',
      },
      select: {
        id: true,
        status: true,
      },
    });

    logger.info('Comment flagged', {
      commentId: id,
      reason,
      flaggedBy: req.userId,
    });

    res.json({
      success: true,
      message: 'Comment flagged for review',
      data: updatedComment,
    });
  } catch (error) {
    logger.error('Error flagging comment', {
      commentId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to flag comment',
    });
  }
});

// GET /api/admin/moderation-queue - Get comments pending moderation (admin only)
router.get('/admin/moderation-queue', verifyJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { status: 'PENDING' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          article: {
            select: {
              id: true,
              titleEn: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: { status: 'PENDING' },
      }),
    ]);

    res.json({
      success: true,
      data: {
        comments: comments.map((c: any) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching moderation queue', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation queue',
    });
  }
});

// PATCH /api/admin/comments/:id/status - Update comment moderation status (admin only)
router.patch('/admin/comments/:id/status', verifyJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateCommentStatusSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status data',
        errors: parseResult.error.flatten(),
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const { status, moderatorNote } = parseResult.data;

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    // Update comment status
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { status },
    });

    // Update user karma based on status
    if (status === 'APPROVED') {
      // +1 karma for approved comment
      await prisma.user.update({
        where: { id: comment.authorId },
        data: {
          karma: { increment: 1 },
        },
      });
    } else if (status === 'REJECTED') {
      // -5 karma for rejected comment
      await prisma.user.update({
        where: { id: comment.authorId },
        data: {
          karma: { increment: -5 },
        },
      });
    }

    logger.info('Comment status updated', {
      commentId: id,
      status,
      moderatorNote,
      moderatedBy: req.userId,
    });

    res.json({
      success: true,
      message: 'Comment status updated',
      data: updatedComment,
    });
  } catch (error) {
    logger.error('Error updating comment status', {
      commentId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update comment status',
    });
  }
});

// GET /api/users/:id/reputation - Get user reputation and badges
router.get('/users/:id/reputation', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        karma: true,
        _count: {
          select: {
            comments: true,
            articles: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Determine badges based on karma
    const badges = [];
    if (user.karma >= 10) badges.push('Trusted');
    if (user.karma >= 50) badges.push('Contributor');
    if (user.karma >= 100) badges.push('Expert');
    if (user._count.articles >= 5) badges.push('Author');

    res.json({
      success: true,
      data: {
        userId: user.id,
        karma: user.karma,
        badges,
        stats: {
          commentCount: user._count.comments,
          articleCount: user._count.articles,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching user reputation', {
      userId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user reputation',
    });
  }
});

// GET /api/reputation/leaderboard - Get top users by karma
router.get('/reputation/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);

    const topUsers = await prisma.user.findMany({
      where: { karma: { gt: 0 } },
      select: {
        id: true,
        fullName: true,
        username: true,
        karma: true,
        avatarUrl: true,
      },
      orderBy: { karma: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: {
        leaderboard: topUsers,
        limit,
      },
    });
  } catch (error) {
    logger.error('Error fetching reputation leaderboard', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

export function setupModerationRoute(mainRouter: Router) {
  mainRouter.use('/api', router);
}

export default router;
