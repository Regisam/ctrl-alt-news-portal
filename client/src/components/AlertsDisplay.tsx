import { useEffect, useState } from 'react';
import { alertsAPI } from '../lib/api';

interface Alert {
  id: string;
  metric: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: string;
}

export function AlertsDisplay() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await alertsAPI.getDashboard();
      setAlerts(response.data?.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading alerts...</div>;
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-red-900 bg-red-950/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">Critical Alerts</p>
          <p className="text-3xl font-bold mt-2">{criticalCount}</p>
        </div>
        <div className="border border-yellow-900 bg-yellow-950/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">Warning Alerts</p>
          <p className="text-3xl font-bold mt-2">{warningCount}</p>
        </div>
        <div className="border border-green-900 bg-green-950/30 rounded-lg p-4">
          <p className="text-green-400 text-sm">Healthy</p>
          <p className="text-3xl font-bold mt-2">{alerts.length === 0 ? '✓' : '-'}</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="border border-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Active Alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No active alerts ✓</p>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded ${
                  alert.severity === 'critical'
                    ? 'border-red-500 bg-red-950/20'
                    : alert.severity === 'warning'
                    ? 'border-yellow-500 bg-yellow-950/20'
                    : 'border-blue-500 bg-blue-950/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{alert.metric}</p>
                    <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      alert.severity === 'critical'
                        ? 'bg-red-600 text-white'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsDisplay;
