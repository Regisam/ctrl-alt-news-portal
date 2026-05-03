import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useTrending } from '@/hooks/useTrending';

// Mock the data
vi.mock('@/lib/data', () => ({
  trendingArticles: [
    {
      id: 1,
      title: { en: 'Article 1', pt: 'Artigo 1' },
      excerpt: { en: 'Excerpt 1', pt: 'Resumo 1' },
      category: 'AI' as const,
      author: 'Author 1',
      date: 'Feb 24, 2026',
      readTime: '5 min',
      views: '1000',
      image: 'img1.jpg',
    },
    {
      id: 2,
      title: { en: 'Article 2', pt: 'Artigo 2' },
      excerpt: { en: 'Excerpt 2', pt: 'Resumo 2' },
      category: 'SCIENCE' as const,
      author: 'Author 2',
      date: 'Feb 23, 2026',
      readTime: '7 min',
      views: '2000',
      image: 'img2.jpg',
    },
    {
      id: 3,
      title: { en: 'Article 3', pt: 'Artigo 3' },
      excerpt: { en: 'Excerpt 3', pt: 'Resumo 3' },
      category: 'ROBOTICS' as const,
      author: 'Author 3',
      date: 'Feb 22, 2026',
      readTime: '6 min',
      views: '500',
      image: 'img3.jpg',
    },
  ],
}));

describe('useTrending', () => {
  it('should return trending array from hook', () => {
    const { result } = renderHook(() => useTrending());

    expect(result.current).toHaveProperty('trending');
    expect(Array.isArray(result.current.trending)).toBe(true);
  });

  it('should return fallback trending when no engagement data', () => {
    const { result } = renderHook(() => useTrending({}));

    expect(result.current.trending.length).toBeGreaterThan(0);
    // Should be sorted by views
    expect(result.current.trending[0].views).toBe('2000');
  });

  it('should respect count parameter', () => {
    const { result } = renderHook(() =>
      useTrending({
        count: 2,
        maxCount: 10,
      })
    );

    expect(result.current.trending.length).toBeLessThanOrEqual(2);
  });

  it('should respect maxCount parameter', () => {
    const { result } = renderHook(() =>
      useTrending({
        count: 5,
        maxCount: 1,
      })
    );

    expect(result.current.trending.length).toBeLessThanOrEqual(1);
  });

  it('should use count and maxCount correctly', () => {
    const { result } = renderHook(() =>
      useTrending({
        count: 3,
        maxCount: 2,
      })
    );

    // Should use min(count, maxCount) = 2
    expect(result.current.trending.length).toBeLessThanOrEqual(2);
  });

  it('should calculate trending based on reaction signals', () => {
    const { result } = renderHook(() =>
      useTrending({
        reactionArticleIds: [1, 1, 1, 2, 3],
        count: 3,
        maxCount: 10,
      })
    );

    expect(result.current.trending.length).toBeGreaterThan(0);
    // Article 1 has most reactions, should be first
    expect(result.current.trending[0].id).toBe(1);
  });

  it('should calculate trending based on bookmark signals', () => {
    const { result } = renderHook(() =>
      useTrending({
        bookmarkArticleIds: [2, 2, 2, 2, 1, 3],
        count: 3,
        maxCount: 10,
      })
    );

    expect(result.current.trending.length).toBeGreaterThan(0);
    // Article 2 has most bookmarks, should be first
    expect(result.current.trending[0].id).toBe(2);
  });

  it('should calculate trending based on share signals', () => {
    const { result } = renderHook(() =>
      useTrending({
        shareArticleIds: [3, 3, 3, 3, 3, 1, 2],
        count: 3,
        maxCount: 10,
      })
    );

    expect(result.current.trending.length).toBeGreaterThan(0);
    // Article 3 has most shares (highest weight), should be first
    expect(result.current.trending[0].id).toBe(3);
  });

  it('should combine all engagement signals', () => {
    const { result } = renderHook(() =>
      useTrending({
        reactionArticleIds: [1, 1],
        bookmarkArticleIds: [2, 2],
        shareArticleIds: [3],
        count: 3,
        maxCount: 10,
      })
    );

    expect(result.current.trending.length).toBeGreaterThan(0);
  });

  it('should update when engagement data changes', () => {
    const { result, rerender } = renderHook(
      ({ reactionIds }) =>
        useTrending({
          reactionArticleIds: reactionIds,
          count: 3,
          maxCount: 10,
        }),
      { initialProps: { reactionIds: [1, 1, 1] } }
    );

    const firstResult = result.current.trending.map(a => a.id);

    rerender({ reactionIds: [3, 3, 3] });

    const secondResult = result.current.trending.map(a => a.id);

    // Results should be different due to different engagement
    expect(firstResult).not.toEqual(secondResult);
  });

  it('should recalculate when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ reactionIds }) =>
        useTrending({
          reactionArticleIds: reactionIds,
          count: 2,
          maxCount: 10,
        }),
      { initialProps: { reactionIds: [1, 1] } }
    );

    const firstCount = result.current.trending.length;

    rerender({ reactionIds: [2, 2, 2] });

    const secondCount = result.current.trending.length;

    // Both should have trending articles
    expect(firstCount).toBeGreaterThan(0);
    expect(secondCount).toBeGreaterThan(0);
  });

  it('should handle empty engagement arrays', () => {
    const { result } = renderHook(() =>
      useTrending({
        reactionArticleIds: [],
        bookmarkArticleIds: [],
        shareArticleIds: [],
        count: 3,
        maxCount: 10,
      })
    );

    expect(result.current.trending.length).toBeGreaterThan(0);
  });

  it('should handle default parameters', () => {
    const { result } = renderHook(() => useTrending());

    expect(result.current.trending).toBeDefined();
    expect(Array.isArray(result.current.trending)).toBe(true);
  });

  it('should return at most maxCount articles', () => {
    const { result } = renderHook(() =>
      useTrending({
        reactionArticleIds: [1, 1, 1],
        count: 100,
        maxCount: 2,
      })
    );

    expect(result.current.trending.length).toBeLessThanOrEqual(2);
  });
});
