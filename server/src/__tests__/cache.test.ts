import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { cacheService } from '../services/cache';

describe('CacheService', () => {
  beforeAll(async () => {
    await cacheService.connect();
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  it('should set and get values', async () => {
    const testData = { id: 1, name: 'Test Article', views: 100 };
    await cacheService.set('test:article', testData, 60);

    const cached = await cacheService.get('test:article');
    expect(cached).toEqual(testData);
  });

  it('should return null for non-existent keys', async () => {
    const result = await cacheService.get('nonexistent:key');
    expect(result).toBeNull();
  });

  it('should invalidate keys by pattern', async () => {
    await cacheService.set('articles:1', { id: 1 }, 60);
    await cacheService.set('articles:2', { id: 2 }, 60);

    await cacheService.invalidate('articles:*');

    const result1 = await cacheService.get('articles:1');
    const result2 = await cacheService.get('articles:2');

    expect(result1).toBeNull();
    expect(result2).toBeNull();
  });

  it('should track cache hits and misses', async () => {
    await cacheService.clear();
    const initialMetrics = cacheService.getMetrics();

    await cacheService.set('test:hit', { data: 'test' }, 60);
    await cacheService.get('test:hit'); // Hit
    await cacheService.get('nonexistent'); // Miss

    const metrics = cacheService.getMetrics();
    expect(metrics.hits).toBeGreaterThan(initialMetrics.hits);
    expect(metrics.misses).toBeGreaterThan(initialMetrics.misses);
    expect(metrics.hitRate).toBeGreaterThanOrEqual(0);
    expect(metrics.hitRate).toBeLessThanOrEqual(100);
  });

  it('should check health status', async () => {
    const health = await cacheService.health();
    expect(health.status).toBe('ok');
    expect(health.message).toBeDefined();
  });

  it('should handle TTL expiration', async () => {
    await cacheService.set('ttl:test', { data: 'expire' }, 1);
    const immediately = await cacheService.get('ttl:test');
    expect(immediately).toBeTruthy();

    // Wait for expiration (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const afterExpiry = await cacheService.get('ttl:test');
    expect(afterExpiry).toBeNull();
  });
});
