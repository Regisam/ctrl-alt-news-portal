import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Express, Request, Response, NextFunction } from 'express';
import { recordLatency } from '../lib/monitoring.js';

// Define Prometheus metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP request in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: 'http_request_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total HTTP errors',
  labelNames: ['method', 'route', 'error_code'],
});

export const activeSessionsGauge = new Gauge({
  name: 'active_sessions',
  help: 'Number of active user sessions',
});

export const articlesViewedTotal = new Counter({
  name: 'articles_viewed_total',
  help: 'Total article views',
  labelNames: ['article_id', 'category'],
});

// Middleware to record request metrics
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  const route = (req.route?.path || req.path).replace(/\d+/g, ':id');

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const statusCode = res.statusCode;
    const method = req.method;

    recordLatency(duration);
    httpRequestDuration
      .labels(method, route, String(statusCode))
      .observe(duration);
    httpRequestTotal.labels(method, route, String(statusCode)).inc();

    if (statusCode >= 400) {
      httpErrorsTotal.labels(method, route, String(statusCode)).inc();
    }
  });

  next();
}

// Setup /metrics endpoint
export function setupMetricsEndpoint(app: Express): void {
  app.get('/metrics', (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  });
}

// Utility functions for tracking specific events
export function incrementArticleView(articleId: string, category: string): void {
  articlesViewedTotal.labels(articleId, category).inc();
}

export function updateActiveSessions(count: number): void {
  activeSessionsGauge.set(count);
}
