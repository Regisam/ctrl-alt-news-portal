export interface TopicEngagementVector {
  topicId: string;
  engagementScore: number; // normalized [0, 1]
  articleCount: number; // articles read in this topic
  timeSpent: number; // total reading time (seconds)
  lastEngagement: Date;
}

export interface TopicAffinityInput {
  userId: string;
  userTopicHistory: TopicEngagementVector[];
  userEngagementProfile: number[]; // dense topic preference vector
  similarUsers: string[];
  similarUsersTopicHistory: Map<string, TopicEngagementVector[]>;
  topicEmbeddings: Map<string, number[]>;
}

export interface RecommendedTopic {
  topicId: string;
  topicName: string;
  adoptionProbability: number; // [0, 1]
  reason: string;
  similarityScore: number;
  similarUserCount: number;
}

interface Article {
  id: string;
  topicId: string;
  title: string;
}

interface ArticleWithTopic extends Article {
  timeSpent: number;
  isBookmarked: boolean;
}

interface UserReadHistory {
  userId: string;
  articles: ArticleWithTopic[];
}

const TEMPORAL_DECAY_DAYS = 7;
const RECENT_ENGAGEMENT_WEIGHT = 1.0;

export class TopicRecommender {
  private topicEmbeddings: Map<string, number[]> = new Map();
  private articleEmbeddings: Map<string, number[]> = new Map();

  constructor(
    topicEmbeddings: Map<string, number[]>,
    articleEmbeddings: Map<string, number[]>
  ) {
    this.topicEmbeddings = topicEmbeddings;
    this.articleEmbeddings = articleEmbeddings;
  }

  computeTopicEngagementVector(
    userId: string,
    userArticles: ArticleWithTopic[]
  ): TopicEngagementVector[] {
    const topicMap = new Map<string, TopicEngagementVector>();
    const now = new Date();

    for (const article of userArticles) {
      const topicId = article.topicId;
      const daysSinceEngagement = Math.floor(
        (now.getTime() - article.timeSpent) / (1000 * 60 * 60 * 24)
      );
      const temporalWeight =
        daysSinceEngagement <= TEMPORAL_DECAY_DAYS
          ? RECENT_ENGAGEMENT_WEIGHT
          : Math.exp(-daysSinceEngagement / TEMPORAL_DECAY_DAYS);

      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, {
          topicId,
          engagementScore: 0,
          articleCount: 0,
          timeSpent: 0,
          lastEngagement: new Date(0),
        });
      }

