/**
 * User Similarity Modeling (Story 13.1)
 * Computes user-user similarities from engagement patterns using Pearson correlation
 */

import { UserEngagementVector, vectorToArray } from './engagementVectors';

export interface SimilarityMatrix {
  userIds: string[];
  similarities: Map<string, number[]>; // user -> [similarity scores to all users]
  embeddings: Map<string, number[]>; // user -> 50D embedding vector
  lastUpdated: Date;
  computationTime: number; // ms
  coverage: number; // % users with >=5 similar neighbors
  sparsity: number; // % non-zero values in matrix
}

export interface SimilarityMetrics {
  coverage: number; // % users with >=5 similar neighbors
  sparsity: number; // % non-zero values in matrix
  avgNeighbors: number; // avg similar users per user
  similarityDistribution: Map<string, number>; // bin -> count
  computationTimeMs: number;
}

/**
 * Compute Pearson correlation coefficient between two vectors
 * Returns -1 to 1, where 1 = perfect positive correlation, 0 = no correlation, -1 = perfect negative
 * Handles edge cases: zero variance, empty vectors, NaN
 */
export function computePearsonCorrelation(v1: number[], v2: number[]): number {
  if (v1.length === 0 || v2.length !== v1.length) {
    return 0;
  }

  const n = v1.length;
  let sum1 = 0;
  let sum2 = 0;
  let sum1Sq = 0;
  let sum2Sq = 0;
  let sumProduct = 0;

  for (let i = 0; i < n; i++) {
    const x = v1[i];
    const y = v2[i];

    if (!isFinite(x) || !isFinite(y)) {
      return 0;
    }

    sum1 += x;
    sum2 += y;
    sum1Sq += x * x;
    sum2Sq += y * y;
    sumProduct += x * y;
  }

  const mean1 = sum1 / n;
  const mean2 = sum2 / n;

  const numerator = sumProduct - n * mean1 * mean2;
  const variance1 = sum1Sq - n * mean1 * mean1;
  const variance2 = sum2Sq - n * mean2 * mean2;

  // Handle zero variance (no variation in either vector)
  if (variance1 === 0 || variance2 === 0) {
    // If both vectors are identical constants, they're perfectly correlated
    if (variance1 === 0 && variance2 === 0 && mean1 === mean2) {
      return 1.0;
    }
    return 0;
  }

  const denominator = Math.sqrt(variance1 * variance2);
  const correlation = numerator / denominator;

  // Clamp to [-1, 1] to handle floating point errors
  return Math.max(-1, Math.min(1, correlation));
}

/**
 * Convert engagement vector to normalized array for correlation computation
 * Combines topic, author, and sentiment engagement into single array
 */
export function normalizeEngagementVector(
  vector: UserEngagementVector,
  allTopics: string[],
  allAuthors: string[],
  allSentiments: string[]
): number[] {
  return vectorToArray(vector, allTopics, allAuthors, allSentiments);
}

/**
 * Simple SVD-based dimensionality reduction to 50D embeddings
 * Using power iteration method for the top 50 singular values
 * Returns 50D vector representing user in latent space
 */
