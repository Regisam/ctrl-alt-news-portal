import type { Article } from './data';

export interface EngagementSignals {
  articleId: number;
  reactions: number;
  bookmarks: number;
  shares: number;
  timestamp: number; // When the engagement data was recorded
}

export interface TrendingScore {
  articleId: number;
  score: number;
}


export function calculateTrendingScore(
  reactions: number,
  bookmarks: number,
  shares: number,
  articleDateStr: string
): number {
  // Parse date string (e.g., "Feb 24, 2026") to milliseconds
  const articleDate = new Date(articleDateStr).getTime();
  const now = Date.now();
  const ageMs = now - articleDate;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Time decay multiplier: spec compliance
  // ≤7 days: 1.5x, 8-30 days: 1.0x, >30 days: 0.7x
  let decayMultiplier: number;
  if (ageDays <= 7) {
    decayMultiplier = 1.5;
  } else if (ageDays <= 30) {
    decayMultiplier = 1.0;
  } else {
    decayMultiplier = 0.7;
  }

  // Weighted score: reactions=1x, bookmarks=2x, shares=3x (per spec)
  const baseScore = reactions * 1 + bookmarks * 2 + shares * 3;

  // Apply time decay
  return baseScore * decayMultiplier;
}

export function getTrendingArticles(
  articles: Article[],
  engagementMap: Map<number, EngagementSignals>,
  count: number = 5,
  maxCount: number = 10
): Article[] {
  const limit = Math.min(count, maxCount, articles.length);

  // Calculate trending score for each article
  const scoredArticles = articles.map(article => {
    const engagement = engagementMap.get(article.id);
    const reactions = engagement?.reactions ?? 0;
    const bookmarks = engagement?.bookmarks ?? 0;
    const shares = engagement?.shares ?? 0;

    const score = calculateTrendingScore(reactions, bookmarks, shares, article.date);

    return { article, score };
  });

  // Sort by score (highest first), then by views as tiebreaker
  scoredArticles.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tiebreaker: compare views as strings (already formatted like "48.2K")
    // Extract numeric part for comparison
    const viewsA = parseInt(a.article.views) || 0;
    const viewsB = parseInt(b.article.views) || 0;
    return viewsB - viewsA;
  });

  return scoredArticles.slice(0, limit).map(sa => sa.article);
}

export function getFallbackTrendingArticles(
  articles: Article[],
  count: number = 5,
  maxCount: number = 10
): Article[] {
  // Fallback when no engagement data: sort by views
  const limit = Math.min(count, maxCount, articles.length);

  const viewsSorted = articles
    .slice()
    .sort((a, b) => {
      const viewsA = parseInt(a.views) || 0;
      const viewsB = parseInt(b.views) || 0;
      return viewsB - viewsA;
    });

  return viewsSorted.slice(0, limit);
}

export function extractEngagementSignals(
  articles: Article[],
  reactionMap?: Map<number, number>,
  bookmarkMap?: Map<number, number>,
  shareMap?: Map<number, number>
): Map<number, EngagementSignals> {
  const engagementMap = new Map<number, EngagementSignals>();

  articles.forEach(article => {
    engagementMap.set(article.id, {
      articleId: article.id,
      reactions: reactionMap?.get(article.id) ?? 0,
      bookmarks: bookmarkMap?.get(article.id) ?? 0,
      shares: shareMap?.get(article.id) ?? 0,
      timestamp: Date.now(),
    });
  });

  return engagementMap;
}
