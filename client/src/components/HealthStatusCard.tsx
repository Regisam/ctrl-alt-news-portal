import React from 'react';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import type { HealthData } from '../hooks/useMetrics';

interface HealthStatusCardProps {
  health: HealthData | null;
  isLoading: boolean;
}

export function HealthStatusCard({ health, isLoading }: HealthStatusCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const isHealthy = health.status === 'ok';
  const statusColor = isHealthy ? 'text-green-600' : 'text-red-600';
  const statusBgColor = isHealthy ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20';
  const StatusIcon = isHealthy ? CheckCircle : AlertCircle;

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center gap-3 mb-6">
        <StatusIcon className={`w-6 h-6 ${statusColor}`} />
        <h2 className="text-xl font-bold">System Status</h2>
      </div>

      <div className={`rounded-lg p-4 mb-6 ${statusBgColor}`}>
        <p className={`font-semibold ${statusColor}`}>
          {isHealthy ? '✓ Healthy' : '✗ Degraded'}
        </p>
      </div>

      <div className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Uptime</span>
          <span className="font-mono font-semibold">{formatUptime(health.uptime)}</span>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <h3 className="font-semibold mb-2">Memory</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Process</span>
              <span className="font-mono">
                {health.memory.process.heapUsed}/{health.memory.process.heapTotal} MB ({health.memory.process.percent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  health.memory.process.percent > 90
                    ? 'bg-red-600'
                    : health.memory.process.percent > 80
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                }`}
                style={{ width: `${health.memory.process.percent}%` }}
              ></div>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-gray-600 dark:text-gray-400">System</span>
              <span className="font-mono">
                {Math.round((health.memory.system.total - health.memory.system.free) / 1024)} / {Math.round(health.memory.system.total / 1024)} GB (
                {health.memory.system.percent.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  health.memory.system.percent > 90
                    ? 'bg-red-600'
                    : health.memory.system.percent > 80
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                }`}
                style={{ width: `${health.memory.system.percent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <h3 className="font-semibold mb-2">CPU</h3>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Cores</span>
            <span className="font-mono">{health.cpu.cores}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Load Average</span>
            <span className="font-mono">{health.cpu.loadAverage.map((l) => l.toFixed(2)).join(', ')}</span>
          </div>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <h3 className="font-semibold mb-2">Services</h3>
          <div className="space-y-1 text-xs">
            {Object.entries(health.services).map(([name, status]) => (
              <div key={name} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{name}</span>
                <span className={status === 'healthy' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Last updated: {new Date(health.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
