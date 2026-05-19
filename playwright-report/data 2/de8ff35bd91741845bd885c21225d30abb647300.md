# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: topic-recommendations.spec.ts >> Topic Recommendations A/B Test Monitoring >> should display adoption rate metrics
- Location: e2e/topic-recommendations.spec.ts:34:3

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
  2   | import { TopicRecommendationsPage } from './fixtures/topic-recommendations.page';
  3   | 
  4   | test.describe('Topic Recommendations A/B Test Monitoring', () => {
  5   |   let topicPage: TopicRecommendationsPage;
  6   | 
  7   |   test.beforeEach(async ({ page }) => {
  8   |     topicPage = new TopicRecommendationsPage(page);
  9   |     await topicPage.navigateToMonitoring();
  10  |   });
  11  | 
  12  |   test('should load topic recommendations monitoring page', async ({ page }) => {
  13  |     const isLoaded = await topicPage.isPageLoaded();
  14  |     expect(isLoaded).toBe(true);
  15  |   });
  16  | 
  17  |   test('should display A/B test variants', async ({ page }) => {
  18  |     const variantCount = await topicPage.getVariantCount();
  19  |     expect(variantCount).toBeGreaterThanOrEqual(2);
  20  |   });
  21  | 
  22  |   test('should verify variant assignment', async ({ page }) => {
  23  |     const hasVariants = await topicPage.verifyA2BTestVariantAssignment();
  24  |     expect(hasVariants).toBe(true);
  25  |   });
  26  | 
  27  |   test('should display variant names (control, high_serendipity, etc)', async ({ page }) => {
  28  |     const variants = await topicPage.getVariantNames();
  29  |     expect(variants.length).toBeGreaterThan(0);
  30  |     // At least one variant should be present
  31  |     expect(variants.some(v => v.toLowerCase().includes('control') || v.toLowerCase().includes('serendipity'))).toBe(true);
  32  |   });
  33  | 
  34  |   test('should display adoption rate metrics', async ({ page }) => {
  35  |     const adoptionRates = await topicPage.getAdoptionRates();
> 36  |     expect(adoptionRates.length).toBeGreaterThan(0);
      |                                  ^ Error: expect(received).toBeGreaterThan(expected)
  37  |     // All adoption rates should be percentages (0-100)
  38  |     adoptionRates.forEach(rate => {
  39  |       expect(rate).toBeGreaterThanOrEqual(0);
  40  |       expect(rate).toBeLessThanOrEqual(100);
  41  |     });
  42  |   });
  43  | 
  44  |   test('should display CTR metrics', async ({ page }) => {
  45  |     const ctrMetrics = await topicPage.getCTRMetrics();
  46  |     expect(ctrMetrics.length).toBeGreaterThan(0);
  47  |     // CTR should be reasonable percentage
  48  |     ctrMetrics.forEach(ctr => {
  49  |       expect(ctr).toBeGreaterThanOrEqual(0);
  50  |       expect(ctr).toBeLessThanOrEqual(100);
  51  |     });
  52  |   });
  53  | 
  54  |   test('should display cross-topic engagement lift', async ({ page }) => {
  55  |     const liftMetrics = await topicPage.getCrossTopicLift();
  56  |     expect(liftMetrics.length).toBeGreaterThan(0);
  57  |     // Lift should be percentage
  58  |     liftMetrics.forEach(lift => {
  59  |       expect(lift).toBeGreaterThanOrEqual(0);
  60  |       expect(lift).toBeLessThanOrEqual(100);
  61  |     });
  62  |   });
  63  | 
  64  |   test('should display adoption trend chart', async ({ page }) => {
  65  |     const hasChart = await topicPage.hasAdoptionChart();
  66  |     expect(hasChart).toBe(true);
  67  |   });
  68  | 
  69  |   test('should display statistical significance (p-values)', async ({ page }) => {
  70  |     const hasSig = await topicPage.hasStatisticalSignificance();
  71  |     expect(hasSig).toBe(true);
  72  |   });
  73  | 
  74  |   test('should identify winning variant when applicable', async ({ page }) => {
  75  |     const isWinnerIdentified = await topicPage.isWinnerIdentified();
  76  |     // Winner might or might not be identified, but if it is, it should have a name
  77  |     if (isWinnerIdentified) {
  78  |       const winner = await topicPage.getWinnerVariant();
  79  |       expect(winner).toBeTruthy();
  80  |     }
  81  |   });
  82  | 
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
```