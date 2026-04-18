import type { Router, Request, Response } from 'express';

export function setupHealthRoute(router: Router): void {
  router.get('/health', (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}
