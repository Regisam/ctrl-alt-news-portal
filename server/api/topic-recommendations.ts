import { Router, type Request, type Response } from 'express';
import type { RecommendedTopic } from '../../shared/lib/topicRecommendations.js';

const router = Router();

// Mock data for topic recommendations - replace with database call and real ML engine
const getMockTopicRecommendations = (userId: string): RecommendedTopic[] => {
  return [
    {
      topicId: 'quantum-computing',
      topicName: 'Quantum Computing',
      adoptionProbability: 0.82,
      reason: 'Popular among AI readers',
      similarityScore: 0.75,
      similarUserCount: 234,
    },
    {
      topicId: 'neural-networks',
      topicName: 'Neural Networks',
      adoptionProbability: 0.78,
      reason: 'Users like you follow this',
      similarityScore: 0.72,
      similarUserCount: 189,
    },
    {
      topicId: 'space-exploration',
      topicName: 'Space Exploration',
      adoptionProbability: 0.65,
      reason: 'Trending among similar users',
      similarityScore: 0.68,
      similarUserCount: 156,
    },
    {
      topicId: 'biotech',
      topicName: 'Biotechnology',
      adoptionProbability: 0.62,
      reason: 'Complement to your interests',
      similarityScore: 0.65,
      similarUserCount: 142,
    },
    {
      topicId: 'green-energy',
      topicName: 'Green Energy',
      adoptionProbability: 0.58,
      reason: 'Rising interest in your network',
      similarityScore: 0.62,
      similarUserCount: 128,
    },
  ];
};

/**
 * GET /api/topic-recommendations/:userId
 *
 * Returns personalized topic recommendations for a user using the Topic Bridging Algorithm.
 * Currently returns mock data; will integrate with real ML engine when database is available.
 *
 * @param userId - User ID to get recommendations for
 * @param maxTopics - Max topics to return (default: 5)
 *
 * @returns {RecommendedTopic[]} Array of recommended topics ranked by adoption probability
 *
 * @example
 * GET /api/topic-recommendations/user-123?maxTopics=5
 * {
 *   topicId: 'quantum-computing',
 *   topicName: 'Quantum Computing',
 *   adoptionProbability: 0.82,
 *   reason: 'Popular among AI readers',
 *   similarityScore: 0.75,
 *   similarUserCount: 234
 * }
 *
 * TODO: Replace mock data with real implementation:
 * 1. Fetch user reading history from database
 * 2. Find similar users using collaborative filtering
 * 3. Get similar users' topic histories
 * 4. Compute topic embeddings from article embeddings
 * 5. Call TopicRecommender.rankBySerendipity()
 * 6. Apply diversity constraints and A/B test variants
 * 7. Return ranked RecommendedTopic[] with explanations
 */
router.get('/topic-recommendations/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const maxTopics = parseInt(req.query.maxTopics as string) || 5;

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }

    const recommendations = getMockTopicRecommendations(userId);
    const limited = recommendations.slice(0, Math.max(1, Math.min(maxTopics, 10)));

    res.json({
      userId,
      timestamp: new Date().toISOString(),
      recommendations: limited,
      meta: {
        count: limited.length,
        source: 'mock', // TODO: change to 'ml-engine' when real
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Topic recommendations error:', message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
