import { logger } from '../logger.js';

// AC1: Badge types
export type BadgeType = 
  | 'contributor' | 'expert' | 'influencer' | 'helpful' 
  | 'verified' | 'mentor' | 'innovator' | 'trusted'
  | 'active' | 'consistent' | 'creator' | 'community_leader';

// AC1: Badge
export interface Badge {
  id: string;
  type: BadgeType;
  name: string;
  description: string;
  earnedAt: string;
  icon: string;
}

// AC8: Reputation tier
export type ReputationTier = 'bronze' | 'silver' | 'gold' | 'platinum';

// AC2: User reputation
export interface UserReputation {
  userId: string;
  score: number;
  tier: ReputationTier;
  badges: Badge[];
  articlesPublished: number;
  helpfulComments: number;
  followers: number;
  updatedAt: string;
}

// AC7: Reputation history entry
export interface ReputationHistory {
  userId: string;
  timestamp: string;
  action: string;
  points: number;
  newScore: number;
  badge?: BadgeType;
}

class ReputationManager {
  private reputations: Map<string, UserReputation> = new Map();
  private history: Map<string, ReputationHistory[]> = new Map();
  private badgeConditions: Map<BadgeType, { points: number; condition: string }> = new Map([
    ['contributor', { points: 100, condition: 'Publish 5+ articles' }],
    ['expert', { points: 250, condition: 'Score 250+ points' }],
    ['influencer', { points: 500, condition: 'Get 100+ followers' }],
    ['helpful', { points: 50, condition: 'Get 20+ helpful reactions' }],
    ['verified', { points: 150, condition: 'Email verified + profile complete' }],
    ['mentor', { points: 200, condition: 'Help 10+ users' }],
    ['innovator', { points: 300, condition: 'Create unique content' }],
    ['trusted', { points: 400, condition: 'No violations in 90 days' }],
    ['active', { points: 30, condition: 'Active 7+ days this month' }],
    ['consistent', { points: 60, condition: 'Post regularly' }],
    ['creator', { points: 80, condition: 'Publish 10+ articles' }],
    ['community_leader', { points: 500, condition: 'Score 500+ points' }],
  ]);

  // AC2: Get or create reputation
  getOrCreateReputation(userId: string): UserReputation {
    if (!this.reputations.has(userId)) {
      this.reputations.set(userId, {
        userId,
        score: 0,
        tier: 'bronze',
        badges: [],
        articlesPublished: 0,
        helpfulComments: 0,
        followers: 0,
        updatedAt: new Date().toISOString(),
      });
    }
    return this.reputations.get(userId)!;
  }

  // AC2: Add reputation points
  addPoints(userId: string, points: number, action: string): UserReputation {
    const rep = this.getOrCreateReputation(userId);
    const oldScore = rep.score;
    rep.score += points;
    rep.tier = this.calculateTier(rep.score);
    rep.updatedAt = new Date().toISOString();

    this.recordHistory(userId, action, points, rep.score);

    // AC3: Check for badge earning
    this.checkBadgeEarning(userId, rep);

    logger.info('Reputation points added', { userId, points, newScore: rep.score });

    return rep;
  }

  // AC4: Get leaderboard
  getLeaderboard(limit: number = 100): UserReputation[] {
    return Array.from(this.reputations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // AC6: Get user reputation
  getReputation(userId: string): UserReputation {
    return this.getOrCreateReputation(userId);
  }

  // AC3: Check and award badges
  private checkBadgeEarning(userId: string, rep: UserReputation): void {
    const badgeTypesToCheck: BadgeType[] = [
      'contributor', 'expert', 'influencer', 'helpful',
      'verified', 'mentor', 'innovator', 'trusted',
      'active', 'consistent', 'creator', 'community_leader'
    ];

    for (const badgeType of badgeTypesToCheck) {
      const hasBadge = rep.badges.some(b => b.type === badgeType);
      if (hasBadge) continue;

      const condition = this.badgeConditions.get(badgeType);
      if (condition && rep.score >= condition.points) {
        const badge: Badge = {
          id: `badge-${userId}-${badgeType}-${Date.now()}`,
          type: badgeType,
          name: this.getBadgeName(badgeType),
          description: condition.condition,
          earnedAt: new Date().toISOString(),
          icon: this.getBadgeIcon(badgeType),
        };

        rep.badges.push(badge);
        this.recordHistory(userId, `Badge earned: ${badgeType}`, 0, rep.score, badgeType);

        logger.info('Badge earned', { userId, badge: badgeType });
      }
    }
  }

  // AC8: Calculate tier
  private calculateTier(score: number): ReputationTier {
    if (score >= 500) return 'platinum';
    if (score >= 300) return 'gold';
    if (score >= 150) return 'silver';
    return 'bronze';
  }

  // AC7: Record history
  private recordHistory(userId: string, action: string, points: number, newScore: number, badge?: BadgeType): void {
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }

    const entry: ReputationHistory = {
      userId,
      timestamp: new Date().toISOString(),
      action,
      points,
      newScore,
      badge,
    };

    this.history.get(userId)!.push(entry);
  }

  // AC7: Get reputation history
  getHistory(userId: string, limit: number = 50): ReputationHistory[] {
    const hist = this.history.get(userId) || [];
    return hist.slice(-limit).reverse();
  }

  // AC9: Apply reputation decay (prevent inactive abuse)
  applyDecay(userId: string, decayPercent: number = 5): UserReputation {
    const rep = this.getOrCreateReputation(userId);
    const decay = Math.floor(rep.score * (decayPercent / 100));
    rep.score = Math.max(0, rep.score - decay);
    rep.tier = this.calculateTier(rep.score);
    rep.updatedAt = new Date().toISOString();

    this.recordHistory(userId, `Reputation decay: -${decay}`, -decay, rep.score);

    logger.info('Reputation decay applied', { userId, decay });

    return rep;
  }

  // AC11: Get reputation statistics
  getStats(): {
    totalUsers: number;
    averageScore: number;
    topScore: number;
    totalBadges: number;
  } {
    const users = Array.from(this.reputations.values());
    const totalBadges = users.reduce((sum, u) => sum + u.badges.length, 0);
    const totalScore = users.reduce((sum, u) => sum + u.score, 0);

    return {
      totalUsers: users.length,
      averageScore: users.length > 0 ? Math.round(totalScore / users.length) : 0,
      topScore: users.length > 0 ? Math.max(...users.map(u => u.score)) : 0,
      totalBadges,
    };
  }

  // Helper: Get badge name
  private getBadgeName(type: BadgeType): string {
    const names: Record<BadgeType, string> = {
      contributor: 'Contributor',
      expert: 'Expert',
      influencer: 'Influencer',
      helpful: 'Helpful',
      verified: 'Verified',
      mentor: 'Mentor',
      innovator: 'Innovator',
      trusted: 'Trusted',
      active: 'Active',
      consistent: 'Consistent',
      creator: 'Creator',
      community_leader: 'Community Leader',
    };
    return names[type];
  }

  // Helper: Get badge icon
  private getBadgeIcon(type: BadgeType): string {
    const icons: Record<BadgeType, string> = {
      contributor: '📝',
      expert: '🌟',
      influencer: '📢',
      helpful: '🤝',
      verified: '✅',
      mentor: '👨‍🏫',
      innovator: '💡',
      trusted: '🛡️',
      active: '⚡',
      consistent: '📊',
      creator: '🎨',
      community_leader: '👑',
    };
    return icons[type];
  }
}

export const reputationManager = new ReputationManager();
