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
