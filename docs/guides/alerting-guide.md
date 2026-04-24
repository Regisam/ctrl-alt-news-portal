# Alerting & Notifications Guide

This guide explains how alerts are configured, triggered, and notified in Ctrl Alt News Portal.

## Overview

The alerting system consists of three components:

1. **Prometheus** - Scrapes metrics from the application
2. **AlertManager** - Evaluates alert rules and routes notifications
3. **Notification Channels** - Slack (real-time), Email (critical escalation)

## Alert Rules

Alert rules are defined in `prometheus-alerts.yml` and evaluated every 30 seconds by Prometheus.

### 1. HttpErrorRateHigh (CRITICAL)

**Condition:** Error rate > 5% for >1 minute

**What it means:** The application is experiencing elevated error rates. More than 5 out of 100 requests are failing.

**Severity:** Critical (RED)

**Who gets notified:** #alerts (Slack) immediately

**Remediation steps:**
1. Check error logs: `docker logs ctrl-alt-news-portal | grep ERROR`
2. View error dashboard in Grafana to identify affected endpoints
3. Check if recent deployment is causing issues
4. Investigate external service dependencies (database, cache, APIs)
5. Consider rolling back recent changes if error rate persists

**Example alert message:**
```
Error rate is 8.5% errors/sec (threshold: >5%)
```

---

### 2. HttpLatencyHigh (CRITICAL)

**Condition:** P99 latency > 2 seconds for >2 minutes

**What it means:** 99% of requests are taking longer than 2 seconds to complete. User experience is degraded.

**Severity:** Critical (RED)

**Who gets notified:** #alerts (Slack) immediately

**Remediation steps:**
1. Check slow query logs in database
2. Monitor CPU/memory on application server
3. Check cache hit rates (Redis, Memcached)
4. Review recent database migrations or schema changes
5. Identify slow endpoints in Grafana dashboard
6. Consider increasing application replicas if under high load

**Example alert message:**
```
P99 latency is 3.5s (threshold: >2s)
```

---

### 3. MemoryUsageHigh (WARNING)

**Condition:** Process memory > 500MB for >5 minutes

**What it means:** The Node.js process is consuming excessive memory. Possible memory leak.

**Severity:** Warning (YELLOW)

**Who gets notified:** #alerts (Slack)

**Remediation steps:**
1. Check for memory leaks in recent code changes
2. Monitor memory trend in Grafana (is it growing?)
3. Restart application if memory usage continues to grow
4. Run heap dump: `curl http://localhost:3000/debug/heapdump`
5. Analyze heap dump in Chrome DevTools
6. Check for unreleased timers or event listeners

**Example alert message:**
```
Memory usage is 567MB (threshold: >500MB)
```

---

### 4. CpuUsageHigh (WARNING)

**Condition:** CPU usage > 80% for >5 minutes

**What it means:** The application is consuming most available CPU. Performance may degrade.

**Severity:** Warning (YELLOW)

**Who gets notified:** #alerts (Slack)

**Remediation steps:**
1. Identify CPU-intensive operations in logs
2. Check if a specific request pattern is causing high CPU
3. Consider increasing application replicas
4. Review recent code changes for inefficient algorithms
5. Check for infinite loops or busy-waiting patterns
6. Profile with Node.js profiler if CPU persists

**Example alert message:**
```
CPU usage is 85.2% (threshold: >80%)
```

---

### 5. DiskSpaceLow (WARNING)

**Condition:** Disk usage > 90% for >10 minutes

**What it means:** Storage is running low. Application may not be able to write logs or temporary files.

**Severity:** Warning (YELLOW)

**Who gets notified:** #alerts (Slack)

**Remediation steps:**
1. Identify large files consuming disk space
2. Clean up old logs: `docker exec ... rm -rf /var/log/*.old`
3. Check for large temporary files: `du -sh /tmp/*`
4. Clean Docker unused images: `docker system prune`
5. Consider expanding disk if permanent growth expected
6. Implement log rotation if not already configured

**Example alert message:**
```
Disk usage is 92% full (threshold: >90%)
```

---

## Alert Routing

Alerts are routed based on severity:

### Critical Alerts
- Routed to: `#critical-alerts` (Slack) + email
- Time-to-escalate: 5 minutes (page on-call team)
- Auto-escalation: Yes (if unresolved after 5 min)

### Warning Alerts
- Routed to: `#alerts` (Slack)
- Time-to-page: Manual (human decision)
- Escalation: No auto-escalation

---

## Alert Suppression Rules (Inhibition)

Some alerts are automatically suppressed to reduce noise:

**Rule 1:** If CpuUsageHigh is firing, suppress MemoryUsageHigh
- Reasoning: High CPU often causes memory pressure; fix CPU first

**Rule 2:** If a critical alert is firing, suppress warning-level alerts with same name
- Reasoning: Avoid duplicate notifications

**Rule 3:** Suppress duplicate alerts within 5 minutes
- Reasoning: Flapping alerts are usually transient issues

---

## Testing Alerts

Use the alert test harness to validate alert rules:

### Test High Error Rate
```bash
npx ts-node tests/alert-test-harness.ts error-rate
```
Expected: HttpErrorRateHigh alert in #alerts within 1-2 minutes

