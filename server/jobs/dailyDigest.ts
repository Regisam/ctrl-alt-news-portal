import { logger } from '../logger.js';
import { emailService } from '../lib/emailService.js';
import { recommendationEngine } from '../lib/recommendationEngine.js';

// AC3-4: Daily digest job types
export interface DigestUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  sendTime: number; // hour 0-23
  enabled: boolean;
}

export interface DigestArticle {
  title: string;
  url: string;
  category: string;
}

class DailyDigestJob {
  private users: Map<string, DigestUser> = new Map();
  private lastRunTime: Map<string, Date> = new Map();

  // AC4: Add user for digest
  addUser(user: DigestUser): void {
    this.users.set(user.id, user);
    logger.debug('Digest user added', { userId: user.id, email: user.email });
  }

  // AC5: Update user preferences
  updateUserPreference(userId: string, enabled: boolean, sendTime?: number): void {
    const user = this.users.get(userId);

    if (!user) return;

    user.enabled = enabled;
    if (sendTime !== undefined) {
      user.sendTime = sendTime;
    }

    logger.debug('User digest preference updated', { userId, enabled, sendTime });
  }

  // AC5: Get user preferences
  getUserPreference(userId: string): DigestUser | null {
    return this.users.get(userId) || null;
  }

  // AC3-4: Generate digest for user
  async generateDigest(userId: string): Promise<DigestArticle[]> {
    // AC10: Get personalized recommendations
    const recommendations = recommendationEngine.getRecommendations(userId, 5);

    const articles: DigestArticle[] = recommendations.map((rec) => ({
      title: rec.title,
      url: `${process.env.BASE_URL}/articles/${rec.articleId}`,
      category: rec.category,
    }));

    logger.debug('Digest generated', { userId, articleCount: articles.length });

    return articles;
  }

  // AC4: Send digest at optimal time
  async sendDigestsForTime(hour: number): Promise<number> {
    let sent = 0;

    for (const user of this.users.values()) {
      // Skip disabled users
      if (!user.enabled) continue;

      // Skip if not time for this user
      if (user.sendTime !== hour) continue;

      // AC3: Generate digest
      const articles = await this.generateDigest(user.id);

      if (articles.length === 0) {
        logger.debug('No articles for digest', { userId: user.id });
        continue;
      }

      // AC10: Create personalized email
      const emailOptions = emailService.createDigestEmail(user.email, user.name, articles);

      // AC1: Send email
      const success = await emailService.sendEmail(emailOptions);

      if (success) {
        sent++;
        this.lastRunTime.set(user.id, new Date());
      }
    }

    logger.info('Daily digest sent', { hour, count: sent });

    return sent;
  }

  // AC4: Run digest job (called hourly)
  async run(): Promise<number> {
    const now = new Date();
    const currentHour = now.getHours();

    return this.sendDigestsForTime(currentHour);
  }

  // Get stats
  getStats() {
    return {
      totalUsers: this.users.size,
      enabledUsers: Array.from(this.users.values()).filter((u) => u.enabled).length,
      lastRuns: Object.fromEntries(this.lastRunTime),
    };
  }
}

export const dailyDigestJob = new DailyDigestJob();

// AC4: Run digest job every hour
setInterval(() => {
  dailyDigestJob.run().catch((error) => logger.error('Digest job error', { error }));
}, 60 * 60 * 1000);
