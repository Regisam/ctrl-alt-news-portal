/**
 * Integrated Recommendation Engine with Click Predictions (Story 13.5)
 * Combines hybrid ranking (Story 13.3) with neural click prediction (Story 13.5)
 */

import {
  ClickPredictionModel,
  ClickPredictionCache,
  UserEngagementHistory,
  ClickPrediction,
} from './clickPredictionModel';

import {
  SerendipityScorer,
  rankArticlesWithSerendipity as serendipityRanking,
  RankedArticleWithSerendipity,
  SerendipityInput,
  CollaborativeContext,
} from './serendipityScorer';

/**
 * Article features for ranking
 */
export interface ArticleForRanking {
  articleId: string;
  title: string;
  topic: string;
  embedding: number[]; // 128D from Story 13.4
  hybridScore: number; // Score from hybrid engine
}

/**
 * Final ranked article with click prediction
 */
export interface RankedArticleWithClickPrediction extends ArticleForRanking {
  hybridScore: number;
  clickProbability: number;
  finalScore: number; // Combined score: hybridScore * clickProbability
  explanation: {
    hybridReasoning: string;
    clickReasoning: string;
    influentialPastArticles: string[];
  };
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  hybridWeight: number; // Weight for hybrid score [0, 1]
  clickWeight: number; // Weight for click prediction [0, 1]
  normalizeScores: boolean; // Normalize before blending
  useCache: boolean; // Use prediction cache
}

/**
 * Get default integration config
 */
export function getDefaultIntegrationConfig(): IntegrationConfig {
  return {
    hybridWeight: 0.6,
    clickWeight: 0.4,
    normalizeScores: true,
    useCache: true,
  };
}

/**
 * Rank articles by combining hybrid recommendations with click predictions
 * Final score = (hybridWeight * hybrid_score) + (clickWeight * click_prob)
 *
 * Task 3.1: Production integration
 */
export async function rankArticles(
  articles: ArticleForRanking[],
  userHistory: UserEngagementHistory,
  clickModel: ClickPredictionModel,
  cache?: ClickPredictionCache,
  config: IntegrationConfig = getDefaultIntegrationConfig()
): Promise<RankedArticleWithClickPrediction[]> {
  if (articles.length === 0) {
    return [];
  }

  // Step 1: Get click predictions for all articles
  const predictions = new Map<string, ClickPrediction>();

  for (const article of articles) {
    const cacheKey = cache ? cache.getCacheKey(userHistory.userId, article.articleId) : null;

    let prediction: ClickPrediction | null = null;

    // Try cache first if enabled
    if (config.useCache && cache && cacheKey) {
      prediction = cache.get(cacheKey);
    }

    // If not in cache, generate prediction
    if (!prediction) {
      prediction = clickModel.predict(userHistory, article.embedding, article.topic);
      prediction.articleId = article.articleId;

      // Store in cache if enabled
      if (config.useCache && cache && cacheKey) {
        cache.set(cacheKey, prediction);
      }
    }

    predictions.set(article.articleId, prediction);
  }

  // Step 2: Normalize scores if requested
  let normalizedHybrid = articles.map(a => a.hybridScore);
  let normalizedClick = Array.from(predictions.values()).map(p => p.clickProbability);

  if (config.normalizeScores) {
    const hybridMin = Math.min(...normalizedHybrid);
    const hybridMax = Math.max(...normalizedHybrid);
    const hybridRange = hybridMax - hybridMin || 1;

    const clickMin = Math.min(...normalizedClick);
    const clickMax = Math.max(...normalizedClick);
    const clickRange = clickMax - clickMin || 1;

    normalizedHybrid = normalizedHybrid.map(s => (s - hybridMin) / hybridRange);
    normalizedClick = normalizedClick.map(s => (s - clickMin) / clickRange);
  }

  // Step 3: Combine scores
  const ranked: RankedArticleWithClickPrediction[] = articles.map((article, idx) => {
    const clickPrediction = predictions.get(article.articleId)!;
    const normalizedHybridScore = normalizedHybrid[idx];
    const normalizedClickProb = normalizedClick[idx];

    const finalScore =
      config.hybridWeight * normalizedHybridScore + config.clickWeight * normalizedClickProb;

    return {
      ...article,
      clickProbability: clickPrediction.clickProbability,
      finalScore,
      explanation: {
        hybridReasoning: `Hybrid score: ${normalizedHybridScore.toFixed(2)} (${(normalizedHybridScore * 100).toFixed(0)}%)`,
        clickReasoning: `Click probability: ${clickPrediction.clickProbability.toFixed(3)} (${(clickPrediction.clickProbability * 100).toFixed(1)}%)`,
        influentialPastArticles: clickPrediction.explanation.topInfluentialArticles,
      },
    };
  });

  // Step 4: Sort by final score (descending)
  ranked.sort((a, b) => b.finalScore - a.finalScore);

  return ranked;
}

