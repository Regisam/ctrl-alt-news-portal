import {
  calculateTrendingScore,
  getTrendingArticles,
  getFallbackTrendingArticles,
  extractEngagementSignals,
  type EngagementSignals,
} from '@/lib/trending';
import type { Article } from '@/lib/data';

const mockArticles: Article[] = [
  {
    id: 1,
    title: { en: 'Article 1', pt: 'Artigo 1' },
    excerpt: { en: 'Excerpt 1', pt: 'Resumo 1' },
    category: 'AI',
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
    category: 'SCIENCE',
    author: 'Author 2',
    date: 'Feb 23, 2026',
    readTime: '7 min',
    views: '2000',
    image: 'img2.jpg',
  },
  {
    id: 3,
    title: { en: 'Article 3', pt: 'Artigo 3' },
    excerpt: { en: 'Excerpt 3', pt: 'Resumo 3' },
    category: 'ROBOTICS',
    author: 'Author 3',
    date: 'Feb 22, 2026',
    readTime: '6 min',
    views: '500',
    image: 'img3.jpg',
  },
];

describe('calculateTrendingScore', () => {
  it('should calculate correct score with all engagement signals', () => {
    // Use very recent date (5 minutes ago) - include time to avoid midnight issue
    const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const score = calculateTrendingScore(10, 5, 2, recentDate);
    // reactions: 10*1.0 = 10
    // bookmarks: 5*1.5 = 7.5
    // shares: 2*2.0 = 4.0
    // baseScore = 21.5, multiply by ageDecay (~0.998 for 5 min)
    expect(score).toBeGreaterThan(21);
    expect(score).toBeLessThan(22);
  });

  it('should return 0 for articles with no engagement', () => {
    const score = calculateTrendingScore(0, 0, 0, 'Feb 24, 2026');
    expect(score).toBe(0);
  });

  it('should weight shares highest, then bookmarks, then reactions', () => {
    const score1 = calculateTrendingScore(10, 0, 0, 'Feb 24, 2026');
    const score2 = calculateTrendingScore(0, 10, 0, 'Feb 24, 2026');
    const score3 = calculateTrendingScore(0, 0, 10, 'Feb 24, 2026');

    // shares (score3) > bookmarks (score2) > reactions (score1)
    expect(score3).toBeGreaterThan(score2);
    expect(score2).toBeGreaterThan(score1);
  });

  it('should apply time decay to older articles', () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 1 * 60 * 60 * 1000).toDateString(); // 1 hour ago
    const old = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toDateString(); // 7 days ago

    const scoreRecent = calculateTrendingScore(10, 5, 2, recent);
    const scoreOld = calculateTrendingScore(10, 5, 2, old);

    // Recent should score higher due to less time decay
    expect(scoreRecent).toBeGreaterThan(scoreOld);
  });

  it('should maintain minimum decay of 0.1 for very old articles', () => {
    // Article from 2 years ago
    const veryOld = 'Feb 24, 2024';
    const score = calculateTrendingScore(10, 5, 2, veryOld);
    // baseScore = 21.5, min decay = 0.1, so score >= 2.15
    expect(score).toBeGreaterThanOrEqual(2.0);
    expect(score).toBeLessThan(3);
  });

  it('should handle edge case with very large engagement numbers', () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const score = calculateTrendingScore(1000, 500, 100, recentDate);
    // reactions: 1000*1.0 = 1000
    // bookmarks: 500*1.5 = 750
    // shares: 100*2.0 = 200
    // baseScore = 1950, multiply by ageDecay ~0.998
    expect(score).toBeGreaterThan(1940);
  });
});

