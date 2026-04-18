import type { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import logger from '../logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

function generateJWT(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-me-in-production';
  return jwt.sign(
    {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    },
    secret
  );
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

        logger.info('User registered successfully', {
          userId: user.id,
          email: user.email,
        });

        res.status(201).json({
          success: true,
          data: user,
          message: 'Registration successful. Please login to continue.',
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

        // Generate JWT token
        const token = generateJWT(user.id, user.email);

        // Update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        logger.info('User logged in successfully', {
          userId: user.id,
          email: user.email,
        });

        res.status(200).json({
          success: true,
          data: {
            token,
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
}
