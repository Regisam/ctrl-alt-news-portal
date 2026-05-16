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
  EXPERIMENT_VARIANTS,
  type EnsembleWeights,
  type HybridEngineConfig,
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
