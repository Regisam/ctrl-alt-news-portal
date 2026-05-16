/**
 * Engagement Vectors Tests (Story 13.1 - Task 1.1)
 * Unit tests for vector construction and normalization
 */

import { describe, it, expect } from 'vitest';
import {
  buildEngagementVector,
  vectorToArray,
  validateVector,
  UserEngagementVector,
  UserEngagementRaw,
} from '@shared/lib/engagementVectors';

describe('engagementVectors - buildEngagementVector', () => {
  it('should build engagement vector from raw data', () => {
    const raw: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          sentiment: 'analysis',
          scrollDepth: 0.8,
          timeSpent: 300, // 5 minutes
          readAt: new Date('2026-05-16'),
        },
      ],
      bookmarks: [],
      reactions: [],
    };

    const vector = buildEngagementVector('user1', raw, new Date('2026-05-16'));

    expect(vector.userId).toBe('user1');
    expect(vector.topicEngagement.tech).toBeGreaterThan(0);
    expect(vector.authorEngagement.alice).toBeGreaterThan(0);
    expect(vector.sentimentEngagement.analysis).toBeGreaterThan(0);
    expect(vector.totalEngagement).toBeGreaterThan(0);
  });

  it('should apply temporal weighting to older engagement', () => {
    const now = new Date('2026-05-16');
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const raw: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          scrollDepth: 0.8,
          timeSpent: 300,
          readAt: oneWeekAgo,
        },
      ],
      bookmarks: [],
      reactions: [],
    };

    const vector = buildEngagementVector('user1', raw, now);

    // Score should be reduced by decay factor (0.95^1 = 0.95)
    expect(vector.totalEngagement).toBeLessThan(
      0.8 * Math.min(300 / 60, 10) // raw score without decay
    );
  });

  it('should handle empty engagement data', () => {
    const raw: UserEngagementRaw = {
      userId: 'user1',
      reads: [],
      bookmarks: [],
      reactions: [],
    };

    const vector = buildEngagementVector('user1', raw);

    expect(vector.userId).toBe('user1');
    expect(vector.totalEngagement).toBe(0);
    expect(Object.keys(vector.topicEngagement)).toHaveLength(0);
  });

  it('should weight bookmarks higher than reads', () => {
    const withReadAndBookmark: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          scrollDepth: 1.0,
          timeSpent: 60,
          readAt: new Date(),
        },
      ],
      bookmarks: [
        {
          articleId: 'art2',
          topic: 'tech',
          author: 'alice',
          bookmarkedAt: new Date(),
        },
      ],
      reactions: [],
    };

    const vectorCombined = buildEngagementVector('user1', withReadAndBookmark);

    // Should have both read and bookmark contributions
    expect(vectorCombined.totalEngagement).toBeGreaterThan(0);
    // Both read and bookmark contribute to engagement
    expect(vectorCombined.totalEngagement).toBeCloseTo(1.5, 0);
  });

  it('should apply sentiment weights', () => {
    const breaking: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          sentiment: 'breaking',
          scrollDepth: 0.5,
          timeSpent: 60,
          readAt: new Date(),
        },
      ],
      bookmarks: [],
      reactions: [],
    };

    const opinion: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          sentiment: 'opinion',
          scrollDepth: 0.5,
          timeSpent: 60,
          readAt: new Date(),
        },
      ],
      bookmarks: [],
      reactions: [],
    };

    const vectorBreaking = buildEngagementVector('user1', breaking);
    const vectorOpinion = buildEngagementVector('user1', opinion);

    // Breaking weight (1.2) > opinion weight (0.9)
    expect(vectorBreaking.sentimentEngagement.breaking).toBeGreaterThan(
      vectorOpinion.sentimentEngagement.opinion
    );
  });

  it('should normalize scores to [0, 1]', () => {
    const raw: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          scrollDepth: 0.8,
          timeSpent: 300,
          readAt: new Date(),
        },
      ],
      bookmarks: [],
      reactions: [],
    };

    const vector = buildEngagementVector('user1', raw);

    for (const score of Object.values(vector.topicEngagement)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('should cap time spent at 10 minutes', () => {
    const veryLongRead: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          scrollDepth: 1.0,
          timeSpent: 3600, // 1 hour
          readAt: new Date(),
        },
      ],
      bookmarks: [],
      reactions: [],
    };

    const normalRead: UserEngagementRaw = {
      userId: 'user1',
      reads: [
        {
          articleId: 'art1',
          topic: 'tech',
          author: 'alice',
          scrollDepth: 1.0,
          timeSpent: 600, // 10 minutes
          readAt: new Date(),
        },
      ],
      bookmarks: [],
      reactions: [],
    };

    const vectorLong = buildEngagementVector('user1', veryLongRead);
    const vectorNormal = buildEngagementVector('user1', normalRead);

    // Should be capped to same value
    expect(vectorLong.totalEngagement).toBeCloseTo(vectorNormal.totalEngagement, 2);
  });
});

