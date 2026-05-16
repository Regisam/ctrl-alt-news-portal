/**
 * Click Prediction Neural Network (Story 13.5)
 * Predicts whether a user will click on an article given engagement history and article features.
 * Uses LSTM for sequence modeling + attention for explainability.
 */

// ============================================================================
// Task 1.1: Design Neural Architecture - Interfaces & Types
// ============================================================================

export interface UserEngagementHistory {
  userId: string;
  engagedArticles: {
    articleId: string;
    engagementScore: number; // [0, 1] normalized click/bookmark/read time
    timestamp: Date;
  }[];
  topicsOfInterest: string[]; // Derived from history
  engagementProfile: {
    avgReadTime: number; // Normalized [0, 1]
    clickRate: number; // [0, 1]
    bookmarkRate: number; // [0, 1]
    diversityScore: number; // [0, 1] - topic diversity
  };
}

export interface ClickPrediction {
  userId: string;
  articleId: string;
  clickProbability: number; // [0, 1]
  confidence: number; // Max attention weight
  explanation: {
    topInfluentialArticles: string[]; // Top 3 articles from attention
    importantFeatures: string[]; // Features influencing prediction
  };
}

export interface TrainingExample {
  userHistory: UserEngagementHistory;
  articleId: string;
  articleEmbedding: number[];
  topic: string;
  label: number; // 1 = clicked, 0 = not clicked
}

export interface TrainingConfig {
  learningRate: number;
  batchSize: number;
  epochs: number;
  sequenceLength: number;
  lstmHiddenDim: number;
  denseHiddenDim: number;
  dropoutRate: number;
  validationSplit: number;
  classWeight: number; // Weight for positive class (click=1)
}

export interface TrainingMetrics {
  finalLoss: number;
  finalValidationLoss: number;
  finalAuc: number;
  finalPrecision: number;
  epochsTrained: number;
  trainingTimeMs: number;
  lossPerEpoch: number[];
  valLossPerEpoch: number[];
  aucPerEpoch: number[];
}

export interface ModelState {
  lstm: {
    input: number[][];
    hidden: number[][];
    bias: number[];
  };
  attention: {
    queryWeights: number[][];
    keyWeights: number[][];
    valueWeights: number[][];
  };
  denseLayer: {
    weights: number[][];
    bias: number[];
  };
  outputLayer: {
    weights: number[];
    bias: number;
  };
  version: string;
  createdAt: Date;
}

// ============================================================================
// Task 1.2: Implement Engagement Data Pipeline
// ============================================================================

export function normalizeEngagementProfile(
  articles: Array<{ engagementScore: number }>,
  clickCount: number,
  bookmarkCount: number
): {
  avgReadTime: number;
  clickRate: number;
  bookmarkRate: number;
  diversityScore: number;
} {
  const totalArticles = Math.max(articles.length, 1);
  const avgReadTime = articles.length > 0
    ? articles.reduce((sum, a) => sum + a.engagementScore, 0) / articles.length
    : 0;

  const clickRate = Math.min(clickCount / Math.max(totalArticles, 1), 1.0);
  const bookmarkRate = Math.min(bookmarkCount / Math.max(totalArticles, 1), 1.0);

  // Topic diversity score: percentage of unique topics
  const topics = new Set<string>();
  const diversityScore = topics.size > 0 ? Math.min(topics.size / Math.max(totalArticles, 5), 1.0) : 0;

  return {
    avgReadTime: Math.min(avgReadTime, 1.0),
    clickRate,
    bookmarkRate,
    diversityScore,
  };
}

