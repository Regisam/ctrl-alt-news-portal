import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../../logger.js';
import { getGoogleAuthUrl, exchangeCodeForToken, extractUserProfile } from '../services/google-oauth.js';

const router = express.Router();

interface RegisterRequest {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface User {
  id: string;
  email: string;
  createdAt: string;
}

// In-memory user store (Phase 1 - replace with DB in Phase 2)
const users: Map<string, { email: string; passwordHash: string; id: string; name?: string; avatar?: string; emailVerified?: boolean; googleId?: string }> = new Map();

// Validation functions
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateRegistration(body: RegisterRequest): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!body.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(body.email)) {
    errors.email = 'Invalid email format';
  }

  if (!body.password) {
    errors.password = 'Password is required';
  } else if (!validatePassword(body.password)) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!body.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required';
  } else if (body.password !== body.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// In-memory refresh token store (Phase 1 - replace with DB in Phase 2)
const refreshTokens: Map<string, { userId: string; expiresAt: number }> = new Map();

// In-memory verification token store (Phase 1 - replace with DB in Phase 2)
const verificationTokens: Map<string, { userId: string; email: string; expiresAt: number }> = new Map();

// In-memory password reset token store (Phase 1 - replace with DB in Phase 2)
const resetPasswordTokens: Map<string, { email: string; expiresAt: number }> = new Map();

// Track last reset request per email for rate limiting (5-minute window)
const lastResetRequest: Map<string, number> = new Map();

// Generate verification token (32-byte random)
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Get verification link (development returns link in response for testing)
function getVerificationLink(token: string): string {
  const baseUrl = process.env.GOOGLE_CALLBACK_URL?.replace('/auth/oauth/google/callback', '') || 'http://localhost:3000';
  return `${baseUrl}/verify-email?token=${token}`;
}

// Generate reset token (32-byte random)
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Get reset link (development returns link in response for testing)
function getResetLink(token: string): string {
  const baseUrl = process.env.GOOGLE_CALLBACK_URL?.replace('/auth/oauth/google/callback', '') || 'http://localhost:3000';
  return `${baseUrl}/reset-password?token=${token}`;
}

interface LoginRequest {
  email?: string;
  password?: string;
}

export function validateLogin(body: LoginRequest): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!body.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(body.email)) {
    errors.email = 'Invalid email format';
  }

  if (!body.password) {
    errors.password = 'Password is required';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as RegisterRequest;

    // Validate input
    const validation = validateRegistration(req.body);
    if (!validation.valid) {
      logger.warn(`Registration attempt with invalid data: ${JSON.stringify(validation.errors)}`);
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Check for duplicate email
    if (users.has(email!.toLowerCase())) {
      logger.warn(`Registration attempt with duplicate email: ${email}`);
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        errors: { email: 'This email is already registered' },
      });
    }

    // Hash password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password!, 10);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    users.set(email!.toLowerCase(), {
      email: email!,
      passwordHash,
      id: userId,
      emailVerified: false,
    });

    // Generate verification token (24-hour expiration)
    const verificationToken = generateVerificationToken();
    verificationTokens.set(verificationToken, {
      userId,
      email: email!,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    const verificationLink = getVerificationLink(verificationToken);

    // Log successful registration
    logger.info(`User registered successfully: ${email}`);

    // Return user data (no password) + verification link for testing
    const user: User = {
      id: userId,
      email: email!,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      user,
      verificationLink, // Development: returns link for testing (Phase 2: send via email)
    });
  } catch (error) {
    logger.error(`Registration error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validate input
    const validation = validateLogin(req.body);
    if (!validation.valid) {
      logger.warn(`Login attempt with invalid data: ${JSON.stringify(validation.errors)}`);
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Find user
    const user = users.get(email!.toLowerCase());
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errors: { email: 'Email not registered' },
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password!, user.passwordHash);
    if (!passwordMatch) {
      logger.warn(`Login attempt with invalid password for: ${email}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        errors: { password: 'Incorrect password' },
      });
    }

    // Generate access token (15-minute expiry)
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Generate refresh token (7-day expiry)
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // Store refresh token
    refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Log successful login
    logger.info(`User logged in successfully: ${email}`);

    // Set refresh token in httpOnly cookie (secure, sameSite=strict)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Return access token and user data
    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Extract refresh token from httpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.warn('Token refresh attempt with no refresh token in cookie');
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided',
      });
    }

    // Validate refresh token exists in store
    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData) {
      logger.warn('Token refresh attempt with invalid refresh token');
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }

    // Verify refresh token not expired
    if (tokenData.expiresAt < Date.now()) {
      logger.warn(`Token refresh attempt with expired refresh token for user: ${tokenData.userId}`);
      refreshTokens.delete(refreshToken);
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired',
      });
    }

    // Generate new access token (15-minute expiry)
    const newAccessToken = jwt.sign(
      { userId: tokenData.userId },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // Log successful refresh
    logger.info(`Token refreshed successfully for user: ${tokenData.userId}`);

    // Return new access token in response body
    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Extract refresh token from httpOnly cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      logger.warn('Logout attempt with no refresh token in cookie');
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // Remove refresh token from store (revoke)
    refreshTokens.delete(refreshToken);

    // Clear httpOnly cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Log successful logout
    logger.info('User logged out successfully');

    // Return success response
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error(`Logout error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/auth/oauth/google
router.get('/oauth/google', (req: Request, res: Response) => {
  try {
    const authUrl = getGoogleAuthUrl();
    logger.info('Generated Google OAuth consent URL');
    res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    logger.error(`OAuth consent URL generation error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Failed to generate consent URL',
    });
  }
});

