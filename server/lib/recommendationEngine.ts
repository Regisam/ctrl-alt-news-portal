import { logger } from '../logger.js';

// AC1-4: Recommendation types
export interface UserPreferences {
  userId: string;
  interests: Map<string, number>; // category -> score
  readArticles: Set<string>;
  lastUpdated: Date;
}

export interface ArticleFeatures {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: Date;
  views: number;
}

export interface Recommendation {
  articleId: string;
  title: string;
  score: number;
  reason: string;
  category: string;
}

class RecommendationEngine {
  private userPreferences: Map<string, UserPreferences> = new Map();
  private articleCache: Map<string, ArticleFeatures> = new Map();
  private recommendations: Map<string, Recommendation[]> = new Map();
  private metrics: { recommendations: number; clicks: number; clickThroughRate: number } = {
    recommendations: 0,
    clicks: 0,
    clickThroughRate: 0,
  };

  // AC1: Track user interests
  trackUserInterest(userId: string, category: string, weight: number = 1): void {
    let prefs = this.userPreferences.get(userId);

    if (!prefs) {
      prefs = {
        userId,
        interests: new Map(),
        readArticles: new Set(),
        lastUpdated: new Date(),
      };
      this.userPreferences.set(userId, prefs);
    }

    const currentScore = prefs.interests.get(category) || 0;
    prefs.interests.set(category, currentScore + weight);
    prefs.lastUpdated = new Date();

    // AC5: Real-time update
    this.clearRecommendationCache(userId);

    logger.debug('User interest tracked', { userId, category, weight });
  }

  // AC1: Track article read
  trackArticleRead(userId: string, articleId: string, category: string): void {
    this.trackUserInterest(userId, category, 2); // Higher weight for read articles
    let prefs = this.userPreferences.get(userId);

    if (prefs) {
      prefs.readArticles.add(articleId);
    }

    logger.debug('Article read tracked', { userId, articleId, category });
  }

  // AC2: Extract article features
  addArticle(article: ArticleFeatures): void {
    this.articleCache.set(article.id, article);
    this.clearAllRecommendationCache();

    logger.debug('Article added to cache', { articleId: article.id });
  }

  // AC3: Calculate similarity between articles
  calculateSimilarity(article1: ArticleFeatures, article2: ArticleFeatures): number {
    let score = 0;

    // Same category (40%)
    if (article1.category === article2.category) {
      score += 40;
    }

    // Tag overlap (30%)
    const commonTags = new Set([...article1.tags].filter((t) => article2.tags.includes(t)));
    const tagSimilarity = (commonTags.size / Math.max(article1.tags.length, article2.tags.length, 1)) * 100;
    score += (tagSimilarity / 100) * 30;

    // Author similarity (20%)
    if (article1.author === article2.author) {
      score += 20;
    }

    // Recency boost (10%)
    const daysSincePublish = Math.max(
      (Date.now() - article1.publishedAt.getTime()) / (24 * 60 * 60 * 1000),
      0
    );

    if (daysSincePublish < 7) {
      score += 10;
    }

    return score;
  }

  // AC3-4: Generate recommendations
  getRecommendations(userId: string, limit: number = 5): Recommendation[] {
    // AC8: Check cache
    const cached = this.recommendations.get(userId);
    if (cached) {
      logger.debug('Recommendations from cache', { userId });
      return cached.slice(0, limit);
    }

    const prefs = this.userPreferences.get(userId);

    // AC7: Cold start - recommend popular articles
    if (!prefs || prefs.interests.size === 0) {
      const popular = Array.from(this.articleCache.values())
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
        .map((article) => ({
          articleId: article.id,
          title: article.title,
          score: article.views / 100,
          reason: 'Popular article',
          category: article.category,
        }));

      this.metrics.recommendations += popular.length;
      return popular;
    }

    const recommendations: Recommendation[] = [];

    // AC4: Rank articles by preference match
    for (const article of this.articleCache.values()) {
      // AC6: Skip already read articles
      if (prefs.readArticles.has(article.id)) {
        continue;
      }

      // Calculate score based on user preferences
      let score = 0;

      // Category preference (50%)
      const categoryScore = (prefs.interests.get(article.category) || 0) * 2;
      score += Math.min(categoryScore, 50);

      // Tag matching (30%)
      let tagScore = 0;
      for (const tag of article.tags) {
        tagScore += prefs.interests.get(tag) || 0;
      }
      tagScore = (tagScore / Math.max(article.tags.length, 1)) * 30;
      score += Math.min(tagScore, 30);

      // Recency (20%)
      const daysSince = Math.max(
        (Date.now() - article.publishedAt.getTime()) / (24 * 60 * 60 * 1000),
        0
      );

      if (daysSince < 7) {
        score += 20;
      } else if (daysSince < 30) {
        score += 10;
      }

      if (score > 0) {
        recommendations.push({
          articleId: article.id,
          title: article.title,
          score,
          reason: 'Personalized recommendation',
          category: article.category,
        });
      }
    }

    // AC6: Diversify results (avoid all same category)
    const diversified = this.diversifyRecommendations(recommendations, limit);

    // AC8: Cache results
    this.recommendations.set(userId, diversified);

    // AC10: Track metrics
    this.metrics.recommendations += diversified.length;

    logger.debug('Recommendations generated', { userId, count: diversified.length });

    return diversified;
  }

  // AC6: Diversify recommendations
  private diversifyRecommendations(recommendations: Recommendation[], limit: number): Recommendation[] {
    // Sort by score
    const sorted = [...recommendations].sort((a, b) => b.score - a.score);

    // Take top items but ensure category diversity
    const result: Recommendation[] = [];
    const categoryCount = new Map<string, number>();

    for (const rec of sorted) {
      if (result.length >= limit) break;

      const count = categoryCount.get(rec.category) || 0;

      // AC6: Limit same category to 2 in results
      if (count < 2) {
        result.push(rec);
        categoryCount.set(rec.category, count + 1);
      }
    }

    return result;
  }

  // AC10: Track recommendation click
  trackRecommendationClick(userId: string, articleId: string): void {
    this.metrics.clicks++;
    this.metrics.clickThroughRate = this.metrics.clicks / Math.max(this.metrics.recommendations, 1);

    logger.debug('Recommendation clicked', { userId, articleId, ctr: this.metrics.clickThroughRate });
  }

  // AC5: Clear cache on preference change
  private clearRecommendationCache(userId: string): void {
    this.recommendations.delete(userId);
  }

  // Clear all recommendations
  private clearAllRecommendationCache(): void {
    this.recommendations.clear();
  }

  // AC10: Get metrics
  getMetrics() {
    return {
      ...this.metrics,
      usersTracked: this.userPreferences.size,
      articlesInCache: this.articleCache.size,
    };
  }

  // AC9: Performance measurement
  async measurePerformance(userId: string): Promise<{ duration: number }> {
    const start = performance.now();
    this.getRecommendations(userId);
    const duration = performance.now() - start;

    logger.debug('Recommendation performance', { userId, durationMs: duration });

    return { duration };
  }

  // Get user preferences
  getUserPreferences(userId: string): UserPreferences | null {
    return this.userPreferences.get(userId) || null;
  }

  // Clear data
  clear(): void {
    this.userPreferences.clear();
    this.articleCache.clear();
    this.recommendations.clear();
    logger.info('Recommendation engine cleared');
  }
}

export const recommendationEngine = new RecommendationEngine();
