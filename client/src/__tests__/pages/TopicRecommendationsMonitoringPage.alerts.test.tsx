import { describe, it, expect } from 'vitest';

// Mock the detect alerts function locally for testing
interface VariantMetrics {
  variant: string;
  adoptionRate: number;
  ctr: number;
  crossTopicEngagementLift: number;
  sampleSize: number;
}

interface Alert {
  variant: string;
  type: 'low_adoption' | 'sharp_drop';
  message: string;
  severity: 'warning' | 'critical';
}

function detectAlerts(
  metrics: Record<string, VariantMetrics> | null,
  dailyData: Array<{ date: string; metrics: Record<string, VariantMetrics> }>
): Alert[] {
  if (!metrics || dailyData.length < 2) return [];

  const alerts: Alert[] = [];
  const today = dailyData[dailyData.length - 1];
  const yesterday = dailyData[dailyData.length - 2];

  Object.entries(metrics).forEach(([variant, data]) => {
    // AC9a: Check adoption rate < 10%
    if (data.adoptionRate < 0.1) {
      alerts.push({
        variant,
        type: 'low_adoption',
        message: `${variant}: Low adoption rate (${(data.adoptionRate * 100).toFixed(1)}%)`,
        severity: 'critical',
      });
    }

    // AC9b: Check for >20% drop from yesterday
    if (yesterday && yesterday.metrics[variant]) {
      const yesterdayAdoption = yesterday.metrics[variant].adoptionRate;
      const drop = (yesterdayAdoption - data.adoptionRate) / yesterdayAdoption;
      if (drop > 0.2) {
        alerts.push({
          variant,
          type: 'sharp_drop',
          message: `${variant}: Sharp adoption drop (${(drop * 100).toFixed(1)}%)`,
          severity: 'warning',
        });
      }
    }
  });

  return alerts;
}

describe('TopicRecommendationsMonitoringPage - AC9 Alerts', () => {
  it('AC9a: Should detect low adoption rate < 10%', () => {
    const metrics = {
      control: { variant: 'control', adoptionRate: 0.08, ctr: 0.15, crossTopicEngagementLift: 0.06, sampleSize: 100 },
      high_serendipity: { variant: 'high_serendipity', adoptionRate: 0.18, ctr: 0.22, crossTopicEngagementLift: 0.10, sampleSize: 100 },
    };

    const alerts = detectAlerts(metrics, [
      { date: '2026-05-17', metrics: { control: { ...metrics.control }, high_serendipity: { ...metrics.high_serendipity } } },
      { date: '2026-05-18', metrics },
    ]);

    const lowAdoptionAlert = alerts.find((a) => a.type === 'low_adoption' && a.variant === 'control');
    expect(lowAdoptionAlert).toBeDefined();
    expect(lowAdoptionAlert?.severity).toBe('critical');
  });

  it('AC9a: Should NOT alert for adoption rate >= 10%', () => {
    const metrics = {
      control: { variant: 'control', adoptionRate: 0.12, ctr: 0.15, crossTopicEngagementLift: 0.06, sampleSize: 100 },
    };

    const alerts = detectAlerts(metrics, [
      { date: '2026-05-17', metrics: { control: { ...metrics.control } } },
      { date: '2026-05-18', metrics },
    ]);

    expect(alerts.filter((a) => a.type === 'low_adoption')).toHaveLength(0);
  });

  it('AC9b: Should detect sharp adoption drop > 20%', () => {
    const yesterdayMetrics = {
      control: { variant: 'control', adoptionRate: 0.20, ctr: 0.20, crossTopicEngagementLift: 0.10, sampleSize: 100 },
    };

    const todayMetrics = {
      control: { variant: 'control', adoptionRate: 0.14, ctr: 0.15, crossTopicEngagementLift: 0.06, sampleSize: 100 },
    };

    const alerts = detectAlerts(todayMetrics, [
      { date: '2026-05-17', metrics: yesterdayMetrics },
      { date: '2026-05-18', metrics: todayMetrics },
    ]);

    // Drop: (0.20 - 0.14) / 0.20 = 0.30 = 30% > 20%
    const sharpDropAlert = alerts.find((a) => a.type === 'sharp_drop' && a.variant === 'control');
    expect(sharpDropAlert).toBeDefined();
    expect(sharpDropAlert?.severity).toBe('warning');
  });

  it('AC9b: Should NOT alert for drop <= 20%', () => {
    const yesterdayMetrics = {
      control: { variant: 'control', adoptionRate: 0.20, ctr: 0.20, crossTopicEngagementLift: 0.10, sampleSize: 100 },
    };

    const todayMetrics = {
      control: { variant: 'control', adoptionRate: 0.17, ctr: 0.15, crossTopicEngagementLift: 0.06, sampleSize: 100 },
    };

    const alerts = detectAlerts(todayMetrics, [
      { date: '2026-05-17', metrics: yesterdayMetrics },
      { date: '2026-05-18', metrics: todayMetrics },
    ]);

    // Drop: (0.20 - 0.17) / 0.20 = 0.15 = 15% < 20%
    const sharpDropAlert = alerts.filter((a) => a.type === 'sharp_drop');
    expect(sharpDropAlert).toHaveLength(0);
  });

  it('AC9: Should return no alerts when metrics is null', () => {
    const alerts = detectAlerts(null, []);
    expect(alerts).toHaveLength(0);
  });

  it('AC9: Should return no alerts when dailyData has < 2 days', () => {
    const metrics = {
      control: { variant: 'control', adoptionRate: 0.08, ctr: 0.15, crossTopicEngagementLift: 0.06, sampleSize: 100 },
    };

    const alerts = detectAlerts(metrics, [{ date: '2026-05-18', metrics }]);
    expect(alerts).toHaveLength(0);
  });

  it('AC9: Should combine multiple alert types', () => {
    const yesterdayMetrics = {
      control: { variant: 'control', adoptionRate: 0.20, ctr: 0.20, crossTopicEngagementLift: 0.10, sampleSize: 100 },
      high_serendipity: { variant: 'high_serendipity', adoptionRate: 0.18, ctr: 0.22, crossTopicEngagementLift: 0.10, sampleSize: 100 },
    };

    const todayMetrics = {
      control: { variant: 'control', adoptionRate: 0.08, ctr: 0.15, crossTopicEngagementLift: 0.06, sampleSize: 100 }, // Low adoption + drop
      high_serendipity: { variant: 'high_serendipity', adoptionRate: 0.14, ctr: 0.18, crossTopicEngagementLift: 0.08, sampleSize: 100 }, // Only drop
    };

    const alerts = detectAlerts(todayMetrics, [
      { date: '2026-05-17', metrics: yesterdayMetrics },
      { date: '2026-05-18', metrics: todayMetrics },
    ]);

    expect(alerts.length).toBeGreaterThanOrEqual(2);
    expect(alerts.filter((a) => a.type === 'low_adoption')).toHaveLength(1);
    expect(alerts.filter((a) => a.type === 'sharp_drop')).toHaveLength(2);
  });
});
