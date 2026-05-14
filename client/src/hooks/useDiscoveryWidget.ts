import { useCallback, useEffect, useState } from 'react';
import type { Article } from '../components/DiscoveryWidgetItem';

interface CacheEntry {
  articles: Article[];
  timestamp: number;
}

/**
 * useDiscoveryWidget - Fetches and caches trending articles for discovery widget
 * AC2: Returns 3-5 trending articles
 * AC5: Implements 1h cache (configurable)
 * AC11: Performance <500ms with caching
 */
export function useDiscoveryWidget(
  userId: string,
  maxItems: number = 5,
  cacheMinutes: number = 60
) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `discovery-widget-${userId}`;
  const cacheTTL = cacheMinutes * 60 * 1000;

  // Get cached articles if fresh
  const getCachedArticles = useCallback((): Article[] | null => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (!cached) return null;

      const entry: CacheEntry = JSON.parse(cached);
      const isExpired = Date.now() - entry.timestamp > cacheTTL;

      if (isExpired) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      return entry.articles;
    } catch {
      console.error('[useDiscoveryWidget] Failed to parse cache');
      return null;
    }
  }, [cacheKey, cacheTTL]);

  // Mock trending articles (would call API in production)
  const fetchTrendingArticles = useCallback((): Article[] => {
    const mockArticles: Article[] = [
      {
        id: 'trending-1',
        title: 'GPT-5 Breaks Every Benchmark: The New Era of AI',
        category: 'AI',
        relevanceScore: 95,
        reason: 'Trending in AI',
        link: '/article/gpt-5-breaks-benchmarks',
      },
      {
        id: 'trending-2',
        title: 'Quantum Computing: Practical Applications in 2026',
        category: 'Science',
        relevanceScore: 88,
        reason: 'Popular in your interests',
        link: '/article/quantum-practical-apps',
      },
      {
        id: 'trending-3',
        title: 'Boston Dynamics Atlas 3.0: The Robot That Learned to Dance',
        category: 'Robotics',
        relevanceScore: 82,
        reason: 'Trending in Robotics',
        link: '/article/atlas-3-dance',
      },
      {
        id: 'trending-4',
        title: 'The Latest AI Security Vulnerabilities Explained',
        category: 'Security',
        relevanceScore: 78,
        reason: 'Trending in Security',
        link: '/article/ai-security-vulns',
      },
      {
        id: 'trending-5',
        title: 'New Gadgets Revolutionizing Mobile Computing',
        category: 'Gadgets',
        relevanceScore: 72,
        reason: 'Tech enthusiasts reading this',
        link: '/article/new-gadgets-mobile',
      },
    ];

    return mockArticles.slice(0, Math.min(maxItems, 5));
  }, [maxItems]);

  // Load articles (from cache or API)
  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try cache first
      const cached = getCachedArticles();
      if (cached) {
        setArticles(cached);
        setIsLoading(false);
        return;
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Fetch trending articles
      const fetched = fetchTrendingArticles();

      // Cache result
      const cacheEntry: CacheEntry = {
        articles: fetched,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));

      setArticles(fetched);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load articles';
      setError(message);
      console.error('[useDiscoveryWidget] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getCachedArticles, fetchTrendingArticles, cacheKey]);

  // Manual refresh (invalidates cache)
  const refresh = useCallback(() => {
    sessionStorage.removeItem(cacheKey);
    loadArticles();
  }, [cacheKey, loadArticles]);

  // Load on mount
  useEffect(() => {
    loadArticles();
  }, [loadArticles, userId]);

  return {
    articles,
    isLoading,
    error,
    refresh,
  };
}
