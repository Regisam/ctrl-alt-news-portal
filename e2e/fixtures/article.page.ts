import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class ArticlePage extends BasePage {
  readonly articleHero = 'img[alt*=""]';
  readonly articleTitle = 'h1';
  readonly categoryBadge = 'span[class*="uppercase"]';
  readonly authorName = 'div:has-text("author") span';
  readonly articleBody = 'article';
  readonly articleExcerpt = 'p[class*="border-l"]';
  readonly articleTags = 'span:has-text("#")';
  readonly shareTwitterBtn = 'button[aria-label="Share on X / Twitter"]';
  readonly shareLinkedInBtn = 'button[aria-label="Share on LinkedIn"]';
  readonly copyLinkBtn = 'button[aria-label="Copy article link"]';
  readonly authorBio = 'div[class*="p-6"]';
  readonly commentsSection = 'section:has-text("Comment")';
  readonly relatedArticlesSection = '[aria-label="Related articles"]';
  readonly relatedArticleCard = '[aria-label*="Read:"]';
  readonly backButton = 'a:has-text("Back")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToArticle(articleId: number) {
    await this.goto(`/article/${articleId}`);
  }

  async getArticleTitle(): Promise<string | null> {
    return await this.getText(this.articleTitle);
  }

  async getCategoryBadge(): Promise<string | null> {
    return await this.getText(this.categoryBadge);
  }

  async getArticleExcerpt(): Promise<string | null> {
    return await this.getText(this.articleExcerpt);
  }

  async getArticleContent(): Promise<boolean> {
    return await this.isVisible(this.articleBody);
  }

  async getTagCount(): Promise<number> {
    const tags = this.page.locator(this.articleTags);
    return await tags.count();
  }

  async getAllTags(): Promise<string[]> {
    const tags = this.page.locator(this.articleTags);
    const count = await tags.count();
    const tagTexts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await tags.nth(i).textContent();
      if (text) {
        tagTexts.push(text.trim());
      }
    }

    return tagTexts;
  }

  async shareOnTwitter() {
    const btn = this.page.locator(this.shareTwitterBtn).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      // Wait for Twitter window to be handled
      await this.page.waitForTimeout(500);
    }
  }

  async shareOnLinkedIn() {
    const btn = this.page.locator(this.shareLinkedInBtn).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(500);
    }
  }

  async copyArticleLink() {
    const btn = this.page.locator(this.copyLinkBtn).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async hasAuthorBio(): Promise<boolean> {
    return await this.isVisible(this.authorBio);
  }

  async getAuthorBioText(): Promise<string | null> {
    const autoBio = this.page.locator(this.authorBio).first();
    return await autoBio.textContent();
  }

  async hasRelatedArticles(): Promise<boolean> {
    return await this.isVisible(this.relatedArticlesSection);
  }

  async getRelatedArticleCount(): Promise<number> {
    const related = this.page.locator(this.relatedArticleCard);
    return await related.count();
  }

  async clickRelatedArticle(index: number) {
    const related = this.page.locator(this.relatedArticleCard);
    await related.nth(index).click();
    await this.waitForLoadState('networkidle');
  }

  async hasCommentsSection(): Promise<boolean> {
    return await this.isVisible(this.commentsSection);
  }

  async goBackToHome() {
    const backBtn = this.page.locator(this.backButton).first();
    if (await backBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await backBtn.click();
    } else {
      await this.goBack();
    }
    await this.waitForLoadState('networkidle');
  }

  async getArticleReadTime(): Promise<string | null> {
    // Find read time from meta info (Clock icon with duration)
    const metaText = await this.page.locator('div:has-text("min")').first().textContent();
    return metaText;
  }

  async getArticleViews(): Promise<string | null> {
    // Find views count from meta info (Eye icon with views)
    const viewsText = await this.page.locator('div:has-text("views")').first().textContent();
    return viewsText;
  }

  async scrollToComments() {
    const comments = this.page.locator(this.commentsSection).first();
    if (await comments.isVisible().catch(() => false)) {
      await comments.scrollIntoViewIfNeeded();
    }
  }

  async scrollToRelatedArticles() {
    const related = this.page.locator(this.relatedArticlesSection).first();
    if (await related.isVisible().catch(() => false)) {
      await related.scrollIntoViewIfNeeded();
    }
  }

  async articleIsFullyLoaded(): Promise<boolean> {
    // Check that key article elements are visible
    const hasTitle = await this.isVisible(this.articleTitle);
    const hasBody = await this.isVisible(this.articleBody);
    return hasTitle && hasBody;
  }
}
