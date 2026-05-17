/**
 * TopicRecommendationsContainer
 * Wrapper for TopicRecommendationsWidget with data fetching
 * Integrates topic recommendations into the sidebar
 */

import { useState, useEffect, useMemo } from 'react';
import { TopicRecommendationsWidget } from '@/components/TopicRecommendationsWidget';
import type { RecommendedTopic } from '@shared/lib/topicRecommendations';
import { toast } from 'sonner';
import {
  assignUserToVariant,
  DEFAULT_TOPIC_RECOMMENDATIONS_AB_TEST,
  topicRecommendationAnalytics,
} from '@/lib/topicRecommendationsABTest';

interface TopicRecommendationsContainerProps {
  userId?: string;
  maxTopics?: number;
  lang?: 'en' | 'pt';
}

export function TopicRecommendationsContainer({
  userId = 'current-user',
  maxTopics = 5,
  lang = 'en',
}: TopicRecommendationsContainerProps) {
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A/B test variant assignment (deterministic per user)
  const variant = useMemo(
    () => assignUserToVariant(userId, DEFAULT_TOPIC_RECOMMENDATIONS_AB_TEST),
    [userId]
  );

  // Fetch topic recommendations from API
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/topic-recommendations/${userId}?maxTopics=${maxTopics}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch topic recommendations`);
        }

        const data = await response.json();
        setRecommendations(data.recommendations || []);

        // Track impression in A/B test
        topicRecommendationAnalytics.trackRecommendationImpression(
          userId,
          variant,
          data.recommendations?.length || 0
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
        // Silently fail - don't break the sidebar
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, maxTopics, variant]);

  const handleFollowTopic = (topicId: string) => {
    // Find adoption probability for analytics
    const topic = recommendations.find((t) => t.topicId === topicId);
    const adoptionProbability = topic?.adoptionProbability ?? 0;

    toast.success(
      lang === 'en'
        ? `Following topic: ${topicId}`
        : `Seguindo tópico: ${topicId}`
    );

    // Track interaction in A/B test
    topicRecommendationAnalytics.trackTopicFollowed(userId, variant, topicId, adoptionProbability);
  };

  const handleNavigateToTopic = (topicId: string) => {
    // Track interaction in A/B test
    topicRecommendationAnalytics.trackTopicNavigation(userId, variant, topicId);

    // Navigate to topic page (e.g., /topic/quantum-computing)
    window.location.href = `/topic/${topicId}`;
  };

  if (error) {
    return null; // Silently fail - don't break the sidebar
  }

  return (
    <TopicRecommendationsWidget
      userId={userId}
      recommendations={recommendations}
      onFollowTopic={handleFollowTopic}
      onNavigateToTopic={handleNavigateToTopic}
      loading={loading}
      maxTopics={maxTopics}
    />
  );
}
