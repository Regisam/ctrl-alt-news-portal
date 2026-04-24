import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class CategoryPage extends BasePage {
  readonly categoryTabs = 'button[role="tab"]';
  readonly categoryTitle = 'h1, h2:has-text("Category")';
  readonly articleCard = '[data-testid="article-card"], article, [role="article"]';
  readonly filterButton = 'button:has-text("Filter")';
  readonly sortButton = 'button:has-text("Sort")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToCategory(categoryName: string) {
    const categoryPath = categoryName.toLowerCase();
    await this.goto(`/${categoryPath}`);
  }

  async selectCategoryTab(categoryName: string) {
    const categoryBtn = this.page.locator(`button:has-text("${categoryName}")`).first();
    await categoryBtn.click();
    await this.waitForLoadState('networkidle');
  }

  async getCategoryTitle(): Promise<string | null> {
    return await this.getText(this.categoryTitle);
  }

  async getArticleCount(): Promise<number> {
    const articles = this.page.locator(this.articleCard);
    return await articles.count();
  }

  async getArticleTitles(): Promise<string[]> {
    const articles = this.page.locator(this.articleCard);
    const count = await articles.count();
    const titles: string[] = [];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const titleText = await articles.nth(i).locator('h2, h3, [class*="title"]').first().textContent();
      if (titleText) {
        titles.push(titleText.trim());
      }
    }

    return titles;
  }

  async clickArticleByIndex(index: number) {
    const articles = this.page.locator(this.articleCard);
    await articles.nth(index).click();
    await this.waitForLoadState('networkidle');
  }

  async clickFirstArticle() {
    const firstArticle = this.page.locator(this.articleCard).first();
    await firstArticle.click();
    await this.waitForLoadState('networkidle');
  }

  async waitForArticlesToLoad() {
    await this.page.waitForSelector(this.articleCard, { timeout: 10000 });
    await this.waitForLoadState('networkidle');
  }

  async hasArticles(): Promise<boolean> {
    const count = await this.getArticleCount();
    return count > 0;
  }

  async switchCategory(newCategoryName: string) {
    const currentUrl = this.page.url();

    // Click the new category tab
    const categoryBtn = this.page.locator(`button:has-text("${newCategoryName}")`).first();
    if (await categoryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await categoryBtn.click();
      await this.waitForLoadState('networkidle');
    }
  }

  async getAllCategoryTabs(): Promise<string[]> {
    const tabs = this.page.locator(this.categoryTabs);
    const count = await tabs.count();
    const tabNames: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await tabs.nth(i).textContent();
      if (text) {
        tabNames.push(text.trim());
      }
    }

    return tabNames;
  }

  async isCategoryPageLoaded(): Promise<boolean> {
    const hasArticles = await this.hasArticles();
    return hasArticles;
  }

  async getArticlesByCategory(categoryName: string): Promise<string[]> {
    await this.navigateToCategory(categoryName);
    await this.waitForArticlesToLoad();
    return await this.getArticleTitles();
  }
}
