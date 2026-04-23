# CI/CD Pipeline Runbook

## Overview

This document describes the CI/CD pipeline for Ctrl Alt News portal. The pipeline enforces quality gates, automates testing, builds, and deployment.

## Pipeline Architecture

### CI Pipeline (`.github/workflows/ci.yml`)

Runs automatically on every push to `main` and pull requests:

1. **Lint Check** — ESLint validation on client code
2. **TypeScript Check** — Strict mode type checking
3. **Unit Tests** — Vitest test suite execution
4. **Production Build** — Vite + esbuild compilation
5. **Artifact Upload** — Store dist/ folder for 5 days

**All steps must PASS before deployment is possible.**

### Deploy Pipeline (`.github/workflows/deploy.yml`)

Manual workflow dispatch with environment selection:

- **Staging**: Automatic deployment on main branch push
- **Production**: Manual trigger via GitHub Actions UI
- **Health Checks**: Verify deployment success
- **Notifications**: Slack/email alerts on build failure

## Environment Variables

Set these in GitHub Secrets for deployments to work:

| Variable | Description | Required |
|----------|-------------|----------|
| `DEPLOY_URL` | Application URL for health checks | Yes |
| `API_KEY` | API authentication key | Yes |
| `DB_URL` | Database connection string | Yes |
| `SLACK_WEBHOOK` | Slack webhook for notifications | No |

**How to set secrets:**
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each variable from the table above

## Health Check Endpoints

After deployment, the application exposes three health check endpoints:

### GET `/health`
Returns basic status and uptime:
```json
{
  "status": "ok",
  "timestamp": "2026-04-23T12:00:00.000Z",
  "uptime": 123.45
}
```

### GET `/status`
Returns deployment information:
```json
{
  "environment": "production",
  "version": "1.0.0",
  "buildId": "abc123",
  "timestamp": "2026-04-23T12:00:00.000Z"
}
```

### GET `/version`
Returns version details:
```json
{
  "version": "1.0.0",
  "buildId": "abc123",
  "buildDate": "2026-04-23T12:00:00.000Z"
}
```

## Rollback Procedure

To rollback a deployment:

```bash
./scripts/rollback.sh production
```

This script:
1. Reverts to the previous commit
2. Pushes the revert to main
3. Triggers the deploy workflow automatically

**Rollback time target: < 2 minutes**

## Deployment Steps

### Automatic Staging Deployment

Every push to `main` triggers staging deployment automatically:

1. Code pushed to main
2. CI pipeline runs (lint, test, build)
3. If CI passes, deploy pipeline runs for staging
4. Health checks verify deployment
5. Slack notification sent on success/failure

### Manual Production Deployment

To deploy to production:

1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy" workflow
4. Click "Run workflow"
5. Select "production" from dropdown
6. Click "Run workflow"
7. Wait for workflow to complete (~5 minutes)
8. Check Slack for deployment notification

## Troubleshooting

### CI Pipeline Fails

**Problem**: Lint or test failures block deployment

**Solution**:
1. Check GitHub Actions logs for error details
2. Run locally: `npm run lint:fix && npm run test`
3. Fix issues and push again
4. CI will re-run automatically

### Deployment Fails

**Problem**: Health checks fail after deployment

**Solution**:
1. Check GitHub Actions logs
2. Verify environment variables in GitHub Secrets
3. Check application logs on server
4. Run rollback: `./scripts/rollback.sh production`
5. Investigate root cause before retrying

### Health Check Timeouts

**Problem**: Health check endpoint is unreachable

**Solution**:
1. Verify `DEPLOY_URL` is correct in GitHub Secrets
2. Ensure application server is running
3. Test endpoint manually: `curl https://<DEPLOY_URL>/health`
4. Check server firewall/security groups

## Performance Targets

- **Build time**: < 5 minutes (total CI + artifact upload)
- **Deployment time**: < 5 minutes (staging and production)
- **Rollback time**: < 2 minutes

Current performance dashboard: Monitor in GitHub Actions workflow runs.

## Best Practices

1. **Always push to feature branches first** — Never push directly to main
2. **Ensure local tests pass** — Run `npm run test` before pushing
3. **Review code changes** — Use pull requests for peer review
4. **Monitor deployments** — Watch GitHub Actions during deployment
5. **Test health checks** — Verify endpoints respond after deployment
6. **Document environment changes** — Update `.env.example` when adding secrets

## Related Documentation

- [GitHub Actions Workflow](../../.github/workflows/ci.yml)
- [Deployment Workflow](../../.github/workflows/deploy.yml)
- [Rollback Script](../../scripts/rollback.sh)
- [Health Check Implementation](../../server/health.ts)
