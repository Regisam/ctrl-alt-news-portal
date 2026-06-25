import { Router } from 'express';
import { analyticsService } from '../lib/analyticsService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

// AC2: Get live metrics
router.get('/live', authMiddleware, (_req, res) => {
  try {
    const metrics = analyticsService.getLiveMetrics();

    res.success({
      metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get live metrics', { error });
    res.error(500, 'Failed to get live metrics');
  }
});

// AC3: Get user activity
router.get('/users', authMiddleware, (_req, res) => {
  try {
    const metrics = analyticsService.getLiveMetrics();

    res.success({
      activeUsers: metrics.activeUsers,
      activeSessions: metrics.activeSession,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get user metrics', { error });
    res.error(500, 'Failed to get user metrics');
  }
});

// AC4: Get article metrics
router.get('/articles', authMiddleware, (_req, res) => {
  try {
    const metrics = analyticsService.getLiveMetrics();

    res.success({
      totalViews: metrics.articlesViewed,
      trending: metrics.articlesTrending,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get article metrics', { error });
    res.error(500, 'Failed to get article metrics');
  }
});

// AC5: Get performance metrics
router.get('/performance', authMiddleware, (_req, res) => {
  try {
    const metrics = analyticsService.getLiveMetrics();

    res.success({
      avgResponseTime: metrics.avgResponseTime,
      errorCount: metrics.errorCount,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error });
    res.error(500, 'Failed to get performance metrics');
  }
});

// AC6: Get email metrics
router.get('/emails', authMiddleware, (_req, res) => {
  try {
    const emailMetrics = analyticsService.getEmailMetrics();

    res.success({
      ...emailMetrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get email metrics', { error });
    res.error(500, 'Failed to get email metrics');
  }
});

// AC7: Get push metrics
router.get('/push', authMiddleware, (_req, res) => {
  try {
    const pushMetrics = analyticsService.getPushMetrics();

    res.success({
      ...pushMetrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get push metrics', { error });
    res.error(500, 'Failed to get push metrics');
  }
});

// AC8: Get search analytics
router.get('/search', authMiddleware, (_req, res) => {
  try {
    const searchMetrics = analyticsService.getSearchAnalytics();

    res.success({
      ...searchMetrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get search metrics', { error });
    res.error(500, 'Failed to get search metrics');
  }
});

// AC9: Get time-series data
router.get('/timeseries', authMiddleware, (_req, res) => {
  try {
    const timeSeries = analyticsService.getTimeSeries();

    res.success({
      data: timeSeries,
      count: timeSeries.length,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get time-series data', { error });
    res.error(500, 'Failed to get time-series data');
  }
});

// AC10: Get metrics by date range
router.get('/range', authMiddleware, (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.badRequest('start and end dates required');
    }

    const startDate = new Date(String(start));
    const endDate = new Date(String(end));

    const data = analyticsService.getMetricsForDateRange(startDate, endDate);

    res.success({
      data,
      count: data.length,
      startDate,
      endDate,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get range metrics', { error });
    res.error(500, 'Failed to get range metrics');
  }
});

// AC10: Get articles by category
router.get('/articles/:category', authMiddleware, (req, res) => {
  try {
    const { category } = req.params;

    const articles = analyticsService.getArticlesByCategory(category);

    res.success({
      category,
      articles,
      count: articles.length,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Failed to get articles by category', { error });
    res.error(500, 'Failed to get articles by category');
  }
});

// AC11: Export data as CSV
router.get('/export/csv', authMiddleware, (_req, res) => {
  try {
    const timeSeries = analyticsService.getTimeSeries();

    let csv = 'timestamp,users,articles,emails,push,errors\n';
    timeSeries.forEach((point) => {
      csv += `${point.timestamp.toISOString()},${point.users},${point.articles},${point.emails},${point.push},${point.errors}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    res.send(csv);
  } catch (error) {
    logger.error('Failed to export CSV', { error });
    res.error(500, 'Failed to export CSV');
  }
});

// AC11: Export data as JSON
router.get('/export/json', authMiddleware, (_req, res) => {
  try {
    const metrics = analyticsService.getLiveMetrics();
    const timeSeries = analyticsService.getTimeSeries();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.json"');
    res.json({
      exportDate: new Date(),
      metrics,
      timeSeries,
    });
  } catch (error) {
    logger.error('Failed to export JSON', { error });
    res.error(500, 'Failed to export JSON');
  }
});

// Track metrics (called by other services)
router.post('/track/article-view', (req, res) => {
  try {
    const { articleId, title, category } = req.body;

    analyticsService.trackArticleView(articleId, title, category);

    res.success({ message: 'Article view tracked' });
  } catch (error) {
    logger.error('Failed to track article view', { error });
    res.error(500, 'Failed to track article view');
  }
});

router.post('/track/email', (req, res) => {
  try {
    const { type } = req.body; // 'sent' | 'opened' | 'clicked'

    analyticsService.trackEmail(type);

    res.success({ message: 'Email tracked' });
  } catch (error) {
    logger.error('Failed to track email', { error });
    res.error(500, 'Failed to track email');
  }
});

router.post('/track/push', (req, res) => {
  try {
    const { type } = req.body; // 'sent' | 'clicked' | 'dismissed'

    analyticsService.trackPush(type);

    res.success({ message: 'Push tracked' });
  } catch (error) {
    logger.error('Failed to track push', { error });
    res.error(500, 'Failed to track push');
  }
});

export default router;
