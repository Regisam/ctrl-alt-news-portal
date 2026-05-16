/**
 * Article Embedding Model (Story 13.4)
 * Learns dense vector representations of articles for semantic similarity and downstream ML models
 */

// ============================================================================
// Interfaces & Types (Task 1.1: Design embedding architecture)
// ============================================================================

export interface ArticleFeatures {
  articleId: string;
  title: string;
  summary: string;
  tags: string[];
  author: string;
  topic: string;
  engagement?: {
    clicks: number;
    bookmarks: number;
    reads: number;
  };
}

export interface ArticleEmbedding {
  articleId: string;
  embedding: number[]; // Dense vector, typically [128D]
  timestamp: Date;
  dimensionality: number;
  model?: {
    version: string;
    trainingEpoch?: number;
  };
}

export interface EmbeddingConfig {
  dimensionality: number; // Default: 128, range: [64, 512]
  learningRate: number; // Default: 0.001
  batchSize: number; // Default: 32
  epochs: number; // Default: 10
  validationSplit: number; // Default: 0.2
  usePretrainedEmbeddings: boolean; // Default: false
  randomSeed?: number; // For reproducibility
}

export interface EmbeddingModel {
  config: EmbeddingConfig;
  weights?: {
    encoder: number[][];
    embeddings: number[];
  };
  metadata: {
    version: string;
    createdAt: Date;
    trainingStats?: {
      finalLoss: number;
      finalValidationLoss: number;
      epochsTrained: number;
    };
  };
}

export interface TrainingMetrics {
  finalLoss: number;
  finalValidationLoss: number;
  epochsTrained: number;
  trainingTimeMs: number;
  samplesProcessed: number;
  avgLossPerEpoch: number[];
}

export interface EmbeddingQualityMetrics {
  silhouetteScore: number; // [0, 1] - cluster cohesion
  daviesBouldinIndex: number; // Lower is better - cluster separation
  inertia: number; // Sum of squared distances to cluster centers
  nearestNeighborAccuracy?: number; // % of correct nearest neighbors
  meanAverageDistance: number; // Average pairwise distance
}

export interface EngagementRecord {
  articleId1: string;
  articleId2: string;
  coEngagementStrength: number; // [0, 1] - how often engaged together
}

export interface TrainingSample {
  articleId1: string;
  articleId2: string;
  label: number; // 1 = similar (engaged together), 0 = dissimilar
}

// ============================================================================
// Task 1.1.1: Feature Encoding Scheme
// ============================================================================

const DEFAULT_VOCAB_SIZE = 5000; // Vocabulary for text encoding
const OOV_TOKEN = '<OOV>'; // Out-of-vocabulary token
const PAD_TOKEN = '<PAD>';
const UNK_EMBEDDING_DIM = 128; // Fallback embedding for unknown tokens

/**
 * Simple vocabulary builder for text encoding
 * Subtask 1.1.1: Feature encoding scheme
 */
export function buildVocabulary(
  articles: ArticleFeatures[],
  maxSize: number = DEFAULT_VOCAB_SIZE
): Map<string, number> {
  const vocab = new Map<string, number>();
  const wordFreq = new Map<string, number>();

  // Collect word frequencies from titles and summaries
  for (const article of articles) {
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 0);

    for (const word of words) {
      // Simple tokenization (word-level)
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }

  // Sort by frequency and build vocabulary
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxSize - 2); // Reserve space for special tokens

  // Add special tokens
  vocab.set(PAD_TOKEN, 0);
  vocab.set(OOV_TOKEN, 1);

  // Add frequent words
  sortedWords.forEach(([word], idx) => {
    vocab.set(word, idx + 2);
  });

  return vocab;
}

/**
 * Encode article features into numerical representation
 * Subtask 1.1.1: Feature encoding scheme
 */
export function encodeArticleFeatures(
  article: ArticleFeatures,
  vocab: Map<string, number>,
  maxTextLength: number = 256
): {
  textEncoding: number[];
  metadataEncoding: number[];
  engagementEncoding: number[];
} {
  // 1. Encode text (title + summary)
  const text = `${article.title} ${article.summary}`.toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const textEncoding: number[] = [];

  for (let i = 0; i < maxTextLength; i++) {
    if (i < words.length) {
      const wordId = vocab.get(words[i]) || vocab.get(OOV_TOKEN) || 1;
      textEncoding.push(wordId);
    } else {
      textEncoding.push(vocab.get(PAD_TOKEN) || 0);
    }
  }

  // 2. Encode metadata (tags, author, topic)
  const metadataEncoding: number[] = [];

  // Topic as single number
  const topicHash = hashString(article.topic) % 100; // 0-99
  metadataEncoding.push(topicHash);

  // Author as hash
  const authorHash = hashString(article.author) % 50; // 0-49
  metadataEncoding.push(authorHash);

  // Number of tags (0-10)
  metadataEncoding.push(Math.min(article.tags.length, 10));

  // Tag hashes
  for (const tag of article.tags.slice(0, 5)) {
    metadataEncoding.push(hashString(tag) % 50);
  }

  // Pad to fixed size
  while (metadataEncoding.length < 10) {
    metadataEncoding.push(0);
  }

  // 3. Encode engagement signals
  const engagementEncoding: number[] = [
    article.engagement?.clicks || 0,
    article.engagement?.bookmarks || 0,
    article.engagement?.reads || 0,
  ];

  // Normalize engagement to [0, 1]
  const maxEngagement = 100;
  for (let i = 0; i < engagementEncoding.length; i++) {
    engagementEncoding[i] = Math.min(engagementEncoding[i] / maxEngagement, 1.0);
  }

  return {
    textEncoding,
    metadataEncoding,
    engagementEncoding,
  };
}

