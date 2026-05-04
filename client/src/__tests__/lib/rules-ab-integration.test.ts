import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getRulesForUser,
  applyVariantRules,
  analyzeVariantPerformance,
  createRulesABConfig,
  logRulePerformanceEvent,
  getRulePerformanceEvents,
  clearRulePerformanceEvents,
} from '@/lib/rules-ab-integration';
import type { Rule } from '@/lib/rules-engine';

// Mock ab-testing module
vi.mock('@/lib/ab-testing', () => ({
  getVariantForUser: (userId: string, experimentId: string) => {
    // Deterministic: odd user IDs get 'treatment', even get 'control'
    return parseInt(userId) % 2 === 0 ? 'control' : 'treatment';
  },
}));

describe('Rules A/B Integration', () => {
  const controlRule: Rule = {
    id: 'rule_control',
    name: 'Control Rule',
    priority: 100,
    enabled: true,
    conditions: [{ type: 'always_match' }],
    actions: [{ type: 'sort_articles', field: 'date', order: 'descending' }],
    metadata: { impressions: 0, clicks: 0, firing_count: 0 },
  };

  const treatmentRule: Rule = {
    id: 'rule_treatment',
    name: 'Treatment Rule',
    priority: 100,
    enabled: true,
    conditions: [{ type: 'always_match' }],
    actions: [{ type: 'boost_articles', field: 'category', value: 'AI', weight: 1.5 }],
    metadata: { impressions: 0, clicks: 0, firing_count: 0 },
  };

  beforeEach(() => {
    clearRulePerformanceEvents();
  });

  describe('getRulesForUser', () => {
    it('should return control rules for even user IDs', () => {
      const config = createRulesABConfig('test-exp', [controlRule], [treatmentRule]);
      const rules = getRulesForUser(config, '2');

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('rule_control');
    });

    it('should return treatment rules for odd user IDs', () => {
      const config = createRulesABConfig('test-exp', [controlRule], [treatmentRule]);
      const rules = getRulesForUser(config, '3');

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('rule_treatment');
    });

    it('should be deterministic for same user', () => {
      const config = createRulesABConfig('test-exp', [controlRule], [treatmentRule]);

      const rules1 = getRulesForUser(config, '1');
      const rules2 = getRulesForUser(config, '1');

      expect(rules1).toEqual(rules2);
    });

    it('should return empty array if variant not found', () => {
      const config = {
        experimentId: 'test-exp',
        variants: {} as Record<string, Rule[]>,
      };

      const rules = getRulesForUser(config, '1');

      expect(rules).toEqual([]);
    });
  });

  describe('applyVariantRules', () => {
    it('should enable specified rules for variant', () => {
      const rules = [controlRule, treatmentRule];
      const enabled = applyVariantRules(rules, 'variant-a', ['rule_control']);

      expect(enabled[0].enabled).toBe(true);
      expect(enabled[1].enabled).toBe(false);
    });

    it('should add variant_group metadata', () => {
      const rules = [controlRule];
      const result = applyVariantRules(rules, 'test-variant', [controlRule.id]);

      expect(result[0].metadata.variant_group).toBe('test-variant');
    });

    it('should handle empty enabled list', () => {
      const rules = [controlRule, treatmentRule];
      const result = applyVariantRules(rules, 'variant-b', []);

      expect(result.every((r) => !r.enabled)).toBe(true);
    });
  });

  describe('analyzeVariantPerformance', () => {
    it('should calculate CTR correctly', () => {
      const results = {
        control: { impressions: 100, clicks: 10 },
        treatment: { impressions: 100, clicks: 15 },
      };

      const analysis = analyzeVariantPerformance(results);

      expect(analysis.results.find((r) => r.name === 'control')?.ctr).toBe(10);
      expect(analysis.results.find((r) => r.name === 'treatment')?.ctr).toBe(15);
    });

    it('should identify winner with highest CTR', () => {
      const results = {
        control: { impressions: 100, clicks: 10 },
        treatment: { impressions: 100, clicks: 20 },
      };

      const analysis = analyzeVariantPerformance(results);

      expect(analysis.winner).toBe('treatment');
      expect(analysis.control).toBe('control');
    });

    it('should calculate CTR lift correctly', () => {
      const results = {
        control: { impressions: 100, clicks: 10 }, // 10% CTR
        treatment: { impressions: 100, clicks: 15 }, // 15% CTR
      };

      const analysis = analyzeVariantPerformance(results);

      // (15 - 10) / 10 = 50% lift
      expect(analysis.ctrLift).toBe('50.00');
    });

    it('should recommend rollout for significant lift', () => {
      const results = {
        control: { impressions: 100, clicks: 10 },
        treatment: { impressions: 100, clicks: 20 }, // 100% lift
      };

      const analysis = analyzeVariantPerformance(results);

      expect(analysis.recommendation).toContain('Roll out');
    });

    it('should recommend control for negative lift', () => {
      const results = {
        control: { impressions: 100, clicks: 20 }, // 20% CTR
        treatment: { impressions: 100, clicks: 10 }, // 10% CTR (50% lower)
      };

      const analysis = analyzeVariantPerformance(results);

      // Treatment has lower CTR, so control is the winner
      expect(analysis.winner).toBe('control');
      expect(analysis.recommendation).toContain('Roll out winner');
    });

    it('should recommend continue testing for marginal difference', () => {
      const results = {
        control: { impressions: 1000, clicks: 100 }, // 10% CTR
        treatment: { impressions: 1000, clicks: 102 }, // 10.2% CTR (2% lift, < 5%)
      };

      const analysis = analyzeVariantPerformance(results);

      expect(analysis.recommendation).toContain('Continue testing');
    });

    it('should handle zero impressions', () => {
      const results = {
        control: { impressions: 0, clicks: 0 },
        treatment: { impressions: 100, clicks: 10 },
      };

      const analysis = analyzeVariantPerformance(results);

      const controlResult = analysis.results.find((r) => r.name === 'control');
      expect(controlResult?.ctr).toBe(0);

      const treatmentResult = analysis.results.find((r) => r.name === 'treatment');
      expect(treatmentResult?.ctr).toBe(10);
    });
  });

  describe('createRulesABConfig', () => {
    it('should create config with control and treatment variants', () => {
      const config = createRulesABConfig('test-exp', [controlRule], [treatmentRule]);

      expect(config.experimentId).toBe('test-exp');
      expect(config.variants.control).toHaveLength(1);
      expect(config.variants.treatment).toHaveLength(1);
      expect(config.variants.control[0].id).toBe('rule_control');
      expect(config.variants.treatment[0].id).toBe('rule_treatment');
    });
  });

  describe('Performance event logging', () => {
    it('should log rule performance events', () => {
      const event = {
        ruleId: 'rule_1',
        userId: 'user_123',
        variant: 'control',
        event: 'fire' as const,
        timestamp: Date.now(),
      };

      logRulePerformanceEvent(event);
      const events = getRulePerformanceEvents();

      expect(events).toHaveLength(1);
      expect(events[0].ruleId).toBe('rule_1');
    });

    it('should log multiple events', () => {
      const event1 = {
        ruleId: 'rule_1',
        userId: 'user_1',
        event: 'fire' as const,
        timestamp: Date.now(),
      };

      const event2 = {
        ruleId: 'rule_2',
        userId: 'user_2',
        event: 'click' as const,
        timestamp: Date.now(),
      };

      logRulePerformanceEvent(event1);
      logRulePerformanceEvent(event2);

      const events = getRulePerformanceEvents();
      expect(events).toHaveLength(2);
    });

    it('should include engagement metrics', () => {
      const event = {
        ruleId: 'rule_1',
        userId: 'user_1',
        event: 'engagement' as const,
        timestamp: Date.now(),
        engagementMetrics: {
          scrollDepth: 0.8,
          readTime: 300,
          bookmarked: true,
        },
      };

      logRulePerformanceEvent(event);
      const events = getRulePerformanceEvents();

      expect(events[0].engagementMetrics?.scrollDepth).toBe(0.8);
      expect(events[0].engagementMetrics?.bookmarked).toBe(true);
    });

    it('should clear performance events', () => {
      logRulePerformanceEvent({
        ruleId: 'rule_1',
        userId: 'user_1',
        event: 'fire',
        timestamp: Date.now(),
      });

      clearRulePerformanceEvents();
      const events = getRulePerformanceEvents();

      expect(events).toHaveLength(0);
    });

    it('should keep only recent 1000 events', () => {
      // Log 1100 events
      for (let i = 0; i < 1100; i++) {
        logRulePerformanceEvent({
          ruleId: `rule_${i}`,
          userId: `user_${i}`,
          event: 'fire',
          timestamp: Date.now(),
        });
      }

      const events = getRulePerformanceEvents();
      expect(events.length).toBeLessThanOrEqual(1000);
    });
  });
});
