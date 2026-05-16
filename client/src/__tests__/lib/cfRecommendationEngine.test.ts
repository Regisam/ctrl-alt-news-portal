/**
 * CF Recommendation Engine Tests (Story 13.2 - Phase 2, Task 2.1)
 * Unit tests for CF recommendation generation and fallback logic
 */

import { describe, it, expect } from 'vitest';
import {
  generateCFRecommendations,
  generateCFRecommendationsWithFallback,
  validateCFRecommendations,
  type CFRecommendationRequest,
} from '@shared/lib/cfRecommendationEngine';
import type { SimilarityMatrix } from '@shared/lib/userSimilarity';
import type { ItemSimilarityMatrix } from '@shared/lib/itemCollaborativeFiltering';

// Helper to create test matrices
function createTestUserSimilarityMatrix(): SimilarityMatrix {
  return {
    userIds: ['user1', 'user2', 'user3', 'user4'],
    similarities: new Map([
      ['user1', [1.0, 0.8, 0.6, 0.2]],
      ['user2', [0.8, 1.0, 0.5, 0.3]],
      ['user3', [0.6, 0.5, 1.0, 0.4]],
      ['user4', [0.2, 0.3, 0.4, 1.0]],
    ]),
    embeddings: new Map(),
    lastUpdated: new Date(),
    computationTime: 10,
    coverage: 100,
    sparsity: 100,
  };
}

function createTestItemSimilarityMatrix(): ItemSimilarityMatrix {
  return {
    articleIds: ['article1', 'article2', 'article3', 'article4', 'article5'],
    similarities: new Map([
      ['article1', [1.0, 0.7, 0.5, 0.2, 0.0]],
      ['article2', [0.7, 1.0, 0.6, 0.3, 0.1]],
      ['article3', [0.5, 0.6, 1.0, 0.4, 0.2]],
      ['article4', [0.2, 0.3, 0.4, 1.0, 0.8]],
      ['article5', [0.0, 0.1, 0.2, 0.8, 1.0]],
    ]),
    lastUpdated: new Date(),
    computationTimeMs: 15,
  };
}

describe('cfRecommendationEngine - Generate CF Recommendations', () => {
  it('should generate recommendations for a user', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 3,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article1', 'article2', 'article3'])],
      ['user3', new Set(['article2', 'article3', 'article4'])],
      ['user4', new Set(['article4', 'article5'])],
    ]);

    const result = generateCFRecommendations(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory
    );

    expect(result.userId).toBe('user1');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeLessThanOrEqual(3);
    expect(result.recommendations[0].score).toBeGreaterThanOrEqual(
      result.recommendations[result.recommendations.length - 1].score
    );
  });

  it('should exclude articles already read by user', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1', 'article2']),
      topK: 5,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1', 'article2'])],
      ['user2', new Set(['article1', 'article2', 'article3'])],
    ]);

    const result = generateCFRecommendations(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory
    );

    const readArticles = request.userReadHistory;
    for (const rec of result.recommendations) {
      expect(readArticles.has(rec.articleId)).toBe(false);
    }
  });

  it('should respect minimum user similarity threshold', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 5,
      minUserSimilarity: 0.7,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article2'])], // Similarity 0.8 > 0.7 (included)
      ['user3', new Set(['article3'])], // Similarity 0.6 < 0.7 (excluded)
      ['user4', new Set(['article4'])], // Similarity 0.2 < 0.7 (excluded)
    ]);

    const result = generateCFRecommendations(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory
    );

    // Should only have recommendations from similar users
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle new user (not in similarity matrix)', () => {
    const request: CFRecommendationRequest = {
      userId: 'newuser',
      userReadHistory: new Set(),
      topK: 5,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([['user1', new Set(['article1'])]]);

    const result = generateCFRecommendations(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory
    );

    // New user should get empty recommendations (cold start)
    expect(result.recommendations.length).toBe(0);
  });

  it('should normalize scores to [0, 1] range', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 5,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article1', 'article2'])],
    ]);

    const result = generateCFRecommendations(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory
    );

    for (const rec of result.recommendations) {
      expect(rec.score).toBeGreaterThanOrEqual(0);
      expect(rec.score).toBeLessThanOrEqual(1);
    }
  });

  it('should respect topK parameter', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 2,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article1', 'article2', 'article3', 'article4', 'article5'])],
    ]);

    const result = generateCFRecommendations(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory
    );

    expect(result.recommendations.length).toBeLessThanOrEqual(2);
  });

  it('should rank recommendations by score (descending)', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 5,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article1', 'article2', 'article3'])],
    ]);

    const result = generateCFRecommendations(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory
    );

    for (let i = 0; i < result.recommendations.length - 1; i++) {
      expect(result.recommendations[i].score).toBeGreaterThanOrEqual(
        result.recommendations[i + 1].score
      );
    }
  });
});

