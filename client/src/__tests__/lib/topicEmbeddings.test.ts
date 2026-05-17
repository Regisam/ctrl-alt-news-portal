import { describe, it, expect } from 'vitest';
import {
  computeTopicEmbedding,
  cosineSimilarity,
  getTopicEmbeddingCacheKey,
  getAllTopicsEmbeddingsCacheKey,
  getInvalidationKeysForArticleUpdate,
  computeAllTopicEmbeddings,
  getTopicEmbeddingWithCache,
  computeSerendipityFromEmbeddings,
  ArticleEmbedding,
} from '@/lib/topicEmbeddings';

describe('topicEmbeddings', () => {
  describe('computeTopicEmbedding', () => {
    it('should throw error for empty article list', () => {
      expect(() => computeTopicEmbedding([])).toThrow('Cannot compute topic embedding from empty article list');
    });

    it('should compute weighted average of embeddings', () => {
      const articles: ArticleEmbedding[] = [
        { articleId: 'a1', topicId: 't1', embedding: [1, 0, 0], weight: 1.0 },
        { articleId: 'a2', topicId: 't1', embedding: [0, 1, 0], weight: 1.0 },
      ];

      const result = computeTopicEmbedding(articles);

      // Average: (1+0)/2=0.5, (0+1)/2=0.5, (0+0)/2=0
      expect(result).toEqual([0.5, 0.5, 0]);
    });

    it('should respect article weights', () => {
      const articles: ArticleEmbedding[] = [
        { articleId: 'a1', topicId: 't1', embedding: [1, 0], weight: 2.0 }, // Double weight
        { articleId: 'a2', topicId: 't1', embedding: [0, 1], weight: 1.0 },
      ];

      const result = computeTopicEmbedding(articles);

      // Weighted: (2×1 + 1×0)/(2+1) = 2/3, (2×0 + 1×1)/(2+1) = 1/3
      expect(result[0]).toBeCloseTo(2 / 3, 3);
      expect(result[1]).toBeCloseTo(1 / 3, 3);
    });

    it('should default weight to 1.0 if not provided', () => {
      const articles: ArticleEmbedding[] = [
        { articleId: 'a1', topicId: 't1', embedding: [1, 0] }, // No weight
        { articleId: 'a2', topicId: 't1', embedding: [1, 0] }, // No weight
      ];

      const result = computeTopicEmbedding(articles);

      expect(result).toEqual([1, 0]); // All same = average is same
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [1, 0, 0];

      const similarity = cosineSimilarity(v1, v2);

      expect(similarity).toBeCloseTo(1, 3);
    });

    it('should return 0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];

      const similarity = cosineSimilarity(v1, v2);

      expect(similarity).toBeCloseTo(0, 3);
    });

    it('should return -1 for opposite vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [-1, 0, 0];

      const similarity = cosineSimilarity(v1, v2);

      expect(similarity).toBeCloseTo(-1, 3);
    });

    it('should handle normalized vectors correctly', () => {
      const v1 = [0.6, 0.8]; // Length = 1 (normalized)
      const v2 = [0.8, 0.6]; // Length = 1 (normalized)

      const similarity = cosineSimilarity(v1, v2);

      // Dot product: 0.6×0.8 + 0.8×0.6 = 0.96
      expect(similarity).toBeCloseTo(0.96, 3);
    });

    it('should throw error for mismatched dimensions', () => {
      const v1 = [1, 0, 0];
      const v2 = [1, 0];

      expect(() => cosineSimilarity(v1, v2)).toThrow('Embeddings must have same dimension');
    });

    it('should handle zero vectors without crashing', () => {
      const v1 = [0, 0, 0];
      const v2 = [0, 0, 0];

      const similarity = cosineSimilarity(v1, v2);

      expect(similarity).toBe(0);
    });
  });

  describe('caching keys', () => {
    it('should generate consistent cache key for topic embedding', () => {
      const key1 = getTopicEmbeddingCacheKey('topic-ai');
      const key2 = getTopicEmbeddingCacheKey('topic-ai');

      expect(key1).toBe(key2);
      expect(key1).toContain('topic-ai');
    });

    it('should return different keys for different topics', () => {
      const key1 = getTopicEmbeddingCacheKey('topic-ai');
      const key2 = getTopicEmbeddingCacheKey('topic-quantum');

      expect(key1).not.toBe(key2);
    });

    it('should return consistent all topics cache key', () => {
      const key1 = getAllTopicsEmbeddingsCacheKey();
      const key2 = getAllTopicsEmbeddingsCacheKey();

      expect(key1).toBe(key2);
    });

    it('should return invalidation keys for article update', () => {
      const keys = getInvalidationKeysForArticleUpdate('topic-ai');

      expect(keys).toHaveLength(2);
      expect(keys).toContain(getTopicEmbeddingCacheKey('topic-ai'));
      expect(keys).toContain(getAllTopicsEmbeddingsCacheKey());
    });
  });

  describe('computeAllTopicEmbeddings', () => {
    it('should return embeddings for all topics', async () => {
      const result = await computeAllTopicEmbeddings();

      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should include required fields in each embedding', async () => {
      const result = await computeAllTopicEmbeddings();

      for (const embedding of Object.values(result)) {
        expect(embedding).toHaveProperty('topicId');
        expect(embedding).toHaveProperty('embedding');
        expect(embedding).toHaveProperty('articleCount');
        expect(embedding).toHaveProperty('lastUpdated');
        expect(Array.isArray(embedding.embedding)).toBe(true);
      }
    });

    it('should have non-empty embeddings', async () => {
      const result = await computeAllTopicEmbeddings();

      for (const embedding of Object.values(result)) {
        expect(embedding.embedding.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getTopicEmbeddingWithCache', () => {
    it('should return null for non-existent topic', async () => {
      const result = await getTopicEmbeddingWithCache('non-existent-topic', {});

      expect(result).toBeNull();
    });

    it('should return embedding for existing topic', async () => {
      const cache: Record<string, any> = {};
      const result = await getTopicEmbeddingWithCache('topic-ai', cache);

      expect(result).not.toBeNull();
      expect(result?.topicId).toBe('topic-ai');
    });

    it('should cache result after first call', async () => {
      const cache: Record<string, any> = {};

      // First call should compute
      await getTopicEmbeddingWithCache('topic-ai', cache);
      const cacheKey = getTopicEmbeddingCacheKey('topic-ai');

      expect(cache).toHaveProperty(cacheKey);
    });
  });

  describe('computeSerendipityFromEmbeddings', () => {
    it('should return 0 for identical embeddings', () => {
      const embedding = [0.5, 0.5, 0];

      const serendipity = computeSerendipityFromEmbeddings(embedding, embedding);

      expect(serendipity).toBeCloseTo(0, 3);
    });

    it('should return high value for very different embeddings', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0]; // Orthogonal (similarity = 0)

      const serendipity = computeSerendipityFromEmbeddings(v1, v2);

      // (1 - 0) / 2 = 0.5
      expect(serendipity).toBeCloseTo(0.5, 3);
    });

    it('should return 1 for completely opposite embeddings', () => {
      const v1 = [1, 0, 0];
      const v2 = [-1, 0, 0]; // Opposite direction (similarity = -1)

      const serendipity = computeSerendipityFromEmbeddings(v1, v2);

      // (1 - (-1)) / 2 = 1
      expect(serendipity).toBeCloseTo(1, 3);
    });

    it('should return value between 0-1', () => {
      const v1 = [0.8, 0.2, 0.1];
      const v2 = [0.1, 0.8, 0.2];

      const serendipity = computeSerendipityFromEmbeddings(v1, v2);

      expect(serendipity).toBeGreaterThanOrEqual(0);
      expect(serendipity).toBeLessThanOrEqual(1);
    });

    it('should reflect similarity differences', () => {
      const base = [0.8, 0.2, 0.1];
      const similar = [0.75, 0.25, 0.15]; // Very similar
      const different = [0.1, 0.8, 0.2]; // Very different

      const serendipitySimilar = computeSerendipityFromEmbeddings(base, similar);
      const serendipityDifferent = computeSerendipityFromEmbeddings(base, different);

      expect(serendipityDifferent).toBeGreaterThan(serendipitySimilar);
    });
  });
});
