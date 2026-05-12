/**
 * useSmartDigest — Smart digest hook (Story 12.7)
 *
 * Retrieves user's digest config, fetches recommendations, ranks by relevance,
 * and generates digest payload with one-time tokens.
 *
 * AC1: Digest generation per user interests
 * AC4: Relevance ranking by topic preferences
 * AC9: useSmartDigest hook implementation
 */

import { useEffect, useState } from 'react';
import type {
  SmartDigestConfig,
  DigestArticle,
  SmartDigestPayload,
  SmartDigestState,
} from '@/lib/smart-digest.types';
import type { Article } from '@shared/types';

/**
 * Subtask 1.1.2: Get digest config from localStorage
 * Returns stored SmartDigestConfig or null if not configured
 */
function getDigestConfig(): SmartDigestConfig | null {
  try {
    const stored = localStorage.getItem('smartDigest:config');
    if (!stored) return null;

    const parsed = JSON.parse(stored) as SmartDigestConfig;
    return parsed;
  } catch (error) {
    console.error('Failed to parse digest config from localStorage:', error);
    return null;
  }
}

/**
 * Subtask 1.1.3: Get rule-based recommendations from EPIC-12
 * MVP: Returns mock articles; Phase 2+ will integrate real rules engine
 *
 * @param userTopics - User's topic preferences (AI, Science, Robotics, Gadgets, etc.)
 * @returns Array of candidate articles for digest
 */
function getRuleBasedRecommendations(userTopics: string[]): Article[] {
  // MVP mock data — 10-15 articles across user's topics
  const mockArticles: Article[] = [
    {
      id: '1',
      title: 'GPT-5 Breakthrough: Multimodal Learning Reaches New Heights',
      category: 'AI',
      url: 'https://example.com/gpt5-breakthrough',
      author: 'Dr. Sarah Chen',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'A deep dive into the latest GPT-5 capabilities...',
      imageUrl: 'https://example.com/images/gpt5.jpg',
    },
    {
      id: '2',
      title: 'Quantum Computing: Solving Real-World Problems Today',
      category: 'Science',
      url: 'https://example.com/quantum-computing',
      author: 'Prof. Michael Zhang',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Recent advances in quantum error correction...',
      imageUrl: 'https://example.com/images/quantum.jpg',
    },
    {
      id: '3',
      title: 'Humanoid Robots Transform Manufacturing',
      category: 'Robotics',
      url: 'https://example.com/humanoid-robots',
      author: 'Emma Rodriguez',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Boston Dynamics and Tesla lead the charge...',
      imageUrl: 'https://example.com/images/robots.jpg',
    },
    {
      id: '4',
      title: 'Samsung Galaxy AI Features Explained',
      category: 'Gadgets',
      url: 'https://example.com/samsung-galaxy-ai',
      author: 'James Park',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Hands-on review of Galaxy S24 Ultra...',
      imageUrl: 'https://example.com/images/galaxy.jpg',
    },
    {
      id: '5',
      title: 'Deep Learning Interpretability: Understanding Black Boxes',
      category: 'AI',
      url: 'https://example.com/interpretability',
      author: 'Dr. Lisa Kim',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Explainable AI techniques demystified...',
      imageUrl: 'https://example.com/images/interpretability.jpg',
    },
    {
      id: '6',
      title: 'CRISPR Gene Therapy: Success in Clinical Trials',
      category: 'Science',
      url: 'https://example.com/crispr-gene-therapy',
      author: 'Dr. James Peterson',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'First FDA approvals for CRISPR-based treatments...',
      imageUrl: 'https://example.com/images/crispr.jpg',
    },
    {
      id: '7',
      title: 'Robotic Surgery: Precision Beyond Human Limits',
      category: 'Robotics',
      url: 'https://example.com/robotic-surgery',
      author: 'Dr. David Wong',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Da Vinci and emerging surgical robots...',
      imageUrl: 'https://example.com/images/surgery.jpg',
    },
    {
      id: '8',
      title: 'iPhone 16: Camera and Performance Deep Dive',
      category: 'Gadgets',
      url: 'https://example.com/iphone-16-review',
      author: 'Lisa Thompson',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Complete review and comparison...',
      imageUrl: 'https://example.com/images/iphone16.jpg',
    },
    {
      id: '9',
      title: 'Generative AI in Healthcare: Real-World Applications',
      category: 'AI',
      url: 'https://example.com/genai-healthcare',
      author: 'Dr. Nina Patel',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'How hospitals use AI for diagnosis...',
      imageUrl: 'https://example.com/images/ai-health.jpg',
    },
    {
      id: '10',
      title: 'Mars Rover Discovery: Evidence of Ancient Microbial Life',
      category: 'Science',
      url: 'https://example.com/mars-discovery',
      author: 'Dr. Robert Anderson',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Perseverance rover finds compelling evidence...',
      imageUrl: 'https://example.com/images/mars.jpg',
    },
    {
      id: '11',
      title: 'Drone Delivery Services Expand in 2026',
      category: 'Gadgets',
      url: 'https://example.com/drone-delivery',
      author: 'Carlos Mendez',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Amazon, Google, and startups racing forward...',
      imageUrl: 'https://example.com/images/drones.jpg',
    },
    {
      id: '12',
      title: 'Self-Driving Trucks: The Future of Logistics',
      category: 'Robotics',
      url: 'https://example.com/autonomous-trucks',
      author: 'Michael Gray',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      content: 'Waymo, Tesla, and legacy OEMs...',
      imageUrl: 'https://example.com/images/trucks.jpg',
    },
  ];

  // Filter by user topics if provided, otherwise return all
  if (userTopics && userTopics.length > 0) {
    return mockArticles.filter((article) =>
      article.category ? userTopics.includes(article.category) : false
    );
  }

  return mockArticles;
}

