/**
 * CF Recommendation Engine (Story 13.2 - Phase 2)
 * Generates collaborative filtering recommendations using user and item similarity
 */

import type { SimilarityMatrix } from './userSimilarity';
import type { ItemSimilarityMatrix, CFRecommendation } from './itemCollaborativeFiltering';

export interface CFRecommendationRequest {
  userId: string;
  userReadHistory: Set<string>; // Articles already read by this user
  topK?: number; // Default 5
  minUserSimilarity?: number; // Only consider users with similarity >= threshold
  minItemSimilarity?: number; // Only consider items with similarity >= threshold
}

export interface CFRecommendationResult {
  userId: string;
  recommendations: CFRecommendation[];
  coveragePercentage: number; // % of all articles that have cf score
  timestamp: Date;
  computationTimeMs: number;
}

/**
 * Generate CF recommendations for a user using user and item similarity matrices
 * Algorithm:
 * 1. Find similar users (from user similarity matrix)
 * 2. Collect articles they read (that target user hasn't)
 * 3. Score each article by: item_similarity × user_similarity
 * 4. Rank and return top-K
 */
export function generateCFRecommendations(
  request: CFRecommendationRequest,
  userSimilarityMatrix: SimilarityMatrix,
  itemSimilarityMatrix: ItemSimilarityMatrix,
  userArticleHistory: Map<string, Set<string>> // Map of userId -> articles they've read
): CFRecommendationResult {
  const startTime = performance.now();
  const topK = request.topK ?? 5;
  const minUserSim = request.minUserSimilarity ?? 0.3;
  const minItemSim = request.minItemSimilarity ?? 0.2;

  const articleScores = new Map<string, { score: number; similarUserCount: number }>();

  // Step 1: Find similar users
  const userIndex = userSimilarityMatrix.userIds.indexOf(request.userId);
  if (userIndex === -1) {
    // User not in similarity matrix - new user cold start
    return {
      userId: request.userId,
      recommendations: [],
      coveragePercentage: 0,
      timestamp: new Date(),
      computationTimeMs: performance.now() - startTime,
    };
  }

  const userSimilarities = userSimilarityMatrix.similarities.get(request.userId);
  if (!userSimilarities) {
    return {
      userId: request.userId,
      recommendations: [],
      coveragePercentage: 0,
      timestamp: new Date(),
      computationTimeMs: performance.now() - startTime,
    };
  }

  // Step 2: Iterate similar users and collect articles
  for (let i = 0; i < userSimilarityMatrix.userIds.length; i++) {
    const similarUserId = userSimilarityMatrix.userIds[i];
    const userSimilarity = userSimilarities[i];

    // Skip low-similarity users and self
    if (!userSimilarity || userSimilarity < minUserSim || similarUserId === request.userId) {
      continue;
    }

    // Get articles read by similar user
    const similarUserArticles = userArticleHistory.get(similarUserId) ?? new Set();

    // Step 3: Score articles not read by target user
    for (const articleId of similarUserArticles) {
      // Skip if user already read this article
      if (request.userReadHistory.has(articleId)) {
        continue;
      }

      // Get item similarity between articles from target user's read history
      let itemSimilarityScore = 0;
      let scoredArticleCount = 0;

      for (const targetArticle of request.userReadHistory) {
        const targetSimilarities = itemSimilarityMatrix.similarities.get(targetArticle);
        if (!targetSimilarities) {
          continue;
        }

        const targetArticleIndex = itemSimilarityMatrix.articleIds.indexOf(articleId);
        if (targetArticleIndex !== -1) {
          const sim = targetSimilarities[targetArticleIndex];
          if (sim && sim >= minItemSim) {
            itemSimilarityScore += sim;
            scoredArticleCount++;
          }
        }
      }

      // Normalize item similarity (average across target articles)
      const avgItemSimilarity =
        scoredArticleCount > 0 ? itemSimilarityScore / scoredArticleCount : minItemSim * 0.5;

      // Combined score: user_similarity * item_similarity
      const combinedScore = userSimilarity * avgItemSimilarity;

      // Accumulate score
      const existing = articleScores.get(articleId);
      if (existing) {
        existing.score += combinedScore;
        existing.similarUserCount++;
      } else {
        articleScores.set(articleId, {
          score: combinedScore,
          similarUserCount: 1,
        });
      }
    }
  }

  // Step 4: Rank and return top-K
  const recommendations: CFRecommendation[] = Array.from(articleScores.entries())
    .map(([articleId, { score, similarUserCount }]) => ({
      articleId,
      score: Math.min(score / similarUserCount, 1.0), // Normalize by count
      reason: `${similarUserCount} user${similarUserCount > 1 ? 's' : ''} like you read this`,
      similarUserCount,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const computationTimeMs = performance.now() - startTime;
  const coverage = articleScores.size > 0 ? 100 : 0;

  return {
    userId: request.userId,
    recommendations,
    coveragePercentage: coverage,
    timestamp: new Date(),
    computationTimeMs,
  };
}

/**
 * Get CF recommendations with content-based fallback
 * If CF coverage is low, blend with content-based similarity
 */
export function generateCFRecommendationsWithFallback(
  request: CFRecommendationRequest,
  userSimilarityMatrix: SimilarityMatrix,
  itemSimilarityMatrix: ItemSimilarityMatrix,
  userArticleHistory: Map<string, Set<string>>,
  contentSimilarityScorer?: (articleId: string, userHistory: Set<string>) => number,
  minCFCoverageForPure?: number // If coverage below this, blend with fallback (default 70%)
): CFRecommendationResult {
  const minCoverage = minCFCoverageForPure ?? 70;

  // Get CF recommendations
  const cfResult = generateCFRecommendations(
    request,
    userSimilarityMatrix,
    itemSimilarityMatrix,
    userArticleHistory
  );

  // If coverage is sufficient, return CF only
  if (cfResult.coveragePercentage >= minCoverage || !contentSimilarityScorer) {
    return cfResult;
  }

  // Otherwise, blend with content-based scores
  const cfArticleIds = new Set(cfResult.recommendations.map((r) => r.articleId));
  const blendedRecommendations = [...cfResult.recommendations];

  // Add content-based recommendations for missing articles
  const allArticles = itemSimilarityMatrix.articleIds.filter(
    (a) => !request.userReadHistory.has(a) && !cfArticleIds.has(a)
  );

  for (const articleId of allArticles) {
    const contentScore = contentSimilarityScorer(articleId, request.userReadHistory);
    const minItemSim = request.minItemSimilarity ?? 0.2;
    if (contentScore >= minItemSim) {
      blendedRecommendations.push({
        articleId,
        score: contentScore,
        reason: 'Similar to articles you read',
        similarUserCount: 0,
      });
    }
  }

  // Re-sort and slice
  const topK = request.topK ?? 5;
  const finalRecommendations = blendedRecommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return {
    userId: request.userId,
    recommendations: finalRecommendations,
    coveragePercentage: cfResult.coveragePercentage,
    timestamp: new Date(),
    computationTimeMs: cfResult.computationTimeMs,
  };
}

/**
 * Validate CF recommendations
 */
export function validateCFRecommendations(
  result: CFRecommendationResult
): { valid: boolean; reason?: string } {
  for (const rec of result.recommendations) {
    if (!rec.articleId || rec.articleId.length === 0) {
      return { valid: false, reason: 'Empty articleId' };
    }

    if (!Number.isFinite(rec.score) || rec.score < 0 || rec.score > 1) {
      return {
        valid: false,
        reason: `Invalid score ${rec.score} for article ${rec.articleId}`,
      };
    }

    if (rec.similarUserCount < 0) {
      return {
        valid: false,
        reason: `Negative similarUserCount for article ${rec.articleId}`,
      };
    }
  }

  return { valid: true };
}