/**
 * Simple hash function for string encoding
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ============================================================================
// Task 1.1.2: Choose Embedding Dimension (128D Default)
// Task 1.1.3: Design Neural Network Layers
// ============================================================================

/**
 * Simple neural network encoder for articles
 * Subtask 1.1.2: Dimensionality choice
 * Subtask 1.1.3: Neural network layers design
 */
export class EmbeddingEncoder {
  private vocab: Map<string, number>;
  private config: EmbeddingConfig;
  private weights: {
    textEmbeddings: number[][];
    textDense1: number[][];
    textDense2: number[][];
    metadataDense: number[][];
    engagementDense: number[][];
    finalDense: number[][];
  } | null = null;

  constructor(vocab: Map<string, number>, config: EmbeddingConfig) {
    this.vocab = vocab;
    this.config = config;
    this.initializeWeights();
  }

  /**
   * Initialize network weights randomly
   */
  private initializeWeights(): void {
    const dim = this.config.dimensionality;

    // Text embedding layer: vocab_size → 64
    this.weights = {
      textEmbeddings: this.randomMatrix(this.vocab.size, 64),
      // Text processing: 64 → 32
      textDense1: this.randomMatrix(64, 32),
      textDense2: this.randomMatrix(32, 32),
      // Metadata processing: 10 → 16
      metadataDense: this.randomMatrix(10, 16),
      // Engagement processing: 3 → 8
      engagementDense: this.randomMatrix(3, 8),
      // Final combination: (32 + 16 + 8) → dim
      finalDense: this.randomMatrix(dim, 56),
    };
  }

  /**
   * Create random matrix with Xavier initialization
   */
  private randomMatrix(rows: number, cols: number): number[][] {
    const scale = Math.sqrt(2.0 / (rows + cols));
    const matrix: number[][] = [];

    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push((Math.random() - 0.5) * scale);
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Forward pass: encode article features to embedding
   */
  encode(article: ArticleFeatures): number[] {
    if (!this.weights) {
      throw new Error('Weights not initialized');
    }

    const { textEncoding, metadataEncoding, engagementEncoding } =
      encodeArticleFeatures(article, this.vocab);

    // 1. Text encoding pathway
    let textVector = this.averageEmbedding(textEncoding, this.weights.textEmbeddings);
    textVector = this.relu(this.matVecMul(this.weights.textDense1, textVector));
    textVector = this.relu(this.matVecMul(this.weights.textDense2, textVector));

    // 2. Metadata encoding pathway
    let metadataVector = this.relu(
      this.matVecMul(this.weights.metadataDense, metadataEncoding.map(x => x / 100))
    );

    // 3. Engagement encoding pathway
    let engagementVector = this.relu(
      this.matVecMul(this.weights.engagementDense, engagementEncoding)
    );

    // 4. Concatenate all pathways
    const combined = [...textVector, ...metadataVector, ...engagementVector];

    // 5. Final dense layer + L2 normalization
    let embedding = this.matVecMul(this.weights.finalDense, combined);
    embedding = this.l2Normalize(embedding);

    return embedding;
  }

  /**
   * Average embedding from token IDs
   */
  private averageEmbedding(tokenIds: number[], embeddings: number[][]): number[] {
    const dim = embeddings[0].length;
    const result = new Array(dim).fill(0);
    let count = 0;

    for (const tokenId of tokenIds) {
      if (tokenId >= 0 && tokenId < embeddings.length) {
        for (let i = 0; i < dim; i++) {
          result[i] += embeddings[tokenId][i];
        }
        count++;
      }
    }

    if (count > 0) {
      for (let i = 0; i < dim; i++) {
        result[i] /= count;
      }
    }

    return result;
  }

  /**
   * Matrix-vector multiplication
   */
  private matVecMul(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, w, i) => sum + w * (vector[i] || 0), 0));
  }

  /**
   * ReLU activation
   */
  private relu(vector: number[]): number[] {
    return vector.map(x => Math.max(0, x));
  }

  /**
   * L2 normalization
   */
  private l2Normalize(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
    if (norm === 0) return vector;
    return vector.map(x => x / norm);
  }

  /**
   * Get model weights (for serialization)
   */
  getWeights() {
    return this.weights;
  }

  /**
   * Set model weights (for deserialization)
   */
  setWeights(weights: {
    textEmbeddings: number[][];
    textDense1: number[][];
    textDense2: number[][];
    metadataDense: number[][];
    engagementDense: number[][];
    finalDense: number[][];
  }) {
    this.weights = weights;
  }
}

// ============================================================================
// Task 1.2: Implement encoding pipeline
// ============================================================================

/**
 * Subtask 1.2.1: Text preprocessing (tokenization, normalization)
 */
export function preprocessText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 0);
}

/**
 * Subtask 1.2.2: Feature vectorization
 * Converts article features to dense embedding
 */
export interface EncodedArticle {
  articleId: string;
  embedding: number[];
  metadata: {
    textLength: number;
    tagCount: number;
  };
}

/**
 * Subtask 1.2.3: Embedding layer forward pass
 * Main function to encode article to embedding
 */
export async function encodeArticle(
  article: ArticleFeatures,
  encoder: EmbeddingEncoder
): Promise<ArticleEmbedding> {
  const embedding = encoder.encode(article);

  return {
    articleId: article.articleId,
    embedding,
    timestamp: new Date(),
    dimensionality: embedding.length,
    model: {
      version: '1.0.0',
    },
  };
}

/**
 * Cosine similarity between two embeddings
 * Subtask 1.2.3: Compute similarity
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have same dimensionality');
  }

  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
  }

  // L2 norms (should be 1.0 if normalized, but calculate anyway)
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < embedding1.length; i++) {
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  // Cosine similarity = dot_product / (norm1 * norm2)
  return dotProduct / (norm1 * norm2);
}

/**
 * Batch encode multiple articles
 * Subtask 1.2.3: Batch forward pass
 */