export function encodeUserSequence(
  history: UserEngagementHistory,
  sequenceLength: number = 32
): { sequence: number[][]; recentArticles: string[] } {
  // Sort by recency (most recent first)
  const sortedArticles = [...history.engagedArticles].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const recentArticles = sortedArticles.slice(0, sequenceLength).map(a => a.articleId);

  // Encode each article as feature vector [engagementScore, recencyWeight, topicMatch]
  const now = Date.now();
  const sequence: number[][] = [];

  for (let i = 0; i < sequenceLength; i++) {
    if (i < sortedArticles.length) {
      const article = sortedArticles[i];
      const recencyDays = (now - new Date(article.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      const recencyWeight = Math.exp(-recencyDays / 30); // Exponential decay over 30 days

      sequence.push([
        article.engagementScore,
        recencyWeight,
        history.engagementProfile.avgReadTime,
        history.engagementProfile.clickRate,
      ]);
    } else {
      // Padding: zeros for unused sequence positions
      sequence.push([0, 0, 0, 0]);
    }
  }

  return { sequence, recentArticles };
}

// ============================================================================
// Task 2.1.1: LSTM Sequence Encoder
// ============================================================================

class LSTMCell {
  private weights: {
    input: number[][];
    hidden: number[][];
    bias: number[];
  };
  private hiddenDim: number;

  constructor(inputDim: number, hiddenDim: number) {
    this.hiddenDim = hiddenDim;
    this.weights = {
      input: this.randomMatrix(inputDim, hiddenDim * 4),
      hidden: this.randomMatrix(hiddenDim, hiddenDim * 4),
      bias: Array(hiddenDim * 4).fill(0),
    };
  }

  forward(
    input: number[],
    prevHidden: number[],
    prevCell: number[]
  ): { hidden: number[]; cell: number[] } {
    const combined = [...input, ...prevHidden];

    // Combined input transformation
    const rawGates = this.matVecMul(this.weights.input, input)
      .map((x, i) => x + this.matVecMul(this.weights.hidden, prevHidden)[i] + this.weights.bias[i]);

    // Split into 4 gates: input, forget, cell, output
    const dim = this.hiddenDim;
    const inputGate = rawGates.slice(0, dim).map(x => this.sigmoid(x));
    const forgetGate = rawGates.slice(dim, 2 * dim).map(x => this.sigmoid(x));
    const cellGate = rawGates.slice(2 * dim, 3 * dim).map(x => Math.tanh(x));
    const outputGate = rawGates.slice(3 * dim).map(x => this.sigmoid(x));

    // Cell state update
    const cell = prevCell.map((c, i) => forgetGate[i] * c + inputGate[i] * cellGate[i]);

    // Hidden state update
    const hidden = cell.map((c, i) => outputGate[i] * Math.tanh(c));

    return { hidden, cell };
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-Math.min(Math.max(x, -500), 500)));
  }

  private matVecMul(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, w, i) => sum + w * (vector[i] || 0), 0));
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    const scale = Math.sqrt(2.0 / (rows + cols));
    return Array(rows)
      .fill(0)
      .map(() =>
        Array(cols)
          .fill(0)
          .map(() => (Math.random() - 0.5) * scale)
      );
  }

  getWeights() {
    return this.weights;
  }

  setWeights(weights: { input: number[][]; hidden: number[][]; bias: number[] }) {
    this.weights = {
      input: weights.input,
      hidden: weights.hidden,
      bias: weights.bias,
    };
  }
}

// ============================================================================
// Task 2.1.2: Attention Mechanism (Bahdanau-style)
// ============================================================================

class AttentionLayer {
  private queryWeights: number[][];
  private keyWeights: number[][];
  private valueWeights: number[][];
  private lastAttentionWeights: number[] = [];

  constructor(hiddenDim: number, private scaleFactor: number = Math.sqrt(hiddenDim)) {
    this.queryWeights = this.randomMatrix(hiddenDim, hiddenDim);
    this.keyWeights = this.randomMatrix(hiddenDim, hiddenDim);
    this.valueWeights = this.randomMatrix(hiddenDim, hiddenDim);
  }

  forward(query: number[], keys: number[][]): { output: number[]; weights: number[] } {
    // Compute attention scores: Q · K^T
    const queryTransformed = this.matVecMul(this.queryWeights, query);

    const scores = keys.map(key => {
      const keyTransformed = this.matVecMul(this.keyWeights, key);
      return this.dotProduct(queryTransformed, keyTransformed) / this.scaleFactor;
    });

    // Softmax to get attention weights
    const maxScore = Math.max(...scores);
    const expScores = scores.map(s => Math.exp(s - maxScore));
    const sumExp = expScores.reduce((a, b) => a + b, 1e-8);
    const weights = expScores.map(s => s / sumExp);

    this.lastAttentionWeights = weights;

    // Weighted sum of values
    const output = new Array(query.length).fill(0);
    for (let i = 0; i < keys.length; i++) {
      const valueTransformed = this.matVecMul(this.valueWeights, keys[i]);
      for (let j = 0; j < output.length; j++) {
        output[j] += weights[i] * valueTransformed[j];
      }
    }

    return { output, weights };
  }

