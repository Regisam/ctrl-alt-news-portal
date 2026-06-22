import { Router } from 'express';
import {
  getRateLimitStats,
  resetRateLimit,
  resetAllRateLimits,
  getRateLimitStore,
} from '../middleware/rateLimiter.js';
import { logger } from '../logger.js';

const router = Router();

// AC11: Admin endpoint to view rate limit stats
router.get('/stats', (_req, res) => {
  const stats = getRateLimitStats();
  res.json({
    timestamp: new Date().toISOString(),
    stats,
    message: 'Rate limit store statistics',
  });
});

// AC11: Admin endpoint to reset individual rate limit
router.post('/reset/:clientId', (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId required' });
  }

  try {
    resetRateLimit(decodeURIComponent(clientId));
    res.json({
      message: 'Rate limit reset',
      clientId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to reset rate limit', { clientId, error });
    res.status(500).json({ error: 'Failed to reset rate limit' });
  }
});

// AC11: Admin endpoint to reset all rate limits
router.post('/reset-all', (_req, res) => {
  try {
    resetAllRateLimits();
    res.json({
      message: 'All rate limits reset',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to reset all rate limits', { error });
    res.status(500).json({ error: 'Failed to reset all rate limits' });
  }
});

// AC11: View current rate limits for a client (debug endpoint)
router.get('/check/:clientId', (req, res) => {
  const { clientId } = req.params;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId required' });
  }

  try {
    const store = getRateLimitStore();
    const resetTime = store.getResetTime(decodeURIComponent(clientId));

    res.json({
      clientId,
      resetTime: new Date(resetTime).toISOString(),
      secondsUntilReset: Math.ceil((resetTime - Date.now()) / 1000),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to check rate limit', { clientId, error });
    res.status(500).json({ error: 'Failed to check rate limit' });
  }
});

export default router;
