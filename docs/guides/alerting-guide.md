# Performance Monitoring & Alerting Guide

## Overview

Real-time alerting system for monitoring performance thresholds and notifying admins of issues.

## Setup

### Environment Variables

```bash
# Slack Integration (AC4)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#alerts

# Email (optional)
ALERT_EMAIL_TO=admin@ctrlaltnews.com
ALERT_EMAIL_FROM=alerts@ctrlaltnews.com
```

### Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Create New App
3. Enable Incoming Webhooks
4. Add New Webhook to Workspace
5. Copy webhook URL to `SLACK_WEBHOOK_URL`

## Configuration

### AC1: Configure Alert Threshold

```bash
POST /api/alerts/thresholds
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "threshold-1",
  "name": "High Response Time",
  "metric": "response_time",
  "threshold": 200,
  "operator": ">",
  "duration": 5,
  "enabled": true,
  "escalate": true,
  "channels": ["slack", "email"]
}
```

### Available Metrics

| Metric | Threshold | Operator | Example |
|--------|-----------|----------|---------|
| `response_time` | ms | > | > 200 (slow) |
| `error_rate` | % | > | > 5 (5% errors) |
| `active_users` | count | < | < 10 (low traffic) |
| `email_bounce` | % | > | > 10 (bounce rate) |
| `push_fail` | % | > | > 5 (failure rate) |

## Alert Management

### AC1: Get All Thresholds

```bash
GET /api/alerts/thresholds
Authorization: Bearer {token}
```

### AC1: Update Threshold

```bash
PUT /api/alerts/thresholds/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "threshold": 300,
  "enabled": false
}
```

### AC3: Check Metric

```bash
POST /api/alerts/check-metric
Authorization: Bearer {token}
Content-Type: application/json

{
  "metric": "response_time",
  "value": 250
}
```

### AC5: Acknowledge Alert

```bash
POST /api/alerts/:id/acknowledge
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Investigating the issue"
}
```

### AC5: Resolve Alert

```bash
POST /api/alerts/:id/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Issue fixed - scaled up servers"
}
```

### AC5: Get Alert History

```bash
GET /api/alerts/:id/history
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "history-1",
        "alertId": "alert-1",
        "action": "triggered",
        "timestamp": "2026-06-26T10:00:00Z",
        "details": "Alert triggered for High Response Time"
      },
      {
        "id": "history-2",
        "alertId": "alert-1",
        "action": "acknowledged",
        "timestamp": "2026-06-26T10:05:00Z",
        "details": "Investigating the issue"
      }
    ],
    "count": 2
  }
}
```

## Custom Rules

### AC8: Create Custom Alert Rule

```bash
POST /api/alerts/rules
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "API Latency High",
  "condition": "response_time > 250 for 5 minutes",
  "channels": ["slack", "email"]
}
```

## Alert Actions

### AC9: Silence Alert

```bash
POST /api/alerts/:id/silence
Authorization: Bearer {token}
Content-Type: application/json

{
  "durationMinutes": 30
}
```

After silence duration, alerts resume if threshold still breached.

### AC10: Dashboard

```bash
GET /api/alerts/dashboard
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "totalActive": 2,
      "critical": 1,
      "warning": 1,
      "activeAlerts": [
        {
          "id": "alert-1",
          "severity": "critical",
          "title": "High Response Time",
          "message": "response_time: 350 (threshold: 200)",
          "createdAt": "2026-06-26T10:00:00Z"
        }
      ],
      "allThresholds": 5
    }
  }
}
```

## Notifications

### AC4: Slack Integration

Alerts automatically sent to Slack with:
- ✅ Alert title and severity
- ✅ Current metric value
- ✅ Threshold value
- ✅ Timestamp
- ✅ Severity indicators (🚨 critical, ⚠️ warning, ℹ️ info)

### AC4: Email Integration

Alerts sent to `ALERT_EMAIL_TO` with:
- Alert details
- Recommended actions
- Dashboard link

### AC11: Test Integration

```bash
POST /api/alerts/test-slack
Authorization: Bearer {token}
```

Sends test alert to verify Slack webhook is working.

## Severity Levels

| Severity | Condition | Action |
|----------|-----------|--------|
| **Critical** | 50%+ threshold breach | Immediate notification, escalate |
| **Warning** | 25-50% threshold breach | Notify, monitor |
| **Info** | < 25% threshold breach | Log, track |

## Alert Lifecycle

```
Triggered
   ↓
Detected (checks thresholds)
   ├─→ Deduplicate (prevent duplicates within 1 min)
   ├─→ Escalate (if persisting > 5 min)
   └─→ Notify (send to Slack/email)
   ↓
Acknowledged (optional)
   ├─→ Record timestamp
   └─→ Update dashboard
   ↓
Resolved
   ├─→ Record timestamp
   ├─→ Send recovery notification
   └─→ Archive for history
```

## Alert Deduplication

### AC6: Prevent Alert Fatigue

- Same threshold breach within 1 minute = deduplicated
- Multiple similar alerts grouped
- Escalation only if threshold persists

Example:
```
10:00 - High latency (200ms) → Alert triggered
10:01 - High latency (210ms) → Deduplicated
10:05 - Still high latency (220ms) → Escalated to Critical
```

## Best Practices

1. **Set Realistic Thresholds**
   - Use baseline metrics
   - Account for seasonal traffic
   - Don't set too low (alert fatigue)

2. **Use Channels Wisely**
   - Critical → Slack + Email + SMS
   - Warning → Slack + Email
   - Info → Dashboard only

3. **Monitor Key Metrics**
   - Response time (< 200ms healthy)
   - Error rate (< 1% healthy)
   - Active users (baseline)
   - Email metrics (open rate > 30%)
   - Push metrics (click rate > 15%)

4. **Respond Quickly**
   - Acknowledge within 5 minutes
   - Resolve or escalate within 15 minutes
   - Document actions in alert history

5. **Review & Adjust**
   - Weekly threshold review
   - Adjust based on traffic patterns
   - Remove obsolete rules

## Troubleshooting

### Alert Not Triggering

1. Verify threshold enabled: `GET /api/alerts/thresholds`
2. Check metric value: `POST /api/alerts/check-metric`
3. Review logs for errors
4. Test with: `POST /api/alerts/test-slack`

### Slack Not Receiving Alerts

1. Verify webhook URL configured
2. Test integration: `POST /api/alerts/test-slack`
3. Check Slack channel exists
4. Verify bot has permission to post

### Alert Fatigue

1. Increase threshold values
2. Increase minimum duration
3. Enable alert grouping
4. Silence non-critical alerts

