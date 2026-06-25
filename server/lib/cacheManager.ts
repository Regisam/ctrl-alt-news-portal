import { logger } from '../logger.js';

// AC5-7: Cache management with invalidation
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class CacheManager {
  private cache: Map<string, { value: any; expiresAt: number; tags: string[] }> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> keys
  private readonly DEFAULT_TTL = 300; // 5 minutes

  // AC7: Set cache value
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.DEFAULT_TTL;
    const expiresAt = Date.now() + ttl * 1000;
    const tags = options.tags ?? [];

    this.cache.set(key, { value, expiresAt, tags });

    // Index by tags for batch invalidation
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }

    logger.debug('Cache set', { key, ttl, tags: tags.length });
  }

  // AC7: Get cache value
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Check expiry
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return entry.value as T;
  }

  // AC6: Invalidate by tag
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag) ?? new Set();
    let count = 0;

    for (const key of keys) {
      if (this.cache.delete(key)) {
        count++;
      }
    }

    this.tagIndex.delete(tag);
    logger.info('Cache invalidated by tag', { tag, count });

    return count;
  }

  // AC6: Invalidate multiple tags
  invalidateTags(tags: string[]): number {
    let totalCount = 0;
    for (const tag of tags) {
      totalCount += this.invalidateByTag(tag);
    }
    return totalCount;
  }

  // Delete specific key
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      for (const tag of entry.tags) {
        const keys = this.tagIndex.get(tag);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      }
    }
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
    logger.info('Cache cleared');
  }

  // Get cache stats
  getStats() {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.value).length;
    }

    return {
      entries: this.cache.size,
      tags: this.tagIndex.size,
      estimatedSizeKB: (totalSize / 1024).toFixed(2),
    };
  }

  // Cleanup expired entries
  cleanup(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.delete(key);
        count++;
      }
    }

    logger.debug('Cache cleanup', { removed: count });
    return count;
  }
}

export const cacheManager = new CacheManager();

// Run cleanup every minute
setInterval(() => {
  cacheManager.cleanup();
}, 60 * 1000);
