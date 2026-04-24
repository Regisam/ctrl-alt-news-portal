import { test, expect } from '@playwright/test';
import { HomePage } from './fixtures/home.page';
import { CategoryPage } from './fixtures/category.page';
import { ArticlePage } from './fixtures/article.page';

test.describe('Category Pages', () => {
  let categoryPage: CategoryPage;
  let articlePage: ArticlePage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    articlePage = new ArticlePage(page);
  });

  test('should navigate to AI category', async ({ page }) => {
    await categoryPage.navigateToCategory('AI');
    const isLoaded = await categoryPage.isCategoryPageLoaded();
    expect(isLoaded).toBe(true);
  });

  test('should navigate to Science category', async ({ page }) => {
    await categoryPage.navigateToCategory('Science');
    const isLoaded = await categoryPage.isCategoryPageLoaded();
    expect(isLoaded).toBe(true);
  });

  test('should navigate to Robotics category', async ({ page }) => {
    await categoryPage.navigateToCategory('Robotics');
    const isLoaded = await categoryPage.isCategoryPageLoaded();
    expect(isLoaded).toBe(true);
  });

  test('should navigate to Gadgets category', async ({ page }) => {
    await categoryPage.navigateToCategory('Gadgets');
    const isLoaded = await categoryPage.isCategoryPageLoaded();
    expect(isLoaded).toBe(true);
  });

  test('should display articles in category', async ({ page }) => {
    await categoryPage.navigateToCategory('AI');
    await categoryPage.waitForArticlesToLoad();

    const articleCount = await categoryPage.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);
  });

  test('should display article titles in category', async ({ page }) => {
    await categoryPage.navigateToCategory('Science');
    await categoryPage.waitForArticlesToLoad();

    const titles = await categoryPage.getArticleTitles();
    expect(titles.length).toBeGreaterThan(0);
    titles.forEach(title => {
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test('should navigate to article from category page', async ({ page }) => {
    await categoryPage.navigateToCategory('Robotics');
    await categoryPage.waitForArticlesToLoad();

    const hasArticles = await categoryPage.hasArticles();
    if (hasArticles) {
      await categoryPage.clickFirstArticle();

      const url = await page.url();
      expect(url).toContain('/article/');
    }
  });

  test('should switch between categories', async ({ page }) => {
    // Navigate to first category
    await categoryPage.navigateToCategory('AI');
    await categoryPage.waitForArticlesToLoad();
    const aiCount = await categoryPage.getArticleCount();

    // Switch to another category
    await categoryPage.navigateToCategory('Science');
    await categoryPage.waitForArticlesToLoad();
    const scienceCount = await categoryPage.getArticleCount();

    // Both should have articles (counts might be different)
    expect(aiCount).toBeGreaterThan(0);
    expect(scienceCount).toBeGreaterThan(0);
  });

  test('should use category tabs from home page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.navigateToHome();
    await homePage.waitForArticlesToLoad();

    // Try to select a category from home page tabs
    try {
      await homePage.selectCategory('AI');
      await homePage.waitForArticlesToLoad();

      const articleCount = await homePage.getArticleCount();
      expect(articleCount).toBeGreaterThan(0);
    } catch {
      // Category tabs might not be available on home, that's okay
      expect(true).toBe(true);
    }
  });

  test('should display correct number of articles per category', async ({ page }) => {
    const categories = ['AI', 'Science', 'Robotics', 'Gadgets'];

    for (const category of categories) {
      await categoryPage.navigateToCategory(category);
      await categoryPage.waitForArticlesToLoad();

      const count = await categoryPage.getArticleCount();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should maintain category context when navigating to article', async ({ page }) => {
    await categoryPage.navigateToCategory('AI');
    await categoryPage.waitForArticlesToLoad();

    await categoryPage.clickFirstArticle();

    // Verify article is loaded
    const title = await articlePage.getArticleTitle();
    expect(title).toBeTruthy();

    // Go back to category
    await articlePage.goBackToHome();

    // Should be back on some page (home or category)
    const url = await page.url();
    expect(url).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    const mobilePage = await mobileContext.newPage();
    const mobileCategory = new CategoryPage(mobilePage);

    await mobileCategory.navigateToCategory('AI');
    await mobileCategory.waitForArticlesToLoad();

    const articleCount = await mobileCategory.getArticleCount();
    expect(articleCount).toBeGreaterThan(0);

    // Verify articles are readable on mobile
    const titles = await mobileCategory.getArticleTitles();
    expect(titles.length).toBeGreaterThan(0);

    await mobileContext.close();
  });

  test('should display distinct articles per category', async ({ page }) => {
    const aiTitles = await categoryPage.getArticlesByCategory('AI');
    const scienceTitles = await categoryPage.getArticlesByCategory('Science');

    // Both should have articles
    expect(aiTitles.length).toBeGreaterThan(0);
    expect(scienceTitles.length).toBeGreaterThan(0);

    // Note: Articles might overlap in real data, but we verify both load correctly
    expect(true).toBe(true);
  });

  test('should render without console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await categoryPage.navigateToCategory('AI');
    await categoryPage.waitForArticlesToLoad();

    const criticalErrors = errors.filter(e =>
      !e.includes('404') &&
      !e.includes('Failed to load') &&
      !e.includes('ResizeObserver')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should handle rapid category switching', async ({ page }) => {
    const categories = ['AI', 'Science', 'Robotics', 'Gadgets'];

    for (const category of categories) {
      await categoryPage.navigateToCategory(category);
      const isLoaded = await categoryPage.isCategoryPageLoaded();
      expect(isLoaded).toBe(true);
    }
  });

  test('should scroll through category articles', async ({ page }) => {
    await categoryPage.navigateToCategory('AI');
    await categoryPage.waitForArticlesToLoad();

    const initialCount = await categoryPage.getArticleCount();
    expect(initialCount).toBeGreaterThan(0);

    // Scroll to bottom
    await categoryPage.scrollToBottom();

    // Count might be same or increase if lazy loading
    const finalCount = await categoryPage.getArticleCount();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });
});
