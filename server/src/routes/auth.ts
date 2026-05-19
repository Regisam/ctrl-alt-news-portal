import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../logger';

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

export default router;
