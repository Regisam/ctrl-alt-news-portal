import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { logger } from '../../logger.js';

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
const users: Map<string, { email: string; passwordHash: string; id: string }> = new Map();

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
    });

    // Log successful registration
    logger.info(`User registered successfully: ${email}`);

    // Return user data (no password)
    const user: User = {
      id: userId,
      email: email!,
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      user,
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

export default router;