  private matVecMul(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, w, i) => sum + w * (vector[i] || 0), 0));
  }

  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, x, i) => sum + x * (b[i] || 0), 0);
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    const scale = Math.sqrt(2.0 / (rows + cols));
    return Array(rows)
      .fill(0)
      .map(() =>
        Array(cols)
          .fill(0)
          .map(() => (Math.random() - 0.5) * scale)
      );
  }

  getLastAttentionWeights(): number[] {
    return this.lastAttentionWeights;
  }

  getWeights() {
    return {
      queryWeights: this.queryWeights,
      keyWeights: this.keyWeights,
      valueWeights: this.valueWeights,
    };
  }

  setWeights(weights: { queryWeights: number[][]; keyWeights: number[][]; valueWeights: number[][] }) {
    this.queryWeights = weights.queryWeights;
    this.keyWeights = weights.keyWeights;
    this.valueWeights = weights.valueWeights;
  }
}

// ============================================================================
// Task 2.1: Implement Click Prediction Model
// ============================================================================

export class ClickPredictionModel {
  private lstm: LSTMCell;
  private attention: AttentionLayer;
  private denseWeights: number[][];
  private denseBias: number[];
  private outputWeights: number[];
  private outputBias: number;
  private config: TrainingConfig;
  private lastAttentionWeights: number[] = [];
  private lastTopArticles: string[] = [];

