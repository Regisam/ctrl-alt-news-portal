import { Router } from 'express';
import { contentMetrics } from '../lib/contentMetrics.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Record content interaction
router.post('/track', (req, res) => {
  try {
    const { articleId, title, author, category, eventType, data } = req.body;

    if (!articleId || !eventType) {
      return res.status(400).json({ error: 'articleId and eventType required' });
    }

    contentMetrics.recordInteraction(
      articleId,
      title || 'Unknown',
      author || 'Unknown',
      category || 'General',
      eventType,
      data
    );

    res.json({
      message: 'Content interaction tracked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to track content interaction', { error });
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// AC3: Get popular articles
router.get('/popular', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const articles = contentMetrics.getPopularArticles(limit);

    res.json({
      timestamp: new Date().toISOString(),
      count: articles.length,
      articles,
    });
  } catch (error) {
    logger.error('Failed to get popular articles', { error });
    res.status(500).json({ error: 'Failed to get popular articles' });
  }
});

// AC4: Get trending articles
router.get('/trending', (req, res) => {
  try {
    const hours = Math.min(parseInt(req.query.hours as string) || 24, 168); // Max 1 week
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const articles = contentMetrics.getTrendingArticles(hours, limit);

    res.json({
      timestamp: new Date().toISOString(),
      window: { hours },
      count: articles.length,
      articles,
    });
  } catch (error) {
    logger.error('Failed to get trending articles', { error });
    res.status(500).json({ error: 'Failed to get trending articles' });
  }
});

// AC5: Get category performance
router.get('/categories', (_req, res) => {
  try {
    const categories = contentMetrics.getCategoryPerformance();

    res.json({
      timestamp: new Date().toISOString(),
      categories,
    });
  } catch (error) {
    logger.error('Failed to get category performance', { error });
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// AC6: Get author performance
router.get('/authors', (_req, res) => {
  try {
    const authors = contentMetrics.getAuthorPerformance();

    res.json({
      timestamp: new Date().toISOString(),
      authors,
    });
  } catch (error) {
    logger.error('Failed to get author performance', { error });
    res.status(500).json({ error: 'Failed to get authors' });
  }
});

// AC2: Get engagement scores
router.get('/engagement/:articleId', (req, res) => {
  try {
    const { articleId } = req.params;
    const score = contentMetrics.calculateEngagementScore(articleId);

    res.json({
      timestamp: new Date().toISOString(),
      engagement: score,
    });
  } catch (error) {
    logger.error('Failed to get engagement score', { error });
    res.status(500).json({ error: 'Failed to get engagement' });
  }
});

// AC8: Compare articles
router.post('/compare', (req, res) => {
  try {
    const { articleIds } = req.body;

    if (!Array.isArray(articleIds) || articleIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 articleIds required' });
    }

    const comparison = contentMetrics.compareArticles(articleIds);

    res.json({
      timestamp: new Date().toISOString(),
      comparison,
    });
  } catch (error) {
    logger.error('Failed to compare articles', { error });
    res.status(500).json({ error: 'Failed to compare articles' });
  }
});

// AC1: Get article metrics
router.get('/article/:articleId', (req, res) => {
  try {
    const { articleId } = req.params;
    const metrics = contentMetrics.getArticleMetrics(articleId);

    if (!metrics) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    logger.error('Failed to get article metrics', { error });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

export default router;
