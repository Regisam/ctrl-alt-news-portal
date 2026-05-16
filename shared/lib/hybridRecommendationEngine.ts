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
