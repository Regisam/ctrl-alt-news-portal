/**
 * Hybrid Recommendation Engine Tests (Story 13.3 - Phase 1)
 * Unit tests for signal normalization, weight blending, and configuration
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeSignalScores,
  normalizeAllSignals,
  getAllArticles,
  validateNormalizedScores,
  validateWeights,
  blendSignalScores,
  getDefaultWeights,
  getDefaultConfig,
  createConfig,
  integrateAllSignals,
  calculateRecencyScore,
  applyDiversityConstraints,
  enforceTopicDiversity,
  getSignalLabel,
  generateExplanation,
  addExplanability,
  assignUserVariant,
  createUserAssignment,
  getVariantConfig,
  createRecommendationEvent,
  computeCTR,
  computeAverageEngagementTime,
  computeSatisfactionScore,
  isSignificantDifference,
  EXPERIMENT_VARIANTS,
  type EnsembleWeights,
  type SignalEngines,
  type RecommendationEvent,
} from '@shared/lib/hybridRecommendationEngine';

describe('hybridRecommendationEngine - Normalization', () => {
  it('should normalize scores to [0, 1] range using min-max', () => {
    const scores = new Map([
      ['a1', 10],
      ['a2', 20],
      ['a3', 30],
    ]);

    const normalized = normalizeSignalScores(scores);

    expect(normalized.get('a1')).toBeCloseTo(0.0, 2);
    expect(normalized.get('a2')).toBeCloseTo(0.5, 2);
    expect(normalized.get('a3')).toBeCloseTo(1.0, 2);
  });

  it('should handle all equal scores (return 0.5)', () => {
    const scores = new Map([
      ['a1', 5],
      ['a2', 5],
      ['a3', 5],
    ]);

    const normalized = normalizeSignalScores(scores);

    expect(normalized.get('a1')).toBe(0.5);
    expect(normalized.get('a2')).toBe(0.5);
    expect(normalized.get('a3')).toBe(0.5);
  });

  it('should handle empty scores', () => {
    const scores = new Map<string, number>();
    const normalized = normalizeSignalScores(scores);
    expect(normalized.size).toBe(0);
  });

  it('should clamp negative normalized scores to 0', () => {
    const scores = new Map([
      ['a1', -10],
      ['a2', 0],
      ['a3', 10],
    ]);

    const normalized = normalizeSignalScores(scores);
    expect(normalized.get('a1')).toBeGreaterThanOrEqual(0);
    expect(normalized.get('a3')).toBeLessThanOrEqual(1);
  });

  it('should normalize all signals independently', () => {
    const rules = new Map([
      ['a1', 100],
      ['a2', 50],
    ]);
    const content = new Map([
      ['a1', 1],
      ['a2', 2],
    ]);
    const cf = new Map<string, number>();
    const popularity = new Map<string, number>();

    const allNormalized = normalizeAllSignals(rules, content, cf, popularity);

    // Rules: 100 → 1.0, 50 → 0.0
    expect(allNormalized.rules.get('a1')).toBeCloseTo(1.0, 2);
    expect(allNormalized.rules.get('a2')).toBeCloseTo(0.0, 2);

    // Content: 1 → 0.0, 2 → 1.0
    expect(allNormalized.content.get('a1')).toBeCloseTo(0.0, 2);
    expect(allNormalized.content.get('a2')).toBeCloseTo(1.0, 2);

    // CF and popularity empty
    expect(allNormalized.cf.size).toBe(0);
    expect(allNormalized.popularity.size).toBe(0);
  });
});

describe('hybridRecommendationEngine - Weight Validation', () => {
  it('should validate weights sum to ~1.0', () => {
    const valid: EnsembleWeights = { rules: 0.3, content: 0.4, cf: 0.3, popularity: 0.0 };
    const result = validateWeights(valid);
    expect(result.valid).toBe(true);
  });

  it('should reject weights that do not sum to 1.0', () => {
    const invalid: EnsembleWeights = { rules: 0.5, content: 0.5, cf: 0.5, popularity: 0.0 };
    const result = validateWeights(invalid);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('sum to');
  });

  it('should reject negative weights', () => {
    const invalid: EnsembleWeights = { rules: -0.1, content: 0.6, cf: 0.5, popularity: 0.0 };
    const result = validateWeights(invalid);
    expect(result.valid).toBe(false);
  });

  it('should allow weights with small tolerance', () => {
    const weights: EnsembleWeights = { rules: 0.3, content: 0.4, cf: 0.3, popularity: 0.001 };
    const result = validateWeights(weights);
    expect(result.valid).toBe(true);
  });
});

describe('hybridRecommendationEngine - Blending', () => {
  it('should blend signals using configurable weights', () => {
    const articles = new Set(['a1', 'a2']);
    const normalized = {
      rules: new Map([
        ['a1', 0.8],
        ['a2', 0.6],
      ]),
      content: new Map([
        ['a1', 0.5],
        ['a2', 0.9],
      ]),
      cf: new Map<string, number>(),
      popularity: new Map<string, number>(),
    };

    const weights: EnsembleWeights = { rules: 0.3, content: 0.7, cf: 0.0, popularity: 0.0 };
    const blended = blendSignalScores(articles, normalized, weights);

    // a1: (0.3 * 0.8) + (0.7 * 0.5) = 0.24 + 0.35 = 0.59
    expect(blended.get('a1')?.blendedScore).toBeCloseTo(0.59, 2);

    // a2: (0.3 * 0.6) + (0.7 * 0.9) = 0.18 + 0.63 = 0.81
    expect(blended.get('a2')?.blendedScore).toBeCloseTo(0.81, 2);
  });

  it('should track signal contributions', () => {
    const articles = new Set(['a1']);
    const normalized = {
      rules: new Map([['a1', 0.8]]),
      content: new Map([['a1', 0.5]]),
      cf: new Map([['a1', 0.6]]),
      popularity: new Map<string, number>(),
    };

    const weights: EnsembleWeights = { rules: 0.3, content: 0.4, cf: 0.3, popularity: 0.0 };
    const blended = blendSignalScores(articles, normalized, weights);

    const result = blended.get('a1');
    expect(result?.signals.length).toBe(3); // rules, content, cf
    expect(result?.signals.map(s => s.source)).toContain('rules');
    expect(result?.signals.map(s => s.source)).toContain('content');
    expect(result?.signals.map(s => s.source)).toContain('cf');
  });

  it('should not include signals with 0 score', () => {
    const articles = new Set(['a1']);
    const normalized = {
      rules: new Map([['a1', 0.8]]),
      content: new Map<string, number>(), // no score for a1
      cf: new Map<string, number>(),
      popularity: new Map<string, number>(),
    };

    const weights: EnsembleWeights = { rules: 1.0, content: 0.0, cf: 0.0, popularity: 0.0 };
    const blended = blendSignalScores(articles, normalized, weights);

    const result = blended.get('a1');
    expect(result?.signals.length).toBe(1); // only rules
    expect(result?.signals[0].source).toBe('rules');
  });
});

describe('hybridRecommendationEngine - Configuration', () => {
  it('should provide default weights', () => {
    const weights = getDefaultWeights();
    expect(weights.rules).toBe(0.3);
    expect(weights.content).toBe(0.4);
    expect(weights.cf).toBe(0.3);
    expect(weights.popularity).toBe(0.0);
  });

  it('should provide default config', () => {
    const config = getDefaultConfig();
    expect(config.weights.rules).toBe(0.3);
    expect(config.topK).toBe(10);
    expect(config.diversityPenalty).toBeCloseTo(0.15, 2);
  });

  it('should create custom config with overrides', () => {
    const custom = createConfig({ topK: 5, diversityPenalty: 0.2 });
    expect(custom.topK).toBe(5);
    expect(custom.diversityPenalty).toBeCloseTo(0.2, 2);
    expect(custom.weights.rules).toBe(0.3); // default preserved
  });

  it('should override weights in custom config', () => {
    const custom = createConfig({
      weights: { rules: 0.5, content: 0.3, cf: 0.2, popularity: 0.0 },
    });
    expect(custom.weights.rules).toBe(0.5);
    expect(custom.weights.content).toBe(0.3);
    expect(custom.weights.cf).toBe(0.2);
  });

  it('should provide experiment variants', () => {
    expect(EXPERIMENT_VARIANTS.control_rules_only).toBeDefined();
    expect(EXPERIMENT_VARIANTS.default_hybrid).toBeDefined();
    expect(EXPERIMENT_VARIANTS.cf_heavy).toBeDefined();

    // Validate all variants have valid weights
    for (const variant of Object.values(EXPERIMENT_VARIANTS)) {
      const result = validateWeights(variant.weights as EnsembleWeights);
      expect(result.valid).toBe(true);
    }
  });
});

describe('hybridRecommendationEngine - Utility Functions', () => {
  it('should collect all articles from all signals', () => {
    const rules = new Map([['a1', 0.8], ['a2', 0.6]]);
    const content = new Map([['a2', 0.5], ['a3', 0.7]]);
    const cf = new Map([['a3', 0.6], ['a4', 0.9]]);
    const popularity = new Map<string, number>();

    const all = getAllArticles(rules, content, cf, popularity);

    expect(all.size).toBe(4);
    expect(all.has('a1')).toBe(true);
    expect(all.has('a2')).toBe(true);
    expect(all.has('a3')).toBe(true);
    expect(all.has('a4')).toBe(true);
  });

  it('should validate normalized scores', () => {
    const valid = {
      rules: new Map([['a1', 0.5]]),
      content: new Map([['a1', 0.7]]),
      cf: new Map<string, number>(),
      popularity: new Map<string, number>(),
    };

    const result = validateNormalizedScores(valid);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid normalized scores', () => {
    const invalid = {
      rules: new Map([['a1', 1.5]]), // > 1.0
      content: new Map<string, number>(),
      cf: new Map<string, number>(),
      popularity: new Map<string, number>(),
    };

    const result = validateNormalizedScores(invalid);
    expect(result.valid).toBe(false);
  });
});

describe('hybridRecommendationEngine - A/B Testing & Harness (Task 3.1)', () => {
  it('should assign users consistently to variants', () => {
    const userId = 'user123';
    const variants = ['control_rules_only', 'default_hybrid'] as const;

    const variant1 = assignUserVariant(userId, variants);
    const variant2 = assignUserVariant(userId, variants);

    // Same user should get same variant (deterministic)
    expect(variant1).toBe(variant2);
  });

  it('should distribute users across variants', () => {
    const variants = ['control_rules_only', 'default_hybrid'] as const;
    const distribution = new Map<string, number>();

    // Assign 100 users
    for (let i = 0; i < 100; i++) {
      const variant = assignUserVariant(`user${i}`, variants);
      distribution.set(variant, (distribution.get(variant) || 0) + 1);
    }

    // Both variants should have users
    expect(distribution.size).toBeGreaterThanOrEqual(1);
    expect(distribution.get('control_rules_only')! + distribution.get('default_hybrid')!).toBe(100);
  });

  it('should create user assignment record', () => {
    const assignment = createUserAssignment('user123', 'default_hybrid');

    expect(assignment.userId).toBe('user123');
    expect(assignment.variantId).toBe('default_hybrid');
    expect(assignment.cohort).toBe('treatment');
    expect(assignment.assignedAt).toBeInstanceOf(Date);
  });

  it('should mark control variant as control cohort', () => {
    const assignment = createUserAssignment('user123', 'control_rules_only');

    expect(assignment.cohort).toBe('control');
  });

  it('should get variant configuration', () => {
    const config = getVariantConfig('default_hybrid');

    expect(config.weights.rules).toBe(0.3);
    expect(config.weights.content).toBe(0.4);
    expect(config.weights.cf).toBe(0.3);
  });

  it('should create recommendation event', () => {
    const event = createRecommendationEvent(
      'user123',
      'session456',
      'default_hybrid',
      'article789',
      1,
      0.85,
      'impression'
    );

    expect(event.userId).toBe('user123');
    expect(event.eventType).toBe('impression');
    expect(event.timestamp).toBeInstanceOf(Date);
  });

  it('should compute CTR correctly', () => {
    const events: RecommendationEvent[] = [
      createRecommendationEvent('u1', 's1', 'var1', 'a1', 1, 0.8, 'impression'),
      createRecommendationEvent('u1', 's1', 'var1', 'a1', 1, 0.8, 'click'),
      createRecommendationEvent('u2', 's2', 'var1', 'a2', 1, 0.7, 'impression'),
      createRecommendationEvent('u2', 's2', 'var1', 'a2', 1, 0.7, 'impression'),
    ];

    const ctr = computeCTR(events);

    expect(ctr.totalImpressions).toBe(3);
    expect(ctr.totalClicks).toBe(1);
    expect(ctr.ctr).toBeCloseTo(1 / 3, 2);
  });

  it('should compute average engagement time', () => {
    const events: RecommendationEvent[] = [
      createRecommendationEvent('u1', 's1', 'var1', 'a1', 1, 0.8, 'impression', {
        engagementTimeMs: 1000,
      }),
      createRecommendationEvent('u2', 's2', 'var1', 'a2', 1, 0.7, 'impression', {
        engagementTimeMs: 3000,
      }),
    ];

    const engagement = computeAverageEngagementTime(events);

    expect(engagement.averageTimeMs).toBe(2000);
    expect(engagement.sampleSize).toBe(2);
  });

  it('should compute satisfaction score', () => {
    const events: RecommendationEvent[] = [
      createRecommendationEvent('u1', 's1', 'var1', 'a1', 1, 0.8, 'feedback', {
        feedbackScore: 1,
      }),
      createRecommendationEvent('u2', 's2', 'var1', 'a2', 1, 0.7, 'feedback', {
        feedbackScore: -1,
      }),
      createRecommendationEvent('u3', 's3', 'var1', 'a3', 1, 0.6, 'feedback', {
        feedbackScore: 1,
      }),
    ];

    const satisfaction = computeSatisfactionScore(events);

    expect(satisfaction.averageScore).toBeCloseTo(1 / 3, 2);
    expect(satisfaction.likeRatio).toBeCloseTo(2 / 3, 2);
    expect(satisfaction.sampleSize).toBe(3);
  });

  it('should detect no significant difference with small sample', () => {
    const controlEvents: RecommendationEvent[] = [
      createRecommendationEvent('u1', 's1', 'control', 'a1', 1, 0.8, 'impression'),
      createRecommendationEvent('u2', 's2', 'control', 'a2', 1, 0.7, 'click'),
    ];

    const treatmentEvents: RecommendationEvent[] = [
      createRecommendationEvent('u3', 's3', 'treat', 'a3', 1, 0.9, 'impression'),
      createRecommendationEvent('u4', 's4', 'treat', 'a4', 1, 0.8, 'click'),
    ];

    const result = isSignificantDifference(controlEvents, treatmentEvents, 'ctr');

    expect(result.isSignificant).toBe(false);
  });

  it('should return zero effect size for equal rates', () => {
    const controlEvents: RecommendationEvent[] = Array(100)
      .fill(null)
      .map((_, i) => {
        if (i < 20) {
          return createRecommendationEvent(`u${i}`, `s${i}`, 'control', `a${i}`, 1, 0.8, 'click');
        }
        return createRecommendationEvent(`u${i}`, `s${i}`, 'control', `a${i}`, 1, 0.8, 'impression');
      });

    const treatmentEvents: RecommendationEvent[] = Array(100)
      .fill(null)
      .map((_, i) => {
        if (i < 20) {
          return createRecommendationEvent(`u${100 + i}`, `s${100 + i}`, 'treat', `a${100 + i}`, 1, 0.9, 'click');
        }
        return createRecommendationEvent(`u${100 + i}`, `s${100 + i}`, 'treat', `a${100 + i}`, 1, 0.9, 'impression');
      });

    const result = isSignificantDifference(controlEvents, treatmentEvents, 'ctr');

    expect(result.effectSize).toBeCloseTo(0, 1);
  });

  it('should handle empty event arrays gracefully', () => {
    const ctr = computeCTR([]);
    expect(ctr.ctr).toBe(0);

    const engagement = computeAverageEngagementTime([]);
    expect(engagement.averageTimeMs).toBe(0);

    const satisfaction = computeSatisfactionScore([]);
    expect(satisfaction.averageScore).toBe(0);
  });
});

describe('hybridRecommendationEngine - Explainability (Task 2.2)', () => {
  it('should get signal labels in English', () => {
    expect(getSignalLabel('rules', 'en')).toBe('Trending');
    expect(getSignalLabel('content', 'en')).toBe('Similar to your interests');
    expect(getSignalLabel('cf', 'en')).toBe('Popular with readers like you');
    expect(getSignalLabel('popularity', 'en')).toBe('Widely read');
  });

  it('should get signal labels in Portuguese', () => {
    expect(getSignalLabel('rules', 'pt')).toBe('Tendência');
    expect(getSignalLabel('content', 'pt')).toBe('Similar aos seus interesses');
    expect(getSignalLabel('cf', 'pt')).toBe('Popular entre leitores como você');
    expect(getSignalLabel('popularity', 'pt')).toBe('Amplamente lido');
  });

  it('should generate explanation with default config', () => {
    const recommendation: typeof integrateAllSignals extends (
      ...args: unknown[]
    ) => Promise<infer T>
      ? T extends Array<infer U>
        ? U
        : never
      : never = {
      articleId: 'a1',
      finalScore: 0.75,
      signals: [
        { articleId: 'a1', score: 0.9, source: 'rules' },
        { articleId: 'a1', score: 0.7, source: 'content' },
      ],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation);

    expect(explanation.reason).toContain('Recommended because');
    expect(explanation.reason).toContain('Trending');
    expect(explanation.signalBreakdown.length).toBeGreaterThan(0);
    expect(explanation.topSignal.source).toBe('rules');
    expect(explanation.confidence).toBeGreaterThan(0);
    expect(explanation.confidence).toBeLessThanOrEqual(1);
  });

  it('should generate explanation in Portuguese', () => {
    const recommendation: any = {
      articleId: 'a1',
      finalScore: 0.75,
      signals: [{ articleId: 'a1', score: 0.9, source: 'rules' }],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation, { locale: 'pt' });

    expect(explanation.reason).toContain('Recomendado porque');
  });

  it('should include percentages in reason when configured', () => {
    const recommendation: any = {
      articleId: 'a1',
      finalScore: 0.75,
      signals: [{ articleId: 'a1', score: 0.8, source: 'rules' }],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation, {
      includeScorePercentages: true,
    });

    expect(explanation.reason).toContain('%');
  });

  it('should exclude percentages when configured', () => {
    const recommendation: any = {
      articleId: 'a1',
      finalScore: 0.75,
      signals: [{ articleId: 'a1', score: 0.8, source: 'rules' }],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation, {
      includeScorePercentages: false,
    });

    expect(explanation.reason).not.toContain('%');
  });

  it('should respect maxSignalsToShow limit', () => {
    const recommendation: any = {
      articleId: 'a1',
      finalScore: 0.75,
      signals: [
        { articleId: 'a1', score: 0.9, source: 'rules' },
        { articleId: 'a1', score: 0.8, source: 'content' },
        { articleId: 'a1', score: 0.7, source: 'cf' },
        { articleId: 'a1', score: 0.6, source: 'popularity' },
      ],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation, {
      maxSignalsToShow: 2,
    });

    expect(explanation.signalBreakdown.length).toBeLessThanOrEqual(2);
  });

  it('should mark top signal in breakdown', () => {
    const recommendation: any = {
      articleId: 'a1',
      finalScore: 0.75,
      signals: [
        { articleId: 'a1', score: 0.9, source: 'rules' },
        { articleId: 'a1', score: 0.8, source: 'content' },
      ],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation);

    expect(explanation.signalBreakdown[0].isTopSignal).toBe(true);
    expect(explanation.signalBreakdown[1].isTopSignal).toBe(false);
  });

  it('should add explainability to batch recommendations', () => {
    const recommendations: any[] = [
      {
        articleId: 'a1',
        finalScore: 0.75,
        signals: [{ articleId: 'a1', score: 0.9, source: 'rules' }],
        reason: 'test',
        topSignal: 'rules',
      },
      {
        articleId: 'a2',
        finalScore: 0.65,
        signals: [{ articleId: 'a2', score: 0.8, source: 'content' }],
        reason: 'test',
        topSignal: 'content',
      },
    ];

    const result = addExplanability(recommendations);

    expect(result.length).toBe(2);
    expect(result[0].explanation).toBeDefined();
    expect(result[1].explanation).toBeDefined();
    expect(result[0].explanation.reason).toContain('Recommended');
    expect(result[1].explanation.reason).toContain('Recommended');
  });

  it('should calculate confidence score', () => {
    const recommendation: any = {
      articleId: 'a1',
      finalScore: 0.5,
      signals: [{ articleId: 'a1', score: 0.5, source: 'rules' }],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation);

    expect(explanation.confidence).toBeGreaterThan(0);
    expect(explanation.confidence).toBeLessThanOrEqual(1);
  });

  it('should include multiple signals in reason', () => {
    const recommendation: any = {
      articleId: 'a1',
      finalScore: 0.75,
      signals: [
        { articleId: 'a1', score: 0.9, source: 'rules' },
        { articleId: 'a1', score: 0.8, source: 'content' },
        { articleId: 'a1', score: 0.7, source: 'cf' },
      ],
      reason: 'test',
      topSignal: 'rules',
    };

    const explanation = generateExplanation(recommendation, {
      maxSignalsToShow: 3,
    });

    expect(explanation.reason).toContain('Trending');
    expect(explanation.reason).toContain('+');
  });
});

describe('hybridRecommendationEngine - Diversity Constraints (Task 2.1)', () => {
  it('should calculate recency score correctly', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

    const recentScore = calculateRecencyScore(yesterday.toISOString(), today);
    const oldScore = calculateRecencyScore(oneYearAgo.toISOString(), today);

    expect(recentScore).toBeGreaterThan(oldScore);
    expect(recentScore).toBeGreaterThan(0.9);
    expect(oldScore).toBeLessThan(0.1);
  });

  it('should apply topic diversity penalties', () => {
    const recommendations = [
      { articleId: 'a1', score: 0.9 },
      { articleId: 'a2', score: 0.8 },
      { articleId: 'a3', score: 0.7 },
    ];

    const articles = new Map([
      ['a1', { id: 'a1', category: 'AI', author: 'Alice' }],
      ['a2', { id: 'a2', category: 'AI', author: 'Bob' }], // Duplicate category
      ['a3', { id: 'a3', category: 'SCIENCE', author: 'Charlie' }],
    ]);

    const diversityConfig = { topicPenalty: 0.3, authorPenalty: 0, recencyBias: 0 };
    const result = applyDiversityConstraints(recommendations, articles as any, diversityConfig);

    // a2 should have lower score due to duplicate AI topic
    expect(result[1].score).toBeLessThan(recommendations[1].score);
    expect(result[2].score).toBeCloseTo(recommendations[2].score, 2);
  });

  it('should apply author diversity penalties', () => {
    const recommendations = [
      { articleId: 'a1', score: 0.9 },
      { articleId: 'a2', score: 0.8 },
    ];

    const articles = new Map([
      ['a1', { id: 'a1', category: 'AI', author: 'Alice' }],
      ['a2', { id: 'a2', category: 'SCIENCE', author: 'Alice' }], // Duplicate author
    ]);

    const diversityConfig = { topicPenalty: 0, authorPenalty: 0.2, recencyBias: 0 };
    const result = applyDiversityConstraints(recommendations, articles as any, diversityConfig);

    // a2 should have lower score due to duplicate Alice author
    expect(result[1].score).toBeLessThan(recommendations[1].score);
  });

  it('should apply recency boost', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const oldDate = new Date(today.getTime() - 200 * 24 * 60 * 60 * 1000);

    const recommendations = [
      { articleId: 'a1', score: 0.5 },
      { articleId: 'a2', score: 0.5 },
    ];

    const articles = new Map([
      ['a1', { id: 'a1', category: 'AI', author: 'Alice', date: yesterday.toISOString() }],
      ['a2', { id: 'a2', category: 'AI', author: 'Bob', date: oldDate.toISOString() }],
    ]);

    const diversityConfig = { topicPenalty: 0, authorPenalty: 0, recencyBias: 0.3 };
    const result = applyDiversityConstraints(recommendations, articles as any, diversityConfig);

    // Newer article should have higher score
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('should enforce minimum topic diversity', () => {
    const recommendations = [
      { articleId: 'a1', score: 0.9 },
      { articleId: 'a2', score: 0.85 },
      { articleId: 'a3', score: 0.8 },
      { articleId: 'a4', score: 0.75 },
    ];

    const articles = new Map([
      ['a1', { id: 'a1', category: 'AI' }],
      ['a2', { id: 'a2', category: 'AI' }],
      ['a3', { id: 'a3', category: 'SCIENCE' }],
      ['a4', { id: 'a4', category: 'ROBOTICS' }],
    ]);

    const result = enforceTopicDiversity(recommendations, articles as any, 0.5, 4);

    // Result should have diverse topics
    const topics = result.map((r) => articles.get(r.articleId.toString())?.category);
    const uniqueTopics = new Set(topics);

    expect(uniqueTopics.size).toBeGreaterThanOrEqual(2);
  });

  it('should respect topK limit with diversity', () => {
    const recommendations = Array.from({ length: 20 }, (_, i) => ({
      articleId: `a${i}`,
      score: 1 - i / 20,
    }));

    const articles = new Map(
      recommendations.map((r, i) => [
        r.articleId,
        { id: r.articleId, category: ['AI', 'SCIENCE', 'ROBOTICS'][i % 3] },
      ])
    );

    const result = enforceTopicDiversity(recommendations, articles as any, 0.4, 5);

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('should handle articles without metadata gracefully', () => {
    const recommendations = [
      { articleId: 'a1', score: 0.9 },
      { articleId: 'unknown', score: 0.8 },
    ];

    const articles = new Map([['a1', { id: 'a1', category: 'AI' }]]);

    const diversityConfig = { topicPenalty: 0.3, authorPenalty: 0.2, recencyBias: 0 };
    const result = applyDiversityConstraints(recommendations, articles as any, diversityConfig);

    expect(result.length).toBe(2);
    expect(result[1].diversityAdjustment).toBe(1.0); // No penalty applied
  });
});

describe('hybridRecommendationEngine - Signal Integration (Task 1.2)', () => {
  it('should integrate all signals and return blended recommendations', async () => {
    const mockEngines: SignalEngines = {
      rules: {
        getRecommendations: async () => [
          { articleId: 'a1', score: 100 },
          { articleId: 'a2', score: 80 },
        ],
      },
      content: {
        getRecommendations: async () => [
          { articleId: 'a1', score: 50 },
          { articleId: 'a3', score: 70 },
        ],
      },
      collaborativeFiltering: {
        getRecommendations: async () => [
          { articleId: 'a2', score: 60 },
          { articleId: 'a3', score: 90 },
        ],
      },
      popularity: {
        getRecommendations: async () => [{ articleId: 'a1', score: 30 }],
      },
    };

    const config = createConfig();
    const result = await integrateAllSignals('user1', mockEngines, config);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].articleId).toBeDefined();
    expect(result[0].finalScore).toBeGreaterThan(0);
    expect(result[0].finalScore).toBeLessThanOrEqual(1);
    expect(result[0].signals.length).toBeGreaterThan(0);
  });

  it('should normalize different signal score ranges independently', async () => {
    const mockEngines = {
      rules: {
        getRecommendations: async () => [
          { articleId: 'a1', score: 1000 }, // Large scale
          { articleId: 'a2', score: 500 },
        ],
      },
      content: {
        getRecommendations: async () => [
          { articleId: 'a1', score: 0.9 }, // Small scale
          { articleId: 'a2', score: 0.1 },
        ],
      },
      collaborativeFiltering: {
        getRecommendations: async () => [],
      },
      popularity: {
        getRecommendations: async () => [],
      },
    };

    const config = createConfig();
    const result = await integrateAllSignals('user1', mockEngines as SignalEngines, config);

    // All final scores should be in [0, 1]
    for (const rec of result) {
      expect(rec.finalScore).toBeGreaterThanOrEqual(0);
      expect(rec.finalScore).toBeLessThanOrEqual(1);
    }
  });

  it('should handle missing signal engines gracefully', async () => {
    const mockEngines = {
      rules: {
        getRecommendations: async () => [
          { articleId: 'a1', score: 100 },
          { articleId: 'a2', score: 80 },
        ],
      },
      // content and CF not provided
    };

    const config = createConfig({ minArticleScore: 0.1 });
    const result = await integrateAllSignals('user1', mockEngines as any, config);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].articleId).toBe('a1');
    expect(result[0].signals.length).toBe(1);
    expect(result[0].signals[0].source).toBe('rules');
  });

  it('should respect topK parameter in final results', async () => {
    const mockEngines = {
      rules: {
        getRecommendations: async () =>
          Array.from({ length: 20 }, (_, i) => ({
            articleId: `a${i}`,
            score: 100 - i,
          })),
      },
    };

    const config = createConfig({ topK: 5 });
    const result = await integrateAllSignals('user1', mockEngines as any, config);

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('should filter articles below minArticleScore threshold', async () => {
    const mockEngines = {
      rules: {
        getRecommendations: async () => [
          { articleId: 'a1', score: 100 },
          { articleId: 'a2', score: 1 }, // Will have very low blended score
        ],
      },
    };

    const config = createConfig({ minArticleScore: 0.3 });
    const result = await integrateAllSignals('user1', mockEngines as any, config);

    // Low-scoring article may be filtered out
    for (const rec of result) {
      expect(rec.finalScore).toBeGreaterThanOrEqual(config.minArticleScore);
    }
  });

  it('should rank articles by blended score descending', async () => {
    const mockEngines = {
      rules: {
        getRecommendations: async () => [
          { articleId: 'a1', score: 100 },
          { articleId: 'a2', score: 50 },
          { articleId: 'a3', score: 75 },
        ],
      },
    };

    const config = createConfig();
    const result = await integrateAllSignals('user1', mockEngines as SignalEngines, config);

    // Results should be sorted by finalScore descending
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].finalScore).toBeGreaterThanOrEqual(result[i].finalScore);
    }
  });

  it('should include signal breakdowns in results', async () => {
    const mockEngines = {
      rules: {
        getRecommendations: async () => [{ articleId: 'a1', score: 80 }],
      },
      content: {
        getRecommendations: async () => [{ articleId: 'a1', score: 60 }],
      },
      collaborativeFiltering: {
        getRecommendations: async () => [{ articleId: 'a1', score: 70 }],
      },
    };

    const config = createConfig();
    const result = await integrateAllSignals('user1', mockEngines as SignalEngines, config);

    expect(result[0].signals.length).toBe(3);
    expect(result[0].signals.map((s) => s.source)).toContain('rules');
    expect(result[0].signals.map((s) => s.source)).toContain('content');
    expect(result[0].signals.map((s) => s.source)).toContain('cf');
  });

  it('should generate readable reason strings', async () => {
    const mockEngines = {
      rules: {
        getRecommendations: async () => [{ articleId: 'a1', score: 80 }],
      },
      content: {
        getRecommendations: async () => [{ articleId: 'a1', score: 60 }],
      },
    };

    const config = createConfig();
    const result = await integrateAllSignals('user1', mockEngines as SignalEngines, config);

    expect(result[0].reason).toContain(':');
    expect(result[0].reason).toContain('%');
  });
});
