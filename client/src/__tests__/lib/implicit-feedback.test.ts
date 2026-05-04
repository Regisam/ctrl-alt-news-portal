import {
  calculateCategoryPreferences,
  loadBehavioralMetrics,
} from '@/lib/implicit-feedback';
import type { ReadingHistoryItem, BookmarkItem } from '@/lib/storage';
import type { Reaction } from '@/hooks/useReactions';
import type { ScrollMetrics } from '@/lib/behavioral-analytics';

const mockHistory: ReadingHistoryItem[] = [
  {
    articleId: '1',
    title: 'AI Article 1',
    category: 'AI',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    timeSpentMs: 120000,
  },
  {
    articleId: '2',
    title: 'Science Article 1',
    category: 'SCIENCE',
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
    timeSpentMs: 90000,
  },
];

const mockBookmarks: BookmarkItem[] = [
  {
    articleId: '3',
    title: 'AI Article 2',
    category: 'AI',
    dateSaved: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    articleId: '4',
    title: 'Robotics Article 1',
    category: 'ROBOTICS',
    dateSaved: Date.now() - 50 * 24 * 60 * 60 * 1000,
  },
];

const mockReactions: Reaction[] = [
  {
    articleId: '1',
    userId: 'user1',
    type: 'like',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    articleId: '2',
    userId: 'user1',
    type: 'clap',
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
];

const mockMetrics: Record<string, ScrollMetrics> = {
  '1': {
    articleId: '1',
    scrollDepth: 100,
    timeSpent: 120,
    readingTime: 300,
    completed: true,
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  '3': {
    articleId: '3',
    scrollDepth: 50,
    timeSpent: 60,
    readingTime: 150,
    completed: false,
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
};

describe('calculateCategoryPreferences', () => {
  it('should return empty array when no signals provided', () => {
    const prefs = calculateCategoryPreferences([], [], [], {});
    expect(prefs).toEqual([]);
  });

  it('should calculate scores from reading history', () => {
    const prefs = calculateCategoryPreferences(mockHistory, [], [], {});
    expect(prefs.length).toBe(2);
    expect(prefs[0].category).toBe('AI');
    expect(prefs[0].score).toBeCloseTo(1.0, 1);
    expect(prefs[1].category).toBe('SCIENCE');
  });

  it('should weight bookmarks higher than reads (2.0 vs 1.0)', () => {
    const history: ReadingHistoryItem[] = [
      {
        articleId: '1',
        title: 'Test',
        category: 'AI',
        timestamp: Date.now(),
        timeSpentMs: 60000,
      },
    ];
    const bookmarks: BookmarkItem[] = [
      {
        articleId: '2',
        title: 'Test',
        category: 'SCIENCE',
        dateSaved: Date.now(),
      },
    ];

    const prefs = calculateCategoryPreferences(history, bookmarks, [], {}, Date.now());
    const aiScore = prefs.find((p) => p.category === 'AI')?.score || 0;
    const scienceScore = prefs.find((p) => p.category === 'SCIENCE')?.score || 0;
    expect(scienceScore).toBeGreaterThan(aiScore);
  });

  it('should apply recency decay to signals older than 30 days', () => {
    const now = Date.now();
    const recentHistory: ReadingHistoryItem[] = [
      {
        articleId: '1',
        title: 'Recent',
        category: 'AI',
        timestamp: now - 5 * 24 * 60 * 60 * 1000,
        timeSpentMs: 60000,
      },
    ];
    const staleHistory: ReadingHistoryItem[] = [
      {
        articleId: '2',
        title: 'Stale',
        category: 'SCIENCE',
        timestamp: now - 50 * 24 * 60 * 60 * 1000,
        timeSpentMs: 60000,
      },
    ];

    // Add both to same calculation so normalization applies
    const bothHistory = [...recentHistory, ...staleHistory];
    const prefs = calculateCategoryPreferences(bothHistory, [], [], {}, now);

    const aiPref = prefs.find((p) => p.category === 'AI');
    const sciencePref = prefs.find((p) => p.category === 'SCIENCE');

    expect(aiPref?.score).toBeGreaterThan(sciencePref?.score || 0);
  });

  it('should weight completion signals highest (2.5x)', () => {
    const now = Date.now();
    const metrics: Record<string, ScrollMetrics> = {
      '1': {
        articleId: '1',
        scrollDepth: 100,
        timeSpent: 100,
        readingTime: 300,
        completed: true,
        timestamp: now,
      },
      '2': {
        articleId: '2',
        scrollDepth: 0,
        timeSpent: 10,
        readingTime: 50,
        completed: false,
        timestamp: now,
      },
    };
    const history: ReadingHistoryItem[] = [
      {
        articleId: '1',
        title: 'Test',
        category: 'AI',
        timestamp: now,
        timeSpentMs: 60000,
      },
      {
        articleId: '2',
        title: 'Other',
        category: 'SCIENCE',
        timestamp: now,
        timeSpentMs: 60000,
      },
    ];

    const prefs = calculateCategoryPreferences(history, [], [], metrics, now);
    const aiPref = prefs.find((p) => p.category === 'AI');
    const sciencePref = prefs.find((p) => p.category === 'SCIENCE');

    expect(aiPref?.score).toBeGreaterThan(sciencePref?.score || 0);
  });

  it('should weight partial scroll (25-99%) with 0.5x multiplier', () => {
    const now = Date.now();
    const metrics: Record<string, ScrollMetrics> = {
      '1': {
        articleId: '1',
        scrollDepth: 50,
        timeSpent: 100,
        readingTime: 300,
        completed: false,
        timestamp: now,
      },
    };
    const history: ReadingHistoryItem[] = [
      {
        articleId: '1',
        title: 'Test',
        category: 'AI',
        timestamp: now,
        timeSpentMs: 60000,
      },
    ];

    const prefs = calculateCategoryPreferences(history, [], [], metrics, now);
    expect(prefs[0].signalCount).toBe(2);
    expect(prefs[0].score).toBeGreaterThan(0);
  });

  it('should ignore reactions without category in history', () => {
    const now = Date.now();
    const reactions: Reaction[] = [
      {
        articleId: 'unknown-article',
        userId: 'user1',
        type: 'like',
        timestamp: now,
      },
    ];

    const prefs = calculateCategoryPreferences([], [], reactions, {}, now);
    expect(prefs).toEqual([]);
  });

  it('should normalize scores to 0-1 range', () => {
    const prefs = calculateCategoryPreferences(mockHistory, mockBookmarks, mockReactions, mockMetrics);
    prefs.forEach((p) => {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(1);
    });
  });

  it('should sort preferences by score descending', () => {
    const prefs = calculateCategoryPreferences(mockHistory, mockBookmarks, mockReactions, mockMetrics);
    for (let i = 0; i < prefs.length - 1; i++) {
      expect(prefs[i].score).toBeGreaterThanOrEqual(prefs[i + 1].score);
    }
  });

  it('should count total signals per category', () => {
    const prefs = calculateCategoryPreferences(mockHistory, mockBookmarks, mockReactions, mockMetrics);
    const aiPref = prefs.find((p) => p.category === 'AI');
    expect(aiPref?.signalCount).toBeGreaterThan(0);
  });

  it('should handle very old signals (decay to 0.7x)', () => {
    const now = Date.now();
    const mixed: ReadingHistoryItem[] = [
      {
        articleId: '1',
        title: 'Recent',
        category: 'AI',
        timestamp: now - 5 * 24 * 60 * 60 * 1000,
        timeSpentMs: 60000,
      },
      {
        articleId: '2',
        title: 'Very Old',
        category: 'SCIENCE',
        timestamp: now - 100 * 24 * 60 * 60 * 1000,
        timeSpentMs: 60000,
      },
    ];

    const prefs = calculateCategoryPreferences(mixed, [], [], {}, now);
    const sciencePref = prefs.find((p) => p.category === 'SCIENCE');
    expect(sciencePref?.score).toBeCloseTo(0.7, 1);
  });

  it('should handle zero scroll depth without crashing', () => {
    const now = Date.now();
    const metrics: Record<string, ScrollMetrics> = {
      '1': {
        articleId: '1',
        scrollDepth: 0,
        timeSpent: 100,
        readingTime: 300,
        completed: false,
        timestamp: now,
      },
    };

    expect(() => calculateCategoryPreferences([], [], [], metrics, now)).not.toThrow();
  });
});

describe('loadBehavioralMetrics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty object when no articles provided', () => {
    const metrics = loadBehavioralMetrics([]);
    expect(metrics).toEqual({});
  });

  it('should handle missing localStorage gracefully', () => {
    const metrics = loadBehavioralMetrics(['1', '2', '3']);
    expect(metrics).toEqual({});
  });

  it('should load valid metrics from localStorage', () => {
    const mockMetric: ScrollMetrics = {
      articleId: '1',
      scrollDepth: 75,
      timeSpent: 120,
      readingTime: 300,
      completed: false,
      timestamp: Date.now(),
    };

    localStorage.setItem('behavioral-metrics-1', JSON.stringify(mockMetric));
    const metrics = loadBehavioralMetrics(['1']);
    expect(metrics['1']).toEqual(mockMetric);
  });
});
