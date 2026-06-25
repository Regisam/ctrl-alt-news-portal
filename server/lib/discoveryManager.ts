import { logger } from '../logger.js';

// AC7: Recommendation with score
export interface UserRecommendation {
  userId: string;
  displayName: string;
  bio: string;
  expertiseTags: string[];
  score: number;
  reason: 'interest-based' | 'activity-based' | 'trending' | 'new' | 'similar';
}

class DiscoveryManager {
  private discoveryCache: Map<string, UserRecommendation[]> = new Map();
  private discoveryHistory: Map<string, Set<string>> = new Map(); // userId -> viewed userIds
  private trendingCache: Map<string, UserRecommendation[]> = new Map();
  private cacheTimestamp: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // AC1: Get recommendations for user
  getRecommendations(userId: string, limit: number = 10): UserRecommendation[] {
    // Check cache
    const cached = this.discoveryCache.get(userId);
    const cacheTime = this.cacheTimestamp.get(userId) || 0;

    if (cached && Date.now() - cacheTime < this.CACHE_TTL) {
      return cached.slice(0, limit);
    }

    // Generate recommendations (in production: fetch from database)
    const recommendations: UserRecommendation[] = [
      {
        userId: 'user2',
        displayName: 'Jane Smith',
        bio: 'AI Researcher',
        expertiseTags: ['ai', 'ml', 'python'],
        score: 85,
        reason: 'interest-based',
      },
      {
        userId: 'user3',
        displayName: 'Bob Wilson',
        bio: 'Tech Writer',
        expertiseTags: ['technology', 'javascript'],
        score: 72,
        reason: 'activity-based',
      },
      {
        userId: 'user4',
        displayName: 'Alice Johnson',
        bio: 'Data Scientist',
        expertiseTags: ['data', 'ml'],
        score: 68,
        reason: 'similar',
      },
    ];

    // AC11: Deduplicate
    const deduped = this.deduplicateRecommendations(userId, recommendations);

    // Cache results
    this.discoveryCache.set(userId, deduped);
    this.cacheTimestamp.set(userId, Date.now());

    return deduped.slice(0, limit);
  }

  // AC2: Interest-based discovery
  getByInterests(interests: string[], limit: number = 10): UserRecommendation[] {
    // In production: query users with matching expertise tags
    return [
      {
        userId: 'user5',
        displayName: 'Carol Davis',
        bio: 'ML Expert',
        expertiseTags: ['ml', 'python', 'ai'],
        score: 90,
        reason: 'interest-based',
      },
    ].slice(0, limit);
  }

  // AC4: Trending creators
  getTrendingCreators(limit: number = 10): UserRecommendation[] {
    const cached = this.trendingCache.get('trending');
    const cacheTime = this.cacheTimestamp.get('trending') || 0;

    if (cached && Date.now() - cacheTime < this.CACHE_TTL) {
      return cached.slice(0, limit);
    }

    const trending: UserRecommendation[] = [
      {
        userId: 'user1',
        displayName: 'John Doe',
        bio: 'Tech writer with 10K followers',
        expertiseTags: ['tech', 'writing'],
        score: 95,
        reason: 'trending',
      },
      {
        userId: 'user2',
        displayName: 'Jane Smith',
        bio: 'AI researcher with 8K followers',
        expertiseTags: ['ai', 'ml'],
        score: 88,
        reason: 'trending',
      },
    ];

    this.trendingCache.set('trending', trending);
    this.cacheTimestamp.set('trending', Date.now());

    return trending.slice(0, limit);
  }

  // AC5: New creators
  getNewCreators(limit: number = 10): UserRecommendation[] {
    return [
      {
        userId: 'user10',
        displayName: 'New Creator',
        bio: 'Just joined',
        expertiseTags: ['tech'],
        score: 50,
        reason: 'new',
      },
    ].slice(0, limit);
  }

  // AC6: Similar users
  getSimilarUsers(userId: string, limit: number = 10): UserRecommendation[] {
    // Find users with similar expertise tags
    return [
      {
        userId: 'user11',
        displayName: 'Similar User',
        bio: 'Shares your interests',
        expertiseTags: ['tech', 'ai'],
        score: 75,
        reason: 'similar',
      },
    ].slice(0, limit);
  }

  // AC8: Track discovery view
  trackDiscoveryView(userId: string, discoveredUserId: string): void {
    if (!this.discoveryHistory.has(userId)) {
      this.discoveryHistory.set(userId, new Set());
    }

    this.discoveryHistory.get(userId)!.add(discoveredUserId);
    logger.debug('Discovery view tracked', { userId, discoveredUserId });
  }

  // AC7: Calculate relevance score
  calculateScore(
    userA: { expertiseTags: string[] },
    userB: { expertiseTags: string[] },
    engagement: number
  ): number {
    // Tag overlap (60%)
    const overlap = userA.expertiseTags.filter((t) => userB.expertiseTags.includes(t)).length;
    const maxTags = Math.max(userA.expertiseTags.length, userB.expertiseTags.length);
    const tagScore = maxTags > 0 ? (overlap / maxTags) * 60 : 0;

    // Engagement score (40%)
    const engagementScore = Math.min(engagement / 10, 40);

    return Math.round(tagScore + engagementScore);
  }

  // AC11: Deduplication
  private deduplicateRecommendations(userId: string, recs: UserRecommendation[]): UserRecommendation[] {
    const viewed = this.discoveryHistory.get(userId) || new Set();
    const seen = new Set<string>([userId]);

    return recs.filter((r) => {
      if (seen.has(r.userId) || viewed.has(r.userId)) {
        return false;
      }
      seen.add(r.userId);
      return true;
    });
  }

  // AC10: Clear cache
  clearCache(userId?: string): void {
    if (userId) {
      this.discoveryCache.delete(userId);
      this.cacheTimestamp.delete(userId);
    } else {
      this.discoveryCache.clear();
      this.trendingCache.clear();
      this.cacheTimestamp.clear();
    }
  }

  // Get discovery stats
  getStats(): {
    totalDiscoveryViews: number;
    usersDiscovered: number;
  } {
    let totalViews = 0;
    let totalUsers = new Set<string>();

    for (const viewed of this.discoveryHistory.values()) {
      totalViews += viewed.size;
      viewed.forEach((u) => totalUsers.add(u));
    }

    return {
      totalDiscoveryViews: totalViews,
      usersDiscovered: totalUsers.size,
    };
  }
}

export const discoveryManager = new DiscoveryManager();
