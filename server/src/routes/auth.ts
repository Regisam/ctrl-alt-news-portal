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

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Parse user agent to extract device information
function parseUserAgent(userAgent: string): { browser: string; os: string; deviceType: string } {
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let deviceType = 'desktop';

  // Browser detection
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge') || ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac') || ua.includes('iphone') || ua.includes('ipad')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('ubuntu')) os = 'Ubuntu';

  // Device type detection
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) deviceType = 'mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'tablet';

  return { browser, os, deviceType };
}

// Extract client IP address from request
function getClientIp(req: Request): string {
  const forwarded = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim();
  return forwarded || (req.ip as string) || 'unknown';
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

// In-memory email change verification token store (Phase 1 - replace with DB in Phase 2)
const emailChangeTokens: Map<string, { userId: string; newEmail: string; expiresAt: number }> = new Map();

// Interface for login history tracking
interface LoginEvent {
  sessionId: string;
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: string;
  type: 'local' | 'oauth';
}

// In-memory login history store (Phase 1 - replace with DB in Phase 2)
const loginHistory: Map<string, LoginEvent[]> = new Map();

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

// Middleware to verify JWT token
function verifyToken(req: any, res: Response, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Auth attempt without token');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Token verification failed: ${error instanceof Error ? error.message : String(error)}`);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
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

    // Track login history
    const sessionId = crypto.randomBytes(16).toString('hex');
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const { browser, os, deviceType } = parseUserAgent(userAgent);

    const loginEvent: LoginEvent = {
      sessionId,
      timestamp: Date.now(),
      ipAddress,
      userAgent,
      browser,
      os,
      deviceType,
      type: 'local',
    };

    if (!loginHistory.has(user.id)) {
      loginHistory.set(user.id, []);
    }
    loginHistory.get(user.id)!.push(loginEvent);

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

// GET /api/auth/profile
router.get('/profile', verifyToken, async (req: any, res: Response) => {
  try {
    const user = users.get(req.user.email.toLowerCase());
    if (!user) {
      logger.warn(`Profile access for non-existent user: ${req.user.email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.debug(`Profile accessed by user: ${req.user.email}`);

    res.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        avatar: user.avatar || null,
        emailVerified: user.emailVerified || false,
        createdAt: new Date().toISOString(), // In real app, store this on user creation
        googleId: user.googleId || null,
      },
    });
  } catch (error) {
    logger.error(`Profile retrieval error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Profile retrieval failed',
    });
  }
});

// POST /api/auth/profile/update-email
router.post('/profile/update-email', verifyToken, async (req: any, res: Response) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail || typeof newEmail !== 'string') {
      logger.warn('Update email attempt without email parameter');
      return res.status(400).json({
        success: false,
        error: 'New email is required',
      });
    }

    // Validate email format
    if (!validateEmail(newEmail)) {
      logger.warn(`Update email attempt with invalid format: ${newEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Check email not already in use (exclude current email)
    if (newEmail.toLowerCase() !== req.user.email.toLowerCase() && users.has(newEmail.toLowerCase())) {
      logger.warn(`Update email attempt with duplicate email: ${newEmail}`);
      return res.status(409).json({
        success: false,
        error: 'Email already in use',
      });
    }

    // Generate email change verification token (24-hour expiration)
    const emailChangeToken = generateVerificationToken();
    emailChangeTokens.set(emailChangeToken, {
      userId: req.user.userId,
      newEmail: newEmail.toLowerCase(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    logger.info(`Email change requested for user: ${req.user.email}, new email: ${newEmail}`);

    const verifyLink = `${process.env.GOOGLE_CALLBACK_URL?.replace('/auth/oauth/google/callback', '') || 'http://localhost:3000'}/verify-email-change?token=${emailChangeToken}`;

    res.json({
      success: true,
      message: 'Verification link sent to new email',
      verifyLink, // Development: returns link for testing (Phase 2: send via email)
    });
  } catch (error) {
    logger.error(`Email change error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Email change request failed',
    });
  }
});

// GET /api/auth/verify-email-change/:token
router.get('/verify-email-change/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string') {
      logger.warn('Email change verification attempt without token');
      return res.status(400).json({
        success: false,
        error: 'Missing verification token',
      });
    }

    // Check token exists
    const tokenData = emailChangeTokens.get(token);
    if (!tokenData) {
      logger.warn('Email change verification with invalid token');
      return res.status(404).json({
        success: false,
        error: 'Verification token not found',
      });
    }

    // Check token expiration
    if (tokenData.expiresAt < Date.now()) {
      emailChangeTokens.delete(token);
      logger.warn(`Email change token expired`);
      return res.status(400).json({
        success: false,
        error: 'Verification token expired',
      });
    }

    // Find user by userId and update email
    let user: any = null;
    for (const u of users.values()) {
      if (u.id === tokenData.userId) {
        user = u;
        break;
      }
    }

    if (!user) {
      logger.warn(`User not found for email change verification`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Remove old email key and add new one
    users.delete(user.email.toLowerCase());
    user.email = tokenData.newEmail;
    user.emailVerified = true;
    users.set(tokenData.newEmail, user);

    // Delete token (one-time use)
    emailChangeTokens.delete(token);

    logger.info(`Email changed successfully to: ${tokenData.newEmail}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error(`Email change verification error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Email verification failed',
    });
  }
});

// POST /api/auth/profile/update-password
router.post('/profile/update-password', verifyToken, async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      logger.warn('Update password attempt without current password');
      return res.status(400).json({
        success: false,
        error: 'Current password is required',
      });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      logger.warn('Update password attempt without new password');
      return res.status(400).json({
        success: false,
        error: 'New password is required',
      });
    }

    // Find user
    const user = users.get(req.user.email.toLowerCase());
    if (!user) {
      logger.warn(`Update password for non-existent user: ${req.user.email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordMatch) {
      logger.warn(`Update password with incorrect current password for: ${req.user.email}`);
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      logger.warn('Update password with invalid new password');
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Prevent reusing same password
    const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (samePassword) {
      logger.warn(`Update password with same password for: ${req.user.email}`);
      return res.status(400).json({
        success: false,
        error: 'New password cannot be same as current',
      });
    }

    // Hash new password with bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;

    logger.info(`Password updated successfully for: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    logger.error(`Update password error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Password update failed',
    });
  }
});

// POST /api/auth/profile/update-name
router.post('/profile/update-name', verifyToken, async (req: any, res: Response) => {
  try {
    const { name } = req.body;

    if (typeof name !== 'string') {
      logger.warn('Update name attempt without name parameter');
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    // Validate name (1-100 chars)
    if (name.trim().length === 0) {
      logger.warn('Update name attempt with empty name');
      return res.status(400).json({
        success: false,
        error: 'Name must not be empty',
      });
    }

    if (name.length > 100) {
      logger.warn('Update name attempt with name too long');
      return res.status(400).json({
        success: false,
        error: 'Name cannot exceed 100 characters',
      });
    }

    // Find user and update
    const user = users.get(req.user.email.toLowerCase());
    if (!user) {
      logger.warn(`Update name for non-existent user: ${req.user.email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.name = name;

    logger.info(`Name updated successfully for: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Name updated successfully',
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
        emailVerified: user.emailVerified || false,
      },
    });
  } catch (error) {
    logger.error(`Update name error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Name update failed',
    });
  }
});

// POST /api/auth/profile/update-avatar
router.post('/profile/update-avatar', verifyToken, async (req: any, res: Response) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl || typeof avatarUrl !== 'string') {
      logger.warn('Update avatar attempt without URL parameter');
      return res.status(400).json({
        success: false,
        error: 'Avatar URL is required',
      });
    }

    // Validate URL format
    if (!validateUrl(avatarUrl)) {
      logger.warn(`Update avatar attempt with invalid URL: ${avatarUrl}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
    }

    // Find user and update
    const user = users.get(req.user.email.toLowerCase());
    if (!user) {
      logger.warn(`Update avatar for non-existent user: ${req.user.email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    user.avatar = avatarUrl;

    logger.info(`Avatar updated successfully for: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      profile: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        avatar: user.avatar,
        emailVerified: user.emailVerified || false,
      },
    });
  } catch (error) {
    logger.error(`Update avatar error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Avatar update failed',
    });
  }
});

// Helper function to clean up all tokens for a user
function cleanupUserTokens(userId: string): number {
  let deletedCount = 0;

  // Delete refresh tokens
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === userId) {
      refreshTokens.delete(token);
      deletedCount++;
    }
  }

  // Delete reset tokens
  for (const [token, data] of resetPasswordTokens.entries()) {
    // Reset tokens use email, not userId, so skip
  }

  // Delete verification tokens
  for (const [token, data] of verificationTokens.entries()) {
    if (data.userId === userId) {
      verificationTokens.delete(token);
      deletedCount++;
    }
  }

  // Delete email change tokens
  for (const [token, data] of emailChangeTokens.entries()) {
    if (data.userId === userId) {
      emailChangeTokens.delete(token);
      deletedCount++;
    }
  }

  return deletedCount;
}

