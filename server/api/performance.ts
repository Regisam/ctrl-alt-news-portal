import { Router } from 'express';
import { responseCache } from '../lib/responseCache.js';
import { logger } from '../logger.js';

const router = Router();

// AC9: Get performance metrics (cache stats + response times)
router.get('/metrics', (_req, res) => {
  try {
    const cacheStats = responseCache.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      cache: {
        entries: cacheStats.entries,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        sizeKB: Math.round(cacheStats.size / 1024),
      },
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// AC10: Get caching strategy documentation
router.get('/caching-strategy', (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    strategy: {
      assets: {
        ttl: '1 year',
        cacheControl: 'public, max-age=31536000, immutable',
        description: 'Static assets (JS, CSS, fonts) are versioned and immutable',
      },
      api: {
        ttl: '5 minutes',
        cacheControl: 'public, max-age=300',
        description: 'API endpoints cached for 5 minutes, invalidated on mutations',
        onMutation: 'POST/PUT/DELETE clears relevant cache entries',
      },
      html: {
        ttl: '0 (always revalidate)',
        cacheControl: 'public, max-age=0, must-revalidate',
        description: 'HTML never cached (always check freshness with ETag)',
      },
    },
    etag: {
      enabled: true,
      description: 'ETag provides cache validation (304 Not Modified)',
      usage: 'Clients send If-None-Match header',
    },
    invalidation: {
      pattern: 'Cache key patterns can be invalidated',
      examples: [
        '/api/articles/* on article update',
        '/api/users/* on user update',
      ],
    },
  });
});

// AC4: Manually invalidate cache (admin only)
router.post('/cache/invalidate', (req, res) => {
  try {
    const { pattern } = req.body;

    if (!pattern) {
      return res.status(400).json({ error: 'pattern required' });
    }

    const count = responseCache.invalidate(pattern);

    res.json({
      message: 'Cache invalidated',
      pattern,
      entriesCleared: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache invalidation failed', { error });
    res.status(500).json({ error: 'Invalidation failed' });
  }
});

// AC4: Clear all cache (admin only)
router.post('/cache/clear', (_req, res) => {
  try {
    responseCache.clear();

    res.json({
      message: 'Cache cleared',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache clear failed', { error });
    res.status(500).json({ error: 'Clear failed' });
  }
});

export default router;
