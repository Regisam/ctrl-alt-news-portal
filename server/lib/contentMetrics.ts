import { logger } from '../logger.js';

// AC1: Content metrics
export interface ArticleMetrics {
  articleId: string;
  title: string;
  author: string;
  category: string;
  views: number;
  clicks: number;
  shares: number;
  totalTimeOnPage: number; // ms
  avgTimeOnPage: number; // ms
  bounceRate: number; // %
  scrollDepth: number; // avg %
  firstViewDate: string;
  lastViewDate: string;
}

// AC2: Engagement score
export interface EngagementScore {
  articleId: string;
  score: number; // 0-100
  views: number;
  engagement: number; // clicks + shares + time
  timeValue: number; // weighted time-on-page
  recency: number; // how recent
}

class ContentMetrics {
  private metrics: Map<string, ArticleMetrics> = new Map();
  private timeSeries: Map<string, Array<{ timestamp: string; views: number; engagement: number }>> = new Map();
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Cleanup old time-series daily
    this.cleanup = setInterval(() => this.cleanupOldTimeSeries(), 24 * 60 * 60 * 1000);
  }

  // AC1: Record article interaction
  recordInteraction(
    articleId: string,
    title: string,
    author: string,
    category: string,
    eventType: 'view' | 'click' | 'share' | 'time-on-page',
    data?: { timeOnPage?: number; scrollDepth?: number }
  ): void {
    let metrics = this.metrics.get(articleId);

    if (!metrics) {
      metrics = {
        articleId,
        title,
        author,
        category,
        views: 0,
        clicks: 0,
        shares: 0,
        totalTimeOnPage: 0,
        avgTimeOnPage: 0,
        bounceRate: 0,
        scrollDepth: 0,
        firstViewDate: new Date().toISOString(),
        lastViewDate: new Date().toISOString(),
      };
      this.metrics.set(articleId, metrics);
    }

    metrics.lastViewDate = new Date().toISOString();

    switch (eventType) {
      case 'view':
        metrics.views += 1;
        break;
      case 'click':
        metrics.clicks += 1;
        break;
      case 'share':
        metrics.shares += 1;
        break;
      case 'time-on-page':
        if (data?.timeOnPage) {
          metrics.totalTimeOnPage += data.timeOnPage;
          metrics.avgTimeOnPage = metrics.totalTimeOnPage / metrics.views;
        }
        if (data?.scrollDepth) {
          metrics.scrollDepth = (metrics.scrollDepth + data.scrollDepth) / 2;
        }
        break;
    }
  }

  // AC2: Calculate engagement score
  calculateEngagementScore(articleId: string): EngagementScore {
    const metrics = this.metrics.get(articleId);

    if (!metrics) {
      return {
        articleId,
        score: 0,
        views: 0,
        engagement: 0,
        timeValue: 0,
        recency: 0,
      };
    }

    // Engagement = clicks + shares + (time-on-page / 1000)
    const engagement = metrics.clicks + metrics.shares + metrics.avgTimeOnPage / 1000;

    // Recency score (views in last day)
    const daysOld = (Date.now() - new Date(metrics.lastViewDate).getTime()) / (1000 * 60 * 60 * 24);
    const recency = Math.max(0, 100 - daysOld * 10);

    // Overall score: views (40%) + engagement (40%) + recency (20%)
    const score = (metrics.views * 0.4 + engagement * 0.4 + recency * 0.2) / 10;

    return {
      articleId,
      score: Math.min(100, Math.round(score)),
      views: metrics.views,
      engagement: Math.round(engagement),
      timeValue: Math.round(metrics.avgTimeOnPage),
      recency: Math.round(recency),
    };
  }

  // AC3: Get popular articles
  getPopularArticles(limit: number = 10): ArticleMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  // AC4: Get trending articles (24h)
  getTrendingArticles(hours: number = 24, limit: number = 10): ArticleMetrics[] {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    return Array.from(this.metrics.values())
      .filter((m) => new Date(m.lastViewDate).getTime() >= cutoffTime)
      .sort((a, b) => {
        const aScore = this.calculateEngagementScore(a.articleId).score;
        const bScore = this.calculateEngagementScore(b.articleId).score;
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  // AC5: Get category performance
  getCategoryPerformance(): Record<string, {
    views: number;
    avgEngagement: number;
    articles: number;
  }> {
    const categories: Record<string, any> = {};

    for (const metrics of this.metrics.values()) {
      if (!categories[metrics.category]) {
        categories[metrics.category] = {
          views: 0,
          engagement: 0,
          articles: 0,
        };
      }

      categories[metrics.category].views += metrics.views;
      categories[metrics.category].engagement += this.calculateEngagementScore(metrics.articleId).score;
      categories[metrics.category].articles += 1;
    }

    // Calculate averages
    const result: Record<string, any> = {};
    for (const [category, data] of Object.entries(categories)) {
      result[category] = {
        views: data.views,
        avgEngagement: Math.round(data.engagement / data.articles),
        articles: data.articles,
      };
    }

    return result;
  }

  // AC6: Get author performance
  getAuthorPerformance(): Record<string, {
    views: number;
    avgEngagement: number;
    articles: number;
  }> {
    const authors: Record<string, any> = {};

    for (const metrics of this.metrics.values()) {
      if (!authors[metrics.author]) {
        authors[metrics.author] = {
          views: 0,
          engagement: 0,
          articles: 0,
        };
      }

      authors[metrics.author].views += metrics.views;
      authors[metrics.author].engagement += this.calculateEngagementScore(metrics.articleId).score;
      authors[metrics.author].articles += 1;
    }

    // Calculate averages
    const result: Record<string, any> = {};
    for (const [author, data] of Object.entries(authors)) {
      result[author] = {
        views: data.views,
        avgEngagement: Math.round(data.engagement / data.articles),
        articles: data.articles,
      };
    }

    return result;
  }

  // AC8: Compare articles
  compareArticles(articleIds: string[]): EngagementScore[] {
    return articleIds
      .map((id) => this.calculateEngagementScore(id))
      .sort((a, b) => b.score - a.score);
  }

  getArticleMetrics(articleId: string): ArticleMetrics | null {
    return this.metrics.get(articleId) || null;
  }

  private cleanupOldTimeSeries(): void {
    const cutoffTime = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days

    for (const [id, series] of this.timeSeries.entries()) {
      const filtered = series.filter((s) => new Date(s.timestamp).getTime() >= cutoffTime);
      if (filtered.length === 0) {
        this.timeSeries.delete(id);
      } else {
        this.timeSeries.set(id, filtered);
      }
    }

    logger.debug('Old time-series data cleaned');
  }

  destroy(): void {
    clearInterval(this.cleanup);
  }
}

export const contentMetrics = new ContentMetrics();
