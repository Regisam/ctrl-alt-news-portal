# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-time-feed.spec.ts >> Real-Time Feed & Notifications >> should be responsive on mobile
- Location: e2e/real-time-feed.spec.ts:220:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
  175 |     expect(initialCount).toBeGreaterThan(0);
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
> 231 |     expect(isLoaded).toBe(true);
      |                      ^ Error: expect(received).toBe(expected) // Object.is equality
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