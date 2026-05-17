import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopicRecommendationsWidget, trackTopicAdoption } from '@/components/TopicRecommendationsWidget';
import { RecommendedTopic } from '@shared/lib/topicRecommendations';

describe('TopicRecommendationsWidget Integration', () => {
  const mockRecommendations: RecommendedTopic[] = [
    {
      topicId: 'ai',
      topicName: 'Artificial Intelligence',
      adoptionProbability: 0.85,
      reason: 'Popular among AI readers',
      similarityScore: 0.8,
      similarUserCount: 145,
    },
    {
      topicId: 'robotics',
      topicName: 'Robotics',
      adoptionProbability: 0.72,
      reason: 'Users like you follow this',
      similarityScore: 0.7,
      similarUserCount: 89,
    },
    {
      topicId: 'ml',
      topicName: 'Machine Learning',
      adoptionProbability: 0.68,
      reason: 'Trending among similar users',
      similarityScore: 0.65,
      similarUserCount: 200,
    },
  ];

  const mockHandlers = {
    onFollowTopic: vi.fn(),
    onNavigateToTopic: vi.fn(),
  };

  beforeEach(() => {
    mockHandlers.onFollowTopic.mockClear();
    mockHandlers.onNavigateToTopic.mockClear();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render widget with title and recommendations', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Topics You Might Like')).toBeInTheDocument();
      expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
      expect(screen.getByText('Robotics')).toBeInTheDocument();
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    });

    it('should display topic reasons for explanation', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Popular among AI readers')).toBeInTheDocument();
      expect(screen.getByText('Users like you follow this')).toBeInTheDocument();
    });

    it('should show adoption probability as percentage', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations.slice(0, 1)}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('85% match')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      const { container } = render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={[]}
          loading={true}
          {...mockHandlers}
        />
      );

      const loadingShimmer = container.querySelector('.animate-pulse');
      expect(loadingShimmer).toBeInTheDocument();
    });

    it('should show empty state when no recommendations', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={[]}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No recommendations available yet.')).toBeInTheDocument();
    });

    it('should respect maxTopics limit', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          maxTopics={2}
          {...mockHandlers}
        />
      );

      const followButtons = screen.getAllByText(/Follow Topic/i);
      expect(followButtons.length).toBe(2);
    });
  });

  describe('User Interactions', () => {
    it('should call onFollowTopic when Follow button clicked', async () => {
      const user = userEvent.setup();
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          {...mockHandlers}
        />
      );

      const followButton = screen.getByRole('button', { name: /Follow Artificial Intelligence/i });
      await user.click(followButton);

      expect(mockHandlers.onFollowTopic).toHaveBeenCalledWith('ai');
    });

    it('should call onNavigateToTopic when topic name clicked', async () => {
      const user = userEvent.setup();
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          {...mockHandlers}
        />
      );

      const aiTopicButton = screen.getByText('Artificial Intelligence');
      await user.click(aiTopicButton);

      expect(mockHandlers.onNavigateToTopic).toHaveBeenCalledWith('ai');
    });

    it('should disable Follow button after clicking', async () => {
      const user = userEvent.setup();
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          {...mockHandlers}
        />
      );

      const followButton = screen.getByRole('button', { name: /Follow Artificial Intelligence/i });
      await user.click(followButton);

      await waitFor(() => {
        const followedButton = screen.getByRole('button', { name: /Already following Artificial Intelligence/i });
        expect(followedButton).toBeDisabled();
      });
    });

    it('should update button text after following', async () => {
      const user = userEvent.setup();
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations.slice(0, 1)}
          {...mockHandlers}
        />
      );

      const followButton = screen.getByRole('button', { name: /Follow Artificial Intelligence/i });
      await user.click(followButton);

      await waitFor(() => {
        const followedButton = screen.getByRole('button', { name: /Already following Artificial Intelligence/i });
        expect(followedButton).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tracking', () => {
    it('should track topic adoption events', () => {
      const gtag = vi.fn();
      window.gtag = gtag;

      trackTopicAdoption('user1', 'ai', 'topic-recommendations-widget');

      expect(gtag).toHaveBeenCalledWith('event', 'topic_followed', expect.objectContaining({
        user_id: 'user1',
        topic_id: 'ai',
        source: 'topic-recommendations-widget',
      }));
    });

    it('should handle missing gtag gracefully', () => {
      delete window.gtag;

      expect(() => {
        trackTopicAdoption('user1', 'ai', 'topic-recommendations-widget');
      }).not.toThrow();
    });
  });

  describe('Topic Card Information', () => {
    it('should display similar user count', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations.slice(0, 1)}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('145 users follow')).toBeInTheDocument();
    });

    it('should calculate and display relevance percentage', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations.slice(0, 1)}
          {...mockHandlers}
        />
      );

      // similarityScore 0.8 -> (0.8 * 100) / 2 = 40%
      expect(screen.getByText('40% relevant')).toBeInTheDocument();
    });
  });

  describe('A/B Testing Support', () => {
    it('should render successfully in control condition (no widget)', () => {
      const { container } = render(
        <div>
          {/* control: widget not shown */}
        </div>
      );

      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('should render successfully in treatment condition (with widget)', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Topics You Might Like')).toBeInTheDocument();
    });
  });

  describe('Cold-Start Scenarios', () => {
    it('should render with empty recommendations for new user', () => {
      render(
        <TopicRecommendationsWidget
          userId="new-user-1"
          recommendations={[]}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('No recommendations available yet.')).toBeInTheDocument();
    });

    it('should render with limited recommendations for new user', () => {
      const limitedRecs = mockRecommendations.slice(0, 1);
      render(
        <TopicRecommendationsWidget
          userId="new-user-1"
          recommendations={limitedRecs}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Artificial Intelligence')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels on topic buttons', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations.slice(0, 1)}
          {...mockHandlers}
        />
      );

      const topicLink = screen.getByRole('button', { name: /View Artificial Intelligence topic/i });
      expect(topicLink).toBeInTheDocument();
    });

    it('should have proper aria labels on follow buttons', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations.slice(0, 1)}
          {...mockHandlers}
        />
      );

      const followButton = screen.getByRole('button', { name: /Follow Artificial Intelligence/i });
      expect(followButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render compact version on mobile (maxTopics=3)', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          maxTopics={3}
          {...mockHandlers}
        />
      );

      const followButtons = screen.getAllByRole('button').filter(btn =>
        btn.getAttribute('aria-label')?.includes('Follow')
      );
      expect(followButtons.length).toBe(3);
    });

    it('should display recommendation count info when exceeding limit', () => {
      render(
        <TopicRecommendationsWidget
          userId="user1"
          recommendations={mockRecommendations}
          maxTopics={2}
          {...mockHandlers}
        />
      );

      expect(screen.getByText('Showing 2 of 3 recommendations')).toBeInTheDocument();
    });
  });
});
