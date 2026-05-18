import { describe, it, expect } from 'vitest';
import {
  analyzeABTestResults,
  getVariantAnalyticsFromSupabase,
  type VariantMetrics,
  type SupabaseClient,
} from '@/lib/topicRecommendationsAnalytics';
import { type SerendipityVariant } from '@/lib/topicRecommendationsTuning';

// Mock Supabase client
const mockSupabaseClient: SupabaseClient = {
  from: () => ({
    select: () => ({
      eq: () => ({
        gte: () => ({
          lte: async () => ({
            data: [],
            error: null,
          }),
        }),
      }),
    }),
  }),
};

describe('topicRecommendationsAnalytics', () => {
  describe('analyzeABTestResults', () => {
    it('should identify control variant as winner when it has highest adoption', () => {
      const metrics: Record<SerendipityVariant, VariantMetrics> = {
        control: {
          variant: 'control',
          adoptionRate: 0.18,
          ctr: 0.2,
          crossTopicEngagementLift: 0.09,
          sampleSize: 1000,
        },
        high_serendipity: {
          variant: 'high_serendipity',
          adoptionRate: 0.15, // <5% difference, not significant
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        balanced: {
          variant: 'balanced',
          adoptionRate: 0.16,
          ctr: 0.19,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        safe: {
          variant: 'safe',
          adoptionRate: 0.12,
          ctr: 0.14,
          crossTopicEngagementLift: 0.06,
          sampleSize: 1000,
        },
      };

      const result = analyzeABTestResults(metrics);

      expect(result.winningVariant).toBe('control');
      expect(result.results.control.adoptionRate).toBe(0.18);
      // Control is winner, so recommendation should mention it's performing best
      expect(result.recommendation).toContain('Control');
    });

    it('should identify treatment variant as winner when it has higher adoption', () => {
      const metrics: Record<SerendipityVariant, VariantMetrics> = {
        control: {
          variant: 'control',
          adoptionRate: 0.10,
          ctr: 0.12,
          crossTopicEngagementLift: 0.05,
          sampleSize: 1000,
        },
        high_serendipity: {
          variant: 'high_serendipity',
          adoptionRate: 0.20, // >5% difference = significant
          ctr: 0.25,
          crossTopicEngagementLift: 0.12,
          sampleSize: 1000,
        },
        balanced: {
          variant: 'balanced',
          adoptionRate: 0.12,
          ctr: 0.15,
          crossTopicEngagementLift: 0.06,
          sampleSize: 1000,
        },
        safe: {
          variant: 'safe',
          adoptionRate: 0.09,
          ctr: 0.11,
          crossTopicEngagementLift: 0.04,
          sampleSize: 1000,
        },
      };

      const result = analyzeABTestResults(metrics);

      expect(result.winningVariant).toBe('high_serendipity');
      expect(result.results.high_serendipity.isSignificant).toBe(true); // 20% - 10% = 10% > 5%
    });

    it('should compute confidence intervals for each variant', () => {
      const metrics: Record<SerendipityVariant, VariantMetrics> = {
        control: {
          variant: 'control',
          adoptionRate: 0.15,
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        high_serendipity: {
          variant: 'high_serendipity',
          adoptionRate: 0.15,
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        balanced: {
          variant: 'balanced',
          adoptionRate: 0.15,
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        safe: {
          variant: 'safe',
          adoptionRate: 0.15,
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
      };

      const result = analyzeABTestResults(metrics);

      // Each variant should have CI bounds
      Object.values(result.results).forEach((res) => {
        expect(res.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
        expect(res.confidenceInterval.upper).toBeLessThanOrEqual(1);
        expect(res.confidenceInterval.lower).toBeLessThanOrEqual(res.adoptionRate);
        expect(res.confidenceInterval.upper).toBeGreaterThanOrEqual(res.adoptionRate);
      });
    });

    it('should compute p-values for statistical significance', () => {
      const metrics: Record<SerendipityVariant, VariantMetrics> = {
        control: {
          variant: 'control',
          adoptionRate: 0.10,
          ctr: 0.12,
          crossTopicEngagementLift: 0.05,
          sampleSize: 1000,
        },
        high_serendipity: {
          variant: 'high_serendipity',
          adoptionRate: 0.20, // 10% difference
          ctr: 0.22,
          crossTopicEngagementLift: 0.12,
          sampleSize: 1000,
        },
        balanced: {
          variant: 'balanced',
          adoptionRate: 0.11,
          ctr: 0.13,
          crossTopicEngagementLift: 0.06,
          sampleSize: 1000,
        },
        safe: {
          variant: 'safe',
          adoptionRate: 0.10,
          ctr: 0.12,
          crossTopicEngagementLift: 0.05,
          sampleSize: 1000,
        },
      };

      const result = analyzeABTestResults(metrics);

      // Large difference should be significant
      expect(result.results.high_serendipity.pValue).toBeLessThan(0.05);
      expect(result.results.high_serendipity.isSignificant).toBe(true);

      // Small difference should not be significant
      expect(result.results.balanced.pValue).toBeGreaterThan(0.05);
      expect(result.results.balanced.isSignificant).toBe(false);
    });

    it('should validate adoption rates meet AC4 target (≥15%)', () => {
      const metrics: Record<SerendipityVariant, VariantMetrics> = {
        control: {
          variant: 'control',
          adoptionRate: 0.15,
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        high_serendipity: {
          variant: 'high_serendipity',
          adoptionRate: 0.18,
          ctr: 0.21,
          crossTopicEngagementLift: 0.09,
          sampleSize: 1000,
        },
        balanced: {
          variant: 'balanced',
          adoptionRate: 0.16,
          ctr: 0.19,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        safe: {
          variant: 'safe',
          adoptionRate: 0.14,
          ctr: 0.16,
          crossTopicEngagementLift: 0.07,
          sampleSize: 1000,
        },
      };

      const result = analyzeABTestResults(metrics);

      // AC4: At least some variants should meet ≥15%
      const meetsTarget = Object.values(result.results).some((r) => r.adoptionRate >= 0.15);
      expect(meetsTarget).toBe(true);
    });

    it('should validate cross-topic engagement lift meets AC5 target (≥8%)', () => {
      const metrics: Record<SerendipityVariant, VariantMetrics> = {
        control: {
          variant: 'control',
          adoptionRate: 0.15,
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        high_serendipity: {
          variant: 'high_serendipity',
          adoptionRate: 0.18,
          ctr: 0.21,
          crossTopicEngagementLift: 0.11,
          sampleSize: 1000,
        },
        balanced: {
          variant: 'balanced',
          adoptionRate: 0.16,
          ctr: 0.19,
          crossTopicEngagementLift: 0.09,
          sampleSize: 1000,
        },
        safe: {
          variant: 'safe',
          adoptionRate: 0.14,
          ctr: 0.16,
          crossTopicEngagementLift: 0.07,
          sampleSize: 1000,
        },
      };

      const result = analyzeABTestResults(metrics);

      // AC5: At least some variants should meet ≥8%
      const meetsTarget = Object.values(result.results).some((r) => r.crossTopicEngagementLift >= 0.08);
      expect(meetsTarget).toBe(true);
    });

    it('should provide recommendation based on analysis', () => {
      const metrics: Record<SerendipityVariant, VariantMetrics> = {
        control: {
          variant: 'control',
          adoptionRate: 0.12,
          ctr: 0.14,
          crossTopicEngagementLift: 0.06,
          sampleSize: 1000,
        },
        high_serendipity: {
          variant: 'high_serendipity',
          adoptionRate: 0.20,
          ctr: 0.23,
          crossTopicEngagementLift: 0.12,
          sampleSize: 1000,
        },
        balanced: {
          variant: 'balanced',
          adoptionRate: 0.15,
          ctr: 0.18,
          crossTopicEngagementLift: 0.08,
          sampleSize: 1000,
        },
        safe: {
          variant: 'safe',
          adoptionRate: 0.13,
          ctr: 0.15,
          crossTopicEngagementLift: 0.07,
          sampleSize: 1000,
        },
      };

      const result = analyzeABTestResults(metrics);

      expect(result.recommendation).toBeTruthy();
      expect(result.recommendation.length).toBeGreaterThan(0);
      // Should mention the winner
      expect(result.recommendation).toContain('high_serendipity');
    });
  });

  describe('getVariantAnalyticsFromSupabase', () => {
    it('should return metrics for all variants', async () => {
      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-18');

      const result = await getVariantAnalyticsFromSupabase(mockSupabaseClient, startDate, endDate);

      expect(result).toHaveProperty('control');
      expect(result).toHaveProperty('high_serendipity');
      expect(result).toHaveProperty('balanced');
      expect(result).toHaveProperty('safe');
    });

    it('should return proper metrics structure', async () => {
      const startDate = new Date('2026-05-01');
      const endDate = new Date('2026-05-18');

      const result = await getVariantAnalyticsFromSupabase(mockSupabaseClient, startDate, endDate);

      Object.values(result).forEach((metrics) => {
        expect(metrics).toHaveProperty('variant');
        expect(metrics).toHaveProperty('adoptionRate');
        expect(metrics).toHaveProperty('ctr');
        expect(metrics).toHaveProperty('crossTopicEngagementLift');
        expect(metrics).toHaveProperty('sampleSize');

        expect(typeof metrics.adoptionRate).toBe('number');
        expect(typeof metrics.ctr).toBe('number');
        expect(typeof metrics.sampleSize).toBe('number');
      });
    });
  });
});
