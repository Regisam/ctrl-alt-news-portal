import { logger } from '../logger.js';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// AC7: Sliding window algorithm (more accurate than fixed buckets)
class SlidingWindowStore {
  private data: Map<string, RequestRecord[]> = new Map();
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanup = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, records] of this.data.entries()) {
      const filtered = records.filter((r) => r.resetTime > now);
      if (filtered.length === 0) {
        this.data.delete(key);
      } else if (filtered.length < records.length) {
        this.data.set(key, filtered);
      }
    }
  }

  isLimited(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let records = this.data.get(key) || [];
    records = records.filter((r) => r.resetTime > windowStart);

    const totalRequests = records.reduce((sum, r) => sum + r.count, 0);

    if (totalRequests >= config.maxRequests) {
      return true; // Limited
    }

    // Record this request
    if (records.length === 0 || records[records.length - 1].resetTime < now) {
      records.push({ count: 1, resetTime: now + config.windowMs });
    } else {
      records[records.length - 1].count += 1;
    }

    this.data.set(key, records);
    return false; // Not limited
  }

  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const records = (this.data.get(key) || []).filter((r) => r.resetTime > windowStart);
    const totalRequests = records.reduce((sum, r) => sum + r.count, 0);

    return Math.max(0, config.maxRequests - totalRequests);
  }

  getResetTime(key: string): number {
    const records = this.data.get(key);
    if (!records || records.length === 0) return Date.now();

    // Return the reset time of the oldest request
    return records[0].resetTime;
  }

  resetKey(key: string) {
    this.data.delete(key);
  }

  resetAll() {
    this.data.clear();
  }

  getStats() {
    return {
      keys: this.data.size,
      totalRecords: Array.from(this.data.values()).reduce((sum, records) => sum + records.length, 0),
    };
  }

  destroy() {
    clearInterval(this.cleanup);
    this.data.clear();
  }
}

// AC8: Redis support (optional)
class RedisRateLimitStore {
  private client: any; // Redis client

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async isLimited(key: string, config: RateLimitConfig): Promise<boolean> {
    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // ZADD with INCR equivalent for sliding window
      const count = await this.client.zcard(`rate:${key}`);

      if (count >= config.maxRequests) {
        // Clean expired entries
        await this.client.zremrangebyscore(`rate:${key}`, 0, windowStart);
        return true;
      }

      // Add current request
      await this.client.zadd(`rate:${key}`, now, `${now}-${Math.random()}`);

      // Set expiry
      await this.client.expire(`rate:${key}`, Math.ceil(config.windowMs / 1000));

      return false;
    } catch (error) {
      logger.warn('Redis rate limit error, falling back to allow', { error });
      return false; // Fail open
    }
  }

  async getRemainingRequests(key: string, config: RateLimitConfig): Promise<number> {
    try {
      const count = await this.client.zcard(`rate:${key}`);
      return Math.max(0, config.maxRequests - count);
    } catch {
      return config.maxRequests; // Fail open
    }
  }

  async getResetTime(key: string): Promise<number> {
    try {
      const oldest = await this.client.zrange(`rate:${key}`, 0, 0, 'WITHSCORES');
      return oldest.length > 1 ? parseInt(oldest[1]) : Date.now();
    } catch {
      return Date.now();
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await this.client.del(`rate:${key}`);
    } catch (error) {
      logger.warn('Failed to reset rate limit key', { key, error });
    }
  }

  async resetAll(): Promise<void> {
    try {
      const keys = await this.client.keys('rate:*');
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.warn('Failed to reset all rate limits', { error });
    }
  }
}

// Factory: choose store based on config
export function createRateLimitStore(useRedis: boolean = false, redisClient?: any) {
  if (useRedis && redisClient) {
    logger.info('Using Redis for rate limiting');
    return new RedisRateLimitStore(redisClient);
  }

  logger.info('Using in-memory sliding window for rate limiting');
  return new SlidingWindowStore();
}

export { SlidingWindowStore, RedisRateLimitStore };