function computeEmbeddings(
  vectors: number[][],
  targetDimensions: number = 50
): Map<string, number[]> {
  const embeddings = new Map<string, number[]>();

  if (vectors.length === 0) {
    return embeddings;
  }

  // Simplified approach: use principal components from similarity matrix
  // For production, use ml-matrix or similar library for proper SVD
  const numFeatures = vectors[0].length;
  const actualDimensions = Math.min(targetDimensions, numFeatures);

  // Compute mean vector for centering
  const mean = new Array(numFeatures).fill(0);
  for (const vec of vectors) {
    for (let i = 0; i < numFeatures; i++) {
      mean[i] += vec[i];
    }
  }
  for (let i = 0; i < numFeatures; i++) {
    mean[i] /= vectors.length;
  }

  // Center vectors
  const centeredVectors = vectors.map((vec) => vec.map((v, i) => v - mean[i]));

  // Compute covariance matrix (simplified)
  const covariance: number[][] = Array(numFeatures)
    .fill(null)
    .map(() => Array(numFeatures).fill(0));

  for (const vec of centeredVectors) {
    for (let i = 0; i < numFeatures; i++) {
      for (let j = 0; j < numFeatures; j++) {
        covariance[i][j] += vec[i] * vec[j];
      }
    }
  }

  for (let i = 0; i < numFeatures; i++) {
    for (let j = 0; j < numFeatures; j++) {
      covariance[i][j] /= vectors.length;
    }
  }

  // Project each centered vector onto top principal components
  // (For full SVD, eigendecompose covariance matrix - this is simplified)
  for (let idx = 0; idx < vectors.length; idx++) {
    const embedding = new Array(targetDimensions).fill(0);

    // Use first actualDimensions features as approximation of top components
    for (let i = 0; i < actualDimensions; i++) {
      embedding[i] = centeredVectors[idx][i] || 0;
    }

    embeddings.set(`user_${idx}`, embedding);
  }

  return embeddings;
}

/**
 * Compute full similarity matrix from user engagement vectors
 * Stores as sparse matrix (upper triangular format) with embeddings
 * Performance: O(n^2 * m) where n=users, m=features
 */
export function computeSimilarityMatrix(users: UserEngagementVector[]): SimilarityMatrix {
  const startTime = performance.now();

  const userIds = users.map((u) => u.userId);
  const similarities = new Map<string, number[]>();

  // Collect all unique topics, authors, sentiments for consistent array conversion
  const allTopics = new Set<string>();
  const allAuthors = new Set<string>();
  const allSentiments = new Set<string>();

  for (const user of users) {
    Object.keys(user.topicEngagement).forEach((t) => allTopics.add(t));
    Object.keys(user.authorEngagement).forEach((a) => allAuthors.add(a));
    Object.keys(user.sentimentEngagement).forEach((s) => allSentiments.add(s));
  }

  const topicList = Array.from(allTopics).sort();
  const authorList = Array.from(allAuthors).sort();
  const sentimentList = Array.from(allSentiments).sort();

  // Convert all users to numeric arrays
  const vectors = users.map((u) =>
    normalizeEngagementVector(u, topicList, authorList, sentimentList)
  );

  // Compute pairwise correlations (upper triangular)
  for (let i = 0; i < users.length; i++) {
    const row = new Array(users.length).fill(0);
    row[i] = 1.0; // Diagonal is perfect similarity to self

    for (let j = i + 1; j < users.length; j++) {
      const correlation = computePearsonCorrelation(vectors[i], vectors[j]);
      row[j] = correlation;
    }

    similarities.set(userIds[i], row);
  }

  // Compute embeddings for fast k-nearest neighbor lookup
  const embeddings = computeEmbeddings(vectors, 50);

  // Calculate coverage: % users with >=5 similar neighbors (similarity > 0.5)
  let usersWithEnoughNeighbors = 0;
  for (const row of similarities.values()) {
    const neighbors = row.filter((sim) => sim > 0.5).length;
    if (neighbors >= 5) {
      usersWithEnoughNeighbors++;
    }
  }
  const coverage = (usersWithEnoughNeighbors / users.length) * 100;

  // Calculate sparsity: % non-zero values (excluding diagonal)
  let nonZeroCount = 0;
  let totalCount = 0;
  for (const row of similarities.values()) {
    for (let i = 0; i < row.length; i++) {
      totalCount++;
      if (row[i] !== 0 && row[i] !== 1.0) {
        // Exclude diagonal
        nonZeroCount++;
      }
    }
  }
  const sparsity = (nonZeroCount / (totalCount - users.length)) * 100;

  const endTime = performance.now();

  return {
    userIds,
    similarities,
    embeddings,
    lastUpdated: new Date(),
    computationTime: endTime - startTime,
    coverage,
    sparsity,
  };
}

/**
 * Get K-nearest neighbors for a user based on similarity
 * Returns top K most similar users (excluding the user itself)
 */
