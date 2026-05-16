/**
 * User Similarity Tests (Story 13.1 - Task 1.2)
 * Unit tests for Pearson correlation math and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  computePearsonCorrelation,
  normalizeEngagementVector,
  computeSimilarityMatrix,
  getKNearestNeighbors,
  computeSimilarityMetrics,
} from '@shared/lib/userSimilarity';
import { UserEngagementVector } from '@shared/lib/engagementVectors';

describe('userSimilarity - Pearson Correlation', () => {
  it('should compute perfect positive correlation (1.0)', () => {
    const v1 = [1, 2, 3, 4, 5];
    const v2 = [1, 2, 3, 4, 5];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBeCloseTo(1.0, 5);
  });

  it('should compute perfect negative correlation (-1.0)', () => {
    const v1 = [1, 2, 3, 4, 5];
    const v2 = [5, 4, 3, 2, 1];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBeCloseTo(-1.0, 5);
  });

  it('should compute perfect negative correlation (-1.0)', () => {
    const v1 = [1, 0, 1, 0, 1];
    const v2 = [0, 1, 0, 1, 0];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBeCloseTo(-1.0, 5);
  });

  it('should handle identical constant vectors (no variance)', () => {
    const v1 = [5, 5, 5, 5];
    const v2 = [5, 5, 5, 5];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBe(1.0);
  });

  it('should handle one constant vector (zero variance)', () => {
    const v1 = [1, 2, 3, 4];
    const v2 = [5, 5, 5, 5];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBe(0);
  });

  it('should handle empty vectors', () => {
    const correlation = computePearsonCorrelation([], []);
    expect(correlation).toBe(0);
  });

  it('should handle mismatched vector lengths', () => {
    const correlation = computePearsonCorrelation([1, 2, 3], [1, 2]);
    expect(correlation).toBe(0);
  });

  it('should handle NaN values', () => {
    const v1 = [1, 2, NaN, 4];
    const v2 = [1, 2, 3, 4];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBe(0);
  });

  it('should handle Infinity values', () => {
    const v1 = [1, 2, Infinity, 4];
    const v2 = [1, 2, 3, 4];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBe(0);
  });

  it('should clamp result to [-1, 1]', () => {
    const v1 = [0.0000001, 0.0000002, 0.0000003];
    const v2 = [0.0000001, 0.0000002, 0.0000003];
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBeGreaterThanOrEqual(-1);
    expect(correlation).toBeLessThanOrEqual(1);
  });

  it('should compute partial positive correlation', () => {
    const v1 = [1, 2, 3, 4, 5];
    const v2 = [2, 3, 4, 5, 6]; // Shifted by 1
    const correlation = computePearsonCorrelation(v1, v2);
    expect(correlation).toBeCloseTo(1.0, 5);
  });
});

describe('userSimilarity - Engagement Vector Normalization', () => {
  it('should normalize engagement vector to array', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: { tech: 0.8, science: 0.5 },
      authorEngagement: { alice: 0.7 },
      sentimentEngagement: { analysis: 0.6 },
      totalEngagement: 2.6,
      lastUpdatedAt: new Date(),
    };

    const topics = ['science', 'tech'];
    const authors = ['alice'];
    const sentiments = ['analysis'];

    const array = normalizeEngagementVector(vector, topics, authors, sentiments);

    expect(array).toHaveLength(5); // 2 topics + 1 author + 1 sentiment + 1 total
    expect(array[0]).toBe(0.5); // science (sorted)
    expect(array[1]).toBe(0.8); // tech (sorted)
    expect(array[2]).toBe(0.7); // alice
    expect(array[3]).toBe(0.6); // analysis
    expect(array[4]).toBeCloseTo(2.6); // totalEngagement
  });

  it('should handle missing keys with 0 values', () => {
    const vector: UserEngagementVector = {
      userId: 'user1',
      topicEngagement: { tech: 0.8 },
      authorEngagement: {},
      sentimentEngagement: {},
      totalEngagement: 0.8,
      lastUpdatedAt: new Date(),
    };

    const topics = ['science', 'tech'];
    const authors = ['alice', 'bob'];
    const sentiments = ['analysis'];

    const array = normalizeEngagementVector(vector, topics, authors, sentiments);

    expect(array[0]).toBe(0); // science (missing)
    expect(array[1]).toBe(0.8); // tech
    expect(array[2]).toBe(0); // alice (missing)
    expect(array[3]).toBe(0); // bob (missing)
  });
});

describe('userSimilarity - Similarity Matrix Computation', () => {
  let users: UserEngagementVector[];

  beforeEach(() => {
    users = [
      {
        userId: 'user1',
        topicEngagement: { tech: 0.8, science: 0.3 },
        authorEngagement: { alice: 0.7 },
        sentimentEngagement: { analysis: 0.5 },
        totalEngagement: 2.3,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user2',
        topicEngagement: { tech: 0.9, science: 0.2 },
        authorEngagement: { alice: 0.8 },
        sentimentEngagement: { analysis: 0.6 },
        totalEngagement: 2.5,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user3',
        topicEngagement: { science: 0.9, history: 0.4 },
        authorEngagement: { bob: 0.6 },
        sentimentEngagement: { feature: 0.7 },
        totalEngagement: 2.6,
        lastUpdatedAt: new Date(),
      },
    ];
  });

  it('should compute similarity matrix with correct dimensions', () => {
    const matrix = computeSimilarityMatrix(users);

    expect(matrix.userIds).toEqual(['user1', 'user2', 'user3']);
    expect(matrix.similarities.size).toBe(3);

    for (const row of matrix.similarities.values()) {
      expect(row).toHaveLength(3);
    }
  });

  it('should have 1.0 on diagonal (self-similarity)', () => {
    const matrix = computeSimilarityMatrix(users);

    for (let i = 0; i < users.length; i++) {
      const row = matrix.similarities.get(users[i].userId);
      expect(row?.[i]).toBe(1.0);
    }
  });

  it('should compute non-trivial similarities', () => {
    const matrix = computeSimilarityMatrix(users);

    const row1 = matrix.similarities.get('user1');
    const row2 = matrix.similarities.get('user2');

    // user1 and user2 have similar profiles (both tech-focused)
    const sim12 = row1?.[1];
    expect(sim12).toBeGreaterThan(0.5);

    // user1 and user3 have different profiles
    const sim13 = row1?.[2];
    expect(sim13).toBeLessThan(0.8);
  });

  it('should include embeddings', () => {
    const matrix = computeSimilarityMatrix(users);

    expect(matrix.embeddings.size).toBe(3);
    for (const embedding of matrix.embeddings.values()) {
      expect(embedding).toHaveLength(50); // 50D embeddings
    }
  });

  it('should compute coverage metric', () => {
    const matrix = computeSimilarityMatrix(users);

    expect(matrix.coverage).toBeGreaterThanOrEqual(0);
    expect(matrix.coverage).toBeLessThanOrEqual(100);
  });

  it('should compute sparsity metric', () => {
    const matrix = computeSimilarityMatrix(users);

    expect(matrix.sparsity).toBeGreaterThanOrEqual(0);
    expect(matrix.sparsity).toBeLessThanOrEqual(100);
  });

  it('should record computation time', () => {
    const matrix = computeSimilarityMatrix(users);

    expect(matrix.computationTime).toBeGreaterThan(0);
    expect(matrix.computationTime).toBeLessThan(5000); // Should be fast
  });
});

describe('userSimilarity - K-Nearest Neighbors', () => {
  let matrix: ReturnType<typeof computeSimilarityMatrix>;

  beforeEach(() => {
    const users: UserEngagementVector[] = [
      {
        userId: 'user1',
        topicEngagement: { tech: 0.8 },
        authorEngagement: { alice: 0.7 },
        sentimentEngagement: { analysis: 0.5 },
        totalEngagement: 2.0,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user2',
        topicEngagement: { tech: 0.7 },
        authorEngagement: { alice: 0.8 },
        sentimentEngagement: { analysis: 0.6 },
        totalEngagement: 2.1,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user3',
        topicEngagement: { tech: 0.6 },
        authorEngagement: { alice: 0.9 },
        sentimentEngagement: { analysis: 0.7 },
        totalEngagement: 2.2,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user4',
        topicEngagement: { science: 0.9 },
        authorEngagement: { bob: 0.8 },
        sentimentEngagement: { feature: 0.6 },
        totalEngagement: 2.3,
        lastUpdatedAt: new Date(),
      },
    ];

    matrix = computeSimilarityMatrix(users);
  });

  it('should return k nearest neighbors', () => {
    const neighbors = getKNearestNeighbors('user1', matrix, 2);

    expect(neighbors).toHaveLength(2);
    expect(neighbors[0].userId).not.toBe('user1'); // Should not include self
    expect(neighbors[0].similarity).toBeGreaterThanOrEqual(neighbors[1].similarity); // Sorted
  });

  it('should return all neighbors if k > available', () => {
    const neighbors = getKNearestNeighbors('user1', matrix, 100);

    expect(neighbors.length).toBeLessThanOrEqual(3); // n-1 neighbors
  });

  it('should return empty array for non-existent user', () => {
    const neighbors = getKNearestNeighbors('user_unknown', matrix, 5);

    expect(neighbors).toEqual([]);
  });

  it('should return neighbors sorted by similarity', () => {
    const neighbors = getKNearestNeighbors('user1', matrix, 3);

    for (let i = 0; i < neighbors.length - 1; i++) {
      expect(neighbors[i].similarity).toBeGreaterThanOrEqual(neighbors[i + 1].similarity);
    }
  });
});

describe('userSimilarity - Metrics Computation', () => {
  let matrix: ReturnType<typeof computeSimilarityMatrix>;

  beforeEach(() => {
    const users: UserEngagementVector[] = [];
    for (let i = 0; i < 10; i++) {
      users.push({
        userId: `user${i}`,
        topicEngagement: { tech: Math.random() },
        authorEngagement: { alice: Math.random() },
        sentimentEngagement: { analysis: Math.random() },
        totalEngagement: Math.random() * 3,
        lastUpdatedAt: new Date(),
      });
    }
    matrix = computeSimilarityMatrix(users);
  });

  it('should compute valid similarity metrics', () => {
    const metrics = computeSimilarityMetrics(matrix);

    expect(metrics.coverage).toBeGreaterThanOrEqual(0);
    expect(metrics.coverage).toBeLessThanOrEqual(100);
    expect(metrics.sparsity).toBeGreaterThanOrEqual(0);
    expect(metrics.sparsity).toBeLessThanOrEqual(100);
    expect(metrics.avgNeighbors).toBeGreaterThanOrEqual(0);
    expect(metrics.computationTimeMs).toBeGreaterThan(0);
  });

  it('should include similarity distribution', () => {
    const metrics = computeSimilarityMetrics(matrix);

    expect(metrics.similarityDistribution.size).toBe(5); // 5 bins
    expect(metrics.similarityDistribution.has('[0.0-0.2)')).toBe(true);
    expect(metrics.similarityDistribution.has('[0.8-1.0]')).toBe(true);
  });
});
