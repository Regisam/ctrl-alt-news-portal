/**
 * CF Integration Tests (Story 13.2 - Phase 3, Task 3.1)
 * End-to-end tests validating complete CF recommendation pipeline
 * Uses user similarity (from 13.1), item similarity, engagement vectors, and CF engine
 */

import { describe, it, expect } from 'vitest';
import { computeSimilarityMatrix } from '@shared/lib/userSimilarity';
import { buildEngagementVector } from '@shared/lib/engagementVectors';
import { computeItemSimilarityMatrix } from '@shared/lib/itemCollaborativeFiltering';
import { buildCoReadMatrix } from '@shared/lib/coReadMatrix';
import { generateCFRecommendations, validateCFRecommendations } from '@shared/lib/cfRecommendationEngine';
import type { UserEngagementVector } from '@shared/lib/engagementVectors';
import type { UserReadHistory } from '@shared/lib/coReadMatrix';

describe('cfIntegration - End-to-End CF Pipeline', () => {
  it('should generate CF recommendations using integrated pipeline', () => {
    // Step 1: Create user engagement vectors (from Story 13.1)
    const engagementVectors: UserEngagementVector[] = [
      {
        userId: 'user1',
        topicEngagement: { tech: 0.8, science: 0.3 },
        authorEngagement: { alice: 0.7, bob: 0.4 },
        sentimentEngagement: { breaking: 0.6, analysis: 0.5 },
        totalEngagement: 2.3,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user2',
        topicEngagement: { tech: 0.7, science: 0.4 },
        authorEngagement: { alice: 0.6, bob: 0.5 },
        sentimentEngagement: { breaking: 0.7, analysis: 0.4 },
        totalEngagement: 2.4,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user3',
        topicEngagement: { tech: 0.3, science: 0.8 },
        authorEngagement: { alice: 0.2, bob: 0.8 },
        sentimentEngagement: { breaking: 0.3, analysis: 0.9 },
        totalEngagement: 2.3,
        lastUpdatedAt: new Date(),
      },
    ];

    // Step 2: Compute user similarity matrix (from Story 13.1)
    const userSimilarityMatrix = computeSimilarityMatrix(engagementVectors);
    expect(userSimilarityMatrix.userIds).toHaveLength(3);
    expect(userSimilarityMatrix.similarities.size).toBe(3);
    expect(userSimilarityMatrix.computationTime).toBeGreaterThanOrEqual(0);

    // Step 3: Create article read histories
    const userHistory: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2', 'article3'],
      },
      {
        userId: 'user2',
        articleIds: ['article2', 'article3', 'article4'],
      },
      {
        userId: 'user3',
        articleIds: ['article4', 'article5', 'article6'],
      },
    ];

    // Step 4: Build item similarity matrix (from coReadMatrix)
    const coReadMatrix = buildCoReadMatrix(userHistory);
    expect(coReadMatrix.entries.length).toBeGreaterThan(0);
    expect(coReadMatrix.articleCoReadMap.size).toBeGreaterThan(0);

    // Step 5: Create item similarity matrix
    const articleReaders = new Map([
      ['article1', new Set(['user1'])],
      ['article2', new Set(['user1', 'user2'])],
      ['article3', new Set(['user1', 'user2'])],
      ['article4', new Set(['user2', 'user3'])],
      ['article5', new Set(['user3'])],
      ['article6', new Set(['user3'])],
    ]);

    const itemSimilarityMatrix = computeItemSimilarityMatrix(articleReaders);
    expect(itemSimilarityMatrix.articleIds).toHaveLength(6);

    // Step 6: Convert user histories to set format for CF engine
    const userArticleHistory = new Map([
      ['user1', new Set(['article1', 'article2', 'article3'])],
      ['user2', new Set(['article2', 'article3', 'article4'])],
      ['user3', new Set(['article4', 'article5', 'article6'])],
    ]);

    // Step 7: Generate CF recommendations for user1
    const cfRequest = {
      userId: 'user1',
      userReadHistory: new Set(['article1', 'article2', 'article3']),
      topK: 3,
      minUserSimilarity: 0.3,
    };

    const result = generateCFRecommendations(
      cfRequest,
      userSimilarityMatrix,
      itemSimilarityMatrix,
      userArticleHistory
    );

    // Validate results
    expect(result.userId).toBe('user1');
    expect(result.recommendations.length).toBeLessThanOrEqual(3);

    // All recommendations should be unread articles
    for (const rec of result.recommendations) {
      expect(cfRequest.userReadHistory.has(rec.articleId)).toBe(false);
    }

    // Validate structure
    const validation = validateCFRecommendations(result);
    expect(validation.valid).toBe(true);
  });

  it('should handle multiple users with varying similarities', () => {
    // Create diverse user profiles
    const users: UserEngagementVector[] = [
      {
        userId: 'tech_enthusiast',
        topicEngagement: { tech: 0.95, science: 0.3, sports: 0.1 },
        authorEngagement: { alice: 0.8, bob: 0.5 },
        sentimentEngagement: { breaking: 0.7, analysis: 0.8 },
        totalEngagement: 3.0,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'tech_casual',
        topicEngagement: { tech: 0.6, science: 0.5, sports: 0.3 },
        authorEngagement: { alice: 0.5, bob: 0.6 },
        sentimentEngagement: { breaking: 0.6, analysis: 0.5 },
        totalEngagement: 2.5,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'sports_fan',
        topicEngagement: { tech: 0.1, science: 0.2, sports: 0.9 },
        authorEngagement: { alice: 0.2, bob: 0.3 },
        sentimentEngagement: { breaking: 0.4, analysis: 0.2 },
        totalEngagement: 1.8,
        lastUpdatedAt: new Date(),
      },
    ];

    const userMatrix = computeSimilarityMatrix(users);

    // tech_enthusiast and tech_casual should be more similar than with sports_fan
    const similarities = userMatrix.similarities.get('tech_enthusiast');
    const techCasualIdx = userMatrix.userIds.indexOf('tech_casual');
    const sportsFanIdx = userMatrix.userIds.indexOf('sports_fan');

    expect(similarities?.[techCasualIdx]).toBeGreaterThan(similarities?.[sportsFanIdx] ?? 0);
  });

  it('should scale to reasonable dataset sizes', () => {
    // Performance test: 100 users, 500 articles
    const users: UserEngagementVector[] = [];
    for (let i = 0; i < 100; i++) {
      users.push({
        userId: `user${i}`,
        topicEngagement: { tech: Math.random(), science: Math.random() },
        authorEngagement: { alice: Math.random(), bob: Math.random() },
        sentimentEngagement: { breaking: Math.random(), analysis: Math.random() },
        totalEngagement: Math.random() * 3,
        lastUpdatedAt: new Date(),
      });
    }

    const startTime = performance.now();
    const userMatrix = computeSimilarityMatrix(users);
    const userComputeTime = performance.now() - startTime;

    // Should compute user similarity in reasonable time (< 500ms for 100 users)
    expect(userComputeTime).toBeLessThan(500);

    // Create item similarity for 500 articles
    const articleReaders = new Map<string, Set<string>>();
    for (let i = 0; i < 500; i++) {
      articleReaders.set(`article${i}`, new Set());
    }

    // Random assignment of readers
    for (const user of users) {
      const numArticles = Math.floor(Math.random() * 20) + 5; // Each user reads 5-25 articles
      const articles = Array.from({ length: numArticles }, () =>
        `article${Math.floor(Math.random() * 500)}`
      );

      for (const article of articles) {
        const readers = articleReaders.get(article);
        if (readers) {
          readers.add(user.userId);
        }
      }
    }

    const itemStartTime = performance.now();
    const itemMatrix = computeItemSimilarityMatrix(articleReaders);
    const itemComputeTime = performance.now() - itemStartTime;

    // Should compute item similarity in reasonable time (< 1000ms)
    expect(itemComputeTime).toBeLessThan(1000);

    // Verify matrices are populated
    expect(userMatrix.userIds.length).toBe(100);
    expect(itemMatrix.articleIds.length).toBeLessThanOrEqual(500);
  });

  it('should handle cold start (new user) gracefully', () => {
    const userMatrix = computeSimilarityMatrix([
      {
        userId: 'existing_user',
        topicEngagement: { tech: 0.8 },
        authorEngagement: { alice: 0.7 },
        sentimentEngagement: { breaking: 0.6 },
        totalEngagement: 2.1,
        lastUpdatedAt: new Date(),
      },
    ]);

    const itemMatrix = computeItemSimilarityMatrix(
      new Map([['article1', new Set(['existing_user'])]])
    );

    // New user not in matrix
    const cfRequest = {
      userId: 'new_user',
      userReadHistory: new Set(),
      topK: 5,
    };

    const result = generateCFRecommendations(
      cfRequest,
      userMatrix,
      itemMatrix,
      new Map([['existing_user', new Set(['article1'])]])
    );

    // Should handle gracefully (return empty recommendations)
    expect(result.recommendations.length).toBe(0);
    expect(result.userId).toBe('new_user');
  });

  it('should validate complete recommendation pipeline', () => {
    // Integration test: full pipeline with validation at each step
    const vectors: UserEngagementVector[] = [
      {
        userId: 'user1',
        topicEngagement: { tech: 0.7 },
        authorEngagement: { alice: 0.6 },
        sentimentEngagement: { breaking: 0.5 },
        totalEngagement: 1.8,
        lastUpdatedAt: new Date(),
      },
      {
        userId: 'user2',
        topicEngagement: { tech: 0.6 },
        authorEngagement: { alice: 0.7 },
        sentimentEngagement: { breaking: 0.4 },
        totalEngagement: 1.7,
        lastUpdatedAt: new Date(),
      },
    ];

    const userMatrix = computeSimilarityMatrix(vectors);

    // Validate user matrix
    expect(userMatrix.userIds.every((id) => typeof id === 'string')).toBe(true);
    expect(Array.from(userMatrix.similarities.values()).every((row) => Array.isArray(row))).toBe(
      true
    );

    const itemMatrix = computeItemSimilarityMatrix(
      new Map([
        ['article1', new Set(['user1', 'user2'])],
        ['article2', new Set(['user1'])],
      ])
    );

    // Validate item matrix
    expect(itemMatrix.articleIds.every((id) => typeof id === 'string')).toBe(true);
    expect(
      Array.from(itemMatrix.similarities.values()).every((row) => Array.isArray(row))
    ).toBe(true);

    // Generate recommendations
    const result = generateCFRecommendations(
      { userId: 'user1', userReadHistory: new Set(['article1']), topK: 5 },
      userMatrix,
      itemMatrix,
      new Map([
        ['user1', new Set(['article1'])],
        ['user2', new Set(['article1', 'article2'])],
      ])
    );

    // Final validation
    const validation = validateCFRecommendations(result);
    expect(validation.valid).toBe(true);
  });
});
