import React from 'react';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { useMetrics } from '../hooks/useMetrics';
import { HealthStatusCard } from '../components/HealthStatusCard';

function DashboardPage() {
  const { metrics, health, alerts, isRefreshing, isPaused, setPaused, error, refetch } = useMetrics(5000);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold">Operations Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Real-time system monitoring</p>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setPaused(!isPaused)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={refetch}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isPaused ? (
              <span>✓ Paused (refresh disabled)</span>
            ) : (
              <span>✓ Auto-refreshing every 5 seconds</span>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Health Status Card */}
          <div className="md:col-span-1">
            <HealthStatusCard health={health} isLoading={isRefreshing && !health} />
          </div>

          {/* Metrics Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Latency */}
            {metrics && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-bold mb-4">Request Latency</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold text-blue-600">{metrics.latency.p50}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">p50</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold text-yellow-600">{metrics.latency.p95}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">p95</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-mono font-bold text-red-600">{metrics.latency.p99}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">p99</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Rate */}
            {metrics && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-bold mb-4">Error Rate</h3>
                <div className="text-center">
                  <p className="text-4xl font-mono font-bold text-green-600">{(metrics.requests.errorRate * 100).toFixed(2)}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {metrics.requests.total} total requests
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alerts Section */}
        {alerts && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-xl font-bold mb-4">Active Alerts ({alerts.count})</h2>

            {alerts.active.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No active alerts</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b dark:border-gray-700">
                    <tr>
                      <th className="text-left py-2 px-4">Severity</th>
                      <th className="text-left py-2 px-4">Message</th>
                      <th className="text-left py-2 px-4">Metric</th>
                      <th className="text-right py-2 px-4">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {alerts.active.map((alert) => {
                      const ageMs = Date.now() - new Date(alert.timestamp).getTime();
                      const ageSec = Math.floor(ageMs / 1000);
                      const ageMin = Math.floor(ageSec / 60);

                      const severityColor = {
                        critical: 'text-red-600 bg-red-100 dark:bg-red-900/20',
                        high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
                        medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
                        low: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
                      }[alert.severity];

                      return (
                        <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${severityColor}`}>
                              {alert.severity}
                            </span>
                          </td>
                          <td className="py-3 px-4">{alert.message}</td>
                          <td className="py-3 px-4 font-mono text-xs">{alert.metric}</td>
                          <td className="py-3 px-4 text-right">{ageMin}m ago</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
