import type { Request, Response } from 'express';
import type { Article } from '@shared/types';
import { RankingService } from '../services/RankingService.js';

interface HybridRecommendationRequest {
  userId: string;
  articles: Article[];
  ruleScores?: Record<string, number>; // from RulesEngine (12.1-12.3)
  categoryPreferences?: Array<{ category: string; score: number; signalCount: number }>;
  signalCount?: number; // from implicit-feedback (12.4)
  recentSignals?: boolean;
  limit?: number;
  variant?: 'control' | 'treatment'; // A/B test variant
}

interface HybridRecommendationResponse {
  articles: Array<Article & { rankScore: number; ruleScore: number; mlScore: number }>;
  variant: 'control' | 'treatment';
  timestamp: string;
  executionTimeMs: number;
}

const rankingService = new RankingService();

/**
 * Assign user to A/B test variant based on userId hash
 * Deterministic: same user always gets same variant
 */
function assignVariant(userId: string): 'control' | 'treatment' {
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  return hash % 2 === 0 ? 'control' : 'treatment';
}

/**
 * GET /api/recommendations/hybrid
 * Hybrid ranking combining rules + ML + trending
 *
 * Query params:
 * - userId (required)
 * - limit (default: 10, max: 50)
 * - variant (optional: force control or treatment for testing)
 *
 * Request body (optional):
 * - articles: Article[]
 * - ruleScores: Record<string, number> (from RulesEngine)
 * - categoryPreferences: CategoryPreference[]
 * - signalCount: number (from implicit-feedback)
 * - recentSignals: boolean
 */
export async function getHybridRecommendations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const startTime = Date.now();

    const {
      userId,
      articles = [],
      ruleScores = {},
      categoryPreferences = [],
      signalCount = 0,
      recentSignals = false,
      limit = 10,
      variant: forcedVariant,
    } = req.body as HybridRecommendationRequest;

    // Validation
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    if (articles.length === 0) {
      res.status(400).json({ error: 'articles array is required' });
      return;
    }

    const limitClamped = Math.min(Math.max(limit || 10, 10), 50);

    // Assign variant (deterministic per user)
    const variant = forcedVariant || assignVariant(userId);

    // Cold-start fallback: control variant uses rules-only
    if (variant === 'control' || signalCount === 0) {
      // Control: rules-only ranking (simulate by setting ML weight to 0)
      const controlService = new RankingService({ mlWeight: 0 });

      const recommendations = controlService.rankFull(
        articles,
        ruleScores,
        {
          userId,
          signalCount,
          categoryPreferences,
          recentSignals,
        },
        limitClamped
      );

      const executionTimeMs = Date.now() - startTime;

      res.json({
        articles: recommendations,
        variant: 'control',
        timestamp: new Date().toISOString(),
        executionTimeMs,
      } as HybridRecommendationResponse);
      return;
    }

    // Treatment: hybrid ranking (rules + ML)
    const recommendations = rankingService.rankFull(
      articles,
      ruleScores,
      {
        userId,
        signalCount,
        categoryPreferences,
        recentSignals,
      },
      limitClamped
    );

    const executionTimeMs = Date.now() - startTime;

    // Validate performance requirement: <200ms (p95)
    if (executionTimeMs > 200) {
      console.warn(
        `[PERFORMANCE] Hybrid ranking took ${executionTimeMs}ms (target: <200ms)`
      );
    }

    res.json({
      articles: recommendations,
      variant: 'treatment',
      timestamp: new Date().toISOString(),
      executionTimeMs,
    } as HybridRecommendationResponse);
  } catch (error) {
    console.error('[ERROR] getHybridRecommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/recommendations/hybrid/track
 * Track A/B test metrics (CTR, engagement, return rate)
 *
 * Request body:
 * - userId
 * - articleId
 * - variant (control or treatment)
 * - event (click, view, engagement)
 * - metadata (optional)
 */
export interface ABTestMetric {
  userId: string;
  articleId: string;
  variant: 'control' | 'treatment';
  event: 'impression' | 'click' | 'engagement';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

const metrics: ABTestMetric[] = [];

export async function trackABTestMetric(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { userId, articleId, variant, event, metadata } = req.body;

    if (!userId || !articleId || !variant || !event) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const metric: ABTestMetric = {
      userId,
      articleId,
      variant,
      event,
      timestamp: new Date().toISOString(),
      metadata,
    };

    metrics.push(metric);

    res.json({ success: true, metric });
  } catch (error) {
    console.error('[ERROR] trackABTestMetric:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/recommendations/hybrid/metrics
 * Get A/B test metrics summary
 */
export interface ABTestMetricsSummary {
  control: {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    totalEngagement: number;
  };
  treatment: {
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    totalEngagement: number;
  };
  improvement: number; // (treatment.ctr - control.ctr) / control.ctr * 100
}

export async function getABTestMetrics(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const controlMetrics = metrics.filter((m) => m.variant === 'control');
    const treatmentMetrics = metrics.filter((m) => m.variant === 'treatment');

    const controlImpressions = controlMetrics.filter(
      (m) => m.event === 'impression'
    ).length;
    const controlClicks = controlMetrics.filter(
      (m) => m.event === 'click'
    ).length;
    const treatmentImpressions = treatmentMetrics.filter(
      (m) => m.event === 'impression'
    ).length;
    const treatmentClicks = treatmentMetrics.filter(
      (m) => m.event === 'click'
    ).length;

    const controlCTR =
      controlImpressions > 0 ? controlClicks / controlImpressions : 0;
    const treatmentCTR =
      treatmentImpressions > 0 ? treatmentClicks / treatmentImpressions : 0;

    const improvement =
      controlCTR > 0 ? ((treatmentCTR - controlCTR) / controlCTR) * 100 : 0;

    const summary: ABTestMetricsSummary = {
      control: {
        totalImpressions: controlImpressions,
        totalClicks: controlClicks,
        ctr: controlCTR,
        totalEngagement: controlMetrics.filter(
          (m) => m.event === 'engagement'
        ).length,
      },
      treatment: {
        totalImpressions: treatmentImpressions,
        totalClicks: treatmentClicks,
        ctr: treatmentCTR,
        totalEngagement: treatmentMetrics.filter(
          (m) => m.event === 'engagement'
        ).length,
      },
      improvement,
    };

    res.json(summary);
  } catch (error) {
    console.error('[ERROR] getABTestMetrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
