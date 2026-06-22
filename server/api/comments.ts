import { Router } from 'express';
import { commentManager } from '../lib/commentManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Create comment on article
router.post('/create', (req, res) => {
  try {
    const { articleId, userId, userName, content, parentCommentId } = req.body;

    if (!articleId || !userId || !userName || !content) {
      return res.status(400).json({ error: 'articleId, userId, userName, content required' });
    }

    const comment = commentManager.createComment(
      articleId,
      userId,
      userName,
      content,
      parentCommentId
    );

    res.json({
      message: 'Comment created',
      comment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create comment', { error });
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// AC6: Edit comment
router.put('/:commentId/edit', (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, newContent } = req.body;

    if (!userId || !newContent) {
      return res.status(400).json({ error: 'userId and newContent required' });
    }

    const updated = commentManager.editComment(commentId, userId, newContent);

    if (!updated) {
      return res.status(404).json({ error: 'Comment not found or not owned by user' });
    }

    res.json({
      message: 'Comment updated',
      comment: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to edit comment', { error });
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});

// AC6: Delete comment
router.delete('/:commentId', (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const success = commentManager.deleteComment(commentId, userId);

    if (!success) {
      return res.status(404).json({ error: 'Comment not found or not owned by user' });
    }

    res.json({
      message: 'Comment deleted',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to delete comment', { error });
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// AC4: Add reaction to comment
router.post('/:commentId/react', (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, reactionType } = req.body;

    if (!userId || !reactionType) {
      return res.status(400).json({ error: 'userId and reactionType required' });
    }

    const success = commentManager.addReaction(commentId, userId, reactionType);

    if (!success) {
      return res.status(400).json({ error: 'Failed to add reaction' });
    }

    res.json({
      message: 'Reaction added',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to add reaction', { error });
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// AC4: Remove reaction
router.post('/:commentId/unreact', (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId, reactionType } = req.body;

    if (!userId || !reactionType) {
      return res.status(400).json({ error: 'userId and reactionType required' });
    }

    const success = commentManager.removeReaction(commentId, userId, reactionType);

    if (!success) {
      return res.status(400).json({ error: 'Reaction not found' });
    }

    res.json({
      message: 'Reaction removed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to remove reaction', { error });
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// AC5: Flag comment for moderation
router.post('/:commentId/flag', (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'reason required' });
    }

    const success = commentManager.flagComment(commentId, reason);

    if (!success) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({
      message: 'Comment flagged for review',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to flag comment', { error });
    res.status(500).json({ error: 'Failed to flag comment' });
  }
});

// AC7 & AC8: Get comments for article with sorting
router.get('/article/:articleId', (req, res) => {
  try {
    const { articleId } = req.params;
    const sortBy = (req.query.sort as string) || 'newest';

    if (!['newest', 'top', 'controversial'].includes(sortBy)) {
      return res.status(400).json({ error: 'Invalid sort option' });
    }

    const comments = commentManager.getArticleComments(
      articleId,
      sortBy as 'newest' | 'top' | 'controversial'
    );

    res.json({
      timestamp: new Date().toISOString(),
      articleId,
      count: comments.length,
      sortBy,
      comments,
    });
  } catch (error) {
    logger.error('Failed to get comments', { error });
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

// AC3: Get nested replies for a comment
router.get('/:commentId/replies', (req, res) => {
  try {
    const { commentId } = req.params;

    const replies = commentManager.getCommentReplies(commentId);

    res.json({
      timestamp: new Date().toISOString(),
      parentCommentId: commentId,
      count: replies.length,
      replies,
    });
  } catch (error) {
    logger.error('Failed to get replies', { error });
    res.status(500).json({ error: 'Failed to get replies' });
  }
});

// Get user's comments
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    const comments = commentManager.getUserComments(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: comments.length,
      comments,
    });
  } catch (error) {
    logger.error('Failed to get user comments', { error });
    res.status(500).json({ error: 'Failed to get user comments' });
  }
});

// Get comment stats
router.get('/stats', (_req, res) => {
  try {
    const stats = commentManager.getStats();

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
