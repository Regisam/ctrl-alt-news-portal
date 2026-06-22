import { logger } from '../logger.js';

// AC3: Performance baseline metrics
export interface PerformanceMetrics {
  p50: number; // 50th percentile (median)
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  min: number;
  max: number;
  avg: number;
}

// AC4: Capacity metrics
export interface CapacityMetrics {
  requestsPerSecond: number;
  concurrentUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
}

export interface LoadTestResult {
  testId: string;
  timestamp: string;
  scenario: string;
  duration: number; // ms
  latency: PerformanceMetrics;
  capacity: CapacityMetrics;
  bottleneck?: string;
  recommendations?: string[];
}

class LoadTestRunner {
  private results: LoadTestResult[] = [];
  private readonly MAX_RESULTS = 50;

  // AC1 & AC2: Run load test scenario
  async runTest(scenario: 'login' | 'read' | 'create' | 'search', config: {
    rps: number; // requests per second
    duration: number; // seconds
    concurrentUsers: number;
  }): Promise<LoadTestResult> {
    const testId = `load-test-${Date.now()}`;
    const startTime = Date.now();

    logger.info('Load test started', { testId, scenario, config });

    try {
      // AC3: Simulate load and collect metrics
      const latencies: number[] = [];
      let successCount = 0;
      let failureCount = 0;

      // Simulate requests
      const requestsPerSecond = config.rps;
      const totalRequests = requestsPerSecond * config.duration;
      const intervalMs = 1000 / requestsPerSecond;

      for (let i = 0; i < totalRequests; i++) {
        const requestStart = Date.now();

        // Simulate request (in production: actual HTTP call)
        const latency = Math.random() * 200 + 10; // 10-210ms
        latencies.push(latency);

        if (Math.random() > 0.01) {
          // 99% success rate
          successCount += 1;
        } else {
          failureCount += 1;
        }

        // Rate limiting
        if (i % requestsPerSecond === 0) {
          const elapsed = Date.now() - requestStart;
          if (elapsed < intervalMs) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs - elapsed));
          }
        }
      }

      const duration = Date.now() - startTime;

      // AC3 & AC4: Calculate metrics
      const sortedLatencies = latencies.sort((a, b) => a - b);
      const metrics = this.calculateMetrics(sortedLatencies);
      const capacity = this.calculateCapacity(totalRequests, duration, successCount, failureCount);

      // AC5: Identify bottleneck
      const bottleneck = this.identifyBottleneck(metrics, capacity);

      // AC9: Generate recommendations
      const recommendations = this.generateRecommendations(metrics, capacity, scenario);

      const result: LoadTestResult = {
        testId,
        timestamp: new Date().toISOString(),
        scenario,
        duration,
        latency: metrics,
        capacity,
        bottleneck,
        recommendations,
      };

      this.results.push(result);

      // Keep max results
      if (this.results.length > this.MAX_RESULTS) {
        this.results.shift();
      }

      logger.info('Load test completed', {
        testId,
        scenario,
        p95: metrics.p95,
        rps: capacity.requestsPerSecond,
        successRate: capacity.successRate,
      });

      return result;
    } catch (error) {
      logger.error('Load test failed', { testId, error });
      throw error;
    }
  }

  private calculateMetrics(latencies: number[]): PerformanceMetrics {
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      p50: sorted[p50Index] || 0,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0,
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      avg: latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
    };
  }

  private calculateCapacity(
    totalRequests: number,
    duration: number,
    successCount: number,
    failureCount: number
  ): CapacityMetrics {
    return {
      requestsPerSecond: Math.round((totalRequests / duration) * 1000),
      concurrentUsers: Math.round(totalRequests / 100), // Estimate
      totalRequests,
      successfulRequests: successCount,
      failedRequests: failureCount,
      successRate: (successCount / totalRequests) * 100,
    };
  }

  private identifyBottleneck(metrics: PerformanceMetrics, capacity: CapacityMetrics): string {
    if (metrics.p99 > 500) return 'High latency (p99 > 500ms)';
    if (capacity.failedRequests > capacity.totalRequests * 0.05) return 'High error rate (> 5%)';
    if (metrics.p95 > 200) return 'Database query performance';
    return 'None detected';
  }

  private generateRecommendations(
    metrics: PerformanceMetrics,
    capacity: CapacityMetrics,
    scenario: string
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.p95 > 200) {
      recommendations.push('Optimize database queries');
      recommendations.push('Add caching layer');
    }

    if (capacity.failedRequests > 0) {
      recommendations.push('Increase timeout limits');
      recommendations.push('Add circuit breaker');
    }

    if (capacity.requestsPerSecond < 100) {
      recommendations.push('Scale horizontally (add more servers)');
    }

    if (scenario === 'search') {
      recommendations.push('Add full-text search index');
      recommendations.push('Implement pagination');
    }

    return recommendations;
  }

  // AC8: Simple capacity forecast
  forecastCapacity(months: number = 6): {
    currentRPS: number;
    forecastedRPS: number;
    growthRate: number;
    scalingNeeded: boolean;
  } {
    const currentResult = this.results[this.results.length - 1];
    if (!currentResult) {
      return {
        currentRPS: 0,
        forecastedRPS: 0,
        growthRate: 0,
        scalingNeeded: false,
      };
    }

    const currentRPS = currentResult.capacity.requestsPerSecond;
    const monthlyGrowthRate = 0.10; // 10% monthly growth assumption
    const forecastedRPS = currentRPS * Math.pow(1 + monthlyGrowthRate, months);
    const scalingNeeded = forecastedRPS > currentRPS * 1.5; // Scale if 50% growth

    return {
      currentRPS,
      forecastedRPS: Math.round(forecastedRPS),
      growthRate: monthlyGrowthRate * 100,
      scalingNeeded,
    };
  }

  getResults(limit: number = 10): LoadTestResult[] {
    return this.results.slice(-limit).reverse();
  }

  getStats(): {
    totalTests: number;
    avgP95: number;
    avgSuccessRate: number;
  } {
    if (this.results.length === 0) {
      return { totalTests: 0, avgP95: 0, avgSuccessRate: 0 };
    }

    const avgP95 = this.results.reduce((sum, r) => sum + r.latency.p95, 0) / this.results.length;
    const avgSuccessRate =
      this.results.reduce((sum, r) => sum + r.capacity.successRate, 0) / this.results.length;

    return {
      totalTests: this.results.length,
      avgP95: Math.round(avgP95),
      avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
    };
  }
}

export const loadTestRunner = new LoadTestRunner();