describe('getTrendingArticles', () => {
  it('should return trending articles sorted by score', () => {
    const engagementMap = new Map<number, EngagementSignals>([
      [1, { articleId: 1, reactions: 10, bookmarks: 5, shares: 2, timestamp: Date.now() }],
      [2, { articleId: 2, reactions: 5, bookmarks: 2, shares: 1, timestamp: Date.now() }],
      [3, { articleId: 3, reactions: 20, bookmarks: 10, shares: 5, timestamp: Date.now() }],
    ]);

    const trending = getTrendingArticles(mockArticles, engagementMap, 3, 10);

    expect(trending.length).toBe(3);
    expect(trending[0].id).toBe(3); // Highest engagement
    expect(trending[2].id).toBe(2); // Lowest engagement
  });

  it('should respect count parameter', () => {
    const engagementMap = new Map<number, EngagementSignals>([
      [1, { articleId: 1, reactions: 10, bookmarks: 5, shares: 2, timestamp: Date.now() }],
      [2, { articleId: 2, reactions: 5, bookmarks: 2, shares: 1, timestamp: Date.now() }],
      [3, { articleId: 3, reactions: 20, bookmarks: 10, shares: 5, timestamp: Date.now() }],
    ]);

    const trending = getTrendingArticles(mockArticles, engagementMap, 2, 10);
    expect(trending.length).toBe(2);
  });

  it('should respect maxCount parameter', () => {
    const engagementMap = new Map<number, EngagementSignals>([
      [1, { articleId: 1, reactions: 10, bookmarks: 5, shares: 2, timestamp: Date.now() }],
      [2, { articleId: 2, reactions: 5, bookmarks: 2, shares: 1, timestamp: Date.now() }],
      [3, { articleId: 3, reactions: 20, bookmarks: 10, shares: 5, timestamp: Date.now() }],
    ]);

    const trending = getTrendingArticles(mockArticles, engagementMap, 5, 2);
    expect(trending.length).toBe(2); // Limited by maxCount
  });

  it('should return all articles up to count limit', () => {
    const engagementMap = new Map<number, EngagementSignals>([
      [1, { articleId: 1, reactions: 10, bookmarks: 5, shares: 2, timestamp: Date.now() }],
      [2, { articleId: 2, reactions: 5, bookmarks: 2, shares: 1, timestamp: Date.now() }],
      [3, { articleId: 3, reactions: 0, bookmarks: 0, shares: 0, timestamp: Date.now() }],
    ]);

    const trending = getTrendingArticles(mockArticles, engagementMap, 2, 10);
    expect(trending.length).toBe(2); // Limited by count=2
  });

  it('should handle empty engagement map', () => {
    const engagementMap = new Map<number, EngagementSignals>();
    const trending = getTrendingArticles(mockArticles, engagementMap, 3, 10);

    expect(trending.length).toBe(3);
    // All should have score 0, sorted by views as tiebreaker
    expect(trending[0].id).toBe(2); // views: 2000
    expect(trending[1].id).toBe(1); // views: 1000
    expect(trending[2].id).toBe(3); // views: 500
  });

  it('should use views as tiebreaker when scores are equal', () => {
    const engagementMap = new Map<number, EngagementSignals>([
      [1, { articleId: 1, reactions: 10, bookmarks: 5, shares: 2, timestamp: Date.now() }],
      [2, { articleId: 2, reactions: 10, bookmarks: 5, shares: 2, timestamp: Date.now() }],
      [3, { articleId: 3, reactions: 10, bookmarks: 5, shares: 2, timestamp: Date.now() }],
    ]);

    const trending = getTrendingArticles(mockArticles, engagementMap, 3, 10);
    expect(trending[0].id).toBe(2); // 2000 views
    expect(trending[1].id).toBe(1); // 1000 views
    expect(trending[2].id).toBe(3); // 500 views
  });
});

describe('getFallbackTrendingArticles', () => {
  it('should return articles sorted by views when no engagement data', () => {
    const trending = getFallbackTrendingArticles(mockArticles, 3, 10);

    expect(trending.length).toBe(3);
    expect(trending[0].id).toBe(2); // 2000 views
    expect(trending[1].id).toBe(1); // 1000 views
    expect(trending[2].id).toBe(3); // 500 views
  });

  it('should respect count parameter', () => {
    const trending = getFallbackTrendingArticles(mockArticles, 2, 10);
    expect(trending.length).toBe(2);
  });

  it('should respect maxCount parameter', () => {
    const trending = getFallbackTrendingArticles(mockArticles, 5, 1);
    expect(trending.length).toBe(1);
  });

  it('should return all articles if count is greater than available', () => {
    const trending = getFallbackTrendingArticles(mockArticles, 10, 20);
    expect(trending.length).toBe(3);
  });
});

describe('extractEngagementSignals', () => {
  it('should extract engagement signals correctly', () => {
    const reactionMap = new Map([[1, 10], [2, 5]]);
    const bookmarkMap = new Map([[1, 5], [3, 2]]);
    const shareMap = new Map([[2, 1], [3, 3]]);

    const engagementMap = extractEngagementSignals(
      mockArticles,
      reactionMap,
      bookmarkMap,
      shareMap
    );

    expect(engagementMap.size).toBe(3);
    expect(engagementMap.get(1)).toEqual({
      articleId: 1,
      reactions: 10,
      bookmarks: 5,
      shares: 0,
      timestamp: expect.any(Number),
    });
    expect(engagementMap.get(3)).toEqual({
      articleId: 3,
      reactions: 0,
      bookmarks: 2,
      shares: 3,
      timestamp: expect.any(Number),
    });
  });

  it('should default to 0 when maps are not provided', () => {
    const engagementMap = extractEngagementSignals(mockArticles);

    expect(engagementMap.get(1)).toEqual({
      articleId: 1,
      reactions: 0,
      bookmarks: 0,
      shares: 0,
      timestamp: expect.any(Number),
    });
  });

  it('should create entry for all articles even without engagement', () => {
    const reactionMap = new Map([[1, 100]]);
    const engagementMap = extractEngagementSignals(mockArticles, reactionMap);

    expect(engagementMap.size).toBe(3);
    expect(engagementMap.has(1)).toBe(true);
    expect(engagementMap.has(2)).toBe(true);
    expect(engagementMap.has(3)).toBe(true);
  });
});
