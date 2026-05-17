import { describe, it, expect, beforeEach } from 'vitest';
import {
  cosineSimilarity,
  computeTopicDistance,
  computeCollaborativeNovelty,
  blendSerendipityScore,
  SerendipityScorer,
  DEFAULT_SERENDIPITY_THRESHOLDS,
  DEFAULT_DIVERSITY_CONSTRAINT,
  type SerendipityInput,
  type ArticleFeature,
  type CollaborativeContext,
} from '@shared/lib/serendipityScorer';

// ============================================================================
// SECTION 1: Helper Functions (cosineSimilarity, distance, novelty, blending)
// ============================================================================

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1);
  });

  it('should return 0 for orthogonal vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [0, 1, 0];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(0, 5);
  });

  it('should return -1 for opposite vectors', () => {
    const v1 = [1, 0, 0];
    const v2 = [-1, 0, 0];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1);
  });

  it('should be symmetric', () => {
    const v1 = [1, 2, 3];
    const v2 = [4, 5, 6];
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(
      cosineSimilarity(v2, v1)
    );
  });

  it('should handle normalized vectors correctly', () => {
    const v1 = [0.6, 0.8]; // normalized
    const v2 = [0.6, 0.8]; // normalized
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(1);
  });

  it('should handle zero vectors gracefully (returns 0 not NaN)', () => {
    const v1 = [0, 0, 0];
    const v2 = [1, 1, 1];
    expect(cosineSimilarity(v1, v2)).toBe(0);
  });
});

describe('computeTopicDistance', () => {
  const topicEmbeddings: import('@shared/lib/serendipityScorer').TopicEmbeddings = {
    embeddings: new Map<string, number[]>([
      ['AI', [1, 0, 0]],
      ['Science', [0, 1, 0]],
      ['Robotics', [0.7, 0.3, 0]],
    ]),
    lastUpdated: new Date(),
  };

  it('should return 0 for article in same topic as primary', () => {
    const articleEmbedding = [1, 0, 0]; // Same as AI
    const userTopics = ['AI'];
    const distance = computeTopicDistance(
      articleEmbedding,
      userTopics,
      topicEmbeddings
    );
    expect(distance).toBeCloseTo(0); // max similarity = 1, so distance = 0
  });

  it('should return ~1 for article orthogonal to all primary topics', () => {
    const articleEmbedding = [0, 0, 1]; // Orthogonal to AI, Science, Robotics
    const userTopics = ['AI', 'Science'];
    const distance = computeTopicDistance(
      articleEmbedding,
      userTopics,
      topicEmbeddings
    );
    expect(distance).toBeCloseTo(1, 1); // max similarity = 0, so distance = 1
  });

  it('should be [0,1] for intermediate distance', () => {
    const articleEmbedding = [0.7, 0.3, 0]; // Robotics
    const userTopics = ['AI'];
    const distance = computeTopicDistance(
      articleEmbedding,
      userTopics,
      topicEmbeddings
    );
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1);
  });

  it('should handle multiple primary topics (take max similarity)', () => {
    const articleEmbedding = [0.5, 0.5, 0]; // Between AI and Science
    const userTopics = ['AI', 'Science']; // User likes both
    const distance = computeTopicDistance(
      articleEmbedding,
      userTopics,
      topicEmbeddings
    );
    // Should be close to the more similar topic (not averaging)
    expect(distance).toBeLessThan(0.5);
  });

  it('should handle empty primary topics (returns 0.5 neutral)', () => {
    const articleEmbedding = [1, 0, 0];
    const userTopics: string[] = [];
    const distance = computeTopicDistance(
      articleEmbedding,
      userTopics,
      topicEmbeddings
    );
    expect(distance).toBe(0.5); // Neutral distance for edge case
  });
});

