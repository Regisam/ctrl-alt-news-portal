import { describe, it, expect, beforeEach } from 'vitest';
import {
  RankingService,
  type RankedArticle,
  type UserContext,
} from '../../services/RankingService';
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
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Web3 Guide',
    category: 'WEB3',
    url: '/articles/3',
    author: 'Charlie',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'ML Research',
    category: 'AI',
    url: '/articles/4',
    author: 'Alice',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'DevOps Tools',
    category: 'DEVOPS',
    url: '/articles/5',
    author: 'Dave',
    date: new Date().toISOString(),
  },
];

describe('RankingService', () => {
  let service: RankingService;

  beforeEach(() => {
    service = new RankingService();
    service.setTrendingArticles(['1', '5']); // articles 1 and 5 are trending
  });

  describe('scoreArticle', () => {
    it('should score cold-start user with rules only (0% ML)', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 0,
        categoryPreferences: [],
        recentSignals: false,
      };

      const scored = service.scoreArticle(mockArticles[0], 0.8, userContext);

      // Cold-start: score = rule_score * 1.0 + ml_score * 0.0 + trending_boost
      // = 0.8 * 1.0 + 0 * 0.0 + 0.2 = 1.0 (clamped)
      expect(scored.rankScore).toBe(1);
      expect(scored.mlScore).toBe(0);
    });

    it('should score warm user with 40% ML weight', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 2,
        categoryPreferences: [{ category: 'AI', score: 0.9, signalCount: 2 }],
        recentSignals: true,
      };

      const scored = service.scoreArticle(mockArticles[0], 0.7, userContext);

      // Warm user: ML weight = 0.4, Rule weight = 0.6
      // score = 0.7 * 0.6 + 0.9 * 0.4 * 1.0 + 0.2 = 0.42 + 0.36 + 0.2 = 0.98
      expect(scored.rankScore).toBeCloseTo(0.98, 2);
    });

    it('should score power user with 60% ML weight', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 10,
        categoryPreferences: [{ category: 'AI', score: 0.8, signalCount: 10 }],
        recentSignals: true,
      };

      const scored = service.scoreArticle(mockArticles[0], 0.6, userContext);

      // Power user: ML weight = 0.6, Rule weight = 0.4
      // score = 0.6 * 0.4 + 0.8 * 0.6 * 1.0 + 0.2 = 0.24 + 0.48 + 0.2 = 0.92
      expect(scored.rankScore).toBeCloseTo(0.92, 2);
    });

    it('should apply confidence decay for stale signals', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 2,
        categoryPreferences: [{ category: 'AI', score: 0.8, signalCount: 2 }],
        recentSignals: false, // stale signals (≥30 days)
      };

      const scored = service.scoreArticle(mockArticles[0], 0.7, userContext);

      // Decay factor = 0.7 for stale signals
      // score = 0.7 * 0.6 + 0.8 * 0.4 * 0.7 + 0.2 = 0.42 + 0.224 + 0.2 ≈ 0.844
      expect(scored.rankScore).toBeCloseTo(0.844, 2);
      expect(scored.confidenceDecay).toBe(0.7);
    });

    it('should include trending boost for trending articles', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 0,
        categoryPreferences: [],
        recentSignals: false,
      };

      // Article 1 is trending
      const scored = service.scoreArticle(mockArticles[0], 0.5, userContext);

      // Cold-start trending: score = 0.5 * 1.0 + 0 + 0.2 = 0.7
      expect(scored.rankScore).toBe(0.7);
    });
  });

  describe('rankArticles', () => {
    it('should rank articles by hybrid score', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 3,
        categoryPreferences: [
          { category: 'AI', score: 0.9, signalCount: 2 },
          { category: 'SECURITY', score: 0.6, signalCount: 1 },
        ],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8, // AI, trending
        '2': 0.7, // SECURITY
        '3': 0.5, // WEB3
        '4': 0.75, // AI
        '5': 0.6, // DEVOPS, trending
      };

      const ranked = service.rankArticles(
        mockArticles,
        ruleScores,
        userContext
      );

      // Articles should be sorted by rankScore (descending)
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].rankScore).toBeGreaterThanOrEqual(
          ranked[i + 1].rankScore
        );
      }
    });
  });

  describe('deduplicateArticles', () => {
    it('should remove duplicate article IDs', () => {
      const duplicate: RankedArticle = {
        ...mockArticles[0],
        rankScore: 0.9,
        ruleScore: 0.8,
        mlScore: 0.9,
        confidenceDecay: 1.0,
      };

      const articles: RankedArticle[] = [
        duplicate,
        { ...mockArticles[1], rankScore: 0.8, ruleScore: 0.7, mlScore: 0.8, confidenceDecay: 1.0 },
        duplicate, // duplicate
      ];

      const deduped = service.deduplicateArticles(articles);

      expect(deduped).toHaveLength(2);
      expect(deduped[0].id).toBe('1');
      expect(deduped[1].id).toBe('2');
    });
  });

  describe('applyDiversityFilter', () => {
    it('should ensure multi-category coverage', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 3,
        categoryPreferences: [
          { category: 'AI', score: 0.9, signalCount: 2 },
          { category: 'SECURITY', score: 0.7, signalCount: 1 },
        ],
        recentSignals: true,
      };

      const ranked: RankedArticle[] = [
        {
          ...mockArticles[0], // AI
          rankScore: 0.95,
          ruleScore: 0.9,
          mlScore: 0.95,
          confidenceDecay: 1.0,
        },
        {
          ...mockArticles[3], // AI (duplicate category)
          rankScore: 0.9,
          ruleScore: 0.85,
          mlScore: 0.9,
          confidenceDecay: 1.0,
        },
        {
          ...mockArticles[1], // SECURITY
          rankScore: 0.8,
          ruleScore: 0.75,
          mlScore: 0.8,
          confidenceDecay: 1.0,
        },
        {
          ...mockArticles[2], // WEB3 (not preferred)
          rankScore: 0.5,
          ruleScore: 0.5,
          mlScore: 0.5,
          confidenceDecay: 1.0,
        },
      ];

      const diverse = service.applyDiversityFilter(ranked, userContext);

      // Should have at least 1 AI and 1 SECURITY
      const categories = diverse.map((a) => a.category);
      expect(categories).toContain('AI');
      expect(categories).toContain('SECURITY');
    });
  });

  describe('isColdStartUser', () => {
    it('should identify cold-start users (0 signals)', () => {
      const coldStart: UserContext = {
        userId: 'new-user',
        signalCount: 0,
        categoryPreferences: [],
        recentSignals: false,
      };

      expect(service.isColdStartUser(coldStart)).toBe(true);
    });

    it('should identify warm users (1+ signals)', () => {
      const warmUser: UserContext = {
        userId: 'returning-user',
        signalCount: 2,
        categoryPreferences: [{ category: 'AI', score: 0.8, signalCount: 2 }],
        recentSignals: true,
      };

      expect(service.isColdStartUser(warmUser)).toBe(false);
    });
  });

  describe('rankFull', () => {
    it('should execute full pipeline: score → deduplicate → diversity', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 2,
        categoryPreferences: [
          { category: 'AI', score: 0.9, signalCount: 2 },
          { category: 'SECURITY', score: 0.6, signalCount: 1 },
        ],
        recentSignals: true,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8,
        '2': 0.7,
        '3': 0.5,
        '4': 0.75,
        '5': 0.6,
      };

      const result = service.rankFull(
        mockArticles,
        ruleScores,
        userContext,
        10
      );

      // Should return up to 10 articles
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result.length).toBeGreaterThan(0);

      // All IDs should be unique (deduped)
      const ids = result.map((a) => a.id);
      expect(ids).toEqual([...new Set(ids)]);

      // Note: rankFull applies diversity filtering which may reorder results
      // So we don't assert strict score ordering, just that results exist
    });

    it('should limit results to requested number', () => {
      const userContext: UserContext = {
        userId: 'user1',
        signalCount: 0,
        categoryPreferences: [],
        recentSignals: false,
      };

      const ruleScores: Record<string, number> = {
        '1': 0.8,
        '2': 0.7,
        '3': 0.5,
        '4': 0.75,
        '5': 0.6,
      };

      const result = service.rankFull(
        mockArticles,
        ruleScores,
        userContext,
        3
      );

      expect(result.length).toBeLessThanOrEqual(3);
    });
  });
});