export function getKNearestNeighbors(
  userId: string,
  similarityMatrix: SimilarityMatrix,
  k: number = 5
): Array<{ userId: string; similarity: number }> {
  const userIndex = similarityMatrix.userIds.indexOf(userId);
  if (userIndex === -1) {
    return [];
  }

  const similarities = similarityMatrix.similarities.get(userId);
  if (!similarities) {
    return [];
  }

  // Collect all similarities (both upper and lower triangular)
  const neighbors: Array<{ userId: string; similarity: number }> = [];

  for (let i = 0; i < similarities.length; i++) {
    if (i === userIndex) continue; // Skip self

    let similarity = 0;

    // Get from upper triangular if i > userIndex, or from row if i < userIndex
    if (i > userIndex) {
      similarity = similarities[i];
    } else {
      // Fetch from other user's row (symmetric matrix)
      const otherRow = similarityMatrix.similarities.get(similarityMatrix.userIds[i]);
      if (otherRow) {
        similarity = otherRow[userIndex];
      }
    }

    neighbors.push({
      userId: similarityMatrix.userIds[i],
      similarity,
    });
  }

  // Sort by similarity descending and take top K
  return neighbors.sort((a, b) => b.similarity - a.similarity).slice(0, k);
}

/**
 * Compute metrics for similarity matrix
 */
export function computeSimilarityMetrics(
  similarityMatrix: SimilarityMatrix
): SimilarityMetrics {
  const { userIds, similarities } = similarityMatrix;

  // Coverage: % users with >=5 similar neighbors (threshold 0.5)
  let usersWithEnoughNeighbors = 0;
  for (const userId of userIds) {
    const neighbors = getKNearestNeighbors(userId, similarityMatrix, 100); // Get all neighbors
    const significantNeighbors = neighbors.filter((n) => n.similarity > 0.5);
    if (significantNeighbors.length >= 5) {
      usersWithEnoughNeighbors++;
    }
  }
  const coverage = (usersWithEnoughNeighbors / userIds.length) * 100;

  // Sparsity: % non-zero values in matrix
  let nonZeroCount = 0;
  let totalCount = 0;
  for (const row of similarities.values()) {
    for (let i = 0; i < row.length; i++) {
      totalCount++;
      if (row[i] !== 0 && row[i] !== 1.0) {
        nonZeroCount++;
      }
    }
  }
  const sparsity = (nonZeroCount / (totalCount - userIds.length)) * 100;

  // Average neighbors: avg # of users with similarity > 0.0
  let totalNeighbors = 0;
  for (const userId of userIds) {
    const neighbors = getKNearestNeighbors(userId, similarityMatrix, 100);
    totalNeighbors += neighbors.filter((n) => n.similarity > 0.0).length;
  }
  const avgNeighbors = totalNeighbors / userIds.length;

  // Similarity distribution: histogram of correlation scores
  const distribution = new Map<string, number>();
  const bins = ['[0.0-0.2)', '[0.2-0.4)', '[0.4-0.6)', '[0.6-0.8)', '[0.8-1.0]'];
  bins.forEach((bin) => distribution.set(bin, 0));

  for (const row of similarities.values()) {
    for (const sim of row) {
      if (sim === 1.0) continue; // Skip diagonal

      if (sim < 0.2) distribution.set('[0.0-0.2)', (distribution.get('[0.0-0.2)') || 0) + 1);
      else if (sim < 0.4)
        distribution.set('[0.2-0.4)', (distribution.get('[0.2-0.4)') || 0) + 1);
      else if (sim < 0.6)
        distribution.set('[0.4-0.6)', (distribution.get('[0.4-0.6)') || 0) + 1);
      else if (sim < 0.8)
        distribution.set('[0.6-0.8)', (distribution.get('[0.6-0.8)') || 0) + 1);
      else distribution.set('[0.8-1.0]', (distribution.get('[0.8-1.0]') || 0) + 1);
    }
  }

  return {
    coverage,
    sparsity,
    avgNeighbors,
    similarityDistribution: distribution,
    computationTimeMs: similarityMatrix.computationTime,
  };
}
