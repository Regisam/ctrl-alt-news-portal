import { Router } from 'express';
import { loadTestRunner } from '../lib/loadTestRunner.js';
import { logger } from '../logger.js';

const router = Router();

// AC1 & AC2: Run load test
router.post('/run', async (req, res) => {
  try {
    const { scenario, rps, duration, concurrentUsers } = req.body;

    if (!scenario || !rps || !duration) {
      return res.status(400).json({ error: 'scenario, rps, duration required' });
    }

    const validScenarios = ['login', 'read', 'create', 'search'];
    if (!validScenarios.includes(scenario)) {
      return res.status(400).json({ error: `Invalid scenario: ${validScenarios.join(', ')}` });
    }

    const result = await loadTestRunner.runTest(scenario, {
      rps,
      duration,
      concurrentUsers: concurrentUsers || rps,
    });

    res.json({
      message: 'Load test completed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Load test failed', { error });
    res.status(500).json({ error: 'Load test failed' });
  }
});

// AC10: Get load test results
router.get('/results', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const results = loadTestRunner.getResults(limit);

    res.json({
      timestamp: new Date().toISOString(),
      count: results.length,
      results,
    });
  } catch (error) {
    logger.error('Failed to get results', { error });
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// AC11: Get load test statistics
router.get('/stats', (_req, res) => {
  try {
    const stats = loadTestRunner.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AC8: Get capacity forecast
router.get('/forecast', (req, res) => {
  try {
    const months = Math.min(parseInt(req.query.months as string) || 6, 24);
    const forecast = loadTestRunner.forecastCapacity(months);

    res.json({
      timestamp: new Date().toISOString(),
      months,
      forecast,
    });
  } catch (error) {
    logger.error('Failed to generate forecast', { error });
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

export default router;
