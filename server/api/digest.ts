import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { digestScheduler } from '../services/DigestScheduler';
import type { SmartDigestConfig } from '@shared/types';

const router = Router();

// ============================================================================
// GET /api/digest/preview
// ============================================================================
router.get('/preview', (req: Request, res: Response): void => {
  try {
    const userIdSchema = z.object({
      userId: z.string().min(1, 'userId is required'),
    });

    const { userId } = userIdSchema.parse(req.query);

    // Get user's config or use defaults
    const config = digestScheduler.getUserConfig(userId) || ({
      enabled: true,
      frequency: 'weekly',
      preferredTime: '08:00',
      topics: ['AI', 'Science'],
    } as SmartDigestConfig);

    // Mock digest generation (in Phase 4, this would use real articles)
    const mockArticles = [
      {
        id: '1',
        title: 'AI Breakthroughs in 2026',
        summary: 'Latest advancements in neural networks and LLMs this week.',
        link: 'https://example.com/ai-breakthrough',
        category: 'AI',
        relevanceScore: 95,
        reason: 'Matches your AI interests',
      },
      {
        id: '2',
        title: 'Quantum Computing Progress',
        summary: 'New quantum algorithms show promise for real-world applications.',
        link: 'https://example.com/quantum',
        category: 'Science',
        relevanceScore: 87,
        reason: 'Trending in Science community',
      },
      {
        id: '3',
        title: 'Robotics in Manufacturing',
        summary: 'How AI-powered robots are transforming production lines.',
        link: 'https://example.com/robotics',
        category: 'Robotics',
        relevanceScore: 78,
        reason: 'Related to your recent searches',
      },
    ];

    const unsubscribeToken = digestScheduler['generateToken'](userId, 'unsubscribe');
    const preferencesToken = digestScheduler['generateToken'](userId, 'preferences');

    const payload = {
      userId,
      digestDate: new Date(),
      articles: mockArticles,
      config,
      unsubscribeToken,
      preferencesToken,
    };

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('[/api/digest/preview]', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request',
    });
  }
});

// ============================================================================
// POST /api/digest/send
// ============================================================================
router.post('/send', (req: Request, res: Response): void => {
  try {
    const bodySchema = z.object({
      userId: z.string().min(1),
    });

    const { userId } = bodySchema.parse(req.body);

    const config = digestScheduler.getUserConfig(userId);
    if (!config || !config.enabled) {
      res.status(400).json({
        success: false,
        error: 'User not scheduled or digest disabled',
      });
      return;
    }

    // Trigger send
    digestScheduler.sendDigest(userId, config);

    // Generate tracking token for this send
    const trackingToken = digestScheduler['generateToken'](userId, 'tracking');

    res.json({
      success: true,
      message: `Digest sent (mocked) to ${userId}`,
      trackingToken,
    });
  } catch (error) {
    console.error('[/api/digest/send]', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request',
    });
  }
});

// ============================================================================
// GET /api/digest/unsubscribe/:token
// ============================================================================
router.get('/unsubscribe/:token', (req: Request, res: Response): void => {
  try {
    const { token } = req.params;

    const record = digestScheduler.validateToken(token, 'unsubscribe');
    if (!record) {
      // Token invalid, expired, or already used
      res.status(410).json({
        success: false,
        error: 'Token invalid, expired, or already used',
      });
      return;
    }

    // Process unsubscribe
    digestScheduler.unscheduleUser(record.userId);
    digestScheduler.consumeToken(token);

    console.log(`[/api/digest/unsubscribe] User ${record.userId} unsubscribed`);

    res.json({
      success: true,
      message: `You have been unsubscribed from Smart Digest. You will no longer receive emails.`,
    });
  } catch (error) {
    console.error('[/api/digest/unsubscribe]', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ============================================================================
// GET /api/digest/open/:token
// ============================================================================
router.get('/open/:token', (req: Request, res: Response): void => {
  try {
    const { token } = req.params;

    const record = digestScheduler.validateToken(token, 'tracking');
    if (!record) {
      // Invalid token — still return 200 with pixel to avoid client-side tracking errors
      const pixel = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00,
        0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
      ]);
      res.set('Content-Type', 'image/gif');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(pixel);
      return;
    }

    // Log the open event (AC8: track open rate)
    console.log(`[/api/digest/open] Email opened by user ${record.userId}`);
    digestScheduler.consumeToken(token);

    // Return 1x1 transparent pixel (standard email tracking)
    const pixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
    ]);

    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
  } catch (error) {
    console.error('[/api/digest/open]', error);
    // Return pixel anyway to avoid client-side errors
    const pixel = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00,
      0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
      0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
    ]);
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  }
});

export default router;
