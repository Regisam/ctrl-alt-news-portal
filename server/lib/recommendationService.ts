import { logger } from '../logger.js';

// AC3: Unified recommendation types
export type RecommendationType = 'article' | 'topic' | 'user';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  score: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

class RecommendationService {
  private cache: Map<string, { data: Recommendation[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private deprecationLog: Set<string> = new Set();

  // AC1: Unified recommendation logic
  getRecommendations(
    userId: string,
    type?: RecommendationType,
    limit: number = 10
  ): Recommendation[] {
    // AC5: Check unified cache
    const cacheKey = `recs:${userId}:${type || 'all'}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data.slice(0, limit);
    }

    // AC1: Merge all recommendation sources
    let recommendations: Recommendation[] = [];

    if (!type || type === 'article') {
      recommendations = recommendations.concat(this.getArticleRecommendations(userId));
    }

    if (!type || type === 'topic') {
      recommendations = recommendations.concat(this.getTopicRecommendations(userId));
    }

    if (!type || type === 'user') {
      recommendations = recommendations.concat(this.getUserRecommendations(userId));
    }

    // AC4: Consistent response format (sort by score)
    const sorted = recommendations.sort((a, b) => b.score - a.score);

    // AC5: Cache results
    this.cache.set(cacheKey, {
      data: sorted,
      timestamp: Date.now(),
    });

    return sorted.slice(0, limit);
  }

  // AC1: Article recommendations (from Story 17.4)
  private getArticleRecommendations(userId: string): Recommendation[] {
    return [
      {
        id: 'art-1',
        type: 'article',
        title: 'AI Breakthroughs 2026',
        description: 'Latest developments in artificial intelligence',
        score: 85,
        reason: 'based-on-interests',
        metadata: { category: 'AI', author: 'alice@example.com' },
      },
      {
        id: 'art-2',
        type: 'article',
        title: 'Machine Learning Guide',
        description: 'Complete ML training guide',
        score: 72,
        reason: 'trending',
        metadata: { category: 'ML', views: 5000 },
      },
    ];
  }

  // AC1: Topic recommendations (from Story 13.7)
  private getTopicRecommendations(userId: string): Recommendation[] {
    return [
      {
        id: 'topic-1',
        type: 'topic',
        title: 'Artificial Intelligence',
        description: 'All things AI',
        score: 78,
        reason: 'user-interests',
        metadata: { followerCount: 1200, articles: 45 },
      },
      {
        id: 'topic-2',
        type: 'topic',
        title: 'Machine Learning',
        description: 'ML algorithms and techniques',
        score: 65,
        reason: 'related-topics',
        metadata: { followerCount: 980, articles: 38 },
      },
    ];
  }

  // AC1: User recommendations (from Story 19.3)
  private getUserRecommendations(userId: string): Recommendation[] {
    return [
      {
        id: 'user-1',
        type: 'user',
        title: 'Jane Smith',
        description: 'AI researcher - 1.2K followers',
        score: 88,
        reason: 'similar-interests',
        metadata: { userId: 'user2', followers: 1200, articles: 38 },
      },
      {
        id: 'user-2',
        type: 'user',
        title: 'Bob Wilson',
        description: 'Tech writer - 980 followers',
        score: 72,
        reason: 'friend-of-friend',
        metadata: { userId: 'user3', followers: 980, articles: 30 },
      },
    ];
  }

  // AC2: Get by specific type (backward compatibility)
  getByType(userId: string, type: RecommendationType, limit: number = 10): Recommendation[] {
    return this.getRecommendations(userId, type, limit);
  }

  // AC7: Log deprecation warning
  logDeprecation(oldEndpoint: string): void {
    if (!this.deprecationLog.has(oldEndpoint)) {
      logger.warn(`Deprecated endpoint used: ${oldEndpoint}`, {
        message: 'Please use /api/recommendations instead',
      });
      this.deprecationLog.add(oldEndpoint);
    }
  }

  // AC5: Clear cache for a user
  invalidateCache(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }

  // AC8: Get cache stats
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const recommendationService = new RecommendationService();
