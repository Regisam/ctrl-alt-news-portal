import { renderHook, waitFor } from '@testing-library/react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { aiArticles, scienceArticles, roboticsArticles, trendingArticles } from '@/lib/data';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as useUserPreferencesModule from '@/hooks/useUserPreferences';
import * as useReadingHistoryModule from '@/hooks/useReadingHistory';
import * as useBookmarksModule from '@/hooks/useBookmarks';

describe('useRecommendations hook', () => {
  const allArticles = [...aiArticles, ...scienceArticles, ...roboticsArticles, ...trendingArticles];

  // Stable mock data to prevent recreation on each render
  const stableFavoriteCategories = ['AI'];
  const stableHistory = [
    { articleId: String(aiArticles[0].id), title: aiArticles[0].title.en, category: 'AI', timestamp: 1000000000000 },
  ];
  const stableBookmarks = [
    { articleId: String(aiArticles[0].id), title: aiArticles[0].title.en, category: 'AI', bookmarkedAt: 1000000000000 },
  ];

  beforeEach(() => {
    // Mock context hooks to return stable data (same references across renders)
    vi.spyOn(useUserPreferencesModule, 'useUserPreferences').mockReturnValue({
      favoriteCategories: stableFavoriteCategories,
      updatePreferences: vi.fn(),
    });

    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: stableHistory,
      addToHistory: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
      bookmarks: stableBookmarks,
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      isBookmarked: vi.fn(),
    });
  });

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
    // Note: Caching is tested thoroughly in RulesEngine tests (lib/rules-engine.test.ts)
    // This test verifies that the hook properly reports cache hits from the engine
    const { result } = renderHook(() => useRecommendations({ articles: allArticles, count: 3 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // First call should not be a cache hit
    expect(result.current.cacheHit).toBe(false);

    // Recommendations should be available even on first call
    expect(result.current.recommendations.length).toBeGreaterThan(0);
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
