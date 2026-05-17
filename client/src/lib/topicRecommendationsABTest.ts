/**
 * Topic Recommendations A/B Testing Configuration
 * Manages variant assignment and analytics tracking for Story 13.7
 */

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, config?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}

export type TopicRecommendationVariant = 'control' | 'treatment_v1' | 'treatment_v2';

export interface TopicRecommendationABTest {
  enabled: boolean;
  rolloutPercentage: number; // [0-100]
  variants: {
    control: { weight: number; description: string };
    treatment_v1: { weight: number; description: string };
    treatment_v2: { weight: number; description: string };
  };
}

/**
 * Default A/B test configuration for topic recommendations
 *
 * **Control:** Standard mock data (5 topics, simple ranking)
 * **Treatment V1:** API-driven recommendations with adoption probability
 * **Treatment V2:** ML-enhanced rankings with diversity constraints
 */
export const DEFAULT_TOPIC_RECOMMENDATIONS_AB_TEST: TopicRecommendationABTest = {
  enabled: true,
  rolloutPercentage: 100, // All users participate
  variants: {
    control: {
      weight: 0.33, // 33% of users get control
      description: 'Mock data: Static 5 topics without ML ranking',
    },
    treatment_v1: {
      weight: 0.33, // 33% get Treatment V1
      description: 'API-driven: Real recommendations with adoption probability',
    },
    treatment_v2: {
      weight: 0.34, // 34% get Treatment V2
      description: 'ML-enhanced: Serendipity scoring + diversity constraints',
    },
  },
};

/**
 * Assign user to variant using deterministic bucketing
 * @param userId - User ID (creates consistent bucket across sessions)
 * @param testConfig - A/B test configuration
 * @returns Assigned variant for this user
 *
 * @example
 * const variant = assignUserToVariant('user-123', DEFAULT_TOPIC_RECOMMENDATIONS_AB_TEST);
 * // Returns 'control' or 'treatment_v1' or 'treatment_v2'
 */
export function assignUserToVariant(
  userId: string,
  testConfig: TopicRecommendationABTest
): TopicRecommendationVariant {
  if (!testConfig.enabled) {
    return 'control';
  }

  // Deterministic bucketing using hash of userId
  const hash = Array.from(userId).reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  const bucket = Math.abs(hash) % 100;

  // Check if user is in rollout
  if (bucket >= testConfig.rolloutPercentage) {
    return 'control';
  }

  // Assign to variant based on weights
  const controlEnd = testConfig.variants.control.weight * 100;
  const treatment1End = controlEnd + testConfig.variants.treatment_v1.weight * 100;

  const bucketPercent = bucket % 100;

  if (bucketPercent < controlEnd) {
    return 'control';
  } else if (bucketPercent < treatment1End) {
    return 'treatment_v1';
  } else {
    return 'treatment_v2';
  }
}

/**
 * Analytics event for tracking topic recommendation interactions
 */
export interface TopicRecommendationAnalyticsEvent {
  eventName: string;
  userId: string;
  variant: TopicRecommendationVariant;
  topicId?: string;
  timestamp: number;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Topic Recommendations Analytics Tracker
 * Integrates with Google Analytics to monitor A/B test performance
 */
export class TopicRecommendationAnalytics {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    const stored = localStorage.getItem('topic_rec_session_id');
    if (stored) {
      return stored;
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('topic_rec_session_id', sessionId);
    return sessionId;
  }

  /**
   * Track topic recommendation impressions
   * Called when widget renders with recommendations
   */
  trackRecommendationImpression(
    userId: string,
    variant: TopicRecommendationVariant,
    topicCount: number
  ): void {
    this.trackEvent({
      eventName: 'topic_recommendation_impression',
      userId,
      variant,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: {
        topicCount,
      },
    });
  }

  /**
   * Track topic follow action
   * Called when user clicks "Follow Topic"
   */
  trackTopicFollowed(
    userId: string,
    variant: TopicRecommendationVariant,
    topicId: string,
    adoptionProbability: number
  ): void {
    this.trackEvent({
      eventName: 'topic_followed',
      userId,
      variant,
      topicId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: {
        adoptionProbability,
      },
    });
  }

  /**
   * Track topic navigation
   * Called when user clicks "View Topic"
   */
  trackTopicNavigation(
    userId: string,
    variant: TopicRecommendationVariant,
    topicId: string
  ): void {
    this.trackEvent({
      eventName: 'topic_navigation',
      userId,
      variant,
      topicId,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    });
  }

  /**
   * Send event to Google Analytics
   * Integrates with gtag for production analytics
   */
  private trackEvent(event: TopicRecommendationAnalyticsEvent): void {
    try {
      // Send to Google Analytics if available
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', event.eventName, {
          user_id: event.userId,
          variant: event.variant,
          topic_id: event.topicId,
          session_id: event.sessionId,
          timestamp: event.timestamp,
          ...event.metadata,
        });
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('[TopicRecABTest]', event.eventName, {
          userId: event.userId,
          variant: event.variant,
          ...event.metadata,
        });
      }
    } catch (error) {
      // Error logging is intentional for debugging
      console.error('Failed to track topic recommendation event:', error);
    }
  }
}

/**
 * Singleton instance for analytics
 */
export const topicRecommendationAnalytics = new TopicRecommendationAnalytics();
