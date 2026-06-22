import { Router } from 'express';
import { notifyAlert, NotificationRecipients } from '../lib/notificationManager.js';
import { scheduleEscalation } from '../middleware/alertEscalation.js';
import { logger } from '../logger.js';

const router = Router();

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metric: string;
  timestamp: string;
}

// Notification history
const notificationHistory: Array<{
  alertId: string;
  timestamp: string;
  channel: 'email' | 'slack';
  status: 'sent' | 'failed';
  recipient: string;
}> = [];

const maxHistorySize = 10000;

function getNotificationRecipients(): NotificationRecipients {
  return {
    email: (process.env.ALERT_EMAIL_RECIPIENTS || 'ops@company.com').split(',').map((e) => e.trim()),
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      channel: process.env.SLACK_INCIDENT_CHANNEL || '#incidents',
    },
  };
}

function recordNotification(
  alertId: string,
  channel: 'email' | 'slack',
  status: 'sent' | 'failed',
  recipient: string
) {
  notificationHistory.push({
    alertId,
    timestamp: new Date().toISOString(),
    channel,
    status,
    recipient,
  });

  if (notificationHistory.length > maxHistorySize) {
    notificationHistory.shift();
  }
}

// AC9: Test alert endpoint
router.post('/test-alert', async (req, res) => {
  const { severity = 'high', message = 'Test alert' } = req.body;

  const testAlert: Alert = {
    id: `test-alert-${Date.now()}`,
    severity,
    message,
    metric: 'test',
    timestamp: new Date().toISOString(),
  };

  try {
    const recipients = getNotificationRecipients();
    await notifyAlert(testAlert, recipients);

    recordNotification(testAlert.id, 'email', 'sent', recipients.email.join(', '));
    recordNotification(testAlert.id, 'slack', 'sent', recipients.slack.channel);

    res.json({
      status: 'sent',
      alert: testAlert,
      recipients,
    });
  } catch (error) {
    logger.error('Test alert failed', { error });
    recordNotification(testAlert.id, 'email', 'failed', 'unknown');
    res.status(500).json({ error: 'Failed to send test alert' });
  }
});

// AC8: Notification history endpoint
router.get('/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const severity = req.query.severity as string;

  let history = notificationHistory;
  if (severity) {
    history = history.filter((n) =>
      n.alertId.includes(severity.toLowerCase())
    );
  }

  res.json({
    notifications: history.slice(-limit),
    total: notificationHistory.length,
    timestamp: new Date().toISOString(),
  });
});

// AC3: Notification recipients management
router.get('/recipients', (req, res) => {
  const recipients = getNotificationRecipients();
  res.json({
    email: recipients.email,
    slack: {
      channel: recipients.slack.channel,
      configured: !!recipients.slack.webhookUrl,
    },
    timestamp: new Date().toISOString(),
  });
});

// Update recipients (admin only in production)
router.put('/recipients', (req, res) => {
  const { email, slackWebhook, slackChannel } = req.body;

  if (email && Array.isArray(email)) {
    process.env.ALERT_EMAIL_RECIPIENTS = email.join(',');
  }

  if (slackWebhook) {
    process.env.SLACK_WEBHOOK_URL = slackWebhook;
  }

  if (slackChannel) {
    process.env.SLACK_INCIDENT_CHANNEL = slackChannel;
  }

  logger.info('Notification recipients updated', { email, slackChannel });

  res.json({
    message: 'Recipients updated',
    recipients: getNotificationRecipients(),
  });
});

// Send alert notification immediately
router.post('/send', async (req, res) => {
  const { alert } = req.body as { alert: Alert };

  if (!alert || !alert.id || !alert.severity) {
    return res.status(400).json({ error: 'Invalid alert format' });
  }

  try {
    const recipients = getNotificationRecipients();

    // Schedule escalation with appropriate delay
    scheduleEscalation(alert, async (_alert, actions) => {
      await notifyAlert(alert, recipients);
      recordNotification(alert.id, 'email', 'sent', recipients.email.join(', '));
      recordNotification(alert.id, 'slack', 'sent', recipients.slack.channel);
    });

    res.json({
      status: 'scheduled',
      alert,
    });
  } catch (error) {
    logger.error('Failed to send alert', { error });
    res.status(500).json({ error: 'Failed to send alert' });
  }
});

export default router;
