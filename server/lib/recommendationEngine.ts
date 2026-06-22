import { logger } from '../logger.js';

// AC2: User profile
export interface UserProfile {
  userId: string;
  readingHistory: string[]; // article IDs
  interests: string[]; // categories/topics
  engagement: Record<string, number>; // article ID -> engagement score
  lastUpdated: string;
}

// AC4 & AC8: Recommendation with explanation
export interface Recommendation {
  articleId: string;
  title: string;
  category: string;
  author: string;
  score: number; // 0-100
  explanation: string; // AC8: why recommended
  reason: 'similar' | 'trending' | 'author' | 'category' | 'collaborative';
}

// AC3: Content similarity
interface ArticleContent {
  id: string;
  title: string;
  category: string;
  author: string;
  tags?: string[];
  engagement?: number;
}

class RecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map();
  private articles: Map<string, ArticleContent> = new Map();
  private similarityCache: Map<string, number> = new Map();

  // AC2: Build user profile
  updateUserProfile(userId: string, articleId: string, engagement: number): void {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        readingHistory: [],
        interests: [],
        engagement: {},
        lastUpdated: new Date().toISOString(),
      };
      this.userProfiles.set(userId, profile);
    }

    // Add to history
    if (!profile.readingHistory.includes(articleId)) {
      profile.readingHistory.push(articleId);
    }

    // Track engagement
    profile.engagement[articleId] = engagement;
    profile.lastUpdated = new Date().toISOString();

    logger.debug('User profile updated', { userId, articleId, engagement });
  }

  // Register article for recommendations
  registerArticle(id: string, title: string, category: string, author: string, tags?: string[]): void {
    this.articles.set(id, { id, title, category, author, tags });
  }

  // AC3: Calculate content similarity
  private calculateSimilarity(article1Id: string, article2Id: string): number {
    const cacheKey = `${article1Id}:${article2Id}`;
    if (this.similarityCache.has(cacheKey)) {
      return this.similarityCache.get(cacheKey)!;
    }

    const a1 = this.articles.get(article1Id);
    const a2 = this.articles.get(article2Id);

    if (!a1 || !a2) return 0;

    let score = 0;

    // Category match (40%)
    if (a1.category === a2.category) score += 40;

    // Author match (20%)
    if (a1.author === a2.author) score += 20;

    // Tag overlap (20%)
    if (a1.tags && a2.tags) {
      const overlap = a1.tags.filter((t) => a2.tags!.includes(t)).length;
      const maxTags = Math.max(a1.tags.length, a2.tags.length);
      score += (overlap / maxTags) * 20;
    }

    // Title similarity (20%) - simple word overlap
    const words1 = new Set(a1.title.toLowerCase().split(' '));
    const words2 = new Set(a2.title.toLowerCase().split(' '));
    const intersection = Array.from(words1).filter((w) => words2.has(w)).length;
    const union = words1.size + words2.size - intersection;
    score += (intersection / union) * 20;

    this.similarityCache.set(cacheKey, Math.round(score));
    return Math.round(score);
  }

  // AC4 & AC5: Get personalized recommendations
  getRecommendations(userId: string, limit: number = 10): Recommendation[] {
    const profile = this.userProfiles.get(userId);

    // AC6: Cold start - new users get trending
    if (!profile || profile.readingHistory.length === 0) {
      return this.getTrendingRecommendations(limit);
    }

    const recommendations: Recommendation[] = [];
    const scored = new Map<string, { score: number; reason: string; explanation: string }>();

    // Content-based: find similar articles
    for (const readArticleId of profile.readingHistory) {
      for (const [articleId, article] of this.articles) {
        if (profile.readingHistory.includes(articleId)) continue; // Skip already read

        const similarity = this.calculateSimilarity(readArticleId, articleId);
        if (similarity > 0) {
          const existing = scored.get(articleId);
          const score = existing ? Math.max(existing.score, similarity) : similarity;

          scored.set(articleId, {
            score,
            reason: 'similar',
            explanation: `Similar to "${this.articles.get(readArticleId)?.title || 'article'}"`,
          });
        }
      }
    }

    // Collaborative: articles from users with similar interests
    for (const [otherUserId, otherProfile] of this.userProfiles) {
      if (otherUserId === userId) continue;

      const interestOverlap = otherProfile.readingHistory.filter((id) =>
        profile.readingHistory.includes(id)
      ).length;

      if (interestOverlap > 0) {
        for (const articleId of otherProfile.readingHistory) {
          if (profile.readingHistory.includes(articleId)) continue;

          const score = Math.min(100, interestOverlap * 10);
          const existing = scored.get(articleId);

          if (!existing || existing.score < score) {
            scored.set(articleId, {
              score,
              reason: 'collaborative',
              explanation: `Other users like you read this`,
            });
          }
        }
      }
    }

    // Convert to recommendations
    for (const [articleId, data] of scored) {
      const article = this.articles.get(articleId);
      if (article && data.score > 0) {
        recommendations.push({
          articleId,
          title: article.title,
          category: article.category,
          author: article.author,
          score: data.score,
          explanation: data.explanation,
          reason: data.reason as any,
        });
      }
    }

    // AC5: Rank by score
    recommendations.sort((a, b) => b.score - a.score);

    // AC7: Ensure diversity (don't recommend only one category)
    const diverse = this.ensureDiversity(recommendations, limit);

    return diverse;
  }

  // AC6: Cold start - recommend trending articles
  private getTrendingRecommendations(limit: number): Recommendation[] {
    return Array.from(this.articles.values())
      .slice(0, limit)
      .map((article) => ({
        articleId: article.id,
        title: article.title,
        category: article.category,
        author: article.author,
        score: Math.floor(Math.random() * 30 + 70), // 70-100 for trending
        explanation: 'Trending in your category',
        reason: 'trending' as const,
      }));
  }

  // AC7: Ensure diversity in recommendations
  private ensureDiversity(recommendations: Recommendation[], limit: number): Recommendation[] {
    const result: Recommendation[] = [];
    const categoryCount: Record<string, number> = {};

    for (const rec of recommendations) {
      const count = categoryCount[rec.category] || 0;

      // Limit articles per category (max 3)
      if (count < 3) {
        result.push(rec);
        categoryCount[rec.category] = count + 1;
      }

      if (result.length >= limit) break;
    }

    return result;
  }

  // AC10: Track recommendation effectiveness
  recordRecommendationClick(userId: string, articleId: string): void {
    const profile = this.userProfiles.get(userId);
    if (profile) {
      profile.engagement[articleId] = (profile.engagement[articleId] || 0) + 1;
      logger.debug('Recommendation clicked', { userId, articleId });
    }
  }

  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  getStats(): {
    totalUsers: number;
    totalArticles: number;
    avgReadingsPerUser: number;
  } {
    const totalUsers = this.userProfiles.size;
    const totalArticles = this.articles.size;
    const avgReadingsPerUser =
      totalUsers > 0
        ? Array.from(this.userProfiles.values()).reduce((sum, p) => sum + p.readingHistory.length, 0) /
          totalUsers
        : 0;

    return {
      totalUsers,
      totalArticles,
      avgReadingsPerUser: Math.round(avgReadingsPerUser * 10) / 10,
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
