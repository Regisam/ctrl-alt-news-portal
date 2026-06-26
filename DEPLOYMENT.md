# 🚀 DEPLOYMENT GUIDE — Ctrl Alt News Portal

**Status:** Production Ready | Build: Clean | Tests: Pass | Git: Synced

## Quick Start

```bash
# 1. Go to Railway dashboard
# 2. Connect GitHub repo: Regisam/ctrl-alt-news-portal
# 3. Set environment variables (see below)
# 4. Deploy: git push origin main
# 5. Done! 🎉
```

---

## Railway Deployment (Recommended)

### Step 1: Connect Repository

```
1. Visit https://railway.app
2. Login with GitHub
3. New Project → GitHub Repo
4. Search: Regisam/ctrl-alt-news-portal
5. Select and authorize
6. Railway auto-detects build/start commands
```

### Step 2: Set Environment Variables

In Railway Dashboard → Project Settings → Variables:

```
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/ctrlaltnews

# Email (Choose one option)
# Option A: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=noreply@ctrlaltnews.com

# Option B: SendGrid
SENDGRID_API_KEY=SG.xxxxx...
FROM_EMAIL=noreply@ctrlaltnews.com

# Push Notifications
VAPID_PUBLIC_KEY=BO5...
VAPID_PRIVATE_KEY=xxx...
VAPID_SUBJECT=mailto:admin@ctrlaltnews.com

# Authentication
JWT_SECRET=(generate: openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# Application
BASE_URL=https://ctrlaltnews.railway.app
NODE_ENV=production
PORT=3000

# Optional: Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#alerts
```

### Step 3: Database Setup

#### Option A: Use Railway PostgreSQL Plugin
```
1. In Railway Dashboard
2. Add → PostgreSQL
3. Railway auto-sets DATABASE_URL
4. Done!
```

#### Option B: External PostgreSQL
```
1. Create database (AWS RDS, Heroku Postgres, etc)
2. Note connection string
3. Add as DATABASE_URL environment variable
```

### Step 4: Run Migrations

```bash
# In Railway Shell or via CLI
npx prisma migrate deploy

# Verify schema
npx prisma studio
```

### Step 5: Deploy

```bash
# All code is ready, just push
git push origin main

# Railway auto-builds and deploys
# Build time: ~3 minutes
# Total deployment: ~5 minutes
```

---

## Monitoring Deployment

### Real-time Logs

```bash
# In Railway Dashboard → Logs
# Watch build and startup process
# Should see: "Server running on port 3000"
```

### Health Check

```bash
# After deployment is live
curl https://ctrlaltnews.railway.app/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "cache": "ready",
  "timestamp": "2026-06-26T..."
}
```

### Test Endpoints

```bash
# Get VAPID public key (public endpoint)
curl https://ctrlaltnews.railway.app/api/push/vapid-public-key

# Register user (test authentication)
curl -X POST https://ctrlaltnews.railway.app/api/auth-v2/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'

# Get metrics (auth required)
curl -H "Authorization: Bearer TOKEN" \
  https://ctrlaltnews.railway.app/api/analytics-live/live
```

---

## Post-Deployment Checklist

### ✅ Immediate (5 min)

- [ ] Health endpoint returns 200
- [ ] Database connection successful
- [ ] No error logs in Railway dashboard
- [ ] Frontend loads (visit homepage)

### ✅ First Hour (60 min)

- [ ] User registration works
- [ ] Login works
- [ ] Articles load
- [ ] Search works
- [ ] Push notification setup works
- [ ] Email sends verification (check inbox)
- [ ] Dashboard loads with metrics

### ✅ First Day (24h)

- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify email delivery
- [ ] Test push notifications (send test)
- [ ] Monitor alerts dashboard
- [ ] Check database performance

### ✅ First Week

- [ ] Monitor user signup
- [ ] Check analytics dashboard
- [ ] Verify email digests sent
- [ ] Monitor system health
- [ ] Check performance trends
- [ ] Review error logs

---

## Troubleshooting

### Database Connection Failed

```
Error: ECONNREFUSED postgresql://...
→ Check DATABASE_URL is correct
→ Verify PostgreSQL is running
→ Check firewall allows connections
→ Test connection: psql <DATABASE_URL>
```

