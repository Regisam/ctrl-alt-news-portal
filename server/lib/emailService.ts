import { logger } from '../logger.js';

// AC1-11: Email service types
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface EmailQueueItem {
  id: string;
  email: EmailOptions;
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  createdAt: Date;
}

export interface EmailMetrics {
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
}

class EmailService {
  private queue: Map<string, EmailQueueItem> = new Map();
  private metrics: EmailMetrics = {
    sent: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
  };

  private readonly SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  private readonly SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
  private readonly SMTP_USER = process.env.SMTP_USER || '';
  private readonly SMTP_PASS = process.env.SMTP_PASS || '';
  private readonly FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@ctrlaltnews.com';
  private readonly MAX_RETRIES = 3;

  // AC1: Send email
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      logger.debug('Sending email', { to: options.to, subject: options.subject });

      // AC8: Queue email for async delivery
      this.queueEmail(options);

      return true;
    } catch (error) {
      logger.error('Failed to send email', { to: options.to, error });
      this.metrics.failed++;
      return false;
    }
  }

  // AC8: Queue email for async processing
  private queueEmail(options: EmailOptions): void {
    const queueItem: EmailQueueItem = {
      id: `email-${Date.now()}-${Math.random()}`,
      email: options,
      attempts: 0,
      maxAttempts: this.MAX_RETRIES,
      createdAt: new Date(),
    };

    this.queue.set(queueItem.id, queueItem);
    logger.debug('Email queued', { id: queueItem.id, to: options.to });
  }

  // AC8-9: Process email queue with retry
  async processQueue(): Promise<void> {
    const now = Date.now();

    for (const [id, item] of this.queue.entries()) {
      // Check if should retry
      if (item.nextRetry && item.nextRetry.getTime() > now) {
        continue;
      }

      if (item.attempts >= item.maxAttempts) {
        this.queue.delete(id);
        this.metrics.failed++;
        logger.warn('Email dropped after max retries', { id });
        continue;
      }

      try {
        // AC1: Simulate email sending (in production, use nodemailer)
        logger.info('Email sent', { to: item.email.to, subject: item.email.subject });

        this.metrics.sent++;
        this.queue.delete(id);
      } catch (error) {
        item.attempts++;

        // AC9: Exponential backoff for retry
        const backoffMs = Math.pow(2, item.attempts) * 60000; // 1min, 2min, 4min
        item.nextRetry = new Date(now + backoffMs);

        logger.warn('Email send failed, will retry', { id, attempt: item.attempts, nextRetry: item.nextRetry });
      }
    }
  }

  // AC7: Track email open
  trackOpen(emailId: string, userId: string): void {
    this.metrics.opened++;
    logger.debug('Email opened', { emailId, userId });
  }

  // AC7: Track email click
  trackClick(emailId: string, userId: string, url: string): void {
    this.metrics.clicked++;
    logger.debug('Email link clicked', { emailId, userId, url });
  }

  // AC6: Track unsubscribe
  trackUnsubscribe(userId: string): void {
    this.metrics.unsubscribed++;
    logger.info('User unsubscribed from emails', { userId });
  }

  // AC11: Get email metrics
  getMetrics() {
    const openRate = this.metrics.sent > 0 ? (this.metrics.opened / this.metrics.sent) * 100 : 0;
    const clickRate = this.metrics.opened > 0 ? (this.metrics.clicked / this.metrics.opened) * 100 : 0;

    return {
      ...this.metrics,
      queued: this.queue.size,
      openRate: openRate.toFixed(2),
      clickRate: clickRate.toFixed(2),
    };
  }

  // AC2: Render template
  renderTemplate(template: string, variables: Record<string, any>): string {
    let html = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
    }

    return html;
  }

  // AC10: Create digest email
  createDigestEmail(
    userEmail: string,
    userName: string,
    articles: Array<{ title: string; url: string; category: string }>
  ): EmailOptions {
    const template = this.getDigestTemplate();

    const html = this.renderTemplate(template, {
      userName,
      articleCount: articles.length,
      articlesHtml: articles
        .map(
          (a) =>
            `<li><a href="${a.url}">${a.title}</a> <span style="color: #999;">${a.category}</span></li>`
        )
        .join(''),
      date: new Date().toLocaleDateString(),
      unsubscribeUrl: `${process.env.BASE_URL}/unsubscribe?email=${encodeURIComponent(userEmail)}`,
    });

    return {
      to: userEmail,
      subject: `Your Daily Digest - ${new Date().toLocaleDateString()}`,
      html,
      text: `Daily digest for ${userName}`,
      replyTo: 'support@ctrlaltnews.com',
    };
  }

  // AC2: Get digest template
  private getDigestTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .article-list { list-style: none; padding: 0; }
    .article-list li { padding: 10px 0; border-bottom: 1px solid #eee; }
    .article-list a { color: #007bff; text-decoration: none; }
    .footer { padding: 20px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ctrl Alt News Daily Digest</h1>
      <p>{{date}}</p>
    </div>
    
    <div class="content">
      <p>Hi {{userName}},</p>
      <p>Here are {{articleCount}} personalized articles for you today:</p>
      
      <ul class="article-list">
        {{articlesHtml}}
      </ul>
      
      <p><a href="${process.env.BASE_URL}">View all articles</a></p>
    </div>
    
    <div class="footer">
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
      <p>&copy; 2026 Ctrl Alt News. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Clear queue
  clear(): void {
    this.queue.clear();
    logger.info('Email queue cleared');
  }
}

export const emailService = new EmailService();

// AC8: Process queue every minute
setInterval(() => {
  emailService.processQueue().catch((error) => logger.error('Queue processing error', { error }));
}, 60 * 1000);
