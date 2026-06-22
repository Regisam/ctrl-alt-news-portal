import { Router } from 'express';
import { profileManager } from '../lib/profileManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Update profile
router.put('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, bio, expertiseTags, socialLinks, privacy, avatar } = req.body;

    const profile = profileManager.updateProfile(userId, {
      displayName,
      bio,
      expertiseTags,
      socialLinks,
      privacy,
      avatar,
    });

    res.json({
      message: 'Profile updated',
      profile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to update profile', { error });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// AC1: Get profile
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.query.requester as string;

    const profile = profileManager.getProfile(userId, requesterId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found or private' });
    }

    res.json({
      timestamp: new Date().toISOString(),
      profile,
    });
  } catch (error) {
    logger.error('Failed to get profile', { error });
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// AC2: Get stats
router.get('/:userId/stats', (req, res) => {
  try {
    const { userId } = req.params;

    const stats = profileManager.getStats(userId);

    res.json({
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    logger.error('Failed to get stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AC6 & AC7 & AC8: Get settings
router.get('/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;

    const settings = profileManager.getSettings(userId);

    res.json({
      timestamp: new Date().toISOString(),
      settings,
    });
  } catch (error) {
    logger.error('Failed to get settings', { error });
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update settings
router.put('/:userId/settings', (req, res) => {
  try {
    const { userId } = req.params;
    const { themePreference, emailDigestFrequency, notificationSettings } = req.body;

    const settings = profileManager.updateSettings(userId, {
      themePreference,
      emailDigestFrequency,
      notificationSettings,
    });

    res.json({
      message: 'Settings updated',
      settings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to update settings', { error });
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// AC9: Block user
router.post('/:userId/block/:blockedUserId', (req, res) => {
  try {
    const { userId, blockedUserId } = req.params;

    const success = profileManager.blockUser(userId, blockedUserId);

    if (!success) {
      return res.status(400).json({ error: 'Cannot block user' });
    }

    res.json({
      message: 'User blocked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to block user', { error });
    res.status(500).json({ error: 'Failed to block user' });
  }
});

// AC9: Unblock user
router.delete('/:userId/block/:blockedUserId', (req, res) => {
  try {
    const { userId, blockedUserId } = req.params;

    const success = profileManager.unblockUser(userId, blockedUserId);

    if (!success) {
      return res.status(404).json({ error: 'User not blocked' });
    }

    res.json({
      message: 'User unblocked',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to unblock user', { error });
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// AC9: Get blocked users
router.get('/:userId/blocked', (req, res) => {
  try {
    const { userId } = req.params;

    const blockedUsers = profileManager.getBlockedUsers(userId);

    res.json({
      timestamp: new Date().toISOString(),
      userId,
      count: blockedUsers.length,
      blockedUsers,
    });
  } catch (error) {
    logger.error('Failed to get blocked users', { error });
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
});

export default router;
