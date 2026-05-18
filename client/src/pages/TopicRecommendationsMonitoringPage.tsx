import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { analyzeABTestResults, type VariantMetrics } from '../lib/topicRecommendationsAnalytics';
import { type SerendipityVariant } from '../lib/topicRecommendationsTuning';

/**
 * Topic Recommendations Monitoring Dashboard
 * AC10: Display daily CTR, adoption rate, cross-topic lift by variant
 * Story 14.1: Topic Recommendations Refinement & Serendipity Tuning
 */

const variantColors: Record<SerendipityVariant, string> = {
  control: '#3b82f6',
  high_serendipity: '#ef4444',
  balanced: '#f59e0b',
  safe: '#10b981',
};

const variantLabels: Record<SerendipityVariant, string> = {
  control: 'Control (Baseline)',
  high_serendipity: 'High Serendipity',
  balanced: 'Balanced',
  safe: 'Safe',
};

interface Alert {
  variant: SerendipityVariant;
  type: 'low_adoption' | 'sharp_drop';
  message: string;
  severity: 'warning' | 'critical';
}

function detectAlerts(
  metrics: Record<SerendipityVariant, VariantMetrics> | null,
  dailyData: Array<{ date: string; metrics: Record<SerendipityVariant, VariantMetrics> }>
): Alert[] {
  if (!metrics || dailyData.length < 2) return [];

  const alerts: Alert[] = [];
  const yesterday = dailyData[dailyData.length - 2];

  Object.entries(metrics).forEach(([variant, data]) => {
    const variantKey = variant as SerendipityVariant;

    // AC9a: Check adoption rate < 10%
    if (data.adoptionRate < 0.1) {
      alerts.push({
        variant: variantKey,
        type: 'low_adoption',
        message: `${variantLabels[variantKey]}: Low adoption rate (${(data.adoptionRate * 100).toFixed(1)}%)`,
        severity: 'critical',
      });
    }

    // AC9b: Check for >20% drop from yesterday
    if (yesterday && yesterday.metrics[variantKey]) {
      const yesterdayAdoption = yesterday.metrics[variantKey].adoptionRate;
      const drop = (yesterdayAdoption - data.adoptionRate) / yesterdayAdoption;
      if (drop > 0.2) {
        alerts.push({
          variant: variantKey,
          type: 'sharp_drop',
          message: `${variantLabels[variantKey]}: Sharp adoption drop (${(drop * 100).toFixed(1)}%)`,
          severity: 'warning',
        });
      }
    }
  });

  return alerts;
}