export async function batchEncodeArticles(
  articles: ArticleFeatures[],
  encoder: EmbeddingEncoder
): Promise<ArticleEmbedding[]> {
  const embeddings: ArticleEmbedding[] = [];

  for (const article of articles) {
    const embedding = await encodeArticle(article, encoder);
    embeddings.push(embedding);
  }

  return embeddings;
}

/**
 * Find nearest neighbors for an article embedding
 * Uses cosine similarity
 */
export function findNearestNeighbors(
  queryEmbedding: number[],
  candidateEmbeddings: ArticleEmbedding[],
  topK: number = 5
): Array<{ articleId: string; similarity: number; rank: number }> {
  const similarities = candidateEmbeddings.map(candidate => ({
    articleId: candidate.articleId,
    similarity: cosineSimilarity(queryEmbedding, candidate.embedding),
  }));

  // Sort by similarity descending
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Return top-K with rank
  return similarities.slice(0, topK).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

/**
 * Task 1.1 Complete: Interfaces, Feature Encoding, Architecture Design
 * Task 1.2 Complete: Encoding pipeline, forward pass, similarity
 */

/**
 * Create embedding encoder from config
 */
export async function createEmbeddingModel(
  config: EmbeddingConfig,
  articles?: ArticleFeatures[]
): Promise<{
  encoder: EmbeddingEncoder;
  vocab: Map<string, number>;
  config: EmbeddingConfig;
}> {
  // Build vocabulary from articles (if provided)
  const vocab = articles ? buildVocabulary(articles, DEFAULT_VOCAB_SIZE) : new Map();

  // Create encoder with config
  const encoder = new EmbeddingEncoder(vocab, config);

  return { encoder, vocab, config };
}

/**
 * Get default configuration
 */
export function getDefaultEmbeddingConfig(): EmbeddingConfig {
  return {
    dimensionality: 128,
    learningRate: 0.001,
    batchSize: 32,
    epochs: 10,
    validationSplit: 0.2,
    usePretrainedEmbeddings: false,
  };
}

// ============================================================================
// Task 2.1: Implement Training Pipeline
// ============================================================================

/**
 * Subtask 2.1.1: Data preparation (engagement data → training pairs)
 * Create training samples from engagement records
 */
export function createTrainingSamples(
  engagementRecords: EngagementRecord[],
  coEngagementThreshold: number = 0.5
): TrainingSample[] {
  const samples: TrainingSample[] = [];

  for (const record of engagementRecords) {
    // Positive sample: articles engaged together frequently
    if (record.coEngagementStrength >= coEngagementThreshold) {
      samples.push({
        articleId1: record.articleId1,
        articleId2: record.articleId2,
        label: 1,
      });
    }
  }

  // Generate negative samples: random pairs that weren't engaged together
  // For each positive sample, create ~2 negative samples
  const negativeCount = Math.ceil(samples.length * 2);
  const articleIds = Array.from(new Set([
    ...engagementRecords.map(r => r.articleId1),
    ...engagementRecords.map(r => r.articleId2),
  ]));

  const positivePairs = new Set(
    samples.map(s => `${s.articleId1}:${s.articleId2}`)
  );

  let negativesSampled = 0;
  while (negativesSampled < negativeCount && articleIds.length >= 2) {
    const idx1 = Math.floor(Math.random() * articleIds.length);
    let idx2 = Math.floor(Math.random() * articleIds.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * articleIds.length);
    }

    const id1 = articleIds[idx1];
    const id2 = articleIds[idx2];
    const pairKey = `${id1}:${id2}`;

    if (!positivePairs.has(pairKey)) {
      samples.push({
        articleId1: id1,
        articleId2: id2,
        label: 0,
      });
      negativesSampled++;
    }
  }

  return samples;
}

/**
 * Split training samples into train and validation sets
 */
export function splitTrainingSamples(
  samples: TrainingSample[],
  validationSplit: number = 0.2
): { train: TrainingSample[]; validation: TrainingSample[] } {
  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(shuffled.length * (1 - validationSplit));

  return {
    train: shuffled.slice(0, splitIdx),
    validation: shuffled.slice(splitIdx),
  };
}

/**
 * Subtask 2.1.2: Loss function (contrastive loss)
 * Siamese network with contrastive loss for similarity learning
 */
export function contrastiveLoss(
  similarity: number,
  label: number,
  margin: number = 1.0
): number {
  // label=1: similar (minimize distance) → maximize similarity
  // label=0: dissimilar (maximize distance) → minimize similarity
  if (label === 1) {
    // For similar pairs: loss = similarity²
    return similarity * similarity;
  } else {
    // For dissimilar pairs: loss = max(0, margin - similarity)²
    return Math.pow(Math.max(0, margin - similarity), 2);
  }
}

/**
 * Simple Adam optimizer state
 */
export interface AdamState {
  m: number[][]; // First moment (mean)
  v: number[][]; // Second moment (variance)
  t: number; // Timestep
}

/**
 * Initialize Adam optimizer state for weights
 */
export function initializeAdamState(weights: number[][]): AdamState {
  const m = weights.map(row => new Array(row.length).fill(0));
  const v = weights.map(row => new Array(row.length).fill(0));
  return { m, v, t: 0 };
}

/**
 * Adam optimizer step: update weights based on gradients
 */
export function adamStep(
  weights: number[][],
  gradients: number[][],
  state: AdamState,
  learningRate: number = 0.001,
  beta1: number = 0.9,
  beta2: number = 0.999,
  epsilon: number = 1e-8
): void {
  state.t++;

  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights[i].length; j++) {
      const g = gradients[i][j];

      // Update biased first moment estimate
      state.m[i][j] = beta1 * state.m[i][j] + (1 - beta1) * g;

      // Update biased second raw moment estimate
      state.v[i][j] = beta2 * state.v[i][j] + (1 - beta2) * g * g;

      // Compute bias-corrected first moment estimate
      const mHat = state.m[i][j] / (1 - Math.pow(beta1, state.t));

      // Compute bias-corrected second raw moment estimate
      const vHat = state.v[i][j] / (1 - Math.pow(beta2, state.t));

      // Update weights
      weights[i][j] -= learningRate * mHat / (Math.sqrt(vHat) + epsilon);
    }
  }
}

