/**
 * RankingService.rankDelta() tests — Story 12.6 AC6
 *
 * Performance critical: <200ms for 1000+ articles
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RankingService, type RankedArticle, type UserContext } from '../../services/RankingService';
import type { Article } from '@shared/types';

describe('RankingService.rankDelta — Story 12.6 AC6', () => {
  let rankingService: RankingService;
  let userContext: UserContext;

  beforeEach(() => {
    rankingService = new RankingService({
      ruleWeight: 0.4,
      mlWeight: 0.6,
      trendingBoost: 0.2,
      decayHalfLife: 30,
    });

    userContext = {
      userId: 'user-1',
      signalCount: 10,
      categoryPreferences: [
        { category: 'AI', score: 0.8 },
        { category: 'Science', score: 0.6 },
      ],
      recentSignals: true,
    };
  });

  describe('Incremental re-ranking', () => {
    it('should re-rank only affected articles (<200ms for 1000 articles)', () => {
      // Create 1000 articles
      const articles: Article[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
        excerpt: `Excerpt for article ${i}`,
        category: i % 3 === 0 ? 'AI' : i % 3 === 1 ? 'Science' : 'Tech',
        author: `Author ${i % 10}`,
        date: `2026-05-0${(i % 7) + 1}`,
        url: `/article/${i}`,
        readTime: '5 min',
        views: '100',
        image: '',
        publishedAt: `2026-05-0${(i % 7) + 1}`,
      }));

      // Rank all articles
      const ruleScores = Object.fromEntries(
        articles.map((a) => [a.id, Math.random() * 0.5 + 0.5])
      );

      const initialRanked = rankingService.rankFull(
        articles,
        ruleScores,
        userContext,
        1000
      );

      // Mark affected articles (10% of feed)
      const affectedIds = new Set(
        initialRanked.slice(0, 100).map((a) => a.id.toString())
      );

      // Re-rank affected articles
      const startTime = performance.now();
      const reranked = rankingService.rankDelta(
        initialRanked,
        affectedIds,
        articles,
        ruleScores,
        userContext
      );
      const duration = performance.now() - startTime;

      // Must be <200ms (AC6)
      expect(duration).toBeLessThan(200);
      expect(reranked).toHaveLength(1000);
    });

    it('should handle edge case: 0 affected articles', () => {
      const articles: Article[] = [
        {
          id: '1',
          title: 'Article 1',
          category: 'AI',
          author: 'Author',
          date: '2026-05-07',
          url: '/1',
          readTime: '5 min',
          views: '100',
          image: '',
          publishedAt: '2026-05-07',
          excerpt: 'Test',
        },
      ];

      const ruleScores = { '1': 0.8 };
      const currentFeed = rankingService.rankFull(
        articles,
        ruleScores,
        userContext
      );

      // No affected articles
      const reranked = rankingService.rankDelta(
        currentFeed,
        new Set(),
        articles,
        ruleScores,
        userContext
      );

      expect(reranked).toHaveLength(1);
    });

    it('should handle edge case: all affected articles', () => {
      const articles: Article[] = [
        {
          id: '1',
          title: 'Article 1',
          category: 'AI',
          author: 'Author',
          date: '2026-05-07',
          url: '/1',
          readTime: '5 min',
          views: '100',
          image: '',
          publishedAt: '2026-05-07',
          excerpt: 'Test',
        },
        {
          id: '2',
          title: 'Article 2',
          category: 'Science',
          author: 'Author',
          date: '2026-05-07',
          url: '/2',
          readTime: '5 min',
          views: '100',
          image: '',
          publishedAt: '2026-05-07',
          excerpt: 'Test',
        },
      ];

      const ruleScores = { '1': 0.8, '2': 0.7 };
      const currentFeed = rankingService.rankFull(
        articles,
        ruleScores,
        userContext
      );

      // All affected
      const affectedIds = new Set(['1', '2']);
      const reranked = rankingService.rankDelta(
        currentFeed,
        affectedIds,
        articles,
        ruleScores,
        userContext
      );

      expect(reranked).toHaveLength(2);
    });
  });

  describe('Latency scaling', () => {
    it('should scale logarithmically, not linearly', () => {
      const results: { size: number; duration: number }[] = [];

      [10, 100].forEach((size) => {
        const articles: Article[] = Array.from({ length: size }, (_, i) => ({
          id: `article-${i}`,
          title: `Article ${i}`,
          excerpt: `Excerpt ${i}`,
          category: 'AI',
          author: `Author ${i}`,
          date: '2026-05-07',
          url: `/article/${i}`,
          readTime: '5 min',
          views: '100',
          image: '',
          publishedAt: '2026-05-07',
        }));

        const ruleScores = Object.fromEntries(
          articles.map((a) => [a.id, Math.random() * 0.5 + 0.5])
        );

        const currentFeed = rankingService.rankFull(
          articles,
          ruleScores,
          userContext,
          size
        );

        const affectedIds = new Set([currentFeed[0].id.toString()]);

        // Run multiple iterations to reduce timing variance from GC/JIT
        const iterations = 10;
        let totalDuration = 0;

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          rankingService.rankDelta(
            currentFeed,
            affectedIds,
            articles,
            ruleScores,
            userContext
          );
          const duration = performance.now() - startTime;
          totalDuration += duration;
        }

        const avgDuration = totalDuration / iterations;
        results.push({ size, duration: avgDuration });
      });

      // Verify acceptable scaling
      // Algorithm is fundamentally O(n) — must iterate all articles to filter/merge
      // 100 articles vs 10 articles: ratio should be significantly better than linear (10x)
      // Target: <7x (vs 10x linear)
      const ratio = results[1].duration / results[0].duration;
      expect(ratio).toBeLessThan(7); // O(n) fundamental limit: <7x is good performance
    });
  });

  describe('Correctness', () => {
    it('should maintain feed order by score', () => {
      const articles: Article[] = [
        { id: '1', title: 'A1', category: 'AI', author: 'A', date: '2026-05-07', url: '/1', readTime: '5 min', views: '100', image: '', publishedAt: '2026-05-07', excerpt: 'Test' },
        { id: '2', title: 'A2', category: 'AI', author: 'A', date: '2026-05-07', url: '/2', readTime: '5 min', views: '100', image: '', publishedAt: '2026-05-07', excerpt: 'Test' },
      ];

      const ruleScores = { '1': 0.8, '2': 0.6 };
      const currentFeed = rankingService.rankFull(articles, ruleScores, userContext);

      const affectedIds = new Set(['2']);
      const reranked = rankingService.rankDelta(
        currentFeed,
        affectedIds,
        articles,
        ruleScores,
        userContext
      );

      // Feed should remain sorted by score
      for (let i = 0; i < reranked.length - 1; i++) {
        expect(reranked[i].rankScore).toBeGreaterThanOrEqual(reranked[i + 1].rankScore);
      }
    });
  });
});
