import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import type { Article } from "@/lib/data";
import { aiArticles, scienceArticles, roboticsArticles, trendingArticles } from "@/lib/data";
import { RulesEngine, type Rule, type UserContext } from "@/lib/rules-engine";
import { useUserPreferences } from "./useUserPreferences";
import { useReadingHistory } from "./useReadingHistory";
import { useBookmarks } from "./useBookmarks";
import { useAuthorFollow } from "./useAuthorFollow";
import { useTrending } from "./useTrending";
import { useImplicitFeedback } from "./useImplicitFeedback";

// Default rules for Phase 1 (topic-based rules engine)
const DEFAULT_RULES: Rule[] = [
  {
    id: "rule_topic_ai",
    name: "AI Topic Preference",
    description: "Boost AI articles for users interested in AI",
    priority: 100,
    enabled: true,
    conditions: [
      { type: "topic_interest", field: "favoriteCategories", value: "AI" },
      { type: "reading_history", field: "category", operator: "equals", value: "AI", threshold: 3 },
    ],
    actions: [{ type: "boost_articles", field: "category", value: "AI", weight: 2.0 }],
    metadata: { ab_test_group: "topic_rules_v1", ctr_target: 0.35, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_topic_science",
    name: "Science Topic Preference",
    priority: 101,
    enabled: true,
    conditions: [
      { type: "topic_interest", field: "favoriteCategories", value: "SCIENCE" },
      { type: "reading_history", field: "category", operator: "equals", value: "SCIENCE", threshold: 3 },
    ],
    actions: [{ type: "boost_articles", field: "category", value: "SCIENCE", weight: 2.0 }],
    metadata: { ab_test_group: "topic_rules_v1", ctr_target: 0.35, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_topic_robotics",
    name: "Robotics Topic Preference",
    priority: 102,
    enabled: true,
    conditions: [
      { type: "topic_interest", field: "favoriteCategories", value: "ROBOTICS" },
      { type: "reading_history", field: "category", operator: "equals", value: "ROBOTICS", threshold: 3 },
    ],
    actions: [{ type: "boost_articles", field: "category", value: "ROBOTICS", weight: 2.0 }],
    metadata: { ab_test_group: "topic_rules_v1", ctr_target: 0.35, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_topic_gadgets",
    name: "Gadgets Topic Preference",
    priority: 103,
    enabled: true,
    conditions: [
      { type: "topic_interest", field: "favoriteCategories", value: "GADGETS" },
      { type: "reading_history", field: "category", operator: "equals", value: "GADGETS", threshold: 3 },
    ],
    actions: [{ type: "boost_articles", field: "category", value: "GADGETS", weight: 2.0 }],
    metadata: { ab_test_group: "topic_rules_v1", ctr_target: 0.35, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_author_alex_chen",
    name: "Alex Chen Articles",
    description: "Boost articles from Alex Chen for users following this author",
    priority: 200,
    enabled: true,
    conditions: [
      { type: "author_follow", field: "followedAuthors", value: "Alex Chen" },
    ],
    actions: [{ type: "boost_articles", field: "author", value: "Alex Chen", weight: 2.5 }],
    metadata: { ab_test_group: "author_rules_v1", ctr_target: 0.40, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_author_james_wright",
    name: "James Wright Articles",
    description: "Boost articles from James Wright for users following this author",
    priority: 201,
    enabled: true,
    conditions: [
      { type: "author_follow", field: "followedAuthors", value: "James Wright" },
    ],
    actions: [{ type: "boost_articles", field: "author", value: "James Wright", weight: 2.5 }],
    metadata: { ab_test_group: "author_rules_v1", ctr_target: 0.40, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_author_generic",
    name: "Generic Author Follow",
    description: "Boost any articles from authors user is following",
    priority: 210,
    enabled: true,
    conditions: [
      { type: "bookmarked_author", field: "author", threshold: 1 },
    ],
    actions: [{ type: "boost_articles", field: "author", weight: 2.0 }],
    metadata: { ab_test_group: "author_rules_v1", ctr_target: 0.35, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_trending_recency_engagement",
    name: "Trending: Recency + Engagement Fusion",
    description: "Boost articles trending by engagement + recency signals",
    priority: 300,
    enabled: true,
    conditions: [
      { type: "trending_score" },
    ],
    actions: [{ type: "boost_articles", field: "trending", weight: 1.8 }],
    metadata: { ab_test_group: "trending_v1", ctr_target: 0.30, impressions: 0, clicks: 0, firing_count: 0 },
  },
  {
    id: "rule_default_chronological",
    name: "Default Chronological",
    priority: 999,
    enabled: true,
    conditions: [{ type: "always_match" }],
    actions: [{ type: "sort_articles", field: "date", order: "descending" }],
    metadata: { ab_test_group: "baseline", ctr_target: 0.15, impressions: 0, clicks: 0, firing_count: 0 },
  },
];

interface UseRecommendationsParams {
  articles: Article[];
  rules?: Rule[];
  count?: number;
  excludeArticleId?: number;
  enableLogging?: boolean;
}

interface UseRecommendationsReturn {
  recommendations: Article[];
  firedRules: string[];
  executionTime: number;
  isLoading: boolean;
  error: string | null;
  cacheHit: boolean;
}

/**
 * Hook to get personalized recommendations using IF/THEN rules engine
 * Integrates with EPIC-11 user preference/history data via hooks
 */
export function useRecommendations({
  articles,
  rules = DEFAULT_RULES,
  count = 5,
  excludeArticleId,
  enableLogging = false,
}: UseRecommendationsParams): UseRecommendationsReturn {
  const engineRef = useRef<RulesEngine | null>(null);
  const [recommendations, setRecommendations] = useState<Article[]>([]);
  const [firedRules, setFiredRules] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState(0);
  const [cacheHit, setCacheHit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { favoriteCategories } = useUserPreferences();
  const { history } = useReadingHistory();
  const { bookmarks } = useBookmarks();
  const { followedAuthors } = useAuthorFollow();
  const { trending } = useTrending({ count: 10 });
  const { topCategories, hasSignals } = useImplicitFeedback();

  // Enrich favorite categories with implicit preferences when explicit prefs are empty
  const enrichedCategories = useMemo(
    () =>
      favoriteCategories.length > 0
        ? favoriteCategories
        : hasSignals
          ? topCategories
          : [],
    [favoriteCategories, hasSignals, topCategories]
  );

  // Initialize rules engine
  useEffect(() => {
    try {
      if (!engineRef.current) {
        engineRef.current = new RulesEngine(rules, 300000, 5); // 5min cache, 5ms budget
      }
      engineRef.current.setArticles(
        articles.filter(a => a.id !== excludeArticleId)
      );
      Promise.resolve().then(() => setError(null));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize rules engine";
      Promise.resolve().then(() => setError(message));
      if (enableLogging) console.error("Rules engine init error:", message);
    }
  }, [articles, rules, excludeArticleId, enableLogging]);

  // Evaluate recommendations when context changes
  useEffect(() => {
    if (!engineRef.current) {
      Promise.resolve().then(() => {
        setError("Rules engine not initialized");
        setRecommendations([]);
        setIsLoading(false);
      });
      return;
    }

    try {
      // Build reading history Article-like objects from ReadingHistoryItem
      // Use real articles from data if available, otherwise create minimal objects
      const readingHistoryArticles: Article[] = history.map((item) => ({
        id: parseInt(item.articleId, 10),
        title: { en: item.title, pt: item.title },
        excerpt: { en: "", pt: "" },
        category: item.category as any,
        author: "",
        date: new Date(item.timestamp).toISOString(),
        readTime: "",
        views: "",
        image: "",
      }));

      const userContext: UserContext = {
        favoriteCategories: enrichedCategories,
        readingHistory: readingHistoryArticles,
        bookmarks: bookmarks.map((b) => b.articleId),
        followedAuthors,
        trendingArticleIds: trending.map((a) => String(a.id)),
      };

      const result = engineRef.current.evaluate(userContext);

      Promise.resolve().then(() => {
        setIsLoading(false);
        setRecommendations(result.articles.slice(0, count));
        setFiredRules(result.firedRules);
        setExecutionTime(result.executionTime);
        setCacheHit(result.cacheHit);
        setError(null);
      });

      if (enableLogging) {
        console.log("Recommendations evaluated:", {
          count: result.articles.length,
          firedRules: result.firedRules,
          executionTime: `${result.executionTime.toFixed(2)}ms`,
          cacheHit: result.cacheHit,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to evaluate recommendations";
      Promise.resolve().then(() => {
        setError(message);
        setRecommendations([]);
        setIsLoading(false);
      });
      if (enableLogging) console.error("Evaluation error:", message);
    }
  }, [enrichedCategories, history, bookmarks, followedAuthors, trending, count, enableLogging]);

  return {
    recommendations,
    firedRules,
    executionTime,
    isLoading,
    error,
    cacheHit,
  };
}
