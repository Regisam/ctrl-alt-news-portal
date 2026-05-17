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

export function handleColdStartTopics(
  trendingTopics: string[],
  topicNames: Map<string, string>,
  randomSeed: string = ''
): RecommendedTopic[] {
  // New users: show top 3 trending + 1 random serendipitous
  const recommendations: RecommendedTopic[] = [];

  for (let i = 0; i < Math.min(3, trendingTopics.length); i++) {
    const topicId = trendingTopics[i];
    recommendations.push({
      topicId,
      topicName: topicNames.get(topicId) || topicId,
      adoptionProbability: 0.8 - i * 0.1,
      reason: `Trending topic`,
      similarityScore: 0.5,
      similarUserCount: 999, // placeholder
    });
  }

  // Add random serendipitous topic
  if (trendingTopics.length > 3) {
    const serendipitousIndex = Math.abs(
      randomSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % trendingTopics.length;
    const serendipitousTopic = trendingTopics[serendipitousIndex];

    recommendations.push({
      topicId: serendipitousTopic,
      topicName: topicNames.get(serendipitousTopic) || serendipitousTopic,
      adoptionProbability: 0.6,
      reason: `Discover something new`,
      similarityScore: 0.3,
      similarUserCount: 0,
    });
  }

  return recommendations;
}
