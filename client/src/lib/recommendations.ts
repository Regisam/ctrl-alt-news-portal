import type { Article } from './data';

export interface RecommendationContext {
  readArticleIds: number[];
  likedArticleIds: number[];
  bookmarkedArticleIds: number[];
  userCategories: string[]; // User's favorite categories
  userTags: string[];
}

/**
 * Calculate tag similarity score between two sets of tags (Jaccard similarity)
 */
function calculateTagSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 && tags2.length === 0) return 0;

  const normalized1 = tags1.map(t => t.toLowerCase());
  const normalized2 = tags2.map(t => t.toLowerCase());

  const intersection = normalized1.filter(t => normalized2.includes(t)).length;
  const combined = new Set([...normalized1, ...normalized2]);

  return combined.size === 0 ? 0 : intersection / combined.size;
}

/**
 * Calculate recommendation score for an article
 * Factors: category match, tag similarity, engagement signals
 */
function calculateScore(
  article: Article,
  context: RecommendationContext,
  allArticles: Article[]
): number {
  let score = 0;

  // 1. Category preference (40% weight)
  const categoryMatch = context.userCategories.includes(article.category);
  if (categoryMatch) {
    score += 40;
  } else {
    // Give small boost if related to read articles in same category
    const relatedReadArticles = allArticles.filter(
      a => a.category === article.category && context.readArticleIds.includes(a.id)
    );
    score += (relatedReadArticles.length / Math.max(1, context.readArticleIds.length)) * 20;
  }

  // 2. Tag similarity (30% weight)
  const tagSimilarity = calculateTagSimilarity(article.tags || [], context.userTags);
  score += tagSimilarity * 30;

  // 3. Engagement signal boost (20% weight)
  // Articles in same category as liked/bookmarked articles get boost
  const engagementBoost = (
    (context.likedArticleIds.filter(id => {
      const a = allArticles.find(art => art.id === id);
      return a?.category === article.category;
    }).length / Math.max(1, context.likedArticleIds.length)) +
    (context.bookmarkedArticleIds.filter(id => {
      const a = allArticles.find(art => art.id === id);
      return a?.category === article.category;
    }).length / Math.max(1, context.bookmarkedArticleIds.length))
  ) / 2;
  score += engagementBoost * 20;

  // 4. Recency bonus (10% weight) - newer articles slightly preferred
  const daysSincePublish = (Date.now() - new Date(article.date).getTime()) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 1 - daysSincePublish / 90); // 0-1 over 90 days
  score += recencyBonus * 10;

  return score;
}

/**
 * Get personalized recommendations for a user
 * Returns 5-10 articles based on reading history and preferences
 */
export function getRecommendations(
  context: RecommendationContext,
  allArticles: Article[],
  count: number = 5,
  maxCount: number = 10
): Article[] {
  // Filter out already read articles
  const candidateArticles = allArticles.filter(
    article => !context.readArticleIds.includes(article.id)
  );

  // If no candidates, return empty
  if (candidateArticles.length === 0) {
    return [];
  }

  // Calculate scores for all candidates
  const scoredArticles = candidateArticles.map(article => ({
    article,
    score: calculateScore(article, context, allArticles),
  }));

  // Sort by score descending
  scoredArticles.sort((a, b) => b.score - a.score);

  // Return top articles respecting both count and maxCount limits
  const recommendedCount = Math.min(count, maxCount, scoredArticles.length);
  return scoredArticles.slice(0, recommendedCount).map(({ article }) => article);
}

/**
 * Get fallback recommendations for new users (no reading history)
 * Returns random articles from favorite categories
 */
export function getFallbackRecommendations(
  userCategories: string[],
  allArticles: Article[],
  count: number = 5
): Article[] {
  // If user has no favorite categories, return random articles
  if (userCategories.length === 0) {
    const shuffled = [...allArticles].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Filter articles by user's favorite categories
  const candidateArticles = allArticles.filter(article =>
    userCategories.includes(article.category)
  );

  // If not enough articles in favorite categories, add more
  if (candidateArticles.length < count) {
    const additionalArticles = allArticles
      .filter(a => !candidateArticles.includes(a))
      .sort(() => Math.random() - 0.5);
    candidateArticles.push(...additionalArticles.slice(0, count - candidateArticles.length));
  }

  // Shuffle and return
  return candidateArticles
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

/**
 * Extract user's favorite categories from reading history
 */
export function extractUserCategories(
  readArticleIds: number[],
  allArticles: Article[]
): string[] {
  if (readArticleIds.length === 0) return [];

  const categoryCount: Record<string, number> = {};
  readArticleIds.forEach(id => {
    const article = allArticles.find(a => a.id === id);
    if (article) {
      categoryCount[article.category] = (categoryCount[article.category] || 0) + 1;
    }
  });

  // Return categories sorted by frequency (top 3)
  return Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);
}

/**
 * Extract common tags from user's read articles
 */
export function extractUserTags(
  readArticleIds: number[],
  allArticles: Article[]
): string[] {
  if (readArticleIds.length === 0) return [];

  const tagCount: Record<string, number> = {};
  readArticleIds.forEach(id => {
    const article = allArticles.find(a => a.id === id);
    if (article?.tags) {
      article.tags.forEach(tag => {
        tagCount[tag.toLowerCase()] = (tagCount[tag.toLowerCase()] || 0) + 1;
      });
    }
  });

  // Return top 5 tags
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);
}
