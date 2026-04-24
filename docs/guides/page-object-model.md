# Page Object Model (POM) Guide — Design Patterns for E2E Tests

## What is Page Object Model?

The Page Object Model is a design pattern that abstracts page interactions into reusable objects. Instead of scattering UI selectors throughout tests, POM encapsulates:

- **Selectors**: Element location strategies
- **Methods**: User interactions (click, fill, search)
- **Assertions**: Expected outcomes

This makes tests:
- **Readable**: Tests look like user stories
- **Maintainable**: UI changes only require updating page objects
- **Reusable**: Methods shared across all tests
- **Scalable**: Easy to add new pages and tests

## Architecture

### Hierarchy

```
BasePage (abstract base class)
├── HomePage (extends BasePage)
├── ArticlePage (extends BasePage)
├── SearchPage (extends BasePage)
└── CategoryPage (extends BasePage)
```

### BasePage

The base class provides common functionality:

```typescript
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto(path: string = '/') { }
  async getPageUrl(): Promise<string> { }
  async goBack() { }
  async goForward() { }

  // Interaction
  async click(selector: string) { }
  async fill(selector: string, text: string) { }
  async type(selector: string, text: string) { }
  async press(key: string) { }

  // Verification
  async isVisible(selector: string): Promise<boolean> { }
  async getText(selector: string): Promise<string | null> { }
  async getAttribute(selector: string, attribute: string) { }

  // Waits
  async waitForSelector(selector: string, timeout = 5000) { }
  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle') { }

  // Utilities
  async captureScreenshot(name: string) { }
}
```

## Page Object Implementation

### HomePage Example

```typescript
import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  // Selectors (readonly for immutability)
  readonly searchButton = 'button[aria-label*="search" i]';
  readonly searchInput = 'input[type="search"]';
  readonly articleCards = '[data-testid="article-card"]';
  readonly categoryTabs = 'button[role="tab"]';
  readonly header = 'header';

  constructor(page: Page) {
    super(page);
  }

  // Navigation
  async navigateToHome() {
    await this.goto('/');
  }

  // Queries (return data)
  async getArticleCount(): Promise<number> {
    const articles = this.page.locator(this.articleCards);
    return await articles.count();
  }

  async getVisibleArticleTitles(): Promise<string[]> {
    const titles = this.page.locator('h2, h3, [data-testid*="title"]');
    const count = await titles.count();
    const titleTexts: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await titles.nth(i).textContent();
      if (text) {
        titleTexts.push(text.trim());
      }
    }

    return titleTexts;
  }

  // Actions (change state)
  async clickFirstArticle() {
    const articles = this.page.locator(this.articleCards);
    const firstArticle = articles.first();
    await firstArticle.click();
    await this.waitForLoadState('networkidle');
  }

  async searchArticles(query: string) {
    const searchBtn = this.page.locator(this.searchButton).first();
    if (await searchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBtn.click();
    }

    const input = this.page.locator(this.searchInput).first();
    await input.fill(query);
    await input.press('Enter');
    await this.waitForLoadState('networkidle');
  }

  async selectCategory(categoryName: string) {
    const categoryBtn = this.page.locator(`button:has-text("${categoryName}")`).first();
    await categoryBtn.click();
    await this.waitForLoadState('networkidle');
  }

  // Conditions (return boolean)
  async isHeaderVisible(): Promise<boolean> {
    return await this.isVisible(this.header);
  }
}
```

## Design Principles

### 1. Single Responsibility

Each page object represents **one page** only:

✅ Good:
```typescript
// HomePage is responsible for home page interactions only
class HomePage extends BasePage {
  async clickArticle() { /* ... */ }
  async getArticleCount() { /* ... */ }
}
```

❌ Avoid:
```typescript
// Don't mix unrelated pages
class HomePage extends BasePage {
  async goToArticle() { /* ... */ }      // ← belongs in ArticlePage
  async performSearch() { /* ... */ }    // ← might belong in SearchPage
}
```

### 2. Encapsulation

Hide implementation details, expose high-level methods:

✅ Good:
```typescript
// External: simple, readable
await homePage.clickFirstArticle();
```

```typescript
// Internal: complex selectors hidden
async clickFirstArticle() {
  const articles = this.page.locator(this.articleCards);
  const firstArticle = articles.first();
  await firstArticle.click();
  await this.waitForLoadState('networkidle');
}
```

