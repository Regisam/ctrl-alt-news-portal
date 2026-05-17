import React, { useState } from 'react';
import { RecommendedTopic } from '@shared/lib/topicRecommendations';
import { Users, TrendingUp, ArrowRight } from 'lucide-react';
import { TopicRecommendationFeedback } from './TopicRecommendationFeedback';

export interface TopicRecommendationsWidgetProps {
  userId: string;
  recommendations: RecommendedTopic[];
  onFollowTopic: (topicId: string) => void;
  onNavigateToTopic: (topicId: string) => void;
  loading?: boolean;
  maxTopics?: number;
}

export function TopicRecommendationsWidget({
  userId,
  recommendations,
  onFollowTopic,
  onNavigateToTopic,
  loading = false,
  maxTopics = 5,
}: TopicRecommendationsWidgetProps) {
  const [followedTopics, setFollowedTopics] = useState<Set<string>>(new Set());
  const [feedbackTopicId, setFeedbackTopicId] = useState<string | null>(null);

  const handleFollowTopic = (topicId: string) => {
    setFollowedTopics((prev) => new Set(prev).add(topicId));

    // Log event for analytics
    trackTopicAdoption(userId, topicId, 'topic-recommendations-widget');

    // Call the callback
    onFollowTopic(topicId);
  };

  const handleNavigateToTopic = (topicId: string) => {
    trackTopicNavigation(userId, topicId, 'topic-recommendations-widget');
    onNavigateToTopic(topicId);
  };

  const displayedTopics = recommendations.slice(0, maxTopics);

  if (loading) {
    return (
      <div className="topic-recommendations-widget bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Topics You Might Like</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (displayedTopics.length === 0) {
    return (
      <div className="topic-recommendations-widget bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Topics You Might Like</h3>
        <p className="text-gray-500 text-sm">No recommendations available yet.</p>
      </div>
    );
  }

  return (
    <div className="topic-recommendations-widget bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-1">Topics You Might Like</h3>
      <p className="text-gray-600 text-xs mb-4">Discover topics similar users are reading</p>

      <div className="space-y-3">
        {displayedTopics.map((topic) => (
          <div key={topic.topicId}>
            <TopicRecommendationCard
              topic={topic}
              isFollowed={followedTopics.has(topic.topicId)}
              onFollow={() => {
                handleFollowTopic(topic.topicId);
                setFeedbackTopicId(topic.topicId);
              }}
              onNavigate={() => {
                handleNavigateToTopic(topic.topicId);
                setFeedbackTopicId(topic.topicId);
              }}
            />
            {feedbackTopicId === topic.topicId && (
              <div className="mt-2">
                <TopicRecommendationFeedback
                  userId={userId}
                  topicId={topic.topicId}
                  topicName={topic.topicName}
                  onDismiss={() => setFeedbackTopicId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {recommendations.length > maxTopics && (
        <p className="text-gray-500 text-xs mt-4 text-center">
          Showing {maxTopics} of {recommendations.length} recommendations
        </p>
      )}
    </div>
  );
}

interface TopicRecommendationCardProps {
  topic: RecommendedTopic;
  isFollowed: boolean;
  onFollow: () => void;
  onNavigate: () => void;
}

function TopicRecommendationCard({
  topic,
  isFollowed,
  onFollow,
  onNavigate,
}: TopicRecommendationCardProps) {
  const adoptionPercentage = Math.round(topic.adoptionProbability * 100);
  const similarUserPercentage = Math.round((topic.similarityScore * 100) / 2); // scale to 50%

  return (
    <div className="topic-card border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <button
            onClick={onNavigate}
            className="text-sm font-medium text-gray-900 hover:text-blue-600 text-left transition"
            aria-label={`View ${topic.topicName} topic`}
          >
            {topic.topicName}
          </button>
          <p className="text-xs text-gray-500 mt-0.5">{topic.reason}</p>
        </div>
        <div className="ml-2 text-right">
          <div className="text-xs font-semibold text-green-600 mb-1">{adoptionPercentage}% match</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Users size={14} className="text-gray-400" />
          <span>{topic.similarUserCount} users follow</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp size={14} className="text-gray-400" />
          <span>{similarUserPercentage}% relevant</span>
        </div>
      </div>

      <button
        onClick={onFollow}
        disabled={isFollowed}
        className={`w-full py-1.5 px-2 rounded text-sm font-medium transition ${
          isFollowed
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200'
        }`}
        aria-label={isFollowed ? `Already following ${topic.topicName}` : `Follow ${topic.topicName}`}
      >
        {isFollowed ? '✓ Followed' : 'Follow Topic'}
        {!isFollowed && <ArrowRight size={12} className="inline ml-1" />}
      </button>
    </div>
  );
}

// Analytics tracking functions
export function trackTopicAdoption(
  userId: string,
  topicId: string,
  source: string
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'topic_followed', {
      user_id: userId,
      topic_id: topicId,
      source,
      timestamp: new Date().toISOString(),
    });
  }
}

export function trackTopicNavigation(
  userId: string,
  topicId: string,
  source: string
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'topic_navigation', {
      user_id: userId,
      topic_id: topicId,
      source,
      timestamp: new Date().toISOString(),
    });
  }
}

export function trackTopicImpression(
  userId: string,
  topicIds: string[],
  source: string
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'topic_recommendation_impression', {
      user_id: userId,
      topic_count: topicIds.length,
      topic_ids: topicIds.join(','),
      source,
      timestamp: new Date().toISOString(),
    });
  }
}
