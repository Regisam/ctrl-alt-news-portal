# Troubleshooting Guide — Common Testing Issues

## Tests Pass Locally but Fail in CI

### Cause
Environment differences: Node version, npm cache, OS-specific behavior, timing issues.

### Solutions

1. **Check Node Version**
   ```bash
   node --version  # CI uses Node 20
   nvm use 20
   npm ci && npm run test
   ```

2. **Reproduce CI Environment**
   ```bash
   act pull_request  # Run GitHub Actions locally
   ```

3. **Check for OS-Specific Code**
   ```bash
   # Windows uses \ in paths, Linux/Mac use /
   const path = require('path');
   const validPath = path.join('folder', 'file'); // ✅ Cross-platform
   ```

4. **Remove Hardcoded Timeouts**
   ```typescript
   // ❌ Flaky in CI (slower than local)
   await new Promise(r => setTimeout(r, 500));

   // ✅ Wait for actual condition
   await waitFor(() => expect(element).toBeInTheDocument());
   ```

---

## E2E Tests Timing Out in CI

### Cause
CI runners are slower than local machines. Tests need intelligent waits, not hardcoded delays.

### Solutions

1. **Increase Timeout**
   ```typescript
   // playwright.config.ts
   timeout: 60000,  // 60 seconds instead of 30
   ```

2. **Use Proper Wait Strategies**
   ```typescript
   // ❌ Bad
   await page.waitForTimeout(2000);

   // ✅ Good
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="loaded"]');
   ```

3. **Check for Flaky Tests**
   ```bash
   npm run test:e2e -- --repeat-each=3  # Run 3 times
   ```

4. **Debug Failed Tests**
   - Download artifacts from GitHub Actions
   - Check screenshots/videos in `playwright-report/`

---

## Flaky Tests (Random Failures)

### Cause
Race conditions, timing assumptions, external dependencies.

### Solutions

1. **Avoid Hardcoded Waits**
   ```typescript
   // ❌ Flaky
   await page.click('button');
   const count = await page.locator('div').count();

   // ✅ Stable
   await page.click('button');
   await page.waitForSelector('div');
   const count = await page.locator('div').count();
   ```

2. **Use Proper Async Handling**
   ```typescript
   // ❌ Race condition
   const { result } = renderHook(() => useFetch());
   expect(result.current.data).toBeDefined();

   // ✅ Wait for async operation
   const { result } = renderHook(() => useFetch());
   await waitFor(() => {
     expect(result.current.data).toBeDefined();
   });
   ```

3. **Isolate External Calls**
   ```typescript
   // Mock random values if test depends on them
   vi.spyOn(Math, 'random').mockReturnValue(0.5);
   ```

---

## Coverage Report Not Generating

### Cause
Missing coverage configuration or npm script.

### Solutions

1. **Verify npm Script**
   ```json
   {
     "scripts": {
       "test:coverage": "vitest run --coverage"
     }
   }
   ```

2. **Check vitest.config.ts**
   ```typescript
   coverage: {
     provider: 'v8',
     reporter: ['html', 'json', 'text'],
     reportsDirectory: './coverage',
   }
   ```

3. **Run Coverage Report**
   ```bash
   npm run test:coverage
   open coverage/index.html  # View HTML report
   ```

4. **Check Coverage Threshold**
   ```bash
   npx nyc check-coverage --lines 60
   ```

---

## Coverage Below Threshold

### Cause
New code without tests or insufficient test coverage.

### Solutions

1. **Identify Gaps**
   ```bash
   npm run test:coverage  # Open coverage/index.html
   # Red lines = uncovered code
   ```

2. **Add Tests**
   - Find uncovered functions in the HTML report
   - Write tests for those functions
   - Re-run coverage

3. **Temporary Override** (not recommended)
   ```json
   {
     "coverageThreshold": {
       "global": { "lines": 50 }  // Lowered temporarily
     }
   }
   ```

---

## Tests Fail with "Module Not Found"

### Cause
Incorrect path aliases or missing files.

### Solutions

1. **Check Path Aliases**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@/*": ["client/src/*"],
         "@shared/*": ["shared/*"]
       }
     }
   }
   ```

2. **Verify File Exists**
   ```bash
   ls -la client/src/components/Button.tsx
   ```

3. **Clear Cache**
   ```bash
   rm -rf node_modules/.vite
   npm run test
   ```

---

## Mock Not Working

### Cause
Mock not set up before import, or mock path incorrect.

### Solutions

1. **Mock Before Import**
   ```typescript
   // ✅ Correct — mock before component import
   vi.mock('./api');

   import { fetchUser } from './component';

   // ❌ Wrong — mock after import
   import { fetchUser } from './component';
   vi.mock('./api');
   ```

2. **Use Correct Path**
   ```typescript
   // ✅ Mock the source, not the compiled version
   vi.mock('../../server/services/email');

   // ❌ Don't mock dist/
   vi.mock('../../dist/services/email');
   ```

3. **Verify Mock is Called**
   ```typescript
   const mockFetch = vi.fn().mockResolvedValue({ ok: true });
   console.log(mockFetch.mock.calls); // See actual calls
   ```

---

## Tests Timeout in Hook

### Cause
Hook not completing async operation, or missing `await waitFor`.

### Solutions

1. **Wait for Hook State Update**
   ```typescript
   // ❌ Hook still loading
   const { result } = renderHook(() => useFetchData());
   expect(result.current.data).toBeDefined(); // Fails

   // ✅ Wait for hook to load
   const { result } = renderHook(() => useFetchData());
   await waitFor(() => {
     expect(result.current.data).toBeDefined();
   });
   ```

2. **Check useEffect Dependency Array**
   ```typescript
   // Make sure effect runs
   useEffect(() => {
     setData(fetch(...));
   }, []);  // Empty dependency array = runs once
   ```

---

## Browser Console Errors in E2E

### Solutions

1. **Listen for Errors**
   ```typescript
   page.on('console', msg => console.log('PAGE LOG:', msg.text()));
   page.on('pageerror', err => console.error('PAGE ERROR:', err));
   ```

2. **Screenshot on Error**
   ```typescript
   test('should not have console errors', async ({ page }) => {
     const errors: string[] = [];
     page.on('console', msg => {
       if (msg.type() === 'error') errors.push(msg.text());
     });

     await page.goto('http://localhost:3000');
     await page.screenshot({ path: 'screenshot.png' });

     expect(errors).toHaveLength(0);
   });
   ```

---

*Last Updated: 2026-04-24*
