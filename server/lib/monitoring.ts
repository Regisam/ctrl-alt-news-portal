import { httpRequestDuration, httpErrorsTotal, activeSessionsGauge, articlesViewedTotal } from '../middleware/metricsMiddleware.js';

export interface MetricsSnapshot {
  timestamp: string;
  latency: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  requests: {
    total: number;
    errorRate: number;
  };
  activeSessions: number;
  articlesViewed: number;
}

const requestLatencies: number[] = [];
const maxLatencySamples = 1000;

export function recordLatency(duration: number) {
  requestLatencies.push(duration);
  if (requestLatencies.length > maxLatencySamples) {
    requestLatencies.shift();
  }
}

export function getLatencyPercentiles() {
  if (requestLatencies.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0 };
  }

  const sorted = [...requestLatencies].sort((a, b) => a - b);
  const avg = sorted.reduce((a, b) => a + b) / sorted.length;

  return {
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
    avg: Math.round(avg * 1000) / 1000,
  };
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const latency = getLatencyPercentiles();

  return {
    timestamp: new Date().toISOString(),
    latency: {
      p50: Math.round(latency.p50 * 1000),
      p95: Math.round(latency.p95 * 1000),
      p99: Math.round(latency.p99 * 1000),
      avg: Math.round(latency.avg * 1000),
    },
    requests: {
      total: requestLatencies.length,
      errorRate: 0, // Will be updated from error tracking
    },
    activeSessions: 0, // Will be updated from session tracking
    articlesViewed: 0, // Will be updated from analytics
  };
}

export function resetMetrics() {
  requestLatencies.length = 0;
}
