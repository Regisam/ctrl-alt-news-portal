import { Page } from '@playwright/test';
import { BasePage } from './base.page';

export class TopicRecommendationsPage extends BasePage {
  readonly pageTitle = 'h1:has-text("Topic Recommendations")';
  readonly variantSection = '[data-testid="variant-section"], section:has-text("Variant")';
  readonly variantName = '[data-testid="variant-name"], span:has-text("Serendipity")';
  readonly adoptionRateMetric = '[data-testid="adoption-rate"], span:has-text("%")';
  readonly ctrMetric = '[data-testid="ctr"], div:has-text("CTR")';
  readonly liftMetric = '[data-testid="cross-topic-lift"], div:has-text("lift")';
  readonly recommendedTopicCard = '[data-testid="recommended-topic"], [role="link"]:has-text("topic")';
  readonly adoptionChart = '[data-testid="adoption-chart"], svg';
  readonly statisticalSignificance = '[data-testid="p-value"], span:has-text("0.")';
  readonly winnerBadge = '[data-testid="winner-badge"], span:has-text("Winner")';
  readonly alertSection = '[data-testid="alerts"], section:has-text("Alert")';
  readonly lowAdoptionAlert = 'span:has-text("Low adoption")';
  readonly sharpDropAlert = 'span:has-text("Sharp")';

  constructor(page: Page) {
    super(page);
  }

  async navigateToMonitoring() {
    await this.goto('/monitoring/topic-recommendations');
  }

  async isPageLoaded(): Promise<boolean> {
    return await this.isVisible(this.pageTitle);
  }

  async getVariantCount(): Promise<number> {
    const variants = this.page.locator(this.variantSection);
    return await variants.count();
  }

  async getVariantNames(): Promise<string[]> {
    const variants = this.page.locator(this.variantName);
    const count = await variants.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await variants.nth(i).textContent();
      if (name) {
        names.push(name.trim());
      }
    }

    return names;
  }

  async clickRecommendedTopic(index: number = 0) {
    const topics = this.page.locator(this.recommendedTopicCard);
    if (await topics.nth(index).isVisible({ timeout: 2000 }).catch(() => false)) {
      await topics.nth(index).click();
      await this.waitForLoadState('networkidle');
    }
  }

  async getAdoptionRates(): Promise<number[]> {
    const rates = this.page.locator(this.adoptionRateMetric);
    const count = await rates.count();
    const values: number[] = [];

    for (let i = 0; i < count; i++) {
      const text = await rates.nth(i).textContent();
      if (text) {
        const match = text.match(/(\d+\.?\d*)/);
        if (match) {
          values.push(parseFloat(match[1]));
        }
      }
    }

    return values;
  }

  async getCTRMetrics(): Promise<number[]> {
    const ctrs = this.page.locator(this.ctrMetric);
    const count = await ctrs.count();
    const values: number[] = [];

    for (let i = 0; i < count; i++) {
      const text = await ctrs.nth(i).textContent();
      if (text) {
        const match = text.match(/(\d+\.?\d*)/);
        if (match) {
          values.push(parseFloat(match[1]));
        }
      }
    }

    return values;
  }

  async getCrossTopicLift(): Promise<number[]> {
    const lifts = this.page.locator(this.liftMetric);
    const count = await lifts.count();
    const values: number[] = [];

    for (let i = 0; i < count; i++) {
      const text = await lifts.nth(i).textContent();
      if (text) {
        const match = text.match(/(\d+\.?\d*)/);
        if (match) {
          values.push(parseFloat(match[1]));
        }
      }
    }

    return values;
  }

  async hasAdoptionChart(): Promise<boolean> {
    return await this.isVisible(this.adoptionChart);
  }

  async hasStatisticalSignificance(): Promise<boolean> {
    return await this.isVisible(this.statisticalSignificance);
  }

  async isWinnerIdentified(): Promise<boolean> {
    return await this.isVisible(this.winnerBadge);
  }

  async getWinnerVariant(): Promise<string | null> {
    const winner = this.page.locator(this.winnerBadge).locator('..').locator('span').first();
    if (await this.isVisible(this.winnerBadge)) {
      return await winner.textContent();
    }
    return null;
  }

  async hasAlerts(): Promise<boolean> {
    return await this.isVisible(this.alertSection);
  }

  async hasLowAdoptionAlert(): Promise<boolean> {
    return await this.isVisible(this.lowAdoptionAlert);
  }

  async hasSharpDropAlert(): Promise<boolean> {
    return await this.isVisible(this.sharpDropAlert);
  }

  async getAlertMessages(): Promise<string[]> {
    const alerts = this.page.locator(this.alertSection).locator('div[role="alert"], [class*="alert"]');
    const count = await alerts.count();
    const messages: string[] = [];

    for (let i = 0; i < count; i++) {
      const msg = await alerts.nth(i).textContent();
      if (msg) {
        messages.push(msg.trim());
      }
    }

    return messages;
  }

  async selectDateRange(startDate: string, endDate: string) {
    const dateInputs = this.page.locator('input[type="date"]');
    if (await dateInputs.nth(0).isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInputs.nth(0).fill(startDate);
      await dateInputs.nth(1).fill(endDate);
      await this.waitForLoadState('networkidle');
    }
  }

  async scrollToMetrics() {
    const metrics = this.page.locator(this.variantSection).first();
    if (await metrics.isVisible().catch(() => false)) {
      await metrics.scrollIntoViewIfNeeded();
    }
  }

  async verifyA2BTestVariantAssignment(): Promise<boolean> {
    const variants = await this.getVariantNames();
    // Should have multiple variants for A/B test
    return variants.length >= 2;
  }
}