### Email Not Sending

```
Error: SMTP connection failed
→ Check SMTP credentials
→ Verify firewall allows SMTP port
→ Test with: telnet smtp.gmail.com 587
→ Check app-specific password (Gmail)
```

### Push Notifications Not Working

```
Error: VAPID key invalid
→ Regenerate VAPID keys: web-push generate-vapid-keys
→ Update both keys in Railway
→ Restart deployment
```

### Service Worker Not Registering

```
Error: Service Worker registration failed
→ Check HTTPS is enabled (required for Push API)
→ Verify public/service-worker.js exists
→ Check browser console for errors
```

### High Memory Usage

```
Error: Memory > 90%
→ Scale up Railway instance
→ Check for memory leaks in logs
→ Restart service
→ Monitor metrics
```

---

## Rollback Procedure

If deployment fails:

```
1. Railway Dashboard → Deployments
2. Select previous successful deployment
3. Click "Redeploy"
4. System automatically reverts
5. Investigate issue locally
6. Fix and push again
```

---

## Performance Optimization

### Cache Control

Static assets cached for 1 year:
```
GET /assets/chunk-xxx.js
Cache-Control: public, max-age=31536000, immutable
```

HTML not cached (revalidate on every request):
```
GET /index.html
Cache-Control: public, max-age=0, must-revalidate
```

### Compression

- gzip enabled (level 6)
- Brotli for supported browsers
- Threshold: 1KB

### Database Optimization

- Connection pooling (20 connections)
- Query result caching
- Index optimization
- Prepared statements

---

## Monitoring & Alerts

### Real-time Metrics

```
Dashboard → /dashboard
Shows live metrics every 30 seconds:
- Active users
- Article views
- Email metrics
- Push metrics
- Error rate
- Response time
```

### Alert Configuration

```
Critical alerts trigger:
- Server down (2 consecutive health check failures)
- Error rate > 10% for 5 minutes
- Database connection failed
- Memory > 90% for 5 minutes
- Response time p95 > 500ms

Check alerts at: /api/alerts/dashboard
```

### Slack Integration

```
Alerts sent to Slack channel automatically
Configure: SLACK_WEBHOOK_URL + SLACK_CHANNEL
Test: /api/alerts/test-slack
```

---

## Scaling

### If traffic increases:

**Step 1: Vertical Scaling (First)**
```
Railway Dashboard → Instance type
Increase CPU/Memory
No downtime with proper setup
Monitor for 30 minutes
```

**Step 2: Horizontal Scaling (If needed)**
```
Deploy multiple instances
Railway load balancer handles distribution
Sticky sessions for WebSocket
Monitor session consistency
```

**Step 3: Database Scaling**
```
Enable PostgreSQL read replicas
Point read-heavy endpoints to replicas
Monitor replication lag
```

---

## Maintenance

### Weekly Tasks

- Check error logs
- Monitor performance metrics
- Review alert history
- Verify backups

### Monthly Tasks

- Security updates
- Dependency updates
- Performance analysis
- Capacity planning

### Quarterly Tasks

- Major version upgrades
- Disaster recovery drill
- Security audit
- Scaling assessment

---

## Support

### Documentation

- API Reference: `docs/API.md`
- Setup Guide: `docs/INTEGRATION_SETUP.md`
- Operations: `docs/OPERATIONS_AND_MONITORING_PLAN.md`

### Logs

```bash
# Railway Dashboard → Logs
# Filter by level (error, warning, info)
# Search by keyword
# Export for analysis
```

### Health Endpoints

```
GET /health → Overall health
GET /api/analytics-live/live → Current metrics
GET /api/alerts/dashboard → Active alerts
```

---

## Success Criteria

✅ Deployment complete when:

1. Health endpoint returns 200
2. Database connected
3. Frontend loads
4. Authentication works
5. All API endpoints responding
6. Metrics visible in dashboard
7. Alerts system active
8. No critical errors in logs
9. Response time < 200ms (p95)
10. Error rate < 1%

---

**Ctrl Alt News Portal — Deployment Ready** 🚀

Estimated time to live: **5-10 minutes**

After deployment: Monitor dashboard at `/dashboard`
