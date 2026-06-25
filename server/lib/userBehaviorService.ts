import { logger } from '../logger.js';

// AC1-11: Behavior tracking types
export interface UserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  pageViews: number;
  events: string[];
  lastActivity: Date;
}

export interface FunnelStep {
  step: number;
  name: string;
  totalUsers: number;
  completions: number;
  dropoffRate: number;
}

export interface Cohort {
  id: string;
  name: string;
  criteria: string;
  userCount: number;
  createdAt: Date;
  retention: Map<number, number>; // day → count
}

export interface UserEvent {
  id: string;
  userId: string;
  eventName: string;
  eventData: Record<string, any>;
  timestamp: Date;
}

export interface UserEngagementScore {
  userId: string;
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

class UserBehaviorService {
  private sessions: Map<string, UserSession> = new Map();
  private activeSessions: Map<string, UserSession> = new Map();
  private events: UserEvent[] = [];
  private cohorts: Map<string, Cohort> = new Map();
  private funnels: Map<string, FunnelStep[]> = new Map();
  private engagementScores: Map<string, UserEngagementScore> = new Map();

  // AC1: Start user session
  startSession(userId: string): UserSession {
    const session: UserSession = {
      id: `session-${Date.now()}-${Math.random()}`,
      userId,
      startTime: new Date(),
      duration: 0,
      pageViews: 0,
      events: [],
      lastActivity: new Date(),
    };

    this.activeSessions.set(session.id, session);
    logger.debug('User session started', { userId, sessionId: session.id });

    return session;
  }

  // AC1: End user session
  endSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const now = new Date();
    session.endTime = now;
    session.duration = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);

    this.sessions.set(sessionId, session);
    this.activeSessions.delete(sessionId);

    logger.debug('User session ended', { sessionId, duration: session.duration });

    // AC6: Update engagement score
    this.updateEngagementScore(session.userId);

