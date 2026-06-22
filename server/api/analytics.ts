import { Router } from 'express';
import { eventTracker } from '../lib/eventTracker.js';
import { sessionManager } from '../lib/sessionManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Track event
router.post('/track', (req, res) => {
  try {
    const { sessionId, userId, eventType, path, data, timeOnPage, scrollDepth, deviceType, optedOut } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ error: 'sessionId and eventType required' });
    }

    // Track event
    const event = eventTracker.trackEvent({
      sessionId,
      userId,
      eventType,
      path: path || '/',
      data,
      timeOnPage,
      scrollDepth,
      deviceType,
      optedOut,
    });

    // Update session
    sessionManager.trackEvent(sessionId, eventType);

    res.json({
      message: 'Event tracked',
      eventId: event.eventId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to track event', { error });
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// AC2: Create session
router.post('/session/create', (req, res) => {
  try {
    const { userId, deviceType, referrer } = req.body;
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const session = sessionManager.getOrCreateSession(sessionId, userId, deviceType, referrer);

    res.json({
      message: 'Session created',
      sessionId: session.sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create session', { error });
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// AC4: Get user journey
router.get('/user-journey/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);

    const events = eventTracker.getUserJourney(userId, limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: events.length,
      events,
    });
  } catch (error) {
    logger.error('Failed to get user journey', { error });
    res.status(500).json({ error: 'Failed to get journey' });
  }
});

// AC5: Get funnel analysis
router.get('/funnel', (req, res) => {
  try {
    // Default funnel: login → read → share
    const steps = (req.query.steps as string)?.split(',') || ['login', 'read', 'share'];
    const funnel = eventTracker.analyzeFunnel(steps as any);

    res.json({
      timestamp: new Date().toISOString(),
      steps,
      funnel,
    });
  } catch (error) {
    logger.error('Failed to analyze funnel', { error });
    res.status(500).json({ error: 'Failed to analyze funnel' });
  }
});

// AC6: Get retention
router.get('/retention/:days', (req, res) => {
  try {
    const days = Math.min(parseInt(req.params.days) || 7, 90);
    const retention = eventTracker.getRetention(days);

    res.json({
      timestamp: new Date().toISOString(),
      retention,
    });
  } catch (error) {
    logger.error('Failed to get retention', { error });
    res.status(500).json({ error: 'Failed to get retention' });
  }
});

// AC8: Get cohort analysis
router.get('/cohorts', (_req, res) => {
  try {
    const cohorts = eventTracker.getCohortAnalysis();

    res.json({
      timestamp: new Date().toISOString(),
      count: cohorts.length,
      cohorts,
    });
  } catch (error) {
    logger.error('Failed to get cohort analysis', { error });
    res.status(500).json({ error: 'Failed to get cohorts' });
  }
});

// AC9: Query events
router.get('/events', (req, res) => {
  try {
    const criteria: any = {};

    if (req.query.userId) criteria.userId = req.query.userId as string;
    if (req.query.sessionId) criteria.sessionId = req.query.sessionId as string;
    if (req.query.eventType) criteria.eventType = req.query.eventType as string;
    if (req.query.path) criteria.path = req.query.path as string;

    const events = eventTracker.queryEvents(criteria);

    res.json({
      timestamp: new Date().toISOString(),
      count: events.length,
      events: events.slice(0, 100), // Limit to 100
    });
  } catch (error) {
    logger.error('Failed to query events', { error });
    res.status(500).json({ error: 'Failed to query events' });
  }
});

// AC10: Get analytics stats
router.get('/stats', (_req, res) => {
  try {
    const eventStats = eventTracker.getStats();
    const sessionStats = sessionManager.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      events: eventStats,
      sessions: sessionStats,
    });
  } catch (error) {
    logger.error('Failed to get analytics stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AC11: User opt-out
router.post('/opt-out', (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // In production: save to user preferences
    logger.info('User opted out of tracking', { userId });

    res.json({
      message: 'Opted out of analytics tracking',
      userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to opt-out', { error });
    res.status(500).json({ error: 'Failed to opt-out' });
  }
});

export default router;
