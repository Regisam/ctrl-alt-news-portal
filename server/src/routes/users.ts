import express, { Request, Response } from 'express';
import { logger } from '../../logger.js';

const router = express.Router();

interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  bio?: string;
  avatar?: string;
  karma: number;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
}

// Mock database: users stored from auth.ts
const users: Map<string, UserProfile> = new Map();

// Initialize with some mock data for testing
function initializeMockUsers() {
  users.set('user_1', {
    id: 'user_1',
    email: 'alice@example.com',
    emailVerified: true,
    name: 'Alice',
    bio: 'Tech enthusiast',
    avatar: 'https://example.com/avatar1.jpg',
    karma: 150,
    role: 'user',
    createdAt: '2026-04-01T10:00:00Z',
  });

  users.set('user_2', {
    id: 'user_2',
    email: 'bob@example.com',
    emailVerified: false,
    name: 'Bob',
    bio: 'AI researcher',
    avatar: 'https://example.com/avatar2.jpg',
    karma: 300,
    role: 'moderator',
    createdAt: '2026-03-15T14:30:00Z',
  });
}

initializeMockUsers();

// GET /api/user/me - Authenticated user profile
router.get('/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('GET /api/user/me: No authorization header');
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn('GET /api/user/me: Invalid authorization header format');
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }

    // Mock: extract userId from token (in production, verify JWT)
    const userId = `user_${Math.floor(Math.random() * 2) + 1}`;
    const user = users.get(userId);

    if (!user) {
      logger.warn(`GET /api/user/me: User not found - ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    logger.info(`GET /api/user/me: Profile accessed for user ${user.email}`);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    logger.error(`GET /api/user/me: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/users/:id - Public user profile (filtered)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = users.get(id);
    if (!user) {
      logger.warn(`GET /api/users/:id: User not found - ${id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Filter sensitive fields for public profile
    const publicProfile: Partial<UserProfile> = {
      id: user.id,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      karma: user.karma,
      role: user.role,
      createdAt: user.createdAt,
    };

    // Only include email if verified
    if (user.emailVerified) {
      publicProfile.email = user.email;
    }

    logger.info(`GET /api/users/:id: Public profile accessed for user ${id}`);

    res.status(200).json({
      success: true,
      user: publicProfile,
    });
  } catch (error) {
    logger.error(`GET /api/users/:id: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// GET /api/users/:id/comments - Paginated user comments
router.get('/:id/comments', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '10', offset = '0' } = req.query;

    // Validate user exists
    const user = users.get(id);
    if (!user) {
      logger.warn(`GET /api/users/:id/comments: User not found - ${id}`);
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Parse and validate pagination parameters
    const pageLimit = Math.min(Math.max(1, parseInt(limit as string, 10) || 10), 50);
    const pageOffset = Math.max(0, parseInt(offset as string, 10) || 0);

    // Mock comments data
    const mockComments = [
      {
        id: 'comment_1',
        articleId: 'article_1',
        articleTitle: 'AI Revolution',
        articleExcerpt: 'Latest AI breakthroughs',
        content: 'Great article, very informative!',
        createdAt: '2026-05-18T10:00:00Z',
        likes: 5,
      },
      {
        id: 'comment_2',
        articleId: 'article_2',
        articleTitle: 'Quantum Computing',
        articleExcerpt: 'Deep dive into quantum',
        content: 'Fascinating research findings',
        createdAt: '2026-05-17T14:30:00Z',
        likes: 12,
      },
      {
        id: 'comment_3',
        articleId: 'article_3',
        articleTitle: 'Robotics Trends',
        articleExcerpt: 'Future of automation',
        content: 'Exciting developments in this field',
        createdAt: '2026-05-16T09:15:00Z',
        likes: 8,
      },
    ];

    // Apply pagination
    const paginatedComments = mockComments.slice(pageOffset, pageOffset + pageLimit);
    const totalCount = mockComments.length;

    logger.info(
      `GET /api/users/:id/comments: Retrieved ${paginatedComments.length} comments for user ${id}`
    );

    res.status(200).json({
      success: true,
      comments: paginatedComments,
      pagination: {
        limit: pageLimit,
        offset: pageOffset,
        total: totalCount,
        hasMore: pageOffset + pageLimit < totalCount,
      },
    });
  } catch (error) {
    logger.error(
      `GET /api/users/:id/comments: ${error instanceof Error ? error.message : String(error)}`
    );
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
