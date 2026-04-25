import { useEffect, useState } from 'react';
import {
  collectWebVitals,
  sendMetricsToServer,
  WebVitalsMetrics,
  WebVitalsStatus,
  getVitalsStatus,
  isAllGreen,
} from '@/lib/web-vitals-monitoring';

export const useWebVitals = () => {
  const [metrics, setMetrics] = useState<WebVitalsMetrics | null>(null);
  const [status, setStatus] = useState<WebVitalsStatus | null>(null);
  const [isGreen, setIsGreen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collectMetrics = async () => {
      try {
        const vitalMetrics = await collectWebVitals();
        setMetrics(vitalMetrics);

        const vitalStatus = getVitalsStatus(vitalMetrics);
        setStatus(vitalStatus);
        setIsGreen(isAllGreen(vitalStatus));

        // Send metrics to server for RUM
        if (typeof window !== 'undefined') {
          await sendMetricsToServer({
            ...vitalMetrics,
            timestamp: Date.now(),
            pathname: window.location.pathname,
          });
        }
      } catch (error) {
        console.error('Error collecting Web Vitals:', error);
      } finally {
        setLoading(false);
      }
    };

    // Collect metrics after page has fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('load', collectMetrics);
      return () => document.removeEventListener('load', collectMetrics);
    } else {
      collectMetrics();
    }
  }, []);

  return { metrics, status, isGreen, loading };
};
