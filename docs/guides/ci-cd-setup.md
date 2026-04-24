# CI/CD Setup & Quality Gates Guide

## Overview

This guide explains the GitHub Actions CI/CD workflow that automatically runs tests, checks coverage, and enforces quality gates on every pull request and push to main.

## Workflows

### Main Test Workflow (.github/workflows/test.yml)

Runs on every PR, push to main, and nightly schedule.

**Stages**:

1. **Setup** — Checkout code, setup Node.js, install dependencies
2. **Linting** — Run ESLint to check code style
3. **Type Check** — Run TypeScript to verify types
4. **Unit & Integration Tests** — Run all test suites
5. **E2E Tests** — Run Playwright tests across browsers
6. **Coverage Report** — Generate coverage metrics
7. **Artifact Collection** — Upload test results, screenshots, videos
8. **PR Comments** — Post test summary and coverage to PR
9. **Quality Gate** — Enforce coverage thresholds (must pass before merge)

### Nightly Test Workflow (.github/workflows/nightly-tests.yml)

Scheduled to run every night at 3 AM UTC. Runs E2E tests on all browsers, captures performance metrics, and tracks coverage trends.

## Quality Gates

### Merge Blocking

Merging to main is blocked until:

- ✅ All tests pass (unit, integration, E2E)
- ✅ Linting passes (no style issues)
- ✅ TypeScript type checks pass
- ✅ Coverage meets minimum thresholds:
  - 60% lines of code
  - 60% functions
  - 60% branches
  - 60% statements
- ✅ At least 1 code review approval

### Coverage Thresholds

**Global Thresholds**:
- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

**Critical Path Thresholds** (per-file):
- **client/src**: 70% (UI code)
- **server**: 75% (business logic)

### Automatic Checks

| Check | Pass Criteria | Failure Action |
|-------|---------------|-----------------|
| **Lint** | No style violations | Block PR |
| **Type Check** | All types valid | Block PR |
| **Unit Tests** | All passing | Block PR |
| **Integration Tests** | All passing | Block PR |
| **E2E Tests** | All passing | Block PR |
| **Coverage** | Meets thresholds | Block PR + warn |

## Running Tests Locally (Reproduce CI)

### Option 1: Run tests locally (simplest)

```bash
# Install dependencies
npm ci

# Run entire test suite (all local tests)
npm run test          # Unit + integration (node environment)
npm run test:e2e      # E2E tests (browser)

# Or run specific suites
npm run test          # Vitest (unit + integration)
npm run lint          # ESLint
npm run check         # TypeScript
npm run test:e2e      # Playwright
```

### Option 2: Use Act (reproduce exact CI environment)

Act allows running GitHub Actions workflows locally in Docker.

**Installation**:

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Windows
choco install act
```

**Usage**:

```bash
# Run main test workflow locally
act pull_request

# Run specific job
act -j test

# Run with specific Node version
act -e event.json
```

**Troubleshooting**:

If Act fails with Docker errors:
- Ensure Docker Desktop is running
- Check Docker socket permissions: `docker ps`
- Use `act -b` to build from Docker file instead

## PR Comments & Feedback

### Test Summary Comment

When tests complete, GitHub posts a comment on your PR showing:

```
## Test Results

**Coverage**: 72.3%

| Metric | Coverage |
|--------|----------|
| Lines | 72.3% |
| Statements | 71.8% |
| Functions | 70.1% |
| Branches | 68.5% |

