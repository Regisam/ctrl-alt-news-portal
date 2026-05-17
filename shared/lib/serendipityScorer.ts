/**
 * Serendipity Scoring Engine (Story 13.6)
 * Recommends articles outside user's primary interests to drive discovery and retention
 *
 * Algorithm: Blends topic distance + collaborative novelty + article quality
 * Formula: serendipity_score = (topic_distance * 0.4) + (collaborative_gap * 0.4) + (article_quality * 0.2)
 */

// ============================================================================
// Interfaces & Types (Task 1.1: Design algorithm)
// ============================================================================

export interface SerendipityInput {
  userId: string;
  userPrimaryTopics: string[]; // Topics user engages with (e.g., ['AI', 'Science'])
  userReadHistory: Set<string>; // Article IDs user has read
  candidateArticles: ArticleFeature[];
}

export interface ArticleFeature {
  articleId: string;
  topic: string;
  title: string;
  embedding: number[]; // 128D from Article Embedding Model (Story 13.4)
}

export interface SerendipityRanking {
  articleId: string;
  topic: string;
  serendipityScore: number; // [0, 1]
  topicDistance: number; // [0, 1] - how far from primary topics
  collaborativeNovelty: number; // [0, 1] - similar users like it but user hasn't read
  articleQuality: number; // [0, 1] - click-prediction probability
  noveltyReason: string; // Explanation: "Topic-distant from your interests", etc.
}

export interface TopicEmbeddings {
  embeddings: Map<string, number[]>; // topic -> 128D vector
  lastUpdated: Date;
}

export interface CollaborativeContext {
  userId: string;
  similarUsers: string[]; // k-nearest neighbors
  similarUserReadHistories: Map<string, Set<string>>; // user -> read article IDs
  similarityScores: Map<string, number>; // user -> similarity [0, 1]
}

// ============================================================================
// Subtask 1.1.1: Topic Distance Metric in Embedding Space
// ============================================================================

/**
 * Compute cosine similarity between two vectors
 * Returns [0, 1] where 1 = identical direction, 0 = orthogonal
 */
export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length || v1.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Compute topic distance in embedding space
 *
 * Subtask 1.1.1: Metric Design
 * - Use cosine similarity between article embedding and user primary topic embeddings
 * - Distance = 1 - max_similarity (closer to 1 = more distant from all primary topics)
 * - Threshold: distance > 0.6 indicates "serendipitous" (2+ topics away)
 */
export function computeTopicDistance(
  articleEmbedding: number[],
  userPrimaryTopics: string[],
  topicEmbeddings: TopicEmbeddings
): number {
  if (userPrimaryTopics.length === 0 || articleEmbedding.length === 0) {
    return 0.5; // Neutral distance for edge cases
  }

  let maxSimilarity = 0;

  for (const topic of userPrimaryTopics) {
    const topicEmbedding = topicEmbeddings.embeddings.get(topic);
    if (!topicEmbedding) {
      continue; // Skip unknown topics
    }

    const similarity = cosineSimilarity(articleEmbedding, topicEmbedding);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  // Distance = 1 - maxSimilarity (closer to 1 = more distant from all primary topics)
  const distance = 1 - maxSimilarity;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, distance));
}

// ============================================================================
// Subtask 1.1.2: Collaborative Novelty Computation
// ============================================================================

/**
 * Compute collaborative novelty score
 *
 * Subtask 1.1.2: Novelty Design
 * - Articles recommended to similar users but NOT read by this user score high
 * - Formula: (% of similar users who read article) / (1 + recency_penalty)
 * - Recency penalty: older reads score lower (encourage fresh discoveries)
 *
 * Returns [0, 1] where 1 = all similar users read, user hasn't
 */
export function computeCollaborativeNovelty(
  userId: string,
  articleId: string,
  collaborativeContext: CollaborativeContext
): number {
  // User has already read this article: no novelty
  if (collaborativeContext.similarUserReadHistories.get(userId)?.has(articleId)) {
    return 0;
  }

  const similarUsers = collaborativeContext.similarUsers;
  if (similarUsers.length === 0) {
    return 0.5; // Neutral novelty for new users
  }

  // Count how many similar users have read this article
  let readCount = 0;
  let totalSimilarity = 0;

  for (const simUser of similarUsers) {
    const userSimilarity = collaborativeContext.similarityScores.get(simUser) || 0;
    totalSimilarity += userSimilarity;

    const userHistory = collaborativeContext.similarUserReadHistories.get(simUser);
    if (userHistory?.has(articleId)) {
      readCount++;
    }
  }

  // Weighted novelty: % of similar users (weighted by similarity) who read article
  if (totalSimilarity === 0) {
    return 0.5;
  }

  const novelty = readCount / similarUsers.length;

  // Higher novelty if more similar users have read (but current user hasn't)
  return Math.max(0, Math.min(1, novelty));
}

// ============================================================================
// Subtask 1.1.3: Blending Formula (Novelty + Quality + Diversity)
// ============================================================================

