/**
 * Item Collaborative Filtering (Story 13.2 - Phase 1)
 * Computes item-item similarity using Jaccard and cosine similarity
 * Powers CF recommendations based on articles read together by similar users
 */

export interface ItemSimilarityMatrix {
  articleIds: string[];
  similarities: Map<string, number[]>; // article -> [similarity to all articles]
  lastUpdated: Date;
  computationTimeMs: number;
}

export interface CFRecommendation {
  articleId: string;
  score: number; // normalized 0-1
  reason: string; // "Users like you also read..."
  similarUserCount: number; // how many similar users read this
}

/**
 * Compute Jaccard similarity between two sets
 * Jaccard = |intersection| / |union|
 * Returns 0-1 range
 */
export function computeJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 && set2.size === 0) {
    return 1.0; // Both empty = identical
  }

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) {
    return 0.0;
  }

  return intersection.size / union.size;
}

/**
 * Compute cosine similarity between two engagement vectors
 * Cosine = dot_product / (magnitude1 * magnitude2)
 * Returns 0-1 range
 */
export function computeCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length === 0 || vec2.length === 0) {
    return 0.0;
  }

  if (vec1.length !== vec2.length) {
    throw new Error(
      `Vector length mismatch: ${vec1.length} vs ${vec2.length}`
    );
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    const v1 = vec1[i] ?? 0;
    const v2 = vec2[i] ?? 0;

    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  // Handle zero vectors
  if (mag1 === 0 || mag2 === 0) {
    return 0.0;
  }

  const similarity = dotProduct / (mag1 * mag2);

  // Clamp to [0, 1] range (numerical errors can produce slight negatives/overflow)
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Build item-item similarity matrix from article read sets
 * Uses Jaccard similarity on reader sets
 */
export function computeItemSimilarityMatrix(
  articleReadersMap: Map<string, Set<string>>
): ItemSimilarityMatrix {
  const startTime = performance.now();
  const articleIds = Array.from(articleReadersMap.keys()).sort();
  const similarities = new Map<string, number[]>();

  // Compute pairwise Jaccard similarity
  for (let i = 0; i < articleIds.length; i++) {
    const article1 = articleIds[i];
    const readers1 = articleReadersMap.get(article1);

    if (!readers1) {
      similarities.set(article1, new Array(articleIds.length).fill(0));
      continue;
    }

    const row: number[] = [];
    for (let j = 0; j < articleIds.length; j++) {
      const article2 = articleIds[j];
      const readers2 = articleReadersMap.get(article2);

      if (!readers2) {
        row.push(0);
        continue;
      }

      const sim = computeJaccardSimilarity(readers1, readers2);
      row.push(sim);
    }

    similarities.set(article1, row);
  }

  const computationTimeMs = performance.now() - startTime;

  return {
    articleIds,
    similarities,
    lastUpdated: new Date(),
    computationTimeMs,
  };
}

/**
 * Get K-nearest articles for a given article
 * Returns top-K most similar articles (excluding self)
 */
export function getKNearestArticles(
  articleId: string,
  itemMatrix: ItemSimilarityMatrix,
  k: number = 5
): { articleId: string; similarity: number }[] {
  const similarities = itemMatrix.similarities.get(articleId);

  if (!similarities) {
    return [];
  }

  const indexed = itemMatrix.articleIds
    .map((id, idx) => ({
      articleId: id,
      similarity: similarities[idx] ?? 0,
    }))
    .filter((item) => item.articleId !== articleId) // Exclude self
    .sort((a, b) => b.similarity - a.similarity) // Descending
    .slice(0, k);

  return indexed;
}

/**
 * Validate similarity matrix structure
 */
export function validateItemSimilarityMatrix(
  matrix: ItemSimilarityMatrix
): { valid: boolean; reason?: string } {
  if (!matrix.articleIds || matrix.articleIds.length === 0) {
    return { valid: true }; // Empty matrix is valid (no articles yet)
  }

  const expectedLength = matrix.articleIds.length;

  for (const [articleId, row] of matrix.similarities.entries()) {
    if (!Array.isArray(row) || row.length !== expectedLength) {
      return {
        valid: false,
        reason: `Article ${articleId} has ${row?.length ?? 0} similarities, expected ${expectedLength}`,
      };
    }

    for (let i = 0; i < row.length; i++) {
      const sim = row[i];
      if (!Number.isFinite(sim) || sim < 0 || sim > 1) {
        return {
          valid: false,
          reason: `Article ${articleId} has invalid similarity ${sim} at index ${i}`,
        };
      }
    }
  }

  return { valid: true };
}
