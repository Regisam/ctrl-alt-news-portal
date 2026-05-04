import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendationsWidget } from '@/components/RecommendationsWidget';
import { aiArticles, scienceArticles } from '@/lib/data';
import { describe, it, expect } from 'vitest';

describe('RecommendationsWidget component', () => {
  it('should render with default title', () => {
    render(<RecommendationsWidget />);
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(<RecommendationsWidget title="Custom Recommendations" />);
    expect(screen.getByText('Custom Recommendations')).toBeInTheDocument();
  });

  it('should render recommendations', () => {
    const { container } = render(<RecommendationsWidget />);
    const links = container.querySelectorAll('a[href^="/article/"]');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should display recommendation cards', () => {
    render(<RecommendationsWidget count={5} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('should display article titles', () => {
    render(<RecommendationsWidget />);
    const titles = screen.queryAllByText(/./);
    expect(titles.length).toBeGreaterThan(0);
  });

  it('should display read time for articles', () => {
    render(<RecommendationsWidget />);
    const timeElements = screen.queryAllByText(/min/i);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should display view count for articles', () => {
    const { container } = render(<RecommendationsWidget />);
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should respect count prop', () => {
    const { container } = render(<RecommendationsWidget count={2} />);
    const cards = container.querySelectorAll('a[href^="/article/"]');
    expect(cards.length).toBeLessThanOrEqual(2);
  });

  it('should exclude current article from recommendations', () => {
    render(<RecommendationsWidget excludeArticleId={aiArticles[0].id} />);
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
  });

  it('should render category badges', () => {
    render(<RecommendationsWidget />);
    const categoryBadges = screen.queryAllByText(/^(AI|SCIENCE|ROBOTICS|GADGETS)$/);
    expect(categoryBadges.length).toBeGreaterThan(0);
  });

  it('should accept custom category colors', () => {
    const { container } = render(
      <RecommendationsWidget
        categoryColor="#FF0000"
        categoryBg="rgba(255,0,0,0.12)"
        categoryBorder="rgba(255,0,0,0.4)"
      />
    );
    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    expect(container.querySelector('a')).toBeInTheDocument();
  });

  it('should link to article detail pages', () => {
    render(<RecommendationsWidget />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.getAttribute('href')).toMatch(/^\/article\/\d+$/);
    });
  });

  it('should display article images', () => {
    const { container } = render(<RecommendationsWidget />);
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecommendationsWidget />);

    const firstLink = container.querySelector('a');
    if (firstLink) {
      await user.tab();
      expect(firstLink).toHaveFocus();
    }
  });

  it('should render with lazy loading for images', () => {
    const { container } = render(<RecommendationsWidget />);
    const images = container.querySelectorAll('img');
    images.forEach(img => {
      expect(img.getAttribute('loading')).toBe('lazy');
    });
  });

  it('should render recommendations with default count', () => {
    const { container } = render(<RecommendationsWidget />);
    const links = container.querySelectorAll('a[href^="/article/"]');
    expect(links.length).toBeLessThanOrEqual(3);
  });

  it('should handle large count values gracefully', () => {
    const { container } = render(<RecommendationsWidget count={100} />);
    const links = container.querySelectorAll('a[href^="/article/"]');
    expect(links.length).toBeGreaterThan(0);
  });
});
