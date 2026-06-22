import { logger } from '../logger.js';

// AC1 & AC2: Following relationship
export interface Following {
  followerId: string;
  followingId: string;
  followType: 'user' | 'author' | 'topic';
  followedAt: string;
}

// AC4: User statistics
export interface UserStats {
  userId: string;
  followingCount: number;
  followerCount: number;
  articlesPublished: number;
  commentsCount: number;
}

class FollowingManager {
  private following: Map<string, Following> = new Map();
  private userFollowing: Map<string, Set<string>> = new Map(); // userId -> followingIds
  private userFollowers: Map<string, Set<string>> = new Map(); // userId -> followerIds
  private userStats: Map<string, UserStats> = new Map(); // userId -> stats

  // AC1: Follow user
  followUser(followerId: string, followingId: string): Following | null {
    // AC9: Prevent self-following
    if (followerId === followingId) {
      return null;
    }

    const key = `${followerId}:${followingId}:user`;

    // Already following
    if (this.following.has(key)) {
      return null;
    }

    const follow: Following = {
      followerId,
      followingId,
      followType: 'user',
      followedAt: new Date().toISOString(),
    };

    this.following.set(key, follow);

    // Track following
    if (!this.userFollowing.has(followerId)) {
      this.userFollowing.set(followerId, new Set());
    }
    this.userFollowing.get(followerId)!.add(followingId);

    // Track followers
    if (!this.userFollowers.has(followingId)) {
      this.userFollowers.set(followingId, new Set());
    }
    this.userFollowers.get(followingId)!.add(followerId);

    // Update stats
    this.updateStats(followerId, 'following', 1);
    this.updateStats(followingId, 'follower', 1);

    logger.info('User followed', { followerId, followingId });

    return follow;
  }

  // AC1: Unfollow user
  unfollowUser(followerId: string, followingId: string): boolean {
    const key = `${followerId}:${followingId}:user`;

    if (!this.following.has(key)) {
      return false;
    }

    this.following.delete(key);

    // Remove from tracking
    this.userFollowing.get(followerId)?.delete(followingId);
    this.userFollowers.get(followingId)?.delete(followerId);

    // Update stats
    this.updateStats(followerId, 'following', -1);
    this.updateStats(followingId, 'follower', -1);

    logger.info('User unfollowed', { followerId, followingId });

    return true;
  }

  // AC2: Subscribe to author
  subscribeToAuthor(userId: string, authorId: string): Following | null {
    if (userId === authorId) {
      return null;
    }

    const key = `${userId}:${authorId}:author`;

    if (this.following.has(key)) {
      return null;
    }

    const subscription: Following = {
      followerId: userId,
      followingId: authorId,
      followType: 'author',
      followedAt: new Date().toISOString(),
    };

    this.following.set(key, subscription);

    if (!this.userFollowing.has(userId)) {
      this.userFollowing.set(userId, new Set());
    }
    this.userFollowing.get(userId)!.add(authorId);

    if (!this.userFollowers.has(authorId)) {
      this.userFollowers.set(authorId, new Set());
    }
    this.userFollowers.get(authorId)!.add(userId);

    this.updateStats(userId, 'following', 1);
    this.updateStats(authorId, 'follower', 1);

    logger.info('Author subscribed', { userId, authorId });

    return subscription;
  }

  // AC3: Subscribe to topic
  subscribeToTopic(userId: string, topicId: string): Following | null {
    const key = `${userId}:${topicId}:topic`;

    if (this.following.has(key)) {
      return null;
    }

    const subscription: Following = {
      followerId: userId,
      followingId: topicId,
      followType: 'topic',
      followedAt: new Date().toISOString(),
    };

    this.following.set(key, subscription);

    if (!this.userFollowing.has(userId)) {
      this.userFollowing.set(userId, new Set());
    }
    this.userFollowing.get(userId)!.add(topicId);

    logger.info('Topic subscribed', { userId, topicId });

    return subscription;
  }

  // AC5: Get following list
  getFollowing(userId: string): string[] {
    return Array.from(this.userFollowing.get(userId) || new Set());
  }

  // AC5: Get followers list
  getFollowers(userId: string): string[] {
    return Array.from(this.userFollowers.get(userId) || new Set());
  }

  // AC11: Check if mutual followers
  isMutualFollower(userId1: string, userId2: string): boolean {
    const user1Followers = this.userFollowers.get(userId1) || new Set();
    const user2Following = this.userFollowing.get(userId2) || new Set();

    return user1Followers.has(userId2) && user2Following.has(userId1);
  }

  // AC11: Get mutual followers
  getMutualFollowers(userId1: string, userId2: string): string[] {
    const followers1 = this.userFollowers.get(userId1) || new Set();
    const followers2 = this.userFollowers.get(userId2) || new Set();

    return Array.from(followers1).filter((f) => followers2.has(f));
  }

  // AC9: Get user recommendations
  getFollowingRecommendations(userId: string, limit: number = 10): string[] {
    const userFollowing = this.userFollowing.get(userId) || new Set();
    const recommendations = new Map<string, number>();

    // Find users followed by people this user follows
    for (const followedId of userFollowing) {
      const theirFollowing = this.userFollowing.get(followedId) || new Set();

      for (const potentialUser of theirFollowing) {
        if (potentialUser === userId || userFollowing.has(potentialUser)) continue;

        recommendations.set(potentialUser, (recommendations.get(potentialUser) || 0) + 1);
      }
    }

    // Sort by score and return top N
    return Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((e) => e[0]);
  }

  // AC4: Get user stats
  getStats(userId: string): UserStats {
    return (
      this.userStats.get(userId) || {
        userId,
        followingCount: 0,
        followerCount: 0,
        articlesPublished: 0,
        commentsCount: 0,
      }
    );
  }

  // Update stats
  private updateStats(userId: string, type: 'following' | 'follower', delta: number): void {
    if (!this.userStats.has(userId)) {
      this.userStats.set(userId, {
        userId,
        followingCount: 0,
        followerCount: 0,
        articlesPublished: 0,
        commentsCount: 0,
      });
    }

    const stats = this.userStats.get(userId)!;

    if (type === 'following') {
      stats.followingCount = Math.max(0, stats.followingCount + delta);
    } else {
      stats.followerCount = Math.max(0, stats.followerCount + delta);
    }
  }

  // Check if following
  isFollowing(followerId: string, followingId: string): boolean {
    const key = `${followerId}:${followingId}:user`;
    return this.following.has(key);
  }

  // Get global stats
  getGlobalStats(): {
    totalFollows: number;
    totalUsers: number;
    avgFollowingPerUser: number;
  } {
    const totalFollows = this.following.size;
    const totalUsers = new Set(
      Array.from(this.userFollowing.keys()).concat(Array.from(this.userFollowers.keys()))
    ).size;

    const avgFollowing = totalUsers > 0 ? totalFollows / totalUsers : 0;

    return {
      totalFollows,
      totalUsers,
      avgFollowingPerUser: Math.round(avgFollowing * 10) / 10,
    };
  }
}

export const followingManager = new FollowingManager();
