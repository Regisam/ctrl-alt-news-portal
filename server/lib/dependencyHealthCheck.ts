import { logger } from '../logger.js';

export type DependencyStatus = 'ok' | 'warning' | 'critical';

export interface DependencyHealth {
  name: string;
  status: DependencyStatus;
  responseTime: number;
  lastChecked: string;
  error?: string;
}

// AC6: Circuit breaker state
export type CircuitState = 'closed' | 'open' | 'half-open';

interface HealthCheckConfig {
  timeout: number;
  name: string;
  check: () => Promise<number>;
  warningThreshold?: number;
  criticalThreshold?: number;
}

class DependencyHealthChecker {
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, DependencyHealth> = new Map();
  private circuitStates: Map<string, CircuitState> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private readonly CIRCUIT_OPEN_THRESHOLD = 3;
  private readonly CIRCUIT_RESET_TIME = 30000; // 30 seconds

  registerCheck(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);
    this.circuitStates.set(config.name, 'closed');
    this.failureCounts.set(config.name, 0);
    logger.info('Health check registered', { name: config.name });
  }

  // AC1-3: Run health check with timeout
  async checkDependency(name: string): Promise<DependencyHealth> {
    const config = this.checks.get(name);
    if (!config) {
      return {
        name,
        status: 'critical',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        error: 'Check not registered',
      };
    }

    // AC6: Check circuit state
    const circuitState = this.circuitStates.get(name);
    if (circuitState === 'open') {
      return {
        name,
        status: 'critical',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        error: 'Circuit breaker open',
      };
    }

    try {
      // AC10: 5-second timeout per check
      const startTime = Date.now();
      const timeoutPromise = new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), config.timeout || 5000)
      );

      const responseTime = await Promise.race([config.check(), timeoutPromise]);
      const duration = Date.now() - startTime;

      // AC4: Track response time
      const status = this.getStatus(duration, config);

      const result: DependencyHealth = {
        name,
        status,
        responseTime: duration,
        lastChecked: new Date().toISOString(),
      };

      this.results.set(name, result);
      this.failureCounts.set(name, 0); // Reset failure count
      this.circuitStates.set(name, 'closed'); // Close circuit

      return result;
    } catch (error) {
      const failureCount = (this.failureCounts.get(name) || 0) + 1;
      this.failureCounts.set(name, failureCount);

      // AC6: Open circuit if too many failures
      if (failureCount >= this.CIRCUIT_OPEN_THRESHOLD) {
        this.circuitStates.set(name, 'open');
        logger.warn('Circuit breaker opened', { name, failures: failureCount });

        // Reset after delay
        setTimeout(() => {
          this.circuitStates.set(name, 'half-open');
          this.failureCounts.set(name, 0);
        }, this.CIRCUIT_RESET_TIME);
      }

      const result: DependencyHealth = {
        name,
        status: 'critical',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.set(name, result);
      return result;
    }
  }

  // AC5: Get all dependency statuses
  async checkAll(): Promise<DependencyHealth[]> {
    const checks = Array.from(this.checks.keys());
    const results = await Promise.all(checks.map((name) => this.checkDependency(name)));
    return results;
  }

  // AC5: Color-coded status (ok/warning/critical)
  private getStatus(responseTime: number, config: HealthCheckConfig): DependencyStatus {
    const warning = config.warningThreshold || 1000; // 1 second default
    const critical = config.criticalThreshold || 5000; // 5 seconds default

    if (responseTime >= critical) return 'critical';
    if (responseTime >= warning) return 'warning';
    return 'ok';
  }

  // AC9: Check if service should be in degraded mode
  isServiceAvailable(name: string): boolean {
    const health = this.results.get(name);
    return health?.status !== 'critical';
  }

  getResult(name: string): DependencyHealth | undefined {
    return this.results.get(name);
  }

  getAllResults(): DependencyHealth[] {
    return Array.from(this.results.values());
  }
}

export const dependencyHealthChecker = new DependencyHealthChecker();