  constructor(config: TrainingConfig) {
    this.config = config;
    const hiddenDim = config.lstmHiddenDim;

    this.lstm = new LSTMCell(4 + 128, hiddenDim); // 4 from sequence + 128 from embedding
    this.attention = new AttentionLayer(hiddenDim);

    // Dense layer: hiddenDim → denseHiddenDim
    this.denseWeights = this.randomMatrix(hiddenDim, config.denseHiddenDim);
    this.denseBias = Array(config.denseHiddenDim).fill(0);

    // Output layer: denseHiddenDim → 1 (sigmoid for probability)
    this.outputWeights = Array(config.denseHiddenDim)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 0.1);
    this.outputBias = 0;
  }

  predict(
    userHistory: UserEngagementHistory,
    articleEmbedding: number[],
    topic: string
  ): ClickPrediction {
    const { sequence, recentArticles } = encodeUserSequence(userHistory, this.config.sequenceLength);

    // LSTM forward pass
    let hidden = Array(this.config.lstmHiddenDim).fill(0);
    let cell = Array(this.config.lstmHiddenDim).fill(0);
    const lstmSequence: number[][] = [];

    for (const step of sequence) {
      const input = [...step, ...articleEmbedding];
      const result = this.lstm.forward(input, hidden, cell);
      hidden = result.hidden;
      cell = result.cell;
      lstmSequence.push(hidden);
    }

    // Attention over LSTM sequence
    const { output: attentionOutput, weights } = this.attention.forward(hidden, lstmSequence);
    this.lastAttentionWeights = weights;

    // Get top influential articles
    const topIndices = weights
      .map((w, i) => ({ weight: w, index: i }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(x => recentArticles[x.index]);
    this.lastTopArticles = topIndices.filter(x => !!x);

    // Dense layer + dropout
    let denseInput = this.matVecMul(this.denseWeights, attentionOutput);
    denseInput = denseInput.map(x => Math.max(0, x)); // ReLU
    denseInput = denseInput.map(() => Math.random() > this.config.dropoutRate ? 1.0 : 0); // Dropout

    // Output layer (sigmoid)
    const logit = this.matVecMul([this.outputWeights], denseInput)[0] + this.outputBias;
    const clickProbability = 1 / (1 + Math.exp(-Math.min(Math.max(logit, -500), 500)));

    return {
      userId: userHistory.userId,
      articleId: 'unknown', // Will be set by caller
      clickProbability,
      confidence: Math.max(...weights),
      explanation: {
        topInfluentialArticles: this.lastTopArticles,
        importantFeatures: [
          `clickRate: ${userHistory.engagementProfile.clickRate.toFixed(2)}`,
          `avgReadTime: ${userHistory.engagementProfile.avgReadTime.toFixed(2)}`,
          `topic: ${topic}`,
        ],
      },
    };
  }

  async train(
    trainingData: TrainingExample[],
    validationData: TrainingExample[],
    config: TrainingConfig
  ): Promise<TrainingMetrics> {
    const startTime = Date.now();
    const lossPerEpoch: number[] = [];
    const valLossPerEpoch: number[] = [];
    const aucPerEpoch: number[] = [];

    let bestValLoss = Infinity;
    const learningRate = config.learningRate;

    for (let epoch = 0; epoch < config.epochs; epoch++) {
      // Training phase
      let epochLoss = 0;
      const batchSize = config.batchSize;

      for (let i = 0; i < trainingData.length; i += batchSize) {
        const batch = trainingData.slice(i, Math.min(i + batchSize, trainingData.length));

        for (const example of batch) {
          const prediction = this.predict(example.userHistory, example.articleEmbedding, example.topic);

          // Binary cross-entropy loss with class weighting
          const weight = example.label === 1 ? config.classWeight : 1.0;
          const loss =
            -weight *
            (example.label * Math.log(Math.max(prediction.clickProbability, 1e-8)) +
              (1 - example.label) * Math.log(Math.max(1 - prediction.clickProbability, 1e-8)));

          epochLoss += loss;

          // Gradient descent (simplified: no backprop, just perturb weights)
          this.outputBias -= learningRate * (prediction.clickProbability - example.label) * weight;
        }
      }

      lossPerEpoch.push(epochLoss / trainingData.length);

      // Validation phase
      let valLoss = 0;
      let predictions: { pred: number; actual: number }[] = [];

      for (const example of validationData) {
        const prediction = this.predict(example.userHistory, example.articleEmbedding, example.topic);
        const weight = example.label === 1 ? config.classWeight : 1.0;
        const loss =
          -weight *
          (example.label * Math.log(Math.max(prediction.clickProbability, 1e-8)) +
            (1 - example.label) * Math.log(Math.max(1 - prediction.clickProbability, 1e-8)));

        valLoss += loss;
        predictions.push({ pred: prediction.clickProbability, actual: example.label });
      }

      valLoss /= validationData.length;
      valLossPerEpoch.push(valLoss);

      // Compute AUC
      const auc = this.computeAUC(predictions);
      aucPerEpoch.push(auc);

      if (valLoss < bestValLoss) {
        bestValLoss = valLoss;
      }
    }

    const finalPrecision = this.computePrecisionAtK(
      validationData.map(ex => ({
        pred: this.predict(ex.userHistory, ex.articleEmbedding, ex.topic).clickProbability,
        actual: ex.label,
      })),
      0.5
    );

    return {
      finalLoss: lossPerEpoch[lossPerEpoch.length - 1],
      finalValidationLoss: valLossPerEpoch[valLossPerEpoch.length - 1],
      finalAuc: aucPerEpoch[aucPerEpoch.length - 1],
      finalPrecision,
      epochsTrained: config.epochs,
      trainingTimeMs: Date.now() - startTime,
      lossPerEpoch,
      valLossPerEpoch,
      aucPerEpoch,
    };
  }

  private computeAUC(predictions: { pred: number; actual: number }[]): number {
    // Sort by prediction score
    const sorted = [...predictions].sort((a, b) => b.pred - a.pred);

    const positives = sorted.filter(p => p.actual === 1).length;
    const negatives = sorted.filter(p => p.actual === 0).length;

    if (positives === 0 || negatives === 0) return 0.5;

    let tp = 0;
    let fp = 0;
    let prevThreshold = -1;
    let auc = 0;

    for (const pred of sorted) {
      if (pred.actual === 1) {
        tp++;
      } else {
        fp++;
      }
    }

    // Simplified AUC: ROC curve approximation
    tp = 0;
    fp = 0;
    let prevTpr = 0;
    let prevFpr = 0;

    for (const pred of sorted) {
      if (pred.actual === 1) {
        tp++;
      } else {
        fp++;
      }

      const tpr = tp / positives;
      const fpr = fp / negatives;
      auc += (fpr - prevFpr) * (tpr + prevTpr) / 2;

      prevTpr = tpr;
      prevFpr = fpr;
    }

    return Math.min(auc, 1.0);
  }

  private computePrecisionAtK(predictions: { pred: number; actual: number }[], threshold: number): number {
    const positive = predictions.filter(p => p.pred >= threshold);
    if (positive.length === 0) return 0;

    const correctPositives = positive.filter(p => p.actual === 1).length;
    return correctPositives / positive.length;
  }

  private matVecMul(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => row.reduce((sum, w, i) => sum + w * (vector[i] || 0), 0));
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    const scale = Math.sqrt(2.0 / (rows + cols));
    return Array(rows)
      .fill(0)
      .map(() =>
        Array(cols)
          .fill(0)
          .map(() => (Math.random() - 0.5) * scale)
      );
  }

  getModelState(): ModelState {
    return {
      lstm: this.lstm.getWeights(),
      attention: this.attention.getWeights(),
      denseLayer: {
        weights: this.denseWeights,
        bias: this.denseBias,
      },
      outputLayer: {
        weights: this.outputWeights,
        bias: this.outputBias,
      },
      version: '1.0.0',
      createdAt: new Date(),
    };
  }

  setModelState(state: ModelState) {
    this.lstm.setWeights(state.lstm);
    this.attention.setWeights(state.attention);
    this.denseWeights = state.denseLayer.weights;
    this.denseBias = state.denseLayer.bias;
    this.outputWeights = state.outputLayer.weights;
    this.outputBias = state.outputLayer.bias;
  }
}

