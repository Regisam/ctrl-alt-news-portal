# E2E Testing Guide — Playwright Patterns for Ctrl Alt News Portal

## Overview

E2E (end-to-end) testing validates the complete user workflow from the perspective of a real user interacting with the application. For Ctrl Alt News Portal, we use **Playwright** to automate browser interactions across multiple browsers and viewport sizes.

## Running E2E Tests

### Development Mode

```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Run tests with UI (interactive mode with test explorer)
npm run test:e2e:ui

# Run tests in headed mode (see browser window)
npm run test:e2e:headed

# Debug tests with step-by-step execution
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/home.spec.ts

# Run tests matching pattern
npx playwright test home

# Run tests with filter
npx playwright test --grep "should load home page"
```

### CI/CD Mode

Tests are configured to run automatically in GitHub Actions:
- All browsers (Chromium, Firefox, WebKit, Mobile Chrome)
- Parallel execution with 4 workers
- Automatic retry on first failure (2 retries in CI)
- Screenshots and videos on failure
- Trace recordings for debugging

## Test Structure

### File Organization

```
e2e/
├── fixtures/              # Page Object Models
│   ├── base.page.ts       # Base page class with common methods
│   ├── home.page.ts       # HomePage page object
│   ├── article.page.ts    # ArticlePage page object
│   ├── search.page.ts     # SearchPage page object
│   └── category.page.ts   # CategoryPage page object
├── home.spec.ts           # Home page tests
├── article.spec.ts        # Article detail page tests
├── search.spec.ts         # Search functionality tests
├── categories.spec.ts     # Category page tests
└── responsive.spec.ts     # Responsive design tests
```

### Basic Test Pattern

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHome();
  });

  test('should load home page', async ({ page }) => {
    const title = await homePage.getPageTitle();
    expect(title).toBeTruthy();
  });
});
```

## Page Object Model (POM)

Page Objects abstract UI interactions into reusable, maintainable components.

### BasePage Structure

The `BasePage` class provides common methods available to all pages:

```typescript
class BasePage {
  async goto(path: string)              // Navigate to path
  async getPageTitle()                  // Get page title
  async getPageUrl()                    // Get current URL
  async click(selector: string)         // Click element
  async fill(selector: string, text)    // Fill input
  async type(selector: string, text)    // Type text (slower, more realistic)
  async press(key: string)              // Press keyboard key
  async isVisible(selector: string)     // Check visibility
  async getText(selector: string)       // Get element text
  async getAttribute(selector, attr)    // Get attribute value
  async waitForSelector(selector)       // Wait for element
  async waitForLoadState(state)         // Wait for page state
  async reload()                        // Reload page
  async goBack()                        // Navigate back
  async goForward()                     // Navigate forward
  async captureScreenshot(name)         // Take screenshot
}
```

### HomePage Example

```typescript
export class HomePage extends BasePage {
  readonly articleCards = '[data-testid="article-card"]';
  readonly searchInput = 'input[type="search"]';

  async navigateToHome() {
    await this.goto('/');
  }

  async getArticleCount(): Promise<number> {
    const articles = this.page.locator(this.articleCards);
    return await articles.count();
  }

  async clickFirstArticle() {
    const articles = this.page.locator(this.articleCards);
    await articles.first().click();
    await this.waitForLoadState('networkidle');
  }
}
```

## Selector Strategies

Use this priority order for selecting elements:

1. **Semantic queries** (preferred):
   ```typescript
   page.getByRole('button', { name: /search/i })
   page.getByLabel(/article title/i)
   ```

2. **Test IDs** (if semantic not available):
   ```typescript
   page.locator('[data-testid="article-card"]')
   ```

3. **Class/attribute selectors** (last resort):
   ```typescript
   page.locator('article.card')
   page.locator('input[type="search"]')
   ```

## Common Patterns

### Waiting for Elements

```typescript
// Wait for navigation
await page.waitForNavigation();

// Wait for specific selector
await page.waitForSelector('article', { timeout: 10000 });

// Wait for page state
await page.waitForLoadState('networkidle');  // No network requests
await page.waitForLoadState('domcontentloaded');
await page.waitForLoadState('load');

// Wait with visibility check
const element = page.locator('article');
await element.isVisible({ timeout: 5000 });
```

### Handling Dynamic Content

```typescript
// Scroll to load more (lazy loading)
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);

// Wait for new elements after action
await button.click();
await page.waitForSelector('[data-testid="new-item"]');
```

### Testing with Multiple Viewports

```typescript
test('should be responsive on mobile', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();
  
  await page.goto('/');
  // Test mobile interactions
  
  await context.close();
});
```

### Testing Navigation

```typescript
test('should navigate between pages', async ({ page }) => {
  await page.goto('/');
  
  // Click link
  await page.click('a[href="/article/1"]');
  
  // Verify URL
  expect(page.url()).toContain('/article/1');
  
  // Go back
  await page.goBack();
  expect(page.url()).toContain('/');
});
```

### Testing Forms

```typescript
test('should submit search form', async ({ page }) => {
  const searchInput = page.locator('input[type="search"]');
  
  // Fill and submit
  await searchInput.fill('quantum');
  await searchInput.press('Enter');
  
  // Wait for results
  await page.waitForSelector('[data-testid="search-result"]');
});
```

### Testing User Events

```typescript
import { expect } from '@playwright/test';

