import type { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { validateDepth } from '../utils/validateDepth';

interface GetCommentsQuery {
  articleId: string;
  page?: string;
  limit?: string;
  sort?: string;
}

interface CreateCommentBody {
  articleId: string;
  content: string;
  authorId: string;
  parentId?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

function validateComment(data: CreateCommentBody): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.articleId) {
    errors.articleId = 'Article ID is required';
  }

  if (!data.content) {
    errors.content = 'Comment is required';
  } else if (typeof data.content !== 'string' || data.content.trim().length < 5) {
    errors.content = 'Comment must be at least 5 characters';
  } else if (data.content.length > 5000) {
    errors.content = 'Comment must not exceed 5000 characters';
  }

  if (!data.authorId) {
    errors.authorId = 'Author ID is required';
  }

  // parentId is optional
  if (data.parentId && typeof data.parentId !== 'string') {
    errors.parentId = 'Parent comment ID must be a string';
  }

  return errors;
}

function buildCommentTree(comments: any[]): any[] {
  const commentMap = new Map();
  const rootComments: any[] = [];

  comments.forEach((comment) => {
    commentMap.set(comment.id, {
      ...comment,
      replies: [],
    });
  });

  comments.forEach((comment) => {
    if (comment.parentId) {
      const parent = commentMap.get(comment.parentId);
      if (parent) {
        parent.replies.push(commentMap.get(comment.id));
      }
    } else {
      rootComments.push(commentMap.get(comment.id));
    }
  });

  return rootComments;
}

async function softDeleteCommentAndChildren(commentId: string): Promise<void> {
  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });

  const children = await prisma.comment.findMany({
    where: { parentId: commentId },
    select: { id: true },
  });

  for (const child of children) {
    await softDeleteCommentAndChildren(child.id);
  }
}

export function setupCommentsRoute(router: Router): void {
  router.get(
    '/api/comments',
    async (req: Request<object, object, object, GetCommentsQuery>, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { articleId, page = '1', limit = '20', sort = 'newest' } = req.query;

        if (!articleId) {
          res.status(400).json({
            success: false,
            error: 'Article ID is required',
          });
          return;
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (pageNum - 1) * limitNum;

        logger.info('GET /api/comments requested', {
          articleId,
          page: pageNum,
          limit: limitNum,
          sort,
        });

        const [comments, total] = await Promise.all([
          prisma.comment.findMany({
            where: {
              articleId,
              deletedAt: null,
              status: 'APPROVED',
            },
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: {
              createdAt: sort === 'oldest' ? 'asc' : 'desc',
            },
            skip,
            take: limitNum,
          }),
          prisma.comment.count({
            where: {
              articleId,
              deletedAt: null,
              status: 'APPROVED',
            },
          }),
        ]);

        const totalPages = Math.ceil(total / limitNum);
        const tree = buildCommentTree(comments);

        logger.info('Comments retrieved', {
          articleId,
          count: comments.length,
          total,
        });

        res.status(200).json({
          success: true,
          data: tree,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
          },
        });
      } catch (error) {
        logger.error('Error fetching comments', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        next(error);
      }
    }
  );

  router.post(
    '/api/comments',
    async (req: Request<object, object, CreateCommentBody>, res: Response, next: NextFunction): Promise<void> => {
      try {
        logger.info('POST /api/comments received', {
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });

        const errors = validateComment(req.body);
        if (Object.keys(errors).length > 0) {
          logger.warn('Comment validation failed', { errors, authorId: req.body.authorId });
          res.status(400).json({
            success: false,
            errors,
          });
          return;
        }

        const { articleId, content, authorId, parentId } = req.body;
        const sanitizedData = {
          articleId,
          content: String(content).trim(),
          authorId,
          parentId: parentId ? String(parentId).trim() : undefined,
        };

        const comment = await prisma.comment.create({
          data: {
            content: sanitizedData.content,
            articleId: sanitizedData.articleId,
            authorId: sanitizedData.authorId,
            parentId: sanitizedData.parentId || null,
            status: 'APPROVED',
          },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        });

        logger.info('Comment created', {
          commentId: comment.id,
          articleId: sanitizedData.articleId,
          authorId: sanitizedData.authorId,
        });

        res.status(201).json({
          success: true,
          data: {
            id: comment.id,
            content: comment.content,
            author: comment.author,
            createdAt: comment.createdAt,
            parentId: comment.parentId,
            replies: [],
          },
        });
      } catch (error) {
        logger.error('Error creating comment', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        next(error);
      }
    }
  );

  router.delete(
    '/api/comments/:id',
    async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;

        logger.info('DELETE /api/comments/:id received', { commentId: id });

        const comment = await prisma.comment.findUnique({
          where: { id },
          select: { id: true, parentId: true },
        });

        if (!comment) {
          logger.warn('Comment not found for deletion', { commentId: id });
          res.status(404).json({
            success: false,
            error: 'Comment not found',
          });
          return;
        }

        await softDeleteCommentAndChildren(id);

        logger.info('Comment soft-deleted with children', { commentId: id });

        res.json({
          success: true,
          message: 'Comment deleted',
        });
      } catch (error) {
        logger.error('Error deleting comment', {
          commentId: req.params.id,
          error: error instanceof Error ? error.message : String(error),
        });
        next(error);
      }
    }
  );

  router.post(
    '/api/comments/:id/reply',
    async (req: Request<{ id: string }, object, CreateCommentBody>, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id: parentId } = req.params;
        const { articleId, content, authorId } = req.body;

        logger.info('POST /api/comments/:id/reply received', {
          parentId,
          articleId,
          authorId,
        });

        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
          select: {
            id: true,
            content: true,
            articleId: true,
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        });

        if (!parentComment) {
          logger.warn('Parent comment not found', { parentId });
          res.status(404).json({
            success: false,
            error: 'Parent comment not found',
          });
          return;
        }

        if (parentComment.articleId !== articleId) {
          logger.warn('Parent comment belongs to different article', {
            parentId,
            parentArticleId: parentComment.articleId,
            requestedArticleId: articleId,
          });
          res.status(400).json({
            success: false,
            error: 'Parent comment belongs to a different article',
          });
          return;
        }

        const depthValidation = await validateDepth(parentId, 3);
        if (!depthValidation.valid) {
          logger.warn('Depth validation failed', {
            parentId,
            currentDepth: depthValidation.depth,
            error: depthValidation.error,
          });
          res.status(400).json({
            success: false,
            error: depthValidation.error,
          });
          return;
        }

        const errors = validateComment({ articleId, content, authorId });
        if (Object.keys(errors).length > 0) {
          logger.warn('Reply validation failed', { errors, parentId, authorId });
          res.status(400).json({
            success: false,
            errors,
          });
          return;
        }

        const reply = await prisma.comment.create({
          data: {
            content: String(content).trim(),
            articleId,
            authorId,
            parentId,
            status: 'APPROVED',
          },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        });

        logger.info('Reply created', {
          replyId: reply.id,
          parentId,
          articleId,
          authorId,
          depth: depthValidation.depth + 1,
        });

        res.status(201).json({
          success: true,
          data: {
            id: reply.id,
            content: reply.content,
            author: reply.author,
            createdAt: reply.createdAt,
            parentId: reply.parentId,
            parentContext: {
              id: parentComment.id,
              content: parentComment.content,
              author: parentComment.author,
            },
            replies: [],
            depth: depthValidation.depth + 1,
          },
        });
      } catch (error) {
        logger.error('Error creating reply', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        next(error);
      }
    }
  );
}
