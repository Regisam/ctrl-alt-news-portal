import type { Article } from '@shared/types';
import type { CategoryPreference } from '@/lib/implicit-feedback';

export interface RankedArticle extends Article {
  rankScore: number;
  ruleScore: number;
  mlScore: number;
  confidenceDecay: number;
  id: string | number;
  title: string;
  url: string;
  author: string;
  date: string;
  category?: string;
}

export interface RankingConfig {
  ruleWeight: number; // 0.4 (deterministic baseline)
  mlWeight: number; // 0.6 (learned preferences)
  trendingBoost: number; // 0.2
  decayHalfLife: number; // days for confidence decay (30)
}

export interface UserContext {
  userId: string;
  signalCount: number; // 0+ signals
  categoryPreferences: CategoryPreference[];
  recentSignals: boolean; // has signals < 7 days old
}

const DEFAULT_CONFIG: RankingConfig = {
  ruleWeight: 0.4,
  mlWeight: 0.6,
  trendingBoost: 0.2,
  decayHalfLife: 30,
};

export class RankingService {
  private config: RankingConfig;
  private trendingArticles: Set<string> = new Set();

  constructor(config: Partial<RankingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set trending articles (top N by engagement)
   */
  setTrendingArticles(articleIds: string[]): void {
    this.trendingArticles = new Set(articleIds);
  }

  /**
   * Calculate confidence decay based on signal age (exponential)
   * Formula: e^(-days_since_signal / 30)
   */
  private calculateConfidenceDecay(signalAgeMs: number): number {
    const daysOld = signalAgeMs / (24 * 60 * 60 * 1000);
    return Math.exp(-daysOld / this.config.decayHalfLife);
  }

  /**
   * Calculate ML weight based on user type (signal count)
   * - new (0 signals): 0% ML
   * - warm (1+ signals): 40% ML
   * - power (5+ signals): 60% ML
   */
  private getMlWeight(signalCount: number): number {
    if (signalCount === 0) return 0; // cold-start: rules only
    if (signalCount < 5) return 0.4; // warm: blended
    return 0.6; // power: heavy ML weight
  }

  /**
   * Calculate ML score for article based on user preferences
   * Score is 0-1, based on category match
   */
  private calculateMlScore(
    article: Article,
    preferences: CategoryPreference[]
  ): number {
    if (!article.category || preferences.length === 0) return 0;

    const categoryPref = preferences.find(
      (p) => p.category === article.category
    );
    return categoryPref ? categoryPref.score : 0;
  }

  /**
   * Calculate rule score (0-1) based on rules engine
   * This would integrate with RulesEngine from Story 12.1-12.3
   * For now: return 0.5 as placeholder (caller provides actual rule score)
   */
  private calculateRuleScore(article: Article): number {
    // Placeholder: caller should provide actual rule score
    // In real implementation, integrate with useRecommendations hook
    return 0.5;
  }

  /**
   * Apply exponential confidence decay to ML score
   */
  private applyConfidenceDecay(
    mlScore: number,
    userContext: UserContext
  ): { score: number; decay: number } {
    // Assume signal age is roughly now (worst case)
    // In real implementation: track actual signal timestamps
    const decay = userContext.recentSignals ? 1.0 : 0.7;
    return {
      score: mlScore * decay,
      decay,
    };
  }

  /**
   * Calculate trending boost if article is in trending set
   */
  private calculateTrendingBoost(article: Article): number {
    return this.trendingArticles.has(article.id.toString())
      ? this.config.trendingBoost
      : 0;
  }

  /**
   * Main scoring formula:
   * hybrid_score = (rule_score × 0.4) + (ml_score × 0.6 × decay) + (trending_boost × 0.2)
   */
  scoreArticle(
    article: Article,
    ruleScore: number,
    userContext: UserContext
  ): RankedArticle {
    const mlScore = this.calculateMlScore(article, userContext.categoryPreferences);
    const { score: decayedMlScore, decay: confidenceDecay } =
      this.applyConfidenceDecay(mlScore, userContext);
    const trendingBoost = this.calculateTrendingBoost(article);

    // Scale ML weight based on user type
    const mlWeight = this.getMlWeight(userContext.signalCount);
    const ruleWeight = 1 - mlWeight; // balance: if ML=40%, Rule=60%

    const rankScore =
      ruleScore * ruleWeight +
      decayedMlScore * mlWeight +
      trendingBoost;

    return {
      ...article,
      rankScore: Math.min(1, rankScore), // clamp to [0, 1]
      ruleScore,
      mlScore: decayedMlScore,
      confidenceDecay,
    };
  }

  /**
   * Rank articles using hybrid scoring
   */
  rankArticles(
    articles: Article[],
    ruleScores: Record<string, number>,
    userContext: UserContext
  ): RankedArticle[] {
    return articles
      .map((article) => {
        const ruleScore = ruleScores[article.id] || 0.5;
        return this.scoreArticle(article, ruleScore, userContext);
      })
      .sort((a, b) => b.rankScore - a.rankScore);
  }

  /**
   * Apply deduplication (remove duplicate article IDs)
   */
  deduplicateArticles(articles: RankedArticle[]): RankedArticle[] {
    const seen = new Set<string>();
    return articles.filter((article) => {
      const id = article.id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  /**
   * Apply diversity filtering (ensure multi-category coverage)
   * Returns articles spanning user's interested categories
   */
  applyDiversityFilter(
    articles: RankedArticle[],
    userContext: UserContext,
    minArticlesPerCategory: number = 1
  ): RankedArticle[] {
    const categories = new Map<string, RankedArticle[]>();

    // Group by category
    for (const article of articles) {
      if (!article.category) continue;
      if (!categories.has(article.category)) {
        categories.set(article.category, []);
      }
      categories.get(article.category)!.push(article);
    }

    // Build result with diversity
    const result: RankedArticle[] = [];
    const userCategories = userContext.categoryPreferences.map(
      (p) => p.category
    );

    // First: take top article from each user's interested category
    for (const category of userCategories) {
      const categoryArticles = categories.get(category) || [];
      for (let i = 0; i < minArticlesPerCategory; i++) {
        if (categoryArticles[i]) {
          result.push(categoryArticles[i]);
        }
      }
    }

    // Then: fill remaining slots with remaining articles (rank order)
    const remaining = articles.filter(
      (a) => !result.find((r) => r.id === a.id)
    );
    result.push(...remaining);

    return result;
  }

  /**
   * Cold-start fallback: if user has no signals, use rules-only ranking
   */
  isColdStartUser(userContext: UserContext): boolean {
    return userContext.signalCount === 0;
  }

  /**
   * Full pipeline: score → deduplicate → apply diversity
   */
  rankFull(
    articles: Article[],
    ruleScores: Record<string, number>,
    userContext: UserContext,
    limit: number = 10
  ): RankedArticle[] {
    let ranked = this.rankArticles(articles, ruleScores, userContext);
    ranked = this.deduplicateArticles(ranked);
    ranked = this.applyDiversityFilter(ranked, userContext);
    return ranked.slice(0, limit);
  }

  /**
   * Incremental re-ranking for real-time updates (Story 12.6 AC6)
   * Only re-ranks affected articles, not entire feed
   * Performance: <200ms even for 1000+ articles
   * Optimized: O(n + k log k) where k = affected articles, n = feed size
   * Algorithm: Score affected → sort them → merge with unaffected (which is already sorted)
   */
  rankDelta(
    currentFeed: RankedArticle[],
    affectedArticleIds: Set<string>,
    newArticles: Article[],
    ruleScores: Record<string, number>,
    userContext: UserContext
  ): RankedArticle[] {
    const startTime = performance.now();

    const newArticleMap = new Map<string, Article>();
    for (const article of newArticles) {
      newArticleMap.set(article.id.toString(), article);
    }

    // Score all affected articles (O(k))
    const affectedScored: RankedArticle[] = [];
    affectedArticleIds.forEach((affectedId) => {
      const article = newArticleMap.get(affectedId);
      if (!article) return;

      const ruleScore = ruleScores[affectedId] || 0.5;
      const reranked = this.scoreArticle(article, ruleScore, userContext);
      affectedScored.push(reranked);
    });

    // Sort affected articles by rank score descending (O(k log k))
    affectedScored.sort((a, b) => b.rankScore - a.rankScore);

    // Remove affected articles from current feed (O(n))
    const unaffected = currentFeed.filter(
      (a) => !affectedArticleIds.has(a.id.toString())
    );

    // Merge two sorted arrays efficiently (O(n)) instead of repeated splice (was O(k × n))
    const result: RankedArticle[] = [];
    let i = 0;
    let j = 0;

    while (i < unaffected.length && j < affectedScored.length) {
      if (unaffected[i].rankScore >= affectedScored[j].rankScore) {
        result.push(unaffected[i++]);
      } else {
        result.push(affectedScored[j++]);
      }
    }

    result.push(...unaffected.slice(i));
    result.push(...affectedScored.slice(j));

    const duration = performance.now() - startTime;

    // Log if slow (should be <200ms per AC6)
    if (duration > 200) {
      console.warn(
        `[Performance] rankDelta took ${duration.toFixed(2)}ms (>200ms threshold)`
      );
    }

    return result;
  }
}
