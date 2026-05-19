# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: topic-recommendations.spec.ts >> Topic Recommendations A/B Test Monitoring >> should display engagement lift metrics for cross-topic recommendations
- Location: e2e/topic-recommendations.spec.ts:181:3

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
  83  |   test('should handle monitoring alerts', async ({ page }) => {
  84  |     const hasAlerts = await topicPage.hasAlerts();
  85  |     // Alerts section might or might not be present
  86  |     if (hasAlerts) {
  87  |       const messages = await topicPage.getAlertMessages();
  88  |       expect(messages.length).toBeGreaterThanOrEqual(0);
  89  |     }
  90  |   });
  91  | 
  92  |   test('should detect low adoption alerts if applicable', async ({ page }) => {
  93  |     const hasLowAdoptionAlert = await topicPage.hasLowAdoptionAlert();
  94  |     // Low adoption alert might or might not be present depending on actual metrics
  95  |     if (hasLowAdoptionAlert) {
  96  |       expect(true).toBe(true);
  97  |     }
  98  |   });
  99  | 
  100 |   test('should handle date range filtering', async ({ page }) => {
  101 |     try {
  102 |       await topicPage.selectDateRange('2026-05-01', '2026-05-18');
  103 |       await topicPage.waitForLoadState('networkidle');
  104 | 
  105 |       // Verify page is still loaded with new date range
  106 |       const isLoaded = await topicPage.isPageLoaded();
  107 |       expect(isLoaded).toBe(true);
  108 |     } catch {
  109 |       // Date filtering might not be available, that's okay
  110 |       expect(true).toBe(true);
  111 |     }
  112 |   });
  113 | 
  114 |   test('should allow clicking on recommended topics', async ({ page }) => {
  115 |     await topicPage.scrollToMetrics();
  116 | 
  117 |     try {
  118 |       // Try to click a recommended topic
  119 |       await topicPage.clickRecommendedTopic(0);
  120 | 
  121 |       // Verify navigation occurred
  122 |       const url = await topicPage.getPageUrl();
  123 |       expect(url).toBeTruthy();
  124 |     } catch {
  125 |       // Recommended topics might not be available, that's okay
  126 |       expect(true).toBe(true);
  127 |     }
  128 |   });
  129 | 
  130 |   test('should render without console errors', async ({ page }) => {
  131 |     const errors: string[] = [];
  132 | 
  133 |     page.on('console', msg => {
  134 |       if (msg.type() === 'error') {
  135 |         errors.push(msg.text());
  136 |       }
  137 |     });
  138 | 
  139 |     await topicPage.navigateToMonitoring();
  140 |     await topicPage.isPageLoaded();
  141 | 
  142 |     // Filter out non-critical errors
  143 |     const criticalErrors = errors.filter(e =>
  144 |       !e.includes('404') &&
  145 |       !e.includes('Failed to load') &&
  146 |       !e.includes('ResizeObserver') &&
  147 |       !e.includes('favicon')
  148 |     );
  149 | 
  150 |     expect(criticalErrors.length).toBe(0);
  151 |   });
  152 | 
  153 |   test('should be responsive on mobile', async ({ browser }) => {
  154 |     const mobileContext = await browser.newContext({
  155 |       viewport: { width: 375, height: 667 }
  156 |     });
  157 |     const mobilePage = await mobileContext.newPage();
  158 |     const mobileTopicPage = new TopicRecommendationsPage(mobilePage);
  159 | 
  160 |     await mobileTopicPage.navigateToMonitoring();
  161 |     const isLoaded = await mobileTopicPage.isPageLoaded();
  162 |     expect(isLoaded).toBe(true);
  163 | 
  164 |     // Verify content is readable on mobile
  165 |     const variants = await mobileTopicPage.getVariantNames();
  166 |     expect(variants.length).toBeGreaterThan(0);
  167 | 
  168 |     await mobileContext.close();
  169 |   });
  170 | 
  171 |   test('should track A/B test adoption metrics over time', async ({ page }) => {
  172 |     // Verify adoption rates are tracked
  173 |     const initialRates = await topicPage.getAdoptionRates();
  174 |     expect(initialRates.length).toBeGreaterThan(0);
  175 | 
  176 |     // All variants should have adoption rate
  177 |     const variantCount = await topicPage.getVariantCount();
  178 |     expect(initialRates.length).toBeGreaterThanOrEqual(variantCount);
  179 |   });
  180 | 
  181 |   test('should display engagement lift metrics for cross-topic recommendations', async ({ page }) => {
  182 |     const liftMetrics = await topicPage.getCrossTopicLift();
> 183 |     expect(liftMetrics.length).toBeGreaterThan(0);
      |                                ^ Error: expect(received).toBeGreaterThan(expected)
  184 | 
  185 |     // Verify lift is measured (should be > 0 for successful serendipity)
  186 |     const hasPositiveLift = liftMetrics.some(lift => lift > 0);
  187 |     expect(hasPositiveLift).toBe(true);
  188 |   });
  189 | });
  190 | 
```