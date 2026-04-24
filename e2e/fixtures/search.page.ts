import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class SearchPage extends BasePage {
  readonly searchButton = 'button[aria-label*="search" i], button[aria-label*="Search" i]';
  readonly searchInput = 'input[type="search"], input[placeholder*="search" i]';
  readonly searchResultsContainer = 'div[class*="grid"], section:has-text("Results")';
  readonly resultCard = '[data-testid="article-card"], article, [role="article"]';
  readonly noResultsMessage = 'p:has-text("No results"), p:has-text("no results")';
  readonly filterButton = 'button:has-text("Filter"), button[aria-label*="filter" i]';
  readonly categoryFilter = 'button[role="tab"], label:has-text("Category")';
  readonly sortDropdown = 'select, button:has-text("Sort")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToSearch() {
    await this.goto('/search');
  }

  async performSearch(query: string) {
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

  async clearSearch() {
    const input = this.page.locator(this.searchInput).first();
    await input.clear();
    await input.press('Enter');
    await this.waitForLoadState('networkidle');
  }

  async getSearchResultCount(): Promise<number> {
    const results = this.page.locator(this.resultCard);
    return await results.count();
  }

  async hasSearchResults(): Promise<boolean> {
    const results = this.page.locator(this.resultCard);
    const count = await results.count();
    return count > 0;
  }

  async getResultTitles(): Promise<string[]> {
    const results = this.page.locator(this.resultCard);
    const count = await results.count();
    const titles: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const titleText = await results.nth(i).locator('h2, h3, [class*="title"]').first().textContent();
      if (titleText) {
        titles.push(titleText.trim());
      }
    }

    return titles;
  }

  async hasNoResultsMessage(): Promise<boolean> {
    return await this.isVisible(this.noResultsMessage);
  }

  async clickFirstResult() {
    const firstResult = this.page.locator(this.resultCard).first();
    await firstResult.click();
    await this.waitForLoadState('networkidle');
  }

  async clickResultByIndex(index: number) {
    const result = this.page.locator(this.resultCard).nth(index);
    await result.click();
    await this.waitForLoadState('networkidle');
  }

  async getSearchInputValue(): Promise<string | null> {
    const input = this.page.locator(this.searchInput).first();
    return await input.inputValue();
  }

  async filterByCategory(categoryName: string) {
    const categoryBtn = this.page.locator(`button:has-text("${categoryName}")`).first();
    if (await categoryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await categoryBtn.click();
      await this.waitForLoadState('networkidle');
    }
  }

  async sortResults(sortOption: string) {
    const sortBtn = this.page.locator(this.sortDropdown).first();
    if (await sortBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sortBtn.click();
      const option = this.page.locator(`option:has-text("${sortOption}"), button:has-text("${sortOption}")`).first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        await this.waitForLoadState('networkidle');
      }
    }
  }

  async waitForSearchResults() {
    // Wait for at least one result or no results message
    try {
      await this.page.waitForSelector(this.resultCard, { timeout: 5000 });
    } catch {
      // Check for no results message
      await this.page.waitForSelector(this.noResultsMessage, { timeout: 5000 });
    }
  }

  async isSearchPageLoaded(): Promise<boolean> {
    const hasInput = await this.isVisible(this.searchInput);
    return hasInput;
  }

  async searchForMultipleQueries(queries: string[]): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    for (const query of queries) {
      await this.performSearch(query);
      const count = await this.getSearchResultCount();
      results.set(query, count);
    }

    return results;
  }

  async getResultMetadata(index: number): Promise<{ title: string; category?: string; views?: string }> {
    const result = this.page.locator(this.resultCard).nth(index);
    const titleText = await result.locator('h2, h3, [class*="title"]').first().textContent();
    const categoryText = await result.locator('[class*="category"], span[class*="bg"]').first().textContent().catch(() => null);
    const viewsText = await result.locator('text=/views/').first().textContent().catch(() => null);

    return {
      title: titleText?.trim() || '',
      category: categoryText?.trim(),
      views: viewsText?.trim()
    };
  }
}
