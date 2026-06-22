import { useState, useEffect, useCallback } from 'react';

export interface MetricsData {
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

export interface HealthData {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  memory: {
    process: {
      heapUsed: number;
      heapTotal: number;
      percent: number;
    };
    system: {
      total: number;
      free: number;
      percent: number;
    };
  };
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  services: {
    server: string;
    logger: string;
  };
}

export interface AlertData {
  active: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric: string;
    timestamp: string;
  }>;
  count: number;
  timestamp: string;
}

export function useMetrics(interval: number = 5000) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (isPaused) return;

    try {
      setIsRefreshing(true);
      setError(null);

      const [metricsRes, healthRes, alertsRes] = await Promise.all([
        fetch('/api/monitoring/metrics'),
        fetch('/api/health'),
        fetch('/api/monitoring/alerts'),
      ]);

      if (!metricsRes.ok || !healthRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const [metricsData, healthData, alertsData] = await Promise.all([
        metricsRes.json(),
        healthRes.json(),
        alertsRes.json(),
      ]);

      setMetrics(metricsData);
      setHealth(healthData);
      setAlerts(alertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isPaused]);

  useEffect(() => {
    // Fetch immediately on mount
    fetchMetrics();

    // Set up interval
    const intervalId = setInterval(fetchMetrics, interval);

    return () => clearInterval(intervalId);
  }, [fetchMetrics, interval]);

  return {
    metrics,
    health,
    alerts,
    isRefreshing,
    isPaused,
    setPaused: setIsPaused,
    error,
    refetch: fetchMetrics,
  };
}
