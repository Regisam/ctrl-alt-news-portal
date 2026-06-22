import { Router } from 'express';
import { getMetricsSnapshot } from '../lib/monitoring.js';
import { logger } from '../logger.js';
import os from 'os';

const router = Router();

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  timestamp: string;
}

const alerts: Alert[] = [];
const alertHistory: Alert[] = [];
const maxAlerts = 100;

export function createAlert(
  severity: Alert['severity'],
  message: string,
  metric: string
): Alert {
  const alert: Alert = {
    id: `alert-${Date.now()}`,
    severity,
    message,
    metric,
    timestamp: new Date().toISOString(),
  };

  alerts.push(alert);
  alertHistory.push(alert);

  if (alerts.length > maxAlerts) {
    alerts.shift();
  }
  if (alertHistory.length > 10000) {
    alertHistory.shift();
  }

  if (severity === 'critical' || severity === 'high') {
    logger.error(`[ALERT] ${severity.toUpperCase()}: ${message}`, { metric, alert });
  }

  return alert;
}

export function checkHealthThresholds() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  const memoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
  const processMemoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  const cpuLoad = os.loadavg()[0];
  const cpuCores = os.cpus().length;
  const cpuLoadPercent = (cpuLoad / cpuCores) * 100;

  // Memory alerts
  if (processMemoryPercent > 90) {
    createAlert(
      'critical',
      `Process memory usage critical: ${Math.round(processMemoryPercent)}%`,
      'process_memory'
    );
  } else if (processMemoryPercent > 80) {
    createAlert(
      'high',
      `Process memory usage high: ${Math.round(processMemoryPercent)}%`,
      'process_memory'
    );
  }

  if (memoryPercent > 95) {
    createAlert(
      'critical',
      `System memory usage critical: ${Math.round(memoryPercent)}%`,
      'system_memory'
    );
  } else if (memoryPercent > 85) {
    createAlert(
      'high',
      `System memory usage high: ${Math.round(memoryPercent)}%`,
      'system_memory'
    );
  }

  // CPU alerts
  if (cpuLoadPercent > 90) {
    createAlert(
      'high',
      `CPU load critical: ${Math.round(cpuLoadPercent)}%`,
      'cpu_load'
    );
  }

  // Uptime alert (server restart detected)
  if (uptime < 60) {
    createAlert(
      'medium',
      'Server recently restarted',
      'uptime'
    );
  }
}

router.get('/metrics', (_req, res) => {
  checkHealthThresholds();
  const snapshot = getMetricsSnapshot();
  res.json(snapshot);
});

router.get('/alerts', (_req, res) => {
  res.json({
    active: alerts,
    count: alerts.length,
    timestamp: new Date().toISOString(),
  });
});

router.get('/alerts/history', (_req, res) => {
  const limit = Math.min(parseInt(_req.query.limit as string) || 100, 1000);
  res.json({
    alerts: alertHistory.slice(-limit),
    total: alertHistory.length,
    timestamp: new Date().toISOString(),
  });
});

router.delete('/alerts/:id', (req, res) => {
  const index = alerts.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    alerts.splice(index, 1);
    res.json({ deleted: true });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

export default router;
