/**
 * Item Collaborative Filtering Tests (Story 13.2 - Phase 1, Tasks 1.1-1.3)
 * Unit tests for Jaccard/cosine similarity and item similarity matrix
 */

import { describe, it, expect } from 'vitest';
import {
  computeJaccardSimilarity,
  computeCosineSimilarity,
  computeItemSimilarityMatrix,
  getKNearestArticles,
  validateItemSimilarityMatrix,
} from '@shared/lib/itemCollaborativeFiltering';

describe('itemCollaborativeFiltering - Jaccard Similarity', () => {
  it('should compute perfect similarity (1.0) for identical sets', () => {
    const set1 = new Set(['user1', 'user2', 'user3']);
    const set2 = new Set(['user1', 'user2', 'user3']);

    const sim = computeJaccardSimilarity(set1, set2);
    expect(sim).toBe(1.0);
  });

  it('should compute zero similarity for disjoint sets', () => {
    const set1 = new Set(['user1', 'user2']);
    const set2 = new Set(['user3', 'user4']);

    const sim = computeJaccardSimilarity(set1, set2);
    expect(sim).toBe(0.0);
  });

  it('should compute partial similarity for overlapping sets', () => {
    const set1 = new Set(['user1', 'user2', 'user3']);
    const set2 = new Set(['user2', 'user3', 'user4']);

    // intersection = {user2, user3} = 2
    // union = {user1, user2, user3, user4} = 4
    // Jaccard = 2/4 = 0.5
    const sim = computeJaccardSimilarity(set1, set2);
    expect(sim).toBe(0.5);
  });

  it('should handle empty sets', () => {
    const empty1 = new Set<string>();
    const empty2 = new Set<string>();

    const sim = computeJaccardSimilarity(empty1, empty2);
    expect(sim).toBe(1.0); // Both empty = identical
  });

  it('should handle one empty, one non-empty set', () => {
    const empty = new Set<string>();
    const nonEmpty = new Set(['user1', 'user2']);

    const sim = computeJaccardSimilarity(empty, nonEmpty);
    expect(sim).toBe(0.0);
  });

  it('should handle single-element sets', () => {
    const set1 = new Set(['user1']);
    const set2 = new Set(['user1']);

    const sim = computeJaccardSimilarity(set1, set2);
    expect(sim).toBe(1.0);
  });
});

