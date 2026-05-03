import { renderHook } from '@testing-library/react';
import { useRecommendations, useRecommendationsForArticles } from '@/hooks/useRecommendations';
import { aiArticles, scienceArticles } from '@/lib/data';
import { describe, it, expect } from 'vitest';

describe('useRecommendations hook', () => {
  it('should return recommendations object with count property', () => {
    const { result } = renderHook(() => useRecommendations({}));

    expect(result.current).toHaveProperty('recommendations');
    expect(result.current).toHaveProperty('count');
    expect(Array.isArray(result.current.recommendations)).toBe(true);
  });

  it('should return fallback recommendations for new users (no read history)', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [],
      count: 5,
    }));

    expect(result.current.recommendations.length).toBeGreaterThan(0);
    expect(result.current.recommendations.length).toBeLessThanOrEqual(5);
  });

  it('should respect count parameter', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [aiArticles[0].id],
      count: 3,
    }));

    expect(result.current.recommendations.length).toBeLessThanOrEqual(3);
  });

  it('should respect maxCount parameter', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [aiArticles[0].id],
      count: 5,
      maxCount: 2,
    }));

    expect(result.current.recommendations.length).toBeLessThanOrEqual(2);
  });

  it('should exclude specified article from recommendations', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [aiArticles[0].id],
      excludeArticleId: aiArticles[1].id,
      count: 10,
    }));

    const hasExcludedArticle = result.current.recommendations.some(
      r => r.id === aiArticles[1].id
    );
    expect(hasExcludedArticle).toBe(false);
  });

  it('should not recommend articles from read history', () => {
    const readIds = [aiArticles[0].id, aiArticles[1].id];
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: readIds,
      count: 5,
    }));

    result.current.recommendations.forEach(rec => {
      expect(readIds).not.toContain(rec.id);
    });
  });

  it('should prefer articles from favorite categories', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [aiArticles[0].id, aiArticles[1].id],
      count: 5,
    }));

    const aiRecommendations = result.current.recommendations.filter(r => r.category === 'AI');
    expect(aiRecommendations.length).toBeGreaterThan(0);
  });

  it('should update recommendations when reading history changes', () => {
    const { result, rerender } = renderHook(
      ({ readIds }) => useRecommendations({ readArticleIds: readIds, count: 5 }),
      { initialProps: { readIds: [aiArticles[0].id] } }
    );

    const firstRecommendations = result.current.recommendations.map(r => r.id);

    rerender({ readIds: [scienceArticles[0].id] });

    const updatedRecommendations = result.current.recommendations.map(r => r.id);

    // Different read history should potentially give different recommendations
    // (Not guaranteed, but likely)
    expect(firstRecommendations).not.toEqual(updatedRecommendations);
  });

  it('should accept liked articles in context', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [aiArticles[0].id],
      likedArticleIds: [aiArticles[1].id],
      count: 5,
    }));

    expect(result.current.recommendations.length).toBeGreaterThan(0);
  });

  it('should accept bookmarked articles in context', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [aiArticles[0].id],
      bookmarkedArticleIds: [scienceArticles[0].id],
      count: 5,
    }));

    expect(result.current.recommendations.length).toBeGreaterThan(0);
  });

  it('should return count property matching recommendations length', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [aiArticles[0].id],
      count: 5,
    }));

    expect(result.current.count).toBe(result.current.recommendations.length);
  });

  it('should handle empty article lists gracefully', () => {
    const { result } = renderHook(() => useRecommendations({
      readArticleIds: [],
      likedArticleIds: [],
      bookmarkedArticleIds: [],
      count: 5,
    }));

    expect(Array.isArray(result.current.recommendations)).toBe(true);
  });
});

describe('useRecommendationsForArticles hook', () => {
  it('should return recommendations based on article ids', () => {
    const { result } = renderHook(() =>
      useRecommendationsForArticles([aiArticles[0].id, aiArticles[1].id], 5)
    );

    expect(result.current.recommendations.length).toBeGreaterThan(0);
  });

  it('should respect count parameter', () => {
    const { result } = renderHook(() =>
      useRecommendationsForArticles([aiArticles[0].id], 3)
    );

    expect(result.current.recommendations.length).toBeLessThanOrEqual(3);
  });

  it('should respect maxCount parameter', () => {
    const { result } = renderHook(() =>
      useRecommendationsForArticles([aiArticles[0].id], 5, 2)
    );

    expect(result.current.recommendations.length).toBeLessThanOrEqual(2);
  });

  it('should exclude specified article', () => {
    const { result } = renderHook(() =>
      useRecommendationsForArticles(
        [aiArticles[0].id],
        5,
        10,
        aiArticles[1].id
      )
    );

    const hasExcludedArticle = result.current.recommendations.some(
      r => r.id === aiArticles[1].id
    );
    expect(hasExcludedArticle).toBe(false);
  });
});