### Test High Latency
```bash
npx ts-node tests/alert-test-harness.ts latency
```
Expected: HttpLatencyHigh alert in #alerts within 2-3 minutes

### Test Memory Leak
```bash
npx ts-node tests/alert-test-harness.ts memory
```
Expected: MemoryUsageHigh alert in #alerts after 5+ minutes

### Run All Tests
```bash
npx ts-node tests/alert-test-harness.ts all
```

---

## Monitoring Alerts

### In Slack

Alerts appear in `#alerts` and `#critical-alerts` channels:

```
Alert: HttpErrorRateHigh

Error rate is 8.5% errors/sec (threshold: >5%)
📖 Runbook: https://wiki/runbook/high-error-rate
📊 Dashboard: https://grafana.local/dashboard/app-metrics
Status: Firing
```

Click "View Dashboard" button to jump to Grafana for investigation.

### In AlertManager UI

Visit `http://localhost:9093` to see:
- All active alerts
- Alert history
- Silence rules
- Notification delivery status

### In Prometheus

Query alerts in Prometheus UI `http://localhost:9090`:
```promql
# See all active alerts
ALERTS{alertstate="firing"}

# See specific alert
ALERTS{alertname="HttpErrorRateHigh"}
```

---

## Configuration

### Slack Integration

1. Create Slack webhook in Slack app settings
2. Set `SLACK_WEBHOOK_URL` environment variable
3. Optionally set `SLACK_ALERTS_CHANNEL` and `SLACK_CRITICAL_CHANNEL`

Default channels:
- `#alerts` - all alerts
- `#critical-alerts` - critical alerts only

### Email Integration

1. Configure SMTP server (Gmail, SendGrid, Mailhog for dev)
2. Set environment variables:
   - `SMTP_SERVER` - SMTP host:port
   - `SMTP_USERNAME` - SMTP user
   - `SMTP_PASSWORD` - SMTP password
   - `SMTP_FROM` - From address
   - `CRITICAL_EMAIL` - Email for critical alerts

For development, use **Mailhog** (already in docker-compose):
```
SMTP_SERVER=mailhog:1025
SMTP_FROM=alertmanager@localhost
CRITICAL_EMAIL=dev@localhost
```

View emails at `http://localhost:1025`

---

## Alert Tuning

Alert thresholds are conservative (designed to avoid false positives).

### Tuning Process

1. **Collect baseline metrics** (7-day period):
   - Normal error rate: usually <0.5%
   - Normal p99 latency: usually <500ms
   - Normal memory: usually <300MB

2. **Adjust thresholds** based on baseline + headroom:
   - Error rate: baseline + 2-3x margin
   - Latency: baseline + 4-5x margin
   - Memory: baseline + 200-300MB

3. **Monitor false positive rate**:
   - Target: <5% false positives per week
   - Track in incident log

4. **Document threshold history** in runbook

---

## Silence Alerts (Maintenance)

To suppress alerts during planned maintenance:

### Via AlertManager UI

1. Visit `http://localhost:9093`
2. Click "Silences" tab
3. Click "New Silence"
4. Select alert matchers and duration
5. Add comment (e.g., "Database maintenance")

### Via API

```bash
curl -X POST http://localhost:9093/api/v2/silences \
  -H 'Content-Type: application/json' \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "HttpErrorRateHigh", "isRegex": false}
    ],
    "duration": "1h",
    "comment": "Deployment in progress"
  }'
```

---

## Escalation Rules

Critical alerts are escalated automatically:

| Time | Action |
|------|--------|
| Alert fires | Immediate Slack notification |
| 5 minutes | Email sent to on-call team |
| 15 minutes | Page on-call engineer (via PagerDuty) |
| 30 minutes | Escalate to manager |

To adjust escalation timing, edit `alertmanager-config.yml`:

```yaml
route:
  routes:
    - match:
        severity: critical
      group_wait: 10s          # Wait before first notification
      group_interval: 2m       # Wait before escalation
      repeat_interval: 4h      # Repeat after 4 hours
```

---

## Troubleshooting

### Alerts Not Firing

**Check Prometheus:**
1. Visit `http://localhost:9090/alerts`
2. Verify alert rules loaded correctly
3. Check "Expression" tab for syntax errors

**Check AlertManager:**
1. Visit `http://localhost:9093`
2. Verify alert rules in "Alerts" tab
3. Check "Configuration" for receiver setup

**Check Slack Webhook:**
```bash
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test message"}'
```

### False Positives

1. Check alert threshold (may be too aggressive)
2. Review baseline metrics for normal variation
3. Increase `for` duration (higher tolerance)
4. Add inhibition rule to suppress related alerts

### Alerts Not Sent

1. Check Slack webhook URL is valid
2. Verify SMTP settings for email
3. Check AlertManager logs: `docker logs alertmanager`
4. Verify notification receivers in `alertmanager-config.yml`

---

## Further Reading

- [Prometheus Alerting](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)
- [AlertManager Docs](https://prometheus.io/docs/alerting/latest/overview/)
- [Slack Webhook Integration](https://api.slack.com/messaging/webhooks)
