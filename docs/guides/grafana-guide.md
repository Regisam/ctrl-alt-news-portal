# Grafana Dashboard User Guide

Complete guide to using the Ctrl Alt News application metrics dashboard in Grafana.

## Access & Authentication

**URL**: http://localhost:3001  
**Default Credentials**:
- Username: `admin`
- Password: `admin`

Change default password on first login (Settings → Change Password).

---

## Dashboard Overview

The **"Ctrl Alt News - Application Metrics"** dashboard displays 6 panels:

1. **Request Rate** — Requests per second
2. **Request Latency** — p50, p95, p99 percentiles
3. **Error Rate** — Errors per second with error codes
4. **Memory Usage** — Process memory in MB
5. **Active Sessions** — Real-time active user sessions
6. **Articles Viewed** — Article view rate by category

---

## Dashboard Controls

### Time Range Selection

**Top-right corner**: Select time window

Common ranges:
- **Last 6 hours** (default) — Good for daily troubleshooting
- **Last 24 hours** — Detect trends
- **Last 7 days** — Compare week-over-week
- **Custom range** — Specific time period

### Auto-Refresh

**Top-right dropdown**: Configure refresh interval

Settings:
- **30s** (default) — Near real-time visibility
- **1m** — Less frequent updates, lower load
- **5m** — For dashboards with many concurrent users
- **Off** — Manual refresh only

Toggle **Pause** button to stop auto-refresh temporarily.

### Zoom In/Out

**Click and drag** on any time-series panel to zoom into a time period.

Double-click to reset zoom.

---

## Understanding Each Panel

### 1. Request Rate

**Shows**: Requests/second over time (pie chart)

**Interpretation**:
- Smooth baseline = healthy traffic
- Spikes = traffic bursts (marketing, alerts)
- Drops = service degradation or traffic loss

**Alert threshold**: > 1000 req/sec (adjust based on capacity)

### 2. Request Latency

**Shows**: Three percentiles (p50, p95, p99) in seconds

**Interpretation**:
- **p50 (median)**: 50% of requests finish faster than this
- **p95 (95th percentile)**: 95% of requests finish faster than this
  - User frustration threshold: ~1-2 seconds
- **p99 (99th percentile)**: Only 1% of requests slower than this
  - Outliers: slow queries, external API calls

**Alert threshold**: p95 > 1s, p99 > 2s

### 3. Error Rate

**Shows**: Errors/second (red line) with breakdown by status code

**Interpretation**:
- Baseline 0 = no errors (ideal)
- Spikes = bugs introduced, external service failures
- 4xx errors = client errors (bad requests, auth failures)
- 5xx errors = server errors (bugs, service unavailable)

**Alert threshold**: > 5% error rate for 5 minutes

### 4. Memory Usage

**Shows**: Process memory in MB over time

**Interpretation**:
- Baseline ~100-200MB = normal startup overhead
- Gradual growth = memory leak (investigate)
- Sudden spike = unusual request processing
- > 500MB = potential OOM risk

**Alert threshold**: > 400MB, or > 10% growth/hour

### 5. Active Sessions

**Shows**: Live users connected to the application

**Interpretation**:
- Peak hours: 50-100+ concurrent sessions
- Off-hours: < 10 sessions
- Sudden drop: connection issue or restart

**Alert threshold**: > 200 sessions (adjust for your SLA)

### 6. Articles Viewed

**Shows**: Article view rate (views/hour) by category

**Interpretation**:
- Distribution across categories shows user interest
- Spikes on specific categories indicate trending topics
- Useful for A/B testing, content recommendations

**Alert threshold**: Monitor for unusual distributions (e.g., one category dominates)

---

## Common Tasks

### Check if Service is Down

1. **Go to Request Rate panel**
2. If graph drops to zero, service is down
3. **Check Prometheus status**: http://localhost:9090
4. **Check server logs**: `docker logs <server-container>`

### Investigate Performance Regression

1. **Select time range** before and after regression occurred
2. **Look at Latency panel** — Did p95/p99 increase?
3. **Check Error Rate** — Are errors increasing?
4. **Check Memory Usage** — Is memory leaking?

**Example**: If p95 latency jumped from 200ms to 1s at 10am:
1. Correlate with error rate — errors increasing too?
2. Check memory usage — spike at same time?
3. Review server logs around 10am
4. Correlate with deployed changes

### Monitor During Load Testing

1. **Start load test** (e.g., `k6 load-test.js`)
2. **Set auto-refresh to 30s**
3. **Watch Request Rate** — expect linear increase
4. **Watch Latency** — p95 should stay < 5% increase
5. **Watch Memory** — should stabilize, not grow unbounded
6. **Watch Error Rate** — should remain 0%

**Acceptance criteria**: < 5% latency impact, < 2% memory growth after load stops

### Export Data for Analysis

**Export as JSON**:
1. Panel menu (top-right corner) → Export → JSON
2. Save for external analysis (e.g., Python, Jupyter)

**Export as CSV** (for specific query):
1. Go to Prometheus http://localhost:9090
2. Execute query in Graph tab
3. Click "Console" → download as CSV

