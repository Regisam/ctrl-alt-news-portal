import { renderHook, waitFor } from '@testing-library/react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { aiArticles, scienceArticles, roboticsArticles, trendingArticles } from '@/lib/data';
import { describe, it, expect } from 'vitest';

describe('useRecommendations hook', () => {
  const allArticles = [...aiArticles, ...scienceArticles, ...roboticsArticles, ...trendingArticles];

  it('should return recommendations object with proper structure', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 3,
    }));

    await waitFor(() => {
      expect(result.current).toHaveProperty('recommendations');
      expect(result.current).toHaveProperty('firedRules');
      expect(result.current).toHaveProperty('executionTime');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('cacheHit');
    });

    expect(Array.isArray(result.current.recommendations)).toBe(true);
    expect(Array.isArray(result.current.firedRules)).toBe(true);
  });

  it('should return recommendations with articles parameter', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: aiArticles,
      count: 3,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendations.length).toBeGreaterThan(0);
    expect(result.current.recommendations.length).toBeLessThanOrEqual(3);
  });

  it('should respect count parameter', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 2,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendations.length).toBeLessThanOrEqual(2);
  });

  it('should exclude specified article from recommendations', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: allArticles,
      excludeArticleId: aiArticles[0].id,
      count: 5,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const hasExcludedArticle = result.current.recommendations.some(
      r => r.id === aiArticles[0].id
    );
    expect(hasExcludedArticle).toBe(false);
  });

  it('should track execution time', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 3,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.executionTime).toBeGreaterThanOrEqual(0);
  });

  it('should fire rules and track them', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 3,
      enableLogging: false,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(Array.isArray(result.current.firedRules)).toBe(true);
  });

  it('should cache results on subsequent calls', async () => {
    const { result, rerender } = renderHook(
      ({ articles }) => useRecommendations({ articles, count: 3 }),
      { initialProps: { articles: allArticles } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstCacheHit = result.current.cacheHit;

    rerender({ articles: allArticles });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Second call should use cache
    expect(result.current.cacheHit).toBe(true);
  });

  it('should handle empty articles array', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: [],
      count: 3,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(Array.isArray(result.current.recommendations)).toBe(true);
  });

  it('should return performance metrics', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 3,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.executionTime).toBeLessThan(100); // Should be very fast
  });

  it('should handle logging parameter', async () => {
    const { result } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 3,
      enableLogging: true,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendations.length).toBeGreaterThan(0);
  });

  it('should return consistent results for same input', async () => {
    const { result: result1 } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 3,
    }));

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    const ids1 = result1.current.recommendations.map(r => r.id);

    const { result: result2 } = renderHook(() => useRecommendations({
      articles: allArticles,
      count: 3,
    }));

    await waitFor(() => {
      expect(result2.current.isLoading).toBe(false);
    });

    const ids2 = result2.current.recommendations.map(r => r.id);

    expect(ids1).toEqual(ids2);
  });

  it('should handle large article lists', async () => {
    const largeList = [...allArticles, ...allArticles, ...allArticles];

    const { result } = renderHook(() => useRecommendations({
      articles: largeList,
      count: 5,
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recommendations.length).toBeLessThanOrEqual(5);
  });
});
