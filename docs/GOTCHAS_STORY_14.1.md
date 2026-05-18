# Gotchas & Learnings — Story 14.1

**Date**: 2026-05-18  
**Story**: 14.1 — Topic Recommendations Refinement & Serendipity Tuning  
**Phase**: Consolidation (Post-Implementation)

---

## 🚫 GOTCHA #1: React Purity Violations in Render

**Problem**: Calling impure functions (`Math.random()`, `Date.now()`, `new Date()`) inside `useMemo()` or during component render causes ESLint errors and non-deterministic behavior.

**Where It Bit Us**: 
- `TopicRecommendationsMonitoringPage.tsx` lines 33-37
- Generated random values in `useMemo()` for daily chart data
- ESLint error: "Cannot call impure function during render"

**Solution**: Move impure function calls to `useState()` initializer
```typescript
// ❌ WRONG (in useMemo)
const dailyData = useMemo(() => {
  return [{
    date: '2026-05-18',
    value: Math.random() * 100  // Impure! ❌
  }];
}, [dateRange]);

// ✅ RIGHT (in useState initializer)
const [dailyData] = useState(() => {
  return [{
    date: '2026-05-18',
    value: Math.random() * 100  // Impure is OK here ✅
  }];
});
```

**Why It Matters**: React requires render logic to be pure (deterministic). Impure functions can cause:
- Non-deterministic rendering
- Failed ESLint checks
- Production bugs in edge cases

**Prevention**: 
- Always use `useState(() => initValue)` for initializing with side effects
- Never call `Math.random()`, `Date.now()`, API calls in `useMemo()` or render
- ESLint rule: `react-hooks/purity` catches these

**Effort to Fix**: 5 minutes per instance

---

## 🚫 GOTCHA #2: Async Components in Tests — localStorage Mocking

**Problem**: Components with async hooks (that fetch data from localStorage/API) render as `null` on first render, causing tests to fail with "element not found" errors.

**Where It Bit Us**:
- `RecommendationsWidget.test.tsx` — 20+ test failures
- `useDigestAnalytics.test.ts` — localStorage not persisting between tests
- Component returns `null` if `recommendations.length === 0`
- Tests ran before async data loaded

**Root Causes** (2 issues):
1. **Cross-test contamination**: localStorage mock not cleared between tests
2. **Async state initialization**: `useEffect()` loading data asynchronously, tests asserting before state updates

**Solutions**:

### Solution A: Clear localStorage between tests
```typescript
// In setup.ts
afterEach(() => {
  cleanup();
  localStorageMock.clear();  // Clear between tests ✅
});
```

### Solution B: Make async initialization sync
```typescript
// ❌ WRONG (async state update)
useEffect(() => {
  if (digestDate) {
    const loaded = getDigestMetrics(digestDate);
    Promise.resolve().then(() => setMetrics(loaded));  // Async ❌
  }
}, [digestDate]);

// ✅ RIGHT (sync state update)
useEffect(() => {
  if (digestDate) {
    const loaded = getDigestMetrics(digestDate);
    setMetrics(loaded);  // Sync ✅
  }
}, [digestDate]);
```

### Solution C: Use `waitFor()` in tests (for truly async components)
```typescript
// ✅ CORRECT (wait for async render)
it('should render recommendations', async () => {
  render(<RecommendationsWidget />);
  await waitFor(() => {
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
  });
});
```

**Why It Matters**: 
- 36 test failures in Story 14.1 stemmed from this pattern
- Affects any component using `useEffect()` + useState
- Non-deterministic test results

**Prevention**:
- Always clear mocks between tests (`afterEach`)
- Prefer sync initialization in `useState()` over async in `useEffect()`
- For truly async: use `waitFor()` or `act()` in tests
- Create test helper: `renderWithAsync(Component, { timeout: 1000 })`

**Effort to Fix**: 3-5 minutes per test file (if using solution A+B)

---

## 🚫 GOTCHA #3: Type Mismatches — String vs Date in localStorage

**Problem**: JSON stringification converts Dates to ISO strings, but tests expect Date objects. Assertion failures: `"2026-05-13T12:00:00.000Z"` !== `2026-05-13T12:00:00.000Z`

**Where It Bit Us**:
- `useDigestPreferences.test.ts` 
- Saving Date object to localStorage
- localStorage stores only strings (JSON serialized)
- Retrieving gives string, not Date

**Solution**: Be explicit about type conversion
```typescript
// ❌ WRONG (implicit type confusion)
const saved = { lastDigestSent: new Date() };
localStorage.setItem('prefs', JSON.stringify(saved));
const loaded = JSON.parse(localStorage.getItem('prefs'));
expect(loaded.lastDigestSent).toEqual(new Date());  // Fails! ❌

// ✅ RIGHT (explicit conversion)
const saved = { lastDigestSent: new Date().toISOString() };
localStorage.setItem('prefs', JSON.stringify(saved));
const loaded = JSON.parse(localStorage.getItem('prefs'));
expect(loaded.lastDigestSent).toBe('2026-05-13T12:00:00.000Z');  // Passes ✅
```

**Why It Matters**:
- JSON doesn't preserve Date types
- Tests are type-sensitive
- Production code may have same issue if not careful

**Prevention**:
- Always explicitly serialize/deserialize dates: `.toISOString()` on save, `new Date(string)` on load
- Use TypeScript strictly to catch type mismatches
- Create utility: `serializeForStorage(obj)` and `deserializeFromStorage(str)`

**Effort to Fix**: 2 minutes per instance

---

## 📋 Checklist for Future Stories

When implementing features with:
- ✅ Render logic (useMemo, JSX) → Check: no impure functions (Math.random, Date.now, API calls)
- ✅ localStorage mocking in tests → Check: clear mock after each test
- ✅ Async hooks → Check: use waitFor() or make initialization sync
- ✅ Date serialization → Check: explicit toISOString() / new Date() conversions

---

## 🎯 Impact Summary

| Gotcha | Severity | Tests Failed | Fix Time | Prevention |
|--------|----------|--------------|----------|-----------|
| React purity | HIGH | 0 (lint only) | 5 min | Use useState init |
| Async testing | HIGH | 36 tests | 3-5 min/file | Clear mocks, waitFor |
| Type mismatches | MEDIUM | 2 tests | 2 min | Explicit serialization |

---

**Created by**: @dev (Dex) + @qa (Quinn)  
**Session**: Story 14.1 Consolidation Phase  
**For**: Future story developers to learn from
