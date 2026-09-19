# 📊 Monitoring & Alerting Setup

**Created**: 2026-09-19  
**Purpose**: Detect and alert on production issues in real-time  
**Status**: SETUP GUIDE

---

## Overview: 5 Monitoring Layers

```
┌─────────────────────────────────────────────┐
│ Layer 1: Uptime (Render + Pingdom)         │ ← Global accessibility
├─────────────────────────────────────────────┤
│ Layer 2: Application Health (/health)      │ ← Server responsive?
├─────────────────────────────────────────────┤
│ Layer 3: Error Tracking (Sentry)           │ ← Exceptions logged?
├─────────────────────────────────────────────┤
│ Layer 4: Performance (Render logs + GA)    │ ← Fast enough?
├─────────────────────────────────────────────┤
│ Layer 5: Business Metrics (Analytics)      │ ← Users converting?
└─────────────────────────────────────────────┘
```

---

## Layer 1: Uptime Monitoring

**Service**: Render (built-in) + Pingdom (external)

### Render Built-in
```
- Checks server every 30 seconds
- Alerts on: Service down, memory limit exceeded
- No extra cost (included with Render)
- Dashboard: render.com/services/[service-id]
```

### Pingdom (External Monitoring)
```bash
# Setup:
1. Go to pingdom.com (free tier available)
2. Create check: https://ctrl-alt-news-portal.onrender.com/health
3. Check interval: Every 1 minute
4. Alerting: Email when down

# Cost: Free tier sufficient for MVP (1 check)
```

**Alert on**:
- ❌ Service down (HTTP 502/503)
- ❌ Response time > 10 seconds
- ❌ Health endpoint failing

---

## Layer 2: Application Health

**Endpoint**: `GET /health` (built-in, Story 21.1)

```bash
# Check manually
curl https://ctrl-alt-news-portal.onrender.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-09-26T14:15:30Z",
  "uptime": 3600,
  "memory": {
    "process": { "heapUsed": 45, "heapTotal": 120 },
    "system": { "total": 2048, "free": 512 }
  }
}

# Alert if:
# - status != "ok"
# - process heap > 80% of heapTotal
# - Response time > 2 seconds
```

**Monitoring**: Render auto-checks every 30s (logs failures)

---

## Layer 3: Error Tracking — Sentry

**Setup**:

```bash
# 1. Create Sentry account
# → sentry.io (free tier: 10k errors/month)

# 2. Create project
# → Platform: Node.js
# → Copy DSN

# 3. Set environment variable
# SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# 4. Restart server
# → Errors now auto-reported to Sentry
```

**In code** (already integrated):
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: "production",
  tracesSampleRate: 1.0,
});

// Errors automatically captured and reported
```

**Alert Rules**:
```
- CRITICAL: Any error (immediate email)
- HIGH: Error rate > 0.1%
- MEDIUM: Error rate > 0.01%
- LOW: Performance issues detected
```

**Dashboard**: sentry.io/organizations/[org]/issues/

---

## Layer 4: Performance Monitoring

### Render Logs
```bash
# View real-time logs
# Render dashboard → Service → Logs

# Watch for:
# ⚠️ Database query slow (> 1s)
# ⚠️ Memory usage > 90%
# ⚠️ CPU utilization high
```

### Google Analytics 4
```bash
# 1. Create GA4 property
# → analytics.google.com

# 2. Add tracking tag to frontend
# Already configured in client/src/index.html

# 3. Monitor metrics
# → Page load time (target < 3s LCP)
# → Core Web Vitals
# → User acquisition
```

**Alert thresholds**:
- ❌ Page load time > 5s
- ❌ Bounce rate > 50%
- ❌ Error rate > 0.1%

---

## Layer 5: Business Metrics

### Daily Metrics to Check
```
- Active users (last 24h)
- Page views (last 24h)
- Conversion rate (login → read article)
- Error rate (< 0.1%)
- Average response time (< 200ms)
```

### Weekly Metrics Review
- User growth trend
- Feature usage (which pages most visited?)
- Performance trending
- Critical errors (if any)

---

## Alert Destinations

### Email Alerts
```bash
SENTRY_ALERT_EMAIL=regis649@googlemail.com
```

### Slack Alerts (Optional)
```bash
# Setup Slack integration (if needed):
1. Sentry → Settings → Integrations → Slack
2. Connect Slack workspace
3. Route errors to #production channel
```

### SMS Alerts (Emergency Only)
```bash
# Setup SMS for critical incidents (if needed):
1. Sentry → Settings → SMS
2. Add phone number
3. Alert on: Service down only
```

---

## Dashboard Checklist

**Create bookmarks for these**:

1. **Render Dashboard**
   - URL: https://dashboard.render.com/services/[service-id]
   - Check: Logs, Deployments, Environment

2. **Sentry Dashboard**
   - URL: https://sentry.io/organizations/[org]/issues/
   - Check: Error rate, top errors, new errors

3. **Google Analytics**
   - URL: https://analytics.google.com/
   - Check: Active users, page load time, errors

4. **Pingdom (External Monitor)**
   - URL: https://app.pingdom.com/
   - Check: Uptime status, response time

---

## Daily Monitoring Routine (First 7 Days)

**Every 2 hours**:
- [ ] Check Render logs for errors
- [ ] Check Sentry for new issues
- [ ] Verify /health endpoint responding
- [ ] Check Google Analytics for traffic

**Every 4 hours**:
- [ ] Review error rate trend
- [ ] Check response time trend
- [ ] Verify database connections healthy
- [ ] Monitor memory usage

**Daily**:
- [ ] Generate monitoring report
- [ ] Check user feedback (Slack, email)
- [ ] Document any incidents
- [ ] Plan fixes for non-critical issues

---

## Incident Response Flow

```
Error detected (Sentry)
        ↓
Alert sent (Email)
        ↓
Check Render logs (what happened?)
        ↓
Is it critical? (users affected?)
        ├─ YES → ROLLBACK immediately
        └─ NO → Monitor + plan fix
        ↓
If monitoring: Continue observing
        ↓
After 30 min: Decision
        ├─ Stable → Continue monitoring
        ├─ Worsening → ROLLBACK
        └─ Fixed → Deploy patch
```

---

## Success Metrics (First 24 hours)

| Metric | Target | Status |
|--------|--------|--------|
| Uptime | ≥ 99% | ✓ |
| Error Rate | < 0.1% | ✓ |
| Response Time | < 200ms | ✓ |
| Page Load (LCP) | < 3s | ✓ |
| No Critical Errors | 0 | ✓ |

**If all green after 24h** → Launch is successful 🎉

---

## Week 2+ Enhancements

After stable production:
- [ ] Add Redis caching (performance)
- [ ] Add advanced APM (New Relic, DataDog)
- [ ] Setup log aggregation (CloudWatch)
- [ ] Configure auto-scaling (if needed)
- [ ] Optimize database queries
- [ ] Add feature flag system

---

## Monitoring Cost Summary

| Service | Cost | Purpose |
|---------|------|---------|
| Render | $0 | Hosting + built-in monitoring |
| Sentry | $0/month | Error tracking (free tier) |
| Pingdom | $0/month | Uptime monitoring (free tier) |
| Google Analytics | $0 | Performance + user analytics |
| **Total** | **$0** | — |

*All free tier sufficient for MVP* ✅

---

*Monitoring setup by Gage (DevOps)*  
*Launch with confidence — you're being watched* 📊
