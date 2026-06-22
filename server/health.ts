import { Router } from 'express';
import os from 'os';

const router = Router();

function getHealthStatus() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  const memoryPercent = ((totalMemory - freeMemory) / totalMemory) * 100;
  const processMemoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  const status = memoryPercent > 90 ? 'degraded' : 'ok';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime,
    memory: {
      process: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percent: Math.round(processMemoryPercent * 10) / 10,
      },
      system: {
        total: Math.round(totalMemory / 1024 / 1024),
        free: Math.round(freeMemory / 1024 / 1024),
        percent: Math.round(memoryPercent * 10) / 10,
      },
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
    },
    services: {
      server: 'healthy',
      logger: 'healthy',
    },
  };
}

router.get('/health', (_req, res) => {
  const health = getHealthStatus();
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get('/status', (_req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    version: process.env.VERSION || '1.0.0',
    buildId: process.env.BUILD_ID || 'local',
    timestamp: new Date().toISOString(),
  });
});

router.get('/version', (_req, res) => {
  res.json({
    version: process.env.VERSION || '1.0.0',
    buildId: process.env.BUILD_ID || 'local',
    buildDate: process.env.BUILD_DATE || new Date().toISOString(),
  });
});

export default router;
