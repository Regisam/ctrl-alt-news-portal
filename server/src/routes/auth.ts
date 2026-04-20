import type { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { getGoogleAuthUrl, exchangeCodeForToken } from '../services/google-oauth';

interface RegisterBody {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// In-memory token stores (Phase 2: move to database)
const refreshTokenStore = new Map<string, { userId: string; expiresAt: number }>();
const verificationTokenStore = new Map<string, { userId: string; email: string; expiresAt: number }>();

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRegistration(data: RegisterBody): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

function validateLogin(data: LoginBody): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return errors;
}

function generateAccessToken(userId: string, email: string, role: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-me-in-production';
  return jwt.sign(
    {
      userId,
      email,
      role,
      type: 'access',
    },
    secret,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(userId: string): { token: string; id: string } {
  const id = randomBytes(32).toString('hex');
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-me-in-production';
  const token = jwt.sign(
    {
      userId,
      tokenId: id,
      type: 'refresh',
    },
    secret,
    { expiresIn: '7d' }
  );

  // Store refresh token
  const expiresAt = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
  refreshTokenStore.set(id, { userId, expiresAt });

  return { token, id };
}

function generateVerificationToken(userId: string, email: string): string {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours
  verificationTokenStore.set(token, { userId, email, expiresAt });
  return token;
}

export function setupAuthRoute(router: Router): void {
  // POST /api/auth/register
  router.post(
    '/api/auth/register',
    async (req: Request<object, object, RegisterBody>, res: Response, next: NextFunction): Promise<void> => {
      try {
        logger.info('POST /api/auth/register received', {
          email: req.body.email,
          ip: req.ip,
        });

        const errors = validateRegistration(req.body);
        if (Object.keys(errors).length > 0) {
          logger.warn('Registration validation failed', { errors, email: req.body.email });
          res.status(400).json({
            success: false,
            errors,
          });
          return;
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: req.body.email },
        });

        if (existingUser) {
          logger.warn('Registration failed - email already exists', { email: req.body.email });
          res.status(409).json({
            success: false,
            error: 'Email already registered',
          });
          return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(req.body.password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: req.body.email,
            passwordHash,
            fullName: '', // Optional: get from request
          },
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        });

        // Generate verification token
        const verificationToken = generateVerificationToken(user.id, user.email);

        logger.info('User registered successfully', {
          userId: user.id,
          email: user.email,
        });

        res.status(201).json({
          success: true,
          data: {
            ...user,
            verificationToken, // For development/testing
            verificationLink: `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email/${verificationToken}`,
          },
          message: 'Registration successful. Please verify your email to continue.',
        });
      } catch (error) {
        logger.error('Error during registration', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        next(error);
      }
    }
  );

  // POST /api/auth/login
  router.post(
    '/api/auth/login',
    async (req: Request<object, object, LoginBody>, res: Response, next: NextFunction): Promise<void> => {
      try {
        logger.info('POST /api/auth/login received', {
          email: req.body.email,
          ip: req.ip,
        });

        const errors = validateLogin(req.body);
        if (Object.keys(errors).length > 0) {
          logger.warn('Login validation failed', { errors, email: req.body.email });
          res.status(400).json({
            success: false,
            errors,
          });
          return;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: req.body.email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            fullName: true,
            role: true,
          },
        });

        if (!user || !user.passwordHash) {
          logger.warn('Login failed - invalid credentials', { email: req.body.email });
          res.status(401).json({
            success: false,
            error: 'Invalid email or password',
          });
          return;
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(req.body.password, user.passwordHash);
        if (!passwordMatch) {
          logger.warn('Login failed - password mismatch', { email: req.body.email });
          res.status(401).json({
            success: false,
            error: 'Invalid email or password',
          });
          return;
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.email, user.role);
        const { token: refreshToken } = generateRefreshToken(user.id);

        // Update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Audit logging (especially for admin logins)
        logger.info('User logged in successfully', {
          userId: user.id,
          email: user.email,
          role: user.role,
          ip: req.ip,
          isAdmin: user.role === 'ADMIN',
        });

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
          success: true,
          data: {
            accessToken,
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
            },
          },
        });
      } catch (error) {
        logger.error('Error during login', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        next(error);
      }
    }
  );

  // GET /api/auth/me (protected - requires valid JWT)
  router.get(
    '/api/auth/me',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.status(401).json({
            success: false,
            error: 'Unauthorized - missing or invalid token',
          });
          return;
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'your-secret-key-change-me-in-production';

        let decoded: any;
        try {
          decoded = jwt.verify(token, secret);
        } catch {
          res.status(401).json({
            success: false,
            error: 'Unauthorized - invalid token',
          });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        });

        if (!user) {
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: user,
        });
      } catch (error) {
        logger.error('Error fetching current user', {
          error: error instanceof Error ? error.message : String(error),
        });
        next(error);
      }
    }
  );

  // POST /api/auth/refresh
  router.post(
    '/api/auth/refresh',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
          logger.warn('Refresh token missing');
          res.status(401).json({
            success: false,
            error: 'Refresh token missing',
          });
          return;
        }

        const secret = process.env.JWT_SECRET || 'your-secret-key-change-me-in-production';

        let decoded: any;
        try {
          decoded = jwt.verify(refreshToken, secret);
        } catch {
          logger.warn('Invalid refresh token');
          res.status(401).json({
            success: false,
            error: 'Invalid or expired refresh token',
          });
          return;
        }

        // Check if token is in store and not expired
        const tokenData = refreshTokenStore.get(decoded.tokenId);
        if (!tokenData || tokenData.expiresAt < Math.floor(Date.now() / 1000)) {
          logger.warn('Refresh token revoked or expired', { tokenId: decoded.tokenId });
          res.status(401).json({
            success: false,
            error: 'Refresh token revoked or expired',
          });
          return;
        }

        // Get user
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        });

        if (!user) {
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user.id, user.email, user.role);

        logger.info('Access token refreshed', { userId: user.id });

        res.json({
          success: true,
          data: {
            accessToken: newAccessToken,
          },
        });
      } catch (error) {
        logger.error('Error refreshing token', {
          error: error instanceof Error ? error.message : String(error),
        });
        next(error);
      }
    }
  );

  // POST /api/auth/logout
  router.post(
    '/api/auth/logout',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (refreshToken) {
          const secret = process.env.JWT_SECRET || 'your-secret-key-change-me-in-production';
          try {
            const decoded: any = jwt.verify(refreshToken, secret);
            // Remove from store (revoke)
            refreshTokenStore.delete(decoded.tokenId);
            logger.info('Refresh token revoked', { tokenId: decoded.tokenId });
          } catch {
            // Token already invalid, just proceed
          }
        }

        // Clear cookie
        res.clearCookie('refreshToken');

        logger.info('User logged out successfully');

        res.json({
          success: true,
          message: 'Logged out successfully',
        });
      } catch (error) {
        logger.error('Error during logout', {
          error: error instanceof Error ? error.message : String(error),
        });
        next(error);
      }
    }
  );

  // GET /api/auth/oauth/google - Initiate Google OAuth flow
  router.get(
    '/api/auth/oauth/google',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authUrl = await getGoogleAuthUrl();
        logger.info('Google OAuth flow initiated');
        res.redirect(authUrl);
      } catch (error) {
        logger.error('Error initiating Google OAuth', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to initiate Google OAuth',
        });
      }
    }
  );

  // GET /api/auth/oauth/google/callback - Handle Google OAuth callback
  router.get(
    '/api/auth/oauth/google/callback',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const code = typeof req.query.code === 'string' ? req.query.code : undefined;
        const error = typeof req.query.error === 'string' ? req.query.error : undefined;
        const error_description = typeof req.query.error_description === 'string' ? req.query.error_description : undefined;

        if (error) {
          logger.warn('Google OAuth error', {
            error,
            description: error_description,
          });
          return res.redirect(`/login?error=${encodeURIComponent(error_description || 'OAuth failed')}`);
        }

        if (!code || typeof code !== 'string') {
          logger.warn('No authorization code received');
          return res.redirect('/login?error=Missing+authorization+code');
        }

        // Exchange code for token
        const googlePayload = await exchangeCodeForToken(code);

        interface AuthUser {
          id: string;
          email: string;
          fullName: string | null;
        }

        // Find or create user
        let user: any = await prisma.user.findUnique({
          where: { googleId: googlePayload.sub },
          select: { id: true, email: true, fullName: true, role: true },
        });

        if (user) {
          // Existing Google user
          logger.info('Google OAuth - existing user', { userId: user.id });
        } else {
          // Check if email already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: googlePayload.email },
          });

          if (existingUser) {
            // Link Google ID to existing user
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: googlePayload.sub,
                oauthProvider: 'google',
              },
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
              },
            });
            logger.info('Google OAuth - linked to existing user', { userId: user.id });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: googlePayload.email,
                googleId: googlePayload.sub,
                oauthProvider: 'google',
                fullName: googlePayload.name || '',
                avatarUrl: googlePayload.picture || undefined,
                emailVerified: googlePayload.email_verified,
              },
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
              },
            });
            logger.info('Google OAuth - new user created', { userId: user.id });
          }
        }

        if (!user) {
          throw new Error('Failed to create or find user');
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.email, user.role);
        const { token: refreshToken } = generateRefreshToken(user.id);

        // Update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Set refresh token in httpOnly cookie and redirect to home with access token
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Redirect to home with access token as URL fragment (for SPA)
        res.redirect(`/?accessToken=${encodeURIComponent(accessToken)}`);
      } catch (error) {
        logger.error('Error handling Google OAuth callback', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.redirect('/login?error=Authentication+failed');
      }
    }
  );

  // GET /api/auth/verify-email/:token - Verify email with token
  router.get(
    '/api/auth/verify-email/:token',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { token } = req.params;

        const tokenData = verificationTokenStore.get(token);
        if (!tokenData || tokenData.expiresAt < Math.floor(Date.now() / 1000)) {
          logger.warn('Invalid or expired verification token', { token });
          res.redirect('/login?error=Verification+link+expired');
          return;
        }

        // Mark user as verified
        await prisma.user.update({
          where: { id: tokenData.userId },
          data: { emailVerified: true },
        });

        // Remove token from store
        verificationTokenStore.delete(token);

        logger.info('Email verified successfully', { userId: tokenData.userId });
        res.redirect('/login?verified=true');
      } catch (error) {
        logger.error('Error verifying email', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.redirect('/login?error=Verification+failed');
      }
    }
  );

  // POST /api/auth/resend-verification - Resend verification email
  router.post(
    '/api/auth/resend-verification',
    async (req: Request<{ email?: string }>, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { email } = req.body;

        if (!email) {
          res.status(400).json({
            success: false,
            error: 'Email is required',
          });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, emailVerified: true },
        });

        if (!user) {
          res.status(404).json({
            success: false,
            error: 'User not found',
          });
          return;
        }

        if (user.emailVerified) {
          res.status(400).json({
            success: false,
            error: 'Email already verified',
          });
          return;
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken(user.id, email);

        logger.info('Verification email resent', { userId: user.id, email });

        res.json({
          success: true,
          message: 'Verification email sent',
          verificationLink: `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email/${verificationToken}`,
        });
      } catch (error) {
        logger.error('Error resending verification email', {
          error: error instanceof Error ? error.message : String(error),
        });
        res.status(500).json({
          success: false,
          error: 'Failed to resend verification email',
        });
      }
    }
  );
}
