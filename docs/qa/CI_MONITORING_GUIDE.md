# CI Pipeline Monitoring Guide

**Branch**: `feat/story-7-4-e2e-1776983171`  
**Repository**: Regisam/ctrl-alt-news-portal  
**Date Started**: 2026-04-23  

---

## Quick Access

**Direct Link to CI Pipeline:**
```
https://github.com/Regisam/ctrl-alt-news-portal/actions/workflows/ci.yml?query=branch:feat/story-7-4-e2e-1776983171
```

**Or navigate:**
1. Go to: https://github.com/Regisam/ctrl-alt-news-portal
2. Click: **Actions** tab (top)
3. Filter by branch: **feat/story-7-4-e2e-1776983171**
4. Select: **CI Pipeline** workflow

---

## What to Look For

### Stage 1: ✅ Install Dependencies
```
Status: Running or Done
Expected: 30-60 seconds
Success: "npm ci" completes without errors
```

### Stage 2: ✅ Lint Check
```
Status: Running or Done
Expected: 15-30 seconds
Success: "ESLint" shows 0 errors (in new files)
Command: npm run lint
```

### Stage 3: ✅ TypeScript Check
```
Status: Running or Done
Expected: 20-40 seconds
Success: "tsc --noEmit" shows no errors
Command: npm run check
```

### Stage 4: ✅ Unit Tests
```
Status: Running or Done
Expected: 45-90 seconds
Success: All tests PASS, including health endpoint tests
Command: npm run test
Tests included:
  - Health Check Endpoints (7 tests)
  - /health endpoint
  - /status endpoint
  - /version endpoint
```

### Stage 5: ✅ Production Build
```
Status: Running or Done
Expected: 60-120 seconds
Success: "Vite build" and "esbuild" complete
Command: npm run build
Output: dist/ folder created
```

### Stage 6: ✅ Upload Artifacts
```
Status: Running or Done
Expected: 30-60 seconds
Success: "dist" artifact uploaded to GitHub Actions
Retention: 5 days
Access: Available for Deploy workflow
```

---

## Expected Outcome

### ✅ SUCCESS (All Green)
```
✅ Install dependencies — PASS
✅ Lint check — PASS
✅ TypeScript check — PASS
✅ Unit tests — PASS
✅ Production build — PASS
✅ Upload artifacts — PASS

Total Time: 3-5 minutes
Status: READY FOR DEPLOYMENT
```

### ❌ FAILURE (Any Red)
```
❌ One or more stages failed

If failed:
1. Click the failed stage for details
2. Read error message
3. Common fixes:
   - Dependencies: Clear cache, re-install
   - Lint: Run npm run lint:fix locally
   - Tests: Run npm run test locally
   - Build: Run npm run build locally
```

---

## Real-Time Monitoring Tips

### Live Updates
- **GitHub Actions page auto-refreshes**: Just keep page open
- **Timing**: Check status after ~2 minutes (install takes time)
- **Logs**: Click each stage to see detailed logs

### What Each Stage Shows
1. **Job logs**: All commands and output
2. **Timing**: How long each step takes
3. **Errors**: Detailed error messages if failure
4. **Artifacts**: Confirm dist/ uploaded

### Performance Benchmarks
| Stage | Target Time | Actual | Status |
|-------|-------------|--------|--------|
| Install deps | 60s | ? | Monitor |
| Lint check | 30s | ? | Monitor |
| TypeScript | 40s | ? | Monitor |
| Tests | 90s | ? | Monitor |
| Build | 120s | ? | Monitor |
| Upload | 60s | ? | Monitor |
| **TOTAL** | **< 5 min** | ? | Monitor |

---

## Next Actions Based on Result

### ✅ If CI PASSES
→ Proceed to Phase 3: Health Endpoint Validation
→ Command: `bash scripts/e2e-validate.sh https://your-staging-url`

### ❌ If CI FAILS
1. Read error message in GitHub Actions
2. Fix locally:
   ```bash
   npm run lint:fix  # Fix linting
   npm run test      # Fix tests
   npm run build     # Test build
   ```
3. Commit and re-push
4. CI will re-trigger automatically

---

## Keyboard Shortcut

Press **R** on GitHub Actions page to **refresh** live

---

## Current Status

**Branch**: feat/story-7-4-e2e-1776983171  
**Pipeline**: 🟡 Running (check GitHub)  
**Expected Completion**: ~5 minutes from push  

**Check now**: https://github.com/Regisam/ctrl-alt-news-portal/actions

---

Once all stages show ✅, you're ready for Phase 3!
