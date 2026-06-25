import { Router } from 'express';
import { recommendationService } from '../lib/recommendationService.js';
import { logger } from '../logger.js';

const router = Router();

// AC2: Main unified endpoint
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const type = req.query.type as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const recommendations = type
      ? recommendationService.getByType(userId, type as any, limit)
      : recommendationService.getRecommendations(userId, undefined, limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      type: type || 'all',
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error('Failed to get recommendations', { error });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// AC3: Articles endpoint (merged from old systems)
router.get('/:userId/articles', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const recommendations = recommendationService.getByType(userId, 'article', limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      type: 'article',
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error('Failed to get article recommendations', { error });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// AC3: Topics endpoint
router.get('/:userId/topics', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const recommendations = recommendationService.getByType(userId, 'topic', limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      type: 'topic',
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error('Failed to get topic recommendations', { error });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// AC3: Users endpoint
router.get('/:userId/users', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const recommendations = recommendationService.getByType(userId, 'user', limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      type: 'user',
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error('Failed to get user recommendations', { error });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// AC5: Cache stats (for debugging)
router.get('/stats/cache', (_req, res) => {
  try {
    const stats = recommendationService.getCacheStats();

    res.json({
      timestamp: new Date().toISOString(),
      cacheStats: stats,
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AC6: Backward compatibility - old endpoints redirect with deprecation warning
router.get('/deprecated/topic-recommendations/:userId', (req, res) => {
  recommendationService.logDeprecation('/api/topic-recommendations');
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  res.status(301).redirect(`/api/recommendations/${userId}/topics?limit=${limit}`);
});

router.get('/deprecated/discovery/:userId', (req, res) => {
  recommendationService.logDeprecation('/api/discovery');
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  res.status(301).redirect(`/api/recommendations/${userId}/users?limit=${limit}`);
});

export default router;
