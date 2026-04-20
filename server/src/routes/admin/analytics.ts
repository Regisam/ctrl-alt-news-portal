import type { Router, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import logger from '../../logger';
import { verifyJWT, type AuthRequest } from '../../middleware/auth';
import { isAdmin } from '../../middleware/isAdmin';

export function setupAdminAnalyticsRoute(router: Router): void {
  // GET /api/admin/analytics/summary - KPI Summary
  router.get(
    '/api/admin/analytics/summary',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

        const viewsResult = await prisma.$queryRaw<any[]>`
          SELECT
            COALESCE(SUM(CASE WHEN "createdAt" >= ${today} THEN "viewCount" ELSE 0 END), 0) as today,
            COALESCE(SUM(CASE WHEN "createdAt" >= ${weekAgo} THEN "viewCount" ELSE 0 END), 0) as week,
            COALESCE(SUM(CASE WHEN "createdAt" >= ${monthAgo} THEN "viewCount" ELSE 0 END), 0) as month
          FROM "ArticleView" WHERE "deletedAt" IS NULL
        `;

        const commentsResult = await prisma.$queryRaw<any[]>`
          SELECT
            COALESCE(COUNT(CASE WHEN "createdAt" >= ${today} THEN 1 END), 0) as today,
            COALESCE(COUNT(CASE WHEN "createdAt" >= ${weekAgo} THEN 1 END), 0) as week,
            COALESCE(COUNT(CASE WHEN "createdAt" >= ${monthAgo} THEN 1 END), 0) as month
          FROM "Comment" WHERE "deletedAt" IS NULL
        `;

        const signupsResult = await prisma.$queryRaw<any[]>`
          SELECT
            COALESCE(COUNT(CASE WHEN "createdAt" >= ${today} THEN 1 END), 0) as today,
            COALESCE(COUNT(CASE WHEN "createdAt" >= ${weekAgo} THEN 1 END), 0) as week,
            COALESCE(COUNT(CASE WHEN "createdAt" >= ${monthAgo} THEN 1 END), 0) as month
          FROM "User" WHERE "deletedAt" IS NULL
        `;

        res.status(200).json({
          success: true,
          data: {
            views: viewsResult[0] || { today: 0, week: 0, month: 0 },
            comments: commentsResult[0] || { today: 0, week: 0, month: 0 },
            signups: signupsResult[0] || { today: 0, week: 0, month: 0 },
          },
        });
      } catch (error) {
        logger.error('Error fetching analytics summary', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch summary' });
      }
    }
  );

  // GET /api/admin/analytics/trending - Top articles
  router.get(
    '/api/admin/analytics/trending',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const window = (req.query.window as string) || '24h';
        const hours = window === '24h' ? 24 : window === '7d' ? 168 : 720;
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const trending = await prisma.article.findMany({
          where: {
            deletedAt: null,
            publishedAt: { gte: since },
          },
          select: {
            id: true,
            titleEn: true,
            slug: true,
            viewCount: true,
            _count: { select: { comments: true } },
          },
          orderBy: { viewCount: 'desc' },
          take: 10,
        });

        res.status(200).json({
          success: true,
          data: trending.map((a) => ({
            id: a.id,
            title: a.titleEn,
            slug: a.slug,
            views: a.viewCount,
            comments: a._count.comments,
          })),
        });
      } catch (error) {
        logger.error('Error fetching trending articles', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch trending' });
      }
    }
  );

  // GET /api/admin/analytics/by-category - Views by category
  router.get(
    '/api/admin/analytics/by-category',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const byCategory = await prisma.category.findMany({
          select: {
            nameEn: true,
            _count: { select: { articles: true } },
            articles: {
              where: { deletedAt: null },
              select: { viewCount: true },
            },
          },
        });

        const data = byCategory.map((cat) => ({
          category: cat.nameEn,
          articles: cat._count.articles,
          views: cat.articles.reduce((sum, a) => sum + a.viewCount, 0),
        }));

        res.status(200).json({
          success: true,
          data,
        });
      } catch (error) {
        logger.error('Error fetching category analytics', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch category data' });
      }
    }
  );

  // GET /api/admin/analytics/user-growth - Signups over time
  router.get(
    '/api/admin/analytics/user-growth',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const growth = await prisma.$queryRaw<any[]>`
          SELECT
            DATE("createdAt") as date,
            COUNT(*) as signups
          FROM "User"
          WHERE "deletedAt" IS NULL AND "createdAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("createdAt")
          ORDER BY DATE("createdAt") ASC
        `;

        res.status(200).json({
          success: true,
          data: (growth || []).map((row) => ({
            date: new Date(row.date).toLocaleDateString(),
            signups: Number(row.signups),
          })),
        });
      } catch (error) {
        logger.error('Error fetching user growth', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch user growth' });
      }
    }
  );

  // GET /api/admin/analytics/time-series - Views + Comments over time
  router.get(
    '/api/admin/analytics/time-series',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const timeSeries = await prisma.$queryRaw<any[]>`
          SELECT
            DATE(a."publishedAt") as date,
            COALESCE(SUM(a."viewCount"), 0) as views,
            COALESCE(COUNT(c.id), 0) as comments
          FROM "Article" a
          LEFT JOIN "Comment" c ON c."articleId" = a.id AND c."deletedAt" IS NULL
          WHERE a."deletedAt" IS NULL AND a."publishedAt" IS NOT NULL AND a."publishedAt" >= ${thirtyDaysAgo}
          GROUP BY DATE(a."publishedAt")
          ORDER BY DATE(a."publishedAt") ASC
        `;

        res.status(200).json({
          success: true,
          data: (timeSeries || []).map((row) => ({
            date: new Date(row.date).toLocaleDateString(),
            views: Number(row.views),
            comments: Number(row.comments),
          })),
        });
      } catch (error) {
        logger.error('Error fetching time series', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch time series' });
      }
    }
  );

  // GET /api/admin/analytics/comment-heatmap - Comments by hour
  router.get(
    '/api/admin/analytics/comment-heatmap',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const heatmap = await prisma.$queryRaw<any[]>`
          SELECT
            EXTRACT(DOW FROM "createdAt") as dayOfWeek,
            EXTRACT(HOUR FROM "createdAt") as hour,
            COUNT(*) as count
          FROM "Comment"
          WHERE "deletedAt" IS NULL AND "createdAt" >= ${sevenDaysAgo}
          GROUP BY EXTRACT(DOW FROM "createdAt"), EXTRACT(HOUR FROM "createdAt")
        `;

        res.status(200).json({
          success: true,
          data: (heatmap || []).map((row) => ({
            day: Number(row.dayOfWeek),
            hour: Number(row.hour),
            count: Number(row.count),
          })),
        });
      } catch (error) {
        logger.error('Error fetching comment heatmap', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to fetch heatmap' });
      }
    }
  );

  // GET /api/admin/analytics/export - CSV export
  router.get(
    '/api/admin/analytics/export',
    verifyJWT,
    isAdmin,
    async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const articles = await prisma.article.findMany({
          where: { deletedAt: null },
          select: {
            id: true,
            titleEn: true,
            status: true,
            viewCount: true,
            publishedAt: true,
            author: { select: { fullName: true } },
            category: { select: { nameEn: true } },
            _count: { select: { comments: true } },
          },
          orderBy: { viewCount: 'desc' },
        });

        const csv = [
          'ID,Title,Status,Views,Comments,Category,Author,Published',
          ...articles.map((a) =>
            [
              a.id,
              `"${a.titleEn}"`,
              a.status,
              a.viewCount,
              a._count.comments,
              a.category.nameEn,
              a.author.fullName || 'Unknown',
              a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : 'N/A',
            ].join(',')
          ),
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
      } catch (error) {
        logger.error('Error exporting analytics', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ success: false, error: 'Failed to export data' });
      }
    }
  );
}
