# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: topic-recommendations.spec.ts >> Topic Recommendations A/B Test Monitoring >> should display adoption trend chart
- Location: e2e/topic-recommendations.spec.ts:64:3

# Error details

```
Error: locator.isVisible: Error: strict mode violation: locator('[data-testid="adoption-chart"], svg') resolved to 2 elements:
    1) <svg width="24" height="24" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" data-loc="client/src/pages/NotFound.tsx:20" class="lucide lucide-circle-alert relative h-16 w-16 text-red-500">…</svg> aka getByRole('img').first()
    2) <svg width="24" height="24" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" class="lucide lucide-house w-4 h-4 mr-2" data-loc="client/src/pages/NotFound.tsx:41">…</svg> aka getByRole('button', { name: 'Go Home' })

Call log:
    - checking visibility of locator('[data-testid="adoption-chart"], svg')

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
  1  | import { Page, expect } from '@playwright/test';
  2  | 
  3  | export class BasePage {
  4  |   readonly page: Page;
  5  | 
  6  |   constructor(page: Page) {
  7  |     this.page = page;
  8  |   }
  9  | 
  10 |   async goto(path: string = '/') {
  11 |     await this.page.goto(path);
  12 |     await this.page.waitForLoadState('networkidle');
  13 |   }
  14 | 
  15 |   async getPageTitle(): Promise<string> {
  16 |     return await this.page.title();
  17 |   }
  18 | 
  19 |   async getPageUrl(): Promise<string> {
  20 |     return this.page.url();
  21 |   }
  22 | 
  23 |   async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load') {
  24 |     await this.page.waitForLoadState(state);
  25 |   }
  26 | 
  27 |   async click(selector: string) {
  28 |     await this.page.click(selector);
  29 |   }
  30 | 
  31 |   async fill(selector: string, text: string) {
  32 |     await this.page.fill(selector, text);
  33 |   }
  34 | 
  35 |   async type(selector: string, text: string) {
  36 |     await this.page.locator(selector).type(text);
  37 |   }
  38 | 
  39 |   async press(key: string) {
  40 |     await this.page.keyboard.press(key);
  41 |   }
  42 | 
  43 |   async isVisible(selector: string): Promise<boolean> {
> 44 |     return await this.page.locator(selector).isVisible();
     |                                              ^ Error: locator.isVisible: Error: strict mode violation: locator('[data-testid="adoption-chart"], svg') resolved to 2 elements:
  45 |   }
  46 | 
  47 |   async getText(selector: string): Promise<string | null> {
  48 |     return await this.page.locator(selector).textContent();
  49 |   }
  50 | 
  51 |   async getAttribute(selector: string, attribute: string): Promise<string | null> {
  52 |     return await this.page.locator(selector).getAttribute(attribute);
  53 |   }
  54 | 
  55 |   async waitForSelector(selector: string, timeout = 5000) {
  56 |     await this.page.waitForSelector(selector, { timeout });
  57 |   }
  58 | 
  59 |   async waitForNavigation() {
  60 |     await this.page.waitForNavigation();
  61 |   }
  62 | 
  63 |   async reload() {
  64 |     await this.page.reload();
  65 |   }
  66 | 
  67 |   async goBack() {
  68 |     await this.page.goBack();
  69 |   }
  70 | 
  71 |   async goForward() {
  72 |     await this.page.goForward();
  73 |   }
  74 | 
  75 |   async close() {
  76 |     await this.page.close();
  77 |   }
  78 | 
  79 |   async captureScreenshot(name: string) {
  80 |     await this.page.screenshot({ path: `screenshots/${name}.png` });
  81 |   }
  82 | }
  83 | 
```