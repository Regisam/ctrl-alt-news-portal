/**
 * Co-Read Matrix Tests (Story 13.2 - Phase 1, Task 1.2)
 * Unit tests for co-read matrix construction and engagement weighting
 */

import { describe, it, expect } from 'vitest';
import {
  buildCoReadMatrix,
  getArticlesCoReadWith,
  findStrongCoReads,
  validateCoReadMatrix,
  type UserReadHistory,
} from '@shared/lib/coReadMatrix';

describe('coReadMatrix - Build Matrix', () => {
  it('should identify articles co-read by same user', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2', 'article3'],
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    expect(matrix.entries.length).toBeGreaterThan(0);
    expect(matrix.articleCoReadMap.size).toBeGreaterThan(0);
  });

  it('should compute correct co-read counts', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2'],
      },
      {
        userId: 'user2',
        articleIds: ['article1', 'article2'],
      },
      {
        userId: 'user3',
        articleIds: ['article1', 'article2'],
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    const coRead = matrix.entries.find(
      (e) =>
        (e.articleId1 === 'article1' && e.articleId2 === 'article2') ||
        (e.articleId1 === 'article2' && e.articleId2 === 'article1')
    );

    expect(coRead).toBeDefined();
    expect(coRead?.coReadCount).toBe(3); // All 3 users read both
  });

  it('should normalize article pair order', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['z-article', 'a-article'],
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    const entry = matrix.entries[0];
    expect(entry.articleId1 < entry.articleId2).toBe(true); // Normalized order (string comparison)
  });

  it('should handle empty history', () => {
    const histories: UserReadHistory[] = [];

    const matrix = buildCoReadMatrix(histories);

    expect(matrix.entries).toHaveLength(0);
    expect(matrix.articleCoReadMap.size).toBe(0);
  });

  it('should handle users with single article', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1'],
      },
      {
        userId: 'user2',
        articleIds: ['article2'],
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    expect(matrix.entries).toHaveLength(0); // No pairs
  });

  it('should compute average engagement scores', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2'],
        engagements: new Map([
          [
            'article1',
            { scrollDepth: 1.0, timeSpent: 600, isBookmarked: true },
          ],
          [
            'article2',
            { scrollDepth: 0.0, timeSpent: 0, isBookmarked: false },
          ],
        ]),
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    const entry = matrix.entries[0];
    expect(entry.avgEngagementScore).toBeGreaterThan(0);
    expect(entry.avgEngagementScore).toBeLessThanOrEqual(1);
  });
});

describe('coReadMatrix - Engagement Scoring', () => {
  it('should assign high score to high engagement', () => {
    const historyHigh: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2'],
        engagements: new Map([
          [
            'article1',
            { scrollDepth: 1.0, timeSpent: 600, isBookmarked: true },
          ],
          [
            'article2',
            { scrollDepth: 1.0, timeSpent: 600, isBookmarked: true },
          ],
        ]),
      },
    ];

    const historyLow: UserReadHistory[] = [
      {
        userId: 'user2',
        articleIds: ['article3', 'article4'],
        engagements: new Map([
          [
            'article3',
            { scrollDepth: 0.0, timeSpent: 0, isBookmarked: false },
          ],
          [
            'article4',
            { scrollDepth: 0.0, timeSpent: 0, isBookmarked: false },
          ],
        ]),
      },
    ];

    const matrixHigh = buildCoReadMatrix(historyHigh);
    const matrixLow = buildCoReadMatrix(historyLow);

    expect(matrixHigh.entries[0].avgEngagementScore).toBeGreaterThan(
      matrixLow.entries[0].avgEngagementScore
    );
  });

  it('should cap engagement score at 1.0', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2'],
        engagements: new Map([
          [
            'article1',
            { scrollDepth: 1.0, timeSpent: 10000, isBookmarked: true },
          ],
          [
            'article2',
            { scrollDepth: 1.0, timeSpent: 10000, isBookmarked: true },
          ],
        ]),
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    expect(matrix.entries[0].avgEngagementScore).toBeLessThanOrEqual(1.0);
  });

  it('should use default engagement if not provided', () => {
    const historyWithDefaults: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2'],
        // No engagements map - should use defaults
      },
    ];

    const matrix = buildCoReadMatrix(historyWithDefaults);

    expect(matrix.entries[0].avgEngagementScore).toBeGreaterThan(0);
  });
});

