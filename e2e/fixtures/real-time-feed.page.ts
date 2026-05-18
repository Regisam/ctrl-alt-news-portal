import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class RealTimeFeedPage extends BasePage {
  readonly pageTitle = 'h1:has-text("Feed"), h1:has-text("Real-Time")';
  readonly feedContainer = '[data-testid="feed-container"], section:has-text("article")';
  readonly articleItem = '[data-testid="feed-article"], article, [role="article"]';
  readonly newArticleBadge = '[data-testid="new-badge"], span:has-text("NEW")';
  readonly notificationBell = 'button[aria-label*="notification"], [role="button"]:has-text("🔔")';
  readonly notificationToast = '[role="alert"], [class*="toast"]';
  readonly refreshButton = 'button:has-text("Refresh"), button[aria-label*="refresh"]';
  readonly autoRefreshToggle = 'input[type="checkbox"]:has-text("Auto-refresh"), [role="switch"]';
  readonly feedTimestamp = '[data-testid="feed-time"], time, span:has-text("ago")';
  readonly emptyFeedMessage = 'span:has-text("No articles"), p:has-text("empty")';
  readonly loadingIndicator = '[role="status"], .spinner, [class*="loading"]';
  readonly subscribeButton = 'button:has-text("Subscribe"), button:has-text("Enable")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToFeed() {
    await this.goto('/feed');
  }

  async isPageLoaded(): Promise<boolean> {
    return await this.isVisible(this.pageTitle);
  }

  async getArticleCount(): Promise<number> {
    const articles = this.page.locator(this.articleItem);
    return await articles.count();
  }

  async waitForNewArticle(timeout: number = 10000) {
    await this.page.waitForSelector(this.newArticleBadge, { timeout });
  }

  async hasNewArticleBadge(): Promise<boolean> {
    return await this.isVisible(this.newArticleBadge);
  }

  async getNewArticleCount(): Promise<number> {
    const newBadges = this.page.locator(this.newArticleBadge);
    return await newBadges.count();
  }

  async clickFirstNewArticle() {
    const newArticle = this.page.locator(this.articleItem).filter({ has: this.page.locator(this.newArticleBadge) }).first();
    if (await newArticle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newArticle.click();
      await this.waitForLoadState('networkidle');
    }
  }

  async clickNotificationBell() {
    const bell = this.page.locator(this.notificationBell).first();
    if (await bell.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bell.click();
      await this.page.waitForTimeout(500);
    }
  }

  async hasNotification(): Promise<boolean> {
    return await this.isVisible(this.notificationToast);
  }

  async getNotificationText(): Promise<string | null> {
    const notification = this.page.locator(this.notificationToast).first();
    if (await notification.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await notification.textContent();
    }
    return null;
  }

  async clickRefresh() {
    const btn = this.page.locator(this.refreshButton).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await this.waitForLoadState('networkidle');
    }
  }

  async toggleAutoRefresh() {
    const toggle = this.page.locator(this.autoRefreshToggle).first();
    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  async isAutoRefreshEnabled(): Promise<boolean> {
    const toggle = this.page.locator(this.autoRefreshToggle).first();
    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await toggle.isChecked();
    }
    return false;
  }

  async getLatestArticleTime(): Promise<string | null> {
    const timestamp = this.page.locator(this.feedTimestamp).first();
    if (await timestamp.isVisible({ timeout: 2000 }).catch(() => false)) {
      return await timestamp.textContent();
    }
    return null;
  }

  async isFeedEmpty(): Promise<boolean> {
    return await this.isVisible(this.emptyFeedMessage);
  }

  async isLoading(): Promise<boolean> {
    return await this.isVisible(this.loadingIndicator);
  }

  async waitForLoadingComplete(timeout: number = 5000) {
    const loading = this.page.locator(this.loadingIndicator);
    await loading.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  async enableNotifications() {
    const btn = this.page.locator(this.subscribeButton).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async getArticleTitles(): Promise<string[]> {
    const articles = this.page.locator(this.articleItem);
    const count = await articles.count();
    const titles: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const titleEl = articles.nth(i).locator('h2, h3, [class*="title"]').first();
      if (await titleEl.isVisible({ timeout: 1000 }).catch(() => false)) {
        const title = await titleEl.textContent();
        if (title) {
          titles.push(title.trim());
        }
      }
    }

    return titles;
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);
  }

  async verifyRealTimeUpdate(): Promise<boolean> {
    // Verify that at least one article has NEW badge
    return await this.hasNewArticleBadge();
  }
}
