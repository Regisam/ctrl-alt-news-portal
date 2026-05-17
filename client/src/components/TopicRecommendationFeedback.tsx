import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';

export interface TopicRecommendationFeedbackProps {
  userId: string;
  topicId: string;
  topicName: string;
  onFeedbackSubmit?: (feedback: FeedbackData) => void;
  onDismiss?: () => void;
  autoHide?: boolean; // auto-hide after submission
}

export interface FeedbackData {
  userId: string;
  topicId: string;
  topicName: string;
  helpful: boolean;
  timestamp: string;
}

export function TopicRecommendationFeedback({
  userId,
  topicId,
  topicName,
  onFeedbackSubmit,
  onDismiss,
  autoHide = true,
}: TopicRecommendationFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  const handleFeedback = (helpful: boolean) => {
    const feedbackData: FeedbackData = {
      userId,
      topicId,
      topicName,
      helpful,
      timestamp: new Date().toISOString(),
    };

    // Log feedback to analytics
    trackFeedback(feedbackData);

    // Call callback if provided
    onFeedbackSubmit?.(feedbackData);

    setSubmitted(true);

    // Auto-hide after submission
    if (autoHide) {
      setTimeout(() => {
        setIsVisible(false);
      }, 1500);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (submitted) {
    return (
      <div className="topic-recommendation-feedback bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-xs text-green-700 font-medium">Thanks for the feedback!</p>
      </div>
    );
  }

  return (
    <div className="topic-recommendation-feedback bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600 font-medium">Was this topic helpful?</p>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition"
          aria-label="Dismiss feedback"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => handleFeedback(true)}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium bg-white border border-green-200 text-green-600 hover:bg-green-50 transition"
          aria-label="Mark as helpful"
        >
          <ThumbsUp size={12} />
          <span>Yes</span>
        </button>

        <button
          onClick={() => handleFeedback(false)}
          className="flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50 transition"
          aria-label="Mark as not helpful"
        >
          <ThumbsDown size={12} />
          <span>No</span>
        </button>
      </div>
    </div>
  );
}

export interface RecommendationFeedbackStats {
  topicId: string;
  totalFeedback: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulPercentage: number;
}

/**
 * Compute feedback statistics for a topic
 * AC4.3: Update recommendation score based on feedback (future model input)
 */
export function computeFeedbackScore(stats: RecommendationFeedbackStats): number {
  if (stats.totalFeedback === 0) {
    return 0.5; // neutral default
  }

  // Feedback score: [0, 1] where 1 = all helpful
  return stats.helpfulCount / stats.totalFeedback;
}

/**
 * Track feedback to analytics
 * AC4.2: Capture feedback → log to database/analytics
 */
export function trackFeedback(feedback: FeedbackData): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'topic_recommendation_feedback', {
      user_id: feedback.userId,
      topic_id: feedback.topicId,
      topic_name: feedback.topicName,
      helpful: feedback.helpful,
      timestamp: feedback.timestamp,
    });
  }

  // Future: Log to database
  // await fetch('/api/feedback', { method: 'POST', body: JSON.stringify(feedback) });
}
