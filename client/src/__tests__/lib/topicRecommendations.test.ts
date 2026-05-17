import { describe, it, expect, beforeEach } from 'vitest';
import {
  TopicRecommender,
  getTopicRecommendations,
  handleColdStartTopics,
  TopicEngagementVector,
  RecommendedTopic,
} from '@shared/lib/topicRecommendations';

describe('TopicRecommender', () => {
  let recommender: TopicRecommender;
  let topicEmbeddings: Map<string, number[]>;
  let articleEmbeddings: Map<string, number[]>;

  beforeEach(() => {
    // Create mock embeddings
    topicEmbeddings = new Map([
      ['ai', [1, 0, 0, 0, 0]],
      ['science', [0, 1, 0, 0, 0]],
      ['robotics', [0.8, 0.2, 0, 0, 0]],
      ['tech', [0.5, 0.5, 0, 0, 0]],
      ['health', [0, 0, 1, 0, 0]],
    ]);

    articleEmbeddings = new Map([
      ['article1', [1, 0, 0, 0, 0]],
      ['article2', [0.9, 0.1, 0, 0, 0]],
      ['article3', [0, 1, 0, 0, 0]],
      ['article4', [0, 0.9, 0.1, 0, 0]],
    ]);

    recommender = new TopicRecommender(topicEmbeddings, articleEmbeddings);
  });

  describe('computeTopicEngagementVector', () => {
    it('should compute engagement vectors from user articles', () => {
      const userArticles = [
        {
          id: 'article1',
          topicId: 'ai',
          title: 'AI Article',
          timeSpent: Date.now() - 1000,
          isBookmarked: true,
        },
        {
          id: 'article3',
          topicId: 'science',
          title: 'Science Article',
          timeSpent: Date.now() - 2000,
          isBookmarked: false,
        },
      ];

      const vectors = recommender.computeTopicEngagementVector('user1', userArticles);

      expect(vectors.length).toBe(2);
      expect(vectors.some((v) => v.topicId === 'ai')).toBe(true);
      expect(vectors.some((v) => v.topicId === 'science')).toBe(true);
      expect(vectors.every((v) => v.engagementScore >= 0 && v.engagementScore <= 1)).toBe(true);
    });

    it('should handle empty article list', () => {
      const vectors = recommender.computeTopicEngagementVector('user1', []);
      expect(vectors).toEqual([]);
    });

    it('should normalize engagement scores to [0, 1]', () => {
      const userArticles = [
        {
          id: 'article1',
          topicId: 'ai',
          title: 'AI Article',
          timeSpent: Date.now() - 1000,
          isBookmarked: true,
        },
        {
          id: 'article2',
          topicId: 'ai',
          title: 'AI Article 2',
          timeSpent: Date.now() - 2000,
          isBookmarked: true,
        },
      ];

      const vectors = recommender.computeTopicEngagementVector('user1', userArticles);
      const aiVector = vectors.find((v) => v.topicId === 'ai');

      expect(aiVector?.engagementScore).toBeLessThanOrEqual(1);
      expect(aiVector?.engagementScore).toBeGreaterThanOrEqual(0);
    });

    it('should track article count and time spent', () => {
      const userArticles = [
        {
          id: 'article1',
          topicId: 'ai',
          title: 'AI Article',
          timeSpent: 300,
          isBookmarked: true,
        },
        {
          id: 'article2',
          topicId: 'ai',
          title: 'AI Article 2',
          timeSpent: 600,
          isBookmarked: false,
        },
      ];

      const vectors = recommender.computeTopicEngagementVector('user1', userArticles);
      const aiVector = vectors.find((v) => v.topicId === 'ai');

      expect(aiVector?.articleCount).toBe(2);
      expect(aiVector?.timeSpent).toBe(900);
    });
  });

  describe('aggregateTopicEmbeddings', () => {
    it('should aggregate article embeddings to topic level', () => {
      const articles = [
        { id: 'article1', topicId: 'ai', title: 'AI Article' },
        { id: 'article2', topicId: 'ai', title: 'AI Article 2' },
        { id: 'article3', topicId: 'science', title: 'Science Article' },
      ];

      const topicEmbeds = recommender.aggregateTopicEmbeddings(articles, articleEmbeddings);

      expect(topicEmbeds.has('ai')).toBe(true);
      expect(topicEmbeds.has('science')).toBe(true);
      expect(topicEmbeds.get('ai')?.length).toBe(5);
    });

    it('should handle missing article embeddings', () => {
      const articles = [
        { id: 'unknown', topicId: 'ai', title: 'Unknown Article' },
        { id: 'article1', topicId: 'ai', title: 'AI Article' },
      ];

      const topicEmbeds = recommender.aggregateTopicEmbeddings(articles, articleEmbeddings);
      expect(topicEmbeds.has('ai')).toBe(true);
    });

    it('should average embeddings correctly', () => {
      const articles = [
        { id: 'article1', topicId: 'ai', title: 'AI Article' },
        { id: 'article2', topicId: 'ai', title: 'AI Article 2' },
      ];

      const topicEmbeds = recommender.aggregateTopicEmbeddings(articles, articleEmbeddings);
      const aiEmbed = topicEmbeds.get('ai')!;

      // article1: [1, 0, 0, 0, 0], article2: [0.9, 0.1, 0, 0, 0]
      // average: [0.95, 0.05, 0, 0, 0]
      expect(aiEmbed[0]).toBeCloseTo(0.95, 2);
      expect(aiEmbed[1]).toBeCloseTo(0.05, 2);
    });
  });

  describe('cosineSimilarity', () => {
    it('should compute cosine similarity between vectors', () => {
      const vec1 = [1, 0, 0, 0, 0];
      const vec2 = [1, 0, 0, 0, 0];

      const similarity = recommender.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1, 2); // identical vectors
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0, 0, 0, 0];
      const vec2 = [0, 1, 0, 0, 0];

      const similarity = recommender.cosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0, 2);
    });

    it('should handle different vector lengths', () => {
      const vec1 = [1, 0];
      const vec2 = [1, 0, 0];

      const similarity = recommender.cosineSimilarity(vec1, vec2);
      expect(similarity).toBe(0);
    });
  });

  describe('computeTopicBridging', () => {
    it('should recommend topics from similar users', () => {
      const input = {
        userId: 'user1',
        userTopicHistory: [
          {
            topicId: 'ai',
            engagementScore: 0.8,
            articleCount: 5,
            timeSpent: 1500,
            lastEngagement: new Date(),
          },
        ],
        userEngagementProfile: [0.8, 0, 0, 0, 0],
        similarUsers: ['user2', 'user3'],
        similarUsersTopicHistory: new Map([
          [
            'user2',
            [
              {
                topicId: 'robotics',
                engagementScore: 0.7,
                articleCount: 3,
                timeSpent: 900,
                lastEngagement: new Date(),
              },
            ],
          ],
          [
            'user3',
            [
              {
                topicId: 'tech',
                engagementScore: 0.6,
                articleCount: 2,
                timeSpent: 600,
                lastEngagement: new Date(),
              },
            ],
          ],
        ]),
        topicEmbeddings,
      };

      const recommendations = recommender.computeTopicBridging(input);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.every((r) => r.topicId !== 'ai')).toBe(true); // exclude already engaged
      expect(recommendations.every((r) => r.adoptionProbability >= 0 && r.adoptionProbability <= 1)).toBe(true);
    });

    it('should exclude topics user already engaged with', () => {
      const input = {
        userId: 'user1',
        userTopicHistory: [
          {
            topicId: 'ai',
            engagementScore: 0.8,
            articleCount: 5,
            timeSpent: 1500,
            lastEngagement: new Date(),
          },
        ],
        userEngagementProfile: [0.8, 0, 0, 0, 0],
        similarUsers: ['user2'],
        similarUsersTopicHistory: new Map([
          [
            'user2',
            [
              {
                topicId: 'ai',
                engagementScore: 0.7,
                articleCount: 3,
                timeSpent: 900,
                lastEngagement: new Date(),
              },
            ],
          ],
        ]),
        topicEmbeddings,
      };

      const recommendations = recommender.computeTopicBridging(input);

      expect(recommendations.every((r) => r.topicId !== 'ai')).toBe(true);
    });
  });

  describe('rankBySerendipity', () => {
    it('should rank topics by adoption probability', () => {
      const input = {
        userId: 'user1',
        userTopicHistory: [
          {
            topicId: 'ai',
            engagementScore: 0.8,
            articleCount: 5,
            timeSpent: 1500,
            lastEngagement: new Date(),
          },
        ],
        userEngagementProfile: [0.8, 0, 0, 0, 0],
        similarUsers: ['user2', 'user3', 'user4'],
        similarUsersTopicHistory: new Map([
          ['user2', [{ topicId: 'robotics', engagementScore: 0.7, articleCount: 3, timeSpent: 900, lastEngagement: new Date() }]],
          ['user3', [{ topicId: 'tech', engagementScore: 0.6, articleCount: 2, timeSpent: 600, lastEngagement: new Date() }]],
          ['user4', [{ topicId: 'science', engagementScore: 0.5, articleCount: 1, timeSpent: 300, lastEngagement: new Date() }]],
        ]),
        topicEmbeddings,
      };

      const recommendations = recommender.rankBySerendipity(input, 3);

      expect(recommendations.length).toBeLessThanOrEqual(3);
      expect(recommendations[0].adoptionProbability).toBeGreaterThanOrEqual(recommendations[1]?.adoptionProbability || 0);
    });

    it('should enforce diversity constraint', () => {
      const input = {
        userId: 'user1',
        userTopicHistory: [
          {
            topicId: 'ai',
            engagementScore: 0.8,
            articleCount: 5,
            timeSpent: 1500,
            lastEngagement: new Date(),
          },
        ],
        userEngagementProfile: [0.8, 0, 0, 0, 0],
        similarUsers: ['user2', 'user3'],
        similarUsersTopicHistory: new Map([
          ['user2', [{ topicId: 'robotics', engagementScore: 0.9, articleCount: 5, timeSpent: 1500, lastEngagement: new Date() }]],
          ['user3', [{ topicId: 'tech', engagementScore: 0.8, articleCount: 4, timeSpent: 1200, lastEngagement: new Date() }]],
        ]),
        topicEmbeddings,
      };

      const recommendations = recommender.rankBySerendipity(input, 2);

      // Check that recommended topics are diverse (not too similar in embedding space)
      if (recommendations.length === 2) {
        const topic1Embed = topicEmbeddings.get(recommendations[0].topicId);
        const topic2Embed = topicEmbeddings.get(recommendations[1].topicId);

        if (topic1Embed && topic2Embed) {
          const distance = 1 - recommender.cosineSimilarity(topic1Embed, topic2Embed);
          expect(distance).toBeGreaterThan(0.2); // diversity constraint
        }
      }
    });

    it('should respect topK limit', () => {
      const input = {
        userId: 'user1',
        userTopicHistory: [],
        userEngagementProfile: [0.5, 0.5, 0, 0, 0],
        similarUsers: ['user2', 'user3', 'user4', 'user5'],
        similarUsersTopicHistory: new Map([
          ['user2', [{ topicId: 'robotics', engagementScore: 0.8, articleCount: 3, timeSpent: 900, lastEngagement: new Date() }]],
          ['user3', [{ topicId: 'tech', engagementScore: 0.7, articleCount: 2, timeSpent: 600, lastEngagement: new Date() }]],
          ['user4', [{ topicId: 'science', engagementScore: 0.6, articleCount: 1, timeSpent: 300, lastEngagement: new Date() }]],
          ['user5', [{ topicId: 'health', engagementScore: 0.5, articleCount: 1, timeSpent: 300, lastEngagement: new Date() }]],
        ]),
        topicEmbeddings,
      };

      const recommendations = recommender.rankBySerendipity(input, 2);
      expect(recommendations.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('handleColdStartTopics', () => {
  it('should return trending topics for new users', () => {
    const trendingTopics = ['ai', 'science', 'robotics', 'tech', 'health'];
    const topicNames = new Map([
      ['ai', 'Artificial Intelligence'],
      ['science', 'Science'],
      ['robotics', 'Robotics'],
      ['tech', 'Technology'],
      ['health', 'Health'],
    ]);

    const recommendations = handleColdStartTopics(trendingTopics, topicNames);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(4); // 3 trending + 1 serendipitous
  });

  it('should include at least 3 trending topics', () => {
    const trendingTopics = ['ai', 'science', 'robotics', 'tech'];
    const topicNames = new Map([
      ['ai', 'AI'],
      ['science', 'Science'],
      ['robotics', 'Robotics'],
      ['tech', 'Tech'],
    ]);

    const recommendations = handleColdStartTopics(trendingTopics, topicNames);
    const trendingCount = recommendations.filter((r) => r.reason === 'Trending topic').length;

    expect(trendingCount).toBeGreaterThanOrEqual(3);
  });

  it('should handle small trending list', () => {
    const trendingTopics = ['ai'];
    const topicNames = new Map([['ai', 'AI']]);

    const recommendations = handleColdStartTopics(trendingTopics, topicNames);

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].topicId).toBe('ai');
  });
});

describe('getTopicRecommendations', () => {
  it('should return topic recommendations for a user', async () => {
    const topicEmbeddings = new Map([
      ['ai', [1, 0, 0, 0, 0]],
      ['science', [0, 1, 0, 0, 0]],
      ['robotics', [0.8, 0.2, 0, 0, 0]],
    ]);

    const articleEmbeddings = new Map([
      ['article1', [1, 0, 0, 0, 0]],
      ['article2', [0, 1, 0, 0, 0]],
    ]);

    const userReadHistory = {
      userId: 'user1',
      articles: [
        {
          id: 'article1',
          topicId: 'ai',
          title: 'AI Article',
          timeSpent: Date.now() - 1000,
          isBookmarked: true,
        },
      ],
    };

    const similarUserHistories = new Map([
      [
        'user2',
        {
          userId: 'user2',
          articles: [
            {
              id: 'article2',
              topicId: 'science',
              title: 'Science Article',
              timeSpent: Date.now() - 1000,
              isBookmarked: true,
            },
          ],
        },
      ],
    ]);

    const recommendations = await getTopicRecommendations(
      'user1',
      userReadHistory,
      ['user2'],
      similarUserHistories,
      topicEmbeddings,
      articleEmbeddings
    );

    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
  });
});
