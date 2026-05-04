import type { Article, Category } from "./data";

// Type definitions for rules engine
export interface RuleCondition {
  type: "topic_interest" | "reading_history" | "bookmarked_author" | "always_match";
  field?: string;
  value?: string | number;
  operator?: "equals" | "includes" | "gt" | "lt";
  threshold?: number;
}

export interface RuleAction {
  type: "boost_articles" | "filter_articles" | "sort_articles" | "exclude_articles";
  field?: string;
  value?: string;
  weight?: number;
  order?: "ascending" | "descending";
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  metadata: {
    ab_test_group?: string;
    ctr_target?: number;
    impressions: number;
    clicks: number;
    firing_count: number;
  };
}

export interface UserContext {
  favoriteCategories: string[];
  readingHistory: Article[];
  bookmarks: string[]; // articleIds
}

export interface RecommendationResult {
  articles: Article[];
  firedRules: string[]; // rule IDs that fired
  executionTime: number;
  cacheHit: boolean;
}

// Cache structure for performance optimization
interface CacheEntry {
  result: RecommendationResult;
  timestamp: number;
}

export class RulesEngine {
  private rules: Map<string, Rule> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTTL: number = 300000; // 5 minutes default
  private performanceBudget: number = 5; // 5ms default
  private allArticles: Article[] = [];

  constructor(rules: Rule[] = [], cacheTTLMs?: number, performanceBudgetMs?: number) {
    rules.forEach((rule) => this.addRule(rule));
    if (cacheTTLMs) this.cacheTTL = cacheTTLMs;
    if (performanceBudgetMs) this.performanceBudget = performanceBudgetMs;
  }

  addRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  setArticles(articles: Article[]): void {
    this.allArticles = articles;
    this.clearCache();
  }

  private getCacheKey(context: UserContext): string {
    return JSON.stringify({
      categories: context.favoriteCategories.sort(),
      historyIds: context.readingHistory.map((a) => a.id).sort(),
      bookmarkIds: context.bookmarks.sort(),
    });
  }

  private getFromCache(key: string): RecommendationResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  private setCache(key: string, result: RecommendationResult): void {
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
    });
  }

  private evaluateCondition(condition: RuleCondition, context: UserContext): boolean {
    const startTime = performance.now();

    try {
      switch (condition.type) {
        case "topic_interest":
          return context.favoriteCategories.includes(condition.value as string);

        case "reading_history": {
          const threshold = condition.threshold || 1;
          const count = context.readingHistory.filter(
            (a) => a.category === condition.value
          ).length;
          return count >= threshold;
        }

        case "bookmarked_author": {
          const authorBookmarks = context.bookmarks.filter((articleId) => {
            const article = this.allArticles.find((a) => a.id.toString() === articleId);
            return article?.author === condition.value;
          });
          const threshold = condition.threshold || 1;
          return authorBookmarks.length >= threshold;
        }

        case "always_match":
          return true;

        default:
          return false;
      }
    } finally {
      const elapsed = performance.now() - startTime;
      if (elapsed > 1) {
        console.warn(`Slow condition evaluation (${elapsed.toFixed(2)}ms): ${condition.type}`);
      }
    }
  }

  private evaluateRule(rule: Rule, context: UserContext): boolean {
    if (!rule.enabled) return false;

    // All conditions must match (AND logic)
    return rule.conditions.every((condition) => this.evaluateCondition(condition, context));
  }

  private applyActions(
    articles: Article[],
    actions: RuleAction[]
  ): (Article & { _boostWeight?: number })[] {
    let result: (Article & { _boostWeight?: number })[] = [...articles];

    for (const action of actions) {
      switch (action.type) {
        case "boost_articles": {
          // Boost articles matching the field/value with weight multiplier
          const boosted = result.map((article) => {
            const matches =
              action.field === "category" && article.category === action.value;
            if (matches && action.weight) {
              return { ...article, _boostWeight: ((article._boostWeight || 1) * action.weight) };
            }
            return article;
          });
          result = boosted;
          break;
        }

        case "filter_articles": {
          // Filter articles to only those matching field/value
          result = result.filter((article) => {
            if (action.field === "category") {
              return article.category === action.value;
            }
            return true;
          });
          break;
        }

        case "sort_articles": {
          // Sort articles by field in order
          result.sort((a, b) => {
            if (action.field === "date") {
              const dateA = new Date(a.date).getTime();
              const dateB = new Date(b.date).getTime();
              return action.order === "descending" ? dateB - dateA : dateA - dateB;
            }
            return 0;
          });
          break;
        }

        case "exclude_articles": {
          // Exclude articles matching field/value
          result = result.filter((article) => {
            if (action.field === "category") {
              return article.category !== action.value;
            }
            return true;
          });
          break;
        }
      }
    }

    return result;
  }

  evaluate(
    context: UserContext,
    allArticles?: Article[]
  ): RecommendationResult {
    const startTime = performance.now();
    if (allArticles) this.setArticles(allArticles);

    // Check cache
    const cacheKey = this.getCacheKey(context);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { ...cached, cacheHit: true };
    }

    const firedRules: string[] = [];
    let recommendations: Article[] = [];
    const sortedRules = Array.from(this.rules.values()).sort((a, b) => a.priority - b.priority);

    // Execute rules in priority order
    for (const rule of sortedRules) {
      if (this.evaluateRule(rule, context)) {
        firedRules.push(rule.id);
        rule.metadata.firing_count++;

        // Apply rule actions
        const candidates = this.applyActions(this.allArticles, rule.actions);

        // Combine with existing recommendations (avoid duplicates)
        const existingIds = new Set(recommendations.map((a) => a.id));
        const newArticles = candidates.filter((a) => !existingIds.has(a.id));
        recommendations = [...recommendations, ...newArticles];
      }
    }

    // Sort by boost weight if applied, otherwise use rule order
    (recommendations as (Article & { _boostWeight?: number })[]).sort((a, b) => {
      const weightA = a._boostWeight || 0;
      const weightB = b._boostWeight || 0;
      if (weightA !== weightB) return weightB - weightA;
      return 0;
    });

    // Limit to max recommendations
    const maxRecs = 5;
    recommendations = recommendations.slice(0, maxRecs);

    const executionTime = performance.now() - startTime;

    if (executionTime > this.performanceBudget) {
      console.warn(
        `Rule evaluation exceeded performance budget: ${executionTime.toFixed(2)}ms (budget: ${this.performanceBudget}ms)`
      );
    }

    const result: RecommendationResult = {
      articles: recommendations,
      firedRules,
      executionTime,
      cacheHit: false,
    };

    // Cache result
    this.setCache(cacheKey, result);

    return result;
  }

  getRuleMetrics(ruleId: string): Rule["metadata"] | null {
    const rule = this.rules.get(ruleId);
    return rule?.metadata || null;
  }

  getAllRulesMetrics(): Record<string, Rule["metadata"]> {
    const metrics: Record<string, Rule["metadata"]> = {};
    this.rules.forEach((rule) => {
      metrics[rule.id] = rule.metadata;
    });
    return metrics;
  }

  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = enabled;
    this.clearCache();
    return true;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getStats(): {
    totalRules: number;
    enabledRules: number;
    cacheSize: number;
  } {
    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter((r) => r.enabled).length,
      cacheSize: this.cache.size,
    };
  }
}