describe('coReadMatrix - Lookup Operations', () => {
  it('should return articles co-read with target article', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2', 'article3'],
      },
      {
        userId: 'user2',
        articleIds: ['article1', 'article4'],
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    const coReads = getArticlesCoReadWith('article1', matrix);

    expect(coReads.length).toBeGreaterThan(0);
    expect(coReads.every((e) => e.articleId1 === 'article1' || e.articleId2 === 'article1')).toBe(
      true
    );
  });

  it('should sort co-reads by engagement score descending', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2'],
        engagements: new Map([
          ['article1', { scrollDepth: 1.0, timeSpent: 600, isBookmarked: true }],
          ['article2', { scrollDepth: 0.1, timeSpent: 10, isBookmarked: false }],
        ]),
      },
      {
        userId: 'user2',
        articleIds: ['article1', 'article3'],
        engagements: new Map([
          ['article1', { scrollDepth: 1.0, timeSpent: 600, isBookmarked: true }],
          ['article3', { scrollDepth: 0.9, timeSpent: 500, isBookmarked: true }],
        ]),
      },
    ];

    const matrix = buildCoReadMatrix(histories);
    const coReads = getArticlesCoReadWith('article1', matrix);

    // Should be sorted by engagement (highest first)
    for (let i = 0; i < coReads.length - 1; i++) {
      expect(coReads[i].avgEngagementScore).toBeGreaterThanOrEqual(
        coReads[i + 1].avgEngagementScore
      );
    }
  });

  it('should respect limit parameter', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2', 'article3', 'article4', 'article5'],
      },
    ];

    const matrix = buildCoReadMatrix(histories);

    const coReads = getArticlesCoReadWith('article1', matrix, 2);

    expect(coReads.length).toBeLessThanOrEqual(2);
  });

  it('should find strong co-reads above threshold', () => {
    const histories: UserReadHistory[] = [
      { userId: 'user1', articleIds: ['article1', 'article2'] },
      { userId: 'user2', articleIds: ['article1', 'article2'] },
      { userId: 'user3', articleIds: ['article1', 'article2'] },
      { userId: 'user4', articleIds: ['article1', 'article3'] },
    ];

    const matrix = buildCoReadMatrix(histories);

    // All pairs will have default engagement score ~0.33
    // With minCoReadCount=2 and minEngagementScore=0.2, should find article1-article2 (3 co-reads)
    const strongCoReads = findStrongCoReads(matrix, 2, 0.2);

    expect(strongCoReads.length).toBeGreaterThan(0);
    expect(
      strongCoReads.some((e) => e.articleId1 === 'article1' && e.articleId2 === 'article2')
    ).toBe(true);
  });
});

describe('coReadMatrix - Validation', () => {
  it('should validate correct matrix', () => {
    const histories: UserReadHistory[] = [
      {
        userId: 'user1',
        articleIds: ['article1', 'article2'],
      },
    ];

    const matrix = buildCoReadMatrix(histories);
    const result = validateCoReadMatrix(matrix);

    expect(result.valid).toBe(true);
  });

  it('should detect invalid co-read counts', () => {
    const matrix = {
      entries: [
        {
          articleId1: 'article1',
          articleId2: 'article2',
          coReadCount: 0, // Invalid
          avgEngagementScore: 0.5,
        },
      ],
      articleCoReadMap: new Map(),
      lastUpdated: new Date(),
      computationTimeMs: 0,
    };

    const result = validateCoReadMatrix(matrix);
    expect(result.valid).toBe(false);
  });

  it('should detect invalid engagement scores', () => {
    const matrix = {
      entries: [
        {
          articleId1: 'article1',
          articleId2: 'article2',
          coReadCount: 1,
          avgEngagementScore: 1.5, // Invalid
        },
      ],
      articleCoReadMap: new Map(),
      lastUpdated: new Date(),
      computationTimeMs: 0,
    };

    const result = validateCoReadMatrix(matrix);
    expect(result.valid).toBe(false);
  });
});
