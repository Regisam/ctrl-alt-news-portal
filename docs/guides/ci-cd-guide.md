# CI/CD Pipeline Guide

## Overview

GitHub Actions automates testing and deployment for Ctrl Alt News Portal.

## Workflows

### 1. Tests & Quality Checks (test.yml)

Runs on every push and pull request:

```
push/PR → TypeScript → Lint → Unit Tests → Integration Tests → Build → E2E Tests
```

**Jobs:**
- **test**: Type checking, linting, unit tests, integration tests, build
- **e2e**: End-to-end tests (Playwright)
- **coverage**: Test coverage report
- **status**: Overall status check

**Requirements:**
- PostgreSQL running (Docker service)
- All tests passing
- Build succeeding

### 2. Deploy (deploy.yml)

Runs on main branch only after tests pass:

```
main push → Build → Deploy to Railway → Notify Slack → (if fail) Rollback
```

**Features:**
- Auto-deploy on main
- Slack notifications
- Rollback on failure
- Previous version restoration

## Setup

### 1. GitHub Secrets

Set these in repository settings → Secrets and variables → Actions:

```
RAILWAY_TOKEN        # Railway API token
SLACK_WEBHOOK_URL    # Slack webhook URL (optional)
```

### 2. Railway Configuration

```bash
# Login to Railway
railway login

# Link project
railway link

# Get token
railway tokens create
```

### 3. Slack Integration (Optional)

```
1. Create Slack app
2. Enable incoming webhooks
3. Copy webhook URL
4. Add SLACK_WEBHOOK_URL secret
```

## Workflow Triggers

### Test Workflow
- **On push**: main, develop branches
- **On PR**: Any PR to main or develop
- **Manual**: Can trigger manually

### Deploy Workflow
- **On push**: main branch only
- **After tests**: If test.yml succeeds
- **Automatic**: No manual trigger needed

## Status Checks

### Required Checks (main branch)

All must pass before merging:
1. Tests & Quality Checks
2. Type checking
3. Linting
4. Build validation

### Optional Checks

- E2E tests
- Coverage reports

## Monitoring

### GitHub UI

```
Actions tab → Workflow runs
```

### Logs

- Click workflow run
- View step logs
- Download artifacts (dist, coverage, playwright-report)

### Notifications

- Email on failure
- Slack (if configured)
- GitHub checks on PR

## Troubleshooting

### Tests Failing Locally but Passing in CI

```bash
# Run exact CI environment
npm run test -- --coverage
npm run test:integration
npm run test:e2e
```

### Database Connection Issues

```
Error: connect ECONNREFUSED
```

**Fix:** Ensure PostgreSQL service is running
- GitHub Actions auto-starts with docker service
- Check DATABASE_URL environment variable

### Deployment Fails

1. Check Railway logs
2. Verify secrets are set
3. Check build output
4. Review deployment logs

## Optimization

### Caching

Workflows use npm cache to speed up installs:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

### Parallel Jobs

Jobs run in parallel:
- test
- e2e
- coverage

Reduces total workflow time.

### Artifacts

Automatically retained:
- **dist/** (7 days) - Production build
- **playwright-report/** (30 days) - E2E results
- **coverage/** (30 days) - Coverage reports

## Production Checklist

Before first production deploy:

- [ ] Set RAILWAY_TOKEN secret
- [ ] Set SLACK_WEBHOOK_URL (optional)
- [ ] Test manual deployment
- [ ] Verify rollback works
- [ ] Confirm notifications working
- [ ] Check Railway environment variables

## Secrets Management

### How Secrets Work

- Encrypted in GitHub
- Only decrypted in Actions
- Never logged
- Can't be read in logs

### Adding Secrets

```
Settings → Secrets and variables → Actions → New repository secret
```

### Using Secrets

```yaml
env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Tips

1. **Keep workflows simple** - One job per workflow
2. **Use matrix for multiple versions** - Test Node 16, 18, 20
3. **Cache dependencies** - Speeds up builds
4. **Limit artifact retention** - Saves storage
5. **Test rollback** - Ensure recovery works
6. **Monitor costs** - GitHub Actions has free minutes

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Railway Docs](https://docs.railway.app)
- [Slack API](https://api.slack.com)
