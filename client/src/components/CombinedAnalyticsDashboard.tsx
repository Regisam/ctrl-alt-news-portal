import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useCombinedAnalytics } from '../hooks/useCombinedAnalytics';

interface CombinedAnalyticsDashboardProps {
  days?: 30 | 60 | 90;
}

export const CombinedAnalyticsDashboard: React.FC<CombinedAnalyticsDashboardProps> = ({ days = 30 }) => {
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90>(days);
  const { seo, social, performance, trends, growthComparison, loading, error } = useCombinedAnalytics(selectedDays);

  const handleExport = () => {
    const csv = [
      ['Metric', 'Value'],
      ['SEO Clicks', seo.clicks],
      ['SEO Impressions', seo.impressions],
      ['SEO CTR', (seo.ctr * 100).toFixed(2) + '%'],
      ['Social Shares', social.shares],
      ['Social Engagement', (social.engagement * 100).toFixed(2) + '%'],
      ['LCP', seo.position.toFixed(1)],
      ['FID', performance.fid + 'ms'],
      ['CLS', performance.cls.toFixed(3)],
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Loading analytics...</p>
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <div className="flex gap-2">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDays(d as 30 | 60 | 90)}
              className={`px-4 py-2 rounded ${
                selectedDays === d
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export
          </button>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SEO Metrics */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">SEO Metrics</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Clicks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{seo.clicks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Impressions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{seo.impressions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CTR</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{(seo.ctr * 100).toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Social Metrics */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Social Metrics</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Shares</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{social.shares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Engagement</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{(social.engagement * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Reach</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{(social.reach / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Performance</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">LCP</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{performance.lcp.toFixed(1)}s</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">FID</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{performance.fid}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CLS</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{performance.cls.toFixed(3)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      {trends.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="seo_clicks" stroke="#3b82f6" name="SEO Clicks" />
              <Line type="monotone" dataKey="social_shares" stroke="#ef4444" name="Social Shares" />
              <Line type="monotone" dataKey="performance_score" stroke="#10b981" name="Performance Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Growth Comparison */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth Impact (EPIC-10)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Before</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                Clicks: <span className="font-bold">{growthComparison.before.clicks}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Impressions: <span className="font-bold">{growthComparison.before.impressions}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Shares: <span className="font-bold">{growthComparison.before.shares}</span>
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">After</p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                Clicks: <span className="font-bold text-green-600">{growthComparison.after.clicks}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Impressions: <span className="font-bold text-green-600">{growthComparison.after.impressions}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Shares: <span className="font-bold text-green-600">{growthComparison.after.shares}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-lg font-bold text-green-600">
            Overall Growth: +{growthComparison.percentageChange.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default CombinedAnalyticsDashboard;