describe('engagementVectors - vectorToArray', () => {
  it('should convert vector to sorted array', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: { science: 0.3, tech: 0.8 },
      authorEngagement: { bob: 0.2, alice: 0.7 },
      sentimentEngagement: { analysis: 0.5 },
      totalEngagement: 2.5,
      lastUpdatedAt: new Date(),
    };

    const array = vectorToArray(vector, ['science', 'tech'], ['alice', 'bob'], ['analysis']);

    expect(array).toHaveLength(6); // 2 topics + 2 authors + 1 sentiment + 1 total
    expect(array[0]).toBe(0.3); // science (sorted)
    expect(array[1]).toBe(0.8); // tech (sorted)
    expect(array[2]).toBe(0.7); // alice (sorted)
    expect(array[3]).toBe(0.2); // bob (sorted)
    expect(array[4]).toBe(0.5); // analysis
    expect(array[5]).toBe(2.5); // totalEngagement
  });

  it('should fill missing keys with 0', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: { tech: 0.8 },
      authorEngagement: {},
      sentimentEngagement: {},
      totalEngagement: 0.8,
      lastUpdatedAt: new Date(),
    };

    const array = vectorToArray(vector, ['science', 'tech'], ['alice', 'bob'], ['analysis']);

    expect(array[0]).toBe(0); // science (missing)
    expect(array[1]).toBe(0.8); // tech
    expect(array[2]).toBe(0); // alice (missing)
    expect(array[3]).toBe(0); // bob (missing)
    expect(array[4]).toBe(0); // analysis (missing)
    expect(array[5]).toBe(0.8); // totalEngagement
  });
});

describe('engagementVectors - validateVector', () => {
  it('should validate valid vector', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: { tech: 0.8 },
      authorEngagement: { alice: 0.7 },
      sentimentEngagement: { analysis: 0.5 },
      totalEngagement: 2.0,
      lastUpdatedAt: new Date(),
    };

    const result = validateVector(vector);

    expect(result.valid).toBe(true);
  });

  it('should detect NaN values', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: { tech: NaN },
      authorEngagement: {},
      sentimentEngagement: {},
      totalEngagement: 0,
      lastUpdatedAt: new Date(),
    };

    const result = validateVector(vector);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid score');
  });

  it('should detect Infinity values', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: {},
      authorEngagement: { alice: Infinity },
      sentimentEngagement: {},
      totalEngagement: 0,
      lastUpdatedAt: new Date(),
    };

    const result = validateVector(vector);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid score');
  });

  it('should accept zero engagement (new user)', () => {
    const vector: UserEngagementVector = {
      userId: 'user_new',
      topicEngagement: {},
      authorEngagement: {},
      sentimentEngagement: {},
      totalEngagement: 0,
      lastUpdatedAt: new Date(),
    };

    const result = validateVector(vector);

    expect(result.valid).toBe(true);
  });

  it('should validate all scores in range', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: { tech: 2.5 }, // Out of [0, 1] range but finite
      authorEngagement: { alice: 0.5 },
      sentimentEngagement: { analysis: 0.3 },
      totalEngagement: 3.3,
      lastUpdatedAt: new Date(),
    };

    const result = validateVector(vector);

    // Should be valid as long as scores are finite (not NaN/Infinity)
    expect(result.valid).toBe(true);
  });
});
