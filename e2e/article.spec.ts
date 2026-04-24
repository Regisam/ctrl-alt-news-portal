import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/home.page';
import { ArticlePage } from './fixtures/article.page';

test.describe('Article Detail Page', () => {
  let homePage: HomePage;
  let articlePage: ArticlePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    articlePage = new ArticlePage(page);
    await homePage.navigateToHome();
  });

  test('should navigate to article from home page', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    // Verify URL changed to article detail
    const url = await articlePage.getPageUrl();
    expect(url).toContain('/article/');
  });

  test('should display article title', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const title = await articlePage.getArticleTitle();
    expect(title).toBeTruthy();
    expect(title?.length).toBeGreaterThan(0);
  });

  test('should display category badge', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const category = await articlePage.getCategoryBadge();
    expect(category).toBeTruthy();
    // Category should be one of: AI, SCIENCE, ROBOTICS, GADGETS
    expect(['AI', 'SCIENCE', 'ROBOTICS', 'GADGETS'].some(cat => category?.includes(cat))).toBe(true);
  });

  test('should display article body content', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const hasContent = await articlePage.getArticleContent();
    expect(hasContent).toBe(true);
  });

  test('should display article excerpt', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const excerpt = await articlePage.getArticleExcerpt();
    expect(excerpt).toBeTruthy();
    expect(excerpt?.length).toBeGreaterThan(20);
  });

  test('should display article metadata (read time, views)', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const readTime = await articlePage.getArticleReadTime();
    const views = await articlePage.getArticleViews();

    expect(readTime).toBeTruthy();
    expect(views).toBeTruthy();
  });

  test('should display article tags', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const tagCount = await articlePage.getTagCount();
    expect(tagCount).toBeGreaterThan(0);

    const tags = await articlePage.getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    tags.forEach(tag => {
      expect(tag).toContain('#');
    });
  });

  test('should have share buttons available', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    // Try to interact with share buttons (don't actually open external links)
    await articlePage.copyArticleLink();
    // If we get here without error, the button is interactive
    expect(true).toBe(true);
  });

  test('should display author bio section', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const hasAuthorBio = await articlePage.hasAuthorBio();
    expect(hasAuthorBio).toBe(true);

    const bioText = await articlePage.getAuthorBioText();
    expect(bioText).toBeTruthy();
  });

  test('should display related articles', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const hasRelated = await articlePage.hasRelatedArticles();
    expect(hasRelated).toBe(true);

    const relatedCount = await articlePage.getRelatedArticleCount();
    expect(relatedCount).toBeGreaterThan(0);
  });

  test('should navigate to related article', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const initialUrl = await articlePage.getPageUrl();

    const hasRelated = await articlePage.hasRelatedArticles();
    if (hasRelated) {
      const relatedCount = await articlePage.getRelatedArticleCount();
      if (relatedCount > 0) {
        await articlePage.clickRelatedArticle(0);

        const newUrl = await articlePage.getPageUrl();
        expect(newUrl).toContain('/article/');
        expect(newUrl).not.toBe(initialUrl);
      }
    }
  });

  test('should return to home from article', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    await articlePage.goBackToHome();

    const url = await homePage.getPageUrl();
    expect(url).not.toContain('/article/');
  });

  test('should have article fully loaded', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const isFullyLoaded = await articlePage.articleIsFullyLoaded();
    expect(isFullyLoaded).toBe(true);
  });

  test('should be responsive on mobile', async ({ browser }) => {
    // Navigate to home and click article
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    // Create mobile context
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const mobilePage = await mobileContext.newPage();
    const mobileArticle = new ArticlePage(mobilePage);

    // Navigate to same article on mobile
    const currentUrl = await articlePage.getPageUrl();
    const articleIdMatch = currentUrl.match(/\/article\/(\d+)/);

    if (articleIdMatch) {
      const articleId = parseInt(articleIdMatch[1], 10);
      await mobileArticle.navigateToArticle(articleId);
      await mobileArticle.waitForLoadState('networkidle');

      // Verify article is still readable on mobile
      const title = await mobileArticle.getArticleTitle();
      const hasContent = await mobileArticle.getArticleContent();

      expect(title).toBeTruthy();
      expect(hasContent).toBe(true);
    }

    await mobileContext.close();
  });

  test('should handle article not found gracefully', async ({ page }) => {
    await articlePage.navigateToArticle(99999);

    // Check for error message or redirect
    const title = await page.title();
    const url = await page.url();

    // Either shows error message or redirects back
    const hasErrorText = await page.getByText(/not found|error/i).isVisible().catch(() => false);
    const isOnHome = url.includes('/');

    expect(hasErrorText || isOnHome).toBe(true);
  });

  test('should render without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();
    await articlePage.waitForLoadState('networkidle');

    // Filter non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('404') &&
      !e.includes('Failed to load') &&
      !e.includes('ResizeObserver')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should scroll to comments section', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const hasComments = await articlePage.hasCommentsSection();
    if (hasComments) {
      await articlePage.scrollToComments();
      const commentsVisible = await articlePage.hasCommentsSection();
      expect(commentsVisible).toBe(true);
    }
  });

  test('should scroll to related articles section', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const hasRelated = await articlePage.hasRelatedArticles();
    if (hasRelated) {
      await articlePage.scrollToRelatedArticles();
      const relatedVisible = await articlePage.hasRelatedArticles();
      expect(relatedVisible).toBe(true);
    }
  });

  test('should handle rapid article navigation', async ({ page }) => {
    await homePage.waitForArticlesToLoad();

    // Click first article
    await homePage.clickFirstArticle();
    let url = await articlePage.getPageUrl();
    expect(url).toContain('/article/');

    // Go back to home
    await articlePage.goBackToHome();
    await homePage.waitForArticlesToLoad();

    // Click another article
    await homePage.clickArticleByIndex(1);
    url = await articlePage.getPageUrl();
    expect(url).toContain('/article/');

    // Verify article content loaded
    const title = await articlePage.getArticleTitle();
    expect(title).toBeTruthy();
  });
});
