import { describe, it, expect } from 'vitest';
import {
  assignSerendipityVariant,
  computeSerendipityScore,
  getUserLambda,
  getUserVariantConfig,
  selectWinningVariant,
  SERENDIPITY_VARIANTS,
  SerendipityVariant,
} from '@/lib/topicRecommendationsTuning';

describe('topicRecommendationsTuning', () => {
  describe('assignSerendipityVariant', () => {
    it('should return consistent variant for same user', () => {
      const userId = 'user-123';
      const variant1 = assignSerendipityVariant(userId);
      const variant2 = assignSerendipityVariant(userId);
      expect(variant1).toBe(variant2);
    });

    it('should distribute users across variants', () => {
      const variants = new Set<SerendipityVariant>();
      for (let i = 0; i < 100; i++) {
        const variant = assignSerendipityVariant(`user-${i}`);
        variants.add(variant);
      }
      // All 4 variants should be represented
      expect(variants.size).toBe(4);
    });

    it('should return valid variant names', () => {
      const validVariants: SerendipityVariant[] = ['control', 'high_serendipity', 'balanced', 'safe'];
      for (let i = 0; i < 20; i++) {
        const variant = assignSerendipityVariant(`user-${i}`);
        expect(validVariants).toContain(variant);
      }
    });
  });

  describe('computeSerendipityScore', () => {
    it('should return 0 when both scores are 0', () => {
      const score = computeSerendipityScore(0, 0, 0.5);
      expect(score).toBe(0);
    });

    it('should apply lambda weighting correctly', () => {
      const collaborativeScore = 0.8;
      const serendipityScore = 0.4;
      const lambda = 0.5;

      // score = 0.5 × 0.8 + 0.5 × 0.4 = 0.4 + 0.2 = 0.6
      const score = computeSerendipityScore(collaborativeScore, serendipityScore, lambda);
      expect(score).toBeCloseTo(0.6, 2);
    });

    it('should favor serendipity when lambda is low (0.3)', () => {
      const collaborativeScore = 0.8;
      const serendipityScore = 0.9;

      const scoreLow = computeSerendipityScore(collaborativeScore, serendipityScore, 0.3);
      const scoreMid = computeSerendipityScore(collaborativeScore, serendipityScore, 0.5);

      // Lower lambda = higher weight on serendipity
      expect(scoreLow).toBeGreaterThan(scoreMid);
    });

    it('should favor collaboration when lambda is high (0.7)', () => {
      const collaborativeScore = 0.8;
      const serendipityScore = 0.2;

      const scoreHigh = computeSerendipityScore(collaborativeScore, serendipityScore, 0.7);
      const scoreMid = computeSerendipityScore(collaborativeScore, serendipityScore, 0.5);

      // Higher lambda = higher weight on collaboration
      expect(scoreHigh).toBeGreaterThan(scoreMid);
    });

    it('should throw error for invalid lambda', () => {
      expect(() => computeSerendipityScore(0.5, 0.5, -0.1)).toThrow();
      expect(() => computeSerendipityScore(0.5, 0.5, 1.5)).toThrow();
    });
  });

  describe('getUserLambda', () => {
    it('should return lambda for assigned variant', () => {
      const userId = 'user-test';
      const variant = assignSerendipityVariant(userId);
      const lambda = getUserLambda(userId);

      expect(lambda).toBe(SERENDIPITY_VARIANTS[variant].lambda);
    });

    it('should return lambda in valid range', () => {
      for (let i = 0; i < 10; i++) {
        const lambda = getUserLambda(`user-${i}`);
        expect(lambda).toBeGreaterThanOrEqual(0.3);
        expect(lambda).toBeLessThanOrEqual(0.7);
      }
    });
  });

  describe('getUserVariantConfig', () => {
    it('should return variant config with lambda', () => {
      const userId = 'user-123';
      const config = getUserVariantConfig(userId);

      expect(config).toHaveProperty('variant');
      expect(config).toHaveProperty('lambda');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('weight');
    });

    it('should be consistent with assigned variant', () => {
      const userId = 'user-456';
      const variant = assignSerendipityVariant(userId);
      const config = getUserVariantConfig(userId);

      expect(config.variant).toBe(variant);
      expect(config.lambda).toBe(SERENDIPITY_VARIANTS[variant].lambda);
    });
  });

  describe('selectWinningVariant', () => {
    it('should return a valid variant', () => {
      const winner = selectWinningVariant();
      const validVariants: SerendipityVariant[] = ['control', 'high_serendipity', 'balanced', 'safe'];
      expect(validVariants).toContain(winner);
    });

    it('should select variant with highest adoption rate', () => {
      // This test validates the logic; actual analytics are mocked
      const winner = selectWinningVariant();
      // In mock data, high_serendipity has highest adoption (0.14)
      expect(winner).toBe('high_serendipity');
    });
  });

  describe('Serendipity variants weight distribution', () => {
    it('should have total weight of 1.0', () => {
      const totalWeight = Object.values(SERENDIPITY_VARIANTS).reduce((sum, config) => sum + config.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);
    });

    it('should all have lambda values in valid range', () => {
      Object.values(SERENDIPITY_VARIANTS).forEach((config) => {
        expect(config.lambda).toBeGreaterThanOrEqual(0);
        expect(config.lambda).toBeLessThanOrEqual(1);
      });
    });
  });
});
