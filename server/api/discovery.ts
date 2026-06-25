import { Router } from 'express';
import { discoveryManager } from '../lib/discoveryManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Get recommendations
router.get('/recommendations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const recommendations = discoveryManager.getRecommendations(userId, limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error('Failed to get recommendations', { error });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// AC2: Interest-based discovery
router.get('/by-interests', (req, res) => {
  try {
    const interests = (req.query.tags as string)?.split(',') || [];
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (interests.length === 0) {
      return res.status(400).json({ error: 'At least one interest tag required' });
    }

    const results = discoveryManager.getByInterests(interests, limit);

    res.json({
      timestamp: new Date().toISOString(),
      interests,
      count: results.length,
      results,
    });
  } catch (error) {
    logger.error('Failed to discover by interests', { error });
    res.status(500).json({ error: 'Failed to discover' });
  }
});

// AC4: Trending creators
router.get('/trending', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const trending = discoveryManager.getTrendingCreators(limit);

    res.json({
      timestamp: new Date().toISOString(),
      count: trending.length,
      trending,
    });
  } catch (error) {
    logger.error('Failed to get trending', { error });
    res.status(500).json({ error: 'Failed to get trending' });
  }
});

// AC5: New creators
router.get('/new', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const newCreators = discoveryManager.getNewCreators(limit);

    res.json({
      timestamp: new Date().toISOString(),
      count: newCreators.length,
      newCreators,
    });
  } catch (error) {
    logger.error('Failed to get new creators', { error });
    res.status(500).json({ error: 'Failed to get new creators' });
  }
});

// AC6: Similar users
router.get('/similar/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const similar = discoveryManager.getSimilarUsers(userId, limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: similar.length,
      similar,
    });
  } catch (error) {
    logger.error('Failed to get similar users', { error });
    res.status(500).json({ error: 'Failed to get similar users' });
  }
});

// AC8: Track discovery view
router.post('/track/:userId/:discoveredUserId', (req, res) => {
  try {
    const { userId, discoveredUserId } = req.params;

    discoveryManager.trackDiscoveryView(userId, discoveredUserId);

    res.json({
      message: 'Discovery view tracked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to track view', { error });
    res.status(500).json({ error: 'Failed to track' });
  }
});

// Get discovery stats
router.get('/stats', (_req, res) => {
  try {
    const stats = discoveryManager.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
