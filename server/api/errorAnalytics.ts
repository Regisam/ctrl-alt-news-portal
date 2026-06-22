import { Router } from 'express';
import { errorAggregator } from '../lib/errorAggregator.js';
import { logger } from '../logger.js';

const router = Router();

// AC7: Error dashboard data
router.get('/errors', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500);
    const severity = req.query.severity as string;

    let errors = errorAggregator.getErrors(limit);

    // Filter by severity
    if (severity) {
      errors = errors.filter((e) => e.severity === severity);
    }

    res.json({
      timestamp: new Date().toISOString(),
      count: errors.length,
      errors: errors.map((e) => ({
        fingerprint: e.fingerprint,
        type: e.type,
        message: e.message,
        severity: e.severity,
        count: e.count,
        firstSeen: e.firstSeen,
        lastSeen: e.lastSeen,
        affectedUsers: e.users.size,
        recentRequests: e.recentRequests,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch errors', { error });
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
});

// AC11: Search errors by pattern
router.get('/search', (req, res) => {
  try {
    const pattern = req.query.pattern as string;

    if (!pattern) {
      return res.status(400).json({ error: 'pattern required' });
    }

    const results = errorAggregator.searchErrors(pattern);

    res.json({
      timestamp: new Date().toISOString(),
      pattern,
      count: results.length,
      errors: results.slice(0, 50).map((e) => ({
        fingerprint: e.fingerprint,
        type: e.type,
        message: e.message,
        severity: e.severity,
        count: e.count,
        affectedUsers: e.users.size,
      })),
    });
  } catch (error) {
    logger.error('Error search failed', { error });
    res.status(500).json({ error: 'Search failed' });
  }
});

// AC7: Error statistics
router.get('/stats', (_req, res) => {
  try {
    const stats = errorAggregator.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      ...stats,
    });
  } catch (error) {
    logger.error('Failed to get error stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AC8: Export errors as JSON
router.get('/export/json', (_req, res) => {
  try {
    const json = errorAggregator.exportAsJSON();

    res.set('Content-Type', 'application/json');
    res.set('Content-Disposition', 'attachment; filename="errors.json"');
    res.send(json);
  } catch (error) {
    logger.error('JSON export failed', { error });
    res.status(500).json({ error: 'Export failed' });
  }
});

// AC8: Export errors as CSV
router.get('/export/csv', (_req, res) => {
  try {
    const csv = errorAggregator.exportAsCSV();

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="errors.csv"');
    res.send(csv);
  } catch (error) {
    logger.error('CSV export failed', { error });
    res.status(500).json({ error: 'Export failed' });
  }
});

// AC10: Get error details with replay data
router.get('/error/:fingerprint', (req, res) => {
  try {
    const { fingerprint } = req.params;
    const errors = errorAggregator.getErrors(1000);
    const error = errors.find((e) => e.fingerprint === fingerprint);

    if (!error) {
      return res.status(404).json({ error: 'Error not found' });
    }

    res.json({
      timestamp: new Date().toISOString(),
      error: {
        fingerprint: error.fingerprint,
        type: error.type,
        message: error.message,
        signature: error.signature,
        severity: error.severity,
        count: error.count,
        firstSeen: error.firstSeen,
        lastSeen: error.lastSeen,
        affectedUsers: error.users.size,
        users: Array.from(error.users),
        recentRequests: error.recentRequests,
      },
    });
  } catch (error) {
    logger.error('Failed to get error details', { error });
    res.status(500).json({ error: 'Failed to get details' });
  }
});

export default router;