// GET /api/auth/oauth/google/callback
router.get('/oauth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      logger.warn('OAuth callback without authorization code');
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code',
      });
    }

    // Exchange code for ID token
    const payload = await exchangeCodeForToken(code);
    if (!payload) {
      logger.warn('Failed to exchange authorization code for token');
      return res.status(400).json({
        success: false,
        error: 'Invalid authorization code',
      });
    }

    // Extract user profile from token
    const profile = extractUserProfile(payload);

    // Find or create user by email
    let user = users.get(profile.email.toLowerCase());
    const userId = user?.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!user) {
      // Create new user from Google profile
      users.set(profile.email.toLowerCase(), {
        email: profile.email,
        id: userId,
        passwordHash: '', // OAuth users don't have password
        name: profile.name,
        avatar: profile.picture,
        emailVerified: profile.email_verified,
        googleId: profile.id,
      });
      logger.info(`Created new user from OAuth: ${profile.email}`);
    } else {
      // Link to existing account
      user.name = profile.name;
      user.avatar = profile.picture;
      user.emailVerified = profile.email_verified;
      user.googleId = profile.id;
      logger.info(`Linked OAuth to existing user: ${profile.email}`);
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId, email: profile.email },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId, email: profile.email },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    // Store refresh token
    refreshTokens.set(refreshToken, {
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to home with accessToken in query param
    const redirectUrl = `${process.env.GOOGLE_CALLBACK_URL?.replace('/auth/oauth/google/callback', '') || 'http://localhost:3000'}/?accessToken=${accessToken}`;
    logger.info(`OAuth login successful for user: ${profile.email}`);
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error(`OAuth callback error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
});

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string') {
      logger.warn('Verify email attempt without token');
      return res.status(400).json({
        success: false,
        error: 'Missing verification token',
      });
    }

    // Check token exists
    const tokenData = verificationTokens.get(token);
    if (!tokenData) {
      logger.warn('Verify email attempt with invalid token');
      return res.status(404).json({
        success: false,
        error: 'Verification token not found',
      });
    }

    // Check token expiration (24 hours)
    if (tokenData.expiresAt < Date.now()) {
      verificationTokens.delete(token);
      logger.warn(`Verification token expired for: ${tokenData.email}`);
      return res.status(400).json({
        success: false,
        error: 'Verification token expired',
      });
    }

    // Find user and mark as verified
    const user = users.get(tokenData.email.toLowerCase());
    if (!user) {
      logger.warn(`User not found for email verification: ${tokenData.email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Mark email as verified
    user.emailVerified = true;

    // Remove token (one-time use)
    verificationTokens.delete(token);

    logger.info(`Email verified successfully for: ${tokenData.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
      email: tokenData.email,
    });
  } catch (error) {
    logger.error(`Email verification error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
    });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      logger.warn('Resend verification attempt without email');
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Find user
    const user = users.get(email.toLowerCase());
    if (!user) {
      logger.warn(`Resend verification attempt with non-existent email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      logger.warn(`Resend verification attempt for already verified email: ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Email already verified',
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    verificationTokens.set(verificationToken, {
      userId: user.id,
      email: email,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    const verificationLink = getVerificationLink(verificationToken);

    logger.info(`Verification token resent for: ${email}`);

    res.json({
      success: true,
      message: 'Verification token resent',
      verificationLink, // Development: returns link for testing (Phase 2: send via email)
    });
  } catch (error) {
    logger.error(`Resend verification error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Resend failed',
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      logger.warn('Forgot password attempt without email');
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Find user
    const user = users.get(email.toLowerCase());
    if (!user) {
      logger.warn(`Forgot password attempt with non-existent email: ${email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check rate limit (5-minute window)
    const lastRequest = lastResetRequest.get(email.toLowerCase());
    const now = Date.now();
    const cooldownMs = 5 * 60 * 1000;

    if (lastRequest && now - lastRequest < cooldownMs) {
      const remainingMs = cooldownMs - (now - lastRequest);
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      logger.warn(`Rate limited forgot password for ${email}, remaining wait: ${remainingMinutes} minutes`);
      return res.status(400).json({
        success: false,
        error: `Too many requests, try again in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`,
      });
    }

    // Generate reset token with 1-hour expiration
    const resetToken = generateResetToken();
    resetPasswordTokens.set(resetToken, {
      email: email.toLowerCase(),
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Update last reset request timestamp
    lastResetRequest.set(email.toLowerCase(), now);

    const resetLink = getResetLink(resetToken);

    logger.info(`Password reset token generated for: ${email}`);

    res.json({
      success: true,
      resetLink, // Development: returns link for testing (Phase 2: send via email)
      message: 'Password reset link sent to email',
    });
  } catch (error) {
    logger.error(`Forgot password error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Forgot password request failed',
    });
  }
});

// GET /api/auth/reset-password/:token
router.get('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string') {
      logger.warn('Reset password token validation attempt without token');
      return res.status(400).json({
        success: false,
        error: 'Missing reset token',
        valid: false,
      });
    }

    // Check token exists
    const tokenData = resetPasswordTokens.get(token);
    if (!tokenData) {
      logger.warn('Reset password token validation with invalid token');
      return res.status(404).json({
        success: false,
        error: 'Reset token not found',
        valid: false,
      });
    }

    // Check token expiration (1 hour)
    if (tokenData.expiresAt < Date.now()) {
      resetPasswordTokens.delete(token);
      logger.warn(`Reset token expired for: ${tokenData.email}`);
      return res.status(400).json({
        success: false,
        error: 'Reset token expired',
        valid: false,
      });
    }

    logger.info(`Reset token validated for: ${tokenData.email}`);

    res.json({
      success: true,
      valid: true,
      email: tokenData.email,
    });
  } catch (error) {
    logger.error(`Reset token validation error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Token validation failed',
      valid: false,
    });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || typeof token !== 'string') {
      logger.warn('Reset password attempt without token');
      return res.status(400).json({
        success: false,
        error: 'Missing reset token',
      });
    }

    if (!password || typeof password !== 'string') {
      logger.warn('Reset password attempt without password');
      return res.status(400).json({
        success: false,
        error: 'Password is required',
      });
    }

    // Validate password
    if (!validatePassword(password)) {
      logger.warn('Reset password attempt with invalid password');
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Check token exists
    const tokenData = resetPasswordTokens.get(token);
    if (!tokenData) {
      logger.warn('Reset password with invalid token');
      return res.status(404).json({
        success: false,
        error: 'Reset token not found',
      });
    }

    // Check token expiration
    if (tokenData.expiresAt < Date.now()) {
      resetPasswordTokens.delete(token);
      logger.warn(`Reset password with expired token for: ${tokenData.email}`);
      return res.status(400).json({
        success: false,
        error: 'Reset token expired',
      });
    }

    // Find user
    const user = users.get(tokenData.email);
    if (!user) {
      logger.warn(`Reset password user not found for: ${tokenData.email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Hash new password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    user.passwordHash = passwordHash;

    // Delete reset token (one-time use)
    resetPasswordTokens.delete(token);

    logger.info(`Password reset successfully for: ${tokenData.email}`);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error(`Reset password error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Password reset failed',
    });
  }
});

export default router;
