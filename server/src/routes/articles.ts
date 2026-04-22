import type { Router, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import { cacheService } from '../services/cache';
import { CacheInvalidationManager } from '../services/cache-invalidation';

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

      // Fetch from database with eager loading (performance optimization via composite indexes)
      const articles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
        },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          category: { select: { id: true, nameEn: true, namePt: true, colorHex: true } },
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
          publishedAt: a.publishedAt,
          author: a.author,
          category: a.category,
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
            where: { deletedAt: null, status: 'APPROVED' },
            include: {
              author: { select: { id: true, fullName: true, avatarUrl: true } },
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

  // GET /api/categories - Categories with caching
  router.get('/api/categories', async (_req, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const cacheKey = 'categories:all';

      const cached = await cacheService.get<any>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached, _cache: 'HIT' });
        return;
      }

      const categories = await prisma.category.findMany({
        select: { id: true, nameEn: true, namePt: true, slug: true },
        orderBy: { nameEn: 'asc' },
      });

      await cacheService.set(cacheKey, categories, 3600);

      res.status(200).json({ success: true, data: categories, _cache: 'MISS' });
    } catch (error) {
      logger.error('Error fetching categories', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
  });

  // GET /api/search - Full-text search with caching
  router.get('/api/search', async (req, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const query = (req.query.q as string) || '';
      if (!query || query.length < 2) {
        res.status(400).json({ success: false, error: 'Query too short' });
        return;
      }

      const cacheKey = `search:${query.toLowerCase()}`;

      const cached = await cacheService.get<any>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached, _cache: 'HIT' });
        return;
      }

      const results = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          OR: [
            { titleEn: { contains: query, mode: 'insensitive' } },
            { titlePt: { contains: query, mode: 'insensitive' } },
            { excerptEn: { contains: query, mode: 'insensitive' } },
            { excerptPt: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          titleEn: true,
          slug: true,
          excerptEn: true,
          publishedAt: true,
        },
        take: 10,
      });

      await cacheService.set(cacheKey, results, 300);

      res.status(200).json({ success: true, data: { results, count: results.length }, _cache: 'MISS' });
    } catch (error) {
      logger.error('Error searching articles', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'Search failed' });
    }
  });

  // GET /api/articles/:id/comments - Comments for article with caching
  router.get('/api/articles/:id/comments', async (req, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const cacheKey = `comments:article:${id}`;

      const cached = await cacheService.get<any>(cacheKey);
      if (cached) {
        res.status(200).json({ success: true, data: cached, _cache: 'HIT' });
        return;
      }

      const comments = await prisma.comment.findMany({
        where: { articleId: id, deletedAt: null },
        select: {
          id: true,
          content: true,
          authorId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      await cacheService.set(cacheKey, comments, 120);

      res.status(200).json({ success: true, data: comments, _cache: 'MISS' });
    } catch (error) {
      logger.error('Error fetching comments', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'Failed to fetch comments' });
    }
  });

  // POST /api/articles/:id/comments - Add comment (invalidates cache)
  router.post('/api/articles/:id/comments', async (req, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { content, authorId } = req.body;

      if (!content || !authorId) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          content,
          articleId: id,
          authorId,
        },
        select: { id: true, content: true, createdAt: true },
      });

      // Invalidate caches
      await CacheInvalidationManager.invalidateComments(id);
      await CacheInvalidationManager.invalidateSearch();

      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      logger.error('Error creating comment', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ success: false, error: 'Failed to create comment' });
    }
  });

  // GET /api/cache/health - Cache health check endpoint
  router.get('/api/cache/health', async (_req, res: Response, _next: NextFunction): Promise<void> => {
    const health = await cacheService.health();
    const metrics = cacheService.getMetrics();
    res.status(health.status === 'ok' ? 200 : 503).json({
      success: health.status === 'ok',
      health,
      metrics,
    });
  });
}
