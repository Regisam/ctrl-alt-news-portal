# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Home Page >> should return to home from article
- Location: e2e/home.spec.ts:52:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('article, [role="article"], .article-card, [data-testid*="article"]') to be visible

```

# Test source

```ts
  1  | import { Page } from '@playwright/test';
  2  | import { BasePage } from './base.page';
  3  | 
  4  | export class HomePage extends BasePage {
  5  |   readonly searchButton = 'button[aria-label*="search" i], button[aria-label*="Search" i]';
  6  |   readonly searchInput = 'input[type="search"], input[placeholder*="search" i]';
  7  |   readonly articleCards = '[data-testid="article-card"]';
  8  |   readonly categoryTabs = 'button[role="tab"]';
  9  |   readonly header = 'header';
  10 | 
  11 |   constructor(page: Page) {
  12 |     super(page);
  13 |   }
  14 | 
  15 |   async navigateToHome() {
  16 |     await this.goto('/');
  17 |   }
  18 | 
  19 |   async isHeaderVisible(): Promise<boolean> {
  20 |     return await this.isVisible(this.header);
  21 |   }
  22 | 
  23 |   async getArticleCount(): Promise<number> {
  24 |     const articles = this.page.locator('article, [data-testid*="article"], .article');
  25 |     return await articles.count();
  26 |   }
  27 | 
  28 |   async clickFirstArticle() {
  29 |     const articles = this.page.locator('article, [role="article"], .article-card');
  30 |     const firstArticle = articles.first();
  31 |     await firstArticle.click();
  32 |     await this.waitForLoadState('networkidle');
  33 |   }
  34 | 
  35 |   async clickArticleByIndex(index: number) {
  36 |     const articles = this.page.locator('article, [role="article"], .article-card');
  37 |     await articles.nth(index).click();
  38 |     await this.waitForLoadState('networkidle');
  39 |   }
  40 | 
  41 |   async searchArticles(query: string) {
  42 |     // Try to click search button if exists
  43 |     const searchBtn = this.page.locator(this.searchButton).first();
  44 |     if (await searchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  45 |       await searchBtn.click();
  46 |     }
  47 | 
  48 |     // Fill search input
  49 |     const input = this.page.locator(this.searchInput).first();
  50 |     await input.fill(query);
  51 |     await input.press('Enter');
  52 |     await this.waitForLoadState('networkidle');
  53 |   }
  54 | 
  55 |   async selectCategory(categoryName: string) {
  56 |     const categoryBtn = this.page.locator(`button:has-text("${categoryName}")`).first();
  57 |     await categoryBtn.click();
  58 |     await this.waitForLoadState('networkidle');
  59 |   }
  60 | 
  61 |   async getVisibleArticleTitles(): Promise<string[]> {
  62 |     const titles = this.page.locator('h2, h3, [data-testid*="title"]');
  63 |     const count = await titles.count();
  64 |     const titleTexts: string[] = [];
  65 | 
  66 |     for (let i = 0; i < Math.min(count, 10); i++) {
  67 |       const text = await titles.nth(i).textContent();
  68 |       if (text && text.trim()) {
  69 |         titleTexts.push(text.trim());
  70 |       }
  71 |     }
  72 | 
  73 |     return titleTexts;
  74 |   }
  75 | 
  76 |   async isArticleVisible(articleTitle: string): Promise<boolean> {
  77 |     return await this.isVisible(`text=${articleTitle}`);
  78 |   }
  79 | 
  80 |   async scrollToBottom() {
  81 |     await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  82 |     await this.page.waitForTimeout(500);
  83 |   }
  84 | 
  85 |   async hasLoadingSpinner(): Promise<boolean> {
  86 |     const spinners = this.page.locator('[role="status"], .spinner, .loading');
  87 |     return await spinners.first().isVisible({ timeout: 2000 }).catch(() => false);
  88 |   }
  89 | 
  90 |   async waitForArticlesToLoad() {
  91 |     // Wait for at least one article to be visible
> 92 |     await this.page.waitForSelector('article, [role="article"], .article-card, [data-testid*="article"]', {
     |                     ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  93 |       timeout: 10000,
  94 |     });
  95 |     await this.waitForLoadState('networkidle');
  96 |   }
  97 | }
  98 | 
```