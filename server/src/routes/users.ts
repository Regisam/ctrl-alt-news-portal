import { Router } from 'express';
import type { Response } from 'express';
import { AuthRequest, verifyJWT } from '../middleware/auth';
import { prisma } from '../prisma';
import logger from '../logger';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const router = Router();

interface UserProfile {
  id: string;
  username: string | null;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  article: {
    id: string;
    titleEn: string;
  };
}

// GET /api/user/me - Get authenticated user's profile
router.get('/me', verifyJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const profile: UserProfile & { email: string } = {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error fetching user profile', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// GET /api/users/:id - Get public user profile
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            articles: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const profile: UserProfile & { commentCount: number; articleCount: number } = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      commentCount: user._count.comments,
      articleCount: user._count.articles,
    };

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error fetching public profile', {
      userId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile',
    });
  }
});

// GET /api/users/:id/comments - Get user's comments (paginated)
router.get('/:id/comments', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { authorId: id },
        select: {
          id: true,
          content: true,
          createdAt: true,
          article: {
            select: {
              id: true,
              titleEn: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: { authorId: id },
      }),
    ]);

    const formattedComments: CommentData[] = comments.map((comment: any) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      article: {
        id: comment.article.id,
        titleEn: comment.article.titleEn,
      },
    }));

    res.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching user comments', {
      userId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user comments',
    });
  }
});

// Validation schemas
const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  username: z.string().min(3).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// PUT /api/user/me - Update authenticated user's profile
router.put('/me', verifyJWT, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile data',
        errors: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;

    // Check username uniqueness if provided
    if (data.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(409).json({
          success: false,
          error: 'Username already taken',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        fullName: data.fullName,
        username: data.username,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        email: true,
      },
    });

    logger.info('User profile updated', { userId: req.userId });
    res.json({
      success: true,
      data: {
        ...updatedUser,
        createdAt: updatedUser.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error updating user profile', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// POST /api/user/me/password - Change password
router.post('/me/password', verifyJWT, async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password data',
        errors: parseResult.error.flatten(),
      });
    }

    const { oldPassword, newPassword } = parseResult.data;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({
        success: false,
        error: 'User does not have a password set (OAuth only account)',
      });
    }

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash: newPasswordHash },
    });

    logger.info('User password changed', { userId: req.userId });
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Error changing password', {
      userId: req.userId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
    });
  }
});

export function setupUsersRoute(mainRouter: Router) {
  mainRouter.use('/user', router);
  mainRouter.use('/users', router);
}
