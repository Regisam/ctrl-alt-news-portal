/**
 * Hybrid Recommendation Engine (Story 13.3)
 * Combines rules, content similarity, and collaborative filtering into unified ensemble ranking
 */

export interface RecommendationSignal {
  articleId: string;
  score: number; // [0, 1] normalized
  source: 'rules' | 'content' | 'cf' | 'popularity';
}

export interface HybridRecommendation {
  articleId: string;
  finalScore: number; // [0, 1]
  signals: RecommendationSignal[]; // breakdown by source
  reason: string; // explainability: "Trending (rules: 0.8) + Similar (content: 0.7) + Users like you (CF: 0.6)"
  topSignal: 'rules' | 'content' | 'cf' | 'popularity';
}

export interface EnsembleWeights {
  rules: number; // typically 0.3
  content: number; // typically 0.4
  cf: number; // typically 0.3
  popularity: number; // typically 0.0
}

export interface HybridEngineConfig {
  weights: EnsembleWeights;
  diversityPenalty: number; // [0, 1], how much to penalize similar articles
  topK: number; // return top-K recommendations
  minTopicDiversity: number; // e.g., 0.6 = at least 60% different topics
  minArticleScore: number; // minimum score to include article
}

/**
 * Normalize scores for a single signal to [0, 1] range
 * Handles edge cases: all zeros, single value, etc.
 */
export function normalizeSignalScores(scores: Map<string, number>): Map<string, number> {
  if (scores.size === 0) {
    return new Map();
  }

  const values = Array.from(scores.values());
  const minScore = Math.min(...values);
  const maxScore = Math.max(...values);

  // If all scores are the same, return 0.5 (neutral)
  if (minScore === maxScore) {
    const normalized = new Map<string, number>();
    for (const articleId of scores.keys()) {
      normalized.set(articleId, 0.5);
    }
    return normalized;
  }

  // Min-max normalization: (value - min) / (max - min)
  const normalized = new Map<string, number>();
  const range = maxScore - minScore;

  for (const [articleId, score] of scores) {
    const normalizedScore = (score - minScore) / range;
    normalized.set(articleId, Math.max(0, Math.min(1, normalizedScore))); // clamp to [0, 1]
  }

  return normalized;
}

/**
 * Normalize all signal scores independently
 */
export function normalizeAllSignals(
  rulesScores: Map<string, number>,
  contentScores: Map<string, number>,
  cfScores: Map<string, number>,
  popularityScores: Map<string, number>
): {
  rules: Map<string, number>;
  content: Map<string, number>;
  cf: Map<string, number>;
  popularity: Map<string, number>;
} {
  return {
    rules: normalizeSignalScores(rulesScores),
    content: normalizeSignalScores(contentScores),
    cf: normalizeSignalScores(cfScores),
    popularity: normalizeSignalScores(popularityScores),
  };
}

/**
 * Get all unique articles across all signals
 */
export function getAllArticles(
  rulesScores: Map<string, number>,
  contentScores: Map<string, number>,
  cfScores: Map<string, number>,
  popularityScores: Map<string, number>
): Set<string> {
  const articles = new Set<string>();

  for (const articleId of rulesScores.keys()) articles.add(articleId);
  for (const articleId of contentScores.keys()) articles.add(articleId);
  for (const articleId of cfScores.keys()) articles.add(articleId);
  for (const articleId of popularityScores.keys()) articles.add(articleId);

  return articles;
}

/**
 * Validate normalization results
 */
