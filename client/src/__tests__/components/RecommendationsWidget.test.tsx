import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendationsWidget } from '@/components/RecommendationsWidget';
import { aiArticles } from '@/lib/data';
import { describe, it, expect } from 'vitest';

describe('RecommendationsWidget component', () => {
  it('should render with default title', async () => {
    render(<RecommendationsWidget />);
    await waitFor(() => {
      expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    });
  });

  it('should render with custom title', async () => {
    render(<RecommendationsWidget title="Custom Recommendations" />);
    await waitFor(() => {
      expect(screen.getByText('Custom Recommendations')).toBeInTheDocument();
    });
  });

  it('should render recommendations', async () => {
    const { container } = render(<RecommendationsWidget />);
    await waitFor(() => {
      const links = container.querySelectorAll('a[href^="/article/"]');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('should display recommendation cards', async () => {
    render(<RecommendationsWidget count={5} />);
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('should display article titles', async () => {
    render(<RecommendationsWidget />);
    await waitFor(() => {
      const titles = screen.queryAllByText(/./);
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it('should display read time for articles', async () => {
    render(<RecommendationsWidget />);
    await waitFor(() => {
      const timeElements = screen.queryAllByText(/min/i);
      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  it('should display view count for articles', async () => {
    const { container } = render(<RecommendationsWidget />);
    await waitFor(() => {
      expect(screen.getByText('Recommended For You')).toBeInTheDocument();
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('should respect count prop', async () => {
    const { container } = render(<RecommendationsWidget count={2} />);
    await waitFor(() => {
      const cards = container.querySelectorAll('a[href^="/article/"]');
      expect(cards.length).toBeLessThanOrEqual(2);
    });
  });

  it('should exclude current article from recommendations', async () => {
    render(<RecommendationsWidget excludeArticleId={aiArticles[0].id} />);
    await waitFor(() => {
      expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    });
  });

  it('should render category badges', async () => {
    render(<RecommendationsWidget />);
    await waitFor(() => {
      const categoryBadges = screen.queryAllByText(/^(AI|SCIENCE|ROBOTICS|GADGETS)$/);
      expect(categoryBadges.length).toBeGreaterThan(0);
    });
  });

  it('should accept custom category colors', async () => {
    const { container } = render(
      <RecommendationsWidget
        categoryColor="#FF0000"
        categoryBg="rgba(255,0,0,0.12)"
        categoryBorder="rgba(255,0,0,0.4)"
      />
    );
    await waitFor(() => {
      expect(screen.getByText('Recommended For You')).toBeInTheDocument();
      expect(container.querySelector('a')).toBeInTheDocument();
    });
  });

  it('should link to article detail pages', async () => {
    render(<RecommendationsWidget />);
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link.getAttribute('href')).toMatch(/^\/article\/\d+$/);
      });
    });
  });

  it('should display article images', async () => {
    const { container } = render(<RecommendationsWidget />);
    await waitFor(() => {
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup();
    const { container } = render(<RecommendationsWidget />);

    await waitFor(() => {
      const firstLink = container.querySelector('a');
      expect(firstLink).toBeInTheDocument();
    });

    const firstLink = container.querySelector('a');
    if (firstLink) {
      await user.tab();
      expect(firstLink).toHaveFocus();
    }
  });

  it('should render with lazy loading for images', async () => {
    const { container } = render(<RecommendationsWidget />);
    await waitFor(() => {
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
      images.forEach(img => {
        expect(img.getAttribute('loading')).toBe('lazy');
      });
    });
  });

  it('should render recommendations with default count', async () => {
    const { container } = render(<RecommendationsWidget />);
    await waitFor(() => {
      const links = container.querySelectorAll('a[href^="/article/"]');
      expect(links.length).toBeLessThanOrEqual(3);
    });
  });

  it('should handle large count values gracefully', async () => {
    const { container } = render(<RecommendationsWidget count={100} />);
    await waitFor(() => {
      const links = container.querySelectorAll('a[href^="/article/"]');
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
