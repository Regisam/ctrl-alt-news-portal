import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
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
