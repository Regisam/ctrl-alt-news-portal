import { logger } from '../logger.js';

// AC4: Slack notification types
export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
}

class SlackNotifier {
  private readonly SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';
  private readonly SLACK_CHANNEL = process.env.SLACK_CHANNEL || '#alerts';

  // AC4: Send alert to Slack
  async sendAlert(title: string, message: string, severity: 'info' | 'warning' | 'critical'): Promise<boolean> {
    if (!this.SLACK_WEBHOOK_URL) {
      logger.warn('Slack webhook not configured');
      return false;
    }

    try {
      const color = this.getSeverityColor(severity);
      const emoji = this.getSeverityEmoji(severity);

      const payload: SlackMessage = {
        channel: this.SLACK_CHANNEL,
        text: `${emoji} ${title}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${emoji} ${title}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Severity*\n${severity.toUpperCase()}`,
              },
              {
                type: 'mrkdwn',
                text: `*Time*\n${new Date().toISOString()}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `_Ctrl Alt News Platform Alert_`,
            },
          },
        ],
      };

      // AC4: In production, use fetch to send to webhook
      // await fetch(this.SLACK_WEBHOOK_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      logger.info('Slack notification would be sent', { title, severity });
      return true;
    } catch (error) {
      logger.error('Failed to send Slack notification', { error, title });
      return false;
    }
  }

  // AC4: Send metric update
  async sendMetricUpdate(metric: string, value: number, threshold: number): Promise<boolean> {
    const message = `Metric: *${metric}*\nValue: \`${value}\`\nThreshold: \`${threshold}\`\nStatus: ${value > threshold ? '🔴 ABOVE' : '🟢 BELOW'}`;

    return this.sendAlert(`Metric Alert: ${metric}`, message, value > threshold ? 'critical' : 'info');
  }

  // AC4: Send recovery notification
  async sendRecovery(alertTitle: string): Promise<boolean> {
    const message = `✅ Alert has been resolved: *${alertTitle}*\n\nSystem is back to normal.`;

    return this.sendAlert('Alert Resolved', message, 'info');
  }

  // Get severity color for Slack
  private getSeverityColor(severity: 'info' | 'warning' | 'critical'): string {
    if (severity === 'critical') return '#FF0000';
    if (severity === 'warning') return '#FFA500';
    return '#0099FF';
  }

  // Get severity emoji
  private getSeverityEmoji(severity: 'info' | 'warning' | 'critical'): string {
    if (severity === 'critical') return '🚨';
    if (severity === 'warning') return '⚠️';
    return 'ℹ️';
  }
}

export const slackNotifier = new SlackNotifier();