/**
 * Batch rank articles for multiple users
 * Useful for recommendation batch processing
 */
export async function rankArticlesForUsers(
  articles: ArticleForRanking[],
  userHistories: Map<string, UserEngagementHistory>,
  clickModel: ClickPredictionModel,
  cache?: ClickPredictionCache,
  config: IntegrationConfig = getDefaultIntegrationConfig()
): Promise<Map<string, RankedArticleWithClickPrediction[]>> {
  const results = new Map<string, RankedArticleWithClickPrediction[]>();

  for (const [userId, history] of userHistories) {
    const ranked = await rankArticles(articles, history, clickModel, cache, config);
    results.set(userId, ranked);
  }

  return results;
}

/**
 * Get top-K articles from ranked results
 */
export function getTopK(
  ranked: RankedArticleWithClickPrediction[],
  k: number = 10
): RankedArticleWithClickPrediction[] {
  return ranked.slice(0, Math.min(k, ranked.length));
}

/**
 * Filter articles by minimum click probability threshold
 */
export function filterByClickThreshold(
  ranked: RankedArticleWithClickPrediction[],
  minClickProb: number = 0.2
): RankedArticleWithClickPrediction[] {
  return ranked.filter(a => a.clickProbability >= minClickProb);
}

/**
 * Enforce topic diversity in top-K results
 */
export function enforceTopicDiversity(
  ranked: RankedArticleWithClickPrediction[],
  minDiversityRatio: number = 0.6,
  topK: number = 10
): RankedArticleWithClickPrediction[] {
  if (ranked.length === 0) return [];

  const result: RankedArticleWithClickPrediction[] = [];
  const topicCounts = new Map<string, number>();

  // Pass 1: Greedily select by score while tracking topics
  for (const article of ranked) {
    if (result.length >= topK) break;

    const topicCount = topicCounts.get(article.topic) ?? 0;
    topicCounts.set(article.topic, topicCount + 1);
    result.push(article);
  }

  // Check if diversity constraint is satisfied
  const uniqueTopics = topicCounts.size;
  const maxUniqueTopics = Math.ceil(result.length / 2);
  const diversityRatio = uniqueTopics / Math.max(1, maxUniqueTopics);

  if (diversityRatio >= minDiversityRatio) {
    return result;
  }

  // Pass 2: Re-rank to improve diversity
  const reranked: RankedArticleWithClickPrediction[] = [];
  const usedTopics = new Set<string>();

  // First: one article per topic
  for (const article of ranked) {
    if (reranked.length >= topK) break;

    if (!usedTopics.has(article.topic)) {
      reranked.push(article);
      usedTopics.add(article.topic);
    }
  }

  // Second: fill remaining slots
  for (const article of ranked) {
    if (reranked.length >= topK) break;

    if (!reranked.some(a => a.articleId === article.articleId)) {
      reranked.push(article);
    }
  }

  return reranked;
}

/**
 * Generate explanation for ranking decision
 */
export function generateRankingExplanation(
  article: RankedArticleWithClickPrediction
): string {
  const hybridScore = (article.hybridScore * 100).toFixed(0);
  const clickProb = (article.clickProbability * 100).toFixed(1);
  const finalScore = (article.finalScore * 100).toFixed(0);

  const topArticles = article.explanation.influentialPastArticles.slice(0, 2).join(', ');
  const pastContext = topArticles ? ` (influenced by: ${topArticles})` : '';

  return `Article ranked #${article.articleId}: ${hybridScore}% relevance + ${clickProb}% predicted click = ${finalScore}% final score${pastContext}`;
}

