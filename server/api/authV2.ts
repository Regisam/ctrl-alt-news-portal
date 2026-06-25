import { Router } from 'express';
import { authService } from '../lib/authService.js';
import { logger } from '../logger.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// AC1: User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.badRequest('Missing required fields: email, password, name');
    }

    if (!authService.isValidEmail(email)) {
      return res.badRequest('Invalid email format');
    }

    const passwordValidation = authService.isValidPassword(password);
    if (!passwordValidation.valid) {
      return res.badRequest('Password does not meet requirements', {
        errors: passwordValidation.errors,
      });
    }

    // AC9: Check for duplicate
    // TODO: Query database for existing user
    // if (userExists) return res.conflict('Email already registered');

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // TODO: Create user in database
    // const user = await db.user.create({ email, password: hashedPassword, name });

    // Mock user for now
    const user = { id: `user-${Date.now()}`, email, name };

    // Generate token
    const token = authService.generateToken(user.id, email);

    res.created(
      {
        user,
        token,
        expiresIn: '24h',
      },
      'User registered successfully'
    );
  } catch (error) {
    logger.error('Registration failed', { error });
    res.error(500, 'Registration failed');
  }
});

// AC2: User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.badRequest('Missing email or password');
    }

    // TODO: Query database for user
    // const user = await db.user.findUnique({ where: { email } });

    // Mock user for now
    const mockUser = { id: 'user-123', email: 'test@example.com', password: '' };
    // if (!user) return res.notFound('User not found');

    // Verify password
    // const passwordValid = await authService.verifyPassword(password, user.password);
    // if (!passwordValid) return res.badRequest('Invalid credentials');

    const token = authService.generateToken(mockUser.id, mockUser.email);

    res.success({
      user: { id: mockUser.id, email: mockUser.email },
      token,
      expiresIn: '24h',
    });
  } catch (error) {
    logger.error('Login failed', { error });
    res.error(500, 'Login failed');
  }
});

// AC7: Logout
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const token = authService.extractToken(req.headers.authorization);

    if (token) {
      authService.revokeToken(token);
    }

    res.success({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', { error });
    res.error(500, 'Logout failed');
  }
});

// AC8: Request password reset
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.badRequest('Email is required');
    }

    // TODO: Find user and send reset email
    // const user = await db.user.findUnique({ where: { email } });
    // if (!user) return res.notFound('User not found');

    // const resetToken = authService.generateResetToken(user.id);
    // TODO: Send email with reset link

    res.success({
      message: 'Password reset email sent',
    });
  } catch (error) {
    logger.error('Forgot password failed', { error });
    res.error(500, 'Failed to process password reset');
  }
});

// AC8: Reset password
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.badRequest('Token and new password required');
    }

    const userId = authService.verifyResetToken(token);

    if (!userId) {
      return res.badRequest('Invalid or expired reset token');
    }

    const validation = authService.isValidPassword(newPassword);
    if (!validation.valid) {
      return res.badRequest('Password does not meet requirements', {
        errors: validation.errors,
      });
    }

    // TODO: Hash and update password in database
    // const hashedPassword = await authService.hashPassword(newPassword);
    // await db.user.update({ where: { id: userId }, data: { password: hashedPassword } });

    res.success({
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error('Reset password failed', { error });
    res.error(500, 'Failed to reset password');
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  try {
    res.success({
      user: req.user,
    });
  } catch (error) {
    logger.error('Get user failed', { error });
    res.error(500, 'Failed to get user');
  }
});

export default router;
