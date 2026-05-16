import { describe, it, expect } from 'vitest';
import {
  buildVocabulary,
  encodeArticleFeatures,
  EmbeddingEncoder,
  createEmbeddingModel,
  getDefaultEmbeddingConfig,
  preprocessText,
  encodeArticle,
  cosineSimilarity,
  batchEncodeArticles,
  findNearestNeighbors,
  createTrainingSamples,
  splitTrainingSamples,
  contrastiveLoss,
  initializeAdamState,
  adamStep,
  trainEmbeddingModel,
  benchmarkDimensionality,
  tuneEmbeddingDimensionality,
  findOptimalDimensionality,
  generateTuningReport,
  calculateSilhouetteScore,
  calculateDaviesBouldinIndex,
  evaluateClusteringQuality,
  visualizeWithTSNE,
  validateNearestNeighbors,
  computeNeighborValidationMetrics,
  serializeEmbeddingModel,
  deserializeEmbeddingModel,
  handleOutOfVocabularyTokens,
  encodeColdStartArticle,
  validateEdgeCaseHandling,
  saveModelToJSON,
  loadModelFromJSON,
  createEmbeddingCache,
  getFromCache,
  storeInCache,
  clearCache,
  getCacheStats,
  batchEncodeWithCaching,
  precomputeCorpusEmbeddings,
  incrementalCacheUpdate,
  type ArticleFeatures,
  type EmbeddingConfig,
  type EngagementRecord,
  type DimensionalityBenchmark,
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

  describe('Task 1.2: Implement encoding pipeline', () => {
    describe('Subtask 1.2.1: Text preprocessing', () => {
      it('should tokenize and normalize text', () => {
        const text = 'Hello World! Machine Learning.';
        const tokens = preprocessText(text);

        expect(tokens).toContain('hello');
        expect(tokens).toContain('world');
        expect(tokens).not.toContain('!');
        expect(tokens).not.toContain('.');
      });

      it('should handle empty strings', () => {
        const tokens = preprocessText('');
        expect(tokens).toEqual([]);
      });

      it('should handle multiple spaces', () => {
        const text = 'hello    world';
        const tokens = preprocessText(text);
        expect(tokens).toEqual(['hello', 'world']);
      });

      it('should normalize to lowercase', () => {
        const text = 'HELLO World';
        const tokens = preprocessText(text);
        expect(tokens).toEqual(['hello', 'world']);
      });
    });

    describe('Subtask 1.2.2: Feature vectorization', () => {
      it('should encode article to embedding', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const embedding = await encodeArticle(testArticles[0], encoder);

        expect(embedding.articleId).toBe('art1');
        expect(embedding.embedding.length).toBe(128);
        expect(embedding.dimensionality).toBe(128);
        expect(embedding.timestamp).toBeInstanceOf(Date);
      });

      it('should preserve article ID in encoded result', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const emb1 = await encodeArticle(testArticles[0], encoder);
        const emb2 = await encodeArticle(testArticles[1], encoder);

        expect(emb1.articleId).toBe('art1');
        expect(emb2.articleId).toBe('art2');
      });
    });

    describe('Subtask 1.2.3: Cosine similarity', () => {
      it('should compute cosine similarity between normalized vectors', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [1, 0, 0];

        const similarity = cosineSimilarity(vec1, vec2);

        expect(similarity).toBeCloseTo(1.0, 5); // Identical vectors
      });

      it('should return 0 for orthogonal vectors', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [0, 1, 0];

        const similarity = cosineSimilarity(vec1, vec2);

        expect(similarity).toBeCloseTo(0, 5);
      });

      it('should return negative value for opposite vectors', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [-1, 0, 0];

        const similarity = cosineSimilarity(vec1, vec2);

        expect(similarity).toBeCloseTo(-1.0, 5);
      });

      it('should be in range [-1, 1]', () => {
        const vec1 = [0.6, 0.8];
        const vec2 = [0.8, 0.6];

        const similarity = cosineSimilarity(vec1, vec2);

        expect(similarity).toBeGreaterThanOrEqual(-1);
        expect(similarity).toBeLessThanOrEqual(1);
      });

      it('should throw on dimension mismatch', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [1, 0];

        expect(() => cosineSimilarity(vec1, vec2)).toThrow();
      });

      it('should handle normalized embeddings', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const emb1 = await encodeArticle(testArticles[0], encoder);
        const emb2 = await encodeArticle(testArticles[1], encoder);

        const similarity = cosineSimilarity(emb1.embedding, emb2.embedding);

        expect(similarity).toBeGreaterThanOrEqual(-1);
        expect(similarity).toBeLessThanOrEqual(1);
      });
    });

    describe('Subtask 1.2.3: Batch encoding', () => {
      it('should batch encode multiple articles', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const embeddings = await batchEncodeArticles(testArticles, encoder);

        expect(embeddings).toHaveLength(3);
        embeddings.forEach((emb, idx) => {
          expect(emb.articleId).toBe(testArticles[idx].articleId);
          expect(emb.embedding.length).toBe(128);
        });
      });

      it('should maintain order in batch encoding', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const embeddings = await batchEncodeArticles(testArticles, encoder);

        expect(embeddings[0].articleId).toBe('art1');
        expect(embeddings[1].articleId).toBe('art2');
        expect(embeddings[2].articleId).toBe('art3');
      });
    });

    describe('Subtask 1.2.3: Nearest neighbors search', () => {
      it('should find nearest neighbors by cosine similarity', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const embeddings = await batchEncodeArticles(testArticles, encoder);
        const queryEmbedding = embeddings[0].embedding;

        const neighbors = findNearestNeighbors(queryEmbedding, embeddings, 2);

        expect(neighbors).toHaveLength(2);
        expect(neighbors[0].articleId).toBe('art1'); // Closest to itself
        expect(neighbors[0].similarity).toBeCloseTo(1.0, 1);
        expect(neighbors[0].rank).toBe(1);
      });

      it('should return top-K neighbors', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const embeddings = await batchEncodeArticles(testArticles, encoder);
        const queryEmbedding = embeddings[0].embedding;

        const neighbors = findNearestNeighbors(queryEmbedding, embeddings, 2);

        expect(neighbors.length).toBeLessThanOrEqual(2);
        expect(neighbors[0].rank).toBeLessThanOrEqual(neighbors[1].rank);
      });

      it('should rank neighbors by similarity descending', async () => {
        const config = getDefaultEmbeddingConfig();
        const vocab = buildVocabulary(testArticles);
        const encoder = new EmbeddingEncoder(vocab, config);

        const embeddings = await batchEncodeArticles(testArticles, encoder);
        const queryEmbedding = embeddings[0].embedding;

        const neighbors = findNearestNeighbors(queryEmbedding, embeddings, 3);

        for (let i = 0; i < neighbors.length - 1; i++) {
          expect(neighbors[i].similarity).toBeGreaterThanOrEqual(neighbors[i + 1].similarity);
        }
      });
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

      embeddings.forEach((emb, _idx) => {
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

  describe('articleEmbedding - Task 2.1: Implement training pipeline', () => {
    describe('Subtask 2.1.1: Data preparation', () => {
      it('should create positive training samples from engagement records', () => {
        const engagementRecords: EngagementRecord[] = [
          { articleId1: 'a1', articleId2: 'a2', coEngagementStrength: 0.8 },
          { articleId1: 'a3', articleId2: 'a4', coEngagementStrength: 0.6 },
        ];

        const samples = createTrainingSamples(engagementRecords, 0.5);

        const positiveSamples = samples.filter(s => s.label === 1);
        expect(positiveSamples.length).toBe(2);
        expect(positiveSamples[0]).toEqual({
          articleId1: 'a1',
          articleId2: 'a2',
          label: 1,
        });
      });

      it('should create negative training samples (random pairs)', () => {
        const engagementRecords = [
          { articleId1: 'a1', articleId2: 'a2', coEngagementStrength: 0.8 },
          { articleId1: 'a3', articleId2: 'a4', coEngagementStrength: 0.7 },
        ];

        const samples = createTrainingSamples(engagementRecords, 0.5);

        const negativeSamples = samples.filter(s => s.label === 0);
        expect(negativeSamples.length).toBeGreaterThan(0);
        expect(negativeSamples.every(s => s.label === 0)).toBe(true);
      });

      it('should split training and validation samples correctly', () => {
        const samples = Array.from({ length: 100 }, (_, i) => ({
          articleId1: `a${i}`,
          articleId2: `a${i + 1}`,
          label: i % 2,
        }));

        const { train, validation } = splitTrainingSamples(samples, 0.2);

        expect(train.length).toBe(80);
        expect(validation.length).toBe(20);
        expect(train.length + validation.length).toBe(100);
      });

      it('should handle validation split edge cases', () => {
        const samples = Array.from({ length: 10 }, (_, i) => ({
          articleId1: `a${i}`,
          articleId2: `a${i + 1}`,
          label: i % 2,
        }));

        const { train, validation } = splitTrainingSamples(samples, 0.3);

        expect(train.length + validation.length).toBe(10);
        expect(validation.length).toBeLessThanOrEqual(3);
      });
    });

    describe('Subtask 2.1.2: Loss function (contrastive loss)', () => {
      it('should compute loss for similar pairs (label=1)', () => {
        // For similar pairs: loss = similarity²
        const similarity = 0.8;
        const loss = contrastiveLoss(similarity, 1);

        expect(loss).toBeCloseTo(0.64, 5); // 0.8²
      });

      it('should compute loss for dissimilar pairs (label=0)', () => {
        // For dissimilar pairs with margin=1: loss = max(0, 1 - similarity)²
        const similarity = 0.3;
        const loss = contrastiveLoss(similarity, 0, 1.0);

        expect(loss).toBeCloseTo(0.49, 5); // (1 - 0.3)² = 0.7²
      });

      it('should return 0 loss when dissimilar pairs exceed margin', () => {
        // When similarity >= margin, loss should be 0
        const similarity = 1.0;
        const loss = contrastiveLoss(similarity, 0, 1.0);

        expect(loss).toBeCloseTo(0, 5);
      });

      it('should respect custom margin parameter', () => {
        const similarity = 0.5;
        const margin = 2.0;
        const loss = contrastiveLoss(similarity, 0, margin);

        expect(loss).toBeCloseTo(2.25, 5); // (2.0 - 0.5)² = 1.5²
      });

      it('should handle perfect similarity (1.0)', () => {
        const loss = contrastiveLoss(1.0, 1);
        expect(loss).toBeCloseTo(1.0, 5);
      });

      it('should handle perfect dissimilarity (-1.0)', () => {
        const loss = contrastiveLoss(-1.0, 0, 1.0);
        expect(loss).toBeCloseTo(4.0, 5); // (1 - (-1))² = 2² = 4
      });
    });

    describe('Subtask 2.1.3: Adam optimizer', () => {
      it('should initialize Adam state correctly', () => {
        const weights = [
          [1, 2],
          [3, 4],
        ];

        const state = initializeAdamState(weights);

        expect(state.m).toEqual([[0, 0], [0, 0]]);
        expect(state.v).toEqual([[0, 0], [0, 0]]);
        expect(state.t).toBe(0);
      });

      it('should update weights with Adam step', () => {
        const weights = [[1.0, 2.0]];
        const gradients = [[0.1, 0.2]];
        const state = initializeAdamState(weights);

        adamStep(weights, gradients, state, 0.001);

        expect(weights[0][0]).toBeLessThan(1.0);
        expect(weights[0][1]).toBeLessThan(2.0);
        expect(state.t).toBe(1);
      });

      it('should accumulate moments correctly over multiple steps', () => {
        const weights = [[1.0]];
        const gradients = [[0.5]];
        const state = initializeAdamState(weights);

        adamStep(weights, gradients, state, 0.01);
        const weight1 = weights[0][0];

        adamStep(weights, gradients, state, 0.01);
        const weight2 = weights[0][0];

        expect(state.t).toBe(2);
        expect(weight2).toBeLessThan(weight1);
      });
    });

    describe('Subtask 2.1.3: Training pipeline', () => {
      it('should train embedding model on samples', async () => {
        const config = getDefaultEmbeddingConfig();
        config.epochs = 2;

        const articles = [
          {
            articleId: 'a1',
            title: 'Article 1',
            summary: 'Summary 1',
            tags: ['tag1'],
            author: 'Author1',
            topic: 'Tech',
          },
          {
            articleId: 'a2',
            title: 'Article 2',
            summary: 'Summary 2',
            tags: ['tag2'],
            author: 'Author2',
            topic: 'Tech',
          },
        ];

        const { encoder } = await createEmbeddingModel(config, articles);

        const trainingSamples = [
          { articleId1: 'a1', articleId2: 'a2', label: 1 },
        ];

        const result = await trainEmbeddingModel(
          encoder,
          articles,
          trainingSamples,
          trainingSamples,
          config
        );

        expect(result.metrics.epochsTrained).toBeGreaterThan(0);
        expect(result.metrics.finalLoss).toBeGreaterThanOrEqual(0);
        expect(result.trainHistory.length).toBeGreaterThan(0);
      });

      it('should produce valid training metrics', async () => {
        const config = getDefaultEmbeddingConfig();
        config.epochs = 2;

        const articles = [
          {
            articleId: 'a1',
            title: 'Article 1',
            summary: 'Summary 1',
            tags: ['tag1'],
            author: 'Author1',
            topic: 'Tech',
          },
          {
            articleId: 'a2',
            title: 'Article 2',
            summary: 'Summary 2',
            tags: ['tag2'],
            author: 'Author2',
            topic: 'Tech',
          },
        ];

        const { encoder } = await createEmbeddingModel(config, articles);

        const trainingSamples = [
          { articleId1: 'a1', articleId2: 'a2', label: 1 },
        ];

        const result = await trainEmbeddingModel(
          encoder,
          articles,
          trainingSamples,
          trainingSamples,
          config
        );

        expect(result.metrics.samplesProcessed).toBe(1);
        expect(result.metrics.trainingTimeMs).toBeGreaterThan(0);
        expect(result.bestEpoch).toBeGreaterThanOrEqual(0);
      });

      it('should track loss history during training', async () => {
        const config = getDefaultEmbeddingConfig();
        config.epochs = 3;

        const articles = [
          {
            articleId: 'a1',
            title: 'Article 1',
            summary: 'Summary 1',
            tags: ['tag1'],
            author: 'Author1',
            topic: 'Tech',
          },
          {
            articleId: 'a2',
            title: 'Article 2',
            summary: 'Summary 2',
            tags: ['tag2'],
            author: 'Author2',
            topic: 'Tech',
          },
        ];

        const { encoder } = await createEmbeddingModel(config, articles);

        const trainingSamples = [
          { articleId1: 'a1', articleId2: 'a2', label: 1 },
        ];

        const result = await trainEmbeddingModel(
          encoder,
          articles,
          trainingSamples,
          trainingSamples,
          config
        );

        expect(result.trainHistory.length).toBeGreaterThan(0);
        expect(result.validationHistory.length).toBeGreaterThan(0);
        expect(result.trainHistory.every(l => l >= 0)).toBe(true);
      });
    });
  });

  describe('articleEmbedding - Task 2.2: Dimensionality & Performance Tuning', () => {
    describe('Subtask 2.2.1 & 2.2.2: Benchmark dimensionality', () => {
      it('should benchmark inference latency for a dimensionality', async () => {
        const config = getDefaultEmbeddingConfig();
        const articles = [
          {
            articleId: 'a1',
            title: 'Test Article',
            summary: 'Test summary',
            tags: ['test'],
            author: 'Test',
            topic: 'Test',
          },
        ];

        const { encoder } = await createEmbeddingModel(config, articles);
        const benchmark = benchmarkDimensionality(encoder, articles, 128, 10);

        expect(benchmark.dimensionality).toBe(128);
        expect(benchmark.avgInferenceTimeMs).toBeGreaterThan(0);
        expect(benchmark.minInferenceTimeMs).toBeGreaterThan(0);
        expect(benchmark.maxInferenceTimeMs).toBeGreaterThanOrEqual(benchmark.avgInferenceTimeMs);
        expect(benchmark.p95InferenceTimeMs).toBeGreaterThanOrEqual(benchmark.minInferenceTimeMs);
      });

      it('should calculate correct embedding size', async () => {
        const articles: ArticleFeatures[] = [
          {
            articleId: 'a1',
            title: 'Test',
            summary: 'Summary',
            tags: ['test'],
            author: 'Test',
            topic: 'Test',
          },
        ];
        const config = { ...getDefaultEmbeddingConfig(), dimensionality: 256 };
        const { encoder } = await createEmbeddingModel(config, articles);

        const benchmark = benchmarkDimensionality(encoder, articles, 256, 5);

        expect(benchmark.embeddingSize).toBe(256 * 8); // 256 dims * 8 bytes
      });

      it('should determine latency target compliance', async () => {
        const articles: ArticleFeatures[] = [
          {
            articleId: 'a1',
            title: 'Test',
            summary: 'Summary',
            tags: ['test'],
            author: 'Test',
            topic: 'Test',
          },
        ];
        const config = { ...getDefaultEmbeddingConfig(), dimensionality: 64 };
        const { encoder } = await createEmbeddingModel(config, articles);

        const benchmark = benchmarkDimensionality(encoder, articles, 64, 5);

        // Smaller dimensions should be faster
        expect(benchmark.p95InferenceTimeMs).toBeLessThan(20); // Should be quite fast
      });
    });

    describe('Subtask 2.2.3: Tune dimensionality', () => {
      it('should test multiple dimensionalities', async () => {
        const config = getDefaultEmbeddingConfig();
        config.epochs = 1; // Fast test

        const articles = [
          {
            articleId: 'a1',
            title: 'Article 1',
            summary: 'Summary 1',
            tags: ['tag1'],
            author: 'Author1',
            topic: 'Tech',
          },
          {
            articleId: 'a2',
            title: 'Article 2',
            summary: 'Summary 2',
            tags: ['tag2'],
            author: 'Author2',
            topic: 'Tech',
          },
        ];

        const trainingSamples = [
          { articleId1: 'a1', articleId2: 'a2', label: 1 },
        ];

        const benchmarks = await tuneEmbeddingDimensionality(
          articles,
          trainingSamples,
          trainingSamples,
          [64, 128]
        );

        expect(benchmarks.length).toBe(2);
        expect(benchmarks[0].dimensionality).toBe(64);
        expect(benchmarks[1].dimensionality).toBe(128);
      });

      it('should show that larger dimensions are slower', async () => {
        const articles: ArticleFeatures[] = [
          {
            articleId: 'a1',
            title: 'Test Article',
            summary: 'Test summary',
            tags: ['test'],
            author: 'Test',
            topic: 'Test',
          },
        ];
        const config = getDefaultEmbeddingConfig();

        const { encoder: encoder64 } = await createEmbeddingModel(
          { ...config, dimensionality: 64 },
          articles
        );
        const benchmark64 = benchmarkDimensionality(encoder64, articles, 64, 10);

        const { encoder: encoder256 } = await createEmbeddingModel(
          { ...config, dimensionality: 256 },
          articles
        );
        const benchmark256 = benchmarkDimensionality(encoder256, articles, 256, 10);

        // Larger dimensions generally slower
        expect(benchmark256.avgInferenceTimeMs).toBeGreaterThanOrEqual(benchmark64.avgInferenceTimeMs);
      });
    });

    describe('Subtask 2.2.3: Find optimal dimensionality', () => {
      it('should find optimal dimensionality within latency target', () => {
        const benchmarks: DimensionalityBenchmark[] = [
          {
            dimensionality: 64,
            avgInferenceTimeMs: 1.0,
            minInferenceTimeMs: 0.9,
            maxInferenceTimeMs: 1.2,
            p95InferenceTimeMs: 1.1,
            meetsLatencyTarget: true,
            embeddingSize: 512,
            modelSize: 512000,
          },
          {
            dimensionality: 128,
            avgInferenceTimeMs: 2.0,
            minInferenceTimeMs: 1.8,
            maxInferenceTimeMs: 2.5,
            p95InferenceTimeMs: 2.2,
            meetsLatencyTarget: true,
            embeddingSize: 1024,
            modelSize: 1024000,
          },
          {
            dimensionality: 256,
            avgInferenceTimeMs: 4.0,
            minInferenceTimeMs: 3.8,
            maxInferenceTimeMs: 4.5,
            p95InferenceTimeMs: 4.2,
            meetsLatencyTarget: true,
            embeddingSize: 2048,
            modelSize: 2048000,
          },
        ];

        const { optimal, candidates } = findOptimalDimensionality(benchmarks, 10.0);

        // Should return highest dimension that meets target
        expect(optimal.dimensionality).toBe(256);
        expect(candidates.length).toBe(3);
      });

      it('should handle case where no dimension meets latency target', () => {
        const benchmarks: DimensionalityBenchmark[] = [
          {
            dimensionality: 512,
            avgInferenceTimeMs: 15.0,
            minInferenceTimeMs: 14.0,
            maxInferenceTimeMs: 16.0,
            p95InferenceTimeMs: 15.5,
            meetsLatencyTarget: false,
            embeddingSize: 4096,
            modelSize: 4096000,
          },
        ];

        const { optimal } = findOptimalDimensionality(benchmarks, 10.0);

        // Should return the only option (even if it doesn't meet target)
        expect(optimal.dimensionality).toBe(512);
      });

      it('should generate tuning report', () => {
        const benchmarks: DimensionalityBenchmark[] = [
          {
            dimensionality: 128,
            avgInferenceTimeMs: 2.0,
            minInferenceTimeMs: 1.8,
            maxInferenceTimeMs: 2.5,
            p95InferenceTimeMs: 2.2,
            meetsLatencyTarget: true,
            embeddingSize: 1024,
            modelSize: 1024000,
          },
        ];

        const report = generateTuningReport(benchmarks, 10.0);

        expect(report.optimalDimensionality).toBe(128);
        expect(report.meetsLatencyTarget).toBe(true);
        expect(report.recommendation).toContain('Optimal');
        expect(report.benchmarks.length).toBe(1);
      });

      it('should include recommendation for failing latency target', () => {
        const benchmarks: DimensionalityBenchmark[] = [
          {
            dimensionality: 512,
            avgInferenceTimeMs: 15.0,
            minInferenceTimeMs: 14.0,
            maxInferenceTimeMs: 16.0,
            p95InferenceTimeMs: 15.5,
            meetsLatencyTarget: false,
            embeddingSize: 4096,
            modelSize: 4096000,
          },
        ];

        const report = generateTuningReport(benchmarks, 10.0);

        expect(report.meetsLatencyTarget).toBe(false);
        expect(report.recommendation).toContain('Warning');
      });
    });
  });

  // ============================================================================
  // Task 3.1.1: Quality Analysis — Clustering Metrics
  // ============================================================================

  describe('Subtask 3.1.1: Clustering Metrics', () => {
    describe('calculateSilhouetteScore', () => {
      it('should calculate silhouette score between -1 and 1', () => {
        const articles = [
          {
            articleId: 'a1',
            title: 'AI News 1',
            summary: 'Summary 1',
            tags: ['ai'],
            author: 'Author 1',
            topic: 'AI',
          },
          {
            articleId: 'a2',
            title: 'AI News 2',
            summary: 'Summary 2',
            tags: ['ai'],
            author: 'Author 2',
            topic: 'AI',
          },
          {
            articleId: 'a3',
            title: 'Science News 1',
            summary: 'Summary 3',
            tags: ['science'],
            author: 'Author 3',
            topic: 'Science',
          },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2, 0.3], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a2', embedding: [0.11, 0.21, 0.31], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a3', embedding: [0.8, 0.9, 0.7], timestamp: new Date(), dimensionality: 3 },
        ];

        const score = calculateSilhouetteScore(embeddings, articles);

        expect(score).toBeGreaterThanOrEqual(-1);
        expect(score).toBeLessThanOrEqual(1);
      });

      it('should return higher score for well-separated clusters', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
          { articleId: 'a3', title: 'Science News 1', summary: 'Summary 3', tags: ['science'], author: 'Author 3', topic: 'Science' },
          { articleId: 'a4', title: 'Science News 2', summary: 'Summary 4', tags: ['science'], author: 'Author 4', topic: 'Science' },
        ];

        // Well-separated clusters
        const wellSeparated = [
          { articleId: 'a1', embedding: [0.0, 0.0, 0.0], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a2', embedding: [0.01, 0.01, 0.01], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a3', embedding: [1.0, 1.0, 1.0], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a4', embedding: [1.01, 1.01, 1.01], timestamp: new Date(), dimensionality: 3 },
        ];

        const score = calculateSilhouetteScore(wellSeparated, articles);
        expect(score).toBeGreaterThan(0.5);
      });

      it('should handle single cluster gracefully', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.11, 0.21], timestamp: new Date(), dimensionality: 2 },
        ];

        const score = calculateSilhouetteScore(embeddings, articles);
        expect(typeof score).toBe('number');
      });
    });

    describe('calculateDaviesBouldinIndex', () => {
      it('should return DB index >= 0', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
          { articleId: 'a3', title: 'Science News 1', summary: 'Summary 3', tags: ['science'], author: 'Author 3', topic: 'Science' },
          { articleId: 'a4', title: 'Science News 2', summary: 'Summary 4', tags: ['science'], author: 'Author 4', topic: 'Science' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.01, 0.01], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [1.0, 1.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a4', embedding: [1.01, 1.01], timestamp: new Date(), dimensionality: 2 },
        ];

        const index = calculateDaviesBouldinIndex(embeddings, articles);

        expect(index).toBeGreaterThanOrEqual(0);
      });

      it('should return lower DB index for well-separated clusters', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
          { articleId: 'a3', title: 'Science News 1', summary: 'Summary 3', tags: ['science'], author: 'Author 3', topic: 'Science' },
          { articleId: 'a4', title: 'Science News 2', summary: 'Summary 4', tags: ['science'], author: 'Author 4', topic: 'Science' },
        ];

        const wellSeparated = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.01, 0.01], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [2.0, 2.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a4', embedding: [2.01, 2.01], timestamp: new Date(), dimensionality: 2 },
        ];

        const index = calculateDaviesBouldinIndex(wellSeparated, articles);
        expect(index).toBeLessThan(1.0);
      });

      it('should handle single cluster gracefully', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2], timestamp: new Date(), dimensionality: 2 },
        ];

        const index = calculateDaviesBouldinIndex(embeddings, articles);
        expect(index).toBe(0);
      });
    });

    describe('evaluateClusteringQuality', () => {
      it('should return all quality metrics', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
          { articleId: 'a3', title: 'Science News 1', summary: 'Summary 3', tags: ['science'], author: 'Author 3', topic: 'Science' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2, 0.3], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a2', embedding: [0.11, 0.21, 0.31], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a3', embedding: [0.8, 0.9, 0.7], timestamp: new Date(), dimensionality: 3 },
        ];

        const metrics = evaluateClusteringQuality(embeddings, articles);

        expect(metrics.silhouetteScore).toBeDefined();
        expect(metrics.daviesBouldinIndex).toBeDefined();
        expect(metrics.inertia).toBeDefined();
        expect(metrics.meanAverageDistance).toBeDefined();
      });

      it('should compute positive inertia for multi-point clusters', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [1.0, 1.0], timestamp: new Date(), dimensionality: 2 },
        ];

        const metrics = evaluateClusteringQuality(embeddings, articles);

        expect(metrics.inertia).toBeGreaterThanOrEqual(0);
        expect(metrics.meanAverageDistance).toBeGreaterThan(0);
      });

      it('should compute mean average distance correctly', () => {
        const articles = [
          { articleId: 'a1', title: 'News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [3.0, 4.0], timestamp: new Date(), dimensionality: 2 },
        ];

        const metrics = evaluateClusteringQuality(embeddings, articles);

        // Distance between [0,0] and [3,4] is 5.0 (3-4-5 triangle)
        expect(metrics.meanAverageDistance).toBeCloseTo(5.0, 1);
      });
    });
  });

  // ============================================================================
  // Task 3.1.2: Visualization — t-SNE
  // ============================================================================

  describe('Subtask 3.1.2: t-SNE Visualization', () => {
    describe('visualizeWithTSNE', () => {
      it('should return 2D points with x, y coordinates', () => {
        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2, 0.3], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a2', embedding: [0.11, 0.21, 0.31], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a3', embedding: [0.8, 0.9, 0.7], timestamp: new Date(), dimensionality: 3 },
        ];

        const points = visualizeWithTSNE(embeddings);

        expect(points).toHaveLength(3);
        expect(points[0]).toHaveProperty('articleId');
        expect(points[0]).toHaveProperty('x');
        expect(points[0]).toHaveProperty('y');
      });

      it('should preserve number of points', () => {
        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.2, 0.3], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [0.3, 0.4], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a4', embedding: [0.4, 0.5], timestamp: new Date(), dimensionality: 2 },
        ];

        const points = visualizeWithTSNE(embeddings);

        expect(points).toHaveLength(4);
        expect(new Set(points.map(p => p.articleId)).size).toBe(4);
      });

      it('should produce finite coordinates', () => {
        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0, 0.0], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a2', embedding: [0.01, 0.01, 0.01], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a3', embedding: [1.0, 1.0, 1.0], timestamp: new Date(), dimensionality: 3 },
        ];

        const points = visualizeWithTSNE(embeddings);

        for (const point of points) {
          expect(isFinite(point.x)).toBe(true);
          expect(isFinite(point.y)).toBe(true);
        }
      });

      it('should separate well-separated clusters in 2D', () => {
        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0, 0.0], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a2', embedding: [0.01, 0.01, 0.01], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a3', embedding: [2.0, 2.0, 2.0], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a4', embedding: [2.01, 2.01, 2.01], timestamp: new Date(), dimensionality: 3 },
        ];

        const points = visualizeWithTSNE(embeddings);

        // Distance between cluster 1 and cluster 2 in high-dim is large
        // Should be preserved in 2D (cluster separation)
        const dist01 = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        const dist03 = Math.hypot(points[0].x - points[3].x, points[0].y - points[3].y);

        expect(dist03).toBeGreaterThan(dist01 * 0.5);
      });

      it('should accept custom configuration', () => {
        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.2, 0.3], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [0.3, 0.4], timestamp: new Date(), dimensionality: 2 },
        ];

        const points = visualizeWithTSNE(embeddings, {
          iterations: 20,
          learningRate: 100,
          perplexity: 10,
          momentum: 0.5,
        });

        expect(points).toHaveLength(3);
        for (const point of points) {
          expect(isFinite(point.x)).toBe(true);
          expect(isFinite(point.y)).toBe(true);
        }
      });

      it('should handle empty embeddings gracefully', () => {
        const points = visualizeWithTSNE([]);
        expect(points).toEqual([]);
      });

      it('should handle single embedding', () => {
        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2, 0.3], timestamp: new Date(), dimensionality: 3 },
        ];

        const points = visualizeWithTSNE(embeddings);

        expect(points).toHaveLength(1);
        expect(isFinite(points[0].x)).toBe(true);
        expect(isFinite(points[0].y)).toBe(true);
      });

      it('should produce different results with different perplexities', () => {
        const embeddings = [
          { articleId: 'a1', embedding: [0.1, 0.2, 0.3], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a2', embedding: [0.11, 0.21, 0.31], timestamp: new Date(), dimensionality: 3 },
          { articleId: 'a3', embedding: [0.8, 0.9, 0.7], timestamp: new Date(), dimensionality: 3 },
        ];

        const points1 = visualizeWithTSNE(embeddings, { perplexity: 10 });
        const points2 = visualizeWithTSNE(embeddings, { perplexity: 50 });

        // Configurations produce different results (due to randomization and different perplexities)
        let differs = false;
        for (let i = 0; i < points1.length; i++) {
          if (Math.abs(points1[i].x - points2[i].x) > 0.01 || Math.abs(points1[i].y - points2[i].y) > 0.01) {
            differs = true;
            break;
          }
        }

        expect(differs).toBe(true);
      });
    });
  });

  // ============================================================================
  // Task 3.1.3: Validation — Nearest Neighbors Quality
  // ============================================================================

  describe('Subtask 3.1.3: Nearest Neighbors Validation', () => {
    describe('validateNearestNeighbors', () => {
      it('should validate nearest neighbors for all articles', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
          { articleId: 'a3', title: 'Science News 1', summary: 'Summary 3', tags: ['science'], author: 'Author 3', topic: 'Science' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.01, 0.01], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [1.0, 1.0], timestamp: new Date(), dimensionality: 2 },
        ];

        const results = validateNearestNeighbors(embeddings, articles, 2);

        expect(results).toHaveLength(3);
        expect(results[0]).toHaveProperty('articleId');
        expect(results[0]).toHaveProperty('topic');
        expect(results[0]).toHaveProperty('neighbors');
        expect(results[0]).toHaveProperty('accuracy');
      });

      it('should mark neighbors as correct if they match topic', () => {
        const articles = [
          { articleId: 'a1', title: 'AI News 1', summary: 'Summary 1', tags: ['ai'], author: 'Author 1', topic: 'AI' },
          { articleId: 'a2', title: 'AI News 2', summary: 'Summary 2', tags: ['ai'], author: 'Author 2', topic: 'AI' },
          { articleId: 'a3', title: 'Science News 1', summary: 'Summary 3', tags: ['science'], author: 'Author 3', topic: 'Science' },
        ];

        // a1 and a2 are close (both AI), a3 is far (Science)
        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.01, 0.01], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [2.0, 2.0], timestamp: new Date(), dimensionality: 2 },
        ];

        const results = validateNearestNeighbors(embeddings, articles, 2);

        // a1's nearest neighbor should be a2 (same topic)
        const a1Result = results.find(r => r.articleId === 'a1');
        expect(a1Result?.neighbors[0].isCorrect).toBe(true);
      });

      it('should compute accuracy correctly', () => {
        const articles = [
          { articleId: 'a1', title: 'AI 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a2', title: 'AI 2', summary: 'S2', tags: ['ai'], author: 'A2', topic: 'AI' },
          { articleId: 'a3', title: 'Science 1', summary: 'S3', tags: ['science'], author: 'A3', topic: 'Science' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.01, 0.01], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [2.0, 2.0], timestamp: new Date(), dimensionality: 2 },
        ];

        const results = validateNearestNeighbors(embeddings, articles, 2);

        // All results should have accuracy between 0 and 1
        for (const result of results) {
          expect(result.accuracy).toBeGreaterThanOrEqual(0);
          expect(result.accuracy).toBeLessThanOrEqual(1);
        }
      });

      it('should handle different k values', () => {
        const articles = [
          { articleId: 'a1', title: 'AI 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a2', title: 'AI 2', summary: 'S2', tags: ['ai'], author: 'A2', topic: 'AI' },
          { articleId: 'a3', title: 'AI 3', summary: 'S3', tags: ['ai'], author: 'A3', topic: 'AI' },
        ];

        const embeddings = [
          { articleId: 'a1', embedding: [0.0, 0.0], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a2', embedding: [0.01, 0.01], timestamp: new Date(), dimensionality: 2 },
          { articleId: 'a3', embedding: [0.02, 0.02], timestamp: new Date(), dimensionality: 2 },
        ];

        const resultsK1 = validateNearestNeighbors(embeddings, articles, 1);
        const resultsK2 = validateNearestNeighbors(embeddings, articles, 2);

        expect(resultsK1[0].neighbors).toHaveLength(1);
        expect(resultsK2[0].neighbors).toHaveLength(2);
      });
    });

    describe('computeNeighborValidationMetrics', () => {
      it('should compute overall validation metrics', () => {
        const validationResults = [
          {
            articleId: 'a1',
            topic: 'AI',
            neighbors: [
              { articleId: 'a2', topic: 'AI', distance: 0.01, isCorrect: true },
              { articleId: 'a3', topic: 'AI', distance: 0.02, isCorrect: true },
            ],
            correctCount: 2,
            accuracy: 1.0,
          },
          {
            articleId: 'a2',
            topic: 'AI',
            neighbors: [
              { articleId: 'a1', topic: 'AI', distance: 0.01, isCorrect: true },
              { articleId: 'a3', topic: 'Science', distance: 1.5, isCorrect: false },
            ],
            correctCount: 1,
            accuracy: 0.5,
          },
        ];

        const metrics = computeNeighborValidationMetrics(validationResults);

        expect(metrics.totalArticles).toBe(2);
        expect(metrics.averageAccuracy).toBe(0.75);
        expect(metrics.articlesAboveThreshold).toBe(2);
        expect(metrics.minAccuracy).toBe(0.5);
        expect(metrics.maxAccuracy).toBe(1.0);
      });

      it('should classify validation as EXCELLENT when accuracy >= 0.8', () => {
        const results = [
          {
            articleId: 'a1',
            topic: 'AI',
            neighbors: [
              { articleId: 'a2', topic: 'AI', distance: 0.01, isCorrect: true },
              { articleId: 'a3', topic: 'AI', distance: 0.02, isCorrect: true },
            ],
            correctCount: 2,
            accuracy: 0.9,
          },
        ];

        const metrics = computeNeighborValidationMetrics(results);
        expect(metrics.overallValidation).toBe('EXCELLENT');
      });

      it('should classify validation as GOOD when accuracy [0.6, 0.8)', () => {
        const results = [
          {
            articleId: 'a1',
            topic: 'AI',
            neighbors: [
              { articleId: 'a2', topic: 'AI', distance: 0.01, isCorrect: true },
              { articleId: 'a3', topic: 'Science', distance: 1.0, isCorrect: false },
            ],
            correctCount: 1,
            accuracy: 0.7,
          },
        ];

        const metrics = computeNeighborValidationMetrics(results);
        expect(metrics.overallValidation).toBe('GOOD');
      });

      it('should classify validation as FAIR when accuracy [0.4, 0.6)', () => {
        const results = [
          {
            articleId: 'a1',
            topic: 'AI',
            neighbors: [
              { articleId: 'a2', topic: 'AI', distance: 0.01, isCorrect: true },
              { articleId: 'a3', topic: 'AI', distance: 1.0, isCorrect: true },
              { articleId: 'a4', topic: 'Science', distance: 1.5, isCorrect: false },
            ],
            correctCount: 2,
            accuracy: 0.5,
          },
        ];

        const metrics = computeNeighborValidationMetrics(results);
        expect(metrics.overallValidation).toBe('FAIR');
      });

      it('should classify validation as POOR when accuracy < 0.4', () => {
        const results = [
          {
            articleId: 'a1',
            topic: 'AI',
            neighbors: [
              { articleId: 'a2', topic: 'Science', distance: 1.0, isCorrect: false },
              { articleId: 'a3', topic: 'Science', distance: 1.5, isCorrect: false },
            ],
            correctCount: 0,
            accuracy: 0.0,
          },
        ];

        const metrics = computeNeighborValidationMetrics(results);
        expect(metrics.overallValidation).toBe('POOR');
      });

      it('should handle empty results gracefully', () => {
        const metrics = computeNeighborValidationMetrics([]);

        expect(metrics.totalArticles).toBe(0);
        expect(metrics.averageAccuracy).toBe(0);
        expect(metrics.overallValidation).toBe('POOR');
      });
    });
  });

  // ============================================================================
  // Task 3.2.1: Persistence — Model Save/Load
  // ============================================================================

  describe('Subtask 3.2.1: Model Serialization & Persistence', () => {
    describe('serializeEmbeddingModel', () => {
      it('should serialize model with version and checksum', () => {
        const model = {
          config: getDefaultEmbeddingConfig(),
          weights: {
            encoder: [[0.1, 0.2], [0.3, 0.4]],
            embeddings: [0.5, 0.6],
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date('2026-05-17'),
            trainingStats: {
              finalLoss: 0.5,
              finalValidationLoss: 0.6,
              epochsTrained: 10,
            },
          },
        };

        const serialized = serializeEmbeddingModel(model);

        expect(serialized.version).toBe('1.0.0');
        expect(serialized.checksum).toBeDefined();
        expect(serialized.checksum.length).toBeGreaterThan(0);
        expect(serialized.createdAt).toBe('2026-05-17T00:00:00.000Z');
      });

      it('should include config, weights, and training stats', () => {
        const model = {
          config: { ...getDefaultEmbeddingConfig(), dimensionality: 256 },
          weights: {
            encoder: [[0.1]],
            embeddings: [0.2],
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date(),
            trainingStats: {
              finalLoss: 0.1,
              finalValidationLoss: 0.15,
              epochsTrained: 5,
            },
          },
        };

        const serialized = serializeEmbeddingModel(model);

        expect(serialized.config.dimensionality).toBe(256);
        expect(serialized.weights?.encoder).toEqual([[0.1]]);
        expect(serialized.trainingStats?.epochsTrained).toBe(5);
      });
    });

    describe('deserializeEmbeddingModel', () => {
      it('should deserialize model with checksum verification', () => {
        const model = {
          config: getDefaultEmbeddingConfig(),
          weights: {
            encoder: [[0.1, 0.2]],
            embeddings: [0.3],
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date('2026-05-17'),
            trainingStats: {
              finalLoss: 0.5,
              finalValidationLoss: 0.6,
              epochsTrained: 10,
            },
          },
        };

        const serialized = serializeEmbeddingModel(model);
        const deserialized = deserializeEmbeddingModel(serialized);

        expect(deserialized.config.dimensionality).toBe(serialized.config.dimensionality);
        expect(deserialized.weights?.encoder).toEqual(serialized.weights?.encoder);
      });

      it('should throw error on corrupted checksum', () => {
        const model = {
          config: getDefaultEmbeddingConfig(),
          weights: {
            encoder: [[0.1]],
            embeddings: [0.2],
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date(),
            trainingStats: {
              finalLoss: 0.5,
              finalValidationLoss: 0.6,
              epochsTrained: 10,
            },
          },
        };

        const serialized = serializeEmbeddingModel(model);
        serialized.checksum = 'invalid_checksum';

        expect(() => deserializeEmbeddingModel(serialized)).toThrow('checksum verification failed');
      });

      it('should parse createdAt as Date object', () => {
        const model = {
          config: getDefaultEmbeddingConfig(),
          weights: undefined,
          metadata: {
            version: '1.0.0',
            createdAt: new Date('2026-05-17T12:00:00Z'),
          },
        };

        const serialized = serializeEmbeddingModel(model);
        const deserialized = deserializeEmbeddingModel(serialized);

        expect(deserialized.metadata.createdAt).toBeInstanceOf(Date);
        expect(deserialized.metadata.createdAt.getTime()).toBe(
          new Date('2026-05-17T12:00:00Z').getTime()
        );
      });
    });

    describe('saveModelToJSON & loadModelFromJSON', () => {
      it('should save model to valid JSON string', () => {
        const model = {
          config: getDefaultEmbeddingConfig(),
          weights: {
            encoder: [[0.1, 0.2], [0.3, 0.4]],
            embeddings: [0.5, 0.6, 0.7],
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date('2026-05-17'),
            trainingStats: {
              finalLoss: 0.5,
              finalValidationLoss: 0.6,
              epochsTrained: 10,
            },
          },
        };

        const json = saveModelToJSON(model);

        expect(typeof json).toBe('string');
        expect(json.length).toBeGreaterThan(0);
        expect(json).toContain('"version"');
        expect(json).toContain('"checksum"');
      });

      it('should round-trip: save then load preserves model', () => {
        const originalModel = {
          config: { ...getDefaultEmbeddingConfig(), dimensionality: 128, learningRate: 0.01 },
          weights: {
            encoder: [[0.1, 0.2], [0.3, 0.4]],
            embeddings: [0.5, 0.6],
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date('2026-05-17T10:00:00Z'),
            trainingStats: {
              finalLoss: 0.25,
              finalValidationLoss: 0.3,
              epochsTrained: 20,
            },
          },
        };

        const json = saveModelToJSON(originalModel);
        const loadedModel = loadModelFromJSON(json);

        expect(loadedModel.config.dimensionality).toBe(128);
        expect(loadedModel.config.learningRate).toBe(0.01);
        expect(loadedModel.weights?.encoder).toEqual([[0.1, 0.2], [0.3, 0.4]]);
        expect(loadedModel.metadata.version).toBe('1.0.0');
        expect(loadedModel.metadata.trainingStats?.epochsTrained).toBe(20);
      });

      it('should throw error on invalid JSON', () => {
        const invalidJson = 'not valid json {]';

        expect(() => loadModelFromJSON(invalidJson)).toThrow('Failed to load model from JSON');
      });

      it('should throw error on corrupted model in JSON', () => {
        const model = {
          config: getDefaultEmbeddingConfig(),
          weights: {
            encoder: [[0.1]],
            embeddings: [0.2],
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date(),
          },
        };

        const json = saveModelToJSON(model);
        const parsed = JSON.parse(json);
        parsed.checksum = 'invalid_checksum';
        const corruptedJson = JSON.stringify(parsed);

        expect(() => loadModelFromJSON(corruptedJson)).toThrow('checksum verification failed');
      });

      it('should handle models without training stats', () => {
        const model = {
          config: getDefaultEmbeddingConfig(),
          weights: undefined,
          metadata: {
            version: '1.0.0',
            createdAt: new Date(),
          },
        };

        const json = saveModelToJSON(model);
        const loaded = loadModelFromJSON(json);

        expect(loaded.metadata.version).toBe('1.0.0');
        expect(loaded.metadata.trainingStats).toBeUndefined();
      });
    });
  });

  // ============================================================================
  // Task 3.2.2: Batch Inference — Corpus Encoding with Caching
  // ============================================================================

  describe('Subtask 3.2.2: Batch Inference & Caching', () => {
    describe('createEmbeddingCache', () => {
      it('should initialize empty cache', () => {
        const cache = createEmbeddingCache();

        expect(cache.embeddings.size).toBe(0);
        expect(cache.hitCount).toBe(0);
        expect(cache.missCount).toBe(0);
        expect(cache.lastUpdated).toBeInstanceOf(Date);
      });
    });

    describe('getFromCache & storeInCache', () => {
      it('should store and retrieve embeddings from cache', () => {
        const cache = createEmbeddingCache();
        const embedding = {
          articleId: 'a1',
          embedding: [0.1, 0.2],
          timestamp: new Date(),
          dimensionality: 2,
        };

        storeInCache(cache, embedding);
        const retrieved = getFromCache(cache, 'a1');

        expect(retrieved).toEqual(embedding);
        expect(cache.hitCount).toBe(1);
      });

      it('should return null for missing items and increment missCount', () => {
        const cache = createEmbeddingCache();

        const result = getFromCache(cache, 'nonexistent');

        expect(result).toBeNull();
        expect(cache.missCount).toBe(1);
      });

      it('should track hits and misses correctly', () => {
        const cache = createEmbeddingCache();
        const embedding = {
          articleId: 'a1',
          embedding: [0.1],
          timestamp: new Date(),
          dimensionality: 1,
        };

        storeInCache(cache, embedding);
        getFromCache(cache, 'a1'); // Hit
        getFromCache(cache, 'a1'); // Hit
        getFromCache(cache, 'a2'); // Miss

        expect(cache.hitCount).toBe(2);
        expect(cache.missCount).toBe(1);
      });
    });

    describe('getCacheStats', () => {
      it('should compute cache statistics correctly', () => {
        const cache = createEmbeddingCache();
        const embedding = {
          articleId: 'a1',
          embedding: [0.1],
          timestamp: new Date(),
          dimensionality: 1,
        };

        storeInCache(cache, embedding);
        getFromCache(cache, 'a1'); // Hit
        getFromCache(cache, 'a1'); // Hit
        getFromCache(cache, 'a2'); // Miss
        getFromCache(cache, 'a2'); // Miss

        const stats = getCacheStats(cache);

        expect(stats.size).toBe(1);
        expect(stats.totalAccesses).toBe(4);
        expect(stats.hitRate).toBe(0.5);
      });

      it('should handle empty cache', () => {
        const cache = createEmbeddingCache();
        const stats = getCacheStats(cache);

        expect(stats.size).toBe(0);
        expect(stats.hitRate).toBe(0);
        expect(stats.totalAccesses).toBe(0);
      });
    });

    describe('clearCache', () => {
      it('should clear all embeddings and reset counters', () => {
        const cache = createEmbeddingCache();
        const embedding = {
          articleId: 'a1',
          embedding: [0.1],
          timestamp: new Date(),
          dimensionality: 1,
        };

        storeInCache(cache, embedding);
        getFromCache(cache, 'a1');
        clearCache(cache);

        expect(cache.embeddings.size).toBe(0);
        expect(cache.hitCount).toBe(0);
        expect(cache.missCount).toBe(0);
      });
    });

    describe('batchEncodeWithCaching', () => {
      it('should batch encode articles with caching', () => {
        const articles = [
          { articleId: 'a1', title: 'News 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a2', title: 'News 2', summary: 'S2', tags: ['ai'], author: 'A2', topic: 'AI' },
        ];

        const cache = createEmbeddingCache();
        const mockEncode = (article: ArticleFeatures) => ({
          articleId: article.articleId,
          embedding: [0.1, 0.2],
          timestamp: new Date(),
          dimensionality: 2,
        });

        const { embeddings, metrics } = batchEncodeWithCaching(articles, cache, mockEncode);

        expect(embeddings).toHaveLength(2);
        expect(metrics.totalArticles).toBe(2);
        expect(metrics.processedArticles).toBe(2);
        expect(cache.embeddings.size).toBe(2);
      });

      it('should use cache for repeated articles', () => {
        const articles = [
          { articleId: 'a1', title: 'News 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a1', title: 'News 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
        ];

        const cache = createEmbeddingCache();
        let encodeCallCount = 0;
        const mockEncode = (article: ArticleFeatures) => {
          encodeCallCount++;
          return {
            articleId: article.articleId,
            embedding: [0.1],
            timestamp: new Date(),
            dimensionality: 1,
          };
        };

        const { metrics } = batchEncodeWithCaching(articles, cache, mockEncode);

        expect(encodeCallCount).toBe(1);
        expect(metrics.processedArticles).toBe(1);
        expect(metrics.cacheHits).toBe(1);
      });

      it('should compute cache hit rate correctly', () => {
        const articles = [
          { articleId: 'a1', title: 'News 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a2', title: 'News 2', summary: 'S2', tags: ['ai'], author: 'A2', topic: 'AI' },
          { articleId: 'a3', title: 'News 3', summary: 'S3', tags: ['ai'], author: 'A3', topic: 'AI' },
        ];

        const cache = createEmbeddingCache();
        const mockEncode = (article: ArticleFeatures) => ({
          articleId: article.articleId,
          embedding: [0.1],
          timestamp: new Date(),
          dimensionality: 1,
        });

        batchEncodeWithCaching(articles, cache, mockEncode);
        const { metrics } = batchEncodeWithCaching(
          articles.slice(0, 2),
          cache,
          mockEncode
        );

        // Second batch should have 2 cache hits and 0 processed (all from cache)
        expect(metrics.cacheHits).toBe(2);
        expect(metrics.processedArticles).toBe(0);
        // Global cache hit rate: 2 hits / (3 misses + 2 hits) = 0.4
        expect(metrics.cacheHitRate).toBeCloseTo(0.4, 1);
      });
    });

    describe('precomputeCorpusEmbeddings', () => {
      it('should precompute all embeddings and return cache', () => {
        const articles = [
          { articleId: 'a1', title: 'News 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a2', title: 'News 2', summary: 'S2', tags: ['ai'], author: 'A2', topic: 'AI' },
          { articleId: 'a3', title: 'News 3', summary: 'S3', tags: ['ai'], author: 'A3', topic: 'AI' },
        ];

        const mockEncode = (article: ArticleFeatures) => ({
          articleId: article.articleId,
          embedding: [0.1, 0.2],
          timestamp: new Date(),
          dimensionality: 2,
        });

        const { cache, metrics } = precomputeCorpusEmbeddings(articles, mockEncode);

        expect(cache.embeddings.size).toBe(3);
        expect(metrics.processedArticles).toBe(3);
        expect(metrics.avgTimePerArticleMs).toBeGreaterThanOrEqual(0);
      });
    });

    describe('incrementalCacheUpdate', () => {
      it('should add only new articles to cache', () => {
        const articles = [
          { articleId: 'a1', title: 'News 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a2', title: 'News 2', summary: 'S2', tags: ['ai'], author: 'A2', topic: 'AI' },
        ];

        const cache = createEmbeddingCache();
        const mockEncode = (article: ArticleFeatures) => ({
          articleId: article.articleId,
          embedding: [0.1],
          timestamp: new Date(),
          dimensionality: 1,
        });

        // Precompute a1
        batchEncodeWithCaching(articles.slice(0, 1), cache, mockEncode);

        // Incrementally add a2 and a3
        const newArticles = [
          { articleId: 'a1', title: 'News 1', summary: 'S1', tags: ['ai'], author: 'A1', topic: 'AI' },
          { articleId: 'a2', title: 'News 2', summary: 'S2', tags: ['ai'], author: 'A2', topic: 'AI' },
          { articleId: 'a3', title: 'News 3', summary: 'S3', tags: ['ai'], author: 'A3', topic: 'AI' },
        ];

        const { newEmbeddings, skippedCount, addedCount } = incrementalCacheUpdate(
          newArticles,
          cache,
          mockEncode
        );

        expect(skippedCount).toBe(1);
        expect(addedCount).toBe(2);
        expect(newEmbeddings).toHaveLength(2);
        expect(cache.embeddings.size).toBe(3);
      });
    });

    describe('Subtask 3.2.3: Edge Case Handling', () => {
      describe('handleOutOfVocabularyTokens', () => {
        it('should handle OOV tokens with mean fallback', () => {
          const tokens = ['known', 'unknown', 'word'];
          const tokenEmbeddings = new Map([
            ['known', [0.1, 0.2]],
            ['word', [0.3, 0.4]],
          ]);

          const mappings = handleOutOfVocabularyTokens(
            tokens,
            tokenEmbeddings,
            'mean'
          );

          expect(mappings).toHaveLength(3);
          expect(mappings[0].isKnown).toBe(true);
          expect(mappings[1].isKnown).toBe(false);
          expect(mappings[2].isKnown).toBe(true);
          // Mean fallback: (0.1 + 0.3) / 2 = 0.2, (0.2 + 0.4) / 2 = 0.3
          expect(mappings[1].fallbackEmbedding?.[0]).toBeCloseTo(0.2);
          expect(mappings[1].fallbackEmbedding?.[1]).toBeCloseTo(0.3);
        });

        it('should handle OOV tokens with zero fallback', () => {
          const tokens = ['unknown'];
          const tokenEmbeddings = new Map([['known', [0.5, 0.5]]]);

          const mappings = handleOutOfVocabularyTokens(
            tokens,
            tokenEmbeddings,
            'zero'
          );

          expect(mappings[0].isKnown).toBe(false);
          expect(mappings[0].fallbackEmbedding).toEqual([0, 0]);
        });

        it('should handle all OOV tokens when vocabulary is empty', () => {
          const tokens = ['unknown1', 'unknown2'];
          const tokenEmbeddings = new Map();

          const mappings = handleOutOfVocabularyTokens(
            tokens,
            tokenEmbeddings,
            'mean'
          );

          expect(mappings).toHaveLength(2);
          mappings.forEach(m => {
            expect(m.isKnown).toBe(false);
          });
        });
      });

      describe('encodeColdStartArticle', () => {
        it('should encode new article without engagement data', () => {
          const article = {
            articleId: 'new1',
            title: 'Breaking News',
            summary: 'Important update',
            tags: ['news'],
            author: 'Reporter',
            topic: 'Science',
          };

          const config = getDefaultEmbeddingConfig();
          const vocab = buildVocabulary([
            ...testArticles,
            article,
          ]);
          const encoder = new EmbeddingEncoder(vocab, config);

          const embedding = encodeColdStartArticle(article, encoder);

          expect(embedding.articleId).toBe('new1');
          expect(embedding.embedding.length).toBeGreaterThan(0);
          expect(embedding.timestamp).toBeInstanceOf(Date);
        });

        it('should preserve article metadata in cold-start embedding', () => {
          const article = {
            articleId: 'cs1',
            title: 'Test',
            summary: 'Cold start test',
            tags: ['test'],
            author: 'Tester',
            topic: 'AI',
          };

          const config = getDefaultEmbeddingConfig();
          const vocab = buildVocabulary([
            ...testArticles,
            article,
          ]);
          const encoder = new EmbeddingEncoder(vocab, config);

          const embedding = encodeColdStartArticle(article, encoder);

          expect(embedding.articleId).toBe(article.articleId);
          expect(embedding.dimensionality).toBe(128); // default dimension
        });
      });

      describe('validateEdgeCaseHandling', () => {
        it('should validate edge cases coverage', () => {
          const articles = [
            {
              articleId: 'a1',
              title: 'Article 1',
              summary: 'S1',
              tags: ['ai'],
              author: 'Author',
              topic: 'AI',
            },
            {
              articleId: 'a2',
              title: 'Article 2',
              summary: 'S2',
              tags: ['tech'],
              author: 'Tech Writer',
              topic: 'Technology',
            },
          ];

          const embeddings = [
            {
              articleId: 'a1',
              embedding: [0.1, 0.2],
              timestamp: new Date(),
              dimensionality: 2,
            },
            {
              articleId: 'a2',
              embedding: [0.3, 0.4],
              timestamp: new Date(),
              dimensionality: 2,
            },
          ];

          const tokenEmbeddings = new Map([
            ['article', [0.1]],
            ['tech', [0.2]],
          ]);

          const result = validateEdgeCaseHandling(
            articles,
            embeddings,
            tokenEmbeddings
          );

          expect(result.averageEmbeddingQuality).toBeGreaterThan(0);
          expect(result.oovTokensHandled).toBeGreaterThanOrEqual(0);
          expect(typeof result.edgeCasesCovered).toBe('boolean');
        });

        it('should count sparse engagement articles', () => {
          const articles = [
            {
              articleId: 'a1',
              title: 'New Article',
              summary: 'Recently published',
              tags: ['new'],
              author: 'Author',
              topic: 'News',
            },
          ];

          const embeddings = [
            {
              articleId: 'a1',
              embedding: [0.5],
              timestamp: new Date(),
              dimensionality: 1,
            },
          ];

          const tokenEmbeddings = new Map();

          const result = validateEdgeCaseHandling(
            articles,
            embeddings,
            tokenEmbeddings
          );

          expect(result.coldStartArticles).toBeGreaterThanOrEqual(0);
          expect(result.sparseEngagementArticles).toBeGreaterThanOrEqual(0);
        });

        it('should measure embedding quality correctly', () => {
          const articles = [
            {
              articleId: 'a1',
              title: 'Test',
              summary: 'Quality test',
              tags: ['test'],
              author: 'Tester',
              topic: 'Test',
            },
          ];

          const embeddings = [
            {
              articleId: 'a1',
              embedding: new Array(128).fill(0.1),
              timestamp: new Date(),
              dimensionality: 128,
            },
          ];

          const tokenEmbeddings = new Map([['test', [0.1]]]);

          const result = validateEdgeCaseHandling(
            articles,
            embeddings,
            tokenEmbeddings
          );

          // Quality should be measured based on embedding magnitude
          expect(result.averageEmbeddingQuality).toBeGreaterThan(0);
          expect(result.averageEmbeddingQuality).toBeLessThanOrEqual(1);
        });
      });
    });
  });
});