/**
 * Performance monitoring
 */
export interface PerformanceMetrics {
  totalLatencyMs: number;
  predictionLatencyMs: number;
  rankingLatencyMs: number;
  cacheHitRate: number;
  avgClickProbability: number;
  avgFinalScore: number;
}

/**
 * Rank articles with performance monitoring
 */
export async function rankArticlesWithMonitoring(
  articles: ArticleForRanking[],
  userHistory: UserEngagementHistory,
  clickModel: ClickPredictionModel,
  cache?: ClickPredictionCache,
  config: IntegrationConfig = getDefaultIntegrationConfig()
): Promise<{
  ranked: RankedArticleWithClickPrediction[];
  metrics: PerformanceMetrics;
}> {
  const startTime = performance.now();

  // Ranking
  const predictionStart = performance.now();
  const ranked = await rankArticles(articles, userHistory, clickModel, cache, config);
  const predictionLatencyMs = performance.now() - predictionStart;

  const rankingLatencyMs = performance.now() - startTime - predictionLatencyMs;
  const totalLatencyMs = performance.now() - startTime;

  // Metrics
  const avgClickProbability =
    ranked.length > 0
      ? ranked.reduce((sum, a) => sum + a.clickProbability, 0) / ranked.length
      : 0;

  const avgFinalScore =
    ranked.length > 0 ? ranked.reduce((sum, a) => sum + a.finalScore, 0) / ranked.length : 0;

  const cacheStats = cache?.getStats();
  const cacheHitRate = cacheStats?.size ?? 0 / Math.max(articles.length, 1);

  return {
    ranked,
    metrics: {
      totalLatencyMs,
      predictionLatencyMs,
      rankingLatencyMs,
      cacheHitRate,
      avgClickProbability,
      avgFinalScore,
    },
  };
}

// ============================================================================
// Task 2.2: Serendipity Integration (Story 13.6)
// ============================================================================

/**
 * Extended integration config with serendipity support
 */
export interface IntegrationConfigWithSerendipity extends IntegrationConfig {
  serendipity_weight: number; // [0, 1] - weight for serendipity blending (default: 0.0)
  serendipity_enabled: boolean; // Feature flag for serendipity
}

/**
 * Get default config with serendipity disabled
 */
export function getDefaultConfigWithSerendipity(): IntegrationConfigWithSerendipity {
  return {
    ...getDefaultIntegrationConfig(),
    serendipity_weight: 0.0,
    serendipity_enabled: false,
  };
}

/**
 * Rank articles with optional serendipity blending
 *
 * Subtask 2.2.1-2.2.3: Main integration function
 * - Combines click predictions (Story 13.5) with serendipity (Story 13.6)
 * - Provides explanations for both click and serendipity scores
 * - Supports dynamic blending via serendipity_weight parameter
 *
 * @param articles Articles to rank with click-prediction scores
 * @param userHistory User engagement history
 * @param clickModel Click prediction neural model
 * @param serendipityScorer Initialized serendipity scorer
 * @param userPrimaryTopics User's primary topics (for serendipity)
 * @param collaborativeContext Similar users context (for serendipity)
 * @param cache Optional prediction cache
 * @param config Integration config including serendipity_weight
 * @returns Ranked articles with blended scores and explanations
 */
