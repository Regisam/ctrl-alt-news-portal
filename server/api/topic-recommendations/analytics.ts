import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import {
  getVariantAnalyticsFromSupabase,
  getDailyMetricsByVariant,
  getMetricsByUserSegment,
} from '../../lib/topicRecommendationsAnalytics';

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
router.get('/', async (req, res) => {
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
router.get('/daily', async (req, res) => {
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
router.get('/segments', async (req, res) => {
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

export default router;
