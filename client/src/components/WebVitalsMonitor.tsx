import React from 'react';
import { useWebVitals } from '@/hooks/useWebVitals';
import { getVitalsStatus, isAllGreen } from '@/lib/web-vitals-monitoring';

interface WebVitalsMonitorProps {
  showDetails?: boolean;
  className?: string;
}

export const WebVitalsMonitor: React.FC<WebVitalsMonitorProps> = ({
  showDetails = false,
  className = '',
}) => {
  const { metrics, status, isGreen, loading } = useWebVitals();

  if (loading || !metrics || !status) {
    return null;
  }

  const getStatusColor = (vitalsStatus: string) => {
    switch (vitalsStatus) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'needsImprovement':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`web-vitals-monitor ${className}`}>
      {/* Status Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        isGreen ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
      }`}>
        <span className={`inline-block w-2 h-2 rounded-full ${isGreen ? 'bg-green-500' : 'bg-yellow-500'}`} />
        {isGreen ? 'All GREEN' : 'Needs Improvement'}
      </div>

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="mt-4 space-y-2 text-sm">
          {/* LCP */}
          <div className="flex justify-between items-center">
            <span>LCP (Largest Contentful Paint)</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{metrics.LCP?.toFixed(0)}ms</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status.LCP)}`}>
                {status.LCP}
              </span>
            </div>
          </div>

          {/* FID */}
          <div className="flex justify-between items-center">
            <span>FID (First Input Delay)</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{metrics.FID?.toFixed(0)}ms</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status.FID)}`}>
                {status.FID}
              </span>
            </div>
          </div>

          {/* CLS */}
          <div className="flex justify-between items-center">
            <span>CLS (Cumulative Layout Shift)</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{metrics.CLS?.toFixed(3)}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status.CLS)}`}>
                {status.CLS}
              </span>
            </div>
          </div>

          {/* FCP */}
          {metrics.FCP && (
            <div className="flex justify-between items-center text-gray-600">
              <span>FCP (First Contentful Paint)</span>
              <span className="font-mono">{metrics.FCP.toFixed(0)}ms</span>
            </div>
          )}

          {/* TTFB */}
          {metrics.TTFB && (
            <div className="flex justify-between items-center text-gray-600">
              <span>TTFB (Time to First Byte)</span>
              <span className="font-mono">{metrics.TTFB.toFixed(0)}ms</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebVitalsMonitor;