✅ All checks passed
🔗 View full results
```

### Coverage Status

If coverage drops below threshold, you'll see:

```
❌ Coverage: 58.9% (threshold: 60%)
```

Fix by writing more tests or improving existing test coverage.

### Failure Notifications

If any test fails:

```
❌ Tests failed. Check artifacts for screenshots, videos, and trace files.
```

Download artifacts from GitHub Actions to see:
- E2E test videos
- Screenshots of failed states
- Playwright trace files for debugging

## Common Issues & Solutions

### Issue: Tests pass locally but fail in CI

**Cause**: Environment differences (Node version, npm cache, OS)

**Solution**:

1. Check Node.js version in `.github/workflows/test.yml`
2. Reproduce locally with same version: `nvm use 20`
3. Use Act to run in Docker: `act pull_request`
4. Check for environment-dependent code (paths, line endings)

**Example Fix**:

```bash
# CI uses Node 20, but you're using Node 18
nvm install 20
nvm use 20
npm ci && npm run test
```

### Issue: E2E tests timeout in CI

**Cause**: CI runners are slower than local machines

**Solution**:

1. Increase timeout in playwright.config.ts:
   ```typescript
   timeout: 60000,  // 60 seconds instead of 30
   ```

2. Use proper wait strategies (not hardcoded timeouts):
   ```typescript
   await page.waitForLoadState('networkidle');  // ✅ Good
   await page.waitForTimeout(2000);             // ❌ Bad
   ```

3. Check for flaky tests by running 3x locally:
   ```bash
   npm run test:e2e -- --repeat-each=3
   ```

### Issue: Coverage report not generating

**Cause**: `npm run test:coverage` missing or misconfigured

**Solution**:

1. Verify npm script exists in package.json:
   ```json
   "test:coverage": "vitest run --coverage"
   ```

2. Check vitest.config.ts has coverage provider:
   ```typescript
   coverage: {
     provider: 'v8',
     reporter: ['json', 'html']
   }
   ```

3. Run locally to debug:
   ```bash
   npm run test:coverage
   ls -la coverage/  # Should have index.html
   ```

### Issue: Merge button blocked despite passing tests

**Cause**: GitHub branch protection settings or pending checks

**Solution**:

1. Wait for all checks to complete (green checkmarks)
2. Dismiss stale reviews if you pushed new commits
3. Verify you have write permissions on repository
4. Check that required reviewers have approved

## Performance Optimization

### Faster Test Runs

1. **Use npm cache**:
   ```bash
   npm ci --prefer-offline
   ```

2. **Parallel execution** (already configured):
   ```yaml
   strategy:
     matrix:
       node-version: [18, 20]
     max-parallel: 2
   ```

3. **Run only affected tests** (for local development):
   ```bash
   npm run test -- --changed  # Only changed files
   ```

4. **Skip E2E for specific commits**:
   Add `[skip e2e]` to commit message (not recommended for main)

### CI/CD Timing

**Typical execution times**:
- Setup + install: ~30-45 seconds
- Lint: ~10 seconds
- Type check: ~15 seconds
- Unit tests: ~1-2 minutes
- E2E tests: ~3-5 minutes (all browsers)
- Coverage: ~30 seconds
- **Total**: ~5-10 minutes

## Debugging Failed Tests in CI

### Step 1: Download Artifacts

1. Go to GitHub Actions tab on your PR
2. Scroll down to "Artifacts" section
3. Download `test-artifacts-node-20`
4. Extract and open files:
   - `playwright-report/index.html` — E2E test report
   - `test-results/` — JUnit XML results
   - Screenshots and videos

### Step 2: Check Playwright Report

Open the HTML report to see:
- Which test failed
- At which step it failed
- Screenshot of failure
- Video of interaction
- Trace file for debugging

### Step 3: Reproduce Locally

```bash
# Run just the failing test
npm run test:e2e -- --grep "exact test name"

# Or run in headed mode to see browser
npm run test:e2e:headed
```

### Step 4: Use Playwright Inspector

```bash
PWDEBUG=1 npm run test:e2e
```

Opens debugger to step through test execution.

## Monitoring & Analytics

### Coverage Trends

Coverage reports are uploaded to Codecov (optional integration). View trends:

1. Go to codecov.io
2. Connect GitHub repository
3. View coverage over time
4. Get PR feedback on coverage changes

### Test Performance Trends

Nightly workflow captures performance metrics. Monitor:

- E2E test execution time (should be stable)
- Page load times
- Interaction latency
- Flaky test rate

## Branch Protection Rules

### Current Rules

```
Main Branch Protection:
✅ Require status checks (all must pass)
✅ Require code review (1 approval)
✅ Dismiss stale reviews on new commits
✅ Require branches up to date before merge
✅ Include administrators (apply to all)
```

### Modify Rules

1. Go to Settings → Branches
2. Edit protection rule for `main`
3. Check/uncheck required status checks
4. Save changes

**Never disable**:
- ❌ "Require status checks to pass before merging"
- ❌ "Require code review"

These gates prevent untested code from reaching production.

## Continuous Integration Best Practices

### 1. Keep Tests Fast

❌ Avoid:
```typescript
await page.waitForTimeout(2000);  // Hardcoded wait
```

✅ Use:
```typescript
await page.waitForLoadState('networkidle');  // Intelligent wait
```

### 2. Make Tests Deterministic

❌ Flaky:
```typescript
await page.click('button');
const count = await page.locator('div').count();  // May race
```

✅ Stable:
```typescript
await page.click('button');
await page.waitForSelector('div');  // Wait for element
const count = await page.locator('div').count();
```

### 3. Isolate Test Data

❌ Dependent:
```typescript
test('2', () => { /* assumes test 1 created data */ });
test('1', () => { /* creates data */ });
```

✅ Independent:
```typescript
test.beforeEach(async () => {
  // Fresh setup for each test
});

test('1', () => { /* standalone */ });
test('2', () => { /* standalone */ });
```

### 4. Monitor Coverage Trends

Track coverage changes over time:
- Rising coverage = improving code quality
- Falling coverage = new code lacks tests
- Stable coverage = maintaining quality

Set alerts for >5% coverage drops.

## Troubleshooting Checklist

- [ ] Tests pass locally (`npm run test`)
- [ ] E2E tests pass locally (`npm run test:e2e`)
- [ ] No TypeScript errors (`npm run check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Coverage meets minimum threshold (check locally)
- [ ] Try with same Node version as CI (20)
- [ ] Check for environment-dependent code (OS-specific paths)
- [ ] No hardcoded timeouts in tests
- [ ] Screenshots/videos show what failed
- [ ] Trace file shows interaction sequence

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Debugging Guide](https://playwright.dev/docs/debug)
- [Vitest Coverage Configuration](https://vitest.dev/config/#coverage)
- [Act Tool (Run GitHub Actions Locally)](https://github.com/nektos/act)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
