/**
 * Topic Recommendations Tuning — Serendipity Parameter Optimization
 * Implements A/B testing framework for λ-based recommendation weighting
 * Story 14.1: Topic Recommendations Refinement & Serendipity Tuning
 */

export type SerendipityVariant = 'control' | 'high_serendipity' | 'balanced' | 'safe';

export interface SerendipityConfig {
  lambda: number; // 0.3 = high serendipity, 0.5 = balanced, 0.7 = safe
  description: string;
  weight: number; // % of users in this variant
}

/**
 * Serendipity configurations for A/B testing
 * λ balances collaborative recommendations vs. serendipitous discovery
 *
 * Formula: score = λ × collaborative + (1 - λ) × serendipity
 */
export const SERENDIPITY_VARIANTS: Record<SerendipityVariant, SerendipityConfig> = {
  control: {
    lambda: 0.5, // Current baseline (balanced)
    description: 'Control: Balanced (50/50 collaboration vs. serendipity)',
    weight: 0.25, // 25% of users
  },
  high_serendipity: {
    lambda: 0.3, // Favor discovery
    description: 'Treatment: High Serendipity (30% collab, 70% serendipity)',
    weight: 0.25, // 25% of users
  },
  balanced: {
    lambda: 0.5, // Current baseline
    description: 'Balanced: 50/50 split (control group)',
    weight: 0.25, // 25% of users
  },
  safe: {
    lambda: 0.7, // Favor collaborative recommendations
    description: 'Treatment: Safe (70% collab, 30% serendipity)',
    weight: 0.25, // 25% of users
  },
};

/**
 * Assign user to variant deterministically via hash
 * @param userId User ID
 * @returns Assigned variant (consistent across sessions)
 *
 * AC1.4: Deterministic bucketing, consistent across sessions
 */
export function assignSerendipityVariant(userId: string): SerendipityVariant {
  // Hash userId to 0-99
  const hash = Array.from(userId).reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);
  const bucket = Math.abs(hash) % 100;

  // Bucket assignment (cumulative distribution)
  if (bucket < 25) return 'control';
  if (bucket < 50) return 'high_serendipity';
  if (bucket < 75) return 'balanced';
  return 'safe';
}

/**
 * Compute serendipity-weighted recommendation score
 *
 * AC1.2: score = λ × serendipity + (1-λ) × collaborative
 *
 * @param collaborativeScore User-topic affinity (0-1, from collaborative filtering)
 * @param serendipityScore Topic novelty/distance from user's typical interests (0-1)
 * @param lambda Weighting parameter (0.3-0.7)
 *   λ = 0.3: High serendipity (70% serendipity weight, 30% collaborative)
 *   λ = 0.5: Balanced (50/50)
 *   λ = 0.7: Safe (70% collaborative, 30% serendipity)
 * @returns Weighted recommendation score (0-1)
 */
export function computeSerendipityScore(
  collaborativeScore: number,
  serendipityScore: number,
  lambda: number
): number {
  // Validate inputs
  if (lambda < 0 || lambda > 1) {
    throw new Error(`Invalid lambda: ${lambda}. Must be between 0 and 1.`);
  }

  // Weighted combination: favor serendipity when (1-λ) is high, collaboration when λ is high
  const serendipityComponent = (1 - lambda) * serendipityScore; // More weight when λ is low
  const collaborativeComponent = lambda * collaborativeScore; // More weight when λ is high

  return serendipityComponent + collaborativeComponent;
}

/**
 * Get λ parameter for user based on assigned variant
 * @param userId User ID
 * @returns λ value for weighting function
 */
export function getUserLambda(userId: string): number {
  const variant = assignSerendipityVariant(userId);
  return SERENDIPITY_VARIANTS[variant].lambda;
}

/**
 * Get variant assignment for user (for analytics)
 * @param userId User ID
 * @returns Variant name and configuration
 */
export function getUserVariantConfig(userId: string): SerendipityConfig & { variant: SerendipityVariant } {
  const variant = assignSerendipityVariant(userId);
  return {
    variant,
    ...SERENDIPITY_VARIANTS[variant],
  };
}

/**
 * Analyze A/B test results: compare adoption rates by variant
 * (Mock data — replace with real analytics from database)
 */
export interface VariantAnalytics {
  variant: SerendipityVariant;
  adoptionRate: number; // % of recommended topics followed
  ctr: number; // Click-through rate on recommendations
  crossTopicEngagementLift: number; // % increase in articles from recommended topics
  sampleSize: number; // Number of users tested
}

export function getVariantAnalytics(): Record<SerendipityVariant, VariantAnalytics> {
  // AC1: Target adoption rate ≥ 15%, cross-topic lift ≥ 8%
  // These are placeholder analytics — replace with real data from Supabase
  return {
    control: {
      variant: 'control',
      adoptionRate: 0.12, // 12%
      ctr: 0.18,
      crossTopicEngagementLift: 0.06, // 6%
      sampleSize: 1000,
    },
    high_serendipity: {
      variant: 'high_serendipity',
      adoptionRate: 0.14, // 14% (improvement)
      ctr: 0.2,
      crossTopicEngagementLift: 0.09, // 9% (meets target)
      sampleSize: 1000,
    },
    balanced: {
      variant: 'balanced',
      adoptionRate: 0.12,
      ctr: 0.18,
      crossTopicEngagementLift: 0.06,
      sampleSize: 1000,
    },
    safe: {
      variant: 'safe',
      adoptionRate: 0.1, // 10% (lower serendipity = lower discovery)
      ctr: 0.16,
      crossTopicEngagementLift: 0.04,
      sampleSize: 1000,
    },
  };
}

/**
 * Determine winning variant based on adoption rate
 * AC1.3: Ship winning variant to all users
 */
export function selectWinningVariant(): SerendipityVariant {
  const analytics = getVariantAnalytics();
  let winner: SerendipityVariant = 'control';
  let maxAdoption = analytics.control.adoptionRate;

  for (const [variant, data] of Object.entries(analytics)) {
    if (data.adoptionRate > maxAdoption) {
      maxAdoption = data.adoptionRate;
      winner = variant as SerendipityVariant;
    }
  }

  return winner;
}
