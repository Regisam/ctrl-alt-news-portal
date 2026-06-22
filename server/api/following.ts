import { Router } from 'express';
import { followingManager } from '../lib/followingManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Follow user
router.post('/follow-user', (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ error: 'followerId and followingId required' });
    }

    const follow = followingManager.followUser(followerId, followingId);

    if (!follow) {
      return res.status(400).json({ error: 'Cannot follow user (self or already following)' });
    }

    res.json({
      message: 'User followed',
      follow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to follow user', { error });
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// AC1: Unfollow user
router.post('/unfollow-user', (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ error: 'followerId and followingId required' });
    }

    const success = followingManager.unfollowUser(followerId, followingId);

    if (!success) {
      return res.status(404).json({ error: 'Not following user' });
    }

    res.json({
      message: 'User unfollowed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to unfollow user', { error });
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// AC2: Subscribe to author
router.post('/subscribe-author', (req, res) => {
  try {
    const { userId, authorId } = req.body;

    if (!userId || !authorId) {
      return res.status(400).json({ error: 'userId and authorId required' });
    }

    const subscription = followingManager.subscribeToAuthor(userId, authorId);

    if (!subscription) {
      return res.status(400).json({ error: 'Cannot subscribe (self or already subscribed)' });
    }

    res.json({
      message: 'Author subscribed',
      subscription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to subscribe to author', { error });
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// AC3: Subscribe to topic
router.post('/subscribe-topic', (req, res) => {
  try {
    const { userId, topicId } = req.body;

    if (!userId || !topicId) {
      return res.status(400).json({ error: 'userId and topicId required' });
    }

    const subscription = followingManager.subscribeToTopic(userId, topicId);

    if (!subscription) {
      return res.status(400).json({ error: 'Already subscribed to topic' });
    }

    res.json({
      message: 'Topic subscribed',
      subscription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to subscribe to topic', { error });
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// AC5: Get following list
router.get('/following/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const following = followingManager.getFollowing(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: following.length,
      following,
    });
  } catch (error) {
    logger.error('Failed to get following list', { error });
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// AC5: Get followers list
router.get('/followers/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const followers = followingManager.getFollowers(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: followers.length,
      followers,
    });
  } catch (error) {
    logger.error('Failed to get followers list', { error });
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// AC11: Check mutual followers
router.get('/mutual/:userId1/:userId2', (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const isMutual = followingManager.isMutualFollower(userId1, userId2);
    const mutuals = followingManager.getMutualFollowers(userId1, userId2);

    res.json({
      timestamp: new Date().toISOString(),
      userId1,
      userId2,
      isMutual,
      mutualCount: mutuals.length,
      mutuals,
    });
  } catch (error) {
    logger.error('Failed to get mutual followers', { error });
    res.status(500).json({ error: 'Failed to get mutuals' });
  }
});

// AC9: Get following recommendations
router.get('/recommendations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const recommendations = followingManager.getFollowingRecommendations(userId, limit);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    logger.error('Failed to get recommendations', { error });
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// AC4: Get user stats
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const stats = followingManager.getStats(userId);

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Check if following
router.get('/is-following/:followerId/:followingId', (req, res) => {
  try {
    const { followerId, followingId } = req.params;

    const isFollowing = followingManager.isFollowing(followerId, followingId);

    res.json({
      timestamp: new Date().toISOString(),
      followerId,
      followingId,
      isFollowing,
    });
  } catch (error) {
    logger.error('Failed to check following', { error });
    res.status(500).json({ error: 'Failed to check' });
  }
});

// Get global stats
router.get('/global-stats', (_req, res) => {
  try {
    const stats = followingManager.getGlobalStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get global stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