describe('itemCollaborativeFiltering - Cosine Similarity', () => {
  it('should compute perfect similarity (1.0) for identical vectors', () => {
    const vec1 = [1, 0, 1, 0];
    const vec2 = [1, 0, 1, 0];

    const sim = computeCosineSimilarity(vec1, vec2);
    expect(sim).toBeCloseTo(1.0, 5);
  });

  it('should compute zero similarity for orthogonal vectors', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [0, 1, 0];

    const sim = computeCosineSimilarity(vec1, vec2);
    expect(sim).toBeCloseTo(0, 5);
  });

  it('should compute partial similarity for partially overlapping vectors', () => {
    const vec1 = [1, 0, 1];
    const vec2 = [1, 0, 0];

    // dot = 1*1 + 0*0 + 1*0 = 1
    // mag1 = sqrt(1 + 0 + 1) = sqrt(2)
    // mag2 = sqrt(1 + 0 + 0) = 1
    // cosine = 1 / sqrt(2) ≈ 0.707
    const sim = computeCosineSimilarity(vec1, vec2);
    expect(sim).toBeCloseTo(0.707, 2);
  });

  it('should handle zero vectors', () => {
    const zero = [0, 0, 0];
    const nonZero = [1, 0, 1];

    const sim = computeCosineSimilarity(zero, nonZero);
    expect(sim).toBe(0.0);
  });

  it('should handle single-element vectors', () => {
    const vec1 = [5];
    const vec2 = [5];

    const sim = computeCosineSimilarity(vec1, vec2);
    expect(sim).toBe(1.0);
  });

  it('should throw on mismatched vector lengths', () => {
    const vec1 = [1, 0, 1];
    const vec2 = [1, 0];

    expect(() => computeCosineSimilarity(vec1, vec2)).toThrow();
  });

  it('should handle large values gracefully (normalize without overflow)', () => {
    const vec1 = [1e100, 1e100];
    const vec2 = [1e100, 1e100];

    const sim = computeCosineSimilarity(vec1, vec2);
    expect(Number.isFinite(sim)).toBe(true);
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});

describe('itemCollaborativeFiltering - Item Similarity Matrix', () => {
  it('should compute matrix for multiple articles', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1', 'user2', 'user3'])],
      ['article2', new Set(['user1', 'user2'])],
      ['article3', new Set(['user4'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);

    expect(matrix.articleIds).toHaveLength(3);
    expect(matrix.similarities.size).toBe(3);
    expect(matrix.computationTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should have diagonal = 1.0 (article with itself)', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1', 'user2'])],
      ['article2', new Set(['user1', 'user3'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);

    const article1Sims = matrix.similarities.get('article1');
    const article1Index = matrix.articleIds.indexOf('article1');
    expect(article1Sims?.[article1Index]).toBe(1.0);
  });

  it('should have symmetric similarities', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1', 'user2', 'user3'])],
      ['article2', new Set(['user2', 'user3', 'user4'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);

    const art1Sims = matrix.similarities.get('article1');
    const art2Sims = matrix.similarities.get('article2');

    const art1Index = matrix.articleIds.indexOf('article1');
    const art2Index = matrix.articleIds.indexOf('article2');

    expect(art1Sims?.[art2Index]).toBeCloseTo(art2Sims?.[art1Index] ?? 0, 5);
  });

  it('should handle empty article readers', () => {
    const articleReaders = new Map<string, Set<string>>();

    const matrix = computeItemSimilarityMatrix(articleReaders);

    expect(matrix.articleIds).toHaveLength(0);
    expect(matrix.similarities.size).toBe(0);
  });

  it('should store articles in sorted order', () => {
    const articleReaders = new Map([
      ['article3', new Set(['user1'])],
      ['article1', new Set(['user2'])],
      ['article2', new Set(['user3'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);

    expect(matrix.articleIds).toEqual(['article1', 'article2', 'article3']);
  });

  it('should compute correct matrix dimensions', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1'])],
      ['article2', new Set(['user1', 'user2'])],
      ['article3', new Set(['user2'])],
      ['article4', new Set(['user3'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);

    expect(matrix.articleIds).toHaveLength(4);
    for (const row of matrix.similarities.values()) {
      expect(row).toHaveLength(4);
    }
  });
});

describe('itemCollaborativeFiltering - K-Nearest Articles', () => {
  it('should return top-K similar articles', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1', 'user2', 'user3'])],
      ['article2', new Set(['user1', 'user2'])], // Jaccard = 2/3 ≈ 0.667
      ['article3', new Set(['user2', 'user3'])], // Jaccard = 2/3 ≈ 0.667
      ['article4', new Set(['user3'])], // Jaccard = 1/3 ≈ 0.333
      ['article5', new Set(['user4'])], // Jaccard = 0
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);
    const neighbors = getKNearestArticles('article1', matrix, 2);

    expect(neighbors).toHaveLength(2);
    expect(neighbors[0].similarity).toBeGreaterThanOrEqual(neighbors[1].similarity);
  });

  it('should exclude self from neighbors', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1'])],
      ['article2', new Set(['user1'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);
    const neighbors = getKNearestArticles('article1', matrix, 5);

    expect(neighbors).not.toContainEqual(
      expect.objectContaining({ articleId: 'article1' })
    );
  });

  it('should return fewer than K if not enough articles', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1'])],
      ['article2', new Set(['user1'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);
    const neighbors = getKNearestArticles('article1', matrix, 10);

    expect(neighbors.length).toBeLessThanOrEqual(1); // Only 1 other article
  });

  it('should handle non-existent article gracefully', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);
    const neighbors = getKNearestArticles('nonexistent', matrix, 5);

    expect(neighbors).toHaveLength(0);
  });
});

describe('itemCollaborativeFiltering - Validation', () => {
  it('should validate correct matrix', () => {
    const articleReaders = new Map([
      ['article1', new Set(['user1'])],
      ['article2', new Set(['user1', 'user2'])],
    ]);

    const matrix = computeItemSimilarityMatrix(articleReaders);
    const result = validateItemSimilarityMatrix(matrix);

    expect(result.valid).toBe(true);
  });

  it('should accept empty matrix', () => {
    const matrix = {
      articleIds: [],
      similarities: new Map(),
      lastUpdated: new Date(),
      computationTimeMs: 0,
    };

    const result = validateItemSimilarityMatrix(matrix);
    expect(result.valid).toBe(true);
  });

  it('should detect invalid similarity values (NaN)', () => {
    const matrix = {
      articleIds: ['article1', 'article2'],
      similarities: new Map([
        ['article1', [1.0, NaN]],
        ['article2', [0.5, 1.0]],
      ]),
      lastUpdated: new Date(),
      computationTimeMs: 0,
    };

    const result = validateItemSimilarityMatrix(matrix);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('invalid similarity');
  });

  it('should detect mismatched row lengths', () => {
    const matrix = {
      articleIds: ['article1', 'article2', 'article3'],
      similarities: new Map([
        ['article1', [1.0, 0.5]], // Too short!
        ['article2', [0.5, 1.0, 0.3]],
        ['article3', [0.2, 0.3, 1.0]],
      ]),
      lastUpdated: new Date(),
      computationTimeMs: 0,
    };

    const result = validateItemSimilarityMatrix(matrix);
    expect(result.valid).toBe(false);
  });
});