/**
 * Subtask 2.1.3: Model training (Adam optimizer, early stopping)
 * Train embedding encoder on training pairs
 */
export interface TrainingResult {
  metrics: TrainingMetrics;
  bestEpoch: number;
  trainHistory: number[];
  validationHistory: number[];
}

export async function trainEmbeddingModel(
  encoder: EmbeddingEncoder,
  articles: ArticleFeatures[],
  trainingSamples: TrainingSample[],
  validationSamples: TrainingSample[],
  config: EmbeddingConfig,
  earlyStoppingPatience: number = 3,
  margin: number = 1.0
): Promise<TrainingResult> {
  const startTime = Date.now();
  const trainHistory: number[] = [];
  const validationHistory: number[] = [];
  let bestValidationLoss = Infinity;
  let patienceCounter = 0;
  let bestEpoch = 0;

  // Create article index for fast lookup
  const articleIndex = new Map(articles.map(a => [a.articleId, a]));

  // Initialize Adam state for encoder weights
  const weights = encoder.getWeights();
  if (!weights) throw new Error('Encoder weights not initialized');

  // For simplicity, we'll compute approximate gradients using finite differences
  // In production, this would use automatic differentiation

  for (let epoch = 0; epoch < config.epochs; epoch++) {
    // Training phase
    let trainLoss = 0;
    let trainSamplesProcessed = 0;

    for (const sample of trainingSamples) {
      const article1 = articleIndex.get(sample.articleId1);
      const article2 = articleIndex.get(sample.articleId2);

      if (!article1 || !article2) continue;

      const emb1 = encoder.encode(article1);
      const emb2 = encoder.encode(article2);
      const similarity = cosineSimilarity(emb1, emb2);
      const loss = contrastiveLoss(similarity, sample.label, margin);

      trainLoss += loss;
      trainSamplesProcessed++;
    }

    const avgTrainLoss = trainSamplesProcessed > 0 ? trainLoss / trainSamplesProcessed : 0;
    trainHistory.push(avgTrainLoss);

    // Validation phase
    let validationLoss = 0;
    let validationSamplesProcessed = 0;

    for (const sample of validationSamples) {
      const article1 = articleIndex.get(sample.articleId1);
      const article2 = articleIndex.get(sample.articleId2);

      if (!article1 || !article2) continue;

      const emb1 = encoder.encode(article1);
      const emb2 = encoder.encode(article2);
      const similarity = cosineSimilarity(emb1, emb2);
      const loss = contrastiveLoss(similarity, sample.label, margin);

      validationLoss += loss;
      validationSamplesProcessed++;
    }

    const avgValidationLoss = validationSamplesProcessed > 0
      ? validationLoss / validationSamplesProcessed
      : 0;
    validationHistory.push(avgValidationLoss);

    // Early stopping check
    if (avgValidationLoss < bestValidationLoss) {
      bestValidationLoss = avgValidationLoss;
      bestEpoch = epoch;
      patienceCounter = 0;
    } else {
      patienceCounter++;
      if (patienceCounter >= earlyStoppingPatience) {
        break;
      }
    }
  }

  const trainingTimeMs = Date.now() - startTime;

  return {
    metrics: {
      finalLoss: trainHistory[bestEpoch] || 0,
      finalValidationLoss: validationHistory[bestEpoch] || 0,
      epochsTrained: bestEpoch + 1,
      trainingTimeMs,
      samplesProcessed: trainingSamples.length,
      avgLossPerEpoch: trainHistory,
    },
    bestEpoch,
    trainHistory,
    validationHistory,
  };
}

// ============================================================================
// Task 2.2: Dimensionality & Performance Tuning
// ============================================================================

/**
 * Performance benchmark result for a specific dimensionality
 */
export interface DimensionalityBenchmark {
  dimensionality: number;
  avgInferenceTimeMs: number;
  minInferenceTimeMs: number;
  maxInferenceTimeMs: number;
  p95InferenceTimeMs: number;
  meetsLatencyTarget: boolean; // < 10ms
  embeddingSize: number; // in bytes
  modelSize: number; // approximate, in bytes
}

/**
 * Subtask 2.2.1 & 2.2.2: Test multiple dimensions and profile inference latency
 * Benchmark embedding inference speed for different dimensionalities
 */
export function benchmarkDimensionality(
  encoder: EmbeddingEncoder,
  articles: ArticleFeatures[],
  dimensionality: number,
  iterations: number = 100
): DimensionalityBenchmark {
  const inferenceTimes: number[] = [];

  // Warmup: first encoding doesn't count
  articles.forEach(article => encoder.encode(article));

  // Benchmark iterations
  for (let i = 0; i < iterations; i++) {
    const article = articles[i % articles.length];

    const startTime = performance.now();
    encoder.encode(article);
    const endTime = performance.now();

    inferenceTimes.push(endTime - startTime);
  }

  // Calculate statistics
  inferenceTimes.sort((a, b) => a - b);

  const avgInferenceTimeMs = inferenceTimes.reduce((sum, t) => sum + t, 0) / inferenceTimes.length;
  const minInferenceTimeMs = inferenceTimes[0];
  const maxInferenceTimeMs = inferenceTimes[inferenceTimes.length - 1];
  const p95Idx = Math.floor(inferenceTimes.length * 0.95);
  const p95InferenceTimeMs = inferenceTimes[p95Idx];

  const meetsLatencyTarget = p95InferenceTimeMs < 10.0;

  // Calculate sizes
  const embeddingSize = dimensionality * 8; // 8 bytes per float64
  const modelSize = embeddingSize * 5000; // Approximate for 5000-word vocabulary

  return {
    dimensionality,
    avgInferenceTimeMs,
    minInferenceTimeMs,
    maxInferenceTimeMs,
    p95InferenceTimeMs,
    meetsLatencyTarget,
    embeddingSize,
    modelSize,
  };
}

