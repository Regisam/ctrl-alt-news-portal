import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.navigateToHome();
  });

  test('should load home page', async ({ page }) => {
    // Verify page title
    const title = await homePage.getPageTitle();
    expect(title).toBeTruthy();
    expect(title.toLowerCase()).toContain('ctrl alt');
  });

  test('should display header', async ({ page }) => {
    const headerVisible = await homePage.isHeaderVisible();
    expect(headerVisible).toBe(true);
  });

  test('should display articles', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    const articleCount = await homePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);
  });

  test('should display article titles', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    const titles = await homePage.getVisibleArticleTitles();
    expect(titles.length).toBeGreaterThan(0);
    titles.forEach(title => {
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test('should navigate to article on click', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    // Verify URL changed
    const url = await homePage.getPageUrl();
    expect(url).toContain('/article/');

    // Verify article content visible
    const content = await page.locator('main, article, [role="main"]').first();
    expect(await content.isVisible()).toBe(true);
  });

  test('should return to home from article', async ({ page }) => {
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    // Go back
    await homePage.goBack();

    // Verify we're back on home
    await homePage.waitForArticlesToLoad();
    const url = await homePage.getPageUrl();
    expect(url).toContain('localhost');
    expect(url).not.toContain('/article/');
  });

  test('should have correct viewport on desktop', async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(768);
  });

  test('should render without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    // Critical console errors should not exist
    const criticalErrors = errors.filter(e =>
      !e.includes('404') &&
      !e.includes('Failed to load') &&
      !e.includes('ResizeObserver')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should be responsive on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const mobileePage = await mobileContext.newPage();
    const mobileHomePage = new HomePage(mobileePage);

    await mobileHomePage.navigateToHome();
    await mobileHomePage.waitForArticlesToLoad();

    const articleCount = await mobileHomePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    await mobileContext.close();
  });
});