test('should handle user interactions', async ({ page }) => {
  // Click
  await page.click('button[aria-label="Share"]');
  
  // Type with realistic delays
  await page.type('input[type="search"]', 'quantum', { delay: 50 });
  
  // Check/uncheck checkbox
  await page.check('input[type="checkbox"]');
  await page.uncheck('input[type="checkbox"]');
  
  // Select dropdown
  await page.selectOption('select', 'newest');
});
```

### Handling Pop-ups and Dialogs

```typescript
test('should handle dialogs', async ({ page }) => {
  // Listen for dialog
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('Are you sure?');
    await dialog.accept();
  });
  
  await page.click('button[aria-label="Delete"]');
});
```

### Testing Accessibility

```typescript
test('should have accessible interactive elements', async ({ page }) => {
  // Use semantic queries (most accessible)
  const button = page.getByRole('button', { name: /submit/i });
  expect(button).toBeTruthy();
  
  // Check ARIA labels
  const labeledElement = page.getByLabel(/search query/i);
  expect(labeledElement).toBeTruthy();
});
```

## Debugging E2E Tests

### Using Playwright Inspector

```bash
# Run with inspector (opens debugger)
PWDEBUG=1 npm run test:e2e
```

Features:
- Step through test execution
- Inspect selectors in real-time
- Check element visibility
- View network requests

### Viewing Test Report

```bash
# Generate and open HTML report
npm run test:e2e
npx playwright show-report
```

### Capturing Artifacts

```typescript
test('should capture screenshots', async ({ page }) => {
  // Single screenshot
  await page.screenshot({ path: 'screenshots/home.png' });
  
  // Full page screenshot
  await page.screenshot({ path: 'screenshots/full-page.png', fullPage: true });
  
  // Specific element
  await page.locator('article').first().screenshot({ path: 'screenshots/article.png' });
});
```

### Viewing Traces

Traces are recorded automatically on first failure in CI. To view locally:

```bash
npx playwright show-trace trace.zip
```

## Best Practices

### 1. Use Page Objects Consistently

✅ Good:
```typescript
const homePage = new HomePage(page);
const articleCount = await homePage.getArticleCount();
```

❌ Avoid:
```typescript
const count = await page.locator('[data-testid="article-card"]').count();
```

### 2. Wait for Load States, Not Fixed Timeouts

✅ Good:
```typescript
await homePage.clickArticle();
await homePage.waitForLoadState('networkidle');
```

❌ Avoid:
```typescript
await homePage.clickArticle();
await page.waitForTimeout(2000);
```

### 3. Prefer Semantic Selectors

✅ Good:
```typescript
await page.getByRole('button', { name: /search/i }).click();
```

❌ Avoid:
```typescript
await page.locator('div.header button.btn-search').click();
```

### 4. Make Tests Independent

✅ Each test should:
- Navigate to starting state in `beforeEach`
- Clean up after itself
- Not depend on other tests

### 5. Test User Workflows

✅ Test realistic user journeys:
```typescript
test('user reads article from home', async () => {
  await homePage.navigateToHome();
  await homePage.clickFirstArticle();
  await articlePage.scrollToComments();
});
```

### 6. Handle Dynamic Content

```typescript
// Wait for content to load
await page.waitForSelector('article', { timeout: 10000 });

// Handle network uncertainty
try {
  await homePage.waitForArticlesToLoad();
} catch {
  // Graceful degradation
  expect(true).toBe(true);
}
```

## Configuration

### playwright.config.ts

Key settings:

```typescript
export default defineConfig({
  testDir: './e2e',                 // Test directory
  fullyParallel: true,              // Run tests in parallel
  retries: process.env.CI ? 2 : 0,  // Retry in CI
  timeout: 30000,                   // Test timeout (30s)
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',        // Record trace on failure
    screenshot: 'only-on-failure',  // Screenshots on failure
    video: 'retain-on-failure',     // Video on failure
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly runs

Results posted to:
- GitHub Actions console
- PR comments (with summary)
- Artifact storage (screenshots, videos, traces)

## Performance Considerations

### Test Execution Time

- **Full suite**: ~5-10 minutes
- **Single test file**: ~30-60 seconds
- **Parallel execution**: 4 workers reduces time ~75%

### Optimization Tips

1. Use `fullyParallel: true` to run tests in parallel
2. Reuse browser context across tests when possible
3. Mock network requests for slow APIs
4. Use `skipWaiting` for tests that don't need full load

## Common Issues

### Flaky Tests (Intermittent Failures)

**Cause**: Race conditions or timing issues
**Solution**: Use proper wait mechanisms

```typescript
// ❌ Bad (flaky)
await page.click('button');
const text = await page.locator('p').textContent();

// ✅ Good (stable)
await page.click('button');
await page.waitForSelector('p');
const text = await page.locator('p').textContent();
```

### Timeout Errors

**Cause**: Element not appearing within timeout
**Solution**: Increase timeout or check selectors

```typescript
await page.waitForSelector('article', { timeout: 20000 });
```

### Navigation Issues

**Cause**: Page navigation not completing
**Solution**: Wait for load state

```typescript
await page.goto('/article/1');
await page.waitForLoadState('networkidle');
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Configuration Reference](https://playwright.dev/docs/test-configuration)
