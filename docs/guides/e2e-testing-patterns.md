# E2E Testing Patterns Guide

**Version:** 1.0  
**Last Updated:** May 18, 2026  
**Audience:** Development Team  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Test Framework](#test-framework)
3. [Page Object Pattern](#page-object-pattern)
4. [Writing Tests](#writing-tests)
5. [Waiting Strategies](#waiting-strategies)
6. [Browser Interactions](#browser-interactions)
7. [Critical User Journeys](#critical-user-journeys)
8. [Best Practices](#best-practices)
9. [Debugging & Troubleshooting](#debugging--troubleshooting)
10. [Performance](#performance)

---

## Introduction

This guide covers the E2E testing patterns and best practices used in the CTRL + ALT News Portal project. Our testing infrastructure uses **Playwright** for browser automation and follows the **Page Object** pattern for maintainability.

### Goals

- **Reliability:** Tests should be stable and not flaky
- **Maintainability:** Tests should be easy to update when UI changes
- **Coverage:** Critical user journeys should be fully tested
- **Performance:** Test suite should complete in <5 minutes
- **Documentation:** Tests serve as living documentation of user flows

---

## Test Framework

### Playwright Setup

**File:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  expect: { timeout: 5000 },
  reporter: ['html', 'list', ...(process.env.CI ? [['github']] : [])],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
```

### Key Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| `testDir` | `./e2e` | Location of test files |
| `timeout` | 30000ms | Default test timeout |
| `expect.timeout` | 5000ms | Assertion timeout |
| `retries` | 2 (CI only) | Retry failed tests in CI |
| `trace` | on-first-retry | Record trace for debugging |
| `screenshot` | only-on-failure | Capture failures only |
| `video` | retain-on-failure | Record video of failures |

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed

# Debug mode with step-by-step execution
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/home.spec.ts

# Run specific test
npx playwright test -g "should load home page"
```

---

## Page Object Pattern

The **Page Object Pattern** is a design pattern that encapsulates page elements and interactions into reusable classes, making tests more maintainable and reducing duplication.

### Structure

```
e2e/fixtures/
├── base.page.ts              # Base class for all pages
├── home.page.ts              # Home page object
├── article.page.ts           # Article detail page
├── category.page.ts          # Category browsing page
├── search.page.ts            # Search results page
├── topic-recommendations.page.ts  # Topic recommendations dashboard
└── real-time-feed.page.ts    # Real-time feed page
```

### Base Page Class

**File:** `e2e/fixtures/base.page.ts`

```typescript
import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  // Common interactions
  async click(selector: string) {
    await this.page.click(selector);
  }

  async fill(selector: string, text: string) {
    await this.page.fill(selector, text);
  }

  // Utilities
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  async getText(selector: string): Promise<string | null> {
    return await this.page.locator(selector).textContent();
  }

  // Waiting strategies
  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
    await this.page.waitForLoadState(state);
  }
}
```

### Creating a Page Object

**Example:** `e2e/fixtures/home.page.ts`

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  // Define selectors as class properties
  readonly articleCards = '[data-testid="article-card"]';
  readonly header = 'header';

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async navigateToHome() {
    await this.goto('/');
  }

  // Interactions
  async isHeaderVisible(): Promise<boolean> {
    return await this.isVisible(this.header);
  }

  async getArticleCount(): Promise<number> {
    const articles = this.page.locator('article, [role="article"]');
    return await articles.count();
  }

  async clickFirstArticle() {
    const firstArticle = this.page.locator('article').first();
    await firstArticle.click();
    await this.waitForLoadState('networkidle');
  }

  // Waiters
  async waitForArticlesToLoad() {
    await this.page.waitForSelector('article', { timeout: 10000 });
    await this.waitForLoadState('networkidle');
  }
}
```

### Best Practices

✅ **DO:**
- Keep selectors in class properties
- Use descriptive method names
- Extend `BasePage` for common functionality
- Use TypeScript for type safety
- Keep page objects focused on a single page

❌ **DON'T:**
- Hardcode selectors in test files
- Put test logic in page objects
- Create huge page objects with 100+ methods
- Expose `page` property directly to tests

---

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  // Setup: runs before each test
  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHome();
  });

  // Test: single behavior verification
  test('should display articles', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    const count = await homePage.getArticleCount();
    expect(count).toBeGreaterThan(0);
  });

  // Test: user interaction flow
  test('should navigate to article on click', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const url = await page.url();
    expect(url).toContain('/article/');
  });
});
```

### Test Naming

Use descriptive names that explain what the test does:

```typescript
// ✅ Good - describes the behavior being tested
test('should load home page and display header');
test('should filter articles by category');
test('should show error message for invalid search');

// ❌ Bad - vague or implementation-specific
test('homepage test');
test('click button');
test('API call works');
```

### Arrange-Act-Assert Pattern

```typescript
test('should display search results', async ({ page }) => {
  // ARRANGE: Set up initial state
  const searchPage = new SearchPage(page);
  await searchPage.navigateToSearch();

  // ACT: Perform user action
  await searchPage.performSearch('AI');

  // ASSERT: Verify expected result
  const results = await searchPage.getSearchResults();
  expect(results.length).toBeGreaterThan(0);
});
```

---

## Waiting Strategies

The most common source of flaky tests is **timing issues**. Playwright provides multiple waiting strategies:

### 1. Waiting for Page Load

```typescript
// Wait for network to be idle (all requests complete)
await page.waitForLoadState('networkidle');

// Wait for DOM content loaded
await page.waitForLoadState('domcontentloaded');

// Wait for page load event
await page.waitForLoadState('load');
```

### 2. Waiting for Elements

```typescript
// Wait for element to exist in DOM
await page.waitForSelector('button:has-text("Submit")', { timeout: 5000 });

// Wait for specific element visibility
const button = page.locator('button[aria-label="Search"]');
await button.waitFor({ state: 'visible', timeout: 5000 });
```

### 3. Waiting for Conditions

```typescript
// Wait for element to be hidden
await page.locator('.loading-spinner').waitFor({ state: 'hidden' });

// Wait for element to have specific text
await expect(page.locator('h1')).toContainText('Welcome');

// Wait for navigation
await page.goto('/search');
await page.waitForNavigation();
```

### 4. Smart Waiting (Recommended)

```typescript
// Page object with smart waiting
async waitForArticlesToLoad() {
  // Wait for selector to exist AND be visible
  await this.page.waitForSelector('article', { timeout: 10000 });
  // Wait for network to settle
  await this.waitForLoadState('networkidle');
}

// In test: one call handles both DOM and network
await homePage.waitForArticlesToLoad();
```

### Best Practices

✅ **DO:**
- Use `waitForLoadState('networkidle')` after navigation
- Use `waitForSelector()` for elements that appear dynamically
- Set reasonable timeouts (3-10 seconds)
- Wait in page objects, not in tests

❌ **DON'T:**
- Use `page.waitForTimeout(1000)` - arbitrary waits cause flakiness
- Ignore wait errors - they indicate real problems
- Wait for the same element multiple times

---

## Browser Interactions

### Clicking Elements

```typescript
// Click by selector
await page.click('button:has-text("Submit")');

// Click with Locator API (recommended)
await page.locator('button[aria-label="Search"]').click();

// Click and wait for navigation
await page.click('a[href="/article/1"]');
await page.waitForNavigation();

// Safe click (checks visibility first)
const button = page.locator('button');
if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
  await button.click();
}
```

### Filling Forms

```typescript
// Fill input
await page.fill('input[placeholder="Search"]', 'AI');

// Type character by character
await page.locator('input').type('AI');

// Select from dropdown
await page.selectOption('select[name="category"]', 'AI');

// Check/uncheck checkbox
await page.check('input[type="checkbox"]');
await page.uncheck('input[type="checkbox"]');

// Complete form workflow
const searchInput = page.locator('input[placeholder="Search"]');
await searchInput.fill('quantum computing');
await searchInput.press('Enter');
await page.waitForLoadState('networkidle');
```

### Reading Data

```typescript
// Get text content
const title = await page.locator('h1').textContent();

// Get all matching texts
const titles = await page.locator('h2').allTextContents();

// Get attribute value
const href = await page.locator('a').getAttribute('href');

// Count elements
const articleCount = await page.locator('article').count();

// Check visibility
const isVisible = await page.locator('button').isVisible();

// Get input value
const searchQuery = await page.locator('input[type="search"]').inputValue();
```

### Scrolling

```typescript
// Scroll element into view
await page.locator('section').scrollIntoViewIfNeeded();

// Scroll to bottom
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

// Scroll with offset
await page.evaluate(() => window.scrollBy(0, 500));
```

---

## Critical User Journeys

The E2E test suite covers these 5 critical user journeys:

### 1. Homepage → Search → Read

**Test File:** `e2e/home.spec.ts` + `e2e/search.spec.ts`

**Flow:**
1. User lands on homepage
2. Searches for an article
3. Views search results
4. Clicks article to read

**Key Assertions:**
- Homepage loads with articles
- Search returns results
- Article detail page loads correctly

### 2. Category Browse → Filter → Read

**Test File:** `e2e/categories.spec.ts`

**Flow:**
1. User navigates to category (e.g., /ai)
2. Applies filters (date, trending)
3. Clicks article to read

**Key Assertions:**
- Category page loads
- Filters work correctly
- Filtered articles display
- Navigation to detail works

### 3. Article Detail → Comments → Interaction

**Test File:** `e2e/article.spec.ts`

**Flow:**
1. User loads article detail page
2. Scrolls to comments section
3. Views/interacts with comments
4. Real-time updates visible

**Key Assertions:**
- Article content loads
- Comments section visible
- Real-time updates work

### 4. Topic Recommendations → A/B Test → Click Tracking

**Test File:** `e2e/topic-recommendations.spec.ts`

**Flow:**
1. User visits monitoring dashboard
2. Views variant performance metrics
3. Sees adoption rates, CTR, engagement lift
4. Identifies winning variant

**Key Assertions:**
- Dashboard loads
- A/B variants displayed
- Metrics calculated correctly
- Statistical significance shown

### 5. Real-Time Feed → New Article → Notification

**Test File:** `e2e/real-time-feed.spec.ts`

**Flow:**
1. User opens real-time feed
2. Sees NEW badge on new articles
3. Receives notification
4. Clicks new article to read

**Key Assertions:**
- Feed loads with articles
- New articles show NEW badge
- Real-time updates work
- Notifications visible

---

## Best Practices

### 1. Selectors

```typescript
// Priority order for selectors (use in this order):

// 1. Data attributes (most stable)
page.locator('[data-testid="submit-button"]')

// 2. Aria attributes (accessibility-focused)
page.locator('[aria-label="Close"]')
page.locator('[role="button"]')

// 3. Text matching (human-readable)
page.locator('button:has-text("Submit")')

// 4. CSS selectors (fragile, last resort)
page.locator('form > button:nth-child(2)')
```

### 2. Assertions

```typescript
// Use specific assertions
expect(count).toBeGreaterThan(0);         // ✅ Good
expect(count > 0).toBe(true);             // ❌ Less clear

// Use semantic matchers
expect(text).toContain('Welcome');         // ✅ Good
expect(text.includes('Welcome')).toBe(true); // ❌ Less clear

// Test behavior, not implementation
expect(url).toContain('/article/1');       // ✅ Good
expect(url).toBe('http://localhost:3000/article/1'); // ❌ Fragile
```

### 3. Test Isolation

Each test should be independent:

```typescript
test.beforeEach(async ({ page }) => {
  // Fresh page state for each test
  homePage = new HomePage(page);
  await homePage.navigateToHome();
});

// Each test starts fresh - no dependencies between tests
test('test 1', async () => { /* ... */ });
test('test 2', async () => { /* ... */ });
```

### 4. Error Handling

```typescript
// Graceful error handling for optional elements
const hasOptionalElement = await page
  .locator('[data-testid="optional"]')
  .isVisible({ timeout: 2000 })
  .catch(() => false);

if (hasOptionalElement) {
  // Test optional feature
}

// Use try-catch for complex scenarios
try {
  await page.click('button:has-text("Advanced Options")');
  await page.waitForSelector('[data-testid="advanced-options"]', { timeout: 3000 });
} catch (error) {
  // Optional feature not available - skip
}
```

### 5. Debugging

```typescript
// Enable trace recording for debugging
test('failing test', async ({ page }) => {
  // Playwright records trace on first retry
  // Access via Test Results → Traces tab
  
  // Manual pause for interactive debugging
  await page.pause();
});

// Print debug info
console.log('Current URL:', page.url());
console.log('Element visible:', await element.isVisible());

// Take screenshot for debugging
await page.screenshot({ path: 'debug.png' });
```

---

## Performance

### Test Suite Performance

**Target:** Complete all 300+ tests in <5 minutes

**Optimization Strategies:**

1. **Parallel Execution**
   - Tests run in parallel by default (4 workers on CI)
   - Isolated browser contexts prevent conflicts

2. **Smart Caching**
   - Browser cache enabled in playwright.config.ts
   - Git cache used in CI for pnpm store

3. **Network Optimization**
   - Use `networkidle` wait state instead of arbitrary delays
   - Abort unnecessary requests (ads, analytics)

4. **Efficient Selectors**
   - Data attributes faster than deep CSS selectors
   - Use `:has-text()` for semantic queries

### Monitoring Performance

```bash
# Run tests with timing info
npm run test:e2e

# Output shows duration per test and total time
# ✓ should load home page (2.5s)
# ✓ should display articles (1.2s)
# Total: 3.7s for Home Page suite
```

### Common Slowdowns

| Issue | Cause | Fix |
|-------|-------|-----|
| Test takes >10s | Missing waits for dynamic content | Add `waitForLoadState('networkidle')` |
| Flaky tests | Timing issues | Use smart waits instead of delays |
| Slow startup | Browsers not cached | Run `npx playwright install` |
| High resource usage | Too many parallel workers | Reduce in playwright.config.ts |

---

## Debugging & Troubleshooting

### Test Failures

**Test times out:**
```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  await slowOperation();
}, { timeout: 60000 }); // Alternative: at test level
```

**Element not found:**
```typescript
// Check if selector is correct
await page.locator('article').first().click(); // Use .first() for multiple

// Wait longer for dynamic content
await page.waitForSelector('article', { timeout: 15000 });

// Use :visible filter
await page.locator('article:visible').first().click();
```

**Flaky tests:**
- Don't use `waitForTimeout()`
- Use proper wait strategies
- Check for race conditions
- Use `test.slow()` to increase timeout

### Debugging Tools

```bash
# Run single test with debugging UI
npx playwright test e2e/home.spec.ts --ui

# Run with headed browser (visible)
npm run test:e2e:headed

# Debug mode - pauses execution
npm run test:e2e:debug

# Generate HTML report
npm run test:e2e
# Report opens automatically after tests
```

### CI Debugging

When tests fail in CI but pass locally:

1. **Check environment variables** - CI might have different env
2. **Check network** - CI might have different network conditions
3. **Check browser** - Use same browser (Chromium) for testing
4. **Check timeouts** - CI runners might be slower

---

## Quick Reference

### Common Commands

```bash
npm run test:e2e              # Run all tests
npm run test:e2e:ui          # Interactive mode
npm run test:e2e:headed      # Visible browser
npm run test:e2e:debug       # Debug mode

npx playwright test -g "homepage"          # Run tests matching pattern
npx playwright test --project=chromium     # Run specific browser
npx playwright test --workers=1            # Single threaded
npx playwright test --headed --workers=1   # Debug single test
```

### Common Patterns

```typescript
// Navigate and wait
await page.goto('/');
await page.waitForLoadState('networkidle');

// Click and wait for navigation
await page.click('a');
await page.waitForNavigation();

// Type and submit
await page.fill('input', 'search term');
await page.press('input', 'Enter');
await page.waitForLoadState('networkidle');

// Wait for element and interact
await page.waitForSelector('button', { timeout: 10000 });
await page.click('button');

// Get data
const text = await page.locator('h1').textContent();
const count = await page.locator('article').count();
```

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Playwright Tests](https://playwright.dev/docs/debug)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)

---

**Questions?** Open an issue or contact the QA team.
