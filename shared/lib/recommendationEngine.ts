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
import { HybridRecommendation } from './hybridRecommendationEngine';

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
