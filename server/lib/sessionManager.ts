import { logger } from '../logger.js';

// AC2: Session tracking
export interface AnalyticsSession {
  sessionId: string;
  userId?: string;
  startTime: string;
  lastActivity: string;
  duration: number; // ms
  pageviews: number;
  events: number;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  referrer?: string;
  exited: boolean;
}

class SessionManager {
  private sessions: Map<string, AnalyticsSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Cleanup inactive sessions every 5 minutes
    this.cleanup = setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000);
  }

  // AC2: Create or get session
  getOrCreateSession(
    sessionId: string,
    userId?: string,
    deviceType?: 'mobile' | 'desktop' | 'tablet',
    referrer?: string
  ): AnalyticsSession {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        userId,
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        duration: 0,
        pageviews: 0,
        events: 0,
        deviceType,
        referrer,
        exited: false,
      };

      this.sessions.set(sessionId, session);
      logger.debug('Analytics session created', { sessionId, userId });
    } else {
      // Update last activity
      session.lastActivity = new Date().toISOString();
      session.duration = new Date(session.lastActivity).getTime() - new Date(session.startTime).getTime();
    }

    return session;
  }

  // AC2: Track event in session
  trackEvent(sessionId: string, eventType: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.events += 1;
      if (eventType === 'pageview') {
        session.pageviews += 1;
      }
      session.lastActivity = new Date().toISOString();
      session.duration = new Date(session.lastActivity).getTime() - new Date(session.startTime).getTime();
    }
  }

  // AC2: End session
  endSession(sessionId: string): AnalyticsSession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.exited = true;
      logger.debug('Analytics session ended', {
        sessionId,
        duration: session.duration,
        events: session.events,
      });
      return session;
    }
    return null;
  }

  // Get session stats
  getSession(sessionId: string): AnalyticsSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Get active sessions
  getActiveSessions(): AnalyticsSession[] {
    return Array.from(this.sessions.values())
      .filter((s) => !s.exited && new Date(s.lastActivity).getTime() > Date.now() - this.SESSION_TIMEOUT)
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }

  // Get user's sessions
  getUserSessions(userId: string): AnalyticsSession[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getStats(): {
    activeSessions: number;
    totalSessions: number;
    avgDuration: number;
    avgEvents: number;
  } {
    const all = Array.from(this.sessions.values());
    const active = this.getActiveSessions();

    const avgDuration =
      all.length > 0 ? all.reduce((sum, s) => sum + s.duration, 0) / all.length : 0;
    const avgEvents =
      all.length > 0 ? all.reduce((sum, s) => sum + s.events, 0) / all.length : 0;

    return {
      activeSessions: active.length,
      totalSessions: all.length,
      avgDuration: Math.round(avgDuration / 1000), // Convert to seconds
      avgEvents: Math.round(avgEvents * 10) / 10,
    };
  }

  private cleanupInactiveSessions(): void {
    const cutoffTime = Date.now() - this.SESSION_TIMEOUT;
    let removed = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (
        new Date(session.lastActivity).getTime() < cutoffTime &&
        !session.exited
      ) {
        session.exited = true;
        removed += 1;
      }
    }

    if (removed > 0) {
      logger.debug('Inactive sessions cleaned', { count: removed });
    }
  }

  destroy(): void {
    clearInterval(this.cleanup);
  }
}

export const sessionManager = new SessionManager();