describe('computeCollaborativeNovelty', () => {
  it('should return 0 if user has already read article (user in similarUserReadHistories)', () => {
    const collaborativeContext: CollaborativeContext = {
      userId: 'user1',
      similarUsers: ['user1', 'user2', 'user3'], // user1 is also a similar user
      similarUserReadHistories: new Map([
        ['user1', new Set(['article1'])], // user1 already read
        ['user2', new Set(['article1'])],
        ['user3', new Set(['article1'])],
      ]),
      similarityScores: new Map([
        ['user1', 1.0],
        ['user2', 0.8],
        ['user3', 0.7],
      ]),
    };
    const novelty = computeCollaborativeNovelty(
      'user1',
      'article1',
      collaborativeContext
    );
    expect(novelty).toBe(0); // User has already read, no novelty
  });

  it('should return ~1 if all similar users have read and user hasnt', () => {
    const collaborativeContext: CollaborativeContext = {
      userId: 'user1',
      similarUsers: ['user2', 'user3', 'user4'],
      similarUserReadHistories: new Map([
        ['user2', new Set(['article1'])],
        ['user3', new Set(['article1'])],
        ['user4', new Set(['article1'])],
      ]),
      similarityScores: new Map([
        ['user2', 0.8],
        ['user3', 0.7],
        ['user4', 0.6],
      ]),
    };
    const novelty = computeCollaborativeNovelty(
      'user1',
      'article1', // article1 not in user1's history
      collaborativeContext
    );
    expect(novelty).toBeCloseTo(1); // All similar users have read (3/3)
  });

  it('should return 0.33 if 1/3 of similar users have read', () => {
    const collaborativeContext: CollaborativeContext = {
      userId: 'user1',
      similarUsers: ['user2', 'user3', 'user4'],
      similarUserReadHistories: new Map([
        ['user2', new Set(['article1'])],
        ['user3', new Set()],
        ['user4', new Set()],
      ]),
      similarityScores: new Map([
        ['user2', 0.8],
        ['user3', 0.7],
        ['user4', 0.6],
      ]),
    };
    const novelty = computeCollaborativeNovelty(
      'user1',
      'article1',
      collaborativeContext
    );
    expect(novelty).toBeCloseTo(0.33, 1); // 1/3 similar users read article1
  });

  it('should return 0.5 for neutral novelty when no similar users exist', () => {
    const collaborativeContext: CollaborativeContext = {
      userId: 'user1',
      similarUsers: [],
      similarUserReadHistories: new Map(),
      similarityScores: new Map(),
    };
    const novelty = computeCollaborativeNovelty(
      'user1',
      'article1',
      collaborativeContext
    );
    expect(novelty).toBe(0.5); // Neutral novelty for new/cold-start users
  });
});

describe('blendSerendipityScore', () => {
  it('should blend with weights 0.4/0.4/0.2', () => {
    const topicDistance = 0.8;
    const collaborativeNovelty = 0.6;
    const articleQuality = 0.5;

    const score = blendSerendipityScore(
      topicDistance,
      collaborativeNovelty,
      articleQuality
    );

    // Expected: (0.8 * 0.4) + (0.6 * 0.4) + (0.5 * 0.2) = 0.32 + 0.24 + 0.1 = 0.66
    expect(score).toBeCloseTo(0.66);
  });

  it('should return 0 if all inputs are 0', () => {
    const score = blendSerendipityScore(0, 0, 0);
    expect(score).toBe(0);
  });

  it('should return 1 if all inputs are 1', () => {
    const score = blendSerendipityScore(1, 1, 1);
    expect(score).toBe(1);
  });

  it('should respect weight distribution (quality has 20% impact)', () => {
    const score1 = blendSerendipityScore(0.5, 0.5, 0.0);
    const score2 = blendSerendipityScore(0.5, 0.5, 1.0);
    // Difference should be exactly 0.2 (quality weight)
    expect(score2 - score1).toBeCloseTo(0.2);
  });
});

// ============================================================================
// SECTION 2: SerendipityScorer Class - Configuration & Validation
// ============================================================================

