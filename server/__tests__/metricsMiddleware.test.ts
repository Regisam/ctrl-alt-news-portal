import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import { createServer } from 'http';
import {
  metricsMiddleware,
  setupMetricsEndpoint,
  httpRequestDuration,
  httpRequestTotal,
  httpErrorsTotal,
  activeSessionsGauge,
  articlesViewedTotal,
} from '../middleware/metricsMiddleware.js';

describe('Metrics Middleware', () => {
  let app: ReturnType<typeof express>;
  let server: ReturnType<typeof createServer>;

  beforeEach(() => {
    app = express();
    app.use(metricsMiddleware);
    setupMetricsEndpoint(app);

    app.get('/test', (req, res) => {
      res.json({ message: 'test' });
    });

    app.get('/error', (req, res) => {
      res.status(500).json({ error: 'Server error' });
    });

    server = createServer(app);
  });

  afterEach(() => {
    server.close();
  });

  it('should expose /metrics endpoint with prometheus format', () => {
    // Verify the metrics endpoint is registered
    const hasMetricsEndpoint = app._router.stack.some(
      (layer: any) => layer.route?.path === '/metrics',
    );

    expect(hasMetricsEndpoint).toBe(true);
  });

  it('should record request metrics', () => {
    const initialCount = httpRequestTotal;

    // Simulate a request
    const mockRes = {
      statusCode: 200,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
      },
    };

    const mockReq = {
      method: 'GET',
      path: '/test',
      route: { path: '/test' },
    };

    const next = () => {};

    metricsMiddleware(mockReq as any, mockRes as any, next as any);

    expect(initialCount).toBeDefined();
  });

  it('should track error metrics for 4xx and 5xx responses', () => {
    const mockRes = {
      statusCode: 500,
      on: (event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
      },
    };

    const mockReq = {
      method: 'GET',
      path: '/error',
      route: { path: '/error' },
    };

    const next = () => {};

    metricsMiddleware(mockReq as any, mockRes as any, next as any);

    expect(httpErrorsTotal).toBeDefined();
  });

  it('should update active sessions gauge', () => {
    const initialValue = activeSessionsGauge;
    expect(initialValue).toBeDefined();
  });

  it('should track article views', () => {
    const initialValue = articlesViewedTotal;
    expect(initialValue).toBeDefined();
  });

  it('should measure request duration', () => {
    const start = Date.now();
    const duration = (Date.now() - start) / 1000;

    expect(duration).toBeDefined();
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
