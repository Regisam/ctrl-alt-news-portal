import type { Router, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { cacheService } from '../services/cache';

export function setupArticlesRoute(router: Router): void {
  // GET /api/articles - Public article list with caching
  router.get('/api/articles', async (_req, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const cacheKey = 'articles:list:all';

      // Try cache first
      const cached = await cacheService.get<any>(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached,
          _cache: 'HIT',
        });
        return;
      }

      // Fetch from database
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
        },
        select: {
          id: true,
          titleEn: true,
          titlePt: true,
          slug: true,
          excerptEn: true,
          excerptPt: true,
          viewCount: true,
          publishedAt: true,
          createdAt: true,
          authorId: true,
          categoryId: true,
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
      });

      const data = {
        articles: articles.map((a) => ({
          id: a.id,
          title: a.titleEn,
          excerpt: a.excerptEn,
          slug: a.slug,
          views: a.viewCount,
          authorId: a.authorId,
          categoryId: a.categoryId,
          publishedAt: a.publishedAt,
        })),
        count: articles.length,
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, data, 300);

      res.status(200).json({
        success: true,
        data,
        _cache: 'MISS',
      });
    } catch (error) {
      logger.error('Error fetching articles', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
  });

  // GET /api/articles/:id - Article detail (minimal cache, 1 min)
  router.get('/api/articles/:id', async (req, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const cacheKey = `article:${id}`;

      const cached = await cacheService.get<any>(cacheKey);
      if (cached) {
        res.status(200).json({
          success: true,
          data: cached,
          _cache: 'HIT',
        });
        return;
      }

      const article = await prisma.article.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, fullName: true, email: true } },
          category: { select: { id: true, nameEn: true, namePt: true } },
          comments: {
            where: { deletedAt: null },
            select: {
              id: true,
              content: true,
              authorId: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!article) {
        res.status(404).json({ success: false, error: 'Article not found' });
        return;
      }

      await cacheService.set(cacheKey, article, 60);

      res.status(200).json({
        success: true,
        data: article,
        _cache: 'MISS',
      });
    } catch (error) {
      logger.error('Error fetching article', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'Failed to fetch article' });
    }
  });
}
