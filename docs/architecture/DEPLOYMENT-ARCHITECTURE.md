# Deployment Architecture — Development, Staging, Production
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Ready for Implementation  
**Platform**: Railway.app

---

## Deployment Strategy

Three-tier deployment:
1. **Development** (local): Vite + local PostgreSQL
2. **Staging** (Railway): Full integration testing
3. **Production** (Railway): User-facing, monitored

---

## 1. Development Environment

### Local Setup

```bash
# Clone and install
git clone https://github.com/ctrl-alt-news/portal.git
cd portal
npm install

# Setup environment
cp .env.example .env
# Edit .env with local values:
# DATABASE_URL=postgresql://user:pass@localhost:5432/ctrl_alt_news_dev
# JWT_SECRET=dev-secret-key-here
# NODE_ENV=development
```

### PostgreSQL (Local)

**Option A: Docker**
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Verify connection
psql postgresql://user:pass@localhost:5432/ctrl_alt_news_dev
```

**Option B: Installed locally**
```bash
# Create database
createdb ctrl_alt_news_dev

# Run migrations
npx prisma migrate dev
```

### Development Server

```bash
# Terminal 1: Frontend (Vite)
npm run dev

# Terminal 2: Backend (Node.js)
npm run server:dev

# Access
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# API: http://localhost:3001/api/v1
```

### Hot Reload

Both Vite and `ts-node-dev` support file watching:
- Vite: Auto-reload on client changes
- ts-node-dev: Auto-restart on server changes
- Database: Manual migration with `npx prisma migrate dev`

---

## 2. Staging Environment (Railway)

### Railway Project Setup

1. **Create Railway project**:
   - Go to [railway.app](https://railway.app)
   - "New Project" → "Deploy from GitHub"
   - Connect to `ctrl-alt-news/portal` repository
   - Select `staging` branch

2. **Add PostgreSQL service**:
   - Click "Add Service" → PostgreSQL
   - Railway auto-creates database
   - Copy `DATABASE_URL` (starts with `postgresql://`)

3. **Add Redis service** (optional for Sprint 4):
   - Click "Add Service" → Redis
   - Copy `REDIS_URL`

4. **Configure environment**:
   - Go to project → Variables
   - Add:
     ```
     NODE_ENV=staging
     JWT_SECRET=staging-secret-key-here
     JWT_REFRESH_SECRET=staging-refresh-secret
     DATABASE_URL=<from PostgreSQL service>
     REDIS_URL=<from Redis service>
     FRONTEND_URL=https://staging-ctrlaltnews.railway.app
     ```

### Staging Deployment

**Automatic** (on push to `staging` branch):
```bash
# Local development
git checkout -b feature/new-feature
# Make changes...
git add .
git commit -m "feat: new feature"

# Push to staging for testing
git push origin feature/new-feature:staging

# Railway automatically:
# 1. Builds Docker image
# 2. Runs tests
# 3. Deploys to staging
# 4. Runs database migrations
# 5. Monitors health

# View logs
railway logs
```

### Staging Testing Checklist

- [ ] Frontend loads without errors
- [ ] All API endpoints respond
- [ ] Database migrations applied
- [ ] Authentication flow works (email + Google)
- [ ] Comment creation works
- [ ] Search functionality works
- [ ] Admin dashboard accessible
- [ ] Error tracking (Sentry) working

---

## 3. Production Environment (Railway)

### Production Railway Setup

1. **Create separate Railway project**:
   - New project for production
   - Connect to `main` branch only

2. **Add PostgreSQL service**:
   - Production database (separate from staging)
   - Daily backups enabled

3. **Configure environment**:
   ```
   NODE_ENV=production
   JWT_SECRET=production-secret-key-here (unique!)
   JWT_REFRESH_SECRET=production-refresh-secret (unique!)
   DATABASE_URL=<production PostgreSQL>
   REDIS_URL=<production Redis>
   FRONTEND_URL=https://ctrlaltnews.io
   GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
   SENTRY_DSN=<from Sentry project>
   ```

### Production Deployment Process

**Manual promotion** (safer than auto-deploy):

