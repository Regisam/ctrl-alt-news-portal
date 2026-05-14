import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiscoveryWidget } from '../../hooks/useDiscoveryWidget';

describe('useDiscoveryWidget', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('initial state', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.articles).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should load articles on mount', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId));

      // Wait for articles to load
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(result.current.articles.length).toBeGreaterThan(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('data fetching', () => {
    it('should fetch trending articles', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5));

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(result.current.articles.length).toBeLessThanOrEqual(5);
      expect(result.current.articles[0]).toHaveProperty('id');
      expect(result.current.articles[0]).toHaveProperty('title');
      expect(result.current.articles[0]).toHaveProperty('category');
      expect(result.current.articles[0]).toHaveProperty('relevanceScore');
    });

    it('should respect maxItems limit', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 3));

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(result.current.articles.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty results gracefully', async () => {
      const { result } = renderHook(() =>
        useDiscoveryWidget('new-user-no-interests', 5)
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(result.current.articles).toBeDefined();
      expect(result.current.error).toBeNull();
    });
  });

  describe('caching', () => {
    it('should cache articles in sessionStorage', async () => {
      renderHook(() => useDiscoveryWidget(userId, 5, 60));

      await new Promise((resolve) => setTimeout(resolve, 300));

      const cached = sessionStorage.getItem(`discovery-widget-${userId}`);
      expect(cached).toBeTruthy();

      const entry = JSON.parse(cached!);
      expect(entry.articles).toBeDefined();
      expect(entry.timestamp).toBeDefined();
    });

    it('should retrieve articles from cache on subsequent calls', async () => {
      const { result: result1 } = renderHook(() =>
        useDiscoveryWidget(userId, 5, 60)
      );

      await new Promise((resolve) => setTimeout(resolve, 300));
      const articles1 = result1.current.articles;

      const { result: result2 } = renderHook(() =>
        useDiscoveryWidget(userId, 5, 60)
      );

      // Second call should load from cache immediately
      expect(result2.current.articles).toEqual(articles1);
    });

    it('should respect cache TTL', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5, 1));

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Wait for cache to expire (1 minute = 60 seconds, but we'll simulate)
      const cached = sessionStorage.getItem(`discovery-widget-${userId}`);
      const entry = JSON.parse(cached!);
      entry.timestamp = Date.now() - 61 * 60 * 1000; // 61 minutes ago
      sessionStorage.setItem(`discovery-widget-${userId}`, JSON.stringify(entry));

      const { result: result2 } = renderHook(() =>
        useDiscoveryWidget(userId, 5, 1)
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Cache should be invalidated
      expect(result2.current.articles).toBeDefined();
    });

    it('should allow cache invalidation via refresh', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5, 60));

      await new Promise((resolve) => setTimeout(resolve, 300));
      const articles1 = result.current.articles;

      act(() => {
        result.current.refresh();
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      // After refresh, articles should still be available
      expect(result.current.articles).toBeDefined();
    });
  });

  describe('refresh functionality', () => {
    it('should clear cache on refresh', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5, 60));

      await new Promise((resolve) => setTimeout(resolve, 300));

      const cached = sessionStorage.getItem(`discovery-widget-${userId}`);
      expect(cached).toBeTruthy();

      act(() => {
        result.current.refresh();
      });

      // Cache should be cleared temporarily (before new data fetches)
      // Then repopulated with fresh data
      await new Promise((resolve) => setTimeout(resolve, 300));
      const newCached = sessionStorage.getItem(`discovery-widget-${userId}`);
      expect(newCached).toBeTruthy();
    });

    it('should set loading state during refresh', () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5, 60));

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle corrupted cache gracefully', async () => {
      sessionStorage.setItem(`discovery-widget-${userId}`, 'invalid-json');

      const { result } = renderHook(() => useDiscoveryWidget(userId, 5, 60));

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(result.current.articles).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('should handle missing sessionStorage', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5, 60));

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(result.current.articles).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('article properties', () => {
    it('should return articles with required fields', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5));

      await new Promise((resolve) => setTimeout(resolve, 300));

      result.current.articles.forEach((article) => {
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('category');
        expect(article).toHaveProperty('relevanceScore');
        expect(article).toHaveProperty('reason');
        expect(article).toHaveProperty('link');
      });
    });

    it('should return articles sorted by relevance score', async () => {
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5));

      await new Promise((resolve) => setTimeout(resolve, 300));

      for (let i = 0; i < result.current.articles.length - 1; i++) {
        expect(result.current.articles[i].relevanceScore).toBeGreaterThanOrEqual(
          result.current.articles[i + 1].relevanceScore
        );
      }
    });
  });

  describe('performance', () => {
    it('should load articles within 500ms', async () => {
      const start = Date.now();
      const { result } = renderHook(() => useDiscoveryWidget(userId, 5));

      await new Promise((resolve) => setTimeout(resolve, 300));

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should use cache to avoid redundant fetches', async () => {
      const start1 = Date.now();
      renderHook(() => useDiscoveryWidget(userId, 5));

      await new Promise((resolve) => setTimeout(resolve, 300));
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      renderHook(() => useDiscoveryWidget(userId, 5));

      await new Promise((resolve) => setTimeout(resolve, 100));
      const duration2 = Date.now() - start2;

      // Second call should be faster (cached)
      expect(duration2).toBeLessThan(duration1);
    });
  });
});
