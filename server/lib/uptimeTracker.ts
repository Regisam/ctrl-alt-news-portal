import { logger } from '../logger.js';

export interface UptimeSample {
  timestamp: string;
  status: 'up' | 'down';
  responseTime: number; // milliseconds
}

export interface DowntimeEvent {
  startTime: string;
  endTime?: string;
  duration?: number; // milliseconds
  reason?: string;
  resolved: boolean;
}

class UptimeTracker {
  private samples: UptimeSample[] = [];
  private downtimeEvents: DowntimeEvent[] = [];
  private readonly MAX_SAMPLES = 525600; // 1 year of minute samples
  private readonly GRACE_PERIOD_MS = 30000; // 30 seconds: brief blips don't count
  private lastStatus: 'up' | 'down' = 'up';
  private lastStatusChange: number = Date.now();
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Cleanup old data every day
    this.cleanup = setInterval(() => this.cleanupOldData(), 24 * 60 * 60 * 1000);
  }

  // AC1: Record health check result every minute
  recordSample(status: 'up' | 'down', responseTime: number = 0): void {
    const sample: UptimeSample = {
      timestamp: new Date().toISOString(),
      status,
      responseTime,
    };

    this.samples.push(sample);

    // Keep max 1 year of data
    if (this.samples.length > this.MAX_SAMPLES) {
      this.samples.shift();
    }

    // Track downtime events (with grace period)
    if (status === 'down' && this.lastStatus === 'up') {
      // Start of downtime (after grace period)
      const timeSinceLastChange = Date.now() - this.lastStatusChange;
      if (timeSinceLastChange > this.GRACE_PERIOD_MS) {
        this.downtimeEvents.push({
          startTime: sample.timestamp,
          resolved: false,
        });
        logger.warn('Downtime event started', { timestamp: sample.timestamp });
      }
    } else if (status === 'up' && this.lastStatus === 'down') {
      // End of downtime
      const lastEvent = this.downtimeEvents[this.downtimeEvents.length - 1];
      if (lastEvent && !lastEvent.endTime) {
        lastEvent.endTime = sample.timestamp;
        lastEvent.duration = new Date(sample.timestamp).getTime() - new Date(lastEvent.startTime).getTime();
        lastEvent.resolved = true;
        logger.info('Downtime event ended', {
          duration: lastEvent.duration,
          startTime: lastEvent.startTime,
        });
      }
    }

    this.lastStatus = status;
    this.lastStatusChange = Date.now();
  }

  // AC2: Calculate uptime % over time windows
  calculateUptime(windowDays: number = 7): number {
    const cutoffTime = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const recentSamples = this.samples.filter(
      (s) => new Date(s.timestamp).getTime() >= cutoffTime
    );

    if (recentSamples.length === 0) return 100;

    const upSamples = recentSamples.filter((s) => s.status === 'up').length;
    return Math.round((upSamples / recentSamples.length) * 10000) / 100; // 2 decimals
  }

  // AC4: Get downtime events
  getDowntimeEvents(windowDays: number = 7): DowntimeEvent[] {
    const cutoffTime = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    return this.downtimeEvents.filter(
      (e) => new Date(e.startTime).getTime() >= cutoffTime
    );
  }

  // AC8: Historical data (uptime over time)
  getUptimeHistory(windowDays: number = 7, intervalMinutes: number = 60): Array<{ timestamp: string; uptime: number }> {
    const history: Array<{ timestamp: string; uptime: number }> = [];
    const cutoffTime = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const intervalMs = intervalMinutes * 60 * 1000;

    for (let t = cutoffTime; t <= Date.now(); t += intervalMs) {
      const rangeStart = t;
      const rangeEnd = t + intervalMs;

      const samplesInRange = this.samples.filter((s) => {
        const sampleTime = new Date(s.timestamp).getTime();
        return sampleTime >= rangeStart && sampleTime < rangeEnd;
      });

      if (samplesInRange.length > 0) {
        const upCount = samplesInRange.filter((s) => s.status === 'up').length;
        const uptime = Math.round((upCount / samplesInRange.length) * 10000) / 100;

        history.push({
          timestamp: new Date(rangeStart).toISOString(),
          uptime,
        });
      }
    }

    return history;
  }

  // AC6: Downtime analysis
  getDowntimeAnalysis(windowDays: number = 7): {
    totalDowntime: number;
    eventCount: number;
    averageDowntime: number;
    longestDowntime: number;
  } {
    const events = this.getDowntimeEvents(windowDays).filter((e) => e.resolved);

    if (events.length === 0) {
      return { totalDowntime: 0, eventCount: 0, averageDowntime: 0, longestDowntime: 0 };
    }

    const totalDowntime = events.reduce((sum, e) => sum + (e.duration || 0), 0);
    const longestDowntime = Math.max(...events.map((e) => e.duration || 0));

    return {
      totalDowntime,
      eventCount: events.length,
      averageDowntime: Math.round(totalDowntime / events.length),
      longestDowntime,
    };
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - 365 * 24 * 60 * 60 * 1000; // 1 year

    // Cleanup old samples
    this.samples = this.samples.filter(
      (s) => new Date(s.timestamp).getTime() >= cutoffTime
    );

    // Cleanup old events
    this.downtimeEvents = this.downtimeEvents.filter(
      (e) => new Date(e.startTime).getTime() >= cutoffTime
    );

    logger.debug('Uptime data cleanup completed', {
      samplesCount: this.samples.length,
      eventsCount: this.downtimeEvents.length,
    });
  }

  destroy(): void {
    clearInterval(this.cleanup);
  }
}

export const uptimeTracker = new UptimeTracker();