❌ Avoid:
```typescript
// Exposing implementation details
await page.locator('[data-testid="article-card"]').first().click();
```

### 3. Naming Conventions

- **Selectors**: `readonly` properties, descriptive names
  ```typescript
  readonly articleCard = '[data-testid="article-card"]';
  readonly shareButton = 'button[aria-label*="share"]';
  ```

- **Methods**: action verbs for actions, "get/has/is" for queries
  ```typescript
  // Actions
  async clickArticle() { }
  async fillSearchInput(query: string) { }
  async pressEnter() { }

  // Queries
  async getArticleCount(): Promise<number> { }
  async getVisibleTitles(): Promise<string[]> { }

  // Conditions
  async isHeaderVisible(): Promise<boolean> { }
  async hasComments(): Promise<boolean> { }
  ```

### 4. Method Chaining (Optional)

Make methods chainable for fluent API:

```typescript
export class HomePage extends BasePage {
  async clickArticle() {
    await this.page.locator(this.articleCards).first().click();
    return this;  // ← return this for chaining
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    return this;
  }
}

// Usage
await homePage
  .clickArticle()
  .scrollToBottom()
  .takeScreenshot('article-loaded');
```

### 5. Error Handling

Methods should handle common error scenarios gracefully:

```typescript
async selectCategory(categoryName: string) {
  const categoryBtn = this.page.locator(`button:has-text("${categoryName}")`).first();
  
  // Check visibility before clicking
  if (await categoryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await categoryBtn.click();
    await this.waitForLoadState('networkidle');
  }
  // If not visible, don't throw - test will verify through assertions
}
```

## Selector Strategies

### Priority Order

1. **Test IDs** (most reliable):
   ```typescript
   readonly articleCard = '[data-testid="article-card"]';
   ```

2. **ARIA attributes** (semantic):
   ```typescript
   readonly searchButton = 'button[aria-label*="search"]';
   ```

3. **Role + name** (accessible):
   ```typescript
   // In tests:
   await page.getByRole('button', { name: /search/i });
   ```

4. **CSS class** (fallback):
   ```typescript
   readonly header = 'header.site-header';
   ```

5. **Tag + content** (last resort):
   ```typescript
   readonly backLink = 'a:has-text("Back")';
   ```

### Selector Best Practices

```typescript
// ✅ Good - specific, scoped
readonly articleCard = '[data-testid="article-card"]';

// ✅ Good - uses data attributes
readonly shareButton = '[data-testid="share-button"]';

// ✅ Good - scoped to parent
readonly modalContent = '[role="dialog"] [data-testid="content"]';

// ❌ Bad - too broad
readonly card = 'div';

// ❌ Bad - brittle class names
readonly article = 'div.card.article.item.content';

// ❌ Bad - couples to implementation
readonly title = 'h1.text-3xl.font-black';
```

## Test Usage

### Using Page Objects in Tests

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/home.page';
import { ArticlePage } from './fixtures/article.page';

test.describe('User reads article', () => {
  test('should navigate from home to article', async ({ page }) => {
    // Initialize page objects
    const homePage = new HomePage(page);
    const articlePage = new ArticlePage(page);

    // Use page objects (highly readable)
    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    const initialCount = await homePage.getArticleCount();
    expect(initialCount).toBeGreaterThan(0);

    await homePage.clickFirstArticle();

    const title = await articlePage.getArticleTitle();
    expect(title).toBeTruthy();
  });
});
```

### Reusing Methods Across Tests

```typescript
// Method defined once in HomePage
async clickFirstArticle() {
  const articles = this.page.locator(this.articleCards);
  await articles.first().click();
  await this.waitForLoadState('networkidle');
}

// Reused in multiple tests without duplication
test('should display article on click', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigateToHome();
  await homePage.clickFirstArticle();
  // ← method handles all the complexity
});

test('should navigate between articles', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigateToHome();
  await homePage.clickFirstArticle();
  // ← same method, different test
});
```

## Advanced Patterns

### Waiting for Dynamic Content

```typescript
export class HomePage extends BasePage {
  async waitForArticlesToLoad() {
    // Wait for at least one article
    await this.page.waitForSelector(this.articleCards, { timeout: 10000 });
    // Wait for network to be idle
    await this.waitForLoadState('networkidle');
  }
}
```

### Handling Optional Elements

```typescript
export class ArticlePage extends BasePage {
  async getRelatedArticlesIfAvailable(): Promise<number> {
    try {
      const related = this.page.locator(this.relatedArticlesSection);
      if (await related.isVisible({ timeout: 2000 }).catch(() => false)) {
        return await this.page.locator(this.relatedArticleCard).count();
      }
    } catch {
      // Element not found, that's okay
    }
    return 0;
  }
}
```

### Multi-Step User Flows

```typescript
export class HomePage extends BasePage {
  async searchAndOpenFirstResult(query: string) {
    await this.searchArticles(query);
    
    const hasResults = await this.hasArticles();
    if (hasResults) {
      await this.clickFirstArticle();
    }
  }

