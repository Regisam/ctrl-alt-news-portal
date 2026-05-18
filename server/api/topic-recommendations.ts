import { Router, type Request, type Response } from 'express';
import type { RecommendedTopic } from '../../shared/lib/topicRecommendations.js';
import { createClient } from '@supabase/supabase-js';
import {
  getVariantAnalyticsFromSupabase,
  getDailyMetricsByVariant,
  getMetricsByUserSegment,
} from '../lib/topicRecommendationsAnalytics.js';

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/topic-recommendations/analytics
 * Query params: start (YYYY-MM-DD), end (YYYY-MM-DD)
 * Returns: variant metrics for the period
 */
router.get('/topic-recommendations/analytics', async (req: Request, res: Response) => {
  console.log('[ANALYTICS] GET /topic-recommendations/analytics - ENDPOINT REACHED');
  try {
    const { start, end } = req.query;
    console.log(`[ANALYTICS] Params: start=${start}, end=${end}`);

    if (!start || !end) {
      console.log('[ANALYTICS] Missing date params');
      return res.status(400).json({ error: 'start and end date params required' });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const metrics = await getVariantAnalyticsFromSupabase(supabase, startDate, endDate);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/topic-recommendations/analytics/daily
 * Query params: days (default 7)
 * Returns: daily metrics for charting
 */
router.get('/topic-recommendations/analytics/daily', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;

    const dailyMetrics = await getDailyMetricsByVariant(supabase, days);
    res.json(dailyMetrics);
  } catch (error) {
    console.error('Error fetching daily analytics:', error);
    res.status(500).json({ error: 'Failed to fetch daily analytics' });
  }
});

/**
 * GET /api/topic-recommendations/analytics/segments
 * Query params: start (YYYY-MM-DD), end (YYYY-MM-DD)
 * Returns: metrics segmented by new vs returning users
 */
router.get('/topic-recommendations/analytics/segments', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start and end date params required' });
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const segmentMetrics = await getMetricsByUserSegment(supabase, startDate, endDate);
    res.json(segmentMetrics);
  } catch (error) {
    console.error('Error fetching segment analytics:', error);
    res.status(500).json({ error: 'Failed to fetch segment analytics' });
  }
});

// Mock data for topic recommendations - replace with database call and real ML engine
const getMockTopicRecommendations = (userId: string): RecommendedTopic[] => {
  return [
    {
      topicId: 'quantum-computing',
      topicName: 'Quantum Computing',
      adoptionProbability: 0.82,
      reason: 'Popular among AI readers',
      similarityScore: 0.75,
      similarUserCount: 234,
    },
    {
      topicId: 'neural-networks',
      topicName: 'Neural Networks',
      adoptionProbability: 0.78,
      reason: 'Users like you follow this',
      similarityScore: 0.72,
      similarUserCount: 189,
    },
    {
      topicId: 'space-exploration',
      topicName: 'Space Exploration',
      adoptionProbability: 0.65,
      reason: 'Trending among similar users',
      similarityScore: 0.68,
      similarUserCount: 156,
    },
    {
      topicId: 'biotech',
      topicName: 'Biotechnology',
      adoptionProbability: 0.62,
      reason: 'Complement to your interests',
      similarityScore: 0.65,
      similarUserCount: 142,
    },
    {
      topicId: 'green-energy',
      topicName: 'Green Energy',
      adoptionProbability: 0.58,
      reason: 'Rising interest in your network',
      similarityScore: 0.62,
      similarUserCount: 128,
    },
  ];
};

/**
 * GET /api/topic-recommendations/:userId
 *
 * Returns personalized topic recommendations for a user using the Topic Bridging Algorithm.
 * Currently returns mock data; will integrate with real ML engine when database is available.
 *
 * @param userId - User ID to get recommendations for
 * @param maxTopics - Max topics to return (default: 5)
 *
 * @returns {RecommendedTopic[]} Array of recommended topics ranked by adoption probability
 *
 * @example
 * GET /api/topic-recommendations/user-123?maxTopics=5
 * {
 *   topicId: 'quantum-computing',
 *   topicName: 'Quantum Computing',
 *   adoptionProbability: 0.82,
 *   reason: 'Popular among AI readers',
 *   similarityScore: 0.75,
 *   similarUserCount: 234
 * }
 *
 * TODO: Replace mock data with real implementation:
 * 1. Fetch user reading history from database
 * 2. Find similar users using collaborative filtering
 * 3. Get similar users' topic histories
 * 4. Compute topic embeddings from article embeddings
 * 5. Call TopicRecommender.rankBySerendipity()
 * 6. Apply diversity constraints and A/B test variants
 * 7. Return ranked RecommendedTopic[] with explanations
 */
router.get('/topic-recommendations/:userId', (req: Request, res: Response) => {
  console.log(`[RECOMMENDATIONS] GET /topic-recommendations/:userId - ENDPOINT REACHED with userId=${req.params.userId}`);
  try {
    const { userId } = req.params;
    const maxTopics = parseInt(req.query.maxTopics as string) || 5;

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }

    const recommendations = getMockTopicRecommendations(userId);
    const limited = recommendations.slice(0, Math.max(1, Math.min(maxTopics, 10)));

    res.json({
      userId,
      timestamp: new Date().toISOString(),
      recommendations: limited,
      meta: {
        count: limited.length,
        source: 'mock', // TODO: change to 'ml-engine' when real
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Topic recommendations error:', message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