describe('SerendipityScorer - Configuration', () => {
  let topicEmbeddings: Map<string, number[]>;
  let scorer: SerendipityScorer;

  beforeEach(() => {
    topicEmbeddings = {
      embeddings: new Map([
        ['AI', [1, 0, 0]],
        ['Science', [0, 1, 0]],
        ['Robotics', [0.7, 0.3, 0]],
      ]),
      lastUpdated: new Date(),
    };
    scorer = new SerendipityScorer(
      topicEmbeddings,
      DEFAULT_SERENDIPITY_THRESHOLDS,
      DEFAULT_DIVERSITY_CONSTRAINT
    );
  });

  it('should initialize with default thresholds', () => {
    const config = scorer.getConfig();
    expect(config.thresholds).toEqual(DEFAULT_SERENDIPITY_THRESHOLDS);
  });

  it('should initialize with default diversity constraint', () => {
    const config = scorer.getConfig();
    expect(config.diversityConstraint).toEqual(DEFAULT_DIVERSITY_CONSTRAINT);
  });

  it('should validate thresholds in [0,1] range', () => {
    expect(() => {
      scorer.validateThresholds();
    }).not.toThrow();
  });

  it('should detect invalid threshold (< 0)', () => {
    expect(() => {
      scorer.setThresholds({ minTopicDistance: -0.1 });
      scorer.validateThresholds();
    }).toThrow();
  });

  it('should detect invalid threshold (> 1)', () => {
    expect(() => {
      scorer.setThresholds({ minTopicDistance: 1.1 });
      scorer.validateThresholds();
    }).toThrow();
  });

  it('should update thresholds via setThresholds', () => {
    scorer.setThresholds({
      minTopicDistance: 0.7,
      minCollaborativeNovelty: 0.4,
    });
    const config = scorer.getConfig();
    expect(config.thresholds.minTopicDistance).toBe(0.7);
    expect(config.thresholds.minCollaborativeNovelty).toBe(0.4);
  });

  it('should update diversity constraint via setDiversityConstraint', () => {
    scorer.setDiversityConstraint({
      maxArticlesPerTopic: 3,
      enforceRoundRobin: false,
    });
    const config = scorer.getConfig();
    expect(config.diversityConstraint.maxArticlesPerTopic).toBe(3);
    expect(config.diversityConstraint.enforceRoundRobin).toBe(false);
  });

  it('should support partial updates (not overwrite entire config)', () => {
    const originalNovelty = scorer.getConfig().thresholds.minCollaborativeNovelty;
    scorer.setThresholds({ minTopicDistance: 0.5 });
    const updated = scorer.getConfig();
    expect(updated.thresholds.minTopicDistance).toBe(0.5);
    expect(updated.thresholds.minCollaborativeNovelty).toBe(originalNovelty);
  });
});

// ============================================================================
// SECTION 3: SerendipityScorer Class - Scoring & Ranking
// ============================================================================

