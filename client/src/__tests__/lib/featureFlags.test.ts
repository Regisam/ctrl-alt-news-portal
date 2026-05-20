import { describe, it, expect, beforeEach } from 'vitest';
import {
  SerendipityFeatureFlag,
  DEFAULT_SERENDIPITY_FLAG,
  SERENDIPITY_PRESETS,
  SerendipityABTest,
  isUserEligibleForSerendipity,
  assignUserToVariant,
  getSerendipityWeightForUser,
  validateABTestConfig,
  SerendipityAnalytics,
} from '@shared/lib/featureFlags';

describe('Feature Flags & A/B Testing', () => {
  describe('SerendipityFeatureFlag', () => {
    it('should have disabled default flag', () => {
      expect(DEFAULT_SERENDIPITY_FLAG.enabled).toBe(false);
      expect(DEFAULT_SERENDIPITY_FLAG.rolloutPercentage).toBe(0);
    });

    it('should have all presets configured correctly', () => {
      expect(SERENDIPITY_PRESETS.disabled.enabled).toBe(false);
      expect(SERENDIPITY_PRESETS.disabled.rolloutPercentage).toBe(0);

      expect(SERENDIPITY_PRESETS.canary.enabled).toBe(true);
      expect(SERENDIPITY_PRESETS.canary.rolloutPercentage).toBe(5);

      expect(SERENDIPITY_PRESETS.beta.enabled).toBe(true);
      expect(SERENDIPITY_PRESETS.beta.rolloutPercentage).toBe(25);

      expect(SERENDIPITY_PRESETS.gradual.enabled).toBe(true);
      expect(SERENDIPITY_PRESETS.gradual.rolloutPercentage).toBe(50);

      expect(SERENDIPITY_PRESETS.full.enabled).toBe(true);
      expect(SERENDIPITY_PRESETS.full.rolloutPercentage).toBe(100);
    });

    it('should have correct weight ranges', () => {
      expect(DEFAULT_SERENDIPITY_FLAG.minSerendipityWeight).toBe(0.0);
      expect(DEFAULT_SERENDIPITY_FLAG.maxSerendipityWeight).toBe(0.3);
      expect(DEFAULT_SERENDIPITY_FLAG.defaultSerendipityWeight).toBe(0.15);
    });
  });

  describe('User Eligibility & Bucketing', () => {
    it('should return false when feature disabled', () => {
      const flag: SerendipityFeatureFlag = { ...DEFAULT_SERENDIPITY_FLAG, enabled: false };
      expect(isUserEligibleForSerendipity('user123', flag)).toBe(false);
    });

    it('should return false when rollout is 0%', () => {
      const flag: SerendipityFeatureFlag = {
        ...DEFAULT_SERENDIPITY_FLAG,
        enabled: true,
        rolloutPercentage: 0,
      };
      expect(isUserEligibleForSerendipity('user123', flag)).toBe(false);
    });

    it('should return true when rollout is 100%', () => {
      const flag: SerendipityFeatureFlag = {
        ...DEFAULT_SERENDIPITY_FLAG,
        enabled: true,
        rolloutPercentage: 100,
      };
      expect(isUserEligibleForSerendipity('user123', flag)).toBe(true);
      expect(isUserEligibleForSerendipity('user456', flag)).toBe(true);
    });

    it('should consistently assign same user to same bucket', () => {
      const flag: SerendipityFeatureFlag = {
        ...DEFAULT_SERENDIPITY_FLAG,
        enabled: true,
        rolloutPercentage: 50,
      };

      const userId = 'user_consistent_123';
      const result1 = isUserEligibleForSerendipity(userId, flag);
      const result2 = isUserEligibleForSerendipity(userId, flag);
      const result3 = isUserEligibleForSerendipity(userId, flag);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should distribute users across buckets for 50% rollout', () => {
      const flag: SerendipityFeatureFlag = {
        ...DEFAULT_SERENDIPITY_FLAG,
        enabled: true,
        rolloutPercentage: 50,
      };

      let includedCount = 0;
      const testCount = 100;

      for (let i = 0; i < testCount; i++) {
        if (isUserEligibleForSerendipity(`user_${i}`, flag)) {
          includedCount++;
        }
      }

      // Should be approximately 50% (allow 10% deviation)
      expect(includedCount).toBeGreaterThan(40);
      expect(includedCount).toBeLessThan(60);
    });

    it('should respect small rollout percentages', () => {
      const flag: SerendipityFeatureFlag = {
        ...DEFAULT_SERENDIPITY_FLAG,
        enabled: true,
        rolloutPercentage: 5,
      };

      let includedCount = 0;
      const testCount = 200;

      for (let i = 0; i < testCount; i++) {
        if (isUserEligibleForSerendipity(`user_${i}`, flag)) {
          includedCount++;
        }
      }

      // Should be approximately 5% (1-10 users out of 200)
      expect(includedCount).toBeGreaterThan(0);
      expect(includedCount).toBeLessThan(20);
    });
  });

  describe('A/B Test Variant Assignment', () => {
    let testConfig: SerendipityABTest;

    beforeEach(() => {
      testConfig = {
        enabled: true,
        testId: 'test-123',
        controlPercentage: 50,
        treatmentPercentage: 50,
        controlWeight: 0.0,
        treatmentWeight: 0.2,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };
    });

    it('should return unknown when test disabled', () => {
      testConfig.enabled = false;
      const variant = assignUserToVariant('user123', testConfig);
      expect(variant).toBe('unknown');
    });

    it('should return unknown when outside test window', () => {
      testConfig.startDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Future
      const variant = assignUserToVariant('user123', testConfig);
      expect(variant).toBe('unknown');

      testConfig.startDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 2 days ago
      testConfig.endDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const variant2 = assignUserToVariant('user123', testConfig);
      expect(variant2).toBe('unknown');
    });

    it('should assign to control or treatment group', () => {
      const variant1 = assignUserToVariant('user_control', testConfig);
      const variant2 = assignUserToVariant('user_treatment', testConfig);

      expect(['control', 'treatment', 'unknown']).toContain(variant1);
      expect(['control', 'treatment', 'unknown']).toContain(variant2);
    });

    it('should consistently assign same user to same variant', () => {
      const variant1 = assignUserToVariant('user_consistent', testConfig);
      const variant2 = assignUserToVariant('user_consistent', testConfig);
      const variant3 = assignUserToVariant('user_consistent', testConfig);

      expect(variant1).toBe(variant2);
      expect(variant2).toBe(variant3);
    });

    it('should distribute users across control/treatment with 50/50 split', () => {
      let controlCount = 0;
      let treatmentCount = 0;
      const testCount = 100;

      for (let i = 0; i < testCount; i++) {
        const variant = assignUserToVariant(`user_${i}`, testConfig);
        if (variant === 'control') controlCount++;
        if (variant === 'treatment') treatmentCount++;
      }

      // Should be approximately 50/50
      expect(controlCount).toBeGreaterThan(40);
      expect(treatmentCount).toBeGreaterThan(40);
      expect(controlCount + treatmentCount).toBeLessThanOrEqual(testCount);
    });

    it('should support uneven 70/30 split', () => {
      testConfig.controlPercentage = 70;
      testConfig.treatmentPercentage = 30;

      let controlCount = 0;
      let treatmentCount = 0;
      const testCount = 100;

      for (let i = 0; i < testCount; i++) {
        const variant = assignUserToVariant(`user_${i}`, testConfig);
        if (variant === 'control') controlCount++;
        if (variant === 'treatment') treatmentCount++;
      }

      expect(controlCount).toBeGreaterThan(treatmentCount);
    });
  });

  describe('Serendipity Weight for User', () => {
    let testConfig: SerendipityABTest;

    beforeEach(() => {
      testConfig = {
        enabled: true,
        testId: 'test-weights',
        controlPercentage: 50,
        treatmentPercentage: 50,
        controlWeight: 0.0,
        treatmentWeight: 0.2,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
    });

    it('should return 0.0 for control group', () => {
      // Assign user to control by finding one
      let controlUser = '';
      for (let i = 0; i < 1000; i++) {
        if (assignUserToVariant(`user_control_${i}`, testConfig) === 'control') {
          controlUser = `user_control_${i}`;
          break;
        }
      }

      const weight = getSerendipityWeightForUser(controlUser, testConfig);
      expect(weight).toBe(0.0);
    });

    it('should return 0.2 for treatment group', () => {
      // Assign user to treatment by finding one
      let treatmentUser = '';
      for (let i = 0; i < 1000; i++) {
        if (assignUserToVariant(`user_treatment_${i}`, testConfig) === 'treatment') {
          treatmentUser = `user_treatment_${i}`;
          break;
        }
      }

      const weight = getSerendipityWeightForUser(treatmentUser, testConfig);
      expect(weight).toBe(0.2);
    });

    it('should return 0.0 when test disabled', () => {
      testConfig.enabled = false;
      const weight = getSerendipityWeightForUser('any_user', testConfig);
      expect(weight).toBe(0.0);
    });

    it('should support custom control/treatment weights', () => {
      testConfig.controlWeight = 0.05;
      testConfig.treatmentWeight = 0.25;

      let controlUser = '';
      let treatmentUser = '';

      for (let i = 0; i < 1000; i++) {
        const variant = assignUserToVariant(`user_${i}`, testConfig);
        if (variant === 'control' && !controlUser) controlUser = `user_${i}`;
        if (variant === 'treatment' && !treatmentUser) treatmentUser = `user_${i}`;
      }

      expect(getSerendipityWeightForUser(controlUser, testConfig)).toBe(0.05);
      expect(getSerendipityWeightForUser(treatmentUser, testConfig)).toBe(0.25);
    });
  });

  describe('A/B Test Configuration Validation', () => {
    let validConfig: SerendipityABTest;

    beforeEach(() => {
      validConfig = {
        enabled: true,
        testId: 'test-valid',
        controlPercentage: 50,
        treatmentPercentage: 50,
        controlWeight: 0.0,
        treatmentWeight: 0.2,
        startDate: new Date(),
        endDate: new Date(Date.now() + 1000),
      };
    });

    it('should accept valid config', () => {
      expect(() => validateABTestConfig(validConfig)).not.toThrow();
    });

    it('should reject invalid controlWeight < 0', () => {
      validConfig.controlWeight = -0.1;
      expect(() => validateABTestConfig(validConfig)).toThrow(
        /Invalid controlWeight.*Must be in \[0, 1\]/
      );
    });

    it('should reject invalid controlWeight > 1', () => {
      validConfig.controlWeight = 1.5;
      expect(() => validateABTestConfig(validConfig)).toThrow(
        /Invalid controlWeight.*Must be in \[0, 1\]/
      );
    });

    it('should reject invalid treatmentWeight < 0', () => {
      validConfig.treatmentWeight = -0.1;
      expect(() => validateABTestConfig(validConfig)).toThrow(
        /Invalid treatmentWeight.*Must be in \[0, 1\]/
      );
    });

    it('should reject invalid treatmentWeight > 1', () => {
      validConfig.treatmentWeight = 1.5;
      expect(() => validateABTestConfig(validConfig)).toThrow(
        /Invalid treatmentWeight.*Must be in \[0, 1\]/
      );
    });

    it('should reject invalid controlPercentage < 0', () => {
      validConfig.controlPercentage = -10;
      expect(() => validateABTestConfig(validConfig)).toThrow(
        /Invalid controlPercentage.*Must be in \[0, 100\]/
      );
    });

    it('should reject invalid controlPercentage > 100', () => {
      validConfig.controlPercentage = 150;
      expect(() => validateABTestConfig(validConfig)).toThrow(
        /Invalid controlPercentage.*Must be in \[0, 100\]/
      );
    });

    it('should reject control + treatment > 100', () => {
      validConfig.controlPercentage = 60;
      validConfig.treatmentPercentage = 50;
      expect(() => validateABTestConfig(validConfig)).toThrow(/exceed 100/);
    });

    it('should accept control + treatment = 100', () => {
      validConfig.controlPercentage = 60;
      validConfig.treatmentPercentage = 40;
      expect(() => validateABTestConfig(validConfig)).not.toThrow();
    });

    it('should accept control + treatment < 100 (unmeasured group)', () => {
      validConfig.controlPercentage = 50;
      validConfig.treatmentPercentage = 30;
      expect(() => validateABTestConfig(validConfig)).not.toThrow();
    });

    it('should reject startDate >= endDate', () => {
      validConfig.startDate = new Date(1000);
      validConfig.endDate = new Date(500);
      expect(() => validateABTestConfig(validConfig)).toThrow(/startDate.*must be before endDate/);
    });

    it('should accept startDate = endDate - 1ms', () => {
      const start = new Date(1000);
      const end = new Date(1001);
      validConfig.startDate = start;
      validConfig.endDate = end;
      expect(() => validateABTestConfig(validConfig)).not.toThrow();
    });
  });

  describe('SerendipityAnalytics', () => {
    let analytics: SerendipityAnalytics;

    beforeEach(() => {
      analytics = new SerendipityAnalytics();
    });

    it('should record analytics events', () => {
      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art1',
        timestamp: new Date(),
        serendipityScore: 0.8,
        topicDistance: 0.7,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
      });

      const events = analytics.getAllEvents();
      expect(events).toHaveLength(1);
      expect(events[0].userId).toBe('user1');
      expect(events[0].articleId).toBe('art1');
    });

    it('should calculate discovery rate', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // 3 recommendations shown
      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art1',
        timestamp: now,
        serendipityScore: 0.8,
        topicDistance: 0.8, // > 0.6 = discovered
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
      });

      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art2',
        timestamp: now,
        serendipityScore: 0.6,
        topicDistance: 0.4, // < 0.6 = not discovered
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
      });

      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art3',
        timestamp: now,
        serendipityScore: 0.7,
        topicDistance: 0.7, // > 0.6 = discovered
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
      });

      const rate = analytics.getDiscoveryRate(oneHourAgo, new Date(now.getTime() + 1000));
      expect(rate).toBeCloseTo(2 / 3, 2); // 2 out of 3
    });

    it('should calculate cross-topic click rate', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Show article with high distance
      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art1',
        timestamp: now,
        serendipityScore: 0.8,
        topicDistance: 0.8,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'treatment',
      });

      // Click it
      analytics.recordEvent({
        userId: 'user1',
        event: 'article_clicked',
        articleId: 'art1',
        timestamp: new Date(now.getTime() + 1000),
        serendipityScore: 0.8,
        topicDistance: 0.8,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'treatment',
      });

      const rate = analytics.getCrossTopicClickRate(oneHourAgo, new Date(now.getTime() + 2000));
      expect(rate).toBe(1.0); // 1 click out of 1 shown
    });

    it('should calculate engagement metrics by variant', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Control group: 2 shows, 0 clicks
      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art1',
        timestamp: now,
        serendipityScore: 0.0,
        topicDistance: 0.3,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'control',
      });

      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art2',
        timestamp: now,
        serendipityScore: 0.0,
        topicDistance: 0.3,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'control',
      });

      // Treatment group: 2 shows, 1 click
      analytics.recordEvent({
        userId: 'user2',
        event: 'recommendation_shown',
        articleId: 'art3',
        timestamp: now,
        serendipityScore: 0.8,
        topicDistance: 0.8,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'treatment',
      });

      analytics.recordEvent({
        userId: 'user2',
        event: 'article_clicked',
        articleId: 'art3',
        timestamp: new Date(now.getTime() + 1000),
        serendipityScore: 0.8,
        topicDistance: 0.8,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'treatment',
      });

      analytics.recordEvent({
        userId: 'user2',
        event: 'recommendation_shown',
        articleId: 'art4',
        timestamp: now,
        serendipityScore: 0.8,
        topicDistance: 0.8,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'treatment',
      });

      const metrics = analytics.getEngagementMetricsByVariant(oneHourAgo, new Date(now.getTime() + 2000));

      expect(metrics.control.recommendations_shown).toBe(2);
      expect(metrics.control.articles_clicked).toBe(0);
      expect(metrics.control.ctr).toBe(0);

      expect(metrics.treatment.recommendations_shown).toBe(2);
      expect(metrics.treatment.articles_clicked).toBe(1);
      expect(metrics.treatment.ctr).toBe(0.5);
    });

    it('should handle bookmarks in analytics', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // First show recommendation
      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art1',
        timestamp: now,
        serendipityScore: 0.8,
        topicDistance: 0.8,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'unknown',
      });

      // Then bookmark it
      analytics.recordEvent({
        userId: 'user1',
        event: 'bookmark_created',
        articleId: 'art1',
        timestamp: new Date(now.getTime() + 500),
        serendipityScore: 0.8,
        topicDistance: 0.8,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
        variant: 'unknown',
      });

      const metrics = analytics.getEngagementMetricsByVariant(oneHourAgo, new Date(now.getTime() + 1000));
      expect(metrics.unknown.bookmarks).toBe(1);
      expect(metrics.unknown.recommendations_shown).toBe(1);
    });

    it('should clear all events', () => {
      analytics.recordEvent({
        userId: 'user1',
        event: 'recommendation_shown',
        articleId: 'art1',
        timestamp: new Date(),
        serendipityScore: 0.8,
        topicDistance: 0.7,
        collaborativeNovelty: 0.5,
        clickProbability: 0.6,
      });

      expect(analytics.getAllEvents()).toHaveLength(1);
      analytics.clear();
      expect(analytics.getAllEvents()).toHaveLength(0);
    });

    it('should handle empty events gracefully', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const discoveryRate = analytics.getDiscoveryRate(oneHourAgo, new Date(now.getTime() + 1000));
      expect(discoveryRate).toBe(0);

      const ctrRate = analytics.getCrossTopicClickRate(oneHourAgo, new Date(now.getTime() + 1000));
      expect(ctrRate).toBe(0);

      const metrics = analytics.getEngagementMetricsByVariant(oneHourAgo, new Date(now.getTime() + 1000));
      expect(metrics.control.ctr).toBe(0);
      expect(metrics.treatment.ctr).toBe(0);
    });
  });
});
