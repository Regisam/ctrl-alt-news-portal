/**
 * CF Fallback Engine (Story 13.2 - Phase 2, Task 2.2)
 * Handles coverage gaps by blending CF with content-based and rules-based recommendations
 */

import type { CFRecommendation } from './itemCollaborativeFiltering';

export interface FallbackEngineConfig {
  cfMinCoverage?: number; // If CF coverage below this %, blend with fallback (default: 70%)
  contentSimilarityWeight?: number; // Weight for content-based signal (default: 0.3)
  ruleEngineWeight?: number; // Weight for rules-based signal (default: 0.2)
  diversityPenalty?: number; // Penalize already-recommended articles (default: 0.2)
}

export interface CoverageAnalysis {
  cfCoverage: number; // % of articles with CF score
  contentCoverage: number; // % of articles with content score
  rulesCoverage: number; // % of articles with rules score
  overallCoverage: number; // Union of all three
  recommendableArticles: number; // Total articles that can be recommended
}

/**
 * Analyze coverage across all recommendation signals
 */
export function analyzeCoverage(
  allArticles: Set<string>,
  cfArticles: Set<string>,
  contentArticles: Set<string>,
  rulesArticles: Set<string>
): CoverageAnalysis {
  const unionCoverage = new Set([...cfArticles, ...contentArticles, ...rulesArticles]);

  return {
    cfCoverage: allArticles.size > 0 ? (cfArticles.size / allArticles.size) * 100 : 0,
    contentCoverage:
      allArticles.size > 0 ? (contentArticles.size / allArticles.size) * 100 : 0,
    rulesCoverage: allArticles.size > 0 ? (rulesArticles.size / allArticles.size) * 100 : 0,
    overallCoverage:
      allArticles.size > 0 ? (unionCoverage.size / allArticles.size) * 100 : 0,
    recommendableArticles: unionCoverage.size,
  };
}

/**
 * Blend multiple recommendation signals with fallback logic
 * Priority: CF > Content > Rules
 */
export function blendRecommendations(
  cfRecommendations: CFRecommendation[],
  contentRecommendations: { articleId: string; score: number }[],
  rulesRecommendations: { articleId: string; score: number }[],
  config: FallbackEngineConfig = {}
): CFRecommendation[] {
  const cfMinCoverage = config.cfMinCoverage ?? 70;
  const contentWeight = config.contentSimilarityWeight ?? 0.3;
  const rulesWeight = config.ruleEngineWeight ?? 0.2;
  const diversityPenalty = config.diversityPenalty ?? 0.2;

  // Check if CF coverage is sufficient
  const cfArticleIds = new Set(cfRecommendations.map((r) => r.articleId));
  const totalArticles = new Set([
    ...cfArticleIds,
    ...contentRecommendations.map((r) => r.articleId),
    ...rulesRecommendations.map((r) => r.articleId),
  ]);

  const cfCoveragePercent = totalArticles.size > 0 ? (cfArticleIds.size / totalArticles.size) * 100 : 0;

  // If CF coverage is sufficient, return as-is (or with light content boost)
  if (cfCoveragePercent >= cfMinCoverage) {
    return cfRecommendations;
  }

  // Otherwise, blend all signals
  const blendedScores = new Map<
    string,
    { cf: number; content: number; rules: number; totalScore: number }
  >();

  // Add CF scores
  for (const rec of cfRecommendations) {
    blendedScores.set(rec.articleId, {
      cf: rec.score,
      content: 0,
      rules: 0,
      totalScore: rec.score,
    });
  }

  // Add content scores (with diversity penalty for articles already in CF)
  for (const rec of contentRecommendations) {
    const existing = blendedScores.get(rec.articleId) || {
      cf: 0,
      content: 0,
      rules: 0,
      totalScore: 0,
    };

    // Apply diversity penalty if already in CF
    const penalty = cfArticleIds.has(rec.articleId) ? diversityPenalty : 1.0;
    const contentScore = rec.score * contentWeight * penalty;

    existing.content = contentScore;
    existing.totalScore = existing.cf + existing.content + existing.rules;

    blendedScores.set(rec.articleId, existing);
  }

  // Add rules scores
  for (const rec of rulesRecommendations) {
    const existing = blendedScores.get(rec.articleId) || {
      cf: 0,
      content: 0,
      rules: 0,
      totalScore: 0,
    };

    // Apply diversity penalty if already in CF or content
    const isPredominant = cfArticleIds.has(rec.articleId);
    const penalty = isPredominant ? diversityPenalty : 1.0;
    const rulesScore = rec.score * rulesWeight * penalty;

    existing.rules = rulesScore;
    existing.totalScore = existing.cf + existing.content + existing.rules;

    blendedScores.set(rec.articleId, existing);
  }

  // Convert to CFRecommendation format and sort
  const blended: CFRecommendation[] = Array.from(blendedScores.entries()).map(
    ([articleId, { cf, content, rules, totalScore }]) => ({
      articleId,
      score: Math.min(totalScore, 1.0), // Clamp to [0, 1]
      reason: buildRecommendationReason(cf > 0, content > 0, rules > 0),
      similarUserCount: cf > 0 ? 1 : 0, // Approximation
    })
  );

  return blended.sort((a, b) => b.score - a.score);
}

/**
 * Build human-readable recommendation reason
 */
function buildRecommendationReason(hasCF: boolean, hasContent: boolean, hasRules: boolean): string {
  const reasons: string[] = [];

  if (hasCF) reasons.push('users like you');
  if (hasContent) reasons.push('similar topics');
  if (hasRules) reasons.push('popular');

  return `Recommended because: ${reasons.join(', ')}`;
}

/**
 * Serendipity diversification: reduce score for articles in user's recent topics
 */
export function applySerendipityDiversification(
  recommendations: CFRecommendation[],
  userRecentTopics: Set<string>,
  articleTopicMap: Map<string, string>, // article -> topic
  diversityFactor?: number // Factor to reduce diversity articles (default: 0.7)
): CFRecommendation[] {
  const factor = diversityFactor ?? 0.7;

  return recommendations.map((rec) => {
    const articleTopic = articleTopicMap.get(rec.articleId);

    // Penalize if article is in user's recent topics
    if (articleTopic && userRecentTopics.has(articleTopic)) {
      return {
        ...rec,
        score: rec.score * factor,
        reason: `${rec.reason} (but different from your recent reads)`,
      };
    }

    return rec;
  });
}

/**
 * Validate fallback recommendations
 */
export function validateFallbackRecommendations(
  recommendations: CFRecommendation[]
): { valid: boolean; reason?: string } {
  const seen = new Set<string>();

  for (const rec of recommendations) {
    // Check for duplicates
    if (seen.has(rec.articleId)) {
      return { valid: false, reason: `Duplicate article ${rec.articleId}` };
    }
    seen.add(rec.articleId);

    // Check score validity
    if (!Number.isFinite(rec.score) || rec.score < 0 || rec.score > 1) {
      return { valid: false, reason: `Invalid score ${rec.score} for ${rec.articleId}` };
    }

    // Check reason
    if (!rec.reason || rec.reason.length === 0) {
      return { valid: false, reason: `Empty reason for ${rec.articleId}` };
    }
  }

  return { valid: true };
}
