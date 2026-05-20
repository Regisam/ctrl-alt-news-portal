import express, { Request, Response } from 'express';
import { logger } from '../../logger.js';

const router = express.Router();

interface UserReputation {
  userId: string;
  karma: number;
  badges: ('Trusted' | 'Contributor' | 'Expert' | 'Author')[];
  articleCount: number;
  commentCount: number;
}

interface User {
  id: string;
  username: string;
  karma: number;
  articleCount: number;
  commentCount: number;
}

// Mock database
const users: Map<string, User> = new Map();

// Initialize mock users
function initializeMockUsers() {
  users.set('user_1', {
    id: 'user_1',
    username: 'alice',
    karma: 150,
    articleCount: 8,
    commentCount: 42,
  });

  users.set('user_2', {
    id: 'user_2',
    username: 'bob',
    karma: 45,
    articleCount: 2,
    commentCount: 15,
  });

  users.set('user_3', {
    id: 'user_3',
    username: 'charlie',
    karma: 12,
    articleCount: 0,
    commentCount: 8,
  });

  users.set('user_4', {
    id: 'user_4',
    username: 'diana',
    karma: 300,
    articleCount: 15,
    commentCount: 120,
  });
}

initializeMockUsers();

// Middleware: Require authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn('Reputation: No authorization header');
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    logger.warn('Reputation: Invalid authorization header');
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  // Mock: extract userId from token
  (req as any).userId = `user_${Math.floor(Math.random() * 4) + 1}`;
  next();
};

// Helper: Calculate badges based on karma and article count
function calculateBadges(karma: number, articleCount: number): UserReputation['badges'] {
  const badges: UserReputation['badges'] = [];

  if (karma >= 10) badges.push('Trusted');
  if (karma >= 50) badges.push('Contributor');
  if (karma >= 100) badges.push('Expert');
  if (articleCount >= 5) badges.push('Author');

  return badges;
}

// Helper: Build reputation response
function buildReputation(user: User): UserReputation {
  return {
    userId: user.id,
    karma: user.karma,
    badges: calculateBadges(user.karma, user.articleCount),
    articleCount: user.articleCount,
    commentCount: user.commentCount,
  };
}

// GET /api/users/:id/reputation - Get user reputation (authenticated users)
router.get('/users/:id/reputation', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Validate user exists
    const user = users.get(userId);
    if (!user) {
      logger.warn(`Reputation: User not found - ${userId}`);
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const reputation = buildReputation(user);

    logger.info(`Reputation: User reputation retrieved - ${userId}`);

    res.json({
      success: true,
      reputation,
    });
  } catch (error) {
    logger.error('Reputation: Error retrieving user reputation', { error: String(error) });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/reputation/leaderboard - Get global leaderboard (public, paginated)
router.get('/reputation/leaderboard', (req: Request, res: Response) => {
  try {
    const { limit = '20', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Get all users, calculate reputation, sort by karma descending
    const allUsers = Array.from(users.values());
    const reputations = allUsers
      .map((user) => ({
        ...buildReputation(user),
        username: user.username,
      }))
      .sort((a, b) => b.karma - a.karma);

    // Pagination
    const total = reputations.length;
    const leaderboard = reputations.slice(offsetNum, offsetNum + limitNum);

    logger.info(`Reputation: Leaderboard retrieved - ${leaderboard.length}/${total} items`);

    res.json({
      success: true,
      leaderboard: leaderboard.map((rep) => ({
        userId: rep.userId,
        username: rep.username,
        karma: rep.karma,
        badges: rep.badges,
        articleCount: rep.articleCount,
        commentCount: rep.commentCount,
      })),
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total,
        hasMore: offsetNum + limitNum < total,
      },
    });
  } catch (error) {
    logger.error('Reputation: Error retrieving leaderboard', { error: String(error) });
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
