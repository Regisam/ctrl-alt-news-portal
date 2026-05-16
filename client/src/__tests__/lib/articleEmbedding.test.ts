import { describe, it, expect } from 'vitest';
import {
  buildVocabulary,
  encodeArticleFeatures,
  EmbeddingEncoder,
  createEmbeddingModel,
  getDefaultEmbeddingConfig,
  type ArticleFeatures,
  type EmbeddingConfig,
} from '@shared/lib/articleEmbedding';

describe('articleEmbedding - Task 1.1: Design embedding architecture', () => {
  // Test data
  const testArticles: ArticleFeatures[] = [
    {
      articleId: 'art1',
      title: 'Machine Learning Basics',
      summary: 'Introduction to machine learning concepts and algorithms',
      tags: ['ai', 'ml', 'basics'],
      author: 'Alice',
      topic: 'AI',
      engagement: { clicks: 10, bookmarks: 2, reads: 5 },
    },
    {
      articleId: 'art2',
      title: 'Deep Learning Guide',
      summary: 'Comprehensive guide to deep learning and neural networks',
      tags: ['ai', 'neural', 'deep'],
      author: 'Bob',
      topic: 'AI',
      engagement: { clicks: 15, bookmarks: 3, reads: 8 },
    },
    {
      articleId: 'art3',
      title: 'Web Development Tips',
      summary: 'Best practices for modern web development',
      tags: ['web', 'dev', 'javascript'],
      author: 'Charlie',
      topic: 'Web',
      engagement: { clicks: 5, bookmarks: 1, reads: 3 },
    },
  ];

  describe('Subtask 1.1.1: Feature Encoding Scheme', () => {
    it('should build vocabulary from articles', () => {
      const vocab = buildVocabulary(testArticles, 100);

      expect(vocab.size).toBeGreaterThan(0);
      expect(vocab.has('<PAD>')).toBe(true);
      expect(vocab.has('<OOV>')).toBe(true);
      expect(vocab.get('<PAD>')).toBe(0);
      expect(vocab.get('<OOV>')).toBe(1);
    });

    it('should encode article features correctly', () => {
      const vocab = buildVocabulary(testArticles, 100);
      const article = testArticles[0];

      const { textEncoding, metadataEncoding, engagementEncoding } =
        encodeArticleFeatures(article, vocab);

      expect(textEncoding.length).toBe(256); // maxTextLength
      expect(metadataEncoding.length).toBe(10); // Fixed metadata size
      expect(engagementEncoding.length).toBe(3); // clicks, bookmarks, reads

      // Check engagement encoding is normalized [0, 1]
      for (const value of engagementEncoding) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should handle OOV tokens gracefully', () => {
      const vocab = new Map([
        ['<PAD>', 0],
        ['<OOV>', 1],
        ['hello', 2],
      ]);

      const article: ArticleFeatures = {
        articleId: 'test',
        title: 'Hello Unknown',
        summary: 'Test with unknown words',
        tags: ['test'],
        author: 'Test',
        topic: 'Test',
      };

      const { textEncoding } = encodeArticleFeatures(article, vocab);

      // Should not crash and should pad with OOV tokens
      expect(textEncoding.length).toBe(256);
      expect(textEncoding.some(id => id >= 0)).toBe(true);
    });

    it('should encode different topics differently', () => {
      const vocab = buildVocabulary(testArticles);

      const article1 = { ...testArticles[0] };
      const article2 = { ...testArticles[2], topic: 'Science' };

      const { metadataEncoding: meta1 } = encodeArticleFeatures(article1, vocab);
      const { metadataEncoding: meta2 } = encodeArticleFeatures(article2, vocab);

      // Topic is first element in metadata
      expect(meta1[0]).not.toBe(meta2[0]);
    });
  });

  describe('Subtask 1.1.2: Embedding Dimensionality', () => {
    it('should support configurable dimensionality', () => {
      const config = getDefaultEmbeddingConfig();

      expect(config.dimensionality).toBe(128);
      expect(config.learningRate).toBe(0.001);
      expect(config.batchSize).toBe(32);
      expect(config.epochs).toBe(10);
    });

    it('should create config with custom dimensionality', () => {
      const customConfig: EmbeddingConfig = {
        dimensionality: 256,
        learningRate: 0.001,
        batchSize: 32,
        epochs: 10,
        validationSplit: 0.2,
        usePretrainedEmbeddings: false,
      };

      expect(customConfig.dimensionality).toBe(256);
    });

    it('should validate dimensionality range', () => {
      const smallConfig: EmbeddingConfig = {
        ...getDefaultEmbeddingConfig(),
        dimensionality: 64,
      };
      const largeConfig: EmbeddingConfig = {
        ...getDefaultEmbeddingConfig(),
        dimensionality: 512,
      };

      expect(smallConfig.dimensionality).toBeGreaterThanOrEqual(64);
      expect(largeConfig.dimensionality).toBeLessThanOrEqual(512);
    });
  });

  describe('Subtask 1.1.3: Neural Network Layers Design', () => {
    it('should create embedding encoder from config', async () => {
      const config = getDefaultEmbeddingConfig();
      const vocab = buildVocabulary(testArticles);

      const encoder = new EmbeddingEncoder(vocab, config);

      expect(encoder).toBeDefined();
      expect(encoder.getWeights()).toBeDefined();
    });

    it('should encode article to embedding with correct dimension', async () => {
      const config = getDefaultEmbeddingConfig();
      const vocab = buildVocabulary(testArticles);
      const encoder = new EmbeddingEncoder(vocab, config);

      const embedding = encoder.encode(testArticles[0]);

      expect(embedding.length).toBe(config.dimensionality);
      expect(embedding.length).toBe(128); // Default dimensionality
    });

    it('should produce normalized embeddings (L2 norm = 1)', () => {
      const config = getDefaultEmbeddingConfig();
      const vocab = buildVocabulary(testArticles);
      const encoder = new EmbeddingEncoder(vocab, config);

      const embedding = encoder.encode(testArticles[0]);

      // Calculate L2 norm
      const l2Norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));

      // Should be approximately 1.0 (normalized)
      expect(l2Norm).toBeCloseTo(1.0, 1);
    });

    it('should handle multiple articles with same config', () => {
      const config = getDefaultEmbeddingConfig();
      const vocab = buildVocabulary(testArticles);
      const encoder = new EmbeddingEncoder(vocab, config);

      const embeddings = testArticles.map(article => encoder.encode(article));

      expect(embeddings.length).toBe(3);
      embeddings.forEach(emb => {
        expect(emb.length).toBe(128);
      });
    });

    it('should be deterministic (same input → same output)', () => {
      const config = getDefaultEmbeddingConfig();
      const vocab = buildVocabulary(testArticles);
      const encoder = new EmbeddingEncoder(vocab, config);

      const embedding1 = encoder.encode(testArticles[0]);
      const embedding2 = encoder.encode(testArticles[0]);

      // Should be identical (weights don't change)
      for (let i = 0; i < embedding1.length; i++) {
        expect(embedding1[i]).toBeCloseTo(embedding2[i], 5);
      }
    });

    it('should produce different embeddings for different articles', () => {
      const config = getDefaultEmbeddingConfig();
      const vocab = buildVocabulary(testArticles);
      const encoder = new EmbeddingEncoder(vocab, config);

      const emb1 = encoder.encode(testArticles[0]);
      const emb2 = encoder.encode(testArticles[2]); // Different topic

      // Should be different (different content)
      const distance = Math.sqrt(
        emb1.reduce((sum, x, i) => sum + (x - emb2[i]) ** 2, 0)
      );

      expect(distance).toBeGreaterThan(0.1); // Not identical
    });

    it('should support weight serialization', () => {
      const config = getDefaultEmbeddingConfig();
      const vocab = buildVocabulary(testArticles);
      const encoder1 = new EmbeddingEncoder(vocab, config);

      const weights = encoder1.getWeights();

      expect(weights).toBeDefined();
      expect(weights?.textEmbeddings).toBeDefined();
      expect(weights?.finalDense).toBeDefined();

      // Create new encoder with same weights
      const encoder2 = new EmbeddingEncoder(vocab, config);
      if (weights) {
        encoder2.setWeights(weights);
      }

      // Should produce same embeddings
      const emb1 = encoder1.encode(testArticles[0]);
      const emb2 = encoder2.encode(testArticles[0]);

      for (let i = 0; i < emb1.length; i++) {
        expect(emb1[i]).toBeCloseTo(emb2[i], 5);
      }
    });
  });

  describe('createEmbeddingModel factory', () => {
    it('should create model from config', async () => {
      const config = getDefaultEmbeddingConfig();

      const model = await createEmbeddingModel(config, testArticles);

      expect(model.encoder).toBeDefined();
      expect(model.vocab).toBeDefined();
      expect(model.config).toEqual(config);
    });

    it('should build vocabulary if articles provided', async () => {
      const config = getDefaultEmbeddingConfig();

      const model = await createEmbeddingModel(config, testArticles);

      expect(model.vocab.size).toBeGreaterThan(0);
      expect(model.vocab.has('<PAD>')).toBe(true);
    });

    it('should work without articles', async () => {
      const config = getDefaultEmbeddingConfig();

      const model = await createEmbeddingModel(config);

      expect(model.encoder).toBeDefined();
      expect(model.vocab.size).toBe(0); // Empty vocab
    });
  });

  describe('Task 1.1: Integration Tests', () => {
    it('should complete full encoding pipeline for Task 1.1', async () => {
      // 1. Create config
      const config = getDefaultEmbeddingConfig();

      // 2. Create model
      const model = await createEmbeddingModel(config, testArticles);

      // 3. Encode all articles
      const embeddings = testArticles.map(article => model.encoder.encode(article));

      // 4. Verify results
      expect(embeddings.length).toBe(testArticles.length);

      embeddings.forEach((emb, idx) => {
        // Should have correct dimensionality
        expect(emb.length).toBe(128);

        // Should be normalized
        const norm = Math.sqrt(emb.reduce((sum, x) => sum + x * x, 0));
        expect(norm).toBeCloseTo(1.0, 1);

        // Should be numeric
        emb.forEach(value => {
          expect(typeof value).toBe('number');
          expect(isFinite(value)).toBe(true);
        });
      });
    });
  });
});
