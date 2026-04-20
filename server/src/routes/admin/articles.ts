import type { Router, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import logger from '../../logger';
import { verifyJWT, type AuthRequest } from '../../middleware/auth';
import { isAdmin } from '../../middleware/isAdmin';

export function setupAdminArticlesRoute(router: Router): void {
  // GET /api/admin/articles - List articles with pagination, filtering, sorting
  router.get(
    '/api/admin/articles',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 50);
        const category = (req.query.category as string) || undefined;
        const status = (req.query.status as string) || undefined;
        const search = (req.query.search as string) || undefined;
        const sort = (req.query.sort as string) || 'createdAt';
        const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';

        const skip = (page - 1) * limit;

        const where: any = { deletedAt: null };
        if (category) where.category = { nameEn: { contains: category, mode: 'insensitive' } };
        if (status) where.status = status;
        if (search) {
          where.OR = [
            { titleEn: { contains: search, mode: 'insensitive' } },
            { titlePt: { contains: search, mode: 'insensitive' } },
            { author: { email: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const total = await prisma.article.count({ where });
        const articles = await prisma.article.findMany({
          where,
          select: {
            id: true,
            titleEn: true,
            titlePt: true,
            slug: true,
            status: true,
            viewCount: true,
            publishedAt: true,
            createdAt: true,
            author: { select: { fullName: true, email: true } },
            category: { select: { nameEn: true } },
            _count: { select: { comments: true } },
          },
          orderBy: { [sort]: order },
          skip,
          take: limit,
        });

        const data = articles.map((a) => ({
          id: a.id,
          title: a.titleEn,
          author: a.author.fullName || a.author.email,
          category: a.category.nameEn,
          status: a.status,
          views: a.viewCount,
          comments: a._count.comments,
          published: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : 'Draft',
        }));

        res.status(200).json({
          success: true,
          data: { articles: data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
        });
      } catch (error) {
        logger.error('Error fetching admin articles', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch articles' });
      }
    }
  );

  // PUT /api/admin/articles/:id - Edit article metadata
  router.put(
    '/api/admin/articles/:id',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const { titleEn, titlePt, excerptEn, excerptPt, categoryId } = req.body;

        const updated = await prisma.article.update({
          where: { id },
          data: { titleEn, titlePt, excerptEn, excerptPt, categoryId },
          select: { id: true, titleEn: true, status: true },
        });

        logger.info('Admin article updated', { userId: req.userId, articleId: id });
        res.status(200).json({ success: true, data: updated });
      } catch (error) {
        logger.error('Error updating article', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to update article' });
      }
    }
  );

  // PUT /api/admin/articles/:id/status - Change article status
  router.put(
    '/api/admin/articles/:id/status',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const { status } = req.body;

        const updated = await prisma.article.update({
          where: { id },
          data: { status, publishedAt: status === 'PUBLISHED' ? new Date() : null },
          select: { id: true, status: true },
        });

        logger.info('Admin article status changed', { userId: req.userId, articleId: id, status });
        res.status(200).json({ success: true, data: updated });
      } catch (error) {
        logger.error('Error changing article status', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to change status' });
      }
    }
  );

  // POST /api/admin/articles/bulk - Bulk operations
  router.post(
    '/api/admin/articles/bulk',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { ids, action, categoryId } = req.body;

        if (action === 'delete') {
          await prisma.article.updateMany({
            where: { id: { in: ids } },
            data: { deletedAt: new Date() },
          });
        } else if (action === 'publish') {
          await prisma.article.updateMany({
            where: { id: { in: ids } },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
          });
        } else if (action === 'archive') {
          await prisma.article.updateMany({
            where: { id: { in: ids } },
            data: { status: 'ARCHIVED' },
          });
        } else if (action === 'category' && categoryId) {
          await prisma.article.updateMany({
            where: { id: { in: ids } },
            data: { categoryId },
          });
        }

        logger.info('Admin bulk articles operation', { userId: req.userId, action, count: ids.length });
        res.status(200).json({ success: true, message: `Bulk ${action} completed for ${ids.length} articles` });
      } catch (error) {
        logger.error('Error bulk articles operation', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Bulk operation failed' });
      }
    }
  );
}