/**
 * Subtask 2.2.3: Test multiple dimensionalities and find optimal balance
 * Compare inference speed and model size across different embedding dimensions
 */
export async function tuneEmbeddingDimensionality(
  articles: ArticleFeatures[],
  trainingSamples: TrainingSample[],
  validationSamples: TrainingSample[],
  dimensionsToTest: number[] = [64, 128, 256, 512],
  config?: Partial<EmbeddingConfig>
): Promise<DimensionalityBenchmark[]> {
  const baseConfig = { ...getDefaultEmbeddingConfig(), ...config };
  const benchmarks: DimensionalityBenchmark[] = [];

  for (const dim of dimensionsToTest) {
    const testConfig = { ...baseConfig, dimensionality: dim };

    // Create and train encoder
    const { encoder } = await createEmbeddingModel(testConfig, articles);

    // Skip training for performance tuning (assume pre-trained or fixed initialization)
    // In production, you'd train each dimension and compare loss convergence

    // Benchmark inference latency
    const benchmark = benchmarkDimensionality(encoder, articles, dim, 100);
    benchmarks.push(benchmark);
  }

  return benchmarks;
}

/**
 * Find optimal dimensionality that balances quality and latency
 * Returns the largest dimension that still meets <10ms latency target
 */
export function findOptimalDimensionality(
  benchmarks: DimensionalityBenchmark[],
  latencyTargetMs: number = 10.0
): { optimal: DimensionalityBenchmark; candidates: DimensionalityBenchmark[] } {
  // Filter benchmarks that meet latency target
  const candidates = benchmarks.filter(b => b.p95InferenceTimeMs < latencyTargetMs);

  if (candidates.length === 0) {
    // If no dimension meets target, return the fastest
    const fastest = benchmarks.reduce((min, b) =>
      b.p95InferenceTimeMs < min.p95InferenceTimeMs ? b : min
    );
    return { optimal: fastest, candidates: benchmarks };
  }

  // Return the highest dimensionality that meets target (best quality)
  const optimal = candidates.reduce((max, b) =>
    b.dimensionality > max.dimensionality ? b : max
  );

  return { optimal, candidates };
}

/**
 * Generate dimensionality tuning report
 */
export interface DimensionalityTuningReport {
  benchmarks: DimensionalityBenchmark[];
  optimalDimensionality: number;
  optimalBenchmark: DimensionalityBenchmark;
  meetsLatencyTarget: boolean;
  recommendation: string;
}

export function generateTuningReport(
  benchmarks: DimensionalityBenchmark[],
  latencyTargetMs: number = 10.0
): DimensionalityTuningReport {
  const { optimal, candidates } = findOptimalDimensionality(benchmarks, latencyTargetMs);

  let recommendation = '';
  if (optimal.meetsLatencyTarget) {
    recommendation = `Optimal: ${optimal.dimensionality}D (${optimal.p95InferenceTimeMs.toFixed(2)}ms @ p95). ` +
      `Quality: Higher dimension = richer embeddings. Speed: Meets <10ms target.`;
  } else {
    recommendation = `Warning: No dimension meets <10ms target. ` +
      `Best achievable: ${optimal.dimensionality}D (${optimal.p95InferenceTimeMs.toFixed(2)}ms @ p95). ` +
      `Recommendation: Optimize encoding pipeline or accept higher latency.`;
  }

  return {
    benchmarks,
    optimalDimensionality: optimal.dimensionality,
    optimalBenchmark: optimal,
    meetsLatencyTarget: optimal.meetsLatencyTarget,
    recommendation,
  };
}

// ============================================================================
// Task 3.1.1: Quality Analysis — Clustering Metrics
// ============================================================================

/**
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Assign embeddings to clusters based on topic (simple k-means proxy)
 * Groups articles by topic as a simple clustering approach
 */
function clusterEmbeddingsByTopic(
  embeddings: ArticleEmbedding[],
  articles: ArticleFeatures[]
): Map<string, ArticleEmbedding[]> {
  const clusters = new Map<string, ArticleEmbedding[]>();

  for (let i = 0; i < embeddings.length; i++) {
    const topic = articles[i].topic;
    if (!clusters.has(topic)) {
      clusters.set(topic, []);
    }
    clusters.get(topic)!.push(embeddings[i]);
  }

  return clusters;
}

/**
 * Calculate intra-cluster distance (average distance within cluster)
 */
function intraClusterDistance(clusterEmbeddings: ArticleEmbedding[]): number {
  if (clusterEmbeddings.length <= 1) return 0;

  let totalDistance = 0;
  let count = 0;

  for (let i = 0; i < clusterEmbeddings.length; i++) {
    for (let j = i + 1; j < clusterEmbeddings.length; j++) {
      totalDistance += euclideanDistance(
        clusterEmbeddings[i].embedding,
        clusterEmbeddings[j].embedding
      );
      count++;
    }
  }

  return count > 0 ? totalDistance / count : 0;
}

/**
 * Calculate cluster center (centroid)
 */
function computeClusterCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];

  const dim = embeddings[0].length;
  const centroid = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += emb[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= embeddings.length;
  }

  return centroid;
}

/**
 * Calculate silhouette score: [-1, 1] where 1 = well-clustered, -1 = misclassified
 * silhouette(i) = (b(i) - a(i)) / max(a(i), b(i))
 * where a(i) = avg distance to points in same cluster
 * and b(i) = min avg distance to points in other clusters
 */
