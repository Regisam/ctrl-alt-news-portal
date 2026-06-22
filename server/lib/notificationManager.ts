import { logger } from '../logger.js';

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  timestamp: string;
}

export interface NotificationRecipients {
  email: string[];
  slack: {
    webhookUrl: string;
    channel: string;
  };
}

const lastNotificationTime: Map<string, number> = new Map();
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function shouldThrottle(alertId: string): boolean {
  const lastTime = lastNotificationTime.get(alertId);
  if (!lastTime) return false;

  const elapsed = Date.now() - lastTime;
  return elapsed < DEDUP_WINDOW_MS;
}

function recordNotificationTime(alertId: string) {
  lastNotificationTime.set(alertId, Date.now());

  // Cleanup old entries every 1000 calls
  if (lastNotificationTime.size > 10000) {
    const now = Date.now();
    for (const [key, time] of lastNotificationTime.entries()) {
      if (now - time > DEDUP_WINDOW_MS * 2) {
        lastNotificationTime.delete(key);
      }
    }
  }
}

function isInQuietHours(): boolean {
  const hour = new Date().getUTCHours();
  // Quiet hours: 22:00 - 06:00 UTC
  return hour >= 22 || hour < 6;
}

function shouldSendByQuietHours(severity: string): boolean {
  if (severity === 'critical') return true; // Always send critical
  if (severity === 'high') return !isInQuietHours(); // Send high only outside quiet hours
  return !isInQuietHours(); // Send low/medium only outside quiet hours
}

async function sendEmail(
  recipients: string[],
  subject: string,
  body: string
): Promise<void> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP not configured, skipping email', { subject });
    return;
  }

  try {
    // In production, use nodemailer or SendGrid
    // For now, log to console
    logger.info('Email would be sent', {
      to: recipients,
      subject,
      bodyPreview: body.substring(0, 100),
    });

    // TODO: Implement actual SMTP sending
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({to: recipients, subject, html: body});
  } catch (error) {
    logger.error('Failed to send email', { recipients, subject, error });
  }
}

async function sendSlack(
  webhookUrl: string,
  alert: Alert,
  channel: string
): Promise<void> {
  if (!webhookUrl) {
    logger.warn('Slack webhook not configured, skipping notification');
    return;
  }

  try {
    const colorMap = {
      critical: 'danger',
      high: 'warning',
      medium: '#FF9900',
      low: 'good',
    };

    const payload = {
      channel,
      attachments: [
        {
          color: colorMap[alert.severity],
          title: `[${alert.severity.toUpperCase()}] ${alert.message}`,
          fields: [
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Time', value: alert.timestamp, short: false },
            { title: 'Alert ID', value: alert.id, short: true },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error('Slack notification failed', { status: response.status, alert });
    } else {
      logger.info('Slack notification sent', { alertId: alert.id });
    }
  } catch (error) {
    logger.error('Failed to send Slack notification', { alert, error });
  }
}

export async function notifyAlert(
  alert: Alert,
  recipients: NotificationRecipients
): Promise<void> {
  // AC7: Deduplication
  if (shouldThrottle(alert.id)) {
    logger.debug('Alert throttled (duplicate within 5 min)', { alertId: alert.id });
    return;
  }

  // AC6: Quiet hours logic
  if (!shouldSendByQuietHours(alert.severity)) {
    logger.info('Alert silenced during quiet hours (22:00-06:00 UTC)', {
      alertId: alert.id,
      severity: alert.severity,
    });
    return;
  }

  recordNotificationTime(alert.id);

  // AC1: Send email for critical/high
  if (alert.severity === 'critical' || alert.severity === 'high') {
    const subject = `[${alert.severity.toUpperCase()}] ${alert.message}`;
    const body = `
Alert: ${alert.message}
Severity: ${alert.severity}
Metric: ${alert.metric}
Time: ${alert.timestamp}
ID: ${alert.id}

Check dashboard: http://localhost:3000/api/health
    `.trim();

    await sendEmail(recipients.email, subject, body);
  }

  // AC2: Send Slack notification
  if (recipients.slack.webhookUrl) {
    await sendSlack(recipients.slack.webhookUrl, alert, recipients.slack.channel);
  }

  logger.info('Alert notification sent', {
    alertId: alert.id,
    severity: alert.severity,
    recipients: recipients.email.length,
  });
}

export function getLastNotificationTime(alertId: string): number | null {
  return lastNotificationTime.get(alertId) || null;
}

export function clearNotificationHistory() {
  lastNotificationTime.clear();
}

export function resetDedup(alertId: string) {
  lastNotificationTime.delete(alertId);
}
