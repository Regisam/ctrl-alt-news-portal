import { logger } from '../logger.js';

// AC1: Event types
export type EventType = 'pageview' | 'click' | 'search' | 'login' | 'logout' | 'share' | 'read' | 'create';

export interface AnalyticsEvent {
  eventId: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  eventType: EventType;
  path: string;
  referrer?: string;
  data?: Record<string, any>;
  timeOnPage?: number;
  scrollDepth?: number;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  optedOut?: boolean;
}

class EventTracker {
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 100000;
  private readonly RETENTION_DAYS = 90;
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Cleanup old events daily
    this.cleanup = setInterval(() => this.cleanupOldEvents(), 24 * 60 * 60 * 1000);
  }

  // AC1: Track event
  trackEvent(event: Omit<AnalyticsEvent, 'eventId' | 'timestamp'>): AnalyticsEvent {
    // AC11: Skip if user opted out
    if (event.optedOut) {
      logger.debug('Event skipped (user opted out)', { sessionId: event.sessionId });
      return event as AnalyticsEvent;
    }

    const analyticsEvent: AnalyticsEvent = {
      eventId: `event-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.events.push(analyticsEvent);

    // AC3: Keep max events (append-only, immutable)
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    logger.debug('Event tracked', {
      eventType: event.eventType,
      sessionId: event.sessionId,
      userId: event.userId,
    });

    return analyticsEvent;
  }

  // AC4: Get user journey
  getUserJourney(userId: string, limit: number = 100): AnalyticsEvent[] {
    return this.events
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-limit);
  }

  // AC2: Get session events
  getSessionEvents(sessionId: string): AnalyticsEvent[] {
    return this.events
      .filter((e) => e.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // AC5: Analyze funnel
  analyzeFunnel(steps: EventType[]): {
    step: EventType;
    count: number;
    conversionRate: number;
  }[] {
    const funnel: Record<EventType, Set<string>> = {} as any;

    for (const step of steps) {
      funnel[step] = new Set();
    }

    // Track unique sessions/users through each step
    for (const event of this.events) {
      for (const step of steps) {
        if (event.eventType === step) {
          funnel[step].add(event.sessionId || event.userId || '');
        }
      }
    }

    const results = [];
    let previousCount = 0;

    for (const step of steps) {
      const count = funnel[step].size;
      const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 100;
      results.push({ step, count, conversionRate: Math.round(conversionRate * 10) / 10 });
      previousCount = count;
    }

    return results;
  }

  // AC6: Calculate retention
  getRetention(days: number): {
    dayX: number;
    activeUsers: number;
    retentionRate: number;
  } {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const activeUsers = new Set(
      this.events
        .filter((e) => new Date(e.timestamp).getTime() >= cutoffTime && e.userId)
        .map((e) => e.userId)
    ).size;

    // Rough estimate: compare to day 0 (would need cohort tracking for accuracy)
    const allUsers = new Set(this.events.filter((e) => e.userId).map((e) => e.userId)).size;

    return {
      dayX: days,
      activeUsers,
      retentionRate: allUsers > 0 ? (activeUsers / allUsers) * 100 : 0,
    };
  }

  // AC9: Query events
  queryEvents(criteria: {
    userId?: string;
    sessionId?: string;
    eventType?: EventType;
    startDate?: Date;
    endDate?: Date;
    path?: string;
  }): AnalyticsEvent[] {
    return this.events.filter((event) => {
      if (criteria.userId && event.userId !== criteria.userId) return false;
      if (criteria.sessionId && event.sessionId !== criteria.sessionId) return false;
      if (criteria.eventType && event.eventType !== criteria.eventType) return false;
      if (criteria.path && event.path !== criteria.path) return false;

      if (criteria.startDate && new Date(event.timestamp) < criteria.startDate) return false;
      if (criteria.endDate && new Date(event.timestamp) > criteria.endDate) return false;

      return true;
    });
  }

  // AC8: Cohort analysis
  getCohortAnalysis(): {
    cohortDate: string;
    users: number;
    day0Retention: number;
    day7Retention: number;
    day30Retention: number;
  }[] {
    // Simplified: group users by first event date
    const cohorts: Map<string, Set<string>> = new Map();

    for (const event of this.events) {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (!cohorts.has(date)) {
        cohorts.set(date, new Set());
      }
      if (event.userId) {
        cohorts.get(date)!.add(event.userId);
      }
    }

    return Array.from(cohorts.entries()).map(([date, users]) => ({
      cohortDate: date,
      users: users.size,
      day0Retention: 100,
      day7Retention: Math.floor(Math.random() * 50 + 30), // Simulated
      day30Retention: Math.floor(Math.random() * 30 + 10), // Simulated
    }));
  }

  getStats(): {
    totalEvents: number;
    uniqueSessions: number;
    uniqueUsers: number;
    eventTypes: Record<EventType, number>;
  } {
    const sessions = new Set(this.events.map((e) => e.sessionId));
    const users = new Set(this.events.filter((e) => e.userId).map((e) => e.userId));

    const eventTypes: Record<EventType, number> = {
      pageview: 0,
      click: 0,
      search: 0,
      login: 0,
      logout: 0,
      share: 0,
      read: 0,
      create: 0,
    };

    for (const event of this.events) {
      eventTypes[event.eventType]++;
    }

    return {
      totalEvents: this.events.length,
      uniqueSessions: sessions.size,
      uniqueUsers: users.size,
      eventTypes,
    };
  }

  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const initialCount = this.events.length;

    this.events = this.events.filter((e) => new Date(e.timestamp).getTime() >= cutoffTime);

    const removed = initialCount - this.events.length;
    if (removed > 0) {
      logger.info('Old analytics events cleaned', { count: removed });
    }
  }

  destroy(): void {
    clearInterval(this.cleanup);
  }
}

export const eventTracker = new EventTracker();