    return true;
  }

  // AC1: Track page view
  trackPageView(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.pageViews += 1;
    session.lastActivity = new Date();

    logger.debug('Page view tracked', { sessionId, totalViews: session.pageViews });
  }

  // AC8: Track custom event
  trackEvent(userId: string, eventName: string, eventData?: Record<string, any>): void {
    const event: UserEvent = {
      id: `event-${Date.now()}`,
      userId,
      eventName,
      eventData: eventData || {},
      timestamp: new Date(),
    };

    this.events.push(event);

    // Add to active session
    const activeSessions = Array.from(this.activeSessions.values()).filter((s) => s.userId === userId);
    if (activeSessions.length > 0) {
      activeSessions[0].events.push(eventName);
    }

    logger.debug('Event tracked', { userId, eventName });
  }

  // AC2: Define funnel
  defineFunnel(funnelId: string, steps: string[]): void {
    const funnelSteps: FunnelStep[] = steps.map((name, index) => ({
      step: index + 1,
      name,
      totalUsers: 0,
      completions: 0,
      dropoffRate: 0,
    }));

    this.funnels.set(funnelId, funnelSteps);
    logger.info('Funnel defined', { funnelId, steps: steps.length });
  }

  // AC2: Track funnel progress
  trackFunnelStep(funnelId: string, userId: string, stepNumber: number): void {
    const funnel = this.funnels.get(funnelId);
    if (!funnel || stepNumber > funnel.length) return;

    const step = funnel[stepNumber - 1];
    if (!step) return;

    step.completions += 1;
    if (stepNumber === 1) {
      step.totalUsers += 1;
    }

    logger.debug('Funnel step tracked', { funnelId, step: stepNumber, userId });
  }

  // AC2: Calculate funnel metrics
  calculateFunnelMetrics(funnelId: string): FunnelStep[] {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) return [];

    // Calculate dropoff rates
    for (let i = 1; i < funnel.length; i++) {
      const prev = funnel[i - 1];
      const current = funnel[i];

      if (prev.completions > 0) {
        current.dropoffRate = ((prev.completions - current.completions) / prev.completions) * 100;
      }
    }

    return funnel;
  }

  // AC3: Create cohort
  createCohort(cohortId: string, name: string, criteria: string): void {
    const cohort: Cohort = {
      id: cohortId,
      name,
      criteria,
      userCount: 0,
      createdAt: new Date(),
      retention: new Map(),
    };

    this.cohorts.set(cohortId, cohort);
    logger.info('Cohort created', { cohortId, name });
  }

  // AC3: Add user to cohort
  addUserToCohort(cohortId: string, userId: string): void {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return;

    cohort.userCount += 1;
    logger.debug('User added to cohort', { cohortId, userId });
  }

  // AC4: Calculate retention
  calculateRetention(cohortId: string, days: number[]): Map<number, number> {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return new Map();

    // Simplified retention calculation
    const retention = new Map<number, number>();

    for (const day of days) {
      // In production, check if user was active on day N
      const retainedUsers = Math.floor(cohort.userCount * Math.pow(0.95, day));
      retention.set(day, retainedUsers);
    }

    cohort.retention = retention;
    return retention;
  }

  // AC5: Predict churn
  predictChurnRisk(userId: string): { risk: 'low' | 'medium' | 'high'; score: number } {
    // Get user events
    const userEvents = this.events.filter((e) => e.userId === userId);
    const recentEvents = userEvents.filter(
      (e) => new Date().getTime() - e.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    // Simple churn prediction: low activity = high risk
    const eventCount = recentEvents.length;
    let score = 100;

    if (eventCount > 20) score = 10;
    else if (eventCount > 10) score = 30;
    else if (eventCount > 5) score = 50;
    else if (eventCount > 0) score = 70;

    const risk = score > 70 ? 'high' : score > 50 ? 'medium' : 'low';

    logger.debug('Churn risk calculated', { userId, risk, score });

    return { risk, score };
  }

  // AC6: Calculate engagement score
  updateEngagementScore(userId: string): void {
    const userEvents = this.events.filter((e) => e.userId === userId);
    const userSessions = Array.from(this.sessions.values()).filter((s) => s.userId === userId);

    let score = 0;
    const factors: string[] = [];

    // Events factor (40%)
    if (userEvents.length > 50) {
      score += 40;
      factors.push('high_event_count');
    } else if (userEvents.length > 20) {
      score += 25;
      factors.push('medium_event_count');
    } else if (userEvents.length > 5) {
      score += 10;
      factors.push('low_event_count');
    }

    // Sessions factor (30%)
    if (userSessions.length > 20) {
      score += 30;
      factors.push('high_session_count');
    } else if (userSessions.length > 10) {
      score += 20;
      factors.push('medium_session_count');
    } else if (userSessions.length > 5) {
      score += 10;
      factors.push('low_session_count');
    }

    // Duration factor (30%)
    const totalDuration = userSessions.reduce((sum, s) => sum + s.duration, 0);
    if (totalDuration > 3600) {
      score += 30;
      factors.push('high_engagement_duration');
    } else if (totalDuration > 1800) {
      score += 20;
      factors.push('medium_engagement_duration');
    } else if (totalDuration > 300) {
      score += 10;
      factors.push('low_engagement_duration');
    }

    const level = score > 70 ? 'high' : score > 40 ? 'medium' : 'low';

    this.engagementScores.set(userId, {
      userId,
      score: Math.min(score, 100),
      level,
      factors,
    });

    logger.debug('Engagement score updated', { userId, score, level });
  }

  // AC9: Compare cohorts
  compareCohorts(cohort1Id: string, cohort2Id: string): any {
    const c1 = this.cohorts.get(cohort1Id);
    const c2 = this.cohorts.get(cohort2Id);

    if (!c1 || !c2) return null;

    return {
      cohort1: { name: c1.name, users: c1.userCount, retention: Object.fromEntries(c1.retention) },
      cohort2: { name: c2.name, users: c2.userCount, retention: Object.fromEntries(c2.retention) },
      difference: {
        userDiff: c1.userCount - c2.userCount,
        retentionDiff: Array.from(c1.retention.entries()).map(([day, count]) => ({
          day,
          diff: count - (c2.retention.get(day) || 0),
        })),
      },
    };
  }

  // AC10: Get trends
  getTrends(metricName: string, days: number = 30): Array<{ date: string; value: number }> {
    const now = new Date();
    const trends: Array<{ date: string; value: number }> = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Count events for this day
      const dayEvents = this.events.filter((e) => e.timestamp.toISOString().startsWith(dateStr));
      const value = dayEvents.length;

      trends.push({ date: dateStr, value });
    }

    return trends;
  }

  // AC11: Export data
  exportBehaviorData(userId?: string): {
    sessions: UserSession[];
    events: UserEvent[];
    engagementScores: UserEngagementScore[];
  } {
    let sessions = Array.from(this.sessions.values());
    let events = this.events;
    let scores = Array.from(this.engagementScores.values());

    if (userId) {
      sessions = sessions.filter((s) => s.userId === userId);
      events = events.filter((e) => e.userId === userId);
      scores = scores.filter((s) => s.userId === userId);
    }

    return { sessions, events, engagementScores: scores };
  }

  // Get engagement score
  getEngagementScore(userId: string): UserEngagementScore | null {
    return this.engagementScores.get(userId) || null;
  }

  // Get active sessions count
  getActiveSessions(): number {
    return this.activeSessions.size;
  }

  // Clear
  clear(): void {
    this.sessions.clear();
    this.activeSessions.clear();
    this.events = [];
    this.cohorts.clear();
    this.funnels.clear();
    this.engagementScores.clear();

    logger.info('User behavior service cleared');
  }
}

export const userBehaviorService = new UserBehaviorService();
