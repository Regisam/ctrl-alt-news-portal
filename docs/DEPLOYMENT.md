# Deployment Guide — Ctrl Alt News Portal

## 🚀 Deployment to Railway

This guide explains how to deploy Ctrl Alt News Portal to Railway.app with automated GitHub Actions.

---

## Prerequisites

1. **Railway.app account** — Sign up at [railway.app](https://railway.app)
2. **GitHub repository** — This one!
3. **PostgreSQL database** — Set up in Railway or use external provider
4. **Environment variables** — Configured in GitHub Secrets

---

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository (`Regisam/ctrl-alt-news-portal`)
4. Railway will auto-detect Node.js project

---

## Step 2: Create Database

### Option A: Railway PostgreSQL (Recommended)

1. In Railway project, click **Add Service**
2. Select **PostgreSQL**
3. Connect to your Node.js service
4. Copy `DATABASE_URL` from environment variables

### Option B: External Database

If using external PostgreSQL (AWS RDS, Heroku Postgres, etc.):
- Get your connection string: `postgresql://user:password@host:port/dbname`
- Add to Railway environment variables as `DATABASE_URL`

---

## Step 3: Add GitHub Secrets

Add these secrets to your GitHub repository settings (`Settings → Secrets and variables → Actions`):

### **Required Secrets**

| Secret | Value | Example |
|--------|-------|---------|
| `RAILWAY_TOKEN` | Your Railway API token | `pk_railway_...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `DEPLOY_URL` | Your production domain | `https://ctrl-alt-news.up.railway.app` |
| `CORS_ORIGIN` | Frontend URL for CORS | `https://ctrl-alt-news.up.railway.app` |

### **Optional Secrets**

| Secret | Value |
|--------|-------|
| `SLACK_WEBHOOK` | Slack notification webhook (for deployment alerts) |
| `LOKI_URL` | Loki logging server URL (for structured logs) |

---

## Step 4: Get Railway API Token

1. Go to Railway **Account Settings**
2. Click **Tokens**
3. Create new **API Token**
4. Copy the token (starts with `pk_railway_`)
5. Add to GitHub Secrets as `RAILWAY_TOKEN`

---

## Step 5: Configure Environment in Railway

In Railway project settings, add these environment variables:

```yaml
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Database (auto-set if using Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Security & CORS
CORS_ORIGIN=https://your-domain.up.railway.app

# Observability (Optional)
LOKI_URL=https://your-loki-instance.com
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

---

## Step 6: Deploy

### **Automatic Deployment** (Recommended)

Every push to `main` branch will automatically:
1. ✅ Run tests
2. ✅ Build application
3. ✅ Deploy to Railway
4. ✅ Run health checks
5. ✅ Notify Slack (if configured)

### **Manual Deployment**

Trigger deployment manually:

```bash
gh workflow run deploy-railway.yml
```

Or via GitHub UI:
1. Go to **Actions**
2. Select **Deploy to Railway**
3. Click **Run workflow**
4. Select environment: `production`
5. Click **Run workflow**

---

## Step 7: Verify Deployment

### **Check Deployment Status**

```bash
# View latest workflow run
gh run list --workflow=deploy-railway.yml

# View detailed logs
gh run view <run-id> --log
```

### **Test Health Endpoint**

```bash
curl https://your-domain.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-23T10:30:45.123Z",
  "uptime": 3600
}
```

### **Check Production Logs**

```bash
# Via Railway dashboard
# 1. Go to your project
# 2. Select Node.js service
# 3. Click Logs tab

# Or via CLI
railway logs --service ctrl-alt-news-portal-prod
```

---

## Rollback & Recovery

### **If Deployment Fails**

1. **Check logs** — See what went wrong
2. **Fix issue** — Update code, commit, push
3. **Auto re-deploy** — New push triggers workflow again

### **Manual Rollback**

```bash
# Railway automatically keeps previous deployments
# In Railway dashboard:
# 1. Go to Deployments
# 2. Find previous successful deployment
# 3. Click "Revert to this deployment"
```

---

## Database Migrations

### **Before First Deployment**

Run migrations to set up schema:

```bash
# Via Railway CLI
railway run npx prisma migrate deploy

# Or via GitHub Action (automatic in deploy workflow)
# Add to deploy-railway.yml:
# - name: Run migrations
#   run: npx prisma migrate deploy
```

### **After Deployment**

Seed production with initial data (optional):

```bash
railway run npx prisma db seed
```

---

## Monitoring & Alerts

### **Setup Slack Notifications**

1. Create Slack webhook: [api.slack.com/apps](https://api.slack.com/apps)
2. Add to GitHub Secrets as `SLACK_WEBHOOK`
3. Receive alerts on:
   - ✅ Successful deployments
   - ❌ Failed deployments
   - 🚨 Health check failures

### **View Metrics in Railway**

Railway dashboard shows:
- CPU usage
- Memory usage
- Network I/O
- Deployment history
- Live logs

### **Setup Observability**

Configure Loki + Grafana:
1. Deploy Loki stack (Docker Compose or cloud provider)
2. Get Loki URL
3. Add `LOKI_URL` to GitHub Secrets
4. Logs automatically flow to Loki
5. Create Grafana dashboards

---

## Performance Checklist

Before considering deployment complete:

- [ ] Health check passes
- [ ] Database is accessible
- [ ] API endpoints respond (<200ms)
- [ ] Frontend loads (<2.5s LCP)
- [ ] All tests pass
- [ ] No errors in logs
- [ ] Environment variables correct
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Slack notifications working (if configured)

---

## Troubleshooting

### **Deployment Fails at Build Step**

```
Error: npm run build failed
```

**Solutions:**
1. Check logs: `gh run view <run-id> --log`
2. Ensure TypeScript compiles: `npm run check`
3. Ensure tests pass: `npm test`
4. Clear cache: `npm clean-install`

### **Health Check Fails**

```
Error: Health check failed after 30 attempts
```

**Solutions:**
1. Check service is running: `railway logs`
2. Verify DATABASE_URL is correct
3. Check migrations ran: `railway logs | grep migrate`
4. Verify port 8080 is being used

### **Database Connection Fails**

```
Error: connect ECONNREFUSED
```

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running in Railway
3. Verify service is connected to database
4. Run migrations: `railway run npx prisma migrate deploy`

### **Workflow Not Triggering**

**Solutions:**
1. Verify workflow file exists: `.github/workflows/deploy-railway.yml`
2. Verify secrets are set in GitHub
3. Check branch is `main`
4. Manually trigger: `gh workflow run deploy-railway.yml`

---

## Security Best Practices

1. ✅ **Never commit secrets** — Use GitHub Secrets
2. ✅ **Rotate tokens** — Refresh Railway API tokens monthly
3. ✅ **Limit permissions** — Use read-only tokens where possible
4. ✅ **Audit logs** — Monitor who deployed what and when
5. ✅ **Use HTTPS** — Enable SSL certificates (Railway does this by default)
6. ✅ **Environment isolation** — Keep staging and production separate

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **GitHub Actions:** https://docs.github.com/en/actions
- **Prisma Migrations:** https://www.prisma.io/docs/orm/prisma-migrate/workflows
- **Slack API:** https://api.slack.com

---

**Happy deploying! 🚀**

For issues, check logs and troubleshooting section above.
