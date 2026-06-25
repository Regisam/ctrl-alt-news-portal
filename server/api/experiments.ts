import { Router } from 'express';
import { experimentService } from '../lib/experimentService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Create experiment
router.post('/create', authMiddleware, (req, res) => {
  try {
    const experiment = req.body;

    experimentService.createExperiment(experiment);

    res.success({ message: 'Experiment created', experimentId: experiment.id });
  } catch (error) {
    logger.error('Failed to create experiment', { error });
    res.error(500, 'Failed to create experiment');
  }
});

// AC1: List experiments
router.get('/', authMiddleware, (_req, res) => {
  try {
    const experiments = experimentService.listExperiments();

    res.success({ experiments, count: experiments.length });
  } catch (error) {
    logger.error('Failed to list experiments', { error });
    res.error(500, 'Failed to list experiments');
  }
});

// AC1: Get experiment
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const experiment = experimentService.getExperiment(id);

    if (!experiment) {
      return res.notFound('Experiment not found');
    }

    res.success({ experiment });
  } catch (error) {
    logger.error('Failed to get experiment', { error });
    res.error(500, 'Failed to get experiment');
  }
});

// AC1: Update experiment
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = experimentService.updateExperiment(id, updates);

    if (!success) {
      return res.notFound('Experiment not found');
    }

    res.success({ message: 'Experiment updated' });
  } catch (error) {
    logger.error('Failed to update experiment', { error });
    res.error(500, 'Failed to update experiment');
  }
});

// AC1: Start experiment
router.post('/:id/start', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const success = experimentService.startExperiment(id);

    if (!success) {
      return res.notFound('Experiment not found');
    }

    res.success({ message: 'Experiment started' });
  } catch (error) {
    logger.error('Failed to start experiment', { error });
    res.error(500, 'Failed to start experiment');
  }
});

// AC2: Assign user to variant
router.post('/:id/assign', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.badRequest('userId required');
    }

    const variantId = experimentService.assignUserToVariant(id, userId);

    if (!variantId) {
      return res.error(400, 'User not eligible for experiment');
    }

    res.success({ variantId });
  } catch (error) {
    logger.error('Failed to assign user', { error });
    res.error(500, 'Failed to assign user');
  }
});

// AC8: Check feature flag
router.get('/:id/flag/:name', (req, res) => {
  try {
    const { id, name } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.badRequest('userId required');
    }

    const enabled = experimentService.isFeatureFlagEnabled(id, String(userId), name);

    res.success({ enabled });
  } catch (error) {
    logger.error('Failed to check feature flag', { error });
    res.error(500, 'Failed to check feature flag');
  }
});

// AC4: Track metric
router.post('/:id/track', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, metricName, value } = req.body;

    if (!userId || !metricName || value === undefined) {
      return res.badRequest('userId, metricName, value required');
    }

    experimentService.trackMetric(id, userId, metricName, value);

    res.success({ message: 'Metric tracked' });
  } catch (error) {
    logger.error('Failed to track metric', { error });
    res.error(500, 'Failed to track metric');
  }
});

// AC6: Get results
router.get('/:id/results', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    experimentService.calculateResults(id);
    const results = experimentService.getResults(id);

    res.success({ results, count: results.length });
  } catch (error) {
    logger.error('Failed to get results', { error });
    res.error(500, 'Failed to get results');
  }
});

// AC9: Stop experiment
router.post('/:id/stop', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const success = experimentService.stopExperiment(id, reason || 'Manual stop');

    if (!success) {
      return res.notFound('Experiment not found');
    }

    res.success({ message: 'Experiment stopped' });
  } catch (error) {
    logger.error('Failed to stop experiment', { error });
    res.error(500, 'Failed to stop experiment');
  }
});

// AC10: Get history
router.get('/history/all', authMiddleware, (_req, res) => {
  try {
    const history = experimentService.getExperimentHistory();

    res.success({ experiments: history, count: history.length });
  } catch (error) {
    logger.error('Failed to get experiment history', { error });
    res.error(500, 'Failed to get experiment history');
  }
});

// AC11: Export results
router.get('/:id/export', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const data = experimentService.exportResults(id);

    if (format === 'csv') {
      // Generate CSV
      let csv = 'experimentId,userId,variantId,metricName,value,timestamp\n';

      for (const metric of data.metrics) {
        csv += `${metric.experimentId},${metric.userId},${metric.variantId},${metric.metricName},${metric.value},${metric.timestamp}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="experiment-${id}.csv"`);
      res.send(csv);
    } else {
      // JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="experiment-${id}.json"`);
      res.json(data);
    }
  } catch (error) {
    logger.error('Failed to export results', { error });
    res.error(500, 'Failed to export results');
  }
});

export default router;