export function validateNormalizedScores(
  normalizedSignals: ReturnType<typeof normalizeAllSignals>
): { valid: boolean; reason?: string } {
  for (const [signal, scores] of Object.entries(normalizedSignals)) {
    for (const [articleId, score] of scores) {
      if (!Number.isFinite(score) || score < 0 || score > 1) {
        return {
          valid: false,
          reason: `Invalid ${signal} score ${score} for article ${articleId}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate ensemble weights sum to approximately 1.0
 */
export function validateWeights(weights: EnsembleWeights): { valid: boolean; reason?: string } {
  const sum = weights.rules + weights.content + weights.cf + weights.popularity;
  const tolerance = 0.01; // Allow 1% variance

  if (Math.abs(sum - 1.0) > tolerance) {
    return {
      valid: false,
      reason: `Weights sum to ${sum}, expected ~1.0 (rules=${weights.rules}, content=${weights.content}, cf=${weights.cf}, popularity=${weights.popularity})`,
    };
  }

  // Check each weight is non-negative
  if (weights.rules < 0 || weights.content < 0 || weights.cf < 0 || weights.popularity < 0) {
    return {
      valid: false,
      reason: 'All weights must be non-negative',
    };
  }

  return { valid: true };
}

/**
 * Blend normalized signal scores using configurable weights
 * Final score = w_rules * rules_score + w_content * content_score + w_cf * cf_score + w_popularity * popularity_score
 */
export function blendSignalScores(
  articles: Set<string>,
  normalizedSignals: ReturnType<typeof normalizeAllSignals>,
  weights: EnsembleWeights
): Map<string, { blendedScore: number; signals: RecommendationSignal[] }> {
  const blended = new Map<string, { blendedScore: number; signals: RecommendationSignal[] }>();

  for (const articleId of articles) {
    const rulesScore = normalizedSignals.rules.get(articleId) ?? 0;
    const contentScore = normalizedSignals.content.get(articleId) ?? 0;
    const cfScore = normalizedSignals.cf.get(articleId) ?? 0;
    const popularityScore = normalizedSignals.popularity.get(articleId) ?? 0;

    // Blend using weighted sum
    const blendedScore =
      weights.rules * rulesScore +
      weights.content * contentScore +
      weights.cf * cfScore +
      weights.popularity * popularityScore;

    // Track individual signal contributions
    const signals: RecommendationSignal[] = [];
    if (rulesScore > 0) signals.push({ articleId, score: rulesScore, source: 'rules' });
    if (contentScore > 0) signals.push({ articleId, score: contentScore, source: 'content' });
    if (cfScore > 0) signals.push({ articleId, score: cfScore, source: 'cf' });
    if (popularityScore > 0) signals.push({ articleId, score: popularityScore, source: 'popularity' });

    blended.set(articleId, { blendedScore, signals });
  }

  return blended;
}

/**
 * Get default ensemble weights (EPIC-12 validated baseline)
 */
export function getDefaultWeights(): EnsembleWeights {
  return {
    rules: 0.3,
    content: 0.4,
    cf: 0.3,
    popularity: 0.0,
  };
}

/**
 * Get default engine configuration
 */
export function getDefaultConfig(): HybridEngineConfig {
  return {
    weights: getDefaultWeights(),
    diversityPenalty: 0.15,
    topK: 10,
    minTopicDiversity: 0.6,
    minArticleScore: 0.2,
  };
}

/**
 * Create custom config with overrides
 */
export function createConfig(overrides?: Partial<HybridEngineConfig>): HybridEngineConfig {
  const defaultConfig = getDefaultConfig();
  return {
    ...defaultConfig,
    ...overrides,
    weights: {
      ...defaultConfig.weights,
      ...overrides?.weights,
    },
  };
}

/**
 * Experiment variants for A/B testing
 */
export const EXPERIMENT_VARIANTS = {
  control_rules_only: {
    weights: { rules: 1.0, content: 0.0, cf: 0.0, popularity: 0.0 },
    name: 'Rules Only (EPIC-12 baseline)',
  },
  default_hybrid: {
    weights: { rules: 0.3, content: 0.4, cf: 0.3, popularity: 0.0 },
    name: 'Hybrid Default (30/40/30)',
  },
  cf_heavy: {
    weights: { rules: 0.2, content: 0.3, cf: 0.5, popularity: 0.0 },
    name: 'CF-Heavy (20/30/50)',
  },
  content_heavy: {
    weights: { rules: 0.2, content: 0.6, cf: 0.2, popularity: 0.0 },
    name: 'Content-Heavy (20/60/20)',
  },
  with_popularity: {
    weights: { rules: 0.25, content: 0.35, cf: 0.25, popularity: 0.15 },
    name: 'Popularity Boost (25/35/25/15)',
  },
} as const;

export type ExperimentVariant = keyof typeof EXPERIMENT_VARIANTS;

/**
 * Task 3.1: A/B Testing & Integration
 * Variant assignment, experiment orchestration, and analytics
 */

export interface ExperimentMetadata {
  variantId: string;
  variantName: string;
  weights: EnsembleWeights;
  description: string;
  startDate: Date;
  endDate?: Date;
  expectedLift: number; // Expected improvement vs. control (e.g., 0.15 = 15% improvement)
  minSampleSize: number; // Minimum users before declaring significance
  successMetrics: string[]; // Metrics to track: CTR, engagement_time, feedback_score
}

export interface UserAssignment {
  userId: string;
  variantId: string;
  variantName: string;
  assignedAt: Date;
  cohort: 'control' | 'treatment'; // Control vs. treatment group
}

export interface RecommendationEvent {
  userId: string;
  sessionId: string;
  variantId: string;
  articleId: string;
  position: number; // Position in recommendation list (1-based)
  finalScore: number;
  timestamp: Date;
  eventType: 'impression' | 'click' | 'dismiss' | 'feedback';
  eventData?: {
    feedbackScore?: number; // -1: dislike, 0: neutral, 1: like
    engagementTimeMs?: number;
    scrollDepth?: number; // 0-1
  };
}

/**
 * Consistent hash-based variant assignment
 * Same user always gets same variant (deterministic)
 * Uses simple modulo hashing on userId
 */
export function assignUserVariant(
  userId: string,
  variants: ExperimentVariant[] = ['control_rules_only', 'default_hybrid'],
  seed: number = 0
): ExperimentVariant {
  // Simple deterministic hash: sum of char codes mod variant count
  let hash = seed;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 1000000;
  }

  const variantIndex = hash % variants.length;
  return variants[variantIndex];
}

/**
 * Create user assignment record
 */
export function createUserAssignment(
  userId: string,
  variant: ExperimentVariant = 'default_hybrid'
): UserAssignment {
  const cohort = variant === 'control_rules_only' ? 'control' : 'treatment';
  const variantMeta = EXPERIMENT_VARIANTS[variant];

  return {
    userId,
    variantId: variant,
    variantName: variantMeta.name,
    assignedAt: new Date(),
    cohort,
  };
}

/**
 * Get variant configuration by ID
 */
export function getVariantConfig(variantId: ExperimentVariant): HybridEngineConfig {
  const variant = EXPERIMENT_VARIANTS[variantId];
  if (!variant) {
    return getDefaultConfig(); // Fallback to default
  }

  return createConfig({
    weights: variant.weights as EnsembleWeights,
  });
}

/**
 * Track recommendation event for analytics
 * Events are collected for metrics computation
 */
export function createRecommendationEvent(
  userId: string,
  sessionId: string,
  variantId: string,
  articleId: string,
  position: number,
  finalScore: number,
  eventType: 'impression' | 'click' | 'dismiss' | 'feedback' = 'impression',
  eventData?: RecommendationEvent['eventData']
): RecommendationEvent {
  return {
    userId,
    sessionId,
    variantId,
    articleId,
    position,
    finalScore,
    timestamp: new Date(),
    eventType,
    eventData,
  };
}

/**
 * Compute Click-Through Rate (CTR) from events
 * CTR = clicks / impressions
 */
export function computeCTR(events: RecommendationEvent[]): {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  confidence: number; // [0, 1] based on sample size
} {
  const impressions = events.filter((e) => e.eventType === 'impression').length;
  const clicks = events.filter((e) => e.eventType === 'click').length;

  const ctr = impressions > 0 ? clicks / impressions : 0;

  // Confidence increases with sample size (Wilson score confidence interval proxy)
  const confidence = Math.min(1, Math.sqrt(impressions / 1000));

  return {
    totalImpressions: impressions,
    totalClicks: clicks,
    ctr,
    confidence,
  };
}

/**
 * Compute average engagement time from events
 */
export function computeAverageEngagementTime(events: RecommendationEvent[]): {
  averageTimeMs: number;
  sampleSize: number;
  confidence: number;
} {
  const engagementEvents = events.filter((e) => e.eventData?.engagementTimeMs !== undefined);

  const totalTime = engagementEvents.reduce((sum, e) => sum + (e.eventData?.engagementTimeMs || 0), 0);
  const averageTimeMs = engagementEvents.length > 0 ? totalTime / engagementEvents.length : 0;

  const confidence = Math.min(1, Math.sqrt(engagementEvents.length / 100));

  return {
    averageTimeMs,
    sampleSize: engagementEvents.length,
    confidence,
  };
}

/**
 * Compute satisfaction score from user feedback
 * Scale: -1 (dislike), 0 (neutral), 1 (like)
 */
export function computeSatisfactionScore(events: RecommendationEvent[]): {
  averageScore: number;
  likeRatio: number; // % of positive feedback
  sampleSize: number;
  confidence: number;
} {
  const feedbackEvents = events.filter((e) => e.eventData?.feedbackScore !== undefined);

  const totalScore = feedbackEvents.reduce((sum, e) => sum + (e.eventData?.feedbackScore || 0), 0);
  const likes = feedbackEvents.filter((e) => (e.eventData?.feedbackScore || 0) > 0).length;

  const averageScore = feedbackEvents.length > 0 ? totalScore / feedbackEvents.length : 0;
  const likeRatio = feedbackEvents.length > 0 ? likes / feedbackEvents.length : 0;

  const confidence = Math.min(1, Math.sqrt(feedbackEvents.length / 50));

  return {
    averageScore,
    likeRatio,
    sampleSize: feedbackEvents.length,
    confidence,
  };
}

/**
 * Compute statistical significance using chi-square test
 * Returns true if difference is significant at p < 0.05
 */
export function isSignificantDifference(
  controlEvents: RecommendationEvent[],
  treatmentEvents: RecommendationEvent[],
  metricType: 'ctr' | 'engagement' | 'satisfaction' = 'ctr'
): {
  isSignificant: boolean;
  pValue: number;
  effectSize: number;
} {
  if (metricType === 'ctr') {
    const controlCTR = computeCTR(controlEvents);
    const treatmentCTR = computeCTR(treatmentEvents);

    // Chi-square approximation for proportions
    const pooled = (controlCTR.totalClicks + treatmentCTR.totalClicks) /
      (controlCTR.totalImpressions + treatmentCTR.totalImpressions) || 0;

    const se = Math.sqrt(pooled * (1 - pooled) * (1 / controlCTR.totalImpressions + 1 / treatmentCTR.totalImpressions));

    const zScore = se > 0 ? (treatmentCTR.ctr - controlCTR.ctr) / se : 0;
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

    const effectSize = se > 0 ? zScore : 0;

    return {
      isSignificant: pValue < 0.05,
      pValue,
      effectSize,
    };
  }

  // For other metrics, use placeholder
  return {
    isSignificant: false,
    pValue: 1.0,
    effectSize: 0,
  };
}

/**
 * Cumulative distribution function for standard normal distribution
 * Approximation using error function
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

  return x >= 0 ? 1 - prob : prob;
}

/**
 * Task 2.2: Add explainability
 * Generate human-readable explanations for recommendations
 */

export interface ExplainabilityConfig {
  includeSourceLabels: boolean; // Show user-friendly source names
  includeScorePercentages: boolean; // Show signal strength percentages
  includeTopSignal: boolean; // Highlight strongest signal
  maxSignalsToShow: number; // Maximum signals in reason string
  locale: 'en' | 'pt'; // Language for explanations
}

/**
 * Human-readable labels for signal sources
 */
const SIGNAL_LABELS = {
  en: {
    rules: 'Trending',
    content: 'Similar to your interests',
    cf: 'Popular with readers like you',
    popularity: 'Widely read',
  },
  pt: {
    rules: 'Tendência',
    content: 'Similar aos seus interesses',
    cf: 'Popular entre leitores como você',
    popularity: 'Amplamente lido',
  },
};

/**
 * Get human-readable label for signal source
 */
export function getSignalLabel(
  source: 'rules' | 'content' | 'cf' | 'popularity',
  locale: 'en' | 'pt' = 'en'
): string {
  return SIGNAL_LABELS[locale][source] || source;
}

/**
 * Generate explainability data for a recommendation
 * Returns reason string and detailed signal breakdown
 */
export function generateExplanation(
  recommendation: HybridRecommendation,
  partialConfig?: Partial<ExplainabilityConfig>
): {
  reason: string;
  signalBreakdown: Array<{
    source: string;
    label: string;
    score: number;
    percentage: string;
    isTopSignal: boolean;
  }>;
  topSignal: { source: string; label: string };
  confidence: number; // [0, 1] how confident is the recommendation
} {
  // Merge with defaults
  const config: ExplainabilityConfig = {
    includeSourceLabels: true,
    includeScorePercentages: true,
    includeTopSignal: true,
    maxSignalsToShow: 3,
    locale: 'en',
    ...partialConfig,
  };

  // Sort signals by score descending
  const sortedSignals = [...recommendation.signals].sort((a, b) => b.score - a.score);
  const topSignal = sortedSignals[0];

  // Build signal breakdown
  const breakdown = sortedSignals
    .slice(0, config.maxSignalsToShow)
    .map((signal, index) => ({
      source: signal.source,
      label: getSignalLabel(signal.source as any, config.locale),
      score: signal.score,
      percentage: `${(signal.score * 100).toFixed(0)}%`,
      isTopSignal: index === 0,
    }));

  // Generate reason string
  let reasonParts: string[] = [];

  if (config.includeTopSignal && topSignal) {
    const topLabel = getSignalLabel(topSignal.source as any, config.locale);
    const scoreStr = config.includeScorePercentages
      ? ` (${(topSignal.score * 100).toFixed(0)}%)`
      : '';
    reasonParts.push(`${topLabel}${scoreStr}`);
  }

  // Add additional signals
  if (breakdown.length > 1) {
    const additionalSignals = breakdown
      .slice(1)
      .map((sig) => {
        const scoreStr = config.includeScorePercentages ? ` ${sig.percentage}` : '';
        return `${sig.label}${scoreStr}`;
      })
      .join(', ');

    if (config.locale === 'pt') {
      reasonParts.push(`+ ${additionalSignals}`);
    } else {
      reasonParts.push(`+ ${additionalSignals}`);
    }
  }

  const reason =
    config.locale === 'pt'
      ? `Recomendado porque: ${reasonParts.join(' ')}`
      : `Recommended because: ${reasonParts.join(' ')}`;

  // Calculate confidence (use final score as proxy)
  const confidence = Math.min(recommendation.finalScore * 1.2, 1.0); // Scale by 1.2 for visibility

  return {
    reason,
    signalBreakdown: breakdown,
    topSignal: {
      source: topSignal.source,
      label: getSignalLabel(topSignal.source as any, config.locale),
    },
    confidence,
  };
}

/**
 * Add explanability to batch of recommendations
 */
export function addExplanability(
  recommendations: HybridRecommendation[],
  config?: ExplainabilityConfig
): Array<
  HybridRecommendation & {
    explanation: ReturnType<typeof generateExplanation>;
  }
> {
  return recommendations.map((rec) => ({
    ...rec,
    explanation: generateExplanation(rec, config),
  }));
}

/**
 * Integration interfaces for signal engines
 * These define the contract for each signal source
 */
export interface SignalEngineRequest {
  userId: string;
  topK: number;
}

export interface SignalEngineResponse {
  articleId: string;
  score: number; // Raw score from engine, will be normalized to [0, 1]
}

/**
 * Integrated signal engines collection
 */
export interface SignalEngines {
  rules?: {
    getRecommendations: (req: SignalEngineRequest) => Promise<SignalEngineResponse[]>;
  };
  content?: {
    getRecommendations: (req: SignalEngineRequest) => Promise<SignalEngineResponse[]>;
  };
  collaborativeFiltering?: {
    getRecommendations: (req: SignalEngineRequest) => Promise<SignalEngineResponse[]>;
  };
  popularity?: {
    getRecommendations: (req: SignalEngineRequest) => Promise<SignalEngineResponse[]>;
  };
}

/**
 * Integrate all signals: call each engine, collect scores, normalize, blend
 * Task 1.2 implementation
 */
/**
 * Task 2.1: Enforce diversity constraints
 * Apply topic, author, and recency diversity penalties to rankings
 */

export interface ArticleMetadata {
  id: string | number;
  category?: string;
  author?: string;
  date?: string;
}

export interface DiversityConfig {
  topicPenalty: number; // [0, 1] reduce score for duplicate topics
  authorPenalty: number; // [0, 1] reduce score for duplicate authors
  recencyBias: number; // [0, 1] boost newer articles
}

/**
 * Calculate recency score based on article date
 * Newer articles get higher scores, older articles get lower
 * Assumes date is ISO format (YYYY-MM-DD or full ISO string)
 */
export function calculateRecencyScore(articleDate: string, currentDate?: Date): number {
  try {
    const refDate = currentDate || new Date();
    const parsed = new Date(articleDate);

    if (isNaN(parsed.getTime())) {
      return 0.5; // Default score for unparseable dates
    }

    const ageMs = refDate.getTime() - parsed.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Linear decay: fresh articles (0 days) = 1.0, old articles (365 days) = 0.0
    const recencyScore = Math.max(0, Math.min(1, 1 - ageDays / 365));
    return recencyScore;
  } catch {
    return 0.5;
  }
}

/**
 * Apply diversity constraints to ranked recommendations
 * Reduces scores for articles with duplicate topics/authors
 * Boosts scores for newer articles
 */
export function applyDiversityConstraints(
  recommendations: Array<{ articleId: string; score: number }>,
  articles: Map<string, ArticleMetadata>,
  diversityConfig: DiversityConfig,
  currentDate?: Date
): Array<{ articleId: string; score: number; diversityAdjustment: number }> {
  const selectedTopics = new Set<string>();
  const selectedAuthors = new Set<string>();
  const refDate = currentDate || new Date();

  return recommendations.map((rec, index) => {
    const article = articles.get(rec.articleId.toString());
    let adjustedScore = rec.score;
    let totalAdjustment = 1.0;

    if (!article) {
      return { ...rec, diversityAdjustment: 1.0 };
    }

    // Topic diversity penalty
    if (article.category) {
      if (selectedTopics.has(article.category)) {
        const topicPenalty = 1 - diversityConfig.topicPenalty;
        adjustedScore *= topicPenalty;
        totalAdjustment *= topicPenalty;
      } else {
        selectedTopics.add(article.category);
      }
    }

    // Author diversity penalty
    if (article.author) {
      if (selectedAuthors.has(article.author)) {
        const authorPenalty = 1 - diversityConfig.authorPenalty;
        adjustedScore *= authorPenalty;
        totalAdjustment *= authorPenalty;
      } else {
        selectedAuthors.add(article.author);
      }
    }

    // Recency boost
    if (article.date && diversityConfig.recencyBias > 0) {
      const recency = calculateRecencyScore(article.date, refDate);
      const recencyBoost = 1 + diversityConfig.recencyBias * (recency - 0.5);
      adjustedScore *= recencyBoost;
      totalAdjustment *= recencyBoost;
    }

    return {
      articleId: rec.articleId,
      score: adjustedScore,
      diversityAdjustment: totalAdjustment,
    };
  });
}

/**
 * Enforce minimum topic diversity in top-K recommendations
 * Ensures at least minDiversity % of topics are unique
 * Returns reranked recommendations that satisfy constraint
 */
export function enforceTopicDiversity(
  recommendations: Array<{ articleId: string; score: number }>,
  articles: Map<string, ArticleMetadata>,
  minDiversity: number, // [0, 1] minimum unique topic percentage
  topK: number
): Array<{ articleId: string; score: number }> {
  if (recommendations.length === 0 || minDiversity <= 0) {
    return recommendations.slice(0, topK);
  }

  const result: Array<{ articleId: string; score: number }> = [];
  const topicCounts = new Map<string, number>();
  let totalTopics = 0;

  // Pass 1: Greedily select articles by score while tracking topics
  for (const rec of recommendations) {
    if (result.length >= topK) break;

    const article = articles.get(rec.articleId.toString());
    const topic = article?.category || 'unknown';

    const currentCount = topicCounts.get(topic) ?? 0;
    topicCounts.set(topic, currentCount + 1);

    if (topic !== 'unknown') {
      totalTopics = Math.max(totalTopics, topicCounts.size);
    }

    result.push(rec);
  }

  // Pass 2: Check if minimum diversity is met
  const uniqueTopics = topicCounts.size;
  const maxUniqueTopics = Math.ceil(result.length / 2); // At most 2 articles per topic ideally
  const diversityRatio = uniqueTopics / Math.max(1, maxUniqueTopics);

  if (diversityRatio >= minDiversity) {
    return result;
  }

  // Pass 3: Re-rank to improve diversity if needed
  const reranked: Array<{ articleId: string; score: number }> = [];
  const usedTopics = new Set<string>();

  // First pass: one article per topic
  for (const rec of recommendations) {
    if (reranked.length >= topK) break;

    const article = articles.get(rec.articleId.toString());
    const topic = article?.category || 'unknown';

    if (!usedTopics.has(topic)) {
      reranked.push(rec);
      usedTopics.add(topic);
    }
  }

  // Second pass: fill remaining slots with highest scores
  for (const rec of recommendations) {
    if (reranked.length >= topK) break;
    if (!reranked.some((r) => r.articleId === rec.articleId)) {
      reranked.push(rec);
    }
  }

  return reranked;
}

export async function integrateAllSignals(
  userId: string,
  engines: SignalEngines,
  config: HybridEngineConfig
): Promise<HybridRecommendation[]> {
  const topKPerSignal = config.topK * 2; // Fetch 2x to allow filtering
  const startTime = performance.now();

  // Step 1: Call all available signal engines in parallel
  const signalPromises: Promise<[string, SignalEngineResponse[]]>[] = [];

  if (engines.rules) {
    signalPromises.push(
      engines.rules
        .getRecommendations({ userId, topK: topKPerSignal })
        .then((results) => ['rules', results])
    );
  }

  if (engines.content) {
    signalPromises.push(
      engines.content
        .getRecommendations({ userId, topK: topKPerSignal })
        .then((results) => ['content', results])
    );
  }

  if (engines.collaborativeFiltering) {
    signalPromises.push(
      engines.collaborativeFiltering
        .getRecommendations({ userId, topK: topKPerSignal })
        .then((results) => ['cf', results])
    );
  }

  if (engines.popularity) {
    signalPromises.push(
      engines.popularity
        .getRecommendations({ userId, topK: topKPerSignal })
        .then((results) => ['popularity', results])
    );
  }

  // Execute all engine calls in parallel
  const signalResults = await Promise.all(signalPromises);

  // Step 2: Convert engine responses to our scoring format
  const rulesScores = new Map<string, number>();
  const contentScores = new Map<string, number>();
  const cfScores = new Map<string, number>();
  const popularityScores = new Map<string, number>();

  for (const [source, results] of signalResults) {
    const targetMap =
      source === 'rules'
        ? rulesScores
        : source === 'content'
          ? contentScores
          : source === 'cf'
            ? cfScores
            : popularityScores;

    for (const result of results) {
      targetMap.set(result.articleId, result.score);
    }
  }

  // Step 3: Normalize each signal independently to [0, 1]
  const normalized = normalizeAllSignals(rulesScores, contentScores, cfScores, popularityScores);

  // Step 4: Collect all articles and validate
  const allArticles = getAllArticles(rulesScores, contentScores, cfScores, popularityScores);

  // Step 5: Validate normalized scores
  const scoreValidation = validateNormalizedScores(normalized);
  if (!scoreValidation.valid) {
    throw new Error(`Signal normalization failed: ${scoreValidation.reason}`);
  }

  // Step 6: Blend signals using configured weights
  const blended = blendSignalScores(allArticles, normalized, config.weights);

  // Step 7: Sort by blended score and select top-K
  const ranked = Array.from(blended.entries())
    .map(([articleId, { blendedScore, signals }]) => ({
      articleId,
      blendedScore,
      signals,
    }))
    .sort((a, b) => b.blendedScore - a.blendedScore)
    .slice(0, config.topK);

  // Step 8: Build final recommendations with explainability
  const recommendations: HybridRecommendation[] = ranked
    .filter((rec) => rec.blendedScore >= config.minArticleScore)
    .map((rec) => {
      const topSignal = rec.signals.reduce((prev, curr) =>
        curr.score > prev.score ? curr : prev
      )?.source;

      const reason = rec.signals
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((s) => `${s.source}: ${(s.score * 100).toFixed(0)}%`)
        .join(' + ');

      return {
        articleId: rec.articleId,
        finalScore: rec.blendedScore,
        signals: rec.signals,
        reason,
        topSignal: (topSignal as RecommendationSignal['source']) || 'rules',
      };
    });

  // Log performance
  const computationTimeMs = performance.now() - startTime;
  if (computationTimeMs > 50) {
    console.warn(
      `⚠️ Hybrid recommendation latency exceeded budget: ${computationTimeMs.toFixed(2)}ms > 50ms`
    );
  }

  return recommendations;
}