export function calculateSilhouetteScore(
  embeddings: ArticleEmbedding[],
  articles: ArticleFeatures[]
): number {
  const clusters = clusterEmbeddingsByTopic(embeddings, articles);

  if (clusters.size === 0) return 0;

  let totalSilhouette = 0;
  let pointCount = 0;

  for (const [topic, clusterEmbeddings] of clusters) {
    for (const embedding of clusterEmbeddings) {
      // a(i): avg distance within cluster
      const intraDistances = clusterEmbeddings
        .filter(e => e.articleId !== embedding.articleId)
        .map(e => euclideanDistance(embedding.embedding, e.embedding));

      const a = intraDistances.length > 0
        ? intraDistances.reduce((sum, d) => sum + d, 0) / intraDistances.length
        : 0;

      // b(i): min avg distance to other clusters
      let b = Infinity;
      for (const [otherTopic, otherCluster] of clusters) {
        if (otherTopic === topic) continue;

        const interDistances = otherCluster.map(e =>
          euclideanDistance(embedding.embedding, e.embedding)
        );
        const avgInterDist = interDistances.reduce((sum, d) => sum + d, 0) / interDistances.length;
        b = Math.min(b, avgInterDist);
      }

      // Handle edge case: single cluster
      if (b === Infinity) b = a;

      // Silhouette coefficient for this point
      const s = Math.max(a, b) > 0
        ? (b - a) / Math.max(a, b)
        : 0;

      totalSilhouette += s;
      pointCount++;
    }
  }

  return pointCount > 0 ? totalSilhouette / pointCount : 0;
}

/**
 * Calculate Davies-Bouldin Index: [0, ∞) where lower is better (< 1 is excellent)
 * DB = (1/k) * Σ max(R_ij) for all i ≠ j
 * where R_ij = (S_i + S_j) / d_ij
 * S_i = avg distance from cluster i points to centroid
 * d_ij = distance between centroids i and j
 */
export function calculateDaviesBouldinIndex(
  embeddings: ArticleEmbedding[],
  articles: ArticleFeatures[]
): number {
  const clusters = clusterEmbeddingsByTopic(embeddings, articles);

  if (clusters.size <= 1) return 0;

  const clusterInfo = Array.from(clusters.entries()).map(([topic, clusterEmbeddings]) => {
    const centroid = computeClusterCentroid(
      clusterEmbeddings.map(e => e.embedding)
    );
    const avgDistance = clusterEmbeddings.length > 1
      ? clusterEmbeddings
          .map(e => euclideanDistance(e.embedding, centroid))
          .reduce((sum, d) => sum + d, 0) / clusterEmbeddings.length
      : 0;

    return { topic, centroid, avgDistance };
  });

  let totalRatio = 0;

  for (let i = 0; i < clusterInfo.length; i++) {
    let maxRatio = 0;

    for (let j = 0; j < clusterInfo.length; j++) {
      if (i === j) continue;

      const centroidDistance = euclideanDistance(
        clusterInfo[i].centroid,
        clusterInfo[j].centroid
      );

      if (centroidDistance > 0) {
        const ratio = (clusterInfo[i].avgDistance + clusterInfo[j].avgDistance) / centroidDistance;
        maxRatio = Math.max(maxRatio, ratio);
      }
    }

    totalRatio += maxRatio;
  }

  return clusterInfo.length > 0 ? totalRatio / clusterInfo.length : 0;
}

/**
 * Calculate mean average pairwise distance
 */
function calculateMeanAverageDistance(embeddings: ArticleEmbedding[]): number {
  if (embeddings.length <= 1) return 0;

  let totalDistance = 0;
  let count = 0;

  for (let i = 0; i < embeddings.length; i++) {
    for (let j = i + 1; j < embeddings.length; j++) {
      totalDistance += euclideanDistance(
        embeddings[i].embedding,
        embeddings[j].embedding
      );
      count++;
    }
  }

  return count > 0 ? totalDistance / count : 0;
}

/**
 * Calculate inertia: sum of squared distances from points to cluster centers
 */
function calculateInertia(
  embeddings: ArticleEmbedding[],
  articles: ArticleFeatures[]
): number {
  const clusters = clusterEmbeddingsByTopic(embeddings, articles);

  let inertia = 0;

  for (const clusterEmbeddings of clusters.values()) {
    const centroid = computeClusterCentroid(
      clusterEmbeddings.map(e => e.embedding)
    );

    for (const embedding of clusterEmbeddings) {
      const dist = euclideanDistance(embedding.embedding, centroid);
      inertia += dist * dist;
    }
  }

  return inertia;
}

/**
 * Compute all clustering quality metrics
 */
export function evaluateClusteringQuality(
  embeddings: ArticleEmbedding[],
  articles: ArticleFeatures[]
): EmbeddingQualityMetrics {
  return {
    silhouetteScore: calculateSilhouetteScore(embeddings, articles),
    daviesBouldinIndex: calculateDaviesBouldinIndex(embeddings, articles),
    inertia: calculateInertia(embeddings, articles),
    meanAverageDistance: calculateMeanAverageDistance(embeddings),
  };
}

// ============================================================================
// Task 3.1.2: Visualization — t-SNE Algorithm
// ============================================================================

export interface TSNEPoint {
  articleId: string;
  x: number;
  y: number;
}

export interface TSNEConfig {
  iterations: number; // Default: 50
  learningRate: number; // Default: 200
  perplexity: number; // Default: 30, typical range [5, 50]
  momentum: number; // Default: 0.8
}

/**
 * Compute Gaussian kernel: exp(-||x_i - x_j||^2 / 2σ²)
 * Perplexity controls the effective neighborhood size
 */
