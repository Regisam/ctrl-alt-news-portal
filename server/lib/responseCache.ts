import { logger } from '../logger.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class ResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly MAX_SIZE = 100; // Max entries
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanup = setInterval(() => this.cleanupExpired(), 60 * 1000);
  }

  // AC3: Get from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // AC5: Track hits
    entry.hits += 1;
    return entry.data as T;
  }

  // AC3: Set in cache
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // AC5: Evict oldest entry if cache is full
    if (this.cache.size >= this.MAX_SIZE && !this.cache.has(key)) {
      const oldest = Array.from(this.cache.entries()).reduce((prev, current) =>
        prev[1].timestamp < current[1].timestamp ? prev : current
      );
      this.cache.delete(oldest[0]);
      logger.debug('Cache entry evicted (max size reached)');
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
    });
  }

  // AC4: Invalidate by key pattern
  invalidate(pattern: string | RegExp): number {
    let count = 0;

    for (const key of this.cache.keys()) {
      const shouldInvalidate =
        typeof pattern === 'string'
          ? key.includes(pattern)
          : pattern.test(key);

      if (shouldInvalidate) {
        this.cache.delete(key);
        count += 1;
      }
    }

    if (count > 0) {
      logger.debug('Cache invalidated', { pattern: String(pattern), count });
    }

    return count;
  }

  // AC4: Clear all cache
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache cleared', { entries: size });
  }

  // AC5: Get cache statistics
  getStats(): {
    entries: number;
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  } {
    const entries = this.cache.size;
    const hits = Array.from(this.cache.values()).reduce((sum, e) => sum + e.hits, 0);
    const misses = Math.max(0, entries - hits);
    const hitRate = entries === 0 ? 0 : (hits / (hits + misses)) * 100;

    // Rough estimate: assuming average 1KB per entry
    const size = entries * 1024;

    return { entries, hits, misses, hitRate: Math.round(hitRate * 10) / 10, size };
  }

  private cleanupExpired(): void {
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = Date.now() - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        removed += 1;
      }
    }

    if (removed > 0) {
      logger.debug('Cache cleanup completed', { removed });
    }
  }

  destroy(): void {
    clearInterval(this.cleanup);
    this.cache.clear();
  }
}

export const responseCache = new ResponseCache();
