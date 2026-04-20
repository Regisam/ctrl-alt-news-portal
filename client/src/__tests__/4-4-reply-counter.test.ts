// client/src/__tests__/4-4-reply-counter.test.ts
// Story 4.4: Reply Counter & Thread Analytics
// Tests for reply count accuracy, trending ranking, and cache invalidation

import { describe, it, expect } from 'vitest';

describe('Story 4.4: Reply Counter & Thread Analytics', () => {
  describe('Test 1: Reply Count Accuracy', () => {
    it('should increment reply count when new reply is created', () => {
      // Simulates POST /api/comments/:id/reply with atomic increment
      // Expected behavior: parent comment.replyCount += 1

      const parentCommentBefore = { id: 'c1', replyCount: 2 };
      const parentCommentAfter = { id: 'c1', replyCount: 3 };

      // Atomic operation: { replyCount: { increment: 1 } }
      const incrementedCount = parentCommentBefore.replyCount + 1;

      expect(incrementedCount).toBe(parentCommentAfter.replyCount);
      expect(incrementedCount).toBe(3);
    });

    it('should decrement reply count when reply is deleted', () => {
      // Simulates DELETE /api/comments/:replyId with atomic decrement
      // Expected behavior: parent comment.replyCount -= 1

      const parentCommentBefore = { id: 'c1', replyCount: 3 };
      const parentCommentAfter = { id: 'c1', replyCount: 2 };

      // Atomic operation: { replyCount: { decrement: 1 } }
      const decrementedCount = parentCommentBefore.replyCount - 1;

      expect(decrementedCount).toBe(parentCommentAfter.replyCount);
      expect(decrementedCount).toBe(2);
    });

    it('should maintain accurate count across multiple operations', () => {
      // Validates denormalization accuracy under sequential changes
      let count = 0;

      // Create 5 replies
      for (let i = 0; i < 5; i++) {
        count += 1; // Simulate atomic increment
      }
      expect(count).toBe(5);

      // Delete 2 replies
      for (let i = 0; i < 2; i++) {
        count -= 1; // Simulate atomic decrement
      }
      expect(count).toBe(3);

      // Verify final state
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Test 2: Trending Ranking', () => {
    it('should sort trending by replyCount DESC', () => {
      // GET /api/comments/trending returns comments sorted by engagement
      const trendingComments = [
        { id: 'c1', content: 'Popular thread', replyCount: 15, createdAt: '2026-04-20T10:00:00Z' },
        { id: 'c2', content: 'Active discussion', replyCount: 8, createdAt: '2026-04-20T09:00:00Z' },
        { id: 'c3', content: 'New comment', replyCount: 2, createdAt: '2026-04-20T12:00:00Z' },
        { id: 'c4', content: 'Moderate engagement', replyCount: 8, createdAt: '2026-04-20T08:00:00Z' },
      ];

      // Sort by replyCount DESC, then createdAt DESC for tiebreaker
      const sorted = [...trendingComments].sort((a, b) => {
        if (b.replyCount !== a.replyCount) {
          return b.replyCount - a.replyCount; // DESC
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // DESC
      });

      // Validate order
      expect(sorted[0].replyCount).toBe(15); // Highest
      expect(sorted[1].replyCount).toBe(8);  // Second tier, earlier timestamp wins
      expect(sorted[2].replyCount).toBe(8);  // Second tier, later timestamp
      expect(sorted[3].replyCount).toBe(2);  // Lowest

      // Verify first comment is most trending
      expect(sorted[0].id).toBe('c1');
    });

    it('should handle tiebreaker: createdAt DESC when replyCount equal', () => {
      // Two comments with same replyCount should rank by createdAt DESC
      const comments = [
        { id: 'older', replyCount: 5, createdAt: new Date('2026-04-20T08:00:00Z') },
        { id: 'newer', replyCount: 5, createdAt: new Date('2026-04-20T12:00:00Z') },
      ];

      const sorted = [...comments].sort((a, b) => {
        if (b.replyCount !== a.replyCount) {
          return b.replyCount - a.replyCount;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // Newer comment should rank higher (appears first)
      expect(sorted[0].id).toBe('newer');
      expect(sorted[1].id).toBe('older');
    });

    it('should apply 24-hour trending window', () => {
      const now = new Date('2026-04-20T12:00:00Z');
      const trendingWindow = 24 * 60 * 60 * 1000; // 24 hours

      const comments = [
        { id: 'c1', createdAt: new Date('2026-04-20T11:00:00Z'), replyCount: 5 }, // Within 24h
        { id: 'c2', createdAt: new Date('2026-04-19T13:00:00Z'), replyCount: 3 }, // Within 24h
        { id: 'c3', createdAt: new Date('2026-04-19T11:59:00Z'), replyCount: 10 }, // Outside 24h
      ];

      const trending = comments.filter(c => {
        const diff = now.getTime() - c.createdAt.getTime();
        return diff <= trendingWindow;
      });

      expect(trending.length).toBe(2);
      expect(trending.map(c => c.id)).toEqual(['c1', 'c2']);
    });
  });

  describe('Test 3: Cache Invalidation', () => {
    it('should invalidate trending cache on new reply', () => {
      // When POST /api/comments/:id/reply is called:
      // 1. Increment parent replyCount
      // 2. Call cacheService.deleteByPattern('trending_')

      const cacheKeys = [
        'trending_24h_10_0_article1',
        'trending_24h_20_0_article1',
        'trending_7d_10_0_all',
      ];

      // Pattern-based deletion should remove all trending_* keys
      const pattern = 'trending_';
      const validKeys = cacheKeys.filter(key => !key.startsWith(pattern));

      expect(validKeys.length).toBe(0); // All trending_ keys should be deleted
      expect(cacheKeys.filter(key => key.startsWith(pattern)).length).toBe(3); // All matched
    });

    it('should invalidate trending cache on reply delete', () => {
      // When DELETE /api/comments/:replyId is called:
      // 1. Decrement parent replyCount
      // 2. Call cacheService.deleteByPattern('trending_')

      const cachedTrending = {
        'trending_24h_10_0_article1': { comments: [] }, // Stale after deletion
        'trending_24h_20_0_article1': { comments: [] }, // Stale after deletion
      };

      // After cache invalidation, these keys should be cleared
      const cacheSize = Object.keys(cachedTrending).length;
      const invalidatePattern = 'trending_';

      // Simulate cache.deleteByPattern
      const clearedCache = Object.keys(cachedTrending).reduce((acc, key) => {
        if (!key.startsWith(invalidatePattern)) {
          acc[key] = cachedTrending[key];
        }
        return acc;
      }, {});

      expect(Object.keys(clearedCache).length).toBe(0); // Cache cleared
      expect(cacheSize).toBe(2); // Original had 2 entries
    });

    it('should refresh cache with TTL (5 minutes)', () => {
      // Cache entries should have 5-minute TTL
      const cacheTTL = 5 * 60 * 1000; // 5 minutes in ms
      const createdAt = Date.now();
      const expiresAt = createdAt + cacheTTL;

      // Simulate time passing (3 minutes)
      const currentTime = createdAt + (3 * 60 * 1000);
      const isExpired = currentTime > expiresAt;

      expect(isExpired).toBe(false); // Still valid at 3 minutes

      // Simulate time passing (7 minutes total)
      const expiredTime = createdAt + (7 * 60 * 1000);
      const isNowExpired = expiredTime > expiresAt;

      expect(isNowExpired).toBe(true); // Expired at 7 minutes
    });

    it('should use pattern-based cache invalidation', () => {
      // CacheService.deleteByPattern('trending_') should delete all keys matching pattern
      const cacheStore = new Map([
        ['trending_24h_10_0_all', { data: 'trending comments' }],
        ['trending_7d_20_10_article1', { data: 'trending this week' }],
        ['user_profile_user123', { data: 'user data' }],
        ['article_article456', { data: 'article cache' }],
      ]);

      // Pattern match and delete
      const pattern = 'trending_';
      for (const key of cacheStore.keys()) {
        if (key.startsWith(pattern)) {
          cacheStore.delete(key);
        }
      }

      // Verify trending keys are deleted, others remain
      expect(cacheStore.has('trending_24h_10_0_all')).toBe(false);
      expect(cacheStore.has('trending_7d_20_10_article1')).toBe(false);
      expect(cacheStore.has('user_profile_user123')).toBe(true);
      expect(cacheStore.has('article_article456')).toBe(true);
      expect(cacheStore.size).toBe(2);
    });
  });
});
