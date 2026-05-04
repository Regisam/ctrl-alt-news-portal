import { getUserVariant } from './ab-testing';
import type { Rule } from './rules-engine';

/**
 * Rules A/B Testing Integration
 * Enables A/B testing of different rule sets and rule configurations
 */

export interface RulesABConfig {
  experimentId: string;
  variants: {
    [variantName: string]: Rule[];
  };
}

/**
 * Get rules for user based on their A/B test assignment
 * @param config A/B test configuration with rule variants
 * @param userId Unique user identifier (for deterministic assignment)
 * @returns Rules assigned to user's variant
 */
export function getRulesForUser(config: RulesABConfig, userId: string): Rule[] {
  const variant = getUserVariant(userId, config.experimentId);
  return config.variants[variant || ''] || Object.values(config.variants)[0] || [];
}

/**
 * Enable/disable rules based on A/B test variant
 * Useful for gradual rollouts of new rules
 * @param rules Base rules to modify
 * @param variant Variant name
 * @param enabledRuleIds Rule IDs to enable for this variant
 * @returns Modified rules
 */
export function applyVariantRules(
  rules: Rule[],
  variant: string,
  enabledRuleIds: string[]
): Rule[] {
  return rules.map((rule) => ({
    ...rule,
    enabled: enabledRuleIds.includes(rule.id),
    metadata: {
      ...rule.metadata,
      variant_group: variant,
    },
  }));
}

/**
 * Compare rule performance across A/B test variants
 * @param variantResults Performance metrics per variant
 * @returns Winner analysis with confidence estimates
 */
export function analyzeVariantPerformance(
  variantResults: Record<
    string,
    {
      impressions: number;
      clicks: number;
      conversionCount?: number;
      engagementScore?: number;
    }
  >
) {
  const variants = Object.entries(variantResults).map(([name, data]) => {
    const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
    const conversionRate = data.conversionCount && data.impressions > 0
      ? (data.conversionCount / data.impressions) * 100
      : 0;

    return {
      name,
      ctr,
      conversionRate,
      impressions: data.impressions,
      clicks: data.clicks,
      engagementScore: data.engagementScore || 0,
    };
  });

  // Sort by CTR to find potential winner
  const sorted = [...variants].sort((a, b) => b.ctr - a.ctr);
  const winner = sorted[0];
  const control = sorted[sorted.length - 1];

  const ctrLift = control.ctr > 0
    ? ((winner.ctr - control.ctr) / control.ctr) * 100
    : 0;

  return {
    winner: winner.name,
    control: control.name,
    ctrLift: ctrLift.toFixed(2),
    results: sorted,
    recommendation: ctrLift > 5 ? 'Roll out winner' : ctrLift < -5 ? 'Stick with control' : 'Continue testing',
  };
}

/**
 * Create A/B test configuration for rules
 * Useful for testing new rule variants
 */
export function createRulesABConfig(
  experimentId: string,
  controlRules: Rule[],
  treatmentRules: Rule[]
): RulesABConfig {
  return {
    experimentId,
    variants: {
      control: controlRules,
      treatment: treatmentRules,
    },
  };
}

/**
 * Track rule performance for A/B analysis
 * Should be called when rule fires and when recommendation is clicked
 */
export interface RulePerformanceEvent {
  ruleId: string;
  userId: string;
  variant?: string;
  event: 'fire' | 'impression' | 'click' | 'engagement';
  timestamp: number;
  engagementMetrics?: {
    scrollDepth?: number;
    readTime?: number;
    bookmarked?: boolean;
  };
}

const RULE_PERF_KEY = 'ctrl-alt-rule-performance';

export function logRulePerformanceEvent(event: RulePerformanceEvent): void {
  try {
    const stored = localStorage.getItem(RULE_PERF_KEY);
    const events = stored ? JSON.parse(stored) : [];

    events.push(event);

    // Keep only last 1000 events to avoid storage bloat
    const recentEvents = events.slice(-1000);
    localStorage.setItem(RULE_PERF_KEY, JSON.stringify(recentEvents));
  } catch (error) {
    console.warn('Failed to log rule performance:', error);
  }
}

export function getRulePerformanceEvents(): RulePerformanceEvent[] {
  try {
    const stored = localStorage.getItem(RULE_PERF_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to retrieve rule performance events:', error);
    return [];
  }
}

export function clearRulePerformanceEvents(): void {
  try {
    localStorage.removeItem(RULE_PERF_KEY);
  } catch (error) {
    console.warn('Failed to clear rule performance events:', error);
  }
}
