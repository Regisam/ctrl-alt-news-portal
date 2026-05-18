import { describe, it, expect, beforeEach } from 'vitest';
import {
  getVariantAnalyticsFromSupabase,
  getDailyMetricsByVariant,
  getMetricsByUserSegment,
  analyzeABTestResults,
  type SupabaseClient,
  type VariantMetrics,
} from '@/lib/topicRecommendationsAnalytics';

describe('topicRecommendationsAnalytics', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: (table: string) => ({
        select: (columns: string) => ({
          gte: (column: string, value: string | number) => ({
            lte: async (column: string, value: string | number) => {
              if (table === 'user_recommendations') {
                return {
                  data: [
                    { user_id: 'user1', topic_id: 'topic1', variant: 'control', created_at: '2026-05-18T10:00:00Z' },
                    { user_id: 'user2', topic_id: 'topic2', variant: 'control', created_at: '2026-05-18T11:00:00Z' },
                    { user_id: 'user3', topic_id: 'topic1', variant: 'high_serendipity', created_at: '2026-05-18T12:00:00Z' },
                  ],
                  error: null,
                };
              }
              if (table === 'user_topic_interactions') {
                return {
                  data: [
                    { user_id: 'user1', topic_id: 'topic1', interaction_type: 'read', created_at: '2026-05-18T10:30:00Z' },
                    { user_id: 'user2', topic_id: 'topic2', interaction_type: 'bookmark', created_at: '2026-05-18T11:30:00Z' },
                  ],
                  error: null,
                };
              }
              return { data: [], error: null };
            },
          }),
        }),
      }),
    } as any;
  });

  describe('getVariantAnalyticsFromSupabase', () => {
    it('should return metrics for all variants', async () => {
      const startDate = new Date('2026-05-18T00:00:00Z');
      const endDate = new Date('2026-05-18T23:59:59Z');
      const result = await getVariantAnalyticsFromSupabase(mockSupabase, startDate, endDate);
      expect(result.control).toBeDefined();
      expect(result.high_serendipity).toBeDefined();
    });

    it('should calculate metrics in valid ranges', async () => {
      const startDate = new Date('2026-05-18T00:00:00Z');
      const endDate = new Date('2026-05-18T23:59:59Z');
      const result = await getVariantAnalyticsFromSupabase(mockSupabase, startDate, endDate);
      
      Object.values(result).forEach(metrics => {
        expect(metrics.adoptionRate).toBeGreaterThanOrEqual(0);
        expect(metrics.adoptionRate).toBeLessThanOrEqual(1);
        expect(metrics.ctr).toBeGreaterThanOrEqual(0);
        expect(metrics.sampleSize).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('analyzeABTestResults', () => {
    it('should identify winning variant by adoption rate', () => {
      const metrics: Record<any, VariantMetrics> = {
        control: { variant: 'control', adoptionRate: 0.15, ctr: 0.12, crossTopicEngagementLift: 0.08, sampleSize: 1000 },
        high_serendipity: { variant: 'high_serendipity', adoptionRate: 0.22, ctr: 0.15, crossTopicEngagementLift: 0.12, sampleSize: 1000 },
        balanced: { variant: 'balanced', adoptionRate: 0.18, ctr: 0.14, crossTopicEngagementLift: 0.10, sampleSize: 1000 },
        safe: { variant: 'safe', adoptionRate: 0.16, ctr: 0.13, crossTopicEngagementLift: 0.09, sampleSize: 1000 },
      };
      const result = analyzeABTestResults(metrics);
      expect(result.winningVariant).toBe('high_serendipity');
    });

    it('should compute valid p-values and confidence intervals', () => {
      const metrics: Record<any, VariantMetrics> = {
        control: { variant: 'control', adoptionRate: 0.15, ctr: 0.12, crossTopicEngagementLift: 0.08, sampleSize: 1000 },
        high_serendipity: { variant: 'high_serendipity', adoptionRate: 0.25, ctr: 0.18, crossTopicEngagementLift: 0.14, sampleSize: 1000 },
        balanced: { variant: 'balanced', adoptionRate: 0.15, ctr: 0.12, crossTopicEngagementLift: 0.08, sampleSize: 1000 },
        safe: { variant: 'safe', adoptionRate: 0.15, ctr: 0.12, crossTopicEngagementLift: 0.08, sampleSize: 1000 },
      };
      const result = analyzeABTestResults(metrics);
      
      Object.values(result.results).forEach(abTestResult => {
        expect(abTestResult.pValue).toBeGreaterThan(0);
        expect(abTestResult.pValue).toBeLessThan(1);
        expect(abTestResult.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
        expect(abTestResult.confidenceInterval.upper).toBeLessThanOrEqual(1);
      });
    });
  });
});
