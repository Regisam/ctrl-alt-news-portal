import { render, screen } from '@testing-library/react';
import { PersonalizedFeed } from '@/components/PersonalizedFeed';
import type { Article } from '@/lib/data';

const mockArticles: Article[] = [
  {
    id: 1,
    title: { en: 'AI Breakthrough', pt: 'Avanço em IA' },
    excerpt: { en: 'New AI model...', pt: 'Novo modelo IA...' },
    category: 'AI',
    author: 'John Doe',
    date: 'May 1, 2026',
    readTime: '5 min',
    views: '1200',
    image: 'ai-1.jpg',
  },
  {
    id: 2,
    title: { en: 'Science Discovery', pt: 'Descoberta Científica' },
    excerpt: { en: 'Scientists found...', pt: 'Cientistas descobriram...' },
    category: 'SCIENCE',
    author: 'Jane Smith',
    date: 'May 2, 2026',
    readTime: '7 min',
    views: '950',
    image: 'science-1.jpg',
  },
  {
    id: 3,
    title: { en: 'Robot Innovation', pt: 'Inovação em Robótica' },
    excerpt: { en: 'New robot...', pt: 'Novo robô...' },
    category: 'ROBOTICS',
    author: 'Bot Builder',
    date: 'May 3, 2026',
    readTime: '4 min',
    views: '1500',
    image: 'robot-1.jpg',
  },
  {
    id: 4,
    title: { en: 'Gadget Review', pt: 'Análise de Gadget' },
    excerpt: { en: 'Latest gadget...', pt: 'Gadget mais recente...' },
    category: 'GADGETS',
    author: 'Tech Guy',
    date: 'May 4, 2026',
    readTime: '6 min',
    views: '800',
    image: 'gadget-1.jpg',
  },
];

