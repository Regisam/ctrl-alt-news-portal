# Alerting & Notifications Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Quick Start

### Configure Recipients

```bash
ALERT_EMAIL_RECIPIENTS=ops@company.com,oncall@company.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
SLACK_INCIDENT_CHANNEL=#incidents
```

### Test Alert

```bash
curl -X POST http://localhost:3000/api/notifications/test-alert \
  -H "Content-Type: application/json" \
  -d '{"severity":"high","message":"Test alert"}'
```

## Alert Routing

| Severity | Delay | Email | Slack | Quiet Hours |
|----------|-------|-------|-------|-------------|
| Critical | 0 min | ✅ | ✅ | Always sent |
| High | 5 min | ✅ | ✅ | Outside 22:00-06:00 UTC |
| Medium | 15 min | ❌ | ✅ | Outside quiet hours |
| Low | 30 min | ❌ | ✅ | Outside quiet hours |

## Features

- **AC1**: Email alerts for Critical/High
- **AC2**: Slack notifications for all severities
- **AC3**: Configurable recipient list
- **AC4-5**: Escalation by severity with delays
- **AC6**: Quiet hours (22:00-06:00 UTC)
- **AC7**: Deduplication (5 min window)
- **AC8**: Notification history logged
- **AC9**: Test endpoint available
- **AC10**: Runbook updated

## Endpoints

```bash
GET /api/notifications/recipients
GET /api/notifications/history
POST /api/notifications/test-alert
PUT /api/notifications/recipients
POST /api/notifications/send
```

## SLA Targets

- Email delivery: <5 sec
- Slack delivery: <2 sec
- Alert accuracy: <5% false positives

**See also**: docs/runbooks/incident-response.md