      const vector = topicMap.get(topicId)!;
      const engagementValue = (article.timeSpent / 300) * (article.isBookmarked ? 1.5 : 1) * temporalWeight;
      vector.engagementScore += engagementValue;
      vector.articleCount += 1;
      vector.timeSpent += article.timeSpent;
      vector.lastEngagement = new Date(Math.max(vector.lastEngagement.getTime(), article.timeSpent));
    }

    // Normalize scores to [0, 1]
    const vectors = Array.from(topicMap.values());
    if (vectors.length > 0) {
      const maxScore = Math.max(...vectors.map((v) => v.engagementScore));
      if (maxScore > 0) {
        vectors.forEach((v) => {
          v.engagementScore = v.engagementScore / maxScore;
        });
      }
    }

    return vectors;
  }

  aggregateTopicEmbeddings(
    articles: Article[],
    articleEmbeddings: Map<string, number[]>
  ): Map<string, number[]> {
    const topicEmbeds = new Map<string, number[]>();
    const topicArticleCounts = new Map<string, number>();

    for (const article of articles) {
      const embedding = articleEmbeddings.get(article.id);
      if (!embedding) continue;

      const topicId = article.topicId;
      if (!topicEmbeds.has(topicId)) {
        topicEmbeds.set(topicId, new Array(embedding.length).fill(0));
        topicArticleCounts.set(topicId, 0);
      }

      const topicEmbed = topicEmbeds.get(topicId)!;
      for (let i = 0; i < embedding.length; i++) {
        topicEmbed[i] += embedding[i];
      }
      topicArticleCounts.set(topicId, (topicArticleCounts.get(topicId) || 0) + 1);
    }

    // Average embeddings
    for (const [topicId, embed] of topicEmbeds.entries()) {
      const count = topicArticleCounts.get(topicId) || 1;
      for (let i = 0; i < embed.length; i++) {
        embed[i] /= count;
      }
    }

    return topicEmbeds;
  }

  cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  computeTopicBridging(input: TopicAffinityInput): RecommendedTopic[] {
    const userEngagedTopics = new Set(input.userTopicHistory.map((t) => t.topicId));
    const candidateTopics = new Map<
      string,
      { score: number; similarUserCount: number; topicName: string }
    >();

    // Find topics similar users engaged with but current user hasn't
    for (const similarUserId of input.similarUsers) {
      const similarUserTopics = input.similarUsersTopicHistory.get(similarUserId) || [];

      for (const topicVec of similarUserTopics) {
        if (userEngagedTopics.has(topicVec.topicId)) continue;

        const topicId = topicVec.topicId;
        if (!candidateTopics.has(topicId)) {
          candidateTopics.set(topicId, {
            score: 0,
            similarUserCount: 0,
            topicName: topicId, // fallback name
          });
        }

        const candidate = candidateTopics.get(topicId)!;
        candidate.score += topicVec.engagementScore;
        candidate.similarUserCount += 1;
      }
    }

    // Score candidates by topic distance + similar user engagement
    const recommendations: RecommendedTopic[] = [];

    for (const [topicId, candidate] of candidateTopics.entries()) {
      const topicEmbedding = this.topicEmbeddings.get(topicId);
      if (!topicEmbedding) continue;

      // Topic distance: how far from user's primary topics (similarity in embedding space)
      const topicDistance =
        input.userEngagementProfile.length > 0
          ? 1 - this.cosineSimilarity(input.userEngagementProfile, topicEmbedding)
          : 0.5; // default for new users

      // Peer popularity: % of similar users who engaged with this topic
      const peerPopularity = candidate.similarUserCount / Math.max(input.similarUsers.length, 1);

      // Collaborative novelty: avg engagement score from similar users
      const avgSimilarUserEngagement = candidate.score / Math.max(candidate.similarUserCount, 1);

      // Final adoption probability
      const adoptionProbability = topicDistance * 0.4 + peerPopularity * 0.4 + avgSimilarUserEngagement * 0.2;

      recommendations.push({
        topicId,
        topicName: candidate.topicName,
        adoptionProbability: Math.min(1, Math.max(0, adoptionProbability)),
        reason: `Popular among ${candidate.similarUserCount} similar users`,
        similarityScore: 1 - topicDistance,
        similarUserCount: candidate.similarUserCount,
      });
    }

    return recommendations;
  }

  rankBySerendipity(input: TopicAffinityInput, topK: number = 5): RecommendedTopic[] {
    const candidates = this.computeTopicBridging(input);

    // Sort by adoption probability (descending)
    candidates.sort((a, b) => b.adoptionProbability - a.adoptionProbability);

    // Diversity constraint: avoid clustering similar topics
    const diverseRecommendations: RecommendedTopic[] = [];
    const usedTopics = new Set<string>();
    const minTopicDistance = 0.3; // minimum embedding distance between recommendations

    for (const candidate of candidates) {
      if (diverseRecommendations.length >= topK) break;

      // Check if topic is diverse from already selected
      let isDiverse = true;
      const candidateEmbedding = this.topicEmbeddings.get(candidate.topicId);

      if (candidateEmbedding) {
        for (const selectedTopic of usedTopics) {
          const selectedEmbedding = this.topicEmbeddings.get(selectedTopic);
          if (selectedEmbedding) {
            const distance = 1 - this.cosineSimilarity(candidateEmbedding, selectedEmbedding);
            if (distance < minTopicDistance) {
              isDiverse = false;
              break;
            }
          }
        }
      }

      if (isDiverse) {
        diverseRecommendations.push(candidate);
        usedTopics.add(candidate.topicId);
      }
    }

    return diverseRecommendations;
  }
}

export async function getTopicRecommendations(
  userId: string,
  userReadHistory: UserReadHistory,
  similarUsers: string[],
  similarUserHistories: Map<string, UserReadHistory>,
  topicEmbeddings: Map<string, number[]>,
  articleEmbeddings: Map<string, number[]>
): Promise<RecommendedTopic[]> {
  const recommender = new TopicRecommender(topicEmbeddings, articleEmbeddings);

  // Compute user's topic engagement vectors
  const userTopicHistory = recommender.computeTopicEngagementVector(userId, userReadHistory.articles);

  // Build user engagement profile (dense vector)
  const userEngagementProfile = new Array(Array.from(topicEmbeddings.values())[0]?.length || 50).fill(0);
  for (const topicVec of userTopicHistory) {
    const topicEmbed = topicEmbeddings.get(topicVec.topicId);
    if (topicEmbed) {
      for (let i = 0; i < topicEmbed.length; i++) {
        userEngagementProfile[i] += topicVec.engagementScore * topicEmbed[i];
      }
    }
  }

  // Normalize profile
  const profileNorm = Math.sqrt(userEngagementProfile.reduce((sum, val) => sum + val * val, 0));
  if (profileNorm > 0) {
    for (let i = 0; i < userEngagementProfile.length; i++) {
      userEngagementProfile[i] /= profileNorm;
    }
  }

  // Gather similar users' topic histories
  const similarUserTopicHistories = new Map<string, TopicEngagementVector[]>();
  for (const similarUserId of similarUsers) {
    const similarUserHistory = similarUserHistories.get(similarUserId);
    if (similarUserHistory) {
      const topicVecs = recommender.computeTopicEngagementVector(
        similarUserId,
        similarUserHistory.articles
      );
      similarUserTopicHistories.set(similarUserId, topicVecs);
    }
  }

  // Compute topic bridging
  const input: TopicAffinityInput = {
    userId,
    userTopicHistory,
    userEngagementProfile,
    similarUsers,
    similarUsersTopicHistory: similarUserTopicHistories,
    topicEmbeddings,
  };

  return recommender.rankBySerendipity(input, 5);
}