export default function TopicRecommendationsMonitoringPage() {
  const [metrics, setMetrics] = useState<Record<SerendipityVariant, VariantMetrics> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize date range once on mount
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return { start: sevenDaysAgo, end: today };
  });

  // Fetch daily data from API
  const [dailyData, setDailyData] = useState<Array<{ date: string; metrics: Record<SerendipityVariant, VariantMetrics> }>>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const alertsShownRef = useRef(new Set<string>());

  // Detect alerts when metrics or dailyData changes
  useEffect(() => {
    const newAlerts = detectAlerts(metrics, dailyData);
    setAlerts(newAlerts);
  }, [metrics, dailyData]);

  // Show toast notifications for new alerts
  useEffect(() => {
    alerts.forEach((alert) => {
      const alertKey = `${alert.variant}-${alert.type}`;
      if (!alertsShownRef.current.has(alertKey)) {
        const toastFn = alert.severity === 'critical' ? toast.error : toast.warning;
        toastFn(alert.message);
        alertsShownRef.current.add(alertKey);
      }
    });
  }, [alerts]);

  useEffect(() => {
    const fetchDailyMetrics = async () => {
      try {
        const response = await fetch(`/api/topic-recommendations/analytics/daily?days=7`);
        if (!response.ok) throw new Error('Failed to fetch daily metrics');
        const data = await response.json();

        // Transform daily metrics to chart format
        const chartData = data.map((day: { date: string; metrics: Record<SerendipityVariant, VariantMetrics> }) => ({
          date: day.date,
          'Control (Baseline)': day.metrics.control?.adoptionRate || 0,
          'High Serendipity': day.metrics.high_serendipity?.adoptionRate || 0,
          'Balanced': day.metrics.balanced?.adoptionRate || 0,
          'Safe': day.metrics.safe?.adoptionRate || 0,
        }));
        setDailyData(chartData);
      } catch (err) {
        console.error('Error fetching daily metrics:', err);
        setDailyData([]);
      }
    };

    // Fetch immediately on mount
    fetchDailyMetrics();

    // AC11: Hourly refresh (3600000ms = 1 hour)
    const interval = setInterval(fetchDailyMetrics, 3600000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch variant metrics from API
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/topic-recommendations/analytics?start=${dateRange.start}&end=${dateRange.end}`);
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  // Analyze metrics
  const analysis = useMemo(() => {
    if (!metrics) return null;
    return analyzeABTestResults(metrics);
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Analytics</h3>
            <p className="text-red-800 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Topic Recommendations A/B Test</h1>
          <p className="text-gray-600 mt-2">Monitor serendipity tuning variants in real-time</p>

          {/* Date Range */}
          <div className="mt-4 flex gap-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* AC9: Monitoring Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 text-lg">Active Alerts</h3>
                <p className="text-red-800 text-sm mt-1">Thresholds exceeded for variant metrics</p>
              </div>
            </div>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded flex items-start gap-2 ${
                    alert.severity === 'critical' ? 'bg-red-100 border border-red-300' : 'bg-orange-100 border border-orange-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-600' : 'bg-orange-600'}`} />
                  <div className="flex-1">
                    <p className={alert.severity === 'critical' ? 'text-red-900 font-medium' : 'text-orange-900 font-medium'}>
                      {alert.message}
                    </p>
                    <p className="text-xs mt-1 opacity-75">
                      {alert.type === 'low_adoption' ? 'Adoption rate below 10% threshold' : 'Sharp drop (>20%) from previous day'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Winner Alert */}
        {analysis && analysis.winningVariant && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Winning Variant Identified</h3>
              <p className="text-green-800 mt-1">{analysis.recommendation}</p>
            </div>
          </div>
        )}

        {/* Variant Metrics Table */}
        {metrics && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Variant Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Variant</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">
                      Adoption Rate
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">CTR</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">
                      Cross-Topic Lift
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">
                      Sample Size
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">
                      P-Value
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900">
                      Significant?
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics).map(([variant, data]) => {
                    const result = analysis?.results[variant as SerendipityVariant];
                    const isTarget =
                      data.adoptionRate >= 0.15 && data.crossTopicEngagementLift >= 0.08;

                    return (
                      <tr
                        key={variant}
                        className={`border-b border-gray-200 ${isTarget ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: variantColors[variant as SerendipityVariant] }}
                          ></div>
                          {variantLabels[variant as SerendipityVariant]}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(data.adoptionRate * 100).toFixed(1)}%
                          {data.adoptionRate >= 0.15 && <span className="text-green-600 ml-2">✓</span>}
                        </td>
                        <td className="px-4 py-3 text-center">{(data.ctr * 100).toFixed(1)}%</td>
                        <td className="px-4 py-3 text-center">
                          {(data.crossTopicEngagementLift * 100).toFixed(1)}%
                          {data.crossTopicEngagementLift >= 0.08 && (
                            <span className="text-green-600 ml-2">✓</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{data.sampleSize}</td>
                        <td className="px-4 py-3 text-center">
                          {result?.pValue.toFixed(4) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result?.isSignificant ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Targets */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
              <p>
                <strong>AC4 Target:</strong> Adoption rate ≥ 15%
              </p>
              <p>
                <strong>AC5 Target:</strong> Cross-topic engagement lift ≥ 8%
              </p>
            </div>
          </div>
        )}

        {/* Daily Adoption Rate Chart */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Daily Adoption Rate Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <Tooltip formatter={(value) => (typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '')} />
              <Legend />
              {Object.entries(variantLabels).map(([key, label]) => (
                <Line
                  key={key}
                  yAxisId="left"
                  type="monotone"
                  dataKey={label}
                  stroke={variantColors[key as SerendipityVariant]}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quality Alerts */}
        {metrics && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quality Checks</h2>
            <div className="space-y-3">
              {Object.entries(metrics).map(([variant, data]) => {
                const alerts = [];

                if (data.adoptionRate < 0.1) {
                  alerts.push(`Low adoption (${(data.adoptionRate * 100).toFixed(1)}%)`);
                }

                const result = analysis?.results[variant as SerendipityVariant];
                if (result && result.pValue > 0.05) {
                  alerts.push('Not statistically significant');
                }

                return (
                  <div key={variant}>
                    <div className="font-semibold text-gray-900">
                      {variantLabels[variant as SerendipityVariant]}
                    </div>
                    {alerts.length === 0 ? (
                      <div className="text-green-600 text-sm">✓ All checks passing</div>
                    ) : (
                      <div className="text-orange-600 text-sm">
                        {alerts.map((alert, idx) => (
                          <div key={idx}>⚠ {alert}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
