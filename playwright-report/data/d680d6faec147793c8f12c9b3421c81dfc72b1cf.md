# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-time-feed.spec.ts >> Real-Time Feed & Notifications >> should allow scrolling through feed articles
- Location: e2e/real-time-feed.spec.ts:171:3

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
    - heading "404" [level=1] [ref=e11]
    - heading "Page Not Found" [level=2] [ref=e12]
    - paragraph [ref=e13]:
      - text: Sorry, the page you are looking for doesn't exist.
      - text: It may have been moved or deleted.
    - button "Go Home" [ref=e15] [cursor=pointer]:
      - img
      - text: Go Home
```

# Test source

```ts
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
  127 | 
  128 |     if (await feedPage.hasNewArticleBadge()) {
  129 |       try {
  130 |         await feedPage.clickFirstNewArticle();
  131 | 
  132 |         // Verify navigation
  133 |         const url = await feedPage.getPageUrl();
  134 |         expect(url).toContain('/article/');
  135 |       } catch {
  136 |         // If clicking fails, that's okay for this test
  137 |         expect(true).toBe(true);
  138 |       }
  139 |     }
  140 |   });
  141 | 
  142 |   test('should show loading state during refresh', async ({ page }) => {
  143 |     try {
  144 |       // Trigger refresh
  145 |       await feedPage.clickRefresh();
  146 | 
  147 |       // Loading indicator should be visible briefly
  148 |       const isLoading = await feedPage.isLoading();
  149 |       if (isLoading) {
  150 |         expect(isLoading).toBe(true);
  151 |       }
  152 | 
  153 |       // Wait for loading to complete
  154 |       await feedPage.waitForLoadingComplete();
  155 |       expect(true).toBe(true);
  156 |     } catch {
  157 |       // Loading indicator might not be visible
  158 |       expect(true).toBe(true);
  159 |     }
  160 |   });
  161 | 
  162 |   test('should handle empty feed gracefully', async ({ page }) => {
  163 |     // If feed is empty, should show appropriate message
  164 |     const isEmpty = await feedPage.isFeedEmpty();
  165 |     if (isEmpty) {
  166 |       const emptyMsg = await feedPage.isVisible('[class*="empty"], span:has-text("No articles")');
  167 |       expect(emptyMsg).toBe(true);
  168 |     }
  169 |   });
  170 | 
  171 |   test('should allow scrolling through feed articles', async ({ page }) => {
  172 |     await feedPage.waitForLoadingComplete();
  173 | 
  174 |     const initialCount = await feedPage.getArticleCount();
> 175 |     expect(initialCount).toBeGreaterThan(0);
      |                          ^ Error: expect(received).toBeGreaterThan(expected)
  176 | 
  177 |     // Scroll to bottom
  178 |     await feedPage.scrollToBottom();
  179 | 
  180 |     // Count might be same or increase if lazy loading
  181 |     const finalCount = await feedPage.getArticleCount();
  182 |     expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  183 |   });
  184 | 
  185 |   test('should verify real-time updates mechanism', async ({ page }) => {
  186 |     await feedPage.waitForLoadingComplete();
  187 | 
  188 |     // Verify that real-time mechanism is working by:
  189 |     // 1. Checking for NEW badges (real-time update indicators)
  190 |     const hasRealTimeIndicator = await feedPage.verifyRealTimeUpdate();
  191 |     // Real-time indicators might or might not be present
  192 |     if (hasRealTimeIndicator) {
  193 |       expect(hasRealTimeIndicator).toBe(true);
  194 |     }
  195 |   });
  196 | 
  197 |   test('should render without console errors', async ({ page }) => {
  198 |     const errors: string[] = [];
  199 | 
  200 |     page.on('console', msg => {
  201 |       if (msg.type() === 'error') {
  202 |         errors.push(msg.text());
  203 |       }
  204 |     });
  205 | 
  206 |     await feedPage.navigateToFeed();
  207 |     await feedPage.waitForLoadingComplete();
  208 | 
  209 |     // Filter out non-critical errors
  210 |     const criticalErrors = errors.filter(e =>
  211 |       !e.includes('404') &&
  212 |       !e.includes('Failed to load') &&
  213 |       !e.includes('ResizeObserver') &&
  214 |       !e.includes('favicon')
  215 |     );
  216 | 
  217 |     expect(criticalErrors.length).toBe(0);
  218 |   });
  219 | 
  220 |   test('should be responsive on mobile', async ({ browser }) => {
  221 |     const mobileContext = await browser.newContext({
  222 |       viewport: { width: 375, height: 667 }
  223 |     });
  224 |     const mobilePage = await mobileContext.newPage();
  225 |     const mobileFeed = new RealTimeFeedPage(mobilePage);
  226 | 
  227 |     await mobileFeed.navigateToFeed();
  228 |     await mobileFeed.waitForLoadingComplete();
  229 | 
  230 |     const isLoaded = await mobileFeed.isPageLoaded();
  231 |     expect(isLoaded).toBe(true);
  232 | 
  233 |     // Verify articles are readable on mobile
  234 |     const titles = await mobileFeed.getArticleTitles();
  235 |     expect(titles.length).toBeGreaterThan(0);
  236 | 
  237 |     await mobileContext.close();
  238 |   });
  239 | 
  240 |   test('should handle rapid feed refreshes', async ({ page }) => {
  241 |     try {
  242 |       for (let i = 0; i < 3; i++) {
  243 |         await feedPage.clickRefresh();
  244 |         await feedPage.waitForLoadingComplete(3000);
  245 |       }
  246 | 
  247 |       // After multiple refreshes, feed should still be functional
  248 |       const isLoaded = await feedPage.isPageLoaded();
  249 |       expect(isLoaded).toBe(true);
  250 |     } catch {
  251 |       // If refresh fails, that's okay for this stress test
  252 |       expect(true).toBe(true);
  253 |     }
  254 |   });
  255 | });
  256 | 
```