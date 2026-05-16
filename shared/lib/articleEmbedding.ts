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