describe('SerendipityScorer - Scoring Algorithm', () => {
  let topicEmbeddings: Map<string, number[]>;
  let scorer: SerendipityScorer;
  let mockArticles: ArticleFeature[];
  let mockContext: CollaborativeContext;

  beforeEach(() => {
    topicEmbeddings = {
      embeddings: new Map([
        ['AI', [1, 0, 0]],
        ['Science', [0, 1, 0]],
        ['Robotics', [0.7, 0.3, 0]],
        ['Gadgets', [0, 0, 1]],
      ]),
      lastUpdated: new Date(),
    };

    mockArticles = [
      {
        articleId: 'art1',
        topic: 'AI',
        title: 'GPT-5 Released',
        embedding: [1, 0, 0],
      },
      {
        articleId: 'art2',
        topic: 'Science',
        title: 'New Physics Discovery',
        embedding: [0, 1, 0],
      },
      {
        articleId: 'art3',
        topic: 'Gadgets',
        title: 'New Phone Released',
        embedding: [0, 0, 1],
      },
    ];

    mockContext = {
      userId: 'user1',
      similarUsers: ['user2', 'user3'],
      similarUserReadHistories: new Map([
        ['user2', new Set(['art1', 'art2'])],
        ['user3', new Set(['art2'])],
      ]),
      similarityScores: new Map([
        ['user2', 0.8],
        ['user3', 0.7],
      ]),
    };

    scorer = new SerendipityScorer(
      topicEmbeddings,
      DEFAULT_SERENDIPITY_THRESHOLDS,
      DEFAULT_DIVERSITY_CONSTRAINT
    );
  });

  it('should score articles by serendipity', () => {
    const articleQualities = new Map([
      ['art1', 0.6],
      ['art2', 0.7],
      ['art3', 0.8],
    ]);

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: ['AI'],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      articleQualities
    );

    expect(rankings).toHaveLength(3);
    expect(rankings[0]).toHaveProperty('serendipityScore');
    expect(rankings[0].serendipityScore).toBeGreaterThanOrEqual(0);
    expect(rankings[0].serendipityScore).toBeLessThanOrEqual(1);
  });

  it('should rank articles descending by serendipity score', () => {
    const articleQualities = new Map([
      ['art1', 0.5],
      ['art2', 0.7],
      ['art3', 0.9],
    ]);

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: ['AI'],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      articleQualities
    );

    // Science ranks first because:
    // - Distance from AI: 1.0 (same as Gadgets)
    // - Collaborative novelty: 0.5 (user2 read art2) > 0 (no one read art3)
    // Score: (1*0.4) + (0.5*0.4) + (0.7*0.2) = 0.74 > (1*0.4) + (0*0.4) + (0.9*0.2) = 0.58
    expect(rankings[0].topic).toBe('Science');
    expect(rankings[1].topic).toBe('Gadgets');
    expect(rankings[0].serendipityScore).toBeGreaterThan(rankings[1].serendipityScore);
  });

  it('should filter articles below threshold', () => {
    const articleQualities = new Map([
      ['art1', 0.1],
      ['art2', 0.1],
      ['art3', 0.1],
    ]);

    scorer.setThresholds({ minSerendipityScore: 0.9 }); // Very high threshold

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: ['AI'],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      articleQualities
    );

    const serendipitous = scorer.getSerendipitousArticles(rankings);
    expect(serendipitous).toHaveLength(0); // No articles exceed threshold
  });

  it('should include explanation reason in ranking', () => {
    const articleQualities = new Map([
      ['art1', 0.6],
      ['art2', 0.7],
      ['art3', 0.8],
    ]);

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: ['AI'],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      articleQualities
    );

    expect(rankings[0]).toHaveProperty('noveltyReason');
    expect(rankings[0].noveltyReason).toBeTruthy();
  });
});

// ============================================================================
// SECTION 4: SerendipityScorer Class - Diversity & Round-Robin
// ============================================================================

