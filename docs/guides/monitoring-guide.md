# Production Monitoring Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22  
**Audience**: Operations team, Platform engineers

---

## Overview

Ctrl Alt News Portal monitoring stack provides real-time visibility into:
- **Server Health**: Uptime, memory, CPU, process status
- **Performance Metrics**: Request latency (p50, p95, p99), throughput
- **Error Tracking**: Error rates, HTTP error codes, exception logs
- **Alerting**: Automatic alerts for critical conditions

---

## Endpoints

### Health Check

```bash
GET /api/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-06-22T10:30:45.123Z",
  "uptime": 86400,
  "memory": {
    "process": {
      "heapUsed": 128,
      "heapTotal": 256,
      "percent": 50.0
    },
    "system": {
      "total": 16384,
      "free": 8192,
      "percent": 50.0
    }
  },
  "cpu": {
    "cores": 8,
    "loadAverage": [0.5, 0.4, 0.3]
  },
  "services": {
    "server": "healthy",
    "logger": "healthy"
  }
}
```

**Status Codes**:
- `200` — Server healthy
- `503` — Server degraded (high memory/CPU)

---

### Performance Metrics

```bash
GET /api/monitoring/metrics
```

**Response**:
```json
{
  "timestamp": "2026-06-22T10:30:45.123Z",
  "latency": {
    "p50": 45,
    "p95": 120,
    "p99": 250,
    "avg": 60
  },
  "requests": {
    "total": 12345,
    "errorRate": 0.02
  },
  "activeSessions": 234,
  "articlesViewed": 5678
}
```

**Interpretation**:
- **p50 (Median)**: 50% of requests complete in <45ms
- **p95 (95th percentile)**: 95% of requests complete in <120ms
- **p99 (99th percentile)**: 99% of requests complete in <250ms
- **Error Rate**: 2% of requests resulted in errors (4xx/5xx)

---

### Active Alerts

```bash
GET /api/monitoring/alerts
```

**Response**:
```json
{
  "active": [
    {
      "id": "alert-1687353045123",
      "severity": "high",
      "message": "Process memory usage high: 85%",
      "metric": "process_memory",
      "timestamp": "2026-06-22T10:30:45.123Z"
    }
  ],
  "count": 1,
  "timestamp": "2026-06-22T10:30:45.123Z"
}
```

---

### Alert History

```bash
GET /api/monitoring/alerts/history?limit=100
```

Returns last N alerts (max 1000). Use for trend analysis.

---

### Prometheus Metrics

```bash
GET /metrics
```

Full Prometheus metrics export. Use with Grafana or Prometheus for advanced dashboards.

**Key metrics**:
- `http_request_duration_seconds` — Request latency (histogram)
- `http_request_total` — Request count by method/route/status
- `http_errors_total` — Error count by route
- `active_sessions` — Current active user sessions
- `articles_viewed_total` — Article views by article/category

---

## Alert Thresholds

| Metric | Threshold | Severity | Action |
|--------|-----------|----------|--------|
| Process Memory | >80% | High | Investigate memory leaks |
| Process Memory | >90% | Critical | Restart server |
| System Memory | >85% | High | Scale horizontally |
| System Memory | >95% | Critical | Emergency action |
| CPU Load | >80% | High | Monitor |
| Error Rate | >5% | High | Check logs for patterns |
| Uptime | <60 sec | Medium | Server recently restarted |

---

## Dashboard Creation (Grafana)

If using Grafana, create dashboard with:

1. **Health Card**
   - Current status (ok/degraded)
   - Uptime gauge
   - Last updated timestamp

2. **Latency Chart**
   - Line chart: p50, p95, p99 over time
   - Target: p99 < 500ms

3. **Error Rate**
   - Gauge + sparkline
   - Target: <1%

4. **Resource Usage**
   - Stacked area: process memory, system memory
   - CPU load overlay

5. **Active Alerts**
   - Table of current alerts
   - Color-coded by severity

---

## Monitoring Best Practices

### 1. Regular Health Checks

**Automated** (every 5 min):
```bash
curl -s http://localhost:3000/api/health | jq .status
```

**Manual** (once per shift):
```bash
curl http://localhost:3000/api/health | jq .
```

### 2. Error Log Monitoring

**Daily review**:
```bash
tail -500 logs/error.log | grep -E "\[ERROR\]|\[CRITICAL\]" | wc -l
```

Alert if count > 50 errors per day.

### 3. Performance Baseline

Track metrics weekly to establish baseline:

```bash
# Save weekly snapshot
curl http://localhost:3000/api/monitoring/metrics >> metrics-weekly.log
```

Compare week-over-week to detect degradation.

### 4. Alert Tuning

After implementation, monitor false positive rate:
- Target: <5% false positives
- Tune thresholds based on actual baseline

---

## Troubleshooting

### Metrics endpoint returns empty?

1. Verify server is running: `curl http://localhost:3000/api/health`
2. Check if monitoring router is registered: Search logs for "monitoring"
3. Wait 60+ seconds for metrics to accumulate

### Health check shows degraded?

1. Check system resources: `free -h`, `top`
2. Review error logs: `tail -100 logs/error.log`
3. Restart server if memory > 95%

### Alerts not triggering?

1. Verify threshold in `server/api/monitoring.ts`
2. Check if alert is being created: Look for `[ALERT]` in logs
3. Test endpoint: `curl http://localhost:3000/api/monitoring/alerts`

---

## Integration Examples

### Email Alerts (Future)

```typescript
// In monitoring.ts
if (severity === 'critical') {
  await sendEmail({
    to: 'oncall@company.com',
    subject: `[CRITICAL] ${message}`,
    body: `Alert: ${message}\nMetric: ${metric}\nTime: ${timestamp}`,
  });
}
```

### Slack Notifications (Future)

```typescript
const slack = new WebClient(process.env.SLACK_TOKEN);
await slack.chat.postMessage({
  channel: '#incidents',
  text: `:warning: ${severity.toUpperCase()}: ${message}`,
});
```

---

## SLA Targets

| Metric | Target | Status |
|--------|--------|--------|
| Dashboard Uptime | 99.9% | 🟢 On track |
| MTTR (Mean Time To Recovery) | <15 min | 🟡 Monitor |
| Alert Accuracy | <5% false positives | 🟡 Tuning |
| Response Time p99 | <500ms | 🟢 On track |
| Error Rate | <1% | 🟢 On track |

---

**Questions?** Check `docs/runbooks/incident-response.md` for incident handling procedures.
