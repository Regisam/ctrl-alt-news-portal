/**
 * Topic Embeddings — Compute from Real Article Data
 * Task 2: Topic Embeddings from Real Data (Story 14.1)
 *
 * Aggregates article embeddings to compute topic-level embeddings
 * Caches results in Redis for performance
 */

export interface TopicEmbeddingData {
  topicId: string;
  topicName: string;
  embedding: number[]; // Vector representation
  articleCount: number; // Number of articles in this topic
  lastUpdated: number; // Timestamp
}

export interface ArticleEmbedding {
  articleId: string;
  topicId: string;
  embedding: number[]; // Article's embedding vector
  weight?: number; // Optional: article importance (default 1.0)
}

/**
 * Compute topic embedding as weighted average of article embeddings
 * AC2.2: weighted aggregate of article vectors
 *
 * @param articles Articles in topic with embeddings
 * @returns Topic-level embedding vector
 */
export function computeTopicEmbedding(articles: ArticleEmbedding[]): number[] {
  if (articles.length === 0) {
    throw new Error('Cannot compute topic embedding from empty article list');
  }

  // Get embedding dimension from first article
  const dimension = articles[0].embedding.length;

  // Initialize accumulator
  const accumulator = new Array(dimension).fill(0);

  // Sum weighted embeddings
  let totalWeight = 0;
  for (const article of articles) {
    const weight = article.weight || 1.0;
    totalWeight += weight;

    for (let i = 0; i < dimension; i++) {
      accumulator[i] += weight * article.embedding[i];
    }
  }

  // Normalize by total weight
  const topicEmbedding = accumulator.map((val) => val / totalWeight);

  return topicEmbedding;
}

/**
 * Compute cosine similarity between two embeddings
 * Used to measure topic affinity and serendipity distance
 *
 * @param embedding1 First embedding vector
 * @param embedding2 Second embedding vector
 * @returns Cosine similarity (0-1, where 1 = identical direction)
 */
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have same dimension');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const normProduct = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (normProduct === 0) return 0; // Handle zero vectors

  return dotProduct / normProduct;
}

/**
 * Cache key for topic embeddings in Redis
 * AC2.3: Cache embeddings (Redis): invalidate on new article or topic change
 */
export function getTopicEmbeddingCacheKey(topicId: string): string {
  return `topic:embedding:${topicId}`;
}

/**
 * Cache key for all topics embeddings (for bulk operations)
 */
export function getAllTopicsEmbeddingsCacheKey(): string {
  return 'topic:embeddings:all';
}

/**
 * Cache invalidation: when an article is added/updated, invalidate topic cache
 * AC2.3: invalidate on new article or topic change
 */
export function getInvalidationKeysForArticleUpdate(topicId: string): string[] {
  return [
    getTopicEmbeddingCacheKey(topicId), // Invalidate this topic
    getAllTopicsEmbeddingsCacheKey(), // Invalidate bulk cache
  ];
}

/**
 * Mock Supabase query: fetch articles with embeddings grouped by topic
 * AC2.1: Query Supabase: fetch all articles with embeddings, grouped by topic
 *
 * In production, replace with actual Supabase query:
 * const { data } = await supabase
 *   .from('articles')
 *   .select('id, topic_id, embedding')
 *   .eq('status', 'published')
 *
 * @returns Articles grouped by topic ID
 */
export async function fetchArticlesWithEmbeddings(): Promise<Record<string, ArticleEmbedding[]>> {
  // Mock data: simulated articles with embeddings
  // In production, query from Supabase articles table
  const mockData: Record<string, ArticleEmbedding[]> = {
    'topic-ai': [
      {
        articleId: 'art-1',
        topicId: 'topic-ai',
        embedding: [0.8, 0.2, 0.1, 0.3, 0.6],
        weight: 1.0,
      },
      {
        articleId: 'art-2',
        topicId: 'topic-ai',
        embedding: [0.75, 0.25, 0.15, 0.35, 0.65],
        weight: 1.0,
      },
      {
        articleId: 'art-3',
        topicId: 'topic-ai',
        embedding: [0.9, 0.1, 0.05, 0.2, 0.7],
        weight: 0.8, // Lower weight = older/less relevant article
      },
    ],
    'topic-quantum': [
      {
        articleId: 'art-4',
        topicId: 'topic-quantum',
        embedding: [0.1, 0.9, 0.2, 0.4, 0.3],
        weight: 1.0,
      },
      {
        articleId: 'art-5',
        topicId: 'topic-quantum',
        embedding: [0.15, 0.85, 0.25, 0.45, 0.35],
        weight: 1.0,
      },
    ],
    'topic-robotics': [
      {
        articleId: 'art-6',
        topicId: 'topic-robotics',
        embedding: [0.4, 0.1, 0.8, 0.6, 0.2],
        weight: 1.0,
      },
    ],
  };

  return mockData;
}

/**
 * Compute embeddings for all topics
 * AC2.2: Compute topic embeddings: weighted aggregate of article vectors
 *
 * @returns Map of topic IDs to computed embeddings
 */
export async function computeAllTopicEmbeddings(): Promise<Record<string, TopicEmbeddingData>> {
  const articles = await fetchArticlesWithEmbeddings();
  const topicEmbeddings: Record<string, TopicEmbeddingData> = {};

  for (const [topicId, topicArticles] of Object.entries(articles)) {
    if (topicArticles.length === 0) continue;

    const embedding = computeTopicEmbedding(topicArticles);
    topicEmbeddings[topicId] = {
      topicId,
      topicName: topicId.replace('topic-', '').toUpperCase(),
      embedding,
      articleCount: topicArticles.length,
      lastUpdated: Date.now(),
    };
  }

  return topicEmbeddings;
}

/**
 * Get topic embedding, with caching
 * AC2.3: Cache embeddings (Redis): invalidate on new article or topic change
 *
 * @param topicId Topic ID
 * @param cache Redis-like cache object (for testing, can be mock)
 * @returns Topic embedding data
 */
export async function getTopicEmbeddingWithCache(
  topicId: string,
  cache?: Record<string, TopicEmbeddingData>
): Promise<TopicEmbeddingData | null> {
  const cacheKey = getTopicEmbeddingCacheKey(topicId);

  // Check cache first
  if (cache && cache[cacheKey]) {
    return cache[cacheKey];
  }

  // Compute if not cached
  const allEmbeddings = await computeAllTopicEmbeddings();
  const embedding = allEmbeddings[topicId];

  if (!embedding) {
    return null;
  }

  // Store in cache
  if (cache) {
    cache[cacheKey] = embedding;
  }

  return embedding;
}

/**
 * Compute serendipity score based on embedding distance
 * Lower cosine similarity = higher serendipity (more novel)
 *
 * Used by: topicRecommendationsTuning.computeSerendipityScore()
 * AC2.4: Update ranking algorithm to use real embeddings
 *
 * @param userTopicEmbedding User's aggregated topic embedding
 * @param recommendedTopicEmbedding Recommended topic embedding
 * @returns Serendipity score (0-1, where 1 = maximum novelty)
 */
export function computeSerendipityFromEmbeddings(
  userTopicEmbedding: number[],
  recommendedTopicEmbedding: number[]
): number {
  const similarity = cosineSimilarity(userTopicEmbedding, recommendedTopicEmbedding);

  // Map cosine similarity (-1 to 1) to serendipity score (0 to 1)
  // similarity = 1 → serendipity = 0 (identical, no novelty)
  // similarity = -1 → serendipity = 1 (opposite, maximum novelty)
  // Formula: (1 - similarity) / 2
  return (1 - similarity) / 2;
}
