import { Router } from 'express';
import { userBehaviorService } from '../lib/userBehaviorService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Start session
router.post('/sessions/start', authMiddleware, (req, res) => {
  try {
    const userId = req.user!.userId;

    const session = userBehaviorService.startSession(userId);

    res.success({ sessionId: session.id });
  } catch (error) {
    logger.error('Failed to start session', { error });
    res.error(500, 'Failed to start session');
  }
});

// AC1: End session
router.post('/sessions/:id/end', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const success = userBehaviorService.endSession(id);

    if (!success) {
      return res.notFound('Session not found');
    }

    res.success({ message: 'Session ended' });
  } catch (error) {
    logger.error('Failed to end session', { error });
    res.error(500, 'Failed to end session');
  }
});

// AC1: Track page view
router.post('/sessions/:id/pageview', (req, res) => {
  try {
    const { id } = req.params;

    userBehaviorService.trackPageView(id);

    res.success({ message: 'Page view tracked' });
  } catch (error) {
    logger.error('Failed to track page view', { error });
    res.error(500, 'Failed to track page view');
  }
});

// AC8: Track custom event
router.post('/events/track', (req, res) => {
  try {
    const { userId, eventName, eventData } = req.body;

    if (!userId || !eventName) {
      return res.badRequest('userId and eventName required');
    }

    userBehaviorService.trackEvent(userId, eventName, eventData);

    res.success({ message: 'Event tracked' });
  } catch (error) {
    logger.error('Failed to track event', { error });
    res.error(500, 'Failed to track event');
  }
});

// AC2: Define funnel
router.post('/funnels/define', authMiddleware, (req, res) => {
  try {
    const { id, steps } = req.body;

    if (!id || !steps || !Array.isArray(steps)) {
      return res.badRequest('id and steps array required');
    }

    userBehaviorService.defineFunnel(id, steps);

    res.success({ message: 'Funnel defined' });
  } catch (error) {
    logger.error('Failed to define funnel', { error });
    res.error(500, 'Failed to define funnel');
  }
});

// AC2: Track funnel step
router.post('/funnels/:id/track', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, step } = req.body;

    if (!userId || step === undefined) {
      return res.badRequest('userId and step required');
    }

    userBehaviorService.trackFunnelStep(id, userId, step);

    res.success({ message: 'Funnel step tracked' });
  } catch (error) {
    logger.error('Failed to track funnel step', { error });
    res.error(500, 'Failed to track funnel step');
  }
});

// AC2: Get funnel metrics
router.get('/funnels/:id/metrics', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const metrics = userBehaviorService.calculateFunnelMetrics(id);

    res.success({ metrics, count: metrics.length });
  } catch (error) {
    logger.error('Failed to get funnel metrics', { error });
    res.error(500, 'Failed to get funnel metrics');
  }
});

// AC3: Create cohort
router.post('/cohorts/create', authMiddleware, (req, res) => {
  try {
    const { id, name, criteria } = req.body;

    if (!id || !name) {
      return res.badRequest('id and name required');
    }

    userBehaviorService.createCohort(id, name, criteria || '');

    res.success({ message: 'Cohort created' });
  } catch (error) {
    logger.error('Failed to create cohort', { error });
    res.error(500, 'Failed to create cohort');
  }
});

// AC3: Add user to cohort
router.post('/cohorts/:id/add-user', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.badRequest('userId required');
    }

    userBehaviorService.addUserToCohort(id, userId);

    res.success({ message: 'User added to cohort' });
  } catch (error) {
    logger.error('Failed to add user to cohort', { error });
    res.error(500, 'Failed to add user to cohort');
  }
});

// AC4: Calculate retention
router.get('/cohorts/:id/retention', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { days = '1,7,30' } = req.query;

    const dayList = String(days)
      .split(',')
      .map((d) => parseInt(d));

    const retention = userBehaviorService.calculateRetention(id, dayList);

    res.success({
      retention: Object.fromEntries(retention),
    });
  } catch (error) {
    logger.error('Failed to calculate retention', { error });
    res.error(500, 'Failed to calculate retention');
  }
});

// AC5: Predict churn
router.get('/users/:id/churn-risk', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const churnRisk = userBehaviorService.predictChurnRisk(id);

    res.success(churnRisk);
  } catch (error) {
    logger.error('Failed to predict churn', { error });
    res.error(500, 'Failed to predict churn');
  }
});

// AC6: Get engagement score
router.get('/users/:id/engagement', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const engagement = userBehaviorService.getEngagementScore(id);

    if (!engagement) {
      return res.success({ engagement: null });
    }

    res.success({ engagement });
  } catch (error) {
    logger.error('Failed to get engagement score', { error });
    res.error(500, 'Failed to get engagement score');
  }
});

// AC9: Compare cohorts
router.post('/cohorts/compare', authMiddleware, (req, res) => {
  try {
    const { cohort1, cohort2 } = req.body;

    if (!cohort1 || !cohort2) {
      return res.badRequest('cohort1 and cohort2 required');
    }

    const comparison = userBehaviorService.compareCohorts(cohort1, cohort2);

    if (!comparison) {
      return res.notFound('One or both cohorts not found');
    }

    res.success({ comparison });
  } catch (error) {
    logger.error('Failed to compare cohorts', { error });
    res.error(500, 'Failed to compare cohorts');
  }
});

// AC10: Get trends
router.get('/trends/:metric', authMiddleware, (req, res) => {
  try {
    const { metric } = req.params;
    const { days = '30' } = req.query;

    const trends = userBehaviorService.getTrends(metric, parseInt(String(days)));

    res.success({ trends, metric });
  } catch (error) {
    logger.error('Failed to get trends', { error });
    res.error(500, 'Failed to get trends');
  }
});

// AC11: Export behavior data
router.get('/export', authMiddleware, (req, res) => {
  try {
    const { userId, format = 'json' } = req.query;

    const data = userBehaviorService.exportBehaviorData(userId ? String(userId) : undefined);

    if (format === 'csv') {
      let csv = 'sessionId,userId,duration,pageViews,eventCount\n';

      for (const session of data.sessions) {
        csv += `${session.id},${session.userId},${session.duration},${session.pageViews},${session.events.length}\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="behavior.csv"');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="behavior.json"');
      res.json(data);
    }
  } catch (error) {
    logger.error('Failed to export behavior data', { error });
    res.error(500, 'Failed to export behavior data');
  }
});

// AC1: Get active sessions
router.get('/sessions/active', authMiddleware, (_req, res) => {
  try {
    const count = userBehaviorService.getActiveSessions();

    res.success({ activeSessions: count });
  } catch (error) {
    logger.error('Failed to get active sessions', { error });
    res.error(500, 'Failed to get active sessions');
  }
});

export default router;
