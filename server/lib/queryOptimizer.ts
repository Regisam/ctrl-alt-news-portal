import { logger } from '../logger.js';

// AC2: Query optimization helpers
export class QueryOptimizer {
  // AC2: Select only needed fields
  static selectFields<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[]
  ): Partial<T> {
    const result: Partial<T> = {};
    for (const field of fields) {
      result[field] = obj[field];
    }
    return result;
  }

  // AC3: Batch load to prevent N+1 queries
  static async batchLoad<T, K>(
    items: T[],
    keySelector: (item: T) => K,
    loader: (keys: K[]) => Promise<Map<K, any>>
  ): Promise<T[]> {
    const keys = items.map(keySelector);
    const uniqueKeys = Array.from(new Set(keys));

    logger.debug('Batch loading', { count: uniqueKeys.length });

    const map = await loader(uniqueKeys);

    return items.map((item) => ({
      ...item,
      _loaded: map.get(keySelector(item)),
    }));
  }

  // AC4: Query performance measurement
  static async measureQuery<T>(
    label: string,
    query: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();

    try {
      const result = await query();
      const duration = performance.now() - start;

      logger.debug('Query performance', { label, duration: `${duration.toFixed(2)}ms` });

      return { result, duration };
    } catch (error) {
      const duration = performance.now() - start;
      logger.error('Query failed', { label, duration: `${duration.toFixed(2)}ms`, error });
      throw error;
    }
  }

  // AC8: Pagination helpers
  static paginate<T>(items: T[], page: number = 1, pageSize: number = 20) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: items.slice(start, end),
      pagination: {
        page,
        pageSize,
        total: items.length,
        pages: Math.ceil(items.length / pageSize),
        hasMore: end < items.length,
      },
    };
  }

  // AC10: Query analysis helper
  static explainQuery(query: string): string {
    return `EXPLAIN ANALYZE ${query}`;
  }
}

// AC11: Performance metrics
export class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(label: string, duration: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  getAllStats() {
    const stats: Record<string, any> = {};
    for (const [label] of this.metrics) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }
}

export const performanceMetrics = new PerformanceMetrics();
