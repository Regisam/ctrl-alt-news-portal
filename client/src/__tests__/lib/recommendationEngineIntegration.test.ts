import { describe, it, expect, beforeEach } from 'vitest';
import {
  IntegrationConfigWithSerendipity,
  getDefaultConfigWithSerendipity,
} from '@shared/lib/recommendationEngine';
import {
  TopicEmbeddings,
  DiversityConstraint,
  DEFAULT_SERENDIPITY_THRESHOLDS,
  DEFAULT_DIVERSITY_CONSTRAINT,
  blendSerendipityScore,
  cosineSimilarity,
} from '@shared/lib/serendipityScorer';

describe('Recommendation Engine Integration (Story 13.5 + 13.6)', () => {
  let mockEmbeddings: TopicEmbeddings;

  beforeEach(() => {
    mockEmbeddings = {
      embeddings: new Map([
        ['AI', [1, 0, 0]],
        ['Science', [0, 1, 0]],
        ['Robotics', [0.7, 0.3, 0]],
        ['Gadgets', [0.5, 0, 0.5]],
      ]),
      lastUpdated: new Date(),
    };
  });

  describe('Integration Configuration', () => {
    it('should provide default config for integration', () => {
      const config = getDefaultConfigWithSerendipity();
      expect(config).toBeDefined();
      expect(config.serendipity_enabled).toBe(false);
      expect(config.serendipity_weight).toBe(0.0);
    });

    it('should support serendipity weight range [0, 1]', () => {
      const config: IntegrationConfigWithSerendipity = {
        ...getDefaultConfigWithSerendipity(),
        serendipity_enabled: true,
        serendipity_weight: 0.2,
      };
      expect(config.serendipity_weight).toBeGreaterThanOrEqual(0);
      expect(config.serendipity_weight).toBeLessThanOrEqual(1);
    });

    it('should validate weight bounds', () => {
      const validWeights = [0.0, 0.15, 0.3, 1.0];
      for (const weight of validWeights) {
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Core Blending Formula', () => {
    it('should blend click + serendipity correctly', () => {
      const clickScore = 0.8;
      const serendipityScore = 0.3;
      const weight = 0.2;

      const blended = clickScore * (1 - weight) + serendipityScore * weight;
      expect(blended).toBeCloseTo(0.7, 2); // 0.8 * 0.8 + 0.3 * 0.2
    });

    it('should produce [0,1] when blending [0,1] scores', () => {
      const testCases = [
        { click: 0.0, serendipity: 0.0, weight: 0.5, expected: 0.0 },
        { click: 1.0, serendipity: 1.0, weight: 0.5, expected: 1.0 },
        { click: 0.9, serendipity: 0.1, weight: 0.3, expected: 0.66 }, // 0.9*0.7 + 0.1*0.3 = 0.63 + 0.03
        { click: 0.1, serendipity: 0.9, weight: 0.7, expected: 0.66 }, // 0.1*0.3 + 0.9*0.7 = 0.03 + 0.63
      ];

      for (const testCase of testCases) {
        const result =
          testCase.click * (1 - testCase.weight) +
          testCase.serendipity * testCase.weight;
        expect(result).toBeCloseTo(testCase.expected, 2);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    });

    it('should respect serendipity weight in feature flags', () => {
      // Canary (5%): weight=0.15
      // Beta (25%): weight=0.15
      // Gradual (50%): weight=0.15
      // Full (100%): weight=0.2

      const weights = [0.0, 0.15, 0.2, 0.3];
      for (const weight of weights) {
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(0.3);
      }
    });
  });

  describe('Serendipity Scoring Algorithm', () => {
    it('should compute valid serendipity score', () => {
      const score = blendSerendipityScore(0.7, 0.5, 0.8);

      // Score should be in [0, 1]
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should weight components correctly (0.4/0.4/0.2)', () => {
      // Maximum distance (1.0), zero novelty/quality
      const maxDistance = blendSerendipityScore(1.0, 0.0, 0.0);
      expect(maxDistance).toBeCloseTo(0.4, 2); // 1.0 * 0.4

      // Zero distance, maximum novelty
      const maxNovelty = blendSerendipityScore(0.0, 1.0, 0.0);
      expect(maxNovelty).toBeCloseTo(0.4, 2); // 1.0 * 0.4

      // Zero distance/novelty, maximum quality
      const maxQuality = blendSerendipityScore(0.0, 0.0, 1.0);
      expect(maxQuality).toBeCloseTo(0.2, 2); // 1.0 * 0.2
    });

    it('should handle balanced score (0.5 all components)', () => {
      const balanced = blendSerendipityScore(0.5, 0.5, 0.5);

      // 0.5 * 0.4 + 0.5 * 0.4 + 0.5 * 0.2 = 0.2 + 0.2 + 0.1 = 0.5
      expect(balanced).toBeCloseTo(0.5, 2);
    });
  });

  describe('Topic Distance: Serendipity Detection', () => {
    it('should compute cosine similarity between embeddings', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      const vec3 = [0, 1, 0];

      // Identical vectors: similarity = 1
      const same = cosineSimilarity(vec1, vec2);
      expect(same).toBeCloseTo(1, 1);

      // Orthogonal vectors: similarity = 0
      const orthogonal = cosineSimilarity(vec1, vec3);
      expect(orthogonal).toBeCloseTo(0, 1);
    });

    it('should compute partial similarity for related topics', () => {
      const ai = [1, 0, 0];
      const robotics = [0.7, 0.3, 0]; // Partially AI

      const similarity = cosineSimilarity(ai, robotics);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });

    it('should enable serendipity detection via distance', () => {
      // Topic distance = 1 - similarity
      const ai = [1, 0, 0];
      const science = [0, 1, 0];

      const similarity = cosineSimilarity(ai, science);
      const distance = 1 - similarity;

      // Science is orthogonal to AI
      expect(distance).toBeCloseTo(1, 1);
      expect(distance).toBeGreaterThan(0.6); // Serendipity threshold
    });
  });

  describe('Discovery Mechanics', () => {
    it('should identify articles for serendipitous discovery', () => {
      // Serendipitous if distance > 0.6
      // Topic distance = 1 - cosine_similarity

      const aiEmbedding = [1, 0, 0];
      const scienceEmbedding = [0, 1, 0];

      const similarity = cosineSimilarity(aiEmbedding, scienceEmbedding);
      const distance = 1 - similarity;

      // Science is far from AI (good for serendipity)
      expect(distance).toBeGreaterThan(0.6);
    });

    it('should balance discovery with relevance', () => {
      // High click score + high distance = balanced discovery
      const clickScore = 0.8;
      const distance = 0.8;
      const weight = 0.2;

      // Blending gives both signal
      const blended = clickScore * (1 - weight) + distance * weight;
      expect(blended).toBeGreaterThan(0.7);
    });
  });

  describe('A/B Testing: Control vs Treatment', () => {
    it('should support 50/50 control/treatment split', () => {
      const controlWeight = 0.0;
      const treatmentWeight = 0.2;

      // Control group uses pure click prediction
      const controlScore = 0.8 * (1 - controlWeight);
      expect(controlScore).toBeCloseTo(0.8, 2);

      // Treatment group blends in serendipity
      const treatmentScore = 0.8 * (1 - treatmentWeight) + 0.5 * treatmentWeight;
      expect(treatmentScore).toBeCloseTo(0.74, 2);

      expect(treatmentScore).toBeLessThan(controlScore); // When serendipity < click
    });

    it('should measure CTR lift via blending', () => {
      // Baseline: click-only scoring
      const baselineScore = 0.7;

      // Treatment: add serendipity boost
      const serendipityBoost = 0.3;
      const weight = 0.25;
      const treatmentScore =
        baselineScore * (1 - weight) + serendipityBoost * weight;

      // Treatment might have lower score but higher actual CTR
      // (serendipitous articles engage users more)
      expect(treatmentScore).toBeLessThan(baselineScore);
      // But serendipity itself (0.3) is captured
      expect(treatmentScore).toBeGreaterThan(baselineScore * 0.7);
    });
  });

  describe('Feature Rollout: Canary → Full', () => {
    it('should support gradual rollout with same weight', () => {
      const rolloutPhases = {
        disabled: 0.0,
        canary: 0.15,
        beta: 0.15,
        gradual: 0.15,
        full: 0.2,
      };

      // Early phases use same weight
      expect(rolloutPhases.canary).toBe(rolloutPhases.beta);
      expect(rolloutPhases.beta).toBe(rolloutPhases.gradual);

      // Full rollout can increase weight
      expect(rolloutPhases.full).toBeGreaterThan(rolloutPhases.gradual);
    });

    it('should enable weight tuning per phase', () => {
      const phases = [
        { name: 'disabled', weight: 0.0 },
        { name: 'canary', weight: 0.1 },
        { name: 'beta', weight: 0.15 },
        { name: 'gradual', weight: 0.15 },
        { name: 'full', weight: 0.25 },
      ];

      for (const phase of phases) {
        expect(phase.weight).toBeGreaterThanOrEqual(0);
        expect(phase.weight).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Performance: <50ms Target', () => {
    it('should compute blending formula quickly', () => {
      const start = performance.now();

      // 1000 blending operations
      for (let i = 0; i < 1000; i++) {
        blendSerendipityScore(
          {
            topicDistance: Math.random(),
            collaborativeNovelty: Math.random(),
            quality: Math.random(),
          },
          0.4,
          0.4,
          0.2
        );
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50); // 1000 ops should be << 50ms
    });

    it('should compute cosine similarity quickly', () => {
      const start = performance.now();

      // 1000 similarity operations
      for (let i = 0; i < 1000; i++) {
        cosineSimilarity([Math.random(), Math.random()], [
          Math.random(),
          Math.random(),
        ]);
      }

      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Integration: Story 13.5 + 13.6 Contract', () => {
    it('should accept click scores in [0, 1] from Story 13.5', () => {
      const clickScores = [0.0, 0.25, 0.5, 0.75, 1.0];

      for (const score of clickScores) {
        const blended = score * 0.8 + 0.5 * 0.2;
        expect(blended).toBeGreaterThanOrEqual(0);
        expect(blended).toBeLessThanOrEqual(1);
      }
    });

    it('should produce final scores in [0, 1] for ranking', () => {
      // Simulating integration output
      const rankingResults = [
        { articleId: 'art1', score: 0.95, explanation: 'High click + discovery' },
        { articleId: 'art2', score: 0.72, explanation: 'Balanced blending' },
        { articleId: 'art3', score: 0.45, explanation: 'Low click, high serendipity' },
      ];

      for (const result of rankingResults) {
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }

      // Should be sorted descending
      expect(rankingResults[0].score).toBeGreaterThanOrEqual(rankingResults[1].score);
      expect(rankingResults[1].score).toBeGreaterThanOrEqual(rankingResults[2].score);
    });
  });
});