```bash
# 1. Merge PR to main
git checkout main
git pull
# Verify tests pass in CI/CD

# 2. Tag release
git tag v1.0.0
git push origin v1.0.0

# 3. Railway detects tag and deploys
# OR manually trigger deploy in Railway dashboard
# Click "Deploy" on production service

# 4. Monitor deployment
# - Check Railway logs for errors
# - Monitor Sentry for exceptions
# - Check /health endpoint
# - Monitor database performance

# 5. Smoke test
curl https://ctrlaltnews.io/api/v1/health
# Should return { status: "ok" }
```

### Blue-Green Deployment (Zero Downtime)

```bash
# Railway automatically handles this:
# 1. New version (green) starts in background
# 2. Health checks verify new version is ready
# 3. Traffic switches from old (blue) to new
# 4. Old version kept running for quick rollback

# If needed, manual rollback:
# Railway dashboard → Deployments → Click previous version → "Redeploy"
```

### Automated Rollback

If health checks fail:
```typescript
// server/index.ts
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    checks: {
      database: 'ok',
      redis: 'ok'
    }
  };
  
  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    health.status = 'error';
    health.checks.database = 'error';
    return res.status(503).json(health); // 503 = Service Unavailable
  }
  
  res.json(health);
});
```

Railway monitors health endpoint every 30s. Three consecutive 503s = automatic rollback.

---

## 4. Database Migrations

### Development Migrations

```bash
# Make schema changes to prisma/schema.prisma
# Create migration
npx prisma migrate dev --name add_new_field

# This:
# - Creates prisma/migrations/{timestamp}_add_new_field/migration.sql
# - Applies migration to local database
# - Generates updated Prisma Client

# Test locally
npm run test

# Commit
git add prisma/
git commit -m "chore: add new field to articles schema"
```

### Staging/Production Migrations

```bash
# When deploying to staging/production, Railway runs:
# npx prisma migrate deploy

# This:
# - Reads migrations from prisma/migrations/ folder
# - Applies any unapplied migrations in order
# - Updates _prisma_migrations table
# - Never rollback (migrations are version controlled)

# Check migration status
npx prisma migrate status
# Output: Pending migrations (if any)

# Dry-run migration
npx prisma migrate dry-run
# Output: SQL that would be executed (doesn't apply)
```

### Rollback Strategy

If migration breaks production:

**Option 1: Create a reverse migration**
```bash
# Create reverse migration
npx prisma migrate dev --name revert_broken_migration

# Edit the migration file to UNDO the bad change
# Example: if you added a NOT NULL column without default:
# DROP COLUMN new_column;

# Commit and push
git commit -am "fix: revert broken migration"
git push origin main

# Railway auto-deploys and runs the reverse migration
```

**Option 2: Data migration script**
```typescript
// scripts/migrate-fix.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix data that broke due to migration
  await prisma.article.updateMany({
    where: { status: null },
    data: { status: 'DRAFT' }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 5. Environment Management

### Environment Variables by Tier

**Development (`.env`)**:
```
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ctrl_alt_news_dev
JWT_SECRET=dev-secret-only-for-local
FRONTEND_URL=http://localhost:5173
```

**Staging (Railway Variables)**:
```
NODE_ENV=staging
DATABASE_URL=postgresql://...@staging.railway.internal/...
JWT_SECRET=<random-secure-secret>
FRONTEND_URL=https://staging-ctrlaltnews.railway.app
SENTRY_DSN=https://<key>@sentry.io/<project>
```

**Production (Railway Variables)**:
```
NODE_ENV=production
DATABASE_URL=postgresql://...@production.railway.internal/...
JWT_SECRET=<different-random-secure-secret>
FRONTEND_URL=https://ctrlaltnews.io
SENTRY_DSN=https://<key>@sentry.io/<project>
GOOGLE_CLIENT_SECRET=<actual-secret>
```

### Secret Rotation

**Every 90 days** (or if compromised):
```bash
# Generate new JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a7f8d2e1c4b9a3f5...

# Update Railway Variables
# JWT_SECRET = new-value

# Apps automatically restart and pick up new secret
# Old tokens become invalid (users re-login)
```

---

## 6. Monitoring & Alerting

### Health Dashboard

Monitor at: `https://status.ctrlaltnews.io` (or Railway dashboard)

**Key metrics**:
- Uptime (target: 99.9%)
- Response time (p95)
- Error rate (< 0.1%)
- Database connection pool usage

### Sentry Integration

