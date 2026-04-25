import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export interface WebVitalsMetrics {
  LCP: number | null; // Largest Contentful Paint (milliseconds)
  FID: number | null; // First Input Delay (milliseconds)
  CLS: number | null; // Cumulative Layout Shift (unitless)
  FCP: number | null; // First Contentful Paint (milliseconds)
  TTFB: number | null; // Time to First Byte (milliseconds)
}

export interface WebVitalsStatus {
  LCP: 'good' | 'needsImprovement' | 'poor';
  FID: 'good' | 'needsImprovement' | 'poor';
  CLS: 'good' | 'needsImprovement' | 'poor';
}

// Thresholds per Google Web Vitals standards
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // unitless
};

export const getVitalsStatus = (metrics: WebVitalsMetrics): WebVitalsStatus => {
  return {
    LCP: !metrics.LCP
      ? 'poor'
      : metrics.LCP <= VITALS_THRESHOLDS.LCP.good
        ? 'good'
        : metrics.LCP <= VITALS_THRESHOLDS.LCP.needsImprovement
          ? 'needsImprovement'
          : 'poor',
    FID: !metrics.FID
      ? 'poor'
      : metrics.FID <= VITALS_THRESHOLDS.FID.good
        ? 'good'
        : metrics.FID <= VITALS_THRESHOLDS.FID.needsImprovement
          ? 'needsImprovement'
          : 'poor',
    CLS: !metrics.CLS
      ? 'poor'
      : metrics.CLS <= VITALS_THRESHOLDS.CLS.good
        ? 'good'
        : metrics.CLS <= VITALS_THRESHOLDS.CLS.needsImprovement
          ? 'needsImprovement'
          : 'poor',
  };
};

export const collectWebVitals = async (): Promise<WebVitalsMetrics> => {
  return new Promise((resolve) => {
    const metrics: WebVitalsMetrics = {
      LCP: null,
      FID: null,
      CLS: null,
      FCP: null,
      TTFB: null,
    };

    let metricsCollected = 0;
    const totalMetrics = 5;

    const checkComplete = () => {
      metricsCollected++;
      if (metricsCollected === totalMetrics) {
        resolve(metrics);
      }
    };

    getCLS((metric) => {
      metrics.CLS = metric.value;
      checkComplete();
    });

    getFID((metric) => {
      metrics.FID = metric.value;
      checkComplete();
    });

    getFCP((metric) => {
      metrics.FCP = metric.value;
      checkComplete();
    });

    getLCP((metric) => {
      metrics.LCP = metric.value;
      checkComplete();
    });

    getTTFB((metric) => {
      metrics.TTFB = metric.value;
      checkComplete();
    });
  });
};

export const sendMetricsToServer = async (metrics: WebVitalsMetrics & { timestamp: number; pathname: string }) => {
  try {
    const response = await fetch('/api/metrics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    });
    if (!response.ok) {
      console.error('Failed to send Web Vitals metrics:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending Web Vitals metrics:', error);
  }
};

export const isAllGreen = (status: WebVitalsStatus): boolean => {
  return status.LCP === 'good' && status.FID === 'good' && status.CLS === 'good';
};
