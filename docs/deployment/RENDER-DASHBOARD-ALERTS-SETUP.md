# ⚡ Render Dashboard — Alert Configuration

**Created**: FRI 19 Sep 2026  
**Purpose**: Configure production-ready alerts on Render dashboard  
**Timeline**: Setup today (FRI 19), active MON 21+

---

## Render Built-in Monitoring (No extra cost)

Render automatically monitors your service every 30 seconds.

### Step 1: Open Render Dashboard

1. Login to https://dashboard.render.com
2. Click on service: **ctrl-alt-news-portal**
3. Navigate to **Metrics** tab

### Step 2: View Available Metrics

Render tracks automatically:

| Metric | What it measures | Healthy range |
|--------|-----------------|----------------|
| **CPU Usage** | Processor load | < 50% |
| **Memory Usage** | RAM consumption | < 80% |
| **Response Time** | How fast server responds | < 500ms |
| **Requests/min** | Traffic volume | Normal baseline |
| **Errors/min** | How many requests fail | < 1% |

### Step 3: Check Current Status

**In Metrics tab**:
- [ ] CPU: Check current % (should be < 20% at idle)
- [ ] Memory: Check current % (should be < 40% at idle)
- [ ] Response Time: Check current (should be 100-300ms)
- [ ] Errors: Check current (should be 0-2 errors/min if any)

---

## Sentry Error Tracking (Free tier: 10k errors/month)

### Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Create account (or use existing)
3. Create new project → Platform: **Node.js**
4. Copy **DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### Step 2: Add DSN to Render Environment

1. Render Dashboard → Service → Environment
2. Add new env var:
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
3. Click "Save" and Render auto-redeploys

### Step 3: Verify Sentry Integration

1. After deploy, visit https://sentry.io/organizations/[your-org]/issues/
2. You should see a "Getting Started" message
3. Send a test error from app to confirm integration:
   ```bash
   # Optional: trigger test error via API
   curl https://ctrl-alt-news-portal.onrender.com/api/test-error
   ```
4. Error should appear in Sentry dashboard within 1 min

### Step 4: Setup Sentry Alerts

In Sentry Dashboard:

1. **Create Alert Rule**
   - Go to **Alerts** tab
   - Click "Create Alert Rule"
   - Trigger: "An issue is seen X times in Y minutes"
   - Threshold: **1 time in 1 minute** (catch any error immediately)
   - Action: Send email to **regis649@googlemail.com**

2. **Alert Frequency**
   - Set to "As often as possible" (default)
   - This ensures you get notified of EVERY error in production

3. **Test the alert**
   - You should get email within 2 min of test error

---

## Pingdom External Uptime Monitoring (Free tier: 1 check)

### Step 1: Create Pingdom Account

1. Go to https://app.pingdom.com/signup/
2. Create account (free tier available)
3. Email verification

### Step 2: Create Uptime Check

1. Dashboard → Create check → **HTTP(S)**
2. URL: `https://ctrl-alt-news-portal.onrender.com/health`
3. Check interval: **1 minute** (most frequent for free tier)
4. Location: Select closest to users (e.g., EU region)
5. Create

### Step 3: Setup Pingdom Alerting

1. Go to check details
2. **Alert Contacts** → Add email: **regis649@googlemail.com**
3. **Alert Policies**:
   - [ ] Alert on DOWN (immediate)
   - [ ] Alert on response time > 10 seconds
   - [ ] Alert on SSL certificate issues

4. Test: Manually stop service and verify alert arrives within 2 min

### Step 4: Pingdom Dashboard Bookmark

Save: https://app.pingdom.com/  
You'll get uptime report every week via email (free tier)

---

## Google Analytics 4 (Free tier: unlimited)

### Step 1: Create GA4 Property

1. Go to https://analytics.google.com
2. Create new property: "Ctrl Alt News Production"
3. Industry category: **Media & Publishing**
4. Copy **Measurement ID** (looks like: `G-XXXXXXXXXX`)

### Step 2: Add Tracking Tag to Frontend

The tag is likely already in `client/src/index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

If missing, add to `<head>` section.

### Step 3: Verify Tracking

1. Deploy change (if you added tag)
2. Visit app in browser
3. Wait 30-60 seconds
4. Go to GA4 Real-time report: https://analytics.google.com → Reports → Real-time
5. You should see yourself as active user

### Step 4: Setup GA4 Alerts

In GA4:

1. **Admin** → **Alerts**
2. Create alert: "When realtime active users = 0 for 30 min" → Email
3. This notifies you if site goes down (no traffic)

---

## Alert Summary Table

| Alert Source | Trigger | Recipient | Frequency |
|--------------|---------|-----------|-----------|
| **Sentry** | Any error | regis649@googlemail.com | Immediate |
| **Pingdom** | Site down | regis649@googlemail.com | Immediate |
| **GA4** | No users for 30 min | regis649@googlemail.com | Immediate |
| **Render** | Memory > 90% | View in dashboard | Real-time |
| **Render** | CPU > 80% | View in dashboard | Real-time |

---

## Testing All Alerts (Recommended)

### Test 1: Sentry Alert
```bash
curl https://ctrl-alt-news-portal.onrender.com/api/test-error
# Wait 2 min → Check email
```

### Test 2: Pingdom Alert
```
In Pingdom dashboard: Click "Test notification"
# Or manually stop Render service → Alert within 2 min
```

### Test 3: GA4 Alert
```
Open app in incognito browser
# Wait 5 min → Check GA4 real-time
```

---

## Dashboard Quick Access

**Bookmark these**:

1. **Render Metrics**: https://dashboard.render.com/services/ctrl-alt-news-portal
2. **Sentry Issues**: https://sentry.io/organizations/[org]/issues/
3. **Pingdom Status**: https://app.pingdom.com/
4. **Google Analytics**: https://analytics.google.com

---

## Monitoring Routine (Starting MON 21)

### Every 2 hours (during business hours)
- [ ] Check Render metrics dashboard
- [ ] Check Sentry for new errors
- [ ] Verify /health endpoint responding

### Every 4 hours
- [ ] Review error rate trend
- [ ] Check response time trend
- [ ] Monitor memory usage

### Daily (after launch)
- [ ] Generate uptime report from Pingdom
- [ ] Check GA4 traffic trends
- [ ] Review logs for anomalies
- [ ] Respond to any alerts

---

## Post-Launch Success (After 24 hours)

**Confirm all green**:
- [ ] Uptime ≥ 99%
- [ ] Sentry: 0 critical errors (or < 5 total)
- [ ] Pingdom: 100% uptime
- [ ] GA4: Normal traffic patterns
- [ ] Response time: Consistent < 500ms
- [ ] Memory: Stable < 60%

If all pass → **LAUNCH SUCCESSFUL** 🎉

---

**Setup Instructions**: FRI 19 Sep  
**Live Date**: MON 21 Sep  
**Alert Review**: Every 24 hours first week, then weekly
