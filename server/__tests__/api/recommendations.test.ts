import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import {
  getHybridRecommendations,
  trackABTestMetric,
  getABTestMetrics,
} from '../../api/recommendations';
import type { Article } from '@shared/types';

const mockArticles: Article[] = [
  {
    id: '1',
    title: 'AI Breakthrough',
    category: 'AI',
    url: '/articles/1',
    author: 'Alice',
    date: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Security Update',
    category: 'SECURITY',
    url: '/articles/2',
    author: 'Bob',
    date: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Web3 Guide',
    category: 'WEB3',
    url: '/articles/3',
    author: 'Charlie',
    date: new Date().toISOString(),
  },
];

describe('Recommendations API', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe('getHybridRecommendations', () => {
    it('should require userId', async () => {
      mockReq = {
        body: {
          articles: mockArticles,
        },
      };

      await getHybridRecommendations(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'userId is required',
        })
      );
    });

    it('should require articles array', async () => {
      mockReq = {
        body: {
          userId: 'user1',
        },
      };

      await getHybridRecommendations(
        mockReq as Request,
        mockRes as Response
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'articles array is required',
        })
      );
    });

    it('should return control variant for cold-start users', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          articles: mockArticles,
          signalCount: 0, // cold-start
          limit: 3,
        },
      };

      await getHybridRecommendations(
        mockReq as Request,
        mockRes as Response
      );

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.variant).toBe('control');
      expect(callArgs.articles.length).toBeLessThanOrEqual(3);
      expect(callArgs.executionTimeMs).toBeDefined();
    });

    it('should assign consistent variant per user', async () => {
      const userId = 'user1';
      const firstReq = {
        body: {
          userId,
          articles: mockArticles,
          signalCount: 5,
        },
      };

      await getHybridRecommendations(firstReq as Request, mockRes as Response);
      const firstVariant = (mockRes.json as any).mock.calls[0][0].variant;

      // Reset mock
      (mockRes.json as any).mockClear();

      // Second request with same user
      const secondReq = {
        body: {
          userId,
          articles: mockArticles,
          signalCount: 5,
        },
      };

      await getHybridRecommendations(
        secondReq as Request,
        mockRes as Response
      );
      const secondVariant = (mockRes.json as any).mock.calls[0][0].variant;

      // Same user should get same variant
      expect(firstVariant).toBe(secondVariant);
    });

    it('should respect limit parameter (max 50)', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          articles: mockArticles,
          signalCount: 5,
          limit: 100, // over max
        },
      };

      await getHybridRecommendations(
        mockReq as Request,
        mockRes as Response
      );

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.articles.length).toBeLessThanOrEqual(50);
    });

    it('should include rank score in response', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          articles: mockArticles,
          signalCount: 3,
          categoryPreferences: [{ category: 'AI', score: 0.9, signalCount: 3 }],
          ruleScores: {
            '1': 0.8,
            '2': 0.7,
            '3': 0.5,
          },
          limit: 3,
        },
      };

      await getHybridRecommendations(
        mockReq as Request,
        mockRes as Response
      );

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.articles.length).toBeGreaterThan(0);

      // Each article should have ranking scores
      for (const article of callArgs.articles) {
        expect(article.rankScore).toBeDefined();
        expect(article.ruleScore).toBeDefined();
        expect(article.mlScore).toBeDefined();
      }
    });

    it('should execute in under 200ms (performance target)', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          articles: mockArticles,
          signalCount: 5,
          limit: 10,
        },
      };

      await getHybridRecommendations(
        mockReq as Request,
        mockRes as Response
      );

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.executionTimeMs).toBeLessThan(200);
    });

    it('should force variant if specified', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          articles: mockArticles,
          signalCount: 5,
          variant: 'treatment', // force treatment
        },
      };

      await getHybridRecommendations(
        mockReq as Request,
        mockRes as Response
      );

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.variant).toBe('treatment');
    });
  });

  describe('trackABTestMetric', () => {
    it('should require all fields', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          // missing articleId, variant, event
        },
      };

      await trackABTestMetric(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should track metric with metadata', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          articleId: '1',
          variant: 'treatment',
          event: 'click',
          metadata: { position: 0, rankScore: 0.95 },
        },
      };

      await trackABTestMetric(mockReq as Request, mockRes as Response);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.metric).toEqual(
        expect.objectContaining({
          userId: 'user1',
          articleId: '1',
          variant: 'treatment',
          event: 'click',
        })
      );
    });

    it('should track metric without metadata', async () => {
      mockReq = {
        body: {
          userId: 'user1',
          articleId: '1',
          variant: 'control',
          event: 'impression',
        },
      };

      await trackABTestMetric(mockReq as Request, mockRes as Response);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.success).toBe(true);
      expect(callArgs.metric.metadata).toBeUndefined();
    });
  });

  describe('getABTestMetrics', () => {
    it('should return metrics summary with CTR calculation', async () => {
      // Simulate some metrics (would be populated by trackABTestMetric)
      // For this test, metrics array would be empty, so CTR = 0
      mockReq = {};

      await getABTestMetrics(mockReq as Request, mockRes as Response);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.control).toBeDefined();
      expect(callArgs.treatment).toBeDefined();
      expect(callArgs.improvement).toBeDefined();

      // With no metrics, CTR should be 0
      expect(callArgs.control.ctr).toBe(0);
      expect(callArgs.treatment.ctr).toBe(0);
    });

    it('should calculate improvement percentage', async () => {
      mockReq = {};

      await getABTestMetrics(mockReq as Request, mockRes as Response);

      const callArgs = (mockRes.json as any).mock.calls[0][0];

      // improvement = (treatment.ctr - control.ctr) / control.ctr * 100
      // With both at 0, improvement should be 0
      expect(typeof callArgs.improvement).toBe('number');
    });
  });

  describe('A/B Testing Flow', () => {
    it('should complete full A/B test flow', async () => {
      // 1. Get recommendations for user (should assign variant)
      const recommendationReq = {
        body: {
          userId: 'test-user',
          articles: mockArticles,
          signalCount: 2,
          limit: 3,
        },
      };

      await getHybridRecommendations(
        recommendationReq as Request,
        mockRes as Response
      );

      const recommendations = (mockRes.json as any).mock.calls[0][0];
      const variant = recommendations.variant;
      const articleId = recommendations.articles[0]?.id;

      expect(variant).toMatch(/control|treatment/);
      expect(articleId).toBeDefined();

      // 2. Track impression
      (mockRes.json as any).mockClear();
      const impressionReq = {
        body: {
          userId: 'test-user',
          articleId,
          variant,
          event: 'impression',
        },
      };

      await trackABTestMetric(impressionReq as Request, mockRes as Response);
      expect((mockRes.json as any).mock.calls[0][0].success).toBe(true);

      // 3. Track click
      (mockRes.json as any).mockClear();
      const clickReq = {
        body: {
          userId: 'test-user',
          articleId,
          variant,
          event: 'click',
        },
      };

      await trackABTestMetric(clickReq as Request, mockRes as Response);
      expect((mockRes.json as any).mock.calls[0][0].success).toBe(true);

      // 4. Get metrics
      (mockRes.json as any).mockClear();
      await getABTestMetrics({} as Request, mockRes as Response);

      const metrics = (mockRes.json as any).mock.calls[0][0];
      expect(metrics.control || metrics.treatment).toBeDefined();
    });
  });
});
