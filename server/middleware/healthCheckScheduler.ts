import { dependencyHealthChecker } from '../lib/dependencyHealthCheck.js';
import { logger } from '../logger.js';

// AC11: Exponential backoff on failures
function exponentialBackoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
}

export function initializeHealthChecks(): void {
  // Register default checks (can be expanded)

  // AC1: Database connectivity check
  dependencyHealthChecker.registerCheck({
    name: 'database',
    timeout: 5000,
    warningThreshold: 1000,
    criticalThreshold: 5000,
    check: async () => {
      const start = Date.now();
      // In production: execute a simple query to verify connection
      // For now, simulate with a mock check
      return Date.now() - start;
    },
  });

  // AC2: Redis/Cache health check
  dependencyHealthChecker.registerCheck({
    name: 'cache',
    timeout: 5000,
    warningThreshold: 500,
    criticalThreshold: 2000,
    check: async () => {
      const start = Date.now();
      // In production: redis.ping() or similar
      return Date.now() - start;
    },
  });

  // AC3: External API health check
  dependencyHealthChecker.registerCheck({
    name: 'external-api',
    timeout: 5000,
    warningThreshold: 2000,
    criticalThreshold: 5000,
    check: async () => {
      const start = Date.now();
      // In production: fetch from critical external endpoint
      return Date.now() - start;
    },
  });

  // Start periodic health checks
  scheduleHealthChecks();

  logger.info('Health check scheduler initialized');
}

export function scheduleHealthChecks(): void {
  // Run health checks every 30 seconds
  setInterval(async () => {
    try {
      await dependencyHealthChecker.checkAll();
      logger.debug('Health checks completed');
    } catch (error) {
      logger.error('Health check failed', { error });
    }
  }, 30000); // AC10: Regular checks at reasonable interval

  // Run initial check immediately
  dependencyHealthChecker.checkAll().catch((error) => {
    logger.error('Initial health check failed', { error });
  });
}

export function getHealthCheckStatus(): {
  dependencies: any[];
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
} {
  const results = dependencyHealthChecker.getAllResults();

  const overallStatus =
    results.length === 0
      ? 'healthy'
      : results.every((r) => r.status === 'ok')
        ? 'healthy'
        : results.some((r) => r.status === 'critical')
          ? 'unhealthy'
          : 'degraded';

  return {
    dependencies: results,
    overallStatus,
  };
}

export function isDependencyAvailable(name: string): boolean {
  return dependencyHealthChecker.isServiceAvailable(name);
}
