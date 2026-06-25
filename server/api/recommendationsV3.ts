import { Router } from 'express';
import { recommendationEngine } from '../lib/recommendationEngine.js';
import { authMiddleware } from '../middleware/auth.js';
import { cacheManager } from '../lib/cacheManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC4: Get personalized recommendations
router.get('/personalized', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { limit = 5 } = req.query;

    // AC8: Check cache
    const cacheKey = `recommendations:${userId}:${limit}`;
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      return res.success(cached);
    }

    // AC4: Generate recommendations
    const recommendations = recommendationEngine.getRecommendations(
      userId,
      Math.min(parseInt(String(limit)) || 5, 20)
    );

    // AC8: Cache for 10 minutes
    cacheManager.set(cacheKey, { recommendations }, {
      ttl: 600,
      tags: ['recommendations', `user:${userId}`],
    });

    res.success({ recommendations });
  } catch (error) {
    logger.error('Failed to get recommendations', { error });
    res.error(500, 'Failed to get recommendations');
  }
});

// AC1: Track article read
router.post('/track/read/:articleId', authMiddleware, (req, res) => {
  try {
    const userId = req.user!.userId;
    const { articleId } = req.params;
    const { category = 'General' } = req.body;

    // AC1: Track read
    recommendationEngine.trackArticleRead(userId, articleId, String(category));

    // AC5: Invalidate cache
    cacheManager.invalidateByTag(`user:${userId}`);

    res.success({ message: 'Read tracked' });
  } catch (error) {
    logger.error('Failed to track read', { error });
    res.error(500, 'Failed to track read');
  }
});

// AC1: Track user interest
router.post('/track/interest', authMiddleware, (req, res) => {
  try {
    const userId = req.user!.userId;
    const { category, weight = 1 } = req.body;

    if (!category) {
      return res.badRequest('Category is required');
    }

    // AC1: Track interest
    recommendationEngine.trackUserInterest(userId, String(category), Number(weight));

    // AC5: Invalidate cache
    cacheManager.invalidateByTag(`user:${userId}`);

    res.success({ message: 'Interest tracked' });
  } catch (error) {
    logger.error('Failed to track interest', { error });
    res.error(500, 'Failed to track interest');
  }
});

// AC10: Track recommendation click
router.post('/track/click/:articleId', authMiddleware, (req, res) => {
  try {
    const userId = req.user!.userId;
    const { articleId } = req.params;

    // AC10: Track click
    recommendationEngine.trackRecommendationClick(userId, articleId);

    res.success({ message: 'Click tracked' });
  } catch (error) {
    logger.error('Failed to track click', { error });
    res.error(500, 'Failed to track click');
  }
});

// AC10: Get metrics
router.get('/metrics', authMiddleware, (_req, res) => {
  try {
    const metrics = recommendationEngine.getMetrics();
    res.success({ metrics });
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.error(500, 'Failed to get metrics');
  }
});

// AC9: Performance test
router.get('/performance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { duration } = await recommendationEngine.measurePerformance(userId);

    if (duration > 100) {
      logger.warn('Slow recommendation', { userId, durationMs: duration });
    }

    res.success({ durationMs: duration, target: '< 100ms', passed: duration < 100 });
  } catch (error) {
    logger.error('Failed to measure performance', { error });
    res.error(500, 'Failed to measure performance');
  }
});

// Get user preferences
router.get('/preferences', authMiddleware, (_req, res) => {
  try {
    const userId = _req.user!.userId;
    const prefs = recommendationEngine.getUserPreferences(userId);

    if (!prefs) {
      return res.success({ preferences: { interests: {}, readCount: 0 } });
    }

    res.success({
      preferences: {
        interests: Object.fromEntries(prefs.interests),
        readCount: prefs.readArticles.size,
        lastUpdated: prefs.lastUpdated,
      },
    });
  } catch (error) {
    logger.error('Failed to get preferences', { error });
    res.error(500, 'Failed to get preferences');
  }
});

export default router;
