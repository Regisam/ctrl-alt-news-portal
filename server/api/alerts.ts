import { Router } from 'express';
import { alertingService } from '../lib/alertingService.js';
import { slackNotifier } from '../lib/slackNotifier.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Configure threshold
router.post('/thresholds', authMiddleware, (req, res) => {
  try {
    const threshold = req.body;

    alertingService.configureThreshold(threshold);

    res.success({ message: 'Threshold configured', thresholdId: threshold.id });
  } catch (error) {
    logger.error('Failed to configure threshold', { error });
    res.error(500, 'Failed to configure threshold');
  }
});

// AC1: Get all thresholds
router.get('/thresholds', authMiddleware, (_req, res) => {
  try {
    const thresholds = alertingService.getAllThresholds();

    res.success({ thresholds, count: thresholds.length });
  } catch (error) {
    logger.error('Failed to get thresholds', { error });
    res.error(500, 'Failed to get thresholds');
  }
});

// AC1: Get specific threshold
router.get('/thresholds/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const threshold = alertingService.getThreshold(id);

    if (!threshold) {
      return res.notFound('Threshold not found');
    }

    res.success({ threshold });
  } catch (error) {
    logger.error('Failed to get threshold', { error });
    res.error(500, 'Failed to get threshold');
  }
});

// AC1: Update threshold
router.put('/thresholds/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = alertingService.updateThreshold(id, updates);

    if (!success) {
      return res.notFound('Threshold not found');
    }

    res.success({ message: 'Threshold updated' });
  } catch (error) {
    logger.error('Failed to update threshold', { error });
    res.error(500, 'Failed to update threshold');
  }
});

// AC2-3: Check metric
router.post('/check-metric', authMiddleware, async (req, res) => {
  try {
    const { metric, value } = req.body;

    if (!metric || value === undefined) {
      return res.badRequest('metric and value required');
    }

    const alerts = alertingService.checkMetric(metric, value);

    // AC4: Send Slack notification
    for (const alert of alerts) {
      await slackNotifier.sendMetricUpdate(metric, value, 100);
    }

    res.success({ alerts, count: alerts.length });
  } catch (error) {
    logger.error('Failed to check metric', { error });
    res.error(500, 'Failed to check metric');
  }
});

// AC5: Acknowledge alert
router.post('/alerts/:id/acknowledge', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const success = alertingService.acknowledgeAlert(id, message);

    if (!success) {
      return res.notFound('Alert not found');
    }

    res.success({ message: 'Alert acknowledged' });
  } catch (error) {
    logger.error('Failed to acknowledge alert', { error });
    res.error(500, 'Failed to acknowledge alert');
  }
});

// AC5: Resolve alert
router.post('/alerts/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const success = alertingService.resolveAlert(id, message);

    if (!success) {
      return res.notFound('Alert not found');
    }

    // AC4: Send recovery notification
    await slackNotifier.sendRecovery(`Alert ${id}`);

    res.success({ message: 'Alert resolved' });
  } catch (error) {
    logger.error('Failed to resolve alert', { error });
    res.error(500, 'Failed to resolve alert');
  }
});

// AC5: Get alert history
router.get('/alerts/:id/history', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const history = alertingService.getAlertHistory(id);

    res.success({ history, count: history.length });
  } catch (error) {
    logger.error('Failed to get alert history', { error });
    res.error(500, 'Failed to get alert history');
  }
});

// AC8: Create custom rule
router.post('/rules', authMiddleware, (req, res) => {
  try {
    const { name, condition, channels } = req.body;

    const rule = alertingService.createCustomRule({ name, condition, channels });

    res.success({ message: 'Rule created', ruleId: rule.id });
  } catch (error) {
    logger.error('Failed to create rule', { error });
    res.error(500, 'Failed to create rule');
  }
});

// AC9: Silence alert
router.post('/alerts/:id/silence', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { durationMinutes = 30 } = req.body;

    const success = alertingService.silenceAlert(id, durationMinutes);

    if (!success) {
      return res.notFound('Alert not found');
    }

    res.success({ message: `Alert silenced for ${durationMinutes} minutes` });
  } catch (error) {
    logger.error('Failed to silence alert', { error });
    res.error(500, 'Failed to silence alert');
  }
});

// AC10: Get dashboard data
router.get('/dashboard', authMiddleware, (_req, res) => {
  try {
    const data = alertingService.getDashboardData();

    res.success({ dashboard: data });
  } catch (error) {
    logger.error('Failed to get dashboard data', { error });
    res.error(500, 'Failed to get dashboard data');
  }
});

// AC11: Test Slack integration
router.post('/test-slack', authMiddleware, async (req, res) => {
  try {
    const success = await slackNotifier.sendAlert(
      'Test Alert',
      'This is a test alert from Ctrl Alt News Platform',
      'info'
    );

    if (!success) {
      return res.error(500, 'Failed to send test alert');
    }

    res.success({ message: 'Test alert sent to Slack' });
  } catch (error) {
    logger.error('Failed to send test alert', { error });
    res.error(500, 'Failed to send test alert');
  }
});

export default router;
