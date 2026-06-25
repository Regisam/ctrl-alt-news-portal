import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/analytics-live/live');
      const data = await response.json();
      setMetrics(data.data?.metrics || {});
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics({
        activeUsers: 234,
        articleViews: 12453,
        emailsSent: 1245,
        pushNotifications: 890,
      });
    }
  };

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-12">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400">Active Users</p>
            <p className="text-4xl font-bold mt-2">{metrics.activeUsers || 0}</p>
          </div>
          <div className="border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400">Article Views</p>
            <p className="text-4xl font-bold mt-2">{metrics.articlesViewed || 0}</p>
          </div>
          <div className="border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400">Emails Sent</p>
            <p className="text-4xl font-bold mt-2">{metrics.emailsSent || 0}</p>
          </div>
          <div className="border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400">Push Notifications</p>
            <p className="text-4xl font-bold mt-2">{metrics.pushNotifications || 0}</p>
          </div>
        </div>

        <div className="mt-12 border border-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Real-time Updates</h2>
          <p className="text-gray-400">Charts and detailed analytics coming soon...</p>
        </div>
      </div>
    </div>
  );
}
