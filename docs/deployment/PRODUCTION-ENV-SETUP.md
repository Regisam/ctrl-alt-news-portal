# 🔒 Production Environment Setup

**Created**: 2026-09-19  
**Target**: Production deployment SAT 26 Set or TUE 29 Set  
**Status**: DRAFT — Configure before launch

---

## Required Environment Variables

### Database
```bash
DATABASE_URL=postgresql://user:pass@prod-db.render.com:5432/ctrlaltnewsdb
```
- PostgreSQL on Render (separate from staging)
- Backup automated daily
- Connection pooling configured

### Security & Auth
```bash
JWT_SECRET=<generate-32-char-random-string>
JWT_REFRESH_SECRET=<generate-32-char-random-string>
GOOGLE_OAUTH_CLIENT_ID=<from Google Cloud Console>
GOOGLE_OAUTH_CLIENT_SECRET=<from Google Cloud Console>
```

### Email Service (Transactional)
```bash
EMAIL_PROVIDER=sendgrid  # or resend, mailgun, etc.
EMAIL_API_KEY=<API key from email service>
EMAIL_FROM_ADDRESS=noreply@ctrlaltnews.com
SMTP_HOST=<if using SMTP>
SMTP_PORT=<if using SMTP>
SMTP_USER=<if using SMTP>
SMTP_PASS=<if using SMTP>
```

### Analytics & Monitoring
```bash
GA_TRACKING_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
POSTHOG_API_KEY=<if using PostHog>
DATADOG_API_KEY=<if using Datadog>
```

### Feature Flags & Config
```bash
NODE_ENV=production
PORT=3000  # Render auto-assigns
LOG_LEVEL=info
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
CACHE_TTL=3600
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Optional (Week 2+)
```bash
REDIS_URL=<if using Redis caching>
STRIPE_SECRET_KEY=<if using Stripe payments>
GITHUB_WEBHOOK_SECRET=<if GitHub integrations>
```

---

## Configuration Steps

### 1. Database Setup
- [ ] Create PostgreSQL database on Render (separate from staging)
- [ ] Note connection string → DATABASE_URL
- [ ] Run migrations: `prisma migrate deploy`
- [ ] Seed with basic data (optional)
- [ ] Setup daily backups (Render automatic)
- [ ] Test connection from production server

### 2. Email Service
- [ ] Choose provider: SendGrid, Resend, Mailgun, etc.
- [ ] Create API key
- [ ] Configure sender address (noreply@ctrlaltnews.com)
- [ ] Test transactional email (welcome, notifications)
- [ ] Setup webhook for bounce/complaint handling

### 3. Authentication
- [ ] Generate JWT secrets (use `openssl rand -base64 32`)
- [ ] Get Google OAuth credentials from Google Cloud Console
- [ ] Add production domain to Google OAuth approved redirect URIs
- [ ] Test login flow end-to-end

### 4. Analytics & Monitoring
- [ ] Setup Google Analytics 4 property
- [ ] Setup Sentry error tracking
- [ ] Configure log aggregation (Render provides basic logs)
- [ ] Setup uptime monitoring (Pingdom, UptimeRobot, etc.)

### 5. Environment Variables
- [ ] Add all vars to Render dashboard (Settings → Environment)
- [ ] Use Render secrets manager for sensitive values
- [ ] Verify no hardcoded secrets in code
- [ ] Test that server starts with all vars set

---

## Security Checklist

- [ ] No secrets in version control (check .gitignore)
- [ ] JWT secrets are random and secure
- [ ] API keys rotated before launch
- [ ] HTTPS/SSL certificate auto-provisioned by Render
- [ ] CORS configured for production domain only
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Rate limiting active (100 req/min default)
- [ ] Database backups tested and verified

---

## Monitoring Setup

### Error Tracking
```bash
# Sentry for error monitoring
ERROR_TRACKING: Sentry (free tier sufficient for MVP)
ALERT_THRESHOLD: Any error in production
NOTIFICATION: Email to regis649@googlemail.com
```

### Performance Monitoring
```bash
# Basic monitoring via Render logs + Google Analytics
METRICS_TO_WATCH:
- API response time (target < 200ms)
- Database query time (target < 100ms)
- Server uptime (target 99.5%+)
- Error rate (target < 0.1%)
```

### Health Checks
```bash
GET /health
# Expected response: { status: "ok", timestamp: "...", uptime: "..." }
# Render runs health checks automatically
```

---

## Database Backup Strategy

**Automated by Render**:
- Daily backups to S3
- 7-day retention
- Point-in-time recovery available

**Manual Backup (before launch)**:
```bash
# Local backup
pg_dump postgresql://user:pass@prod-db:5432/ctrlaltnewsdb > backup-2026-09-26.sql

# Verify restore works
createdb test_restore
psql test_restore < backup-2026-09-26.sql
# Test queries...
dropdb test_restore
```

---

## Pre-Launch Environment Test

**Run this checklist 12 hours before launch:**

```bash
# 1. Connect to production database
psql $DATABASE_URL -c "SELECT version();"

# 2. Verify migrations applied
psql $DATABASE_URL -c "SELECT version FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"

# 3. Test email service
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $EMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"regis649@googlemail.com"}]}],"from":{"email":"noreply@ctrlaltnews.com"},"subject":"Production Test","content":[{"type":"text/plain","value":"Test email"}]}'

# 4. Test OAuth redirect URI
curl https://ctrl-alt-news-portal.onrender.com/auth/google/callback?code=test_code

# 5. Check all environment variables
node -e "console.log(process.env)" | grep -E "DATABASE_URL|JWT_SECRET|GOOGLE_OAUTH"

# 6. Verify health endpoint
curl https://ctrl-alt-news-portal.onrender.com/health
```

---

## Launch Day Procedure

**4 hours before launch** (10:00 UTC for 14:00 launch):
1. [ ] Final database backup
2. [ ] Verify all env vars set correctly
3. [ ] Run pre-launch test (above)
4. [ ] Check monitoring dashboards live
5. [ ] Alert on-call team

**At launch time** (14:00 UTC):
1. [ ] Render deploy production (git push or manual)
2. [ ] Monitor server startup (check logs)
3. [ ] Smoke test critical path
4. [ ] Announce launch to users (if applicable)

---

## Rollback Procedure (If Needed)

**If production fails (< 5 min to decide)**:

1. Check Render dashboard "Previous Deploy"
2. Click "Revert to Previous"
3. Wait 2 min for restart
4. Test health endpoint
5. Verify critical path works

**If database corruption**:
1. Stop production server
2. Restore from backup (point-in-time)
3. Verify data integrity
4. Restart server
5. Monitor for issues

---

## Post-Launch (Week 1)

- Monitor error rates (target < 0.1%)
- Check database performance
- Review user feedback
- Monitor server uptime (target 99.5%+)
- Plan Week 2 optimizations (Redis, advanced analytics)

---

*Environment setup by Gage (DevOps)*  
*Status: Ready for configuration* ✅
