import { Router } from 'express';
import { emojiManager } from '../lib/emojiManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC3: Add emoji reaction
router.post('/react', (req, res) => {
  try {
    const { articleId, commentId, userId, emoji } = req.body;

    if (!userId || !emoji) {
      return res.status(400).json({ error: 'userId and emoji required' });
    }

    const targetId = articleId || commentId;
    if (!targetId) {
      return res.status(400).json({ error: 'articleId or commentId required' });
    }

    const reaction = emojiManager.addEmojiReaction(targetId, userId, emoji, !!commentId);

    if (!reaction) {
      return res.status(400).json({ error: 'Invalid emoji or already reacted' });
    }

    res.json({
      message: 'Emoji reaction added',
      reaction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to add emoji reaction', { error });
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove emoji reaction
router.post('/unreact/:reactionId', (req, res) => {
  try {
    const { reactionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const success = emojiManager.removeEmojiReaction(reactionId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Reaction not found or not owned by user' });
    }

    res.json({
      message: 'Emoji reaction removed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to remove emoji reaction', { error });
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// AC4: Get aggregated reactions for article/comment
router.get('/reactions/:targetId', (req, res) => {
  try {
    const { targetId } = req.params;
    const isComment = req.query.type === 'comment';

    const agg = emojiManager.getReactionAggregation(targetId, isComment);

    res.json({
      timestamp: new Date().toISOString(),
      aggregation: agg,
    });
  } catch (error) {
    logger.error('Failed to get reactions', { error });
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

// AC5: Get trending emojis
router.get('/trending', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

    const trending = emojiManager.getTrendingEmojis(limit);

    res.json({
      timestamp: new Date().toISOString(),
      count: trending.length,
      trending,
    });
  } catch (error) {
    logger.error('Failed to get trending emojis', { error });
    res.status(500).json({ error: 'Failed to get trending' });
  }
});

// AC5: Get sentiment distribution
router.get('/sentiment-distribution', (_req, res) => {
  try {
    const distribution = emojiManager.getSentimentDistribution();

    res.json({
      timestamp: new Date().toISOString(),
      distribution,
    });
  } catch (error) {
    logger.error('Failed to get sentiment distribution', { error });
    res.status(500).json({ error: 'Failed to get distribution' });
  }
});

// AC7: Get user emoji preferences
router.get('/preferences/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const preferences = emojiManager.getUserPreferences(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      preferences,
    });
  } catch (error) {
    logger.error('Failed to get preferences', { error });
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// AC9: Compare articles by emoji distribution
router.post('/compare', (req, res) => {
  try {
    const { articleIds } = req.body;

    if (!Array.isArray(articleIds) || articleIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 articleIds required' });
    }

    const comparison = emojiManager.compareArticles(articleIds);

    res.json({
      timestamp: new Date().toISOString(),
      comparison,
    });
  } catch (error) {
    logger.error('Failed to compare articles', { error });
    res.status(500).json({ error: 'Failed to compare articles' });
  }
});

// AC1: Get emoji library
router.get('/library', (_req, res) => {
  try {
    const library = emojiManager.getEmojiLibrary();

    res.json({
      timestamp: new Date().toISOString(),
      count: library.length,
      emojis: library,
    });
  } catch (error) {
    logger.error('Failed to get emoji library', { error });
    res.status(500).json({ error: 'Failed to get library' });
  }
});

// Get stats
router.get('/stats', (_req, res) => {
  try {
    const stats = emojiManager.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
