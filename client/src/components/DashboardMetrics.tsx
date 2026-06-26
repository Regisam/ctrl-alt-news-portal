import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analyticsAPI } from '../lib/api';

interface Metrics {
  activeUsers: number;
  articlesViewed: number;
  emailsSent: number;
  pushNotifications: number;
  errorRate: number;
  avgResponseTime: number;
}

interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await analyticsAPI.getLiveMetrics();
      setMetrics(response.data?.metrics);

      // Generate mock time-series data for charts
      const now = new Date();
      const data = [];
      for (let i = 24; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        data.push({
          timestamp: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          activeUsers: Math.floor(Math.random() * 500) + 100,
          responses: Math.floor(Math.random() * 300) + 50,
          errors: Math.floor(Math.random() * 20),
        });
      }
      setTimeSeriesData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard label="Active Users" value={metrics.activeUsers} trend="+12%" />
        <MetricCard label="Articles Viewed" value={metrics.articlesViewed} trend="+8%" />
        <MetricCard label="Emails Sent" value={metrics.emailsSent} trend="+5%" />
        <MetricCard label="Push Notifications" value={metrics.pushNotifications} trend="+15%" />
        <MetricCard label="Error Rate" value={`${(metrics.errorRate * 100).toFixed(2)}%`} trend="-3%" />
        <MetricCard label="Avg Response Time" value={`${metrics.avgResponseTime}ms`} trend="-5%" />
      </div>

      {/* Active Users Chart */}
      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Active Users (24h)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="timestamp" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="activeUsers"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorUsers)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Response Time & Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Response Time (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="timestamp" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="responses"
                stroke="#10b981"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Error Rate (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="timestamp" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="errors" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  trend: string;
}

function MetricCard({ label, value, trend }: MetricCardProps) {
  const isPositive = trend.startsWith('+');

  return (
    <div className="border border-gray-800 rounded-lg p-6 hover:border-blue-500 transition">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className={`text-sm mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {trend} from last period
      </p>
    </div>
  );
}

export default DashboardMetrics;
