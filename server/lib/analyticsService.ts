import { logger } from '../logger.js';

// AC3-10: Analytics types
export interface MetricPoint {
  timestamp: Date;
  value: number;
}

export interface LiveMetrics {
  activeUsers: number;
  activeSession: number;
  articlesViewed: number;
  articlesTrending: Array<{ title: string; views: number; category: string }>;
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  pushNotifications: number;
  pushClicked: number;
  searchQueries: number;
  searchNoResults: number;
  errorCount: number;
  avgResponseTime: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  users: number;
  articles: number;
  emails: number;
  push: number;
  errors: number;
}

class AnalyticsService {
  private metrics: LiveMetrics = {
    activeUsers: 0,
    activeSession: 0,
    articlesViewed: 0,
    articlesTrending: [],
    emailsSent: 0,
    emailsOpened: 0,
    emailsClicked: 0,
    pushNotifications: 0,
    pushClicked: 0,
    searchQueries: 0,
    searchNoResults: 0,
    errorCount: 0,
    avgResponseTime: 0,
  };

  private timeSeries: TimeSeriesData[] = [];
  private responseTimes: number[] = [];

  // AC3: Track active users
  trackActiveUser(userId: string): void {
    this.metrics.activeUsers = Math.max(0, this.metrics.activeUsers + 1);
    logger.debug('Active user tracked', { userId, total: this.metrics.activeUsers });
  }

  // AC3: Track active sessions
  trackSession(sessionId: string): void {
    this.metrics.activeSession += 1;
    logger.debug('Session tracked', { sessionId, total: this.metrics.activeSession });
  }

  // AC4: Track article view
  trackArticleView(articleId: string, title: string, category: string): void {
    this.metrics.articlesViewed += 1;

    // Update trending
    const existing = this.metrics.articlesTrending.find((a) => a.title === title);
    if (existing) {
      existing.views += 1;
    } else {
      this.metrics.articlesTrending.push({ title, views: 1, category });
    }

    // Keep top 10
    this.metrics.articlesTrending.sort((a, b) => b.views - a.views);
    this.metrics.articlesTrending = this.metrics.articlesTrending.slice(0, 10);

    logger.debug('Article view tracked', { articleId, title });
  }

  // AC6: Track email
  trackEmail(type: 'sent' | 'opened' | 'clicked'): void {
    if (type === 'sent') this.metrics.emailsSent += 1;
    if (type === 'opened') this.metrics.emailsOpened += 1;
    if (type === 'clicked') this.metrics.emailsClicked += 1;

    logger.debug('Email tracked', { type });
  }

  // AC7: Track push
  trackPush(type: 'sent' | 'clicked' | 'dismissed'): void {
    if (type === 'sent') this.metrics.pushNotifications += 1;
    if (type === 'clicked') this.metrics.pushClicked += 1;

    logger.debug('Push tracked', { type });
  }

  // AC8: Track search
  trackSearch(query: string, hasResults: boolean): void {
    this.metrics.searchQueries += 1;
    if (!hasResults) this.metrics.searchNoResults += 1;

    logger.debug('Search tracked', { query, hasResults });
  }

  // AC5: Track error
  trackError(): void {
    this.metrics.errorCount += 1;
    logger.debug('Error tracked', { total: this.metrics.errorCount });
  }

  // AC5: Track response time
  trackResponseTime(ms: number): void {
    this.responseTimes.push(ms);

    // Keep last 100 measurements
    if (this.responseTimes.length > 100) {
      this.responseTimes = this.responseTimes.slice(-100);
    }

    const avg = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    this.metrics.avgResponseTime = Math.round(avg);
  }

  // AC9: Get time-series data
  getTimeSeries(): TimeSeriesData[] {
    return this.timeSeries.slice(-100); // Last 100 points
  }

  // AC2: Get live metrics
  getLiveMetrics(): LiveMetrics {
    return { ...this.metrics };
  }

  // AC10: Get metrics by date range
  getMetricsForDateRange(startDate: Date, endDate: Date): TimeSeriesData[] {
    return this.timeSeries.filter((p) => p.timestamp >= startDate && p.timestamp <= endDate);
  }

  // AC10: Get article metrics by category
  getArticlesByCategory(category: string): Array<{ title: string; views: number }> {
    return this.metrics.articlesTrending
      .filter((a) => a.category === category)
      .map((a) => ({ title: a.title, views: a.views }));
  }

  // AC8: Get search analytics
  getSearchAnalytics(): { total: number; noResults: number; rate: string } {
    const rate = this.metrics.searchQueries > 0 
      ? ((this.metrics.searchNoResults / this.metrics.searchQueries) * 100).toFixed(2)
      : '0';

    return {
      total: this.metrics.searchQueries,
      noResults: this.metrics.searchNoResults,
      rate: `${rate}%`,
    };
  }

  // AC6: Get email metrics
  getEmailMetrics(): { sent: number; opened: number; clicked: number; openRate: string; clickRate: string } {
    const openRate = this.metrics.emailsSent > 0
      ? ((this.metrics.emailsOpened / this.metrics.emailsSent) * 100).toFixed(2)
      : '0';

    const clickRate = this.metrics.emailsOpened > 0
      ? ((this.metrics.emailsClicked / this.metrics.emailsOpened) * 100).toFixed(2)
      : '0';

    return {
      sent: this.metrics.emailsSent,
      opened: this.metrics.emailsOpened,
      clicked: this.metrics.emailsClicked,
      openRate: `${openRate}%`,
      clickRate: `${clickRate}%`,
    };
  }

  // AC7: Get push metrics
  getPushMetrics(): { sent: number; clicked: number; clickRate: string } {
    const clickRate = this.metrics.pushNotifications > 0
      ? ((this.metrics.pushClicked / this.metrics.pushNotifications) * 100).toFixed(2)
      : '0';

    return {
      sent: this.metrics.pushNotifications,
      clicked: this.metrics.pushClicked,
      clickRate: `${clickRate}%`,
    };
  }

  // Record time-series data
  recordTimeSeries(): void {
    const dataPoint: TimeSeriesData = {
      timestamp: new Date(),
      users: this.metrics.activeUsers,
      articles: this.metrics.articlesViewed,
      emails: this.metrics.emailsSent,
      push: this.metrics.pushNotifications,
      errors: this.metrics.errorCount,
    };

    this.timeSeries.push(dataPoint);

    // Keep last 1440 points (24 hours at 1min intervals)
    if (this.timeSeries.length > 1440) {
      this.timeSeries = this.timeSeries.slice(-1440);
    }
  }

  // Reset metrics (for daily/weekly aggregates)
  reset(): void {
    this.metrics = {
      activeUsers: 0,
      activeSession: 0,
      articlesViewed: 0,
      articlesTrending: [],
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      pushNotifications: 0,
      pushClicked: 0,
      searchQueries: 0,
      searchNoResults: 0,
      errorCount: 0,
      avgResponseTime: 0,
    };

    logger.info('Analytics metrics reset');
  }
}

export const analyticsService = new AnalyticsService();

// AC9: Record time-series every minute
setInterval(() => {
  analyticsService.recordTimeSeries();
}, 60 * 1000);