export interface ColdStartTopicData {
  topicId: string;
  topicName: string;
  articleCount: number; // trending by articles_count in past week
  embedding: number[]; // topic embedding vector
  trendingScore?: number; // optional: normalized trending score
}

export function handleColdStartTopics(
  topicsData: ColdStartTopicData[],
  topicEmbeddings: Map<string, number[]> = new Map(),
  randomSeed: string = ''
): RecommendedTopic[] {
  // AC3.1: New users: 2 popular + 3 serendipitous
  const recommendations: RecommendedTopic[] = [];

  if (topicsData.length === 0) {
    return recommendations;
  }

  // Step 1: Select 2 popular topics (highest article count from past week)
  // AC3.2: Define "popular": top trending by articles_count in past week
  const sortedByPopularity = [...topicsData].sort(
    (a, b) => (b.articleCount || 0) - (a.articleCount || 0)
  );

  const popularTopics = sortedByPopularity.slice(0, Math.min(2, topicsData.length));
  for (let i = 0; i < popularTopics.length; i++) {
    const topic = popularTopics[i];
    recommendations.push({
      topicId: topic.topicId,
      topicName: topic.topicName,
      adoptionProbability: 0.85 - i * 0.05, // high adoption for popular topics
      reason: `Popular topic (${topic.articleCount} articles this week)`,
      similarityScore: 0.8,
      similarUserCount: topic.articleCount || 0,
    });
  }

  // Step 2: Select 3 serendipitous topics (high embedding distance from popular topics)
  // AC3.3: Define "serendipitous": high embedding distance from user's category (popular topics)
  const serendipitousTopics = selectSerendipitousTopics(
    topicsData,
    popularTopics,
    topicEmbeddings,
    randomSeed,
    3
  );

  for (let i = 0; i < serendipitousTopics.length; i++) {
    const topic = serendipitousTopics[i];
    const embedding = topic.embedding || topicEmbeddings.get(topic.topicId) || [];
    const distance = computeEmbeddingDistance(
      computeAverageEmbedding(
        popularTopics.map((t) => t.embedding || topicEmbeddings.get(t.topicId) || [])
      ),
      embedding
    );

    recommendations.push({
      topicId: topic.topicId,
      topicName: topic.topicName,
      adoptionProbability: 0.6 - i * 0.05, // moderate adoption for serendipitous
      reason: `Discover something new`,
      similarityScore: 1 - distance, // high distance = low similarity (more serendipitous)
      similarUserCount: 0,
    });
  }

  return recommendations;
}

function selectSerendipitousTopics(
  topicsData: ColdStartTopicData[],
  popularTopics: ColdStartTopicData[],
  topicEmbeddings: Map<string, number[]>,
  randomSeed: string,
  count: number
): ColdStartTopicData[] {
  // Compute average embedding of popular topics
  const popularEmbedding = computeAverageEmbedding(
    popularTopics.map((t) => t.embedding || topicEmbeddings.get(t.topicId) || [])
  );

  // Filter out already selected topics
  const popularTopicIds = new Set(popularTopics.map((t) => t.topicId));
  const candidates = topicsData.filter((t) => !popularTopicIds.has(t.topicId));

  // Score by embedding distance from popular topics
  const scored = candidates.map((topic) => {
    const embedding = topic.embedding || topicEmbeddings.get(topic.topicId) || [];
    const distance = computeEmbeddingDistance(popularEmbedding, embedding);

    return {
      ...topic,
      distance, // higher = more serendipitous
      similarityScore: 1 - distance, // for output
    };
  });

  // Sort by distance (descending) to get most serendipitous
  scored.sort((a, b) => (b.distance || 0) - (a.distance || 0));

  // Apply deterministic randomness for consistent selection
  if (randomSeed && randomSeed.length > 0) {
    const hash = Math.abs(randomSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
    const offset = hash % Math.max(1, scored.length - count);
    return scored.slice(offset, offset + count);
  }

  return scored.slice(0, Math.min(count, scored.length));
}

function computeAverageEmbedding(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];

  const dimension = embeddings[0]?.length || 5;
  const average = new Array(dimension).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dimension && i < embedding.length; i++) {
      average[i] += embedding[i];
    }
  }

  for (let i = 0; i < average.length; i++) {
    average[i] /= embeddings.length;
  }

  return average;
}

function computeEmbeddingDistance(embed1: number[], embed2: number[]): number {
  // Use (1 - cosine_similarity) / 2 to normalize to [0, 1]
  if (embed1.length === 0 || embed2.length === 0) return 0.5;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  const minLen = Math.min(embed1.length, embed2.length);

  for (let i = 0; i < minLen; i++) {
    dotProduct += embed1[i] * embed2[i];
    norm1 += embed1[i] * embed1[i];
    norm2 += embed2[i] * embed2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  const similarity = denominator === 0 ? 0 : dotProduct / denominator;

  // Map similarity (-1 to 1) to distance (0 to 1)
  return (1 - similarity) / 2;
}