describe('SerendipityScorer - Diversity Constraints', () => {
  let topicEmbeddings: import('@shared/lib/serendipityScorer').TopicEmbeddings;
  let scorer: SerendipityScorer;
  let mockArticles: ArticleFeature[];
  let mockContext: CollaborativeContext;

  beforeEach(() => {
    topicEmbeddings = {
      embeddings: new Map([
        ['AI', [1, 0, 0]],
        ['AI-ML', [0.9, 0.1, 0]],
        ['Science', [0, 1, 0]],
        ['Robotics', [0.7, 0.3, 0]],
      ]),
      lastUpdated: new Date(),
    };

    // Create 6 articles to test diversity
    mockArticles = [
      {
        articleId: 'art1',
        topic: 'AI',
        title: 'Title 1',
        embedding: [1, 0, 0],
      },
      {
        articleId: 'art2',
        topic: 'AI',
        title: 'Title 2',
        embedding: [0.95, 0.05, 0],
      },
      {
        articleId: 'art3',
        topic: 'AI-ML',
        title: 'Title 3',
        embedding: [0.9, 0.1, 0],
      },
      {
        articleId: 'art4',
        topic: 'Science',
        title: 'Title 4',
        embedding: [0, 1, 0],
      },
      {
        articleId: 'art5',
        topic: 'Robotics',
        title: 'Title 5',
        embedding: [0.7, 0.3, 0],
      },
      {
        articleId: 'art6',
        topic: 'Robotics',
        title: 'Title 6',
        embedding: [0.71, 0.29, 0],
      },
    ];

    mockContext = {
      userId: 'user1',
      similarUsers: ['user2'],
      similarUserReadHistories: new Map([
        [
          'user2',
          new Set([
            'art1',
            'art2',
            'art3',
            'art4',
            'art5',
            'art6',
          ]),
        ],
      ]),
      similarityScores: new Map([['user2', 0.8]]),
    };

    scorer = new SerendipityScorer(
      topicEmbeddings,
      DEFAULT_SERENDIPITY_THRESHOLDS,
      DEFAULT_DIVERSITY_CONSTRAINT
    );
  });

  it('should enforce max articles per topic (default: 2)', () => {
    const articleQualities = new Map(
      mockArticles.map((a) => [a.articleId, 0.8])
    );

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: ['Science'],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      articleQualities
    );

    const serendipitous = scorer.getSerendipitousArticles(rankings);
    const diversified = scorer.diversifySerendipity(serendipitous);

    const topicCounts = new Map<string, number>();
    diversified.forEach((r) => {
      topicCounts.set(r.topic, (topicCounts.get(r.topic) || 0) + 1);
    });

    topicCounts.forEach((count) => {
      expect(count).toBeLessThanOrEqual(
        DEFAULT_DIVERSITY_CONSTRAINT.maxArticlesPerTopic
      );
    });
  });

  it('should support round-robin selection when enabled', () => {
    scorer.setDiversityConstraint({ enforceRoundRobin: true });
    const config = scorer.getConfig();
    expect(config.diversityConstraint.enforceRoundRobin).toBe(true);
  });

  it('should allow disabling round-robin', () => {
    scorer.setDiversityConstraint({ enforceRoundRobin: false });
    const config = scorer.getConfig();
    expect(config.diversityConstraint.enforceRoundRobin).toBe(false);
  });

  it('should balance topic representation when enabled', () => {
    scorer.setDiversityConstraint({ balanceTopicRepresentation: true });
    const config = scorer.getConfig();
    expect(config.diversityConstraint.balanceTopicRepresentation).toBe(true);
  });
});

// ============================================================================
// SECTION 5: Edge Cases & Integration Tests
// ============================================================================

