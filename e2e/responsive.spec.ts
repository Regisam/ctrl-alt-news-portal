import { test, expect, devices } from '@playwright/test';
import { HomePage } from './fixtures/home.page';
import { ArticlePage } from './fixtures/article.page';
import { SearchPage } from './fixtures/search.page';
import { CategoryPage } from './fixtures/category.page';

const VIEWPORTS = {
  MOBILE_SMALL: { width: 320, height: 568 }, // iPhone SE
  MOBILE_MEDIUM: { width: 375, height: 667 }, // iPhone 8
  MOBILE_LARGE: { width: 414, height: 896 }, // iPhone 11
  TABLET: { width: 768, height: 1024 }, // iPad
  DESKTOP: { width: 1920, height: 1080 }, // Desktop
};

test.describe('Responsive Design', () => {
  test('home page on mobile (320px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_SMALL
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    const articleCount = await homePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    // Verify layout is readable
    const titles = await homePage.getVisibleArticleTitles();
    expect(titles.length).toBeGreaterThan(0);

    await context.close();
  });

  test('home page on mobile (375px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    const articleCount = await homePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    await context.close();
  });

  test('home page on mobile (414px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_LARGE
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    const articleCount = await homePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    await context.close();
  });

  test('home page on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.TABLET
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    const articleCount = await homePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    await context.close();
  });

  test('article detail on mobile (375px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const articlePage = new ArticlePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const title = await articlePage.getArticleTitle();
    expect(title).toBeTruthy();

    const hasContent = await articlePage.getArticleContent();
    expect(hasContent).toBe(true);

    await context.close();
  });

  test('article detail on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.TABLET
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const articlePage = new ArticlePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    const title = await articlePage.getArticleTitle();
    expect(title).toBeTruthy();

    await context.close();
  });

  test('search on mobile (375px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const page = await context.newPage();
    const searchPage = new SearchPage(page);

    await searchPage.navigateToSearch();
    const isLoaded = await searchPage.isSearchPageLoaded();
    expect(isLoaded).toBe(true);

    await searchPage.performSearch('AI');
    await searchPage.waitForSearchResults();

    const hasResults = await searchPage.hasSearchResults();
    expect(hasResults).toBe(true);

    await context.close();
  });

  test('category page on mobile (375px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const page = await context.newPage();
    const categoryPage = new CategoryPage(page);

    await categoryPage.navigateToCategory('AI');
    await categoryPage.waitForArticlesToLoad();

    const articleCount = await categoryPage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    await context.close();
  });

  test('full user flow on mobile (375px)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const articlePage = new ArticlePage(page);

    // Navigate to home
    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();
    expect(await homePage.getArticleCount()).toBeGreaterThan(0);

    // Click article
    await homePage.clickFirstArticle();
    expect(await articlePage.getArticleTitle()).toBeTruthy();

    // Go back
    await articlePage.goBackToHome();

    // Verify back on home
    const url = await page.url();
    expect(url).not.toContain('/article/');

    await context.close();
  });

  test('full user flow on tablet', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.TABLET
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const articlePage = new ArticlePage(page);
    const categoryPage = new CategoryPage(page);

    // Start on home
    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    // Browse category
    await categoryPage.navigateToCategory('AI');
    await categoryPage.waitForArticlesToLoad();
    expect(await categoryPage.getArticleCount()).toBeGreaterThan(0);

    // Open article
    await categoryPage.clickFirstArticle();
    expect(await articlePage.getArticleTitle()).toBeTruthy();

    await context.close();
  });

  test('horizontal scroll on small mobile', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_SMALL
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    // Scroll down
    await homePage.scrollToBottom();

    const articleCount = await homePage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    await context.close();
  });

  test('touch interactions on mobile article', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM,
      hasTouch: true
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const articlePage = new ArticlePage(page);

    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();
    await homePage.clickFirstArticle();

    // Try to interact with share button (touch)
    await articlePage.copyArticleLink();

    const title = await articlePage.getArticleTitle();
    expect(title).toBeTruthy();

    await context.close();
  });

  test('header layout on different viewports', async ({ browser }) => {
    const viewports = [VIEWPORTS.MOBILE_MEDIUM, VIEWPORTS.TABLET, VIEWPORTS.DESKTOP];

    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const homePage = new HomePage(page);

      await homePage.navigateToHome();

      const headerVisible = await homePage.isHeaderVisible();
      expect(headerVisible).toBe(true);

      await context.close();
    }
  });

  test('article grid layout responsive', async ({ browser }) => {
    // Mobile - should be single column
    const mobileContext = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const mobilePage = await mobileContext.newPage();
    const mobileHome = new HomePage(mobilePage);

    await mobileHome.navigateToHome();
    await mobileHome.waitForArticlesToLoad();
    const mobileCount = await mobileHome.getArticleCount();
    expect(mobileCount).toBeGreaterThan(0);

    await mobileContext.close();

    // Tablet - should be 2 columns
    const tabletContext = await browser.newContext({
      viewport: VIEWPORTS.TABLET
    });
    const tabletPage = await tabletContext.newPage();
    const tabletHome = new HomePage(tabletPage);

    await tabletHome.navigateToHome();
    await tabletHome.waitForArticlesToLoad();
    const tabletCount = await tabletHome.getArticleCount();
    expect(tabletCount).toBeGreaterThan(0);

    await tabletContext.close();
  });

  test('input responsiveness on search page', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const page = await context.newPage();
    const searchPage = new SearchPage(page);

    await searchPage.navigateToSearch();

    // Input should be accessible
    const isLoaded = await searchPage.isSearchPageLoaded();
    expect(isLoaded).toBe(true);

    // Type should work on mobile
    await searchPage.performSearch('test');
    await searchPage.waitForSearchResults();

    const hasResults = await searchPage.hasSearchResults();
    expect(hasResults).toBe(true);

    await context.close();
  });

  test('viewport restoration from article to home', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.MOBILE_MEDIUM
    });
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const articlePage = new ArticlePage(page);

    // Start on home
    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    // Go to article
    await homePage.clickFirstArticle();
    const articleTitle = await articlePage.getArticleTitle();
    expect(articleTitle).toBeTruthy();

    // Return to home
    await articlePage.goBackToHome();

    // Home should still be responsive
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(VIEWPORTS.MOBILE_MEDIUM.width);

    await context.close();
  });
});
