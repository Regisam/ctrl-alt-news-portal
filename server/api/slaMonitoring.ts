import { Router } from 'express';
import { slaCalculator } from '../lib/slaCalculator.js';
import { uptimeTracker } from '../lib/uptimeTracker.js';
import { logger } from '../logger.js';

const router = Router();

// AC7: SLA dashboard data
router.get('/status', (_req, res) => {
  try {
    const status = slaCalculator.getSLAStatus();
    const targets = slaCalculator.getSLATargets();

    res.json({
      timestamp: new Date().toISOString(),
      target: targets,
      status,
    });
  } catch (error) {
    logger.error('Failed to get SLA status', { error });
    res.status(500).json({ error: 'Failed to get SLA status' });
  }
});

// AC2: SLA compliance for specific window
router.get('/compliance/:days', (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.params.days) || 30, 1), 365);
    const compliance = slaCalculator.calculateSLACompliance(days);

    res.json({
      timestamp: new Date().toISOString(),
      window: { days, label: `${days} day${days !== 1 ? 's' : ''}` },
      compliance,
    });
  } catch (error) {
    logger.error('Failed to calculate SLA compliance', { error });
    res.status(500).json({ error: 'Failed to calculate compliance' });
  }
});

// AC4 & AC6: Downtime events and analysis
router.get('/downtime/:days', (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.params.days) || 7, 1), 365);
    const events = uptimeTracker.getDowntimeEvents(days);
    const analysis = uptimeTracker.getDowntimeAnalysis(days);

    res.json({
      timestamp: new Date().toISOString(),
      window: { days },
      analysis,
      events: events.map((e) => ({
        startTime: e.startTime,
        endTime: e.endTime,
        duration: e.duration,
        durationMinutes: e.duration ? Math.round(e.duration / 60000) : undefined,
        reason: e.reason,
        resolved: e.resolved,
      })),
    });
  } catch (error) {
    logger.error('Failed to get downtime analysis', { error });
    res.status(500).json({ error: 'Failed to get downtime analysis' });
  }
});

// AC8: Historical uptime trends
router.get('/history', (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 7, 1), 365);
    const intervalMinutes = Math.min(Math.max(parseInt(req.query.interval as string) || 60, 5), 1440);

    const history = uptimeTracker.getUptimeHistory(days, intervalMinutes);

    res.json({
      timestamp: new Date().toISOString(),
      window: { days },
      interval: { minutes: intervalMinutes },
      count: history.length,
      data: history,
    });
  } catch (error) {
    logger.error('Failed to get uptime history', { error });
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// AC3: Configure SLA target
router.post('/target/:target', (req, res) => {
  try {
    const { target } = req.params;
    const validTargets = ['standard', 'premium', 'enterprise'];

    if (!validTargets.includes(target)) {
      return res.status(400).json({
        error: 'Invalid target',
        valid: validTargets,
      });
    }

    slaCalculator.setSLATarget(target as any);

    res.json({
      message: 'SLA target updated',
      target: slaCalculator.getSLATargets(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to set SLA target', { error });
    res.status(500).json({ error: 'Failed to set target' });
  }
});

// AC5: Check SLA alert status
router.get('/alert-status', (_req, res) => {
  try {
    const alert = slaCalculator.checkSLAAlert();
    const status = slaCalculator.getSLAStatus();

    res.json({
      timestamp: new Date().toISOString(),
      alert: {
        shouldAlert: alert.shouldAlert,
        reason: alert.reason,
      },
      currentStatus: status.sevenDay,
      target: slaCalculator.getSLATargets(),
    });
  } catch (error) {
    logger.error('Failed to check SLA alert', { error });
    res.status(500).json({ error: 'Failed to check alert' });
  }
});

// AC10: Export SLA report (CSV format)
router.get('/export/csv', (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
    const compliance = slaCalculator.calculateSLACompliance(days);
    const analysis = uptimeTracker.getDowntimeAnalysis(days);
    const target = slaCalculator.getSLATargets();

    const csv = `SLA Report - ${new Date().toISOString()}
Window,${days} days
Target,${target.name}
Current Uptime,${compliance.uptime}%
Target Uptime,${compliance.target}%
Compliant,${compliance.compliant ? 'Yes' : 'No'}
Allowed Downtime,${compliance.allowedDowntime} minutes
Remaining Downtime,${compliance.remainingDowntime} minutes

Downtime Analysis
Total Downtime,${Math.round(analysis.totalDowntime / 60000)} minutes
Event Count,${analysis.eventCount}
Average Downtime,${Math.round(analysis.averageDowntime / 60000)} minutes
Longest Downtime,${Math.round(analysis.longestDowntime / 60000)} minutes
`;

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename="sla-report-${days}d.csv"`);
    res.send(csv);
  } catch (error) {
    logger.error('CSV export failed', { error });
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
