import Redis, { Cluster } from 'ioredis';

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private metrics: CacheMetrics = { hits: 0, misses: 0, hitRate: 0 };
  private debugMode: boolean = process.env.NODE_ENV === 'development';

  async connect(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        enableReadyCheck: true,
        enableOfflineQueue: true,
      });

      this.redis.on('error', (err: Error) => {
        console.error('[Cache] Redis connection error:', err.message);
      });

      this.redis.on('connect', () => {
        if (this.debugMode) console.log('[Cache] Connected to Redis');
      });

      this.redis.on('close', () => {
        if (this.debugMode) console.log('[Cache] Redis connection closed');
      });

      await this.redis.ping();
      if (this.debugMode) console.log('[Cache] Redis health check passed');
    } catch (error) {
      console.error('[Cache] Failed to connect to Redis:', error);
      this.redis = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      this.metrics.misses++;
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (value) {
        this.metrics.hits++;
        this.updateHitRate();
        if (this.debugMode) console.log(`[Cache:HIT] ${key}`);
        return JSON.parse(value) as T;
      }
      this.metrics.misses++;
      this.updateHitRate();
      if (this.debugMode) console.log(`[Cache:MISS] ${key}`);
      return null;
    } catch (error) {
      console.error(`[Cache] Get error for key ${key}:`, error);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    if (!this.redis) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      if (this.debugMode) console.log(`[Cache:SET] ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`[Cache] Set error for key ${key}:`, error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    if (!this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        if (this.debugMode) console.log(`[Cache:INVALIDATE] ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error(`[Cache] Invalidate error for pattern ${pattern}:`, error);
    }
  }

  async clear(): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.flushdb();
      if (this.debugMode) console.log('[Cache] All keys cleared');
    } catch (error) {
      console.error('[Cache] Clear error:', error);
    }
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  isConnected(): boolean {
    return this.redis?.status === 'ready' || false;
  }

  async health(): Promise<{ status: 'ok' | 'error'; message: string }> {
    if (!this.redis) {
      return { status: 'error', message: 'Redis not connected' };
    }

    try {
      await this.redis.ping();
      return { status: 'ok', message: 'Redis is healthy' };
    } catch (error) {
      return { status: 'error', message: `Redis health check failed: ${error}` };
    }
  }
}

export const cacheService = new CacheService();