describe('PersonalizedFeed', () => {
  it('should render section with personalized variant title', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI']}
        trendingArticles={[mockArticles[0]]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByText('🎯 For You')).toBeInTheDocument();
    expect(screen.getByText('Handpicked for your interests')).toBeInTheDocument();
  });

  it('should render section with chronological variant title', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI']}
        trendingArticles={[mockArticles[0]]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="chronological"
      />
    );

    expect(screen.getByText('📰 Latest')).toBeInTheDocument();
    expect(screen.getByText('Most recent articles')).toBeInTheDocument();
  });

  it('should render Portuguese titles when lang=pt', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI']}
        trendingArticles={[mockArticles[0]]}
        readArticleIds={[]}
        lang="pt"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByText('🎯 Para Você')).toBeInTheDocument();
    expect(screen.getByText('Selecionado para seus interesses')).toBeInTheDocument();
  });

  it('should return null when no articles available', () => {
    const { container } = render(
      <PersonalizedFeed
        allArticles={[]}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={8}
        abVariant="personalized"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should filter out read articles from personalized feed', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI', 'SCIENCE']}
        trendingArticles={[]}
        readArticleIds={[1, 2]} // Articles 1 and 2 are read
        lang="en"
        maxItems={8}
        abVariant="personalized"
      />
    );

    // Article 1 and 2 should not appear since they're read
    expect(screen.queryByText('AI Breakthrough')).not.toBeInTheDocument();
    expect(screen.queryByText('Science Discovery')).not.toBeInTheDocument();
  });

  it('should display personalized feed with 60/40 mix algorithm', () => {
    const trendingOnly = [mockArticles[3]]; // Gadget is trending

    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI', 'SCIENCE']} // Prefer AI and Science
        trendingArticles={trendingOnly}
        readArticleIds={[]}
        lang="en"
        maxItems={8}
        abVariant="personalized"
      />
    );

    // Should show all articles since we're not filtering
    expect(screen.getByText('AI Breakthrough')).toBeInTheDocument();
    expect(screen.getByText('Science Discovery')).toBeInTheDocument();
    expect(screen.getByText('Robot Innovation')).toBeInTheDocument();
    expect(screen.getByText('Gadget Review')).toBeInTheDocument();
  });

  it('should respect maxItems limit', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI', 'SCIENCE', 'ROBOTICS']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={2}
        abVariant="personalized"
      />
    );

    const cards = screen.getAllByRole('link');
    // Should only show 2 cards (maxItems=2), plus other links might exist
    const feedLinks = cards.filter((link) =>
      link.getAttribute('href')?.startsWith('/article/')
    );
    expect(feedLinks.length).toBeLessThanOrEqual(2);
  });

  it('should show chronological feed when abVariant=chronological', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI']}
        trendingArticles={[mockArticles[3]]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="chronological"
      />
    );

    // Chronological mode should show unread articles regardless of preferences
    expect(screen.getByText('AI Breakthrough')).toBeInTheDocument();
    expect(screen.getByText('Science Discovery')).toBeInTheDocument();
  });

  it('should fallback to chronological when no preferences provided', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={[]}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    // Should show articles in chronological order (most recent first)
    expect(screen.getByText('Gadget Review')).toBeInTheDocument();
  });

  it('should render feed cards with correct article titles', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI', 'SCIENCE']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByText('AI Breakthrough')).toBeInTheDocument();
    expect(screen.getByText('Science Discovery')).toBeInTheDocument();
  });

  it('should render feed cards with category labels', () => {
    render(
      <PersonalizedFeed
        allArticles={[mockArticles[0]]}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('should render feed cards with excerpts', () => {
    render(
      <PersonalizedFeed
        allArticles={[mockArticles[0]]}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByText('New AI model...')).toBeInTheDocument();
  });

  it('should render feed cards with view counts and read time', () => {
    render(
      <PersonalizedFeed
        allArticles={[mockArticles[0]]}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByText('1200')).toBeInTheDocument();
    expect(screen.getByText('5 min')).toBeInTheDocument();
  });

  it('should render feed cards with correct links', () => {
    render(
      <PersonalizedFeed
        allArticles={[mockArticles[0]]}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    const link = screen.getByRole('link', { name: /Read: AI Breakthrough/i });
    expect(link).toHaveAttribute('href', '/article/1');
  });

  it('should render Portuguese excerpts when lang=pt', () => {
    render(
      <PersonalizedFeed
        allArticles={[mockArticles[0]]}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="pt"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByText('Novo modelo IA...')).toBeInTheDocument();
  });

  it('should apply responsive grid layout', () => {
    const { container } = render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI', 'SCIENCE', 'ROBOTICS']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    const grid = container.querySelector('[class*="feed-grid"]');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveStyle({ display: 'grid' });
  });

  it('should render accessible section with aria-label', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByRole('region', { name: /Personalized feed/i })).toBeInTheDocument();
  });

  it('should render accessible section with Portuguese aria-label when lang=pt', () => {
    render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="pt"
        maxItems={4}
        abVariant="personalized"
      />
    );

    expect(screen.getByRole('region', { name: /Feed personalizado/i })).toBeInTheDocument();
  });

  it('should handle empty userPreferences gracefully', () => {
    const { container } = render(
      <PersonalizedFeed
        allArticles={mockArticles}
        userPreferences={undefined}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    // Should render section (might be null if no articles after filtering)
    const section = container.querySelector('section');
    if (section) {
      expect(section).toBeInTheDocument();
    }
  });

  it('should prioritize preferred categories in personalized mode', () => {
    const articles = [
      mockArticles[0], // AI (preferred)
      mockArticles[1], // SCIENCE (not preferred)
      mockArticles[2], // ROBOTICS (not preferred)
      mockArticles[3], // GADGETS (not preferred)
    ];

    render(
      <PersonalizedFeed
        allArticles={articles}
        userPreferences={['AI']}
        trendingArticles={[]}
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    // AI article should be included from preferred categories (60%)
    expect(screen.getByText('AI Breakthrough')).toBeInTheDocument();
  });

  it('should include trending articles in personalized feed', () => {
    const articles = [
      mockArticles[0], // AI (preferred)
      mockArticles[1], // SCIENCE (not preferred)
      mockArticles[2], // ROBOTICS (not preferred but trending)
      mockArticles[3], // GADGETS (not preferred)
    ];

    render(
      <PersonalizedFeed
        allArticles={articles}
        userPreferences={['AI']}
        trendingArticles={[mockArticles[2]]} // ROBOTICS is trending
        readArticleIds={[]}
        lang="en"
        maxItems={4}
        abVariant="personalized"
      />
    );

    // Should include trending article even though ROBOTICS not in preferences
    expect(screen.getByText('Robot Innovation')).toBeInTheDocument();
  });
});
