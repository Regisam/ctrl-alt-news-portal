import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  TopicRecommendationFeedback,
  computeFeedbackScore,
  trackFeedback,
  FeedbackData,
} from '@/components/TopicRecommendationFeedback';

describe('TopicRecommendationFeedback', () => {
  beforeEach(() => {
    // Mock gtag
    window.gtag = vi.fn();
  });

  describe('TopicRecommendationFeedback component', () => {
    // AC4.1: Create TopicRecommendationFeedback component (optional "helpful?" button)
    it('should render feedback widget with yes/no buttons', () => {
      render(
        <TopicRecommendationFeedback userId="user1" topicId="topic1" topicName="AI" />
      );

      expect(screen.getByText('Was this topic helpful?')).toBeInTheDocument();
      expect(screen.getByLabelText('Mark as helpful')).toBeInTheDocument();
      expect(screen.getByLabelText('Mark as not helpful')).toBeInTheDocument();
    });

    it('should display dismiss button', () => {
      render(
        <TopicRecommendationFeedback userId="user1" topicId="topic1" topicName="AI" />
      );

      expect(screen.getByLabelText('Dismiss feedback')).toBeInTheDocument();
    });

    it('should handle helpful feedback submission', () => {
      const onSubmit = vi.fn();
      render(
        <TopicRecommendationFeedback
          userId="user1"
          topicId="topic1"
          topicName="AI"
          onFeedbackSubmit={onSubmit}
        />
      );

      const helpfulButton = screen.getByLabelText('Mark as helpful');
      fireEvent.click(helpfulButton);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          topicId: 'topic1',
          topicName: 'AI',
          helpful: true,
        })
      );
    });

    it('should handle not helpful feedback submission', () => {
      const onSubmit = vi.fn();
      render(
        <TopicRecommendationFeedback
          userId="user1"
          topicId="topic1"
          topicName="AI"
          onFeedbackSubmit={onSubmit}
        />
      );

      const notHelpfulButton = screen.getByLabelText('Mark as not helpful');
      fireEvent.click(notHelpfulButton);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          topicId: 'topic1',
          topicName: 'AI',
          helpful: false,
        })
      );
    });

    it('should show success message after feedback', () => {
      render(
        <TopicRecommendationFeedback
          userId="user1"
          topicId="topic1"
          topicName="AI"
          autoHide={false}
        />
      );

      const helpfulButton = screen.getByLabelText('Mark as helpful');
      fireEvent.click(helpfulButton);

      expect(screen.getByText('Thanks for the feedback!')).toBeInTheDocument();
    });

    it('should handle dismiss action', () => {
      const onDismiss = vi.fn();
      render(
        <TopicRecommendationFeedback
          userId="user1"
          topicId="topic1"
          topicName="AI"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss feedback');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
    });

    it('should hide component when dismissed', () => {
      const { container } = render(
        <TopicRecommendationFeedback userId="user1" topicId="topic1" topicName="AI" />
      );

      const dismissButton = screen.getByLabelText('Dismiss feedback');
      fireEvent.click(dismissButton);

      expect(container.firstChild).toBeNull();
    });

    it('should auto-hide after feedback submission', async () => {
      const { container } = render(
        <TopicRecommendationFeedback
          userId="user1"
          topicId="topic1"
          topicName="AI"
          autoHide={true}
        />
      );

      const helpfulButton = screen.getByLabelText('Mark as helpful');
      fireEvent.click(helpfulButton);

      // Should show success message
      expect(screen.getByText('Thanks for the feedback!')).toBeInTheDocument();

      // Wait for auto-hide
      await new Promise((resolve) => setTimeout(resolve, 1600));

      // Container should be empty after auto-hide
      expect(container.firstChild).toBeNull();
    });

    // AC4.2: Capture feedback → log to database/analytics
    it('should include timestamp in feedback data', () => {
      const onSubmit = vi.fn();
      render(
        <TopicRecommendationFeedback
          userId="user1"
          topicId="topic1"
          topicName="AI"
          onFeedbackSubmit={onSubmit}
        />
      );

      const helpfulButton = screen.getByLabelText('Mark as helpful');
      fireEvent.click(helpfulButton);

      const callArgs = onSubmit.mock.calls[0][0];
      expect(callArgs.timestamp).toBeDefined();
      expect(new Date(callArgs.timestamp).getTime()).toBeGreaterThan(0);
    });
  });

  describe('computeFeedbackScore', () => {
    // AC4.3: Update recommendation score based on feedback (future model input)
    it('should compute feedback score as helpful ratio', () => {
      const stats = {
        topicId: 'topic1',
        totalFeedback: 10,
        helpfulCount: 8,
        notHelpfulCount: 2,
        helpfulPercentage: 80,
      };

      const score = computeFeedbackScore(stats);

      expect(score).toBeCloseTo(0.8, 2);
    });

    it('should return 1.0 when all feedback is helpful', () => {
      const stats = {
        topicId: 'topic1',
        totalFeedback: 5,
        helpfulCount: 5,
        notHelpfulCount: 0,
        helpfulPercentage: 100,
      };

      const score = computeFeedbackScore(stats);

      expect(score).toBe(1.0);
    });

    it('should return 0.0 when no feedback is helpful', () => {
      const stats = {
        topicId: 'topic1',
        totalFeedback: 5,
        helpfulCount: 0,
        notHelpfulCount: 5,
        helpfulPercentage: 0,
      };

      const score = computeFeedbackScore(stats);

      expect(score).toBe(0);
    });

    it('should return 0.5 when no feedback exists', () => {
      const stats = {
        topicId: 'topic1',
        totalFeedback: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        helpfulPercentage: 0,
      };

      const score = computeFeedbackScore(stats);

      expect(score).toBe(0.5);
    });
  });

  describe('trackFeedback', () => {
    it('should track feedback to analytics', () => {
      const feedback: FeedbackData = {
        userId: 'user1',
        topicId: 'topic1',
        topicName: 'AI',
        helpful: true,
        timestamp: new Date().toISOString(),
      };

      trackFeedback(feedback);

      expect(window.gtag).toHaveBeenCalledWith('event', 'topic_recommendation_feedback', {
        user_id: 'user1',
        topic_id: 'topic1',
        topic_name: 'AI',
        helpful: true,
        timestamp: feedback.timestamp,
      });
    });

    it('should handle gtag not available', () => {
      const originalGtag = window.gtag;
      window.gtag = undefined as unknown as typeof window.gtag;

      const feedback: FeedbackData = {
        userId: 'user1',
        topicId: 'topic1',
        topicName: 'AI',
        helpful: false,
        timestamp: new Date().toISOString(),
      };

      expect(() => trackFeedback(feedback)).not.toThrow();

      window.gtag = originalGtag;
    });
  });
});
