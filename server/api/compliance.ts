import { Router } from 'express';
import { auditLogger } from '../lib/auditLogger.js';
import { dataPrivacy } from '../lib/dataPrivacy.js';
import { logger } from '../logger.js';

const router = Router();

// AC1 & AC8: Search audit logs
router.get('/audit-logs', (req, res) => {
  try {
    const criteria: any = {};

    if (req.query.userId) criteria.userId = req.query.userId as string;
    if (req.query.action) criteria.action = req.query.action as string;
    if (req.query.resource) criteria.resource = req.query.resource as string;
    if (req.query.status) criteria.status = req.query.status as 'success' | 'failure';

    if (req.query.startDate) criteria.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) criteria.endDate = new Date(req.query.endDate as string);

    const logs = auditLogger.searchLogs(criteria);

    res.json({
      timestamp: new Date().toISOString(),
      criteria,
      count: logs.length,
      logs: logs.slice(0, 100), // Limit to 100 results
    });
  } catch (error) {
    logger.error('Failed to search audit logs', { error });
    res.status(500).json({ error: 'Failed to search logs' });
  }
});

// AC5: Get user's personal data (GDPR right to data portability)
router.get('/user-data/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const auditData = auditLogger.getUserData(userId);
    const privacyData = dataPrivacy.exportUserData(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      auditLogs: auditData,
      personalData: privacyData,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to export user data', { error });
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// AC4: Request data deletion (GDPR right to be forgotten)
router.post('/deletion-request/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await dataPrivacy.requestDeletion(userId);

    // AC2: Pseudonymize logs instead of delete
    const logsAffected = auditLogger.deleteUserLogs(userId);

    res.json({
      message: 'GDPR deletion request submitted',
      userId,
      logsAffected,
      requestStatus: result.status,
      requestDate: result.requestDate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Deletion request failed', { error });
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

// AC6: Record user consent
router.post('/consent', (req, res) => {
  try {
    const { userId, type, status, ipAddress, userAgent } = req.body;

    if (!userId || !type || !status) {
      return res.status(400).json({ error: 'userId, type, and status required' });
    }

    const consent = dataPrivacy.recordConsent(userId, type, status, ipAddress, userAgent);

    res.json({
      message: 'Consent recorded',
      consent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to record consent', { error });
    res.status(500).json({ error: 'Failed to record consent' });
  }
});

// AC6: Get user's consent preferences
router.get('/user-consents/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const consents = dataPrivacy.getUserConsents(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      consents,
    });
  } catch (error) {
    logger.error('Failed to get user consents', { error });
    res.status(500).json({ error: 'Failed to get consents' });
  }
});

// AC9: Generate compliance report
router.get('/compliance-report', (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const report = dataPrivacy.generateComplianceReport({ start: startDate, end: endDate });

    res.json({
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error) {
    logger.error('Failed to generate compliance report', { error });
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// AC9 & AC10: Get audit log statistics
router.get('/audit-stats', (_req, res) => {
  try {
    const stats = auditLogger.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get audit stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AC6: Get consent statistics
router.get('/consent-stats', (_req, res) => {
  try {
    const stats = dataPrivacy.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get consent stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