/**
 * Subtask 1.1.4: Rank articles by relevance to user's topic preferences
 * Scoring: 10 points per topic match, sorted descending
 *
 * @param candidates - Articles to rank
 * @param userTopics - User's topic preferences
 * @returns Ranked DigestArticle[] with relevance scores
 */
function rankByRelevance(candidates: Article[], userTopics: string[]): DigestArticle[] {
  return (
    candidates
      .map((article) => {
        // Calculate relevance score (0-100)
        // Base: category match = 10 points per matched topic
        let score = 0;

        if (article.category && userTopics.includes(article.category)) {
          score += 50; // Strong match: 50 points for category match
        }

        // Bonus for recency (older articles get lower score)
        const articleDate = new Date(article.date).getTime();
        const now = Date.now();
        const ageInDays = (now - articleDate) / (1000 * 60 * 60 * 24);

        if (ageInDays <= 1) {
          score += 30; // Very recent: +30
        } else if (ageInDays <= 3) {
          score += 15; // Recent: +15
        } else if (ageInDays <= 7) {
          score += 5; // Somewhat recent: +5
        }
        // Older articles get no bonus

        return {
          id: article.id,
          title: article.title,
          summary: article.content
            ? article.content.substring(0, 100)
            : article.title.substring(0, 100),
          link: article.url,
          category: article.category || 'General',
          relevanceScore: Math.min(100, score), // Cap at 100
          reason: article.category
            ? `Matches your interest in ${article.category}`
            : 'Recommended for you',
        };
      })
      // Sort by relevance score (descending)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
  );
}

/**
 * Subtask 1.1.2: Get user's topic interests
 * MVP: Returns default topics; Phase 2+ will integrate with EPIC-11 behavioral data
 *
 * @returns User's topic preferences
 */
function getTopicInterests(): string[] {
  try {
    const stored = localStorage.getItem('userInterests');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to parse user interests:', error);
  }

  // Default topics if not configured
  return ['AI', 'Science', 'Robotics', 'Gadgets'];
}

/**
 * Subtask 1.1.5: Generate a one-time token (32-char random string)
 * For unsubscribe and preferences links (AC12: security)
 *
 * @param _purpose - 'unsubscribe' | 'preferences' | other (reserved for logging/tracking in future)
 * @returns 32-character random token
 */
function generateOneTimeToken(_purpose: 'unsubscribe' | 'preferences'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * useSmartDigest hook — Main API (AC9)
 *
 * Usage:
 *   const { digest, isLoading, error } = useSmartDigest();
 *   if (digest) { // send email with digest.articles }
 *
 * @returns SmartDigestState { digest, isLoading, error }
 */
export function useSmartDigest(): SmartDigestState {
  const [state, setState] = useState<SmartDigestState>({
    digest: null,
    isLoading: false,
    error: null,
  });

  // Initialize digest on mount by directly implementing the logic
  useEffect(() => {
    const initializeDigest = async (): Promise<void> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Step 1: Get digest config from localStorage
        const config = getDigestConfig();
        if (!config || !config.enabled) {
          setState((prev) => ({ ...prev, digest: null, isLoading: false }));
          return;
        }

        // Step 2: Get user's topic interests
        const userInterests = getTopicInterests();

        // Step 3: Fetch recommendations from EPIC-12 rules engine
        const candidates = getRuleBasedRecommendations(userInterests);
        if (candidates.length === 0) {
          setState((prev) => ({ ...prev, digest: null, isLoading: false }));
          return;
        }

        // Step 4: Score and rank by relevance
        const ranked = rankByRelevance(candidates, userInterests);

        // Step 5: Select top 3-5 articles
        const topArticles = ranked.slice(0, 5);

        // Step 6: Generate one-time tokens
        const unsubscribeToken = generateOneTimeToken('unsubscribe');
        const preferencesToken = generateOneTimeToken('preferences');

        // Step 7: Assemble payload
        const payload: SmartDigestPayload = {
          userId: 'current-user-id', // TODO: integrate with auth context
          digestDate: new Date(),
          articles: topArticles,
          config,
          unsubscribeToken,
          preferencesToken,
        };

        setState((prev) => ({ ...prev, digest: payload, isLoading: false }));
      } catch (err) {
        const digestError = err instanceof Error ? err : new Error(String(err));
        setState((prev) => ({ ...prev, error: digestError, isLoading: false }));
        console.error('Error generating digest:', digestError);
      }
    };

    void initializeDigest();
  }, []);

  return state;
}

// Export helper functions for testing
export { getDigestConfig, getRuleBasedRecommendations, rankByRelevance, getTopicInterests };
