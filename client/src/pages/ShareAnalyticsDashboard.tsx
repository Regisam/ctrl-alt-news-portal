import { useMemo } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import type { SharePlatform } from "@/lib/share-utils";

interface ShareMetric {
  articleId: number;
  articleTitle: string;
  platform: SharePlatform;
  count: number;
  timestamp: string;
}

// Mock data for share analytics (in production, this would come from backend GA data)
const mockShareMetrics: ShareMetric[] = [
  { articleId: 1, articleTitle: "AI Revolution", platform: "facebook", count: 45, timestamp: "2026-04-25" },
  { articleId: 1, articleTitle: "AI Revolution", platform: "twitter", count: 38, timestamp: "2026-04-25" },
  { articleId: 1, articleTitle: "AI Revolution", platform: "linkedin", count: 22, timestamp: "2026-04-25" },
  { articleId: 2, articleTitle: "Quantum Computing", platform: "facebook", count: 32, timestamp: "2026-04-25" },
  { articleId: 2, articleTitle: "Quantum Computing", platform: "twitter", count: 28, timestamp: "2026-04-25" },
  { articleId: 3, articleTitle: "Robotics Breakthrough", platform: "whatsapp", count: 51, timestamp: "2026-04-25" },
];

const PLATFORM_COLORS: Record<SharePlatform, string> = {
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  whatsapp: "#25D366",
  email: "#FF6B6B",
  copy: "#95E1D3",
};

export default function ShareAnalyticsDashboard() {
  // Top shared articles
  const topArticles = useMemo(() => {
    const grouped = mockShareMetrics.reduce(
      (acc, metric) => {
        const existing = acc.find((item) => item.articleId === metric.articleId);
        if (existing) {
          existing.shares += metric.count;
        } else {
          acc.push({
            articleId: metric.articleId,
            articleTitle: metric.articleTitle,
            shares: metric.count,
          });
        }
        return acc;
      },
      [] as Array<{ articleId: number; articleTitle: string; shares: number }>
    );
    return grouped.sort((a, b) => b.shares - a.shares).slice(0, 5);
  }, []);

  // Platform distribution
  const platformDistribution = useMemo(() => {
    const grouped = mockShareMetrics.reduce(
      (acc, metric) => {
        const existing = acc.find((item) => item.name === metric.platform);
        if (existing) {
          existing.value += metric.count;
        } else {
          acc.push({
            name: metric.platform,
            value: metric.count,
          });
        }
        return acc;
      },
      [] as Array<{ name: SharePlatform; value: number }>
    );
    return grouped;
  }, []);

  // Time-series data (simulated)
  const timeSeriesData = useMemo(() => {
    return [
      { date: "Apr 21", shares: 145 },
      { date: "Apr 22", shares: 178 },
      { date: "Apr 23", shares: 152 },
      { date: "Apr 24", shares: 198 },
      { date: "Apr 25", shares: 216 },
    ];
  }, []);

  const totalShares = mockShareMetrics.reduce((sum, metric) => sum + metric.count, 0);
  const averageSharesPerArticle = (totalShares / topArticles.length).toFixed(0);

  return (
    <div className="min-h-screen p-8" style={{ background: "#0A0A0B" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Share Analytics Dashboard</h1>
          <p className="text-gray-400">Track article shares across all platforms</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div
            className="p-6 rounded-lg border"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <p className="text-gray-400 text-sm mb-2">Total Shares</p>
            <p className="text-3xl font-bold text-white">{totalShares}</p>
          </div>

          <div
            className="p-6 rounded-lg border"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <p className="text-gray-400 text-sm mb-2">Avg Shares/Article</p>
            <p className="text-3xl font-bold text-white">{averageSharesPerArticle}</p>
          </div>

          <div
            className="p-6 rounded-lg border"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <p className="text-gray-400 text-sm mb-2">Top Platform</p>
            <p className="text-3xl font-bold text-white">
              {platformDistribution.length > 0 ? platformDistribution[0].name : "N/A"}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Shared Articles */}
          <div
            className="p-6 rounded-lg border"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Top Shared Articles</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topArticles}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="articleTitle" tick={{ fill: "#999", fontSize: 12 }} angle={-45} textAnchor="end" />
                <YAxis tick={{ fill: "#999" }} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="shares" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div
            className="p-6 rounded-lg border"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Shares by Platform</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={PLATFORM_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Series */}
        <div
          className="p-6 rounded-lg border"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <h2 className="text-xl font-bold text-white mb-6">Shares Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tick={{ fill: "#999" }} />
              <YAxis tick={{ fill: "#999" }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Legend />
              <Line type="monotone" dataKey="shares" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Details Table */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-6">Share Breakdown by Platform</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-semibold text-white">Platform</th>
                  <th className="px-4 py-3 font-semibold text-white">Total Shares</th>
                  <th className="px-4 py-3 font-semibold text-white">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {platformDistribution.map((platform) => (
                  <tr key={platform.name} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3 capitalize font-medium">{platform.name}</td>
                    <td className="px-4 py-3">{platform.value}</td>
                    <td className="px-4 py-3">{((platform.value / totalShares) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