export async function rankArticlesWithSerendipityIntegration(
  articles: ArticleForRanking[],
  userHistory: UserEngagementHistory,
  clickModel: ClickPredictionModel,
  serendipityScorer: SerendipityScorer,
  userPrimaryTopics: string[],
  collaborativeContext: CollaborativeContext,
  cache?: ClickPredictionCache,
  config: IntegrationConfigWithSerendipity = getDefaultConfigWithSerendipity()
): Promise<RankedArticleWithClickPrediction[]> {
  if (articles.length === 0) {
    return [];
  }

  // If serendipity is disabled, use standard ranking
  if (!config.serendipity_enabled || config.serendipity_weight === 0) {
    return rankArticles(articles, userHistory, clickModel, cache, config);
  }

  // Validate serendipity weight is in [0, 1]
  if (config.serendipity_weight < 0 || config.serendipity_weight > 1) {
    throw new Error(
      `Invalid serendipity_weight: ${config.serendipity_weight}. Must be in [0, 1]. Using clamped value.`
    );
  }

  // Step 1: Get click predictions for all articles (same as standard ranking)
  const predictions = new Map<string, ClickPrediction>();

  for (const article of articles) {
    const cacheKey = cache ? cache.getCacheKey(userHistory.userId, article.articleId) : null;

    let prediction: ClickPrediction | null = null;

    // Try cache first if enabled
    if (config.useCache && cache && cacheKey) {
      prediction = cache.get(cacheKey);
    }

    // If not in cache, generate prediction
    if (!prediction) {
      prediction = clickModel.predict(userHistory, article.embedding, article.topic);
      prediction.articleId = article.articleId;

      // Store in cache if enabled
      if (config.useCache && cache && cacheKey) {
        cache.set(cacheKey, prediction);
      }
    }

    predictions.set(article.articleId, prediction);
  }

  // Step 2: Use serendipity ranking for blending
  const serendipityInput: SerendipityInput = {
    userId: userHistory.userId,
    userPrimaryTopics,
    userReadHistory: new Set(userHistory.engagedArticles.map(a => a.articleId)),
    candidateArticles: articles,
  };

  // Prepare articles with click-prediction scores for serendipity blending
  const articlesWithClickScores = articles.map(a => {
    const score = predictions.get(a.articleId)?.clickProbability ?? 0.5;

    // Log if using default score (missing prediction)
    if (!predictions.has(a.articleId)) {
      console.warn(
        `[Serendipity] Missing click-prediction score for article ${a.articleId}. Using default 0.5.`
      );
    }

    return {
      ...a,
      clickPredictionScore: score,
    };
  });

  // Get serendipity ranking (blends click + serendipity)
  const serendipityRanked = serendipityRanking(
    articlesWithClickScores,
    serendipityInput,
    collaborativeContext,
    serendipityScorer,
    config.serendipity_weight
  );

  // Step 3: Convert serendipity results back to standard format with enhanced explanations
  const ranked: RankedArticleWithClickPrediction[] = serendipityRanked.map((sr) => {
    const article = articles.find(a => a.articleId === sr.articleId)!;
    const prediction = predictions.get(sr.articleId)!;

    return {
      articleId: sr.articleId,
      title: article.title,
      topic: sr.topic,
      embedding: article.embedding,
      hybridScore: sr.clickPredictionScore,
      clickProbability: sr.clickPredictionScore,
      finalScore: sr.finalScore,
      explanation: {
        hybridReasoning: `Click prediction: ${sr.clickPredictionScore.toFixed(3)} (${(sr.clickPredictionScore * 100).toFixed(1)}%)`,
        clickReasoning: `Serendipity score: ${sr.serendipityScore.toFixed(3)} (${(sr.serendipityScore * 100).toFixed(1)}%)`,
        influentialPastArticles: sr.explanation?.topInfluentialArticles ?? [],
      },
    };
  });

  return ranked;
}

/**
 * Batch rank articles with serendipity for multiple users
 */
export async function rankArticlesWithSerendipityForUsers(
  articles: ArticleForRanking[],
  userHistories: Map<string, UserEngagementHistory>,
  userTopics: Map<string, string[]>, // userId -> primary topics
  collaborativeContexts: Map<string, CollaborativeContext>, // userId -> context
  clickModel: ClickPredictionModel,
  serendipityScorer: SerendipityScorer,
  cache?: ClickPredictionCache,
  config: IntegrationConfigWithSerendipity = getDefaultConfigWithSerendipity()
): Promise<Map<string, RankedArticleWithClickPrediction[]>> {
  const results = new Map<string, RankedArticleWithClickPrediction[]>();

  for (const [userId, history] of userHistories) {
    const topics = userTopics.get(userId) ?? [];
    const collaborativeContext = collaborativeContexts.get(userId) ?? {
      userId,
      similarUsers: [],
      similarUserReadHistories: new Map(),
      similarityScores: new Map(),
    };

    const ranked = await rankArticlesWithSerendipityIntegration(
      articles,
      history,
      clickModel,
      serendipityScorer,
      topics,
      collaborativeContext,
      cache,
      config
    );

    results.set(userId, ranked);
  }

  return results;
}