```typescript
// server/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions (reduce cost)
});

app.use(Sentry.Handlers.requestHandler());

// Error handling
app.use((err, req, res, next) => {
  Sentry.captureException(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use(Sentry.Handlers.errorHandler());
```

**Alerts** (Sentry):
- New error pattern
- Error rate spike (> 5% of requests)
- Performance regression (> 50% slower)

### Railway Monitoring

Via Railway dashboard:
- CPU/Memory usage
- Network I/O
- Database connection count
- Deployment history

Set alerts for:
- Memory > 80% (might OOM)
- CPU > 80% for > 5 min (scaling needed)
- Error rate > 1%

---

## 7. Disaster Recovery

### Backup Strategy

**PostgreSQL Backups** (Railway):
- Automatic daily backups (7-day retention)
- Access via Railway dashboard → Backups
- Manual backup: `pg_dump postgresql://... > backup.sql`

**Restore from backup**:
```bash
# If production database corrupted
# 1. Go to Railway Backups
# 2. Click backup → "Restore"
# 3. Confirm (data after backup will be lost)
# 4. App auto-restarts with restored database

# Manual restore
psql postgresql://... < backup.sql
```

### Incident Response

**Database down**:
1. Check `/health` endpoint → `database: error`
2. Check Railway Backups → restore if corrupted
3. Check PostgreSQL logs for errors
4. If recovery takes > 1 hour, use cached data (if available)

**API repeatedly crashing**:
1. Railway auto-restarts on crash
2. Check Sentry for error pattern
3. Rollback to previous version if needed: Railway Dashboard → Deployments
4. Communicate status on status page

**Performance degradation**:
1. Check database query performance (EXPLAIN ANALYZE)
2. Look for missing indexes
3. Check cache hit rates (if Redis enabled)
4. May need to scale vertically (larger Railway plan)

---

## 8. CI/CD Pipeline (GitHub Actions)

### Automated Tests (on every push)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Auto-Deploy to Staging

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Railway auto-deploys on git push
      # (no manual action needed, webhook from Railway)
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployed'
```

### Manual Deploy to Production

```bash
# Only admins can manually deploy to production
# Via Railway dashboard → Deployments → Deploy
```

---

## 9. Deployment Checklist

### Before Deploying to Staging

- [ ] All tests pass (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] TypeScript clean (`npm run check`)
- [ ] Bundle size acceptable (`npm run build`)
- [ ] Database migrations reversible
- [ ] Environment variables in `.env.example` updated
- [ ] Code reviewed and approved

### Before Deploying to Production

- [ ] Tested in staging for 24+ hours
- [ ] All critical user paths tested
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Status page prepared
- [ ] Monitoring alerts active
- [ ] Stakeholders notified
- [ ] Off-hours or low-traffic window scheduled

### Post-Deployment Validation

- [ ] Health check passes: `curl /health`
- [ ] API responses < target latency
- [ ] Error rate < 0.1%
- [ ] No new Sentry errors
- [ ] Database migrations applied
- [ ] Users can login and access articles
- [ ] Admin dashboard functional

---

## 10. Scaling Strategy

### Vertical Scaling (Current)

Railway plan tiers (as traffic grows):

| Plan | CPU | Memory | Suitable for |
|------|-----|--------|-------------|
| Starter | 0.5 | 512MB | < 100 concurrent |
| Pro | 1 | 1GB | 100-500 concurrent |
| Business | 2 | 2GB | 500-2K concurrent |

Upgrade when:
- Memory usage consistently > 80%
- CPU throttling (Railway logs show "exceeded quota")
- Response times degrade

### Horizontal Scaling (Post-MVP)

Multiple instances behind load balancer:

```
┌─────────────────────────────┐
│    Load Balancer (Nginx)    │
└──────────┬────────────────┬─┘
           │                │
      ┌────▼──┐        ┌────▼──┐
      │App 1  │        │App 2  │
      │Node   │        │Node   │
      └────┬──┘        └────┬──┘
           │                │
           └────────┬───────┘
                    │
            ┌───────▼────────┐
            │  PostgreSQL    │
            │ (Shared DB)    │
            └────────────────┘
```

Railway handles this automatically via "Replicas" feature.

---

**Document Version**: 1.0  
**Ready for**: Sprint 1+ (Ongoing)  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
