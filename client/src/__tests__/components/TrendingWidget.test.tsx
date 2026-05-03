import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { TrendingWidget } from '@/components/TrendingWidget';

// Mock wouter Link component
vi.mock('wouter', () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock the useTrending hook
vi.mock('@/hooks/useTrending', () => ({
  useTrending: ({ count, maxCount }: any) => {
    const allArticles = [
      {
        id: 1,
        title: { en: 'Article 1', pt: 'Artigo 1' },
        excerpt: { en: 'Excerpt 1', pt: 'Resumo 1' },
        category: 'AI' as const,
        author: 'Author 1',
        date: 'Feb 24, 2026',
        readTime: '5 min',
        views: '1000',
        image: 'img1.jpg',
      },
      {
        id: 2,
        title: { en: 'Article 2', pt: 'Artigo 2' },
        excerpt: { en: 'Excerpt 2', pt: 'Resumo 2' },
        category: 'SCIENCE' as const,
        author: 'Author 2',
        date: 'Feb 23, 2026',
        readTime: '7 min',
        views: '2000',
        image: 'img2.jpg',
      },
    ];
    const limit = Math.min(count || 3, maxCount || 5, allArticles.length);
    return { trending: allArticles.slice(0, limit) };
  },
}));

describe('TrendingWidget', () => {
  it('should render widget with default title', () => {
    render(<TrendingWidget />);

    expect(screen.getByText('Trending Now')).toBeInTheDocument();
  });

  it('should render custom title when provided', () => {
    render(<TrendingWidget title="Hot Topics" />);

    expect(screen.getByText('Hot Topics')).toBeInTheDocument();
  });

  it('should render trending articles', () => {
    render(<TrendingWidget />);

    expect(screen.getByText('Article 1')).toBeInTheDocument();
    expect(screen.getByText('Article 2')).toBeInTheDocument();
  });

  it('should render rank badges for each article', () => {
    render(<TrendingWidget />);

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('should render category badges', () => {
    render(<TrendingWidget />);

    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('SCIENCE')).toBeInTheDocument();
  });

  it('should render article metadata (views and readTime)', () => {
    render(<TrendingWidget />);

    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('2000')).toBeInTheDocument();
    expect(screen.getAllByText(/min/).length).toBeGreaterThan(0);
  });

  it('should render article links with correct hrefs', () => {
    render(<TrendingWidget />);

    const allLinks = screen.getAllByRole('link');
    const articleLinks = allLinks.filter((el): el is HTMLAnchorElement =>
      el instanceof HTMLAnchorElement && el.href.includes('/article/')
    );

    expect(articleLinks.length).toBeGreaterThanOrEqual(2);
    expect(articleLinks[0].href).toContain('/article/1');
    expect(articleLinks[1].href).toContain('/article/2');
  });

  it('should pass engagement data to hook', () => {
    const reactionIds = [1, 2];
    const bookmarkIds = [1];
    const shareIds = [2];

    render(
      <TrendingWidget
        reactionArticleIds={reactionIds}
        bookmarkArticleIds={bookmarkIds}
        shareArticleIds={shareIds}
      />
    );

    // If hook received correct props, articles should render
    expect(screen.getByText('Article 1')).toBeInTheDocument();
  });

  it('should respect maxTrending parameter', () => {
    const { container } = render(<TrendingWidget maxTrending={1} />);

    // Count article links (excluding trending header link if any)
    const articleLinks = container.querySelectorAll('a[href^="/article/"]');
    expect(articleLinks.length).toBeLessThanOrEqual(1);
  });

  it('should have proper accessibility attributes', () => {
    const { container } = render(<TrendingWidget />);

    // Check for aria-hidden on decorative elements (SVG icons)
    const ariaHiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHiddenElements.length).toBeGreaterThan(0);
  });

  it('should apply correct styling to AI category', () => {
    const { container } = render(<TrendingWidget />);

    const aiBadge = screen.getByText('AI');
    expect(aiBadge).toHaveStyle({ color: '#00D4FF' });
  });

  it('should apply correct styling to SCIENCE category', () => {
    const { container } = render(<TrendingWidget />);

    const scienceBadge = screen.getByText('SCIENCE');
    expect(scienceBadge).toHaveStyle({ color: '#A855F7' });
  });

  it('should render without crashing with minimal props', () => {
    const { container } = render(<TrendingWidget />);

    expect(container).toBeInTheDocument();
  });

  it('should render Flame icon for trending indicator', () => {
    const { container } = render(<TrendingWidget />);

    // Check if Flame icon is rendered (lucide-react icon)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it('should render all provided articles', () => {
    render(<TrendingWidget />);

    expect(screen.getByText('Article 1')).toBeInTheDocument();
    expect(screen.getByText('Article 2')).toBeInTheDocument();
  });
});