---

## Creating Custom Dashboards

### Add New Panel

1. **Dashboard** → **+ Add Panel**
2. **Metrics** → Choose metric from dropdown
3. **Visualization** → Choose graph type:
   - **Graph** (line, area) — Time series data
   - **Stat** (single value) — Current rate, total count
   - **Gauge** (percentage) — Usage %
   - **Table** (raw data) — Detailed breakdowns

### Example: Custom Query Panel

**Create a panel showing "Error Rate as % of Total Requests"**:

1. **Add Panel** → enter query:
```promql
100 * (sum(rate(http_errors_total[5m])) / sum(rate(http_request_total[5m])))
```

2. **Title**: "Error Rate %"
3. **Unit**: Percent (0-100)
4. **Visualization**: Gauge
5. **Thresholds**: 
   - Green: 0-1%
   - Yellow: 1-5%
   - Red: 5%+

---

## Alerting Basics

**Note**: Full alerting setup in Story 8.3. This is foundational.

### Prometheus Alerts (Threshold-based)

Alerts trigger when a condition is met for `N` minutes:

**Example Alert**: "High Error Rate"
```yaml
expr: (sum(rate(http_errors_total[5m])) / sum(rate(http_request_total[5m]))) > 0.05
for: 5m
severity: critical
```

**Interpretation**: If errors > 5% for 5 consecutive minutes, fire alert.

### Grafana Alerts (Visualization-based)

Trigger alerts based on panel values:

1. **Panel** → **Alert** tab
2. **Create Rule** → Set threshold
3. **Notification Channel** → Slack, email, etc. (Story 8.3)

---

## Performance Tips

### Dashboard Load Time

Slow dashboard? Optimize:

1. **Reduce time range** (Last 6h instead of 30d)
2. **Reduce auto-refresh** (5m instead of 30s)
3. **Decrease number of panels** (move some to separate dashboard)
4. **Simplify queries** (avoid complex joins, use aggregates)

### Prometheus Query Optimization

Slow queries?

```promql
# ❌ Slow: Fetches all data points
rate(http_request_total[5m])

# ✅ Fast: Aggregates first, then calculates rate
rate(sum(http_request_total[5m]))
```

---

## Data Source Configuration

### Add Prometheus as Data Source

1. **Settings** (gear icon) → **Data Sources**
2. **Add data source** → **Prometheus**
3. **URL**: `http://prometheus:9090` (Docker) or `http://localhost:9090` (local)
4. **Test** → should show "Prometheus is ready"

### Verify Metrics are Available

1. **Data Sources** → **Prometheus** → **Explore**
2. **Metrics** dropdown → search for `http_request_total`
3. **Run query** → should return data points

---

## Troubleshooting

### Dashboard shows "No data"

**Possible causes**:

1. **Prometheus not scraping**
   - Check http://localhost:9090/targets
   - Server target should be UP

2. **Metrics not being collected**
   - Check http://localhost:3000/metrics
   - Should show metric names (http_request_total, etc.)

3. **Time range issue**
   - Select "Last 24 hours" to ensure data exists
   - Load test to generate metrics

**Solution**:
```bash
# Restart services
docker-compose -f docker-compose.prometheus.yml down
docker-compose -f docker-compose.prometheus.yml up -d

# Load test to generate metrics
npm run dev  # Start server
curl http://localhost:3000  # Generate traffic
```

### Query returns "No data"

**Check metric name**:
```bash
curl http://localhost:9090/api/v1/series?match[]=http_request_total
```

**Expected output**: List of series with labels

### Grafana connection refused

**Check Prometheus status**:
```bash
docker ps | grep prometheus
docker logs prometheus
```

**Restart if needed**:
```bash
docker-compose -f docker-compose.prometheus.yml restart prometheus
```

---

## Best Practices

### 1. Set Meaningful Thresholds

Don't leave default ranges. Example:

**Memory Alert**:
- Green: 0-200MB (normal)
- Yellow: 200-400MB (elevated)
- Red: 400MB+ (critical)

### 2. Combine Metrics for Diagnosis

Don't look at one metric in isolation:

✅ DO:
- If Error Rate spikes, check Latency AND Memory together
- Memory spike + Latency increase = possible memory leak or GC pause

❌ DON'T:
- Alert on single metric spikes (too noisy)

### 3. Use Business Metrics

"Articles Viewed" panel shows:
- Content popularity
- Traffic patterns
- Trending topics

Use for:
- Content recommendations
- Traffic planning
- A/B test decisions

### 4. Review Dashboards Weekly

Keep dashboards relevant:
- Remove unused panels
- Add new metrics as services evolve
- Update thresholds based on actual performance

---

## Related Documentation

- **[Metrics Guide](./metrics-guide.md)** — Metrics schema & Prometheus queries
- **[Logging Guide](./logging-guide.md)** — Correlate logs with metrics
- **[Story 8.1](../stories/8.1.story.md)** — Structured logging foundation
- **[Story 8.3](../stories/8.3.story.md)** — Alerting & notifications

---

*Last Updated: 2026-04-24*
*Dashboard Version: 1.0*
