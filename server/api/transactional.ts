import { Router } from 'express';
import { transactionalEmailService } from '../lib/transactionalEmailService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Send verification email
router.post('/send-verification', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { email } = req.body;

    if (!email) {
      return res.badRequest('Email is required');
    }

    // AC7: Generate token
    const token = transactionalEmailService.generateToken(userId, 'verification');

    // AC1: Send email
    const success = await transactionalEmailService.sendVerificationEmail(userId, email, token);

    if (!success) {
      return res.error(500, 'Failed to send verification email');
    }

    res.success({ message: 'Verification email sent', token });
  } catch (error) {
    logger.error('Failed to send verification email', { error });
    res.error(500, 'Failed to send verification email');
  }
});

// AC2: Send password reset email
router.post('/send-password-reset', (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email) {
      return res.badRequest('Email is required');
    }

    // AC7: Generate token
    const token = transactionalEmailService.generateToken(userId, 'password-reset');

    // AC2: Send email
    transactionalEmailService.sendPasswordResetEmail(userId, email, token).then((success) => {
      if (!success) {
        return res.error(500, 'Failed to send password reset email');
      }

      res.success({ message: 'Password reset email sent' });
    });
  } catch (error) {
    logger.error('Failed to send password reset email', { error });
    res.error(500, 'Failed to send password reset email');
  }
});

// AC3: Send welcome email
router.post('/send-welcome', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { email, name } = req.body;

    if (!email || !name) {
      return res.badRequest('Email and name are required');
    }

    // AC3: Send email
    const success = await transactionalEmailService.sendWelcomeEmail(userId, email, name);

    if (!success) {
      return res.error(500, 'Failed to send welcome email');
    }

    res.success({ message: 'Welcome email sent' });
  } catch (error) {
    logger.error('Failed to send welcome email', { error });
    res.error(500, 'Failed to send welcome email');
  }
});

// AC4: Send action confirmation
router.post('/send-confirmation', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { email, action, details } = req.body;

    if (!email || !action) {
      return res.badRequest('Email and action are required');
    }

    // AC4: Send email
    const success = await transactionalEmailService.sendConfirmationEmail(userId, email, action, details || {});

    if (!success) {
      return res.error(500, 'Failed to send confirmation email');
    }

    res.success({ message: 'Confirmation email sent' });
  } catch (error) {
    logger.error('Failed to send confirmation email', { error });
    res.error(500, 'Failed to send confirmation email');
  }
});

// AC7: Verify token
router.post('/verify-token', (req, res) => {
  try {
    const { token, type } = req.body;

    if (!token || !type) {
      return res.badRequest('Token and type are required');
    }

    const result = transactionalEmailService.validateToken(token, type);

    if (!result.valid) {
      return res.badRequest('Invalid or expired token');
    }

    res.success({ valid: true, userId: result.userId });
  } catch (error) {
    logger.error('Failed to verify token', { error });
    res.error(500, 'Failed to verify token');
  }
});

// AC7: Use token (mark as used)
router.post('/use-token', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.badRequest('Token is required');
    }

    const success = transactionalEmailService.useToken(token);

    if (!success) {
      return res.badRequest('Token not found');
    }

    res.success({ message: 'Token used successfully' });
  } catch (error) {
    logger.error('Failed to use token', { error });
    res.error(500, 'Failed to use token');
  }
});

// AC10: Get email log
router.get('/email-log', authMiddleware, (_req, res) => {
  try {
    const log = transactionalEmailService.getEmailLog();

    res.success({ log, count: log.length });
  } catch (error) {
    logger.error('Failed to get email log', { error });
    res.error(500, 'Failed to get email log');
  }
});

export default router;
