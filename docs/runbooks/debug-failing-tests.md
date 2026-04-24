# Runbook: Debugging Failing Tests Locally

## Quick Diagnosis

### Step 1: Run Failing Test
```bash
npm run test -- path/to/test.test.ts
```

### Step 2: Read Error Message
Most errors tell you exactly what's wrong:
- `expect(x).toBe(y)` — assertion failed
- `Cannot find module` — import path wrong
- `Timeout` — async operation didn't complete

### Step 3: Identify Test Type

| Error Type | Action |
|-----------|--------|
| Unit test failing | Check test logic and assertions |
| Integration test failing | Check database, mocks, routes |
| E2E test failing | Check page navigation, selectors |

---

## Debugging Techniques

### Add Console Logs
```typescript
it('should do something', () => {
  const result = myFunction(input);
  console.log('Result:', result);  // Debug output
  expect(result).toBe(expected);
});
```

### Run Test in Isolation
```bash
npm run test -- --grep "should do something"
```

### Run Test with Verbose Output
```bash
npm run test -- --reporter=verbose
```

### Debug Mode (Inspector)
```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run -- path/to/test.ts
# Then open chrome://inspect
```

---

## Common Fixes

### Unit Test Failing
```typescript
// ❌ Async not awaited
it('should load data', () => {
  const data = fetchData();  // Promise not awaited
  expect(data).toBeDefined();
});

// ✅ Properly await
it('should load data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Integration Test Failing
```typescript
// ❌ Database not seeded
it('should find user', () => {
  const user = db.findUser(1);  // User doesn't exist
  expect(user).toBeDefined();
});

// ✅ Seed data first
beforeEach(() => {
  db.seed(mockUsers);
});
it('should find user', () => {
  const user = db.findUser(1);
  expect(user).toBeDefined();
});
```

### E2E Test Failing
```typescript
// ❌ Element not found
await page.click('button#save');

// ✅ Wait for element
await page.waitForSelector('button#save');
await page.click('button#save');
```

---

*For more details, see troubleshooting/common-issues.md*