describe('SerendipityScorer - Edge Cases', () => {
  let topicEmbeddings: import('@shared/lib/serendipityScorer').TopicEmbeddings;
  let scorer: SerendipityScorer;

  beforeEach(() => {
    topicEmbeddings = {
      embeddings: new Map([
        ['AI', [1, 0, 0]],
        ['Science', [0, 1, 0]],
      ]),
      lastUpdated: new Date(),
    };
    scorer = new SerendipityScorer(
      topicEmbeddings,
      DEFAULT_SERENDIPITY_THRESHOLDS,
      DEFAULT_DIVERSITY_CONSTRAINT
    );
  });

  it('should handle empty candidate articles', () => {
    const mockContext: CollaborativeContext = {
      userId: 'user1',
      similarUsers: [],
      similarUserReadHistories: new Map(),
      similarityScores: new Map(),
    };

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: ['AI'],
        userReadHistory: new Set(),
        candidateArticles: [],
      },
      mockContext,
      new Map()
    );

    expect(rankings).toHaveLength(0);
  });

  it('should handle single candidate article', () => {
    const mockArticles: ArticleFeature[] = [
      {
        articleId: 'art1',
        topic: 'Science',
        title: 'Test',
        embedding: [0, 1, 0],
      },
    ];

    const mockContext: CollaborativeContext = {
      userId: 'user1',
      similarUsers: [],
      similarUserReadHistories: new Map(),
      similarityScores: new Map(),
    };

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: ['AI'],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      new Map([['art1', 0.5]])
    );

    expect(rankings).toHaveLength(1);
  });

  it('should handle user with no primary topics', () => {
    const mockArticles: ArticleFeature[] = [
      {
        articleId: 'art1',
        topic: 'AI',
        title: 'Test',
        embedding: [1, 0, 0],
      },
    ];

    const mockContext: CollaborativeContext = {
      userId: 'user1',
      similarUsers: [],
      similarUserReadHistories: new Map(),
      similarityScores: new Map(),
    };

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'user1',
        userPrimaryTopics: [],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      new Map([['art1', 0.5]])
    );

    expect(rankings).toHaveLength(1);
  });

  it('should handle cold-start: new user (no read history)', () => {
    const mockArticles: ArticleFeature[] = [
      {
        articleId: 'art1',
        topic: 'AI',
        title: 'Test',
        embedding: [1, 0, 0],
      },
    ];

    const mockContext: CollaborativeContext = {
      userId: 'new-user',
      similarUsers: [],
      similarUserReadHistories: new Map(),
      similarityScores: new Map(),
    };

    const rankings = scorer.rankBySerendipity(
      {
        userId: 'new-user',
        userPrimaryTopics: [],
        userReadHistory: new Set(),
        candidateArticles: mockArticles,
      },
      mockContext,
      new Map([['art1', 0.5]])
    );

    expect(rankings).toHaveLength(1);
  });
});

describe('SerendipityScorer - A/B Testing Support', () => {
  let topicEmbeddings: import('@shared/lib/serendipityScorer').TopicEmbeddings;
  let scorer: SerendipityScorer;

  beforeEach(() => {
    topicEmbeddings = {
      embeddings: new Map([
        ['AI', [1, 0, 0]],
        ['Science', [0, 1, 0]],
      ]),
      lastUpdated: new Date(),
    };
    scorer = new SerendipityScorer(
      topicEmbeddings,
      DEFAULT_SERENDIPITY_THRESHOLDS,
      DEFAULT_DIVERSITY_CONSTRAINT
    );
  });

  it('should support dynamic threshold changes for A/B testing', () => {
    // Control group: conservative thresholds
    scorer.setThresholds({
      minTopicDistance: 0.6,
      minSerendipityScore: 0.4,
    });
    let config = scorer.getConfig();
    expect(config.thresholds.minTopicDistance).toBe(0.6);

    // Treatment group: aggressive thresholds
    scorer.setThresholds({
      minTopicDistance: 0.5,
      minSerendipityScore: 0.3,
    });
    config = scorer.getConfig();
    expect(config.thresholds.minTopicDistance).toBe(0.5);
  });

  it('should support dynamic diversity changes for A/B testing', () => {
    // Control: max 2 articles per topic
    scorer.setDiversityConstraint({ maxArticlesPerTopic: 2 });
    let config = scorer.getConfig();
    expect(config.diversityConstraint.maxArticlesPerTopic).toBe(2);

    // Treatment: max 1 article per topic (stricter)
    scorer.setDiversityConstraint({ maxArticlesPerTopic: 1 });
    config = scorer.getConfig();
    expect(config.diversityConstraint.maxArticlesPerTopic).toBe(1);
  });

  it('should report current configuration correctly', () => {
    const config = scorer.getConfig();
    expect(config).toHaveProperty('thresholds');
    expect(config).toHaveProperty('diversityConstraint');
    expect(config.thresholds).toHaveProperty('minTopicDistance');
    expect(config.diversityConstraint).toHaveProperty('maxArticlesPerTopic');
  });
});