// DELETE /api/auth/account
router.delete('/account', verifyToken, async (req: any, res: Response) => {
  try {
    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      logger.warn(`Account deletion attempt without password for user: ${req.user.email}`);
      return res.status(400).json({
        success: false,
        error: 'Password is required',
      });
    }

    // Find user
    const user = users.get(req.user.email.toLowerCase());
    if (!user) {
      logger.warn(`Account deletion attempt for non-existent user: ${req.user.email}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      logger.warn(`Account deletion with incorrect password for user: ${req.user.email}`);
      return res.status(400).json({
        success: false,
        error: 'Incorrect password',
      });
    }

    // Check for OAuth session (warning only)
    if (user.googleId) {
      logger.warn(`Account deletion for OAuth user: ${req.user.email}`);
    }

    // Clean up all tokens
    const deletedTokenCount = cleanupUserTokens(user.id);

    // Delete reset and email verification tokens by email
    for (const [token, data] of resetPasswordTokens.entries()) {
      if (data.email === req.user.email.toLowerCase()) {
        resetPasswordTokens.delete(token);
      }
    }

    // Delete user
    users.delete(req.user.email.toLowerCase());

    // Clear refresh token cookie
    const cookieRes = res as any;
    cookieRes.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    logger.info(`Account deleted successfully for user: ${req.user.email}, tokens cleaned up: ${deletedTokenCount}`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    logger.error(`Account deletion error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Account deletion failed',
    });
  }
});

// GET /api/auth/sessions - List active sessions
router.get('/sessions', verifyToken, (req: any, res: Response) => {
  try {
    const userSessions = [];
    const userId = req.user.userId;

    // Get all refresh tokens for this user
    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId === userId && data.expiresAt > Date.now()) {
        // Find matching login event for this session
        const history = loginHistory.get(userId) || [];
        const loginEvent = history.find((e) => e.timestamp && data.expiresAt - 7 * 24 * 60 * 60 * 1000 <= e.timestamp);

        if (loginEvent) {
          userSessions.push({
            sessionId: loginEvent.sessionId,
            loginTime: loginEvent.timestamp,
            lastActivity: loginEvent.timestamp,
            browser: loginEvent.browser,
            os: loginEvent.os,
            deviceType: loginEvent.deviceType,
            isCurrent: false, // Will be marked by client based on refresh token
          });
        }
      }
    }

    logger.debug(`Session retrieval for user: ${req.user.email}, found: ${userSessions.length}`);

    res.json({
      success: true,
      sessions: userSessions,
    });
  } catch (error) {
    logger.error(`Session retrieval error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions',
    });
  }
});

// GET /api/auth/login-history - Get login history (last 30 days)
router.get('/login-history', verifyToken, (req: any, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const userId = req.user.userId;

    const history = (loginHistory.get(userId) || []).filter((event) => event.timestamp > cutoffTime);

    // Sort by timestamp descending (most recent first)
    history.sort((a, b) => b.timestamp - a.timestamp);

    logger.debug(`Login history retrieval for user: ${req.user.email}, found: ${history.length}`);

    res.json({
      success: true,
      history,
      total: history.length,
    });
  } catch (error) {
    logger.error(`Login history retrieval error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve login history',
    });
  }
});

// DELETE /api/auth/sessions/others - Revoke all other sessions (must be before :sessionId route)
router.delete('/sessions/others', verifyToken, (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    let revokedCount = 0;

    // Get current refresh token (if available)
    const currentRefreshToken = req.cookies?.refreshToken;

    // Delete all refresh tokens except current
    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId === userId && token !== currentRefreshToken) {
        refreshTokens.delete(token);
        revokedCount++;
      }
    }

    logger.info(`All other sessions revoked for user: ${req.user.email}, count: ${revokedCount}`);

    res.json({
      success: true,
      message: 'All other sessions revoked',
      count: revokedCount,
    });
  } catch (error) {
    logger.error(`All sessions revocation error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke sessions',
    });
  }
});

// DELETE /api/auth/sessions/:sessionId - Revoke specific session
router.delete('/sessions/:sessionId', verifyToken, (req: any, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    // Find and delete the refresh token with this session
    let found = false;
    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId === userId) {
        // Check if this is the matching session by finding it in history
        const history = loginHistory.get(userId) || [];
        const session = history.find((e) => e.sessionId === sessionId);

        if (session && session.timestamp === data.expiresAt - 7 * 24 * 60 * 60 * 1000) {
          refreshTokens.delete(token);
          found = true;
          logger.info(`Session revoked for user: ${req.user.email}, sessionId: ${sessionId}`);
          break;
        }
      }
    }

    if (!found) {
      logger.warn(`Session not found for revocation: ${sessionId}`);
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      message: 'Session revoked',
    });
  } catch (error) {
    logger.error(`Session revocation error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke session',
    });
  }
});

export default router;