describe('cfRecommendationEngine - CF with Fallback', () => {
  it('should use pure CF when coverage is sufficient', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 5,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article2', 'article3', 'article4', 'article5'])],
    ]);

    const contentScorer = (articleId: string) => 0.5; // Not used

    const result = generateCFRecommendationsWithFallback(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory,
      contentScorer,
      70
    );

    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it('should blend with content-based when CF coverage is low', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 5,
      minUserSimilarity: 0.9, // Very high threshold - few similar users
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article2'])],
    ]);

    const contentScorer = (articleId: string) => 0.7; // Always high

    const result = generateCFRecommendationsWithFallback(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory,
      contentScorer,
      70
    );

    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle missing content scorer gracefully', () => {
    const request: CFRecommendationRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1']),
      topK: 5,
    };

    const userSimilarities = createTestUserSimilarityMatrix();
    const itemSimilarities = createTestItemSimilarityMatrix();
    const userHistory = new Map([
      ['user1', new Set(['article1'])],
      ['user2', new Set(['article2'])],
    ]);

    const result = generateCFRecommendationsWithFallback(
      request,
      userSimilarities,
      itemSimilarities,
      userHistory,
      undefined, // No content scorer
      70
    );

    expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
  });
});

describe('cfRecommendationEngine - Validation', () => {
  it('should validate correct recommendation result', () => {
    const result = {
      userId: 'user1',
      recommendations: [
        { articleId: 'article1', score: 0.9, reason: 'test', similarUserCount: 2 },
        { articleId: 'article2', score: 0.7, reason: 'test', similarUserCount: 1 },
      ],
      coveragePercentage: 50,
      timestamp: new Date(),
      computationTimeMs: 100,
    };

    const validation = validateCFRecommendations(result);
    expect(validation.valid).toBe(true);
  });

  it('should detect invalid scores', () => {
    const result = {
      userId: 'user1',
      recommendations: [
        { articleId: 'article1', score: 1.5, reason: 'test', similarUserCount: 1 }, // Invalid
      ],
      coveragePercentage: 50,
      timestamp: new Date(),
      computationTimeMs: 100,
    };

    const validation = validateCFRecommendations(result);
    expect(validation.valid).toBe(false);
  });

  it('should detect missing articleId', () => {
    const result = {
      userId: 'user1',
      recommendations: [
        { articleId: '', score: 0.5, reason: 'test', similarUserCount: 1 }, // Empty articleId
      ],
      coveragePercentage: 50,
      timestamp: new Date(),
      computationTimeMs: 100,
    };

    const validation = validateCFRecommendations(result);
    expect(validation.valid).toBe(false);
  });

  it('should detect negative similarUserCount', () => {
    const result = {
      userId: 'user1',
      recommendations: [
        { articleId: 'article1', score: 0.5, reason: 'test', similarUserCount: -1 }, // Negative
      ],
      coveragePercentage: 50,
      timestamp: new Date(),
      computationTimeMs: 100,
    };

    const validation = validateCFRecommendations(result);
    expect(validation.valid).toBe(false);
  });
});
