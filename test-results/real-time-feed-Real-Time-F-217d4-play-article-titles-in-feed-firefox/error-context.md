# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-time-feed.spec.ts >> Real-Time Feed & Notifications >> should display article titles in feed
- Location: e2e/real-time-feed.spec.ts:23:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e5]:
    - img [ref=e9]
    - heading "404" [level=1] [ref=e13]
    - heading "Page Not Found" [level=2] [ref=e14]
    - paragraph [ref=e15]:
      - text: Sorry, the page you are looking for doesn't exist.
      - text: It may have been moved or deleted.
    - button "Go Home" [ref=e17] [cursor=pointer]:
      - img
      - text: Go Home
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { RealTimeFeedPage } from './fixtures/real-time-feed.page';
  3   | 
  4   | test.describe('Real-Time Feed & Notifications', () => {
  5   |   let feedPage: RealTimeFeedPage;
  6   | 
  7   |   test.beforeEach(async ({ page }) => {
  8   |     feedPage = new RealTimeFeedPage(page);
  9   |     await feedPage.navigateToFeed();
  10  |   });
  11  | 
  12  |   test('should load real-time feed page', async ({ page }) => {
  13  |     const isLoaded = await feedPage.isPageLoaded();
  14  |     expect(isLoaded).toBe(true);
  15  |   });
  16  | 
  17  |   test('should display articles in feed', async ({ page }) => {
  18  |     await feedPage.waitForLoadingComplete();
  19  |     const articleCount = await feedPage.getArticleCount();
  20  |     expect(articleCount).toBeGreaterThan(0);
  21  |   });
  22  | 
  23  |   test('should display article titles in feed', async ({ page }) => {
  24  |     await feedPage.waitForLoadingComplete();
  25  |     const titles = await feedPage.getArticleTitles();
> 26  |     expect(titles.length).toBeGreaterThan(0);
      |                           ^ Error: expect(received).toBeGreaterThan(expected)
  27  |     titles.forEach(title => {
  28  |       expect(title.length).toBeGreaterThan(0);
  29  |     });
  30  |   });
  31  | 
  32  |   test('should display feed timestamps', async ({ page }) => {
  33  |     await feedPage.waitForLoadingComplete();
  34  |     const latestTime = await feedPage.getLatestArticleTime();
  35  |     expect(latestTime).toBeTruthy();
  36  |   });
  37  | 
  38  |   test('should navigate to article from feed', async ({ page }) => {
  39  |     await feedPage.waitForLoadingComplete();
  40  |     const initialCount = await feedPage.getArticleCount();
  41  | 
  42  |     if (initialCount > 0) {
  43  |       // Click first article
  44  |       const firstArticle = page.locator('[data-testid="feed-article"], article').first();
  45  |       if (await firstArticle.isVisible({ timeout: 2000 }).catch(() => false)) {
  46  |         await firstArticle.click();
  47  | 
  48  |         // Verify URL changed to article detail
  49  |         const url = await feedPage.getPageUrl();
  50  |         expect(url).toContain('/article/');
  51  |       }
  52  |     }
  53  |   });
  54  | 
  55  |   test('should have refresh button to fetch new articles', async ({ page }) => {
  56  |     // Try to click refresh
  57  |     try {
  58  |       await feedPage.clickRefresh();
  59  |       await feedPage.waitForLoadingComplete();
  60  | 
  61  |       // Verify page is still loaded
  62  |       const isLoaded = await feedPage.isPageLoaded();
  63  |       expect(isLoaded).toBe(true);
  64  |     } catch {
  65  |       // Refresh button might not be available
  66  |       expect(true).toBe(true);
  67  |     }
  68  |   });
  69  | 
  70  |   test('should support auto-refresh toggle', async ({ page }) => {
  71  |     try {
  72  |       // Get initial state
  73  |       const initialState = await feedPage.isAutoRefreshEnabled();
  74  | 
  75  |       // Toggle auto-refresh
  76  |       await feedPage.toggleAutoRefresh();
  77  | 
  78  |       // Verify toggle state changed
  79  |       const newState = await feedPage.isAutoRefreshEnabled();
  80  |       expect(newState).not.toBe(initialState);
  81  |     } catch {
  82  |       // Auto-refresh toggle might not be available
  83  |       expect(true).toBe(true);
  84  |     }
  85  |   });
  86  | 
  87  |   test('should display notification bell', async ({ page }) => {
  88  |     // Notification bell should be visible for enabling notifications
  89  |     try {
  90  |       await feedPage.clickNotificationBell();
  91  |       await page.waitForTimeout(300);
  92  |       expect(true).toBe(true);
  93  |     } catch {
  94  |       // Notification bell might not be available
  95  |       expect(true).toBe(true);
  96  |     }
  97  |   });
  98  | 
  99  |   test('should handle notification state', async ({ page }) => {
  100 |     try {
  101 |       // Enable notifications if available
  102 |       await feedPage.enableNotifications();
  103 | 
  104 |       // Check if notification was shown
  105 |       await page.waitForTimeout(500);
  106 |       expect(true).toBe(true);
  107 |     } catch {
  108 |       // Notifications might not be available
  109 |       expect(true).toBe(true);
  110 |     }
  111 |   });
  112 | 
  113 |   test('should detect new articles with NEW badge', async ({ page }) => {
  114 |     await feedPage.waitForLoadingComplete();
  115 | 
  116 |     // Check if any NEW badges are visible (would indicate new articles)
  117 |     const hasNewArticles = await feedPage.hasNewArticleBadge();
  118 |     // NEW badge might or might not be present depending on data
  119 |     if (hasNewArticles) {
  120 |       const newCount = await feedPage.getNewArticleCount();
  121 |       expect(newCount).toBeGreaterThan(0);
  122 |     }
  123 |   });
  124 | 
  125 |   test('should navigate to new articles', async ({ page }) => {
  126 |     await feedPage.waitForLoadingComplete();
```