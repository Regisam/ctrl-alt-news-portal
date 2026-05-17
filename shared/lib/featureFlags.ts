/**
 * Feature Flags & A/B Testing for Story 13.6: Serendipity Engine
 * Manages serendipity feature rollout and A/B testing configuration
 */

// ============================================================================
// Task 2.3.1: Feature Flag Configuration
// ============================================================================

/**
 * Feature flag for serendipity recommendations
 * Subtask 2.3.1: Main feature flag
 */
export interface SerendipityFeatureFlag {
  enabled: boolean; // Master flag: enable/disable serendipity
  rolloutPercentage: number; // [0-100] percentage of users to enable for
  minSerendipityWeight: number; // Minimum weight for serendipity in blending
  maxSerendipityWeight: number; // Maximum weight for serendipity in blending
  defaultSerendipityWeight: number; // Default weight for enabled users
}

/**
 * Default feature flag configuration
 * Conservative defaults: serendipity disabled, 0% rollout
 */
export const DEFAULT_SERENDIPITY_FLAG: SerendipityFeatureFlag = {
  enabled: false, // Feature disabled by default
  rolloutPercentage: 0, // No users affected
  minSerendipityWeight: 0.0,
  maxSerendipityWeight: 0.3,
  defaultSerendipityWeight: 0.15, // 40% click + 60% serendipity when enabled
};

/**
 * Preset configurations for rollout phases
 */
export const SERENDIPITY_PRESETS = {
  disabled: {
    enabled: false,
    rolloutPercentage: 0,
    minSerendipityWeight: 0.0,
    maxSerendipityWeight: 0.3,
    defaultSerendipityWeight: 0.15,
  },
  canary: {
    enabled: true,
    rolloutPercentage: 5, // 5% of users (canary)
    minSerendipityWeight: 0.0,
    maxSerendipityWeight: 0.3,
    defaultSerendipityWeight: 0.15,
  },
  beta: {
    enabled: true,
    rolloutPercentage: 25, // 25% of users (early beta)
    minSerendipityWeight: 0.0,
    maxSerendipityWeight: 0.3,
    defaultSerendipityWeight: 0.15,
  },
  gradual: {
    enabled: true,
    rolloutPercentage: 50, // 50% of users (gradual rollout)
    minSerendipityWeight: 0.0,
    maxSerendipityWeight: 0.3,
    defaultSerendipityWeight: 0.15,
  },
  full: {
    enabled: true,
    rolloutPercentage: 100, // 100% of users (full rollout)
    minSerendipityWeight: 0.0,
    maxSerendipityWeight: 0.3,
    defaultSerendipityWeight: 0.15,
  },
};

// ============================================================================
// Task 2.3.2: A/B Testing & User Bucketing
// ============================================================================

/**
 * A/B test variant assignment
 */
export type ABTestVariant = 'control' | 'treatment' | 'unknown';

/**
 * A/B test configuration for serendipity experiment
 */
export interface SerendipityABTest {
  enabled: boolean; // A/B test active?
  testId: string; // Unique identifier (e.g., 'serendipity-v1-may2026')
  controlPercentage: number; // [0-100] % of users in control group
  treatmentPercentage: number; // [0-100] % of users in treatment group
  controlWeight: number; // Serendipity weight for control (should be low/0)
  treatmentWeight: number; // Serendipity weight for treatment (should be high)
  startDate: Date;
  endDate: Date;
}

/**
 * Default A/B test configuration
 * 50/50 split: control (no serendipity) vs treatment (0.2 serendipity weight)
 */
export const DEFAULT_SERENDIPITY_AB_TEST: SerendipityABTest = {
  enabled: false,
  testId: 'serendipity-default',
  controlPercentage: 50,
  treatmentPercentage: 50,
  controlWeight: 0.0, // Control: pure click-prediction (no serendipity)
  treatmentWeight: 0.2, // Treatment: 20% serendipity blending
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
};

/**
 * Determine if user is eligible for serendipity based on feature flag
 *
 * Subtask 2.3.2: Feature flag bucketing logic
 * Uses deterministic hashing to assign users consistently
 *
 * @param userId User ID
 * @param flag Feature flag configuration
 * @returns True if user should get serendipity feature
 */
export function isUserEligibleForSerendipity(
  userId: string,
  flag: SerendipityFeatureFlag = DEFAULT_SERENDIPITY_FLAG
): boolean {
  if (!flag.enabled) return false;

  if (flag.rolloutPercentage === 100) return true;
  if (flag.rolloutPercentage === 0) return false;

  // Deterministic hashing: user ID → bucketing
  const hash = hashUserId(userId);
  const bucket = hash % 100;

  return bucket < flag.rolloutPercentage;
}

/**
 * Assign user to A/B test variant
 *
 * Subtask 2.3.2: A/B test bucketing logic
 * Deterministic assignment based on user ID
 *
 * @param userId User ID
 * @param test A/B test configuration
 * @returns Assigned variant: 'control', 'treatment', or 'unknown'
 */
