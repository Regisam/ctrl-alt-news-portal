import { useState, useEffect, useCallback } from 'react';

interface SEOMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SocialMetrics {
  shares: number;
  engagement: number;
  reach: number;
}

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
}

interface TrendPoint {
  date: string;
  seo_clicks: number;
  social_shares: number;
  performance_score: number;
}

interface CombinedAnalytics {
  seo: SEOMetrics;
  social: SocialMetrics;
  performance: PerformanceMetrics;
  trends: TrendPoint[];
  growthComparison: {
    before: SEOMetrics & SocialMetrics;
    after: SEOMetrics & SocialMetrics;
    percentageChange: number;
  };
  loading: boolean;
  error: string | null;
}

export const useCombinedAnalytics = (days: number = 30): CombinedAnalytics => {
  const [data, setData] = useState<CombinedAnalytics>({
    seo: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    social: { shares: 0, engagement: 0, reach: 0 },
    performance: { lcp: 0, fid: 0, cls: 0 },
    trends: [],
    growthComparison: {
      before: { clicks: 0, impressions: 0, ctr: 0, position: 0, shares: 0, engagement: 0, reach: 0 },
      after: { clicks: 0, impressions: 0, ctr: 0, position: 0, shares: 0, engagement: 0, reach: 0 },
      percentageChange: 0,
    },
    loading: true,
    error: null,
  });

  const generateMockData = useCallback((): CombinedAnalytics => {
    const trends: TrendPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        seo_clicks: Math.floor(Math.random() * 200) + 50,
        social_shares: Math.floor(Math.random() * 100) + 20,
        performance_score: Math.floor(Math.random() * 30) + 70,
      });
    }

    const before = {
      clicks: 2340,
      impressions: 18900,
      ctr: 0.058,
      position: 5.8,
      shares: 156,
      engagement: 0.042,
      reach: 8900,
    };

    const after = {
      clicks: 3145,
      impressions: 24560,
      ctr: 0.072,
      position: 4.7,
      shares: 287,
      engagement: 0.068,
      reach: 14230,
    };

    const percentageChange = ((after.clicks - before.clicks) / before.clicks) * 100;

    return {
      seo: { clicks: after.clicks, impressions: after.impressions, ctr: after.ctr, position: after.position },
      social: { shares: after.shares, engagement: after.engagement, reach: after.reach },
      performance: { lcp: 2.1, fid: 45, cls: 0.08 },
      trends,
      growthComparison: { before, after, percentageChange },
      loading: false,
      error: null,
    };
  }, [days]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setData(generateMockData());
      } catch (err) {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to fetch analytics',
        }));
      }
    };

    fetchData();
  }, [days, generateMockData]);

  return data;
};
