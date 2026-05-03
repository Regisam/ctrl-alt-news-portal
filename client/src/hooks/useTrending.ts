import { useMemo } from 'react';
import type { Article } from '@/lib/data';
import { trendingArticles } from '@/lib/data';
import {
  getTrendingArticles,
  getFallbackTrendingArticles,
  extractEngagementSignals,
} from '@/lib/trending';

interface UseTrendingOptions {
  reactionArticleIds?: number[];
  bookmarkArticleIds?: number[];
  shareArticleIds?: number[];
  count?: number;
  maxCount?: number;
}

interface UseTrendingResult {
  trending: Article[];
}

export function useTrending({
  reactionArticleIds = [],
  bookmarkArticleIds = [],
  shareArticleIds = [],
  count = 5,
  maxCount = 10,
}: UseTrendingOptions = {}): UseTrendingResult {
  const trending = useMemo(() => {
    // Use all available articles for trending calculation
    const allArticles = trendingArticles;

    // Check if we have any engagement data
    const hasEngagementData =
      reactionArticleIds.length > 0 ||
      bookmarkArticleIds.length > 0 ||
      shareArticleIds.length > 0;

    if (!hasEngagementData) {
      // Fallback to view count sorting when no engagement data
      return getFallbackTrendingArticles(allArticles, count, maxCount);
    }

    // Extract engagement signals from provided article IDs (count occurrences)
    const reactionMap = new Map<number, number>();
    reactionArticleIds.forEach(id => {
      reactionMap.set(id, (reactionMap.get(id) ?? 0) + 1);
    });

    const bookmarkMap = new Map<number, number>();
    bookmarkArticleIds.forEach(id => {
      bookmarkMap.set(id, (bookmarkMap.get(id) ?? 0) + 1);
    });

    const shareMap = new Map<number, number>();
    shareArticleIds.forEach(id => {
      shareMap.set(id, (shareMap.get(id) ?? 0) + 1);
    });

    const engagementMap = extractEngagementSignals(
      allArticles,
      reactionMap,
      bookmarkMap,
      shareMap
    );

    return getTrendingArticles(allArticles, engagementMap, count, maxCount);
  }, [reactionArticleIds, bookmarkArticleIds, shareArticleIds, count, maxCount]);

  return { trending };
}
