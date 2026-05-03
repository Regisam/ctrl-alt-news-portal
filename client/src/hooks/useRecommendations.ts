import { useMemo } from 'react';
import {
  getRecommendations,
  getFallbackRecommendations,
  extractUserCategories,
  extractUserTags,
  type RecommendationContext,
} from '@/lib/recommendations';
import { aiArticles, scienceArticles, roboticsArticles, trendingArticles } from '@/lib/data';
import type { Article } from '@/lib/data';

const ALL_ARTICLES: Article[] = [
  ...aiArticles,
  ...scienceArticles,
  ...roboticsArticles,
  ...trendingArticles,
];

interface UseRecommendationsParams {
  readArticleIds?: number[];
  likedArticleIds?: number[];
  bookmarkedArticleIds?: number[];
  count?: number;
  maxCount?: number;
  excludeArticleId?: number; // Exclude current article from recommendations
}

/**
 * Hook to get personalized article recommendations
 * Automatically extracts user preferences from reading history
 */
export function useRecommendations({
  readArticleIds = [],
  likedArticleIds = [],
  bookmarkedArticleIds = [],
  count = 5,
  maxCount = 10,
  excludeArticleId,
}: UseRecommendationsParams) {
  const recommendations = useMemo(() => {
    // Filter out excluded article
    const filteredArticles = ALL_ARTICLES.filter(
      a => a.id !== excludeArticleId
    );

    // If user has no reading history, return fallback recommendations
    if (readArticleIds.length === 0) {
      return getFallbackRecommendations([], filteredArticles, Math.min(count, maxCount));
    }

    // Extract user preferences
    const userCategories = extractUserCategories(readArticleIds, ALL_ARTICLES);
    const userTags = extractUserTags(readArticleIds, ALL_ARTICLES);

    const context: RecommendationContext = {
      readArticleIds,
      likedArticleIds,
      bookmarkedArticleIds,
      userCategories,
      userTags,
    };

    // Get personalized recommendations
    const personalized = getRecommendations(context, filteredArticles, count, maxCount);

    // If not enough personalized recommendations, fill with fallback
    if (personalized.length < count) {
      const remainingSlots = Math.min(maxCount - personalized.length, count);
      const fallback = getFallbackRecommendations(userCategories, filteredArticles, remainingSlots);
      const combined = [
        ...personalized,
        ...fallback.filter(f => !personalized.some(p => p.id === f.id)),
      ];
      return combined.slice(0, Math.min(count, maxCount));
    }

    return personalized;
  }, [readArticleIds, likedArticleIds, bookmarkedArticleIds, count, maxCount, excludeArticleId]);

  return {
    recommendations,
    count: recommendations.length,
  };
}

/**
 * Hook to get recommendations with simulated reading history
 * Useful for testing or displaying recommendations in different contexts
 */
export function useRecommendationsForArticles(
  baseArticleIds: number[],
  count?: number,
  maxCount?: number,
  excludeArticleId?: number
) {
  return useRecommendations({
    readArticleIds: baseArticleIds,
    count,
    maxCount,
    excludeArticleId,
  });
}
