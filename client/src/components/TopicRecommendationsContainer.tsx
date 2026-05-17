/**
 * TopicRecommendationsContainer
 * Wrapper for TopicRecommendationsWidget with data fetching
 * Integrates topic recommendations into the sidebar
 */

import { useState, useEffect } from 'react';
import { TopicRecommendationsWidget } from '@/components/TopicRecommendationsWidget';
import type { RecommendedTopic } from '@shared/lib/topicRecommendations';
import { toast } from 'sonner';

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
  const [followedTopics, setFollowedTopics] = useState<Set<string>>(new Set());

  // Fetch topic recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace with actual API call to getTopicRecommendations
        // For now, using placeholder data demonstrating the widget integration
        const mockRecommendations: RecommendedTopic[] = [
          {
            topicId: 'quantum-computing',
            topicName: 'Quantum Computing',
            adoptionProbability: 0.82,
            reason: 'Popular among AI readers',
            similarityScore: 0.75,
            similarUserCount: 234,
          },
          {
            topicId: 'neural-networks',
            topicName: 'Neural Networks',
            adoptionProbability: 0.78,
            reason: 'Users like you follow this',
            similarityScore: 0.72,
            similarUserCount: 189,
          },
          {
            topicId: 'space-exploration',
            topicName: 'Space Exploration',
            adoptionProbability: 0.65,
            reason: 'Trending among similar users',
            similarityScore: 0.68,
            similarUserCount: 156,
          },
          {
            topicId: 'biotech',
            topicName: 'Biotechnology',
            adoptionProbability: 0.62,
            reason: 'Complement to your interests',
            similarityScore: 0.65,
            similarUserCount: 142,
          },
          {
            topicId: 'green-energy',
            topicName: 'Green Energy',
            adoptionProbability: 0.58,
            reason: 'Rising interest in your network',
            similarityScore: 0.62,
            similarUserCount: 128,
          },
        ];

        setRecommendations(mockRecommendations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  const handleFollowTopic = (topicId: string) => {
    setFollowedTopics((prev) => new Set(prev).add(topicId));
    toast.success(
      lang === 'en'
        ? `Following topic: ${topicId}`
        : `Seguindo tópico: ${topicId}`
    );
  };

  const handleNavigateToTopic = (topicId: string) => {
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
