import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../logger.js';

// AC5: Validation middleware factory
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        logger.warn('Validation error', { errors });
        res.badRequest('Validation failed', { errors });
      } else {
        res.badRequest('Invalid request');
      }
    }
  };
}

// Common schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export const createArticleSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(50),
  category: z.string(),
  excerpt: z.string().optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  articleId: z.string(),
  parentId: z.string().optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().optional(),
  bio: z.string().optional(),
  privacy: z.enum(['public', 'private']).optional(),
});