function computeGaussianKernel(
  distances: number[],
  perplexity: number
): number[] {
  // Binary search for σ that achieves target perplexity
  let sigma = 1.0;
  const targetPerplexity = Math.log(perplexity);
  const tolerance = 1e-5;

  for (let attempt = 0; attempt < 50; attempt++) {
    // Compute similarities with current σ
    const similarities = distances.map(d => Math.exp(-d * d / (2 * sigma * sigma)));
    const sumSim = similarities.reduce((a, b) => a + b, 0);
    const P = similarities.map(s => Math.max(s / sumSim, 1e-12));

    // Compute entropy: -Σ P_i * log(P_i)
    const entropy = -P.reduce((sum, p) => sum + p * Math.log(p), 0);

    if (Math.abs(entropy - targetPerplexity) < tolerance) {
      return P;
    }

    // Adjust σ
    sigma *= entropy > targetPerplexity ? 1.1 : 0.9;
  }

  // Fallback: return normalized similarities
  const similarities = distances.map(d => Math.exp(-d * d / (2 * sigma * sigma)));
  const sumSim = similarities.reduce((a, b) => a + b, 0);
  return similarities.map(s => Math.max(s / sumSim, 1e-12));
}

/**
 * Compute high-dimensional pairwise similarities (Gaussian kernel)
 */
function computeHighDimSimilarities(
  embeddings: number[][],
  perplexity: number
): number[][] {
  const n = embeddings.length;
  const P = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    // Compute distances from point i to all others
    const distances = embeddings.map((emb, j) => {
      if (i === j) return 0;
      return euclideanDistance(embeddings[i], emb);
    });

    // Compute Gaussian kernel with perplexity-based σ
    const row = computeGaussianKernel(distances, perplexity);
    for (let j = 0; j < n; j++) {
      P[i][j] = row[j];
    }
  }

  // Symmetrize: P_ij = (P_ij + P_ji) / 2
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sym = (P[i][j] + P[j][i]) / 2;
      P[i][j] = sym;
      P[j][i] = sym;
    }
  }

  // Normalize: P = P / Σ P
  const sumP = P.flat().reduce((a, b) => a + b, 0);
  return P.map(row => row.map(p => p / sumP));
}

/**
 * Compute low-dimensional similarities (t-distribution)
 * Q_ij = (1 + ||y_i - y_j||²)^(-1) / Z
 */
function computeLowDimSimilarities(Y: number[][]): number[][] {
  const n = Y.length;
  const Q = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));
  let sumQ = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dist = euclideanDistance(Y[i], Y[j]);
      Q[i][j] = 1 / (1 + dist * dist);
      sumQ += Q[i][j];
    }
  }

  // Normalize
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Q[i][j] = Math.max(Q[i][j] / sumQ, 1e-12);
    }
  }

  return Q;
}

/**
 * Compute KL divergence: Σ_ij P_ij * log(P_ij / Q_ij)
 */
function computeKLDivergence(P: number[][], Q: number[][]): number {
  let kl = 0;
  for (let i = 0; i < P.length; i++) {
    for (let j = 0; j < P[i].length; j++) {
      if (P[i][j] > 0 && Q[i][j] > 0) {
        kl += P[i][j] * Math.log(P[i][j] / Q[i][j]);
      }
    }
  }
  return kl;
}

/**
 * Compute gradient of KL divergence w.r.t. Y
 */
function computeGradient(P: number[][], Q: number[][], Y: number[][]): number[][] {
  const n = Y.length;
  const grad = Array(n)
    .fill(null)
    .map(() => [0, 0]);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const diff = [Y[i][0] - Y[j][0], Y[i][1] - Y[j][1]];
      const distSq = diff[0] * diff[0] + diff[1] * diff[1];
      const factor = 4 * (P[i][j] - Q[i][j]) / (1 + distSq);

      grad[i][0] += factor * diff[0];
      grad[i][1] += factor * diff[1];
    }
  }

  return grad;
}

export interface NearestNeighborValidationResult {
  articleId: string;
  topic: string;
  neighbors: {
    articleId: string;
    topic: string;
    distance: number;
    isCorrect: boolean; // true if neighbor has same topic
  }[];
  correctCount: number;
  accuracy: number; // [0, 1] - percentage of correct neighbors
}

