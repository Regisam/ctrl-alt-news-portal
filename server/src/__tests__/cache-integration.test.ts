import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';
import { cacheService } from '../services/cache';

const BASE_URL = 'http://localhost:3000/api';

describe('Cache Integration Tests', () => {
  beforeAll(async () => {
    await cacheService.connect();
  });

  afterAll(async () => {
    await cacheService.disconnect();
  });

  describe('GET /articles endpoint', () => {
    it('should return articles with cache HIT on second request', async () => {
      const response1 = await fetch(`${BASE_URL}/articles`);
      const data1 = (await response1.json()) as any;
      expect(data1._cache).toBe('MISS');
      expect(data1.success).toBe(true);
      expect(Array.isArray(data1.data.articles)).toBe(true);

      const response2 = await fetch(`${BASE_URL}/articles`);
      const data2 = (await response2.json()) as any;
      expect(data2._cache).toBe('HIT');
      expect(data2.data).toEqual(data1.data);
    });
  });

  describe('GET /categories endpoint', () => {
    it('should return categories with cache HIT on second request', async () => {
      const response1 = await fetch(`${BASE_URL}/categories`);
      const data1 = (await response1.json()) as any;
      expect(data1._cache).toBe('MISS');
      expect(Array.isArray(data1.data)).toBe(true);

      const response2 = await fetch(`${BASE_URL}/categories`);
      const data2 = (await response2.json()) as any;
      expect(data2._cache).toBe('HIT');
      expect(data2.data).toEqual(data1.data);
    });
  });

  describe('GET /cache/health endpoint', () => {
    it('should return cache health status', async () => {
      const response = await fetch(`${BASE_URL}/cache/health`);
      const data = (await response.json()) as any;
      expect(data.success).toBe(true);
      expect(data.health.status).toBe('ok');
      expect(typeof data.metrics.hits).toBe('number');
      expect(typeof data.metrics.misses).toBe('number');
      expect(typeof data.metrics.hitRate).toBe('number');
    });
  });

  describe('Cache metrics tracking', () => {
    it('should accurately track hits and misses', async () => {
      await cacheService.clear();
      const initialMetrics = cacheService.getMetrics();

      await fetch(`${BASE_URL}/articles`);
      await fetch(`${BASE_URL}/articles`);
      await fetch(`${BASE_URL}/categories`);

      const finalMetrics = cacheService.getMetrics();
      expect(finalMetrics.hits).toBeGreaterThan(initialMetrics.hits);
      expect(finalMetrics.misses).toBeGreaterThan(initialMetrics.misses);
      expect(finalMetrics.hitRate).toBeGreaterThanOrEqual(0);
      expect(finalMetrics.hitRate).toBeLessThanOrEqual(100);
    });
  });
});
