/**
 * CF Fallback Engine Tests (Story 13.2 - Phase 2, Task 2.2)
 * Unit tests for fallback logic, blending, and coverage handling
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeCoverage,
  blendRecommendations,
  applySerendipityDiversification,
  validateFallbackRecommendations,
  type FallbackEngineConfig,
} from '@shared/lib/cfFallbackEngine';

describe('cfFallbackEngine - Coverage Analysis', () => {
  it('should analyze coverage across signals', () => {
    const allArticles = new Set(['a1', 'a2', 'a3', 'a4', 'a5']);
    const cf = new Set(['a1', 'a2']);
    const content = new Set(['a2', 'a3', 'a4']);
    const rules = new Set(['a4', 'a5']);

    const coverage = analyzeCoverage(allArticles, cf, content, rules);

    expect(coverage.cfCoverage).toBe(40); // 2/5 = 40%
    expect(coverage.contentCoverage).toBe(60); // 3/5 = 60%
    expect(coverage.rulesCoverage).toBe(40); // 2/5 = 40%
    expect(coverage.overallCoverage).toBe(100); // Union = 5/5 = 100%
    expect(coverage.recommendableArticles).toBe(5);
  });

  it('should handle empty sets', () => {
    const coverage = analyzeCoverage(new Set(), new Set(), new Set(), new Set());

    expect(coverage.cfCoverage).toBe(0);
    expect(coverage.overallCoverage).toBe(0);
    expect(coverage.recommendableArticles).toBe(0);
  });

  it('should calculate partial coverage', () => {
    const allArticles = new Set(['a1', 'a2', 'a3']);
    const cf = new Set(['a1']);
    const content = new Set();
    const rules = new Set();

    const coverage = analyzeCoverage(allArticles, cf, content, rules);

    expect(coverage.cfCoverage).toBeCloseTo(33.33, 1);
    expect(coverage.contentCoverage).toBe(0);
    expect(coverage.overallCoverage).toBeCloseTo(33.33, 1);
  });
});

describe('cfFallbackEngine - Blend Recommendations', () => {
  it('should return pure CF when coverage is sufficient', () => {
    const cfRecs = [
      { articleId: 'a1', score: 0.9, reason: 'cf test', similarUserCount: 2 },
      { articleId: 'a2', score: 0.8, reason: 'cf test', similarUserCount: 1 },
    ];

    const contentRecs = [
      { articleId: 'a3', score: 0.7 },
      { articleId: 'a4', score: 0.6 },
    ];

    const rulesRecs = [
      { articleId: 'a5', score: 0.5 },
    ];

    const config: FallbackEngineConfig = { cfMinCoverage: 40 }; // 2/5 = 40%, meets threshold

    const result = blendRecommendations(cfRecs, contentRecs, rulesRecs, config);

    // Should return pure CF (2 articles)
    expect(result.length).toBe(2);
    expect(result.map((r) => r.articleId)).toEqual(['a1', 'a2']);
  });

  it('should blend signals when CF coverage is insufficient', () => {
    const cfRecs = [{ articleId: 'a1', score: 0.9, reason: 'cf test', similarUserCount: 1 }];

    const contentRecs = [
      { articleId: 'a2', score: 0.7 },
      { articleId: 'a3', score: 0.6 },
    ];

    const rulesRecs = [
      { articleId: 'a4', score: 0.5 },
    ];

    const config: FallbackEngineConfig = {
      cfMinCoverage: 50, // 1/4 = 25%, below threshold - blend
      contentSimilarityWeight: 0.3,
      ruleEngineWeight: 0.2,
    };

    const result = blendRecommendations(cfRecs, contentRecs, rulesRecs, config);

    // Should include articles from all signals
    const articleIds = result.map((r) => r.articleId);
    expect(articleIds).toContain('a1'); // CF
    expect(articleIds).toContain('a2'); // Content
  });

  it('should apply diversity penalty to fallback articles', () => {
    const cfRecs = [{ articleId: 'a1', score: 1.0, reason: 'cf', similarUserCount: 1 }];

    const contentRecs = [
      { articleId: 'a1', score: 0.8 }, // Same article - should be penalized
      { articleId: 'a2', score: 0.7 },
    ];

    const rulesRecs = [];

    const config: FallbackEngineConfig = {
      cfMinCoverage: 50,
      contentSimilarityWeight: 0.3,
      diversityPenalty: 0.2, // Penalize to 20%
    };

    const result = blendRecommendations(cfRecs, contentRecs, rulesRecs, config);

    // a1 should maintain CF score, a2 should have lower content score
    const a1Rec = result.find((r) => r.articleId === 'a1');
    const a2Rec = result.find((r) => r.articleId === 'a2');

    expect(a1Rec?.score).toBeCloseTo(1.0, 1); // CF dominates
    if (a2Rec) {
      expect(a2Rec.score).toBeLessThan(0.7); // Content score weighted + penalized
    }
  });

  it('should sort blended recommendations by score', () => {
    const cfRecs = [{ articleId: 'a1', score: 0.5, reason: 'cf', similarUserCount: 1 }];

    const contentRecs = [
      { articleId: 'a2', score: 0.9 },
      { articleId: 'a3', score: 0.7 },
    ];

    const rulesRecs = [];

    const result = blendRecommendations(cfRecs, contentRecs, rulesRecs, {
      cfMinCoverage: 30,
      contentSimilarityWeight: 1.0,
    });

    // Should be sorted descending
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
    }
  });

  it('should clamp combined scores to [0, 1]', () => {
    const cfRecs = [{ articleId: 'a1', score: 0.8, reason: 'cf', similarUserCount: 1 }];

    const contentRecs = [{ articleId: 'a1', score: 0.8 }];

    const rulesRecs = [{ articleId: 'a1', score: 0.8 }];

    const result = blendRecommendations(cfRecs, contentRecs, rulesRecs, {
      cfMinCoverage: 0,
      contentSimilarityWeight: 0.3,
      ruleEngineWeight: 0.3,
    });

    for (const rec of result) {
      expect(rec.score).toBeLessThanOrEqual(1.0);
    }
  });
});

describe('cfFallbackEngine - Serendipity Diversification', () => {
  it('should reduce score for articles in recent topics', () => {
    const recs = [
      { articleId: 'a1', score: 0.9, reason: 'test', similarUserCount: 1 },
      { articleId: 'a2', score: 0.8, reason: 'test', similarUserCount: 1 },
    ];

    const recentTopics = new Set(['tech', 'ai']);
    const topicMap = new Map([
      ['a1', 'tech'], // In recent topics
      ['a2', 'science'], // Not in recent topics
    ]);

    const result = applySerendipityDiversification(recs, recentTopics, topicMap, 0.5);

    const a1 = result.find((r) => r.articleId === 'a1');
    const a2 = result.find((r) => r.articleId === 'a2');

    expect(a1?.score).toBeLessThan(0.9); // Penalized
    expect(a2?.score).toBe(0.8); // Not penalized
  });

  it('should handle missing topic mapping', () => {
    const recs = [
      { articleId: 'a1', score: 0.9, reason: 'test', similarUserCount: 1 },
    ];

    const recentTopics = new Set(['tech']);
    const topicMap = new Map(); // Empty map

    const result = applySerendipityDiversification(recs, recentTopics, topicMap, 0.5);

    // Should not penalize if topic is not in map
    expect(result[0].score).toBe(0.9);
  });
});

describe('cfFallbackEngine - Validation', () => {
  it('should validate correct recommendations', () => {
    const recs = [
      { articleId: 'a1', score: 0.9, reason: 'test 1', similarUserCount: 1 },
      { articleId: 'a2', score: 0.7, reason: 'test 2', similarUserCount: 1 },
    ];

    const result = validateFallbackRecommendations(recs);
    expect(result.valid).toBe(true);
  });

  it('should detect duplicate articles', () => {
    const recs = [
      { articleId: 'a1', score: 0.9, reason: 'test 1', similarUserCount: 1 },
      { articleId: 'a1', score: 0.7, reason: 'test 2', similarUserCount: 1 }, // Duplicate
    ];

    const result = validateFallbackRecommendations(recs);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Duplicate');
  });

  it('should detect invalid scores', () => {
    const recs = [
      { articleId: 'a1', score: 1.5, reason: 'test', similarUserCount: 1 }, // > 1.0
    ];

    const result = validateFallbackRecommendations(recs);
    expect(result.valid).toBe(false);
  });

  it('should detect empty reason', () => {
    const recs = [
      { articleId: 'a1', score: 0.9, reason: '', similarUserCount: 1 }, // Empty reason
    ];

    const result = validateFallbackRecommendations(recs);
    expect(result.valid).toBe(false);
  });
});