// ============================================================================
// Task 3.1: Inference & Caching
// ============================================================================

interface PredictionCacheEntry {
  prediction: ClickPrediction;
  timestamp: Date;
}

export class ClickPredictionCache {
  private cache = new Map<string, PredictionCacheEntry>();
  private ttlMs = 3600000; // 1 hour

  set(key: string, prediction: ClickPrediction): void {
    this.cache.set(key, {
      prediction,
      timestamp: new Date(),
    });
  }

  get(key: string): ClickPrediction | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const ageMs = Date.now() - entry.timestamp.getTime();
    if (ageMs > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.prediction;
  }

  getCacheKey(userId: string, articleId: string): string {
    return `${userId}:${articleId}`;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Placeholder - track in production
    };
  }
}

export async function batchPredictWithCaching(
  model: ClickPredictionModel,
  cache: ClickPredictionCache,
  userHistory: UserEngagementHistory,
  articles: Array<{ articleId: string; embedding: number[]; topic: string }>,
  batchSize: number = 32
): Promise<ClickPrediction[]> {
  const predictions: ClickPrediction[] = [];
  let cacheHits = 0;

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, Math.min(i + batchSize, articles.length));

    for (const article of batch) {
      const cacheKey = cache.getCacheKey(userHistory.userId, article.articleId);
      let prediction = cache.get(cacheKey);

      if (prediction) {
        cacheHits++;
      } else {
        prediction = model.predict(userHistory, article.embedding, article.topic);
        prediction.articleId = article.articleId;
        cache.set(cacheKey, prediction);
      }

      predictions.push(prediction);
    }
  }

  return predictions;
}

// ============================================================================
// Task 3.2: Cold-Start Handling
// ============================================================================

export function predictForNewUser(
  model: ClickPredictionModel,
  articleEmbedding: number[],
  topic: string,
  demographicProfile?: { avgClickRate: number; avgReadTime: number }
): ClickPrediction {
  // Create synthetic history for new user
  const defaultProfile = {
    avgReadTime: demographicProfile?.avgReadTime || 0.3,
    clickRate: demographicProfile?.avgClickRate || 0.15,
    bookmarkRate: 0.05,
    diversityScore: 0.2,
  };

  const syntheticHistory: UserEngagementHistory = {
    userId: 'new-user',
    engagedArticles: [],
    topicsOfInterest: [topic],
    engagementProfile: defaultProfile,
  };

  return model.predict(syntheticHistory, articleEmbedding, topic);
}

export function predictForNewArticle(
  model: ClickPredictionModel,
  userHistory: UserEngagementHistory,
  articleEmbedding: number[],
  topic: string
): ClickPrediction {
  // Directly use embedding similarity and user interest
  const topicMatch = userHistory.topicsOfInterest.includes(topic) ? 0.5 : 0.2;
  const baselineScore = userHistory.engagementProfile.clickRate * topicMatch;

  // Use model prediction as confidence booster
  const prediction = model.predict(userHistory, articleEmbedding, topic);

  // Combine baseline with model prediction
  return {
    ...prediction,
    clickProbability: (prediction.clickProbability + baselineScore) / 2,
  };
}

export function fallbackToCollaborativeFiltering(
  userHistory: UserEngagementHistory,
  topicMatch: number,
  similarUserClickRate: number = 0.2
): number {
  // Fallback: blend user's own click history with similar users
  const userScore = userHistory.engagementProfile.clickRate;
  const similarScore = similarUserClickRate;
  const topicBoost = topicMatch * 0.3;

  return Math.min((userScore * 0.6 + similarScore * 0.4 + topicBoost), 1.0);
}
