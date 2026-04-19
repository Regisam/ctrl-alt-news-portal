import type { Router, Request, Response, NextFunction } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../prisma';
import logger from '../logger';
import { WebSocketHandlers } from '../websocket-handlers';
import { NotificationService } from '../services/notification-service';

interface KarmaVoteBody {
  commentId: string;
  articleId: string;
  userId: string;
  type: 'upvote' | 'downvote';
}

// In-memory karma tracking for now (TODO: persist to database in Story 4.4)
const karmaMap = new Map<string, { upvotes: number; downvotes: number; voters: Set<string> }>();

export function setupKarmaRoute(router: Router, io?: SocketIOServer): void {
  let wsHandlers: WebSocketHandlers | undefined;
  if (io) {
    wsHandlers = new WebSocketHandlers(io);
  }

  // POST /api/comments/:id/upvote
  router.post(
    '/api/comments/:id/upvote',
    async (req: Request<{ id: string }, object, KarmaVoteBody>, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id: commentId } = req.params;
        const { articleId, userId } = req.body;

        logger.info('POST /api/comments/:id/upvote', { commentId, userId });

        // Verify comment exists and get author
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          select: { id: true, articleId: true, authorId: true },
        });

        if (!comment) {
          res.status(404).json({
            success: false,
            error: 'Comment not found',
          });
          return;
        }

        // Initialize karma if not exists
        if (!karmaMap.has(commentId)) {
          karmaMap.set(commentId, { upvotes: 0, downvotes: 0, voters: new Set() });
        }

        const karma = karmaMap.get(commentId)!;

        // Server-side deduplication: prevent duplicate upvotes from same user
        if (karma.voters.has(`${userId}_upvote`)) {
          res.status(400).json({
            success: false,
            error: 'Already upvoted',
          });
          return;
        }

        // Remove downvote if exists
        if (karma.voters.has(`${userId}_downvote`)) {
          karma.voters.delete(`${userId}_downvote`);
          karma.downvotes -= 1;
        }

        // Add upvote
        karma.voters.add(`${userId}_upvote`);
        karma.upvotes += 1;

        const karmaCount = karma.upvotes - karma.downvotes;

        logger.info('Comment upvoted', {
          commentId,
          userId,
          upvotes: karma.upvotes,
          downvotes: karma.downvotes,
          karmaCount,
        });

        // Update comment author's user karma and check for milestones
        if (comment.authorId && comment.authorId !== userId) {
          try {
            const updatedUser = await prisma.user.update({
              where: { id: comment.authorId },
              data: { karma: { increment: 1 } },
              select: { karma: true },
            });

            // Check for karma milestone notifications
            if (updatedUser.karma > 0) {
              await NotificationService.notifyKarmaMilestone(comment.authorId, updatedUser.karma);
            }
          } catch (error) {
            logger.error('Error updating user karma', { error });
          }
        }

        // Broadcast karma update via WebSocket
        if (wsHandlers) {
          wsHandlers.broadcastKarmaUpdate(articleId, commentId, karmaCount, karma.upvotes, karma.downvotes);
        }

        res.json({
          success: true,
          data: {
            commentId,
            karmaCount,
            upvotes: karma.upvotes,
            downvotes: karma.downvotes,
          },
        });
      } catch (error) {
        logger.error('Error upvoting comment', {
          error: error instanceof Error ? error.message : String(error),
          commentId: req.params.id,
        });
        next(error);
      }
    }
  );

  // POST /api/comments/:id/downvote
  router.post(
    '/api/comments/:id/downvote',
    async (req: Request<{ id: string }, object, KarmaVoteBody>, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id: commentId } = req.params;
        const { articleId, userId } = req.body;

        logger.info('POST /api/comments/:id/downvote', { commentId, userId });

        // Verify comment exists
        const comment = await prisma.comment.findUnique({
          where: { id: commentId },
          select: { id: true, articleId: true },
        });

        if (!comment) {
          res.status(404).json({
            success: false,
            error: 'Comment not found',
          });
          return;
        }

        // Initialize karma if not exists
        if (!karmaMap.has(commentId)) {
          karmaMap.set(commentId, { upvotes: 0, downvotes: 0, voters: new Set() });
        }

        const karma = karmaMap.get(commentId)!;

        // Server-side deduplication: prevent duplicate downvotes from same user
        if (karma.voters.has(`${userId}_downvote`)) {
          res.status(400).json({
            success: false,
            error: 'Already downvoted',
          });
          return;
        }

        // Remove upvote if exists
        if (karma.voters.has(`${userId}_upvote`)) {
          karma.voters.delete(`${userId}_upvote`);
          karma.upvotes -= 1;
        }

        // Add downvote
        karma.voters.add(`${userId}_downvote`);
        karma.downvotes += 1;

        const karmaCount = karma.upvotes - karma.downvotes;

        logger.info('Comment downvoted', {
          commentId,
          userId,
          upvotes: karma.upvotes,
          downvotes: karma.downvotes,
          karmaCount,
        });

        // Broadcast karma update via WebSocket
        if (wsHandlers) {
          wsHandlers.broadcastKarmaUpdate(articleId, commentId, karmaCount, karma.upvotes, karma.downvotes);
        }

        res.json({
          success: true,
          data: {
            commentId,
            karmaCount,
            upvotes: karma.upvotes,
            downvotes: karma.downvotes,
          },
        });
      } catch (error) {
        logger.error('Error downvoting comment', {
          error: error instanceof Error ? error.message : String(error),
          commentId: req.params.id,
        });
        next(error);
      }
    }
  );
}