export function assignUserToVariant(
  userId: string,
  test: SerendipityABTest = DEFAULT_SERENDIPITY_AB_TEST
): ABTestVariant {
  if (!test.enabled) return 'unknown';

  const now = new Date();
  if (now < test.startDate || now > test.endDate) return 'unknown';

  const hash = hashUserId(userId);
  const bucket = hash % 100;

  if (bucket < test.controlPercentage) {
    return 'control';
  } else if (bucket < test.controlPercentage + test.treatmentPercentage) {
    return 'treatment';
  }

  return 'unknown';
}

/**
 * Get serendipity weight for user based on A/B test assignment
 *
 * @param userId User ID
 * @param test A/B test configuration
 * @returns Serendipity weight for user [0, 1]
 */
export function getSerendipityWeightForUser(
  userId: string,
  test: SerendipityABTest = DEFAULT_SERENDIPITY_AB_TEST
): number {
  const variant = assignUserToVariant(userId, test);

  switch (variant) {
    case 'control':
      return test.controlWeight;
    case 'treatment':
      return test.treatmentWeight;
    default:
      return 0.0; // No serendipity if not in test
  }
}

/**
 * Simple hash function for user ID bucketing
 * Deterministic: same userId always maps to same bucket
 *
 * @param userId User ID to hash
 * @returns Hash value [0, 1000000]
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000000;
}

// ============================================================================
// Task 2.3.3: Analytics Collection
// ============================================================================

/**
 * Analytics event for serendipity discovery
 */
export interface SerendipityAnalyticsEvent {
  userId: string;
  event: 'recommendation_shown' | 'article_clicked' | 'time_on_article' | 'bookmark_created';
  articleId: string;
  timestamp: Date;
  serendipityScore: number;
  topicDistance: number;
  collaborativeNovelty: number;
  clickProbability: number;
  variant?: ABTestVariant; // A/B test assignment
  metadata?: Record<string, any>;
}

/**
 * Analytics aggregator for serendipity metrics
 */
export class SerendipityAnalytics {
  private events: SerendipityAnalyticsEvent[] = [];

  /**
   * Record serendipity analytics event
   */
  recordEvent(event: SerendipityAnalyticsEvent): void {
    this.events.push({
      ...event,
      timestamp: event.timestamp || new Date(),
    });
  }

  /**
   * Get discovery rate: % of recommendations with distance > 0.6
   */
  getDiscoveryRate(startDate: Date, endDate: Date): number {
    const relevant = this.events.filter(
      (e) => e.timestamp >= startDate && e.timestamp <= endDate && e.event === 'recommendation_shown'
    );

    if (relevant.length === 0) return 0;

    const discovered = relevant.filter((e) => e.topicDistance > 0.6);
    return discovered.length / relevant.length;
  }

  /**
   * Get cross-topic engagement: CTR on articles outside primary interests
   */
  getCrossTopicClickRate(startDate: Date, endDate: Date): number {
    const shown = this.events.filter(
      (e) =>
        e.timestamp >= startDate &&
        e.timestamp <= endDate &&
        e.event === 'recommendation_shown' &&
        e.topicDistance > 0.6
    );

    if (shown.length === 0) return 0;

    const clicks = shown.filter((e) =>
      this.events.some(
        (ev) =>
          ev.articleId === e.articleId &&
          ev.userId === e.userId &&
          ev.event === 'article_clicked'
      )
    );

    return clicks.length / shown.length;
  }

  /**
   * Get engagement metrics by variant
   */
  getEngagementMetricsByVariant(startDate: Date, endDate: Date): Record<ABTestVariant, any> {
    const relevant = this.events.filter((e) => e.timestamp >= startDate && e.timestamp <= endDate);

    const variants: ABTestVariant[] = ['control', 'treatment', 'unknown'];
    const metrics: Record<ABTestVariant, any> = {
      control: {},
      treatment: {},
      unknown: {},
    };

    for (const variant of variants) {
      const variantEvents = relevant.filter((e) => e.variant === variant);

      const shows = variantEvents.filter((e) => e.event === 'recommendation_shown').length;
      const clicks = variantEvents.filter((e) => e.event === 'article_clicked').length;
      const bookmarks = variantEvents.filter((e) => e.event === 'bookmark_created').length;

      metrics[variant] = {
        recommendations_shown: shows,
        articles_clicked: clicks,
        ctr: shows > 0 ? clicks / shows : 0,
        bookmarks: bookmarks,
        avg_serendipity_score:
          variantEvents.length > 0
            ? variantEvents.reduce((sum, e) => sum + e.serendipityScore, 0) / variantEvents.length
            : 0,
        avg_click_probability:
          variantEvents.length > 0
            ? variantEvents.reduce((sum, e) => sum + e.clickProbability, 0) / variantEvents.length
            : 0,
      };
    }

    return metrics;
  }

  /**
   * Clear all recorded events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get all events for export/analysis
   */
  getAllEvents(): SerendipityAnalyticsEvent[] {
    return [...this.events];
  }
}

/**
 * Global analytics instance
 * Should be replaced with server-side collection in production
 */
export const serendipityAnalytics = new SerendipityAnalytics();
