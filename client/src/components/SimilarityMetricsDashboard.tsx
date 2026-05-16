/**
 * Similarity Metrics Dashboard (Story 13.1 - Phase 3, Task 3.2)
 * Displays coverage, sparsity, similarity distribution, and computation time
 * Shows real-time metrics from the weekly batch job
 */

import React, { useEffect, useState, type JSX } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { SimilarityMetrics } from '@shared/lib/userSimilarity';

export interface DashboardState {
  loading: boolean;
  error?: string;
  metrics?: SimilarityMetrics;
  lastUpdated?: Date;
}

/**
 * Fetch metrics from server
 * In production, this queries an API endpoint like /api/metrics/similarity
 */
async function fetchSimilarityMetrics(): Promise<SimilarityMetrics | undefined> {
  try {
    // TODO: Implement API endpoint
    // const response = await fetch('/api/metrics/similarity');
    // return response.json();

    // Placeholder: return empty metrics
    return undefined;
  } catch (error) {
    console.error('Failed to fetch similarity metrics:', error);
    return undefined;
  }
}

/**
 * Display a single metric card
 */
function MetricCard({
  label,
  value,
  unit,
  color = 'text-blue-600',
}: {
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
}): JSX.Element {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-2`}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
    </div>
  );
}

/**
 * Display similarity distribution histogram
 */
function DistributionChart({
  distribution,
}: {
  distribution?: Map<string, number>;
}): JSX.Element {
  if (!distribution) {
    return <div className="text-gray-500 text-center py-8">No data available</div>;
  }

  const data = Array.from(distribution.entries()).map(([bin, count]) => ({
    bin,
    count,
  }));

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Similarity Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bin" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Main dashboard component
 */
export function SimilarityMetricsDashboard(): JSX.Element {
  const [state, setState] = useState<DashboardState>({
    loading: true,
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const metrics = await fetchSimilarityMetrics();
        setState({
          loading: false,
          metrics,
          lastUpdated: new Date(),
        });
      } catch (error) {
        setState({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load metrics',
        });
      }
    };

    loadMetrics();

    // Refresh metrics every 5 minutes
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading metrics...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
        <strong>Error:</strong> {state.error}
      </div>
    );
  }

  if (!state.metrics) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-600">
        No similarity metrics available yet. Please wait for the first batch job to complete.
      </div>
    );
  }

  const { metrics, lastUpdated } = state;

  // Determine color based on coverage threshold (target: >=70%)
  const coverageColor = metrics.coverage >= 70 ? 'text-green-600' : 'text-orange-600';
  const sparsityColor = metrics.sparsity >= 50 ? 'text-green-600' : 'text-orange-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Similarity Metrics Dashboard</h2>
        <div className="text-sm text-gray-600">
          Last updated: {lastUpdated?.toLocaleString() || 'N/A'}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="Coverage"
          value={metrics.coverage}
          unit="%"
          color={coverageColor}
        />
        <MetricCard label="Sparsity" value={metrics.sparsity} unit="%" color={sparsityColor} />
        <MetricCard label="Avg Neighbors" value={metrics.avgNeighbors} color="text-purple-600" />
        <MetricCard
          label="Computation Time"
          value={(metrics.computationTimeMs / 1000).toFixed(2)}
          unit="s"
          color="text-indigo-600"
        />
      </div>

      {/* Similarity Distribution Chart */}
      <DistributionChart distribution={metrics.similarityDistribution} />

      {/* Metrics Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Metrics Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Coverage Analysis</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>{metrics.coverage.toFixed(1)}%</strong> of users have ≥5 similar neighbors
              </li>
              <li>Target: ≥70% for good recommendations</li>
              <li>
                Status:{' '}
                <span className={coverageColor}>
                  {metrics.coverage >= 70 ? '✓ Healthy' : '⚠ Below Target'}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Sparsity Analysis</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                <strong>{metrics.sparsity.toFixed(1)}%</strong> non-zero values in similarity
                matrix
              </li>
              <li>Target: ≥50% for meaningful recommendations</li>
              <li>
                Status:{' '}
                <span className={sparsityColor}>
                  {metrics.sparsity >= 50 ? '✓ Dense' : '⚠ Sparse'}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Neighborhood Analysis</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                Average of <strong>{metrics.avgNeighbors.toFixed(1)}</strong> similar users per
                user
              </li>
              <li>Minimum target: 5 neighbors per user</li>
              <li>
                Status:{' '}
                <span className={metrics.avgNeighbors >= 5 ? 'text-green-600' : 'text-orange-600'}>
                  {metrics.avgNeighbors >= 5 ? '✓ Sufficient' : '⚠ Low'}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Performance</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>Computation completed in {(metrics.computationTimeMs / 1000).toFixed(2)}s</li>
              <li>Target: &lt;600s (10 minutes)</li>
              <li>
                Status:{' '}
                <span className={metrics.computationTimeMs < 600000 ? 'text-green-600' : 'text-red-600'}>
                  {metrics.computationTimeMs < 600000 ? '✓ On target' : '✗ Over target'}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Recommendation Health</h4>
        <p className="text-sm text-blue-800">
          {metrics.coverage >= 70 && metrics.sparsity >= 50 && metrics.avgNeighbors >= 5
            ? '✓ All metrics are healthy. Collaborative filtering recommendations are ready for production.'
            : '⚠ One or more metrics are below target. Consider the following:'}
        </p>
        {(metrics.coverage < 70 || metrics.sparsity < 50 || metrics.avgNeighbors < 5) && (
          <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
            {metrics.coverage < 70 && (
              <li>
                Low coverage: Some users don't have enough similar neighbors. Consider lowering the
                similarity threshold.
              </li>
            )}
            {metrics.sparsity < 50 && (
              <li>
                Sparse matrix: Few user pairs are similar. This could indicate diverse user
                interests, which is healthy.
              </li>
            )}
            {metrics.avgNeighbors < 5 && (
              <li>
                Few neighbors per user: User similarities are weak. Consider blending with
                content-based recommendations.
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SimilarityMetricsDashboard;
