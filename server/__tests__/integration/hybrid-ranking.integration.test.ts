import { describe, it, expect, beforeEach } from 'vitest';
import { RankingService } from '../../services/RankingService';
import type { Article } from '@shared/types';
import type { UserContext } from '../../services/RankingService';

/**
 * Integration tests for hybrid ranking pipeline
 * Tests the full flow: rules engine → ML confidence → A/B variants → diversity
 */

describe('Hybrid Ranking Integration', () => {
  let rankingService: RankingService;
  let articles: Article[];

  beforeEach(() => {
    rankingService = new RankingService();

    // Create realistic article corpus
    articles = [
      {
        id: '1',
        title: 'Breakthrough in GPT-4 Capabilities',
        category: 'AI',
        author: 'Alice Chen',
        url: '/articles/1',
        date: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Zero-Day Vulnerability in OpenSSL',
        category: 'SECURITY',
        author: 'Bob Smith',
        url: '/articles/2',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        title: 'Ethereum Staking Rewards Surge',
        category: 'WEB3',
        author: 'Charlie Brown',
        url: '/articles/3',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        title: 'Kubernetes Security Best Practices',
        category: 'DEVOPS',
        author: 'Dave Wilson',
        url: '/articles/4',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        title: 'Machine Learning Model Optimization',
        category: 'AI',
        author: 'Alice Chen',
        url: '/articles/5',
        date: new Date().toISOString(),
      },
      {
        id: '6',
        title: 'Quantum Computing Advances',
        category: 'AI',
        author: 'Eve Davis',
        url: '/articles/6',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '7',
        title: 'DeFi Smart Contract Audits',
        category: 'WEB3',
        author: 'Frank Miller',
        url: '/articles/7',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '8',
        title: 'Network Security Trends 2026',
        category: 'SECURITY',
        author: 'Grace Lee',
        url: '/articles/8',
        date: new Date().toISOString(),
      },
    ];

    // Set trending articles (high engagement)
    rankingService.setTrendingArticles(['1', '8']);
  });

  describe('Cold-Start User (New User)', () => {
    it('should return rules-only recommendations (no ML)', () => {
      const userContext: UserContext = {
        userId: 'new-user-123',
        signalCount: 0,
        categoryPreferences: [],
        recentSignals: false,
      };

      // Rules scores from RulesEngine (12.1-12.3)
      const ruleScores: Record<string, number> = {
        '1': 0.95, // trending + recent
        '2': 0.85,
        '3': 0.6, // older
        '4': 0.75,
        '5': 0.9, // recent
        '6': 0.65,
        '7': 0.55, // older
        '8': 0.92, // trending
      };

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        5
      );

      // Cold-start should get top rule-scored articles
      expect(recommendations).toHaveLength(5);
      expect(recommendations[0].id).toBe('1'); // rule score 0.95 + trending boost
      expect(recommendations[0].mlScore).toBe(0); // no ML for cold-start
    });

    it('should ensure diversity even for cold-start users', () => {
      const userContext: UserContext = {
        userId: 'new-user-456',
        signalCount: 0,
        categoryPreferences: [], // no preferences yet
        recentSignals: false,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.95,
        '2': 0.85,
        '3': 0.6,
        '4': 0.75,
        '5': 0.9,
        '6': 0.65,
        '7': 0.55,
        '8': 0.92,
      };

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        8
      );

      // Should have diverse categories (not all AI)
      const categories = new Set(recommendations.map((a) => a.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });

  describe('Warm User (Returning User with Signals)', () => {
    it('should blend rules + ML with 40% ML weight', () => {
      const userContext: UserContext = {
        userId: 'warm-user-789',
        signalCount: 3,
        categoryPreferences: [
          { category: 'AI', score: 0.95, signalCount: 3 },
          { category: 'SECURITY', score: 0.7, signalCount: 1 },
        ],
        recentSignals: true, // fresh signals
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8,
        '2': 0.7,
        '3': 0.6,
        '4': 0.75,
        '5': 0.85,
        '6': 0.9,
        '7': 0.55,
        '8': 0.75,
      };

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        5
      );

      // Should prioritize AI articles (user preference score 0.95)
      const aiArticles = recommendations.filter((a) => a.category === 'AI');
      expect(aiArticles.length).toBeGreaterThan(0);

      // ML scores should be applied (non-zero for preferred categories)
      const aiArticle = aiArticles[0];
      expect(aiArticle.mlScore).toBeGreaterThan(0);
    });

    it('should apply confidence decay for stale signals', () => {
      const userContext: UserContext = {
        userId: 'warm-user-old-signals',
        signalCount: 2,
        categoryPreferences: [
          { category: 'AI', score: 0.8, signalCount: 2 },
        ],
        recentSignals: false, // stale signals (≥30 days)
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8,
        '5': 0.85,
        '6': 0.9,
      };

      const recommendations = rankingService.rankFull(
        articles.filter((a) => a.category === 'AI'),
        ruleScores,
        userContext,
        3
      );

      // ML score should be decayed (0.8 * 0.7 = 0.56)
      for (const rec of recommendations) {
        expect(rec.confidenceDecay).toBe(0.7); // stale signal decay
      }
    });
  });

  describe('Power User (Engaged User)', () => {
    it('should leverage ML heavily (60% weight) for power users', () => {
      const userContext: UserContext = {
        userId: 'power-user-001',
        signalCount: 10,
        categoryPreferences: [
          { category: 'AI', score: 0.95, signalCount: 8 },
          { category: 'DEVOPS', score: 0.8, signalCount: 2 },
        ],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.7,
        '4': 0.6,
        '5': 0.75,
        '6': 0.8,
      };

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        4
      );

      // Power user should get AI-heavy recommendations
      const aiArticles = recommendations.filter((a) => a.category === 'AI');
      expect(aiArticles.length).toBeGreaterThan(1);

      // ML scores should be substantial (60% weight)
      for (const rec of aiArticles) {
        expect(rec.mlScore).toBeGreaterThan(0.7);
      }
    });

    it('should respect user diversity preferences even with ML', () => {
      const userContext: UserContext = {
        userId: 'power-user-002',
        signalCount: 15,
        categoryPreferences: [
          { category: 'AI', score: 0.9, signalCount: 10 },
          { category: 'SECURITY', score: 0.6, signalCount: 3 },
          { category: 'WEB3', score: 0.7, signalCount: 2 },
        ],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8,
        '2': 0.7,
        '3': 0.65,
        '4': 0.75,
        '5': 0.85,
        '6': 0.9,
        '7': 0.6,
        '8': 0.8,
      };

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        8
      );

      // Should have all preferred categories
      const categories = new Set(recommendations.map((a) => a.category));
      expect(categories.has('AI')).toBe(true);
      expect(categories.has('SECURITY')).toBe(true);
      expect(categories.has('WEB3')).toBe(true);
    });
  });

  describe('Rules + ML + Trending Integration', () => {
    it('should combine all three signals correctly', () => {
      const userContext: UserContext = {
        userId: 'integrated-user',
        signalCount: 5,
        categoryPreferences: [
          { category: 'AI', score: 0.85, signalCount: 5 },
        ],
        recentSignals: true,
      };

      // Rules from 12.1-12.3 (topic, author, trending)
      const ruleScores: Record<string, number> = {
        '1': 0.9, // high rule score + trending
        '2': 0.7,
        '3': 0.6,
        '4': 0.75,
        '5': 0.8, // high rule score, not trending
        '6': 0.85,
        '7': 0.55,
        '8': 0.92, // high rule score + trending
      };

      rankingService.setTrendingArticles(['1', '8']); // from 12.3

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        5
      );

      // Top recommendation should benefit from:
      // 1. High rule score (0.9)
      // 2. Preferred category (AI) → ML boost
      // 3. Trending status → trending boost
      const topArticle = recommendations[0];
      expect(topArticle.rankScore).toBeGreaterThan(0.8);
    });

    it('should handle deduplication correctly', () => {
      const userContext: UserContext = {
        userId: 'dedup-user',
        signalCount: 2,
        categoryPreferences: [{ category: 'AI', score: 0.9, signalCount: 2 }],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.95,
        '5': 0.9,
        '6': 0.88,
      };

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        3
      );

      // All articles should have unique IDs
      const ids = recommendations.map((a) => a.id);
      expect(ids.length).toBe(new Set(ids).size);
    });
  });

  describe('Performance under Load', () => {
    it('should rank 1000+ articles in <200ms', () => {
      // Create large article corpus
      const largeCorpus = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        title: `Article ${i}`,
        category: ['AI', 'SECURITY', 'WEB3', 'DEVOPS'][i % 4],
        author: `Author ${i % 50}`,
        url: `/articles/${i}`,
        date: new Date(Date.now() - (i % 100) * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const userContext: UserContext = {
        userId: 'perf-test-user',
        signalCount: 5,
        categoryPreferences: [
          { category: 'AI', score: 0.9, signalCount: 5 },
        ],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {};
      largeCorpus.forEach((a) => {
        ruleScores[a.id] = Math.random() * 0.8 + 0.2;
      });

      const startTime = performance.now();
      const recommendations = rankingService.rankFull(
        largeCorpus,
        ruleScores,
        userContext,
        10
      );
      const endTime = performance.now();

      const executionTime = endTime - startTime;

      // Should complete in <200ms (p95 target)
      expect(executionTime).toBeLessThan(200);
      expect(recommendations).toHaveLength(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty category preferences', () => {
      const userContext: UserContext = {
        userId: 'no-prefs-user',
        signalCount: 1,
        categoryPreferences: [], // no preferences yet
        recentSignals: false,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8,
        '2': 0.7,
      };

      const recommendations = rankingService.rankFull(
        articles.slice(0, 2),
        ruleScores,
        userContext,
        2
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].rankScore).toBeGreaterThan(0);
    });

    it('should handle missing rule scores gracefully', () => {
      const userContext: UserContext = {
        userId: 'missing-scores-user',
        signalCount: 2,
        categoryPreferences: [{ category: 'AI', score: 0.8, signalCount: 2 }],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8,
        // missing scores for other articles
      };

      const recommendations = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        5
      );

      // Should still return recommendations with default scores
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should clamp scores to [0, 1] range', () => {
      const userContext: UserContext = {
        userId: 'clamp-user',
        signalCount: 10,
        categoryPreferences: [{ category: 'AI', score: 1.0, signalCount: 10 }],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {
        '1': 1.0,
        '5': 1.0,
        '6': 1.0,
      };

      const recommendations = rankingService.rankFull(
        articles.filter((a) => a.category === 'AI'),
        ruleScores,
        userContext,
        3
      );

      // All scores should be ≤ 1.0
      for (const rec of recommendations) {
        expect(rec.rankScore).toBeLessThanOrEqual(1);
        expect(rec.rankScore).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
