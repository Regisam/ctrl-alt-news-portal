import { Router } from 'express';
import { searchManager } from '../lib/searchManager.js';
import { cacheManager } from '../lib/cacheManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC7: Search endpoint
router.get('/articles', async (req, res) => {
  try {
    const { q, category, author, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    // AC11: Validate query
    if (!q) {
      return res.badRequest('Search query (q) is required');
    }

    const validation = searchManager.validateQuery(String(q));
    if (!validation.valid) {
      return res.badRequest(validation.error || 'Invalid search query');
    }

    // AC9: Check cache
    const cacheKey = `search:${q}:${category || ''}:${author || ''}:${page}`;
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      return res.success(cached);
    }

    // AC8: Perform search
    const results = await searchManager.search({
      query: String(q),
      category: category ? String(category) : undefined,
      author: author ? String(author) : undefined,
      dateFrom: dateFrom ? new Date(String(dateFrom)) : undefined,
      dateTo: dateTo ? new Date(String(dateTo)) : undefined,
      limit: Math.min(parseInt(String(limit)) || 20, 100),
      offset: ((parseInt(String(page)) || 1) - 1) * Math.min(parseInt(String(limit)) || 20, 100),
    });

    // AC9: Cache results (5 minutes)
    cacheManager.set(cacheKey, results, {
      ttl: 300,
      tags: ['search', `search:${q}`],
    });

    res.success(results);
  } catch (error) {
    logger.error('Search failed', { error });
    res.error(500, 'Search failed');
  }
});

// AC6: Autocomplete suggestions
router.get('/suggestions', (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q) {
      return res.badRequest('Query (q) is required');
    }

    // Check cache
    const cacheKey = `autocomplete:${q}:${limit}`;
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      return res.success(cached);
    }

    // Get suggestions
    const suggestions = searchManager.getAutocompleteSuggestions(
      String(q),
      Math.min(parseInt(String(limit)) || 5, 10)
    );

    // Cache suggestions (10 minutes)
    cacheManager.set(cacheKey, { suggestions }, {
      ttl: 600,
      tags: ['autocomplete'],
    });

    res.success({ suggestions });
  } catch (error) {
    logger.error('Autocomplete failed', { error });
    res.error(500, 'Autocomplete failed');
  }
});

// AC10: Search statistics
router.get('/stats', (_req, res) => {
  try {
    const stats = searchManager.getSearchStats();

    res.success({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get search stats', { error });
    res.error(500, 'Failed to get stats');
  }
});

// AC5: Get search filters (categories, authors, etc)
router.get('/filters', (_req, res) => {
  try {
    // In production: query from database
    // SELECT DISTINCT category FROM articles WHERE published = true
    // SELECT DISTINCT author FROM articles WHERE published = true

    const filters = {
      categories: ['Technology', 'AI', 'Science', 'Robotics', 'Gadgets'],
      authors: ['Alice Johnson', 'Bob Smith', 'Carol Davis'],
      dateRanges: [
        { label: 'Last 24 hours', days: 1 },
        { label: 'Last week', days: 7 },
        { label: 'Last month', days: 30 },
        { label: 'Last year', days: 365 },
      ],
    };

    res.success({ filters });
  } catch (error) {
    logger.error('Failed to get filters', { error });
    res.error(500, 'Failed to get filters');
  }
});

export default router;
