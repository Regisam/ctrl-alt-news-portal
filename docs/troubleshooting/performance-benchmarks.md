# Performance Benchmarks — Testing Speed Reference

## Target Timings

| Test Type | Target | Actual |
|-----------|--------|--------|
| **Unit Tests** | <2 sec (100+ tests) | ~1.5 sec ✅ |
| **Integration Tests** | <3 sec (30+ tests) | ~2.2 sec ✅ |
| **E2E Tests** | <8 min (chromium, firefox, webkit) | ~7 min ✅ |
| **Full CI/CD Pipeline** | <15 min | ~10 min ✅ |

## Typical Execution Times

### Local Development

```
Setup (install deps, cache):  45 sec
Linting (ESLint):             10 sec
Type checking (TypeScript):   15 sec
Unit tests (Vitest):          1.5 sec
Integration tests:            2.2 sec
E2E tests (Playwright):       7 min
─────────────────────────────────
Total:                        ~10 min
```

### GitHub Actions CI

```
Checkout & setup:             30 sec
Node setup & npm cache:       45 sec
Dependencies install:         30 sec
Lint:                         10 sec
Type check:                   15 sec
Unit + Integration tests:     3.7 sec
E2E tests (parallel):         8 min
Coverage report:              1 min
Upload artifacts:             2 min
─────────────────────────────────
Total:                        ~13-14 min
```

## Optimization Tips

### Speed Up Test Execution

1. **Parallel Execution** (default)
   - Vitest runs tests in parallel
   - Each test file runs in separate worker

2. **Cache Dependencies**
   ```yaml
   # .github/workflows/test.yml
   - uses: actions/setup-node@v4
     with:
       cache: 'npm'  # Cache node_modules
   ```

3. **Skip Unnecessary Tests**
   ```bash
   npm run test -- --grep "not slow"  # Skip tests
   npm run test -- --exclude "**/slow.test.ts"
   ```

4. **Use Selective Testing**
   ```bash
   npm run test -- --changed  # Only changed files
   ```

## Monitoring Performance

### Track Over Time

```bash
npm run test -- --reporter=verbose 2>&1 | grep "passed"
```

### Identify Slow Tests

```typescript
// Vitest plugin to report slow tests
test.bench('my benchmark', () => {
  // This will report execution time
});
```

---

*Last Updated: 2026-04-24*
