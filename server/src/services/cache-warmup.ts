import { prisma } from '../prisma';
import { cacheService } from './cache';
import logger from '../logger';

/**
 * Warm up the cache with frequently accessed data on server startup
 * Loads:
 * - Top 100 articles (by views)
 * - All categories
 * Helps achieve >= 80% cache hit ratio after startup
 */
export async function warmupCache(): Promise<void> {
  try {
    logger.info('Starting cache warm-up...');
    const startTime = Date.now();

    // Load top 100 articles by views
    const topArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        category: { select: { id: true, nameEn: true, namePt: true, colorHex: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 100,
    });

    // Load all categories
    const categories = await prisma.category.findMany({
      select: { id: true, nameEn: true, namePt: true, slug: true },
      orderBy: { nameEn: 'asc' },
    });

    // Prepare cache data
    const cacheData: Record<string, { value: any; ttl: number }> = {};

    // Cache articles list
    cacheData['articles:list:all'] = {
      value: {
        articles: topArticles.map((a) => ({
          id: a.id,
          title: a.titleEn,
          excerpt: a.excerptEn,
          slug: a.slug,
          views: a.viewCount,
          publishedAt: a.publishedAt,
          author: a.author,
          category: a.category,
        })),
        count: topArticles.length,
      },
      ttl: 300, // 5 minutes
    };

    // Cache individual articles
    topArticles.forEach((article) => {
      cacheData[`article:${article.id}`] = {
        value: {
          id: article.id,
          titleEn: article.titleEn,
          titlePt: article.titlePt,
          excerptEn: article.excerptEn,
          excerptPt: article.excerptPt,
          contentEn: article.contentEn,
          contentPt: article.contentPt,
          slug: article.slug,
          views: article.viewCount,
          publishedAt: article.publishedAt,
          author: article.author,
          category: article.category,
        },
        ttl: 3600, // 1 hour
      };
    });

    // Cache all categories
    cacheData['categories:all'] = {
      value: categories,
      ttl: 86400, // 24 hours
    };

    // Warm up the cache
    await cacheService.warmup(cacheData);

    const duration = Date.now() - startTime;
    logger.info(`Cache warm-up complete in ${duration}ms. Loaded ${Object.keys(cacheData).length} cache entries.`);
  } catch (error) {
    logger.error('Cache warm-up failed:', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - warm-up is optional, server can still start
  }
}
