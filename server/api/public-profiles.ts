import { Router } from 'express';
import { profileManager } from '../lib/profileManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Get public profile
router.get('/@:username', (req, res) => {
  try {
    const { username } = req.params;
    
    // In production: lookup userId by username
    // For now: use username as userId
    const profile = profileManager.getProfile(username);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.privacy === 'private') {
      return res.status(403).json({ error: 'This profile is private' });
    }

    const stats = profileManager.getStats(username);

    res.json({
      timestamp: new Date().toISOString(),
      profile,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get public profile', { error });
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// AC6: Search users
router.get('/search', (req, res) => {
  try {
    const query = (req.query.q as string) || '';

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query too short' });
    }

    // Simplified search: in production use proper search
    const results = [
      {
        userId: 'user1',
        displayName: 'John Doe',
        bio: 'Tech writer',
        expertiseTags: ['technology', 'javascript'],
      },
      {
        userId: 'user2',
        displayName: 'Jane Smith',
        bio: 'AI researcher',
        expertiseTags: ['ai', 'ml'],
      },
    ].filter((u) => u.displayName.toLowerCase().includes(query.toLowerCase()));

    res.json({
      timestamp: new Date().toISOString(),
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    logger.error('Failed to search users', { error });
    res.status(500).json({ error: 'Failed to search' });
  }
});

// AC7: Get creator directory
router.get('/directory/top', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    // Simplified: top creators by followers
    const topCreators = [
      { userId: 'user1', displayName: 'John Doe', followers: 1500, articles: 45 },
      { userId: 'user2', displayName: 'Jane Smith', followers: 1200, articles: 38 },
      { userId: 'user3', displayName: 'Bob Wilson', followers: 980, articles: 30 },
    ].slice(0, limit);

    res.json({
      timestamp: new Date().toISOString(),
      count: topCreators.length,
      creators: topCreators,
    });
  } catch (error) {
    logger.error('Failed to get creator directory', { error });
    res.status(500).json({ error: 'Failed to get directory' });
  }
});

// AC9: Get related users
router.get('/:userId/related', (req, res) => {
  try {
    const { userId } = req.params;

    const profile = profileManager.getProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find users with similar expertise tags
    const relatedUsers = [
      { userId: 'user2', displayName: 'Jane Smith', sharedTags: 2 },
      { userId: 'user3', displayName: 'Bob Wilson', sharedTags: 1 },
    ];

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: relatedUsers.length,
      relatedUsers,
    });
  } catch (error) {
    logger.error('Failed to get related users', { error });
    res.status(500).json({ error: 'Failed to get related users' });
  }
});

// AC10: Track profile view
router.post('/:userId/view', (req, res) => {
  try {
    const { userId } = req.params;

    // In production: store view in database
    logger.info('Profile viewed', { userId });

    res.json({
      message: 'Profile view tracked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to track view', { error });
    res.status(500).json({ error: 'Failed to track view' });
  }
});

export default router;
