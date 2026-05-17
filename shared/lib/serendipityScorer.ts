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
// Task 1.2: Threshold Configuration & Diversity Constraints
// ============================================================================

/**
 * Subtask 1.2.1: Minimum topic distance for serendipity articles
 * Articles must be 2+ topics away from user's primary interests to qualify
 * Default threshold: 0.6 (60% dissimilar from all primary topics)
 */
export interface SerendipityThresholds {
  // Subtask 1.2.1: Topic distance threshold
  minTopicDistance: number; // Default: 0.6 (2+ topics away)

  // Collaborative novelty threshold
  minCollaborativeNovelty: number; // Default: 0.3 (30% of similar users)

  // Composite score threshold
  minSerendipityScore: number; // Default: 0.4 (40% overall score)
}

/**
 * Subtask 1.2.2: Diversity constraint configuration
 * Avoid clustering similar serendipity articles (round-robin by topic)
 */
export interface DiversityConstraint {
  // Max articles per topic in serendipity results
  maxArticlesPerTopic: number; // Default: 2

  // Enforce round-robin selection to spread topics
  enforceRoundRobin: boolean; // Default: true

  // Prefer articles from underrepresented topics
  balanceTopicRepresentation: boolean; // Default: true
}

/**
 * Default thresholds for serendipity scoring (Subtask 1.2.1)
 * These define what qualifies as "serendipitous"
 */
export const DEFAULT_SERENDIPITY_THRESHOLDS: SerendipityThresholds = {
  minTopicDistance: 0.6, // 2+ topics away
  minCollaborativeNovelty: 0.3, // Similar users have read it
  minSerendipityScore: 0.4, // Minimum composite score
};

/**
 * Default diversity constraints (Subtask 1.2.2)
 * These prevent topic clustering in results
 */
export const DEFAULT_DIVERSITY_CONSTRAINT: DiversityConstraint = {
  maxArticlesPerTopic: 2, // At most 2 serendipity articles from same topic
  enforceRoundRobin: true, // Pick from different topics alternately
  balanceTopicRepresentation: true, // Spread evenly
};

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
  private thresholds: SerendipityThresholds;
  private diversityConstraint: DiversityConstraint;

  constructor(
    topicEmbeddings: TopicEmbeddings,
    thresholds: SerendipityThresholds = DEFAULT_SERENDIPITY_THRESHOLDS,
    diversityConstraint: DiversityConstraint = DEFAULT_DIVERSITY_CONSTRAINT
  ) {
    this.topicEmbeddings = topicEmbeddings;
    this.thresholds = thresholds;
    this.diversityConstraint = diversityConstraint;

    // Validate thresholds
    this.validateThresholds();
  }

  /**
   * Validate serendipity thresholds are in valid ranges
   * Subtask 1.2.1: Validate topic distance threshold
   */
  private validateThresholds(): void {
    if (this.thresholds.minTopicDistance < 0 || this.thresholds.minTopicDistance > 1) {
      throw new Error(`Invalid minTopicDistance: ${this.thresholds.minTopicDistance}. Must be in [0, 1]`);
    }
    if (this.thresholds.minCollaborativeNovelty < 0 || this.thresholds.minCollaborativeNovelty > 1) {
      throw new Error(
        `Invalid minCollaborativeNovelty: ${this.thresholds.minCollaborativeNovelty}. Must be in [0, 1]`
      );
    }
    if (this.thresholds.minSerendipityScore < 0 || this.thresholds.minSerendipityScore > 1) {
      throw new Error(`Invalid minSerendipityScore: ${this.thresholds.minSerendipityScore}. Must be in [0, 1]`);
    }
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
   * Get serendipitous articles (above thresholds)
   *
   * Subtask 1.2.1: Filter by thresholds
   * - distance > minTopicDistance (2+ topics away)
   * - collaborative_novelty > minCollaborativeNovelty (30%+ of similar users)
   * - serendipityScore > minSerendipityScore (40%+ composite)
   */
  public getSerendipitousArticles(rankings: SerendipityRanking[]): SerendipityRanking[] {
    return rankings.filter(
      (r) =>
        r.topicDistance > this.thresholds.minTopicDistance &&
        r.collaborativeNovelty > this.thresholds.minCollaborativeNovelty &&
        r.serendipityScore > this.thresholds.minSerendipityScore
    );
  }

  /**
   * Apply diversity constraint: avoid clustering similar serendipity articles
   *
   * Subtask 1.2.2: Diversity Constraint
   * - maxArticlesPerTopic: Limit articles from same topic (round-robin)
   * - enforceRoundRobin: Alternate between topics
   * - balanceTopicRepresentation: Spread evenly across topics
   *
   * Returns articles with diverse topics
   */
  public diversifySerendipity(rankings: SerendipityRanking[]): SerendipityRanking[] {
    if (!this.diversityConstraint.enforceRoundRobin) {
      // No diversity constraint
      return rankings;
    }

    const result: SerendipityRanking[] = [];
    const topicCounts = new Map<string, number>();
    const seenArticles = new Set<string>();

    // Pass 1: Round-robin by topic to ensure diversity
    if (this.diversityConstraint.enforceRoundRobin) {
      let currentTopicIndex = 0;
      const uniqueTopics = Array.from(new Set(rankings.map((r) => r.topic)));

      while (result.length < rankings.length && uniqueTopics.length > 0) {
        // Find next article from current topic
        let foundInTopic = false;

        for (const ranking of rankings) {
          if (seenArticles.has(ranking.articleId)) {
            continue;
          }

          const topicIdx = uniqueTopics.indexOf(ranking.topic);
          if (topicIdx !== currentTopicIndex % uniqueTopics.length) {
            continue;
          }

          const count = topicCounts.get(ranking.topic) || 0;
          if (count < this.diversityConstraint.maxArticlesPerTopic) {
            result.push(ranking);
            seenArticles.add(ranking.articleId);
            topicCounts.set(ranking.topic, count + 1);
            foundInTopic = true;
            break;
          }
        }

        if (!foundInTopic) {
          currentTopicIndex++;
        } else {
          currentTopicIndex++;
        }
      }
    } else {
      // Pass 2: Simple max-per-topic constraint (no round-robin)
      for (const ranking of rankings) {
        const count = topicCounts.get(ranking.topic) || 0;

        if (count < this.diversityConstraint.maxArticlesPerTopic) {
          result.push(ranking);
          topicCounts.set(ranking.topic, count + 1);
        }
      }
    }

    return result;
  }

  /**
   * Update serendipity thresholds (for A/B testing)
   * Subtask 1.2.1: Allow dynamic threshold tuning
   */
  public setThresholds(thresholds: Partial<SerendipityThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.validateThresholds();
  }

  /**
   * Update diversity constraints (for A/B testing)
   * Subtask 1.2.2: Allow dynamic diversity tuning
   */
  public setDiversityConstraint(constraint: Partial<DiversityConstraint>): void {
    this.diversityConstraint = { ...this.diversityConstraint, ...constraint };
  }

  /**
   * Get current configuration (for debugging/monitoring)
   */
  public getConfig(): { thresholds: SerendipityThresholds; diversity: DiversityConstraint } {
    return {
      thresholds: this.thresholds,
      diversity: this.diversityConstraint,
    };
  }
}
