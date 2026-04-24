import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  readonly searchButton = 'button[aria-label*="search" i], button[aria-label*="Search" i]';
  readonly searchInput = 'input[type="search"], input[placeholder*="search" i]';
  readonly articleCards = '[data-testid="article-card"]';
  readonly categoryTabs = 'button[role="tab"]';
  readonly header = 'header';

  constructor(page: Page) {
    super(page);
  }

  async navigateToHome() {
    await this.goto('/');
  }

  async isHeaderVisible(): Promise<boolean> {
    return await this.isVisible(this.header);
  }

  async getArticleCount(): Promise<number> {
    const articles = this.page.locator('article, [data-testid*="article"], .article');
    return await articles.count();
  }

  async clickFirstArticle() {
    const articles = this.page.locator('article, [role="article"], .article-card');
    const firstArticle = articles.first();
    await firstArticle.click();
    await this.waitForLoadState('networkidle');
  }

  async clickArticleByIndex(index: number) {
    const articles = this.page.locator('article, [role="article"], .article-card');
    await articles.nth(index).click();
    await this.waitForLoadState('networkidle');
  }

  async searchArticles(query: string) {
    // Try to click search button if exists
    const searchBtn = this.page.locator(this.searchButton).first();
    if (await searchBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBtn.click();
    }

    // Fill search input
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

  async getVisibleArticleTitles(): Promise<string[]> {
    const titles = this.page.locator('h2, h3, [data-testid*="title"]');
    const count = await titles.count();
    const titleTexts: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await titles.nth(i).textContent();
      if (text && text.trim()) {
        titleTexts.push(text.trim());
      }
    }

    return titleTexts;
  }

  async isArticleVisible(articleTitle: string): Promise<boolean> {
    return await this.isVisible(`text=${articleTitle}`);
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);
  }

  async hasLoadingSpinner(): Promise<boolean> {
    const spinners = this.page.locator('[role="status"], .spinner, .loading');
    return await spinners.first().isVisible({ timeout: 2000 }).catch(() => false);
  }

  async waitForArticlesToLoad() {
    // Wait for at least one article to be visible
    await this.page.waitForSelector('article, [role="article"], .article-card, [data-testid*="article"]', {
      timeout: 10000,
    });
    await this.waitForLoadState('networkidle');
  }
}
