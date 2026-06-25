import { Router } from 'express';
import { reputationManager } from '../lib/reputationManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC2: Add reputation points
router.post('/:userId/points', (req, res) => {
  try {
    const { userId } = req.params;
    const { points, action } = req.body;

    if (!points || !action) {
      return res.status(400).json({ error: 'points and action required' });
    }

    const reputation = reputationManager.addPoints(userId, points, action);

    res.json({
      message: 'Points added',
      reputation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to add points', { error });
    res.status(500).json({ error: 'Failed to add points' });
  }
});

// AC6: Get reputation
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const reputation = reputationManager.getReputation(userId);

    res.json({
      timestamp: new Date().toISOString(),
      reputation,
    });
  } catch (error) {
    logger.error('Failed to get reputation', { error });
    res.status(500).json({ error: 'Failed to get reputation' });
  }
});

// AC4: Get leaderboard
router.get('/leaderboard/top', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const leaderboard = reputationManager.getLeaderboard(limit);

    res.json({
      timestamp: new Date().toISOString(),
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error });
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// AC7: Get reputation history
router.get('/:userId/history', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const history = reputationManager.getHistory(userId, limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: history.length,
      history,
    });
  } catch (error) {
    logger.error('Failed to get history', { error });
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// AC9: Apply decay
router.post('/:userId/decay', (req, res) => {
  try {
    const { userId } = req.params;
    const { decayPercent } = req.body;

    const reputation = reputationManager.applyDecay(userId, decayPercent || 5);

    res.json({
      message: 'Decay applied',
      reputation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to apply decay', { error });
    res.status(500).json({ error: 'Failed to apply decay' });
  }
});

// AC11: Get reputation statistics
router.get('/stats', (_req, res) => {
  try {
    const stats = reputationManager.getStats();

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
