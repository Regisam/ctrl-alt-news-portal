import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Metric {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Query {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Page {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface TrendPoint {
  date: string;
  clicks: number;
  impressions: number;
}

interface GSCMetricsDashboardProps {
  siteUrl?: string;
  refreshInterval?: number;
}

export const GSCMetricsDashboard: React.FC<GSCMetricsDashboardProps> = ({
  siteUrl = 'https://ctrlaltnews.com',
  refreshInterval = 3600000, // 1 hour
}) => {
  const [metrics, setMetrics] = useState<Metric | null>(null);
  const [topQueries, setTopQueries] = useState<Query[]>([]);
  const [topPages, setTopPages] = useState<Page[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateMockTrendData = (): TrendPoint[] => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: Math.floor(Math.random() * 500) + 100,
        impressions: Math.floor(Math.random() * 2000) + 500,
      });
    }
    return data;
  };

  const generateMockQueries = (): Query[] => [
    { query: 'ai news today', clicks: 156, impressions: 2340, ctr: 0.067, position: 4.2 },
    { query: 'machine learning', clicks: 142, impressions: 2100, ctr: 0.068, position: 5.1 },
    { query: 'tech innovation', clicks: 128, impressions: 1890, ctr: 0.068, position: 6.3 },
    { query: 'robotics', clicks: 115, impressions: 1650, ctr: 0.070, position: 5.8 },
    { query: 'ctrl alt news', clicks: 98, impressions: 1200, ctr: 0.082, position: 2.1 },
  ];

  const generateMockPages = (): Page[] => [
    { page: '/article/ai-breakthrough-2026', clicks: 245, impressions: 3200, ctr: 0.077, position: 3.2 },
    { page: '/article/quantum-computing-advances', clicks: 198, impressions: 2800, ctr: 0.071, position: 4.5 },
    { page: '/category/robotics', clicks: 167, impressions: 2400, ctr: 0.070, position: 5.1 },
    { page: '/article/neural-networks', clicks: 154, impressions: 2100, ctr: 0.073, position: 4.8 },
    { page: '/', clicks: 142, impressions: 1900, ctr: 0.075, position: 5.3 },
  ];

  const generateMockMetrics = (): Metric => ({
    clicks: 1145,
    impressions: 15890,
    ctr: 0.072,
    position: 4.7,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Mock data fetch - in production, this would call actual GSC API
        await new Promise((resolve) => setTimeout(resolve, 500));

        setMetrics(generateMockMetrics());
        setTopQueries(generateMockQueries());
        setTopPages(generateMockPages());
        setTrendData(generateMockTrendData());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch GSC metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [siteUrl, refreshInterval]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Loading GSC metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900 rounded-lg">
        <p className="text-red-600 dark:text-red-200">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Google Search Console Analytics</h2>

      {/* Summary Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Clicks</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.clicks.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Impressions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.impressions.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg CTR</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{(metrics.ctr * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Position</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.position.toFixed(1)}</p>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">30-Day Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="clicks" stroke="#3b82f6" />
              <Line type="monotone" dataKey="impressions" stroke="#8b5cf6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Queries */}
      {topQueries.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Keywords</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topQueries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="query" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" />
              <Bar dataKey="impressions" fill="#8b5cf6" name="Impressions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Pages */}
      {topPages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Articles by Traffic</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-2 px-4 text-gray-600 dark:text-gray-300">Page</th>
                  <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-300">Clicks</th>
                  <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-300">Impressions</th>
                  <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-300">CTR</th>
                  <th className="text-right py-2 px-4 text-gray-600 dark:text-gray-300">Avg Position</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 px-4 text-gray-900 dark:text-gray-100">{page.page}</td>
                    <td className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">{page.clicks}</td>
                    <td className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">{page.impressions}</td>
                    <td className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">{(page.ctr * 100).toFixed(2)}%</td>
                    <td className="text-right py-2 px-4 text-gray-700 dark:text-gray-300">{page.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSCMetricsDashboard;