  private async hasArticles(): Promise<boolean> {
    const count = await this.getArticleCount();
    return count > 0;
  }
}
```

### Context-Aware Methods

```typescript
export class BasePage {
  constructor(page: Page) {
    this.page = page;
  }

  // Reusable across all page objects
  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
    await this.page.waitForLoadState(state);
  }
}
```

## Maintenance

### Updating Selectors

When UI changes, update selectors in one place:

Before:
```typescript
// Old selector stops working
readonly articleCard = '.article-item';  // ❌ changed in new design
```

After:
```typescript
// Update selector in page object
readonly articleCard = '[data-testid="article-card"]';  // ✅ works

// All tests automatically use new selector - no test updates needed
```

### Adding New Page Objects

1. **Create file**: `e2e/fixtures/{page-name}.page.ts`
2. **Extend BasePage**: `export class {PageName}Page extends BasePage`
3. **Define selectors**: `readonly selector = 'css'`
4. **Implement methods**: actions, queries, conditions
5. **Use in tests**: import and instantiate

Example:

```typescript
// e2e/fixtures/profile.page.ts
export class ProfilePage extends BasePage {
  readonly profileName = '[data-testid="profile-name"]';
  readonly editButton = 'button[aria-label="Edit profile"]';

  async navigateToProfile(userId: string) {
    await this.goto(`/profile/${userId}`);
  }

  async getProfileName(): Promise<string | null> {
    return await this.getText(this.profileName);
  }

  async clickEditProfile() {
    await this.click(this.editButton);
  }
}
```

## Testing Page Objects

Page objects themselves should be tested to ensure reliability:

```typescript
test('HomePage.getArticleCount returns correct number', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigateToHome();

  const count = await homePage.getArticleCount();
  
  // Verify result is consistent
  const countAgain = await homePage.getArticleCount();
  expect(count).toBe(countAgain);
});
```

## Performance Considerations

### Lazy Loading Selectors

Page objects don't run selectors until used:

```typescript
export class HomePage extends BasePage {
  // Selectors are just strings (no execution cost)
  readonly articleCards = '[data-testid="article-card"]';

  async getArticleCount(): Promise<number> {
    // Only NOW is the selector executed
    const articles = this.page.locator(this.articleCards);
    return await articles.count();
  }
}
```

### Caching When Appropriate

```typescript
export class HomePage extends BasePage {
  private cachedArticleCount: number | null = null;

  async getArticleCount(useCache = false): Promise<number> {
    if (useCache && this.cachedArticleCount !== null) {
      return this.cachedArticleCount;
    }

    const count = await this.page.locator(this.articleCards).count();
    this.cachedArticleCount = count;
    return count;
  }
}
```

## Common Pitfalls

### ❌ Mixing Concerns

```typescript
// Bad: test logic in page object
async clickArticleAndVerifyTitle() {
  await this.clickArticle();
  const title = await this.getArticleTitle();
  expect(title).toBeTruthy();  // ← assertions don't belong here
}
```

### ✅ Separate Concerns

```typescript
// Good: page object for interaction, test for assertion
async clickArticle() {
  await this.click(this.articleCard);
}

async getArticleTitle(): Promise<string> {
  return await this.getText(this.articleTitle);
}

// In test:
await page.clickArticle();
const title = await page.getArticleTitle();
expect(title).toBeTruthy();  // ← assertion in test
```

### ❌ Hard-coded Waits

```typescript
async clickArticle() {
  await this.click(this.articleCard);
  await this.page.waitForTimeout(2000);  // ← unreliable
}
```

### ✅ Intelligent Waits

```typescript
async clickArticle() {
  await this.click(this.articleCard);
  await this.waitForLoadState('networkidle');  // ← reliable
}
```

## Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/)
- [Locator Strategies](https://playwright.dev/docs/locators)