/**
 * Serendipity Blending Formula
 *
 * Subtask 1.1.3: Score Computation
 * Formula: serendipity_score = (topic_distance * 0.4) + (collaborative_novelty * 0.4) + (article_quality * 0.2)
 *
 * Weights:
 * - 40% topic distance: How far from primary interests (novelty)
 * - 40% collaborative novelty: Do similar users like it? (credibility)
 * - 20% article quality: Click-prediction probability (relevance)
 *
 * Returns [0, 1] where 1 = perfect serendipitous article
 */
export function blendSerendipityScore(
  topicDistance: number,
  collaborativeNovelty: number,
  articleQuality: number
): number {
  // Weights: 40% topic + 40% collaborative + 20% quality
  const weights = {
    topicDistance: 0.4,
    collaborativeNovelty: 0.4,
    articleQuality: 0.2,
  };

  const score =
    topicDistance * weights.topicDistance +
    collaborativeNovelty * weights.collaborativeNovelty +
    articleQuality * weights.articleQuality;

  return Math.max(0, Math.min(1, score));
}

// ============================================================================
// SerendipityScorer Class: Main Algorithm
// ============================================================================

export class SerendipityScorer {
  private topicEmbeddings: TopicEmbeddings;
  private serendipityThreshold: number = 0.6; // Articles with distance > 0.6 are considered serendipitous
  private minCollaborativeNovelty: number = 0.3; // Min novelty to consider

  constructor(topicEmbeddings: TopicEmbeddings) {
    this.topicEmbeddings = topicEmbeddings;
  }

  /**
   * Score serendipity for a single article
   */
  public scoreArticle(
    article: ArticleFeature,
    input: SerendipityInput,
    collaborativeContext: CollaborativeContext,
    articleQuality: number
  ): SerendipityRanking {
    // Skip articles user has already read
    if (input.userReadHistory.has(article.articleId)) {
      return {
        articleId: article.articleId,
        topic: article.topic,
        serendipityScore: 0,
        topicDistance: 0,
        collaborativeNovelty: 0,
        articleQuality,
        noveltyReason: 'Already read',
      };
    }

    // Subtask 1.1.1: Compute topic distance
    const topicDistance = computeTopicDistance(
      article.embedding,
      input.userPrimaryTopics,
      this.topicEmbeddings
    );

    // Subtask 1.1.2: Compute collaborative novelty
    const collaborativeNovelty = computeCollaborativeNovelty(
      input.userId,
      article.articleId,
      collaborativeContext
    );

    // Subtask 1.1.3: Blend scores
    const serendipityScore = blendSerendipityScore(
      topicDistance,
      collaborativeNovelty,
      articleQuality
    );

    // Generate explanation
    let noveltyReason = '';
    if (topicDistance > this.serendipityThreshold) {
      noveltyReason = `Topic-distant from your interests (${(topicDistance * 100).toFixed(0)}% different)`;
    } else if (collaborativeNovelty > this.minCollaborativeNovelty) {
      noveltyReason = `Similar users enjoyed this, but you haven't discovered it yet`;
    } else {
      noveltyReason = `Serendipitous discovery (blended recommendation)`;
    }

    return {
      articleId: article.articleId,
      topic: article.topic,
      serendipityScore,
      topicDistance,
      collaborativeNovelty,
      articleQuality,
      noveltyReason,
    };
  }

  /**
   * Rank articles by serendipity score
   */
  public rankBySerendipity(
    input: SerendipityInput,
    collaborativeContext: CollaborativeContext,
    articleQualities: Map<string, number> // articleId -> click-prediction quality [0, 1]
  ): SerendipityRanking[] {
    const rankings: SerendipityRanking[] = [];

    for (const article of input.candidateArticles) {
      const quality = articleQualities.get(article.articleId) || 0.5; // Default 0.5 for unknown articles

      const ranking = this.scoreArticle(article, input, collaborativeContext, quality);
      rankings.push(ranking);
    }

    // Sort by serendipity score descending
    rankings.sort((a, b) => b.serendipityScore - a.serendipityScore);

    return rankings;
  }

  /**
   * Get serendipitous articles (above threshold)
   * Threshold: distance > 0.6 AND collaborative_novelty > 0.3
   */
  public getSerendipitousArticles(rankings: SerendipityRanking[]): SerendipityRanking[] {
    return rankings.filter(
      (r) =>
        r.topicDistance > this.serendipityThreshold &&
        r.collaborativeNovelty > this.minCollaborativeNovelty &&
        r.serendipityScore > 0.4 // Minimum composite score
    );
  }

  /**
   * Apply diversity constraint: avoid clustering similar serendipity articles
   * Returns articles with diverse topics (round-robin selection)
   */
  public diversifySerendipity(
    rankings: SerendipityRanking[],
    maxPerTopic: number = 2
  ): SerendipityRanking[] {
    const result: SerendipityRanking[] = [];
    const topicCounts = new Map<string, number>();

    for (const ranking of rankings) {
      const count = topicCounts.get(ranking.topic) || 0;

      if (count < maxPerTopic) {
        result.push(ranking);
        topicCounts.set(ranking.topic, count + 1);
      }
    }

    return result;
  }

  /**
   * Set custom thresholds (for A/B testing)
   */
  public setThresholds(serendipityThreshold: number, minNovelty: number): void {
    this.serendipityThreshold = serendipityThreshold;
    this.minCollaborativeNovelty = minNovelty;
  }
}