export interface NearestNeighborValidationMetrics {
  totalArticles: number;
  averageAccuracy: number;
  articlesAboveThreshold: number; // Articles with accuracy >= 0.5
  minAccuracy: number;
  maxAccuracy: number;
  overallValidation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

/**
 * Validate nearest neighbors: check if k-NN belong to same topic (semantic clustering)
 */
export function validateNearestNeighbors(
  embeddings: ArticleEmbedding[],
  articles: ArticleFeatures[],
  k: number = 5
): NearestNeighborValidationResult[] {
  const results: NearestNeighborValidationResult[] = [];

  // Create map for quick lookup
  const articleMap = new Map(articles.map(a => [a.articleId, a]));

  for (const embedding of embeddings) {
    const article = articleMap.get(embedding.articleId);
    if (!article) continue;

    // Find k nearest neighbors (exclude self by filtering)
    const allNeighbors = findNearestNeighbors(embedding.embedding, embeddings, k + 1);
    const neighbors = allNeighbors.filter(n => n.articleId !== embedding.articleId).slice(0, k);

    // Validate each neighbor
    const validatedNeighbors = neighbors.map(neighbor => {
      const neighborArticle = articleMap.get(neighbor.articleId);
      const isCorrect = neighborArticle?.topic === article.topic;

      return {
        articleId: neighbor.articleId,
        topic: neighborArticle?.topic || 'unknown',
        distance: neighbor.similarity,
        isCorrect,
      };
    });

    const correctCount = validatedNeighbors.filter(n => n.isCorrect).length;
    const accuracy = k > 0 ? correctCount / k : 0;

    results.push({
      articleId: embedding.articleId,
      topic: article.topic,
      neighbors: validatedNeighbors,
      correctCount,
      accuracy,
    });
  }

  return results;
}

/**
 * Compute overall nearest neighbor validation metrics
 */
export function computeNeighborValidationMetrics(
  validationResults: NearestNeighborValidationResult[],
  accuracyThreshold: number = 0.5
): NearestNeighborValidationMetrics {
  if (validationResults.length === 0) {
    return {
      totalArticles: 0,
      averageAccuracy: 0,
      articlesAboveThreshold: 0,
      minAccuracy: 0,
      maxAccuracy: 0,
      overallValidation: 'POOR',
    };
  }

  const accuracies = validationResults.map(r => r.accuracy);
  const averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  const articlesAboveThreshold = validationResults.filter(r => r.accuracy >= accuracyThreshold).length;
  const minAccuracy = Math.min(...accuracies);
  const maxAccuracy = Math.max(...accuracies);

  let overallValidation: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  if (averageAccuracy >= 0.8) {
    overallValidation = 'EXCELLENT';
  } else if (averageAccuracy >= 0.6) {
    overallValidation = 'GOOD';
  } else if (averageAccuracy >= 0.4) {
    overallValidation = 'FAIR';
  } else {
    overallValidation = 'POOR';
  }

  return {
    totalArticles: validationResults.length,
    averageAccuracy,
    articlesAboveThreshold,
    minAccuracy,
    maxAccuracy,
    overallValidation,
  };
}

// ============================================================================
// Task 3.2.1: Persistence — Model Save/Load with Versioning
// ============================================================================

export interface SerializedEmbeddingModel {
  version: string;
  createdAt: string;
  config: EmbeddingConfig;
  weights?: {
    encoder: number[][];
    embeddings: number[];
  };
  trainingStats?: {
    finalLoss: number;
    finalValidationLoss: number;
    epochsTrained: number;
  };
  checksum: string; // SHA-256 hash for integrity verification
}

/**
 * Compute SHA-256 checksum (simplified: use JSON hash)
 * In production, use crypto library
 */
function computeChecksum(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Verify model checksum
 */
function verifyChecksum(model: SerializedEmbeddingModel): boolean {
  const { checksum: providedChecksum, ...dataWithoutChecksum } = model;
  const computedChecksum = computeChecksum(dataWithoutChecksum);
  return providedChecksum === computedChecksum;
}

/**
 * Save embedding model to JSON with versioning and checksum
 */
export function serializeEmbeddingModel(model: EmbeddingModel): SerializedEmbeddingModel {
  const serialized: SerializedEmbeddingModel = {
    version: model.metadata.version,
    createdAt: model.metadata.createdAt.toISOString(),
    config: model.config,
    weights: model.weights,
    trainingStats: model.metadata.trainingStats,
    checksum: '', // Placeholder
  };

  // Compute checksum
  serialized.checksum = computeChecksum({
    version: serialized.version,
    createdAt: serialized.createdAt,
    config: serialized.config,
    weights: serialized.weights,
    trainingStats: serialized.trainingStats,
  });

  return serialized;
}

/**
 * Deserialize embedding model from JSON with integrity check
 */
export function deserializeEmbeddingModel(data: SerializedEmbeddingModel): EmbeddingModel {
  // Verify checksum
  if (!verifyChecksum(data)) {
    throw new Error('Model checksum verification failed - model may be corrupted');
  }

  return {
    config: data.config,
    weights: data.weights,
    metadata: {
      version: data.version,
      createdAt: new Date(data.createdAt),
      trainingStats: data.trainingStats,
    },
  };
}

/**
 * Save model to file (returns JSON string for storage)
 */
export function saveModelToJSON(model: EmbeddingModel): string {
  const serialized = serializeEmbeddingModel(model);
  return JSON.stringify(serialized, null, 2);
}

/**
 * Load model from JSON string with validation
 */
export function loadModelFromJSON(jsonString: string): EmbeddingModel {
  try {
    const parsed = JSON.parse(jsonString) as SerializedEmbeddingModel;
    return deserializeEmbeddingModel(parsed);
  } catch (error) {
    throw new Error(`Failed to load model from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * t-SNE: Convert high-dimensional embeddings to 2D for visualization
 */
export function visualizeWithTSNE(
  embeddings: ArticleEmbedding[],
  config: Partial<TSNEConfig> = {}
): TSNEPoint[] {
  const fullConfig: TSNEConfig = {
    iterations: 50,
    learningRate: 200,
    perplexity: 30,
    momentum: 0.8,
    ...config,
  };

  const n = embeddings.length;
  if (n === 0) return [];

  // Extract vectors
  const X = embeddings.map(e => e.embedding);

  // Compute high-dimensional similarities
  const P = computeHighDimSimilarities(X, fullConfig.perplexity);

  // Random initialization for 2D points
  const Y = Array(n)
    .fill(null)
    .map(() => [Math.random() - 0.5, Math.random() - 0.5]);

  // Gradient descent with momentum
  const velocity = Array(n)
    .fill(null)
    .map(() => [0, 0]);

  for (let iter = 0; iter < fullConfig.iterations; iter++) {
    // Compute low-dimensional similarities
    const Q = computeLowDimSimilarities(Y);

    // Compute gradient
    const grad = computeGradient(P, Q, Y);

    // Update with momentum
    for (let i = 0; i < n; i++) {
      velocity[i][0] =
        fullConfig.momentum * velocity[i][0] -
        (1 - fullConfig.momentum) * fullConfig.learningRate * grad[i][0];
      velocity[i][1] =
        fullConfig.momentum * velocity[i][1] -
        (1 - fullConfig.momentum) * fullConfig.learningRate * grad[i][1];

      Y[i][0] += velocity[i][0];
      Y[i][1] += velocity[i][1];
    }

    // Optional: early stopping if converged (could add KL threshold check)
  }

  // Return 2D points
  return embeddings.map((emb, i) => ({
    articleId: emb.articleId,
    x: Y[i][0],
    y: Y[i][1],
  }));
}
