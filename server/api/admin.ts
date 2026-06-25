import { Router } from 'express';
import { moderationService } from '../lib/moderationService.js';
import { authMiddleware } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();

// AC8: Admin permission check middleware
function adminOnly(req: any, res: any, next: any) {
  // TODO: Check if user has admin role
  const isAdmin = true; // Mock check

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized',
      statusCode: 403,
    });
  }

  next();
}

// AC1: Get dashboard stats
router.get('/stats', authMiddleware, adminOnly, (_req, res) => {
  try {
    const stats = moderationService.getDashboardStats();
    res.success({ stats });
  } catch (error) {
    logger.error('Failed to get dashboard stats', { error });
    res.error(500, 'Failed to get stats');
  }
});

// AC2: Approve article
router.post('/articles/:articleId/approve', authMiddleware, adminOnly, (req, res) => {
  try {
    const { articleId } = req.params;
    const adminId = req.user!.userId;
    const adminName = 'Admin'; // TODO: Get from user

    const action = moderationService.approveArticle(articleId, adminId, adminName);
    res.success({ action }, 'Article approved');
  } catch (error) {
    logger.error('Failed to approve article', { error });
    res.error(500, 'Failed to approve');
  }
});

// AC2: Reject article
router.post('/articles/:articleId/reject', authMiddleware, adminOnly, (req, res) => {
  try {
    const { articleId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.badRequest('Reason is required');
    }

    const adminId = req.user!.userId;
    const adminName = 'Admin';

    const action = moderationService.rejectArticle(articleId, reason, adminId, adminName);
    res.success({ action }, 'Article rejected');
  } catch (error) {
    logger.error('Failed to reject article', { error });
    res.error(500, 'Failed to reject');
  }
});

// AC3: Ban user
router.post('/users/:userId/ban', authMiddleware, adminOnly, (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;

    if (!reason) {
      return res.badRequest('Reason is required');
    }

    const adminId = req.user!.userId;
    const adminName = 'Admin';

    const action = moderationService.banUser(userId, reason, adminId, adminName, duration);
    res.success({ action }, 'User banned');
  } catch (error) {
    logger.error('Failed to ban user', { error });
    res.error(500, 'Failed to ban user');
  }
});

// AC3: Suspend user
router.post('/users/:userId/suspend', authMiddleware, adminOnly, (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body;

    if (!reason || !duration) {
      return res.badRequest('Reason and duration are required');
    }

    const adminId = req.user!.userId;
    const adminName = 'Admin';

    const action = moderationService.suspendUser(userId, reason, adminId, adminName, duration);
    res.success({ action }, 'User suspended');
  } catch (error) {
    logger.error('Failed to suspend user', { error });
    res.error(500, 'Failed to suspend user');
  }
});

// AC3: Restore user
router.post('/users/:userId/restore', authMiddleware, adminOnly, (req, res) => {
  try {
    const { userId } = req.params;

    moderationService.restoreUser(userId);
    res.success({ message: 'User restored' });
  } catch (error) {
    logger.error('Failed to restore user', { error });
    res.error(500, 'Failed to restore user');
  }
});

// AC4: Get pending reports
router.get('/reports/pending', authMiddleware, adminOnly, (_req, res) => {
  try {
    const reports = moderationService.getPendingReports();
    res.success({ reports, count: reports.length });
  } catch (error) {
    logger.error('Failed to get reports', { error });
    res.error(500, 'Failed to get reports');
  }
});

// AC4: Resolve report
router.post('/reports/:reportId/resolve', authMiddleware, adminOnly, (req, res) => {
  try {
    const { reportId } = req.params;
    const { action } = req.body; // 'approved' or 'dismissed'

    if (!['approved', 'dismissed'].includes(action)) {
      return res.badRequest('Invalid action');
    }

    const adminId = req.user!.userId;
    moderationService.resolveReport(reportId, adminId, action);

    res.success({ message: 'Report resolved' });
  } catch (error) {
    logger.error('Failed to resolve report', { error });
    res.error(500, 'Failed to resolve report');
  }
});

// AC5: Bulk approve articles
router.post('/articles/bulk/approve', authMiddleware, adminOnly, (req, res) => {
  try {
    const { articleIds } = req.body;

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return res.badRequest('articleIds must be a non-empty array');
    }

    const adminId = req.user!.userId;
    const adminName = 'Admin';

    const actions = moderationService.bulkApproveArticles(articleIds, adminId, adminName);
    res.success({ actions, count: actions.length }, 'Articles approved');
  } catch (error) {
    logger.error('Failed to bulk approve', { error });
    res.error(500, 'Failed to bulk approve');
  }
});

// AC6: Get audit log
router.get('/audit-log', authMiddleware, adminOnly, (req, res) => {
  try {
    const { adminId, targetType, limit } = req.query;

    const log = moderationService.getAuditLog({
      adminId: adminId as string,
      targetType: targetType as string,
      limit: limit ? parseInt(limit as string) : 100,
    });

    res.success({ log, count: log.length });
  } catch (error) {
    logger.error('Failed to get audit log', { error });
    res.error(500, 'Failed to get audit log');
  }
});

// AC7: Search reports
router.get('/reports/search', authMiddleware, adminOnly, (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.badRequest('Search query is required');
    }

    const results = moderationService.searchReports(q as string);
    res.success({ results, count: results.length });
  } catch (error) {
    logger.error('Failed to search reports', { error });
    res.error(500, 'Failed to search reports');
  }
});

export default router;
