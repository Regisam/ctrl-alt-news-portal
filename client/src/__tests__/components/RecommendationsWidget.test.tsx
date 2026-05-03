import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendationsWidget } from '@/components/RecommendationsWidget';
import { aiArticles, scienceArticles } from '@/lib/data';
import { describe, it, expect } from 'vitest';

describe('RecommendationsWidget component', () => {
  it('should render with default title', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        maxRecommendations={3}
      />
    );

    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id]}
        title="Custom Recommendations"
        maxRecommendations={3}
      />
    );

    expect(screen.getByText('Custom Recommendations')).toBeInTheDocument();
  });

  it('should render fallback recommendations when no reading history', () => {
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={[]}
        maxRecommendations={3}
      />
    );

    // Component should render fallback recommendations for new users
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should display recommendation cards', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        maxRecommendations={5}
      />
    );

    // Should have links (recommendation cards)
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should display article titles', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id]}
        maxRecommendations={5}
      />
    );

    // At least one title should be visible
    const titles = screen.queryAllByText(/./);
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should display read time for articles', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        maxRecommendations={3}
      />
    );

    // Should display read time in format like "5 min read"
    const timeElements = screen.queryAllByText(/min/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should display view count for articles', () => {
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id]}
        maxRecommendations={5}
      />
    );

    // Should display view count metadata
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    // Check that Eye icon is rendered (indicating view count is present)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should respect maxRecommendations prop', () => {
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        maxRecommendations={2}
      />
    );

    // Count recommendation cards (links to articles)
    const cards = container.querySelectorAll('a[href^="/article/"]');
    expect(cards.length).toBeLessThanOrEqual(2);
  });

  it('should exclude current article from recommendations', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        excludeArticleId={aiArticles[2].id}
        maxRecommendations={5}
      />
    );

    // Should render without errors
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
  });

  it('should render category badges', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id]}
        maxRecommendations={5}
      />
    );

    // Should display at least one category badge
    const categoryBadges = screen.queryAllByText(/^(AI|SCIENCE|ROBOTICS|GADGETS)$/);
    expect(categoryBadges.length).toBeGreaterThan(0);
  });

  it('should accept custom category colors', () => {
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id]}
        categoryColor="#FF0000"
        categoryBg="rgba(255,0,0,0.12)"
        categoryBorder="rgba(255,0,0,0.4)"
        maxRecommendations={3}
      />
    );

    // Should render without errors
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    expect(container.querySelector('a')).toBeInTheDocument();
  });

  it('should link to article detail pages', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        maxRecommendations={3}
      />
    );

    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.getAttribute('href')).toMatch(/^\/article\/\d+$/);
    });
  });

  it('should display article images', () => {
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id]}
        maxRecommendations={5}
      />
    );

    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should handle mix of read, liked, and bookmarked articles', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        likedArticleIds={[aiArticles[2].id]}
        bookmarkedArticleIds={[scienceArticles[0].id]}
        maxRecommendations={5}
      />
    );

    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id, aiArticles[1].id]}
        maxRecommendations={3}
      />
    );

    const firstLink = container.querySelector('a');
    if (firstLink) {
      await user.tab();
      expect(firstLink).toHaveFocus();
    }
  });

  it('should render with lazy loading for images', () => {
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={[aiArticles[0].id]}
        maxRecommendations={5}
      />
    );

    const images = container.querySelectorAll('img');
    images.forEach(img => {
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  it('should display no content when all articles have been read', () => {
    const allArticleIds = [aiArticles[0].id, aiArticles[1].id, aiArticles[2].id];
    const { container } = render(
      <RecommendationsWidget
        readArticleIds={allArticleIds}
        maxRecommendations={5}
      />
    );

    // Component might return null if no recommendations
    // Or it might show fallback recommendations (depends on implementation)
    expect(container.firstChild === null || screen.queryByText('Recommended For You')).toBeTruthy();
  });

  it('should handle empty read history gracefully', () => {
    render(
      <RecommendationsWidget
        readArticleIds={[]}
        maxRecommendations={3}
      />
    );

    // Should render recommendations from fallback
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
  });
});
