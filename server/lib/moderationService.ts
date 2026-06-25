import { logger } from '../logger.js';

// AC2-6: Moderation types
export interface ModerationAction {
  id: string;
  type: 'approve' | 'reject' | 'remove' | 'ban' | 'warn';
  targetType: 'article' | 'comment' | 'user';
  targetId: string;
  adminId: string;
  adminName: string;
  reason: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ContentReport {
  id: string;
  type: 'article' | 'comment' | 'user';
  targetId: string;
  reporterId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  timestamp: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface UserStatus {
  userId: string;
  status: 'active' | 'suspended' | 'banned';
  reason?: string;
  since: Date;
  until?: Date;
}

class ModerationService {
  private auditLog: ModerationAction[] = [];
  private reports: ContentReport[] = [];
  private userStatuses: Map<string, UserStatus> = new Map();
  private suspensionCache: Map<string, boolean> = new Map();

  // AC2: Approve article
  approveArticle(articleId: string, adminId: string, adminName: string): ModerationAction {
    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'approve',
      targetType: 'article',
      targetId: articleId,
      adminId,
      adminName,
      reason: 'Approved by admin',
      timestamp: new Date(),
      metadata: { published: true },
    };

    this.recordAction(action);
    logger.info('Article approved', { articleId, adminId });

    return action;
  }

  // AC2: Reject article
  rejectArticle(articleId: string, reason: string, adminId: string, adminName: string): ModerationAction {
    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'reject',
      targetType: 'article',
      targetId: articleId,
      adminId,
      adminName,
      reason,
      timestamp: new Date(),
      metadata: { published: false },
    };

    this.recordAction(action);
    logger.warn('Article rejected', { articleId, adminId, reason });

    return action;
  }

  // AC3: Ban user
  banUser(userId: string, reason: string, adminId: string, adminName: string, duration?: number): ModerationAction {
    const until = duration ? new Date(Date.now() + duration) : undefined;

    const userStatus: UserStatus = {
      userId,
      status: 'banned',
      reason,
      since: new Date(),
      until,
    };

    this.userStatuses.set(userId, userStatus);
    this.suspensionCache.set(userId, true);

    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'ban',
      targetType: 'user',
      targetId: userId,
      adminId,
      adminName,
      reason,
      timestamp: new Date(),
      metadata: { until, duration },
    };

    this.recordAction(action);
    logger.warn('User banned', { userId, adminId, reason, duration });

    // Auto-unban if duration set
    if (duration) {
      setTimeout(() => {
        this.restoreUser(userId);
      }, duration);
    }

    return action;
  }

  // AC3: Suspend user
  suspendUser(userId: string, reason: string, adminId: string, adminName: string, duration: number): ModerationAction {
    const until = new Date(Date.now() + duration);

    const userStatus: UserStatus = {
      userId,
      status: 'suspended',
      reason,
      since: new Date(),
      until,
    };

    this.userStatuses.set(userId, userStatus);
    this.suspensionCache.set(userId, true);

    const action: ModerationAction = {
      id: `action-${Date.now()}`,
      type: 'warn',
      targetType: 'user',
      targetId: userId,
      adminId,
      adminName,
      reason,
      timestamp: new Date(),
      metadata: { until, duration },
    };

    this.recordAction(action);
    logger.warn('User suspended', { userId, adminId, reason, duration });

    // Auto-restore after duration
    setTimeout(() => {
      this.restoreUser(userId);
    }, duration);

    return action;
  }

  // AC3: Restore user
  restoreUser(userId: string): void {
    this.userStatuses.set(userId, {
      userId,
      status: 'active',
      since: new Date(),
    });

    this.suspensionCache.delete(userId);
    logger.info('User restored', { userId });
  }

  // AC3: Check if user is banned/suspended
  isUserRestricted(userId: string): boolean {
    return this.suspensionCache.has(userId);
  }

  // AC3: Get user status
  getUserStatus(userId: string): UserStatus | null {
    return this.userStatuses.get(userId) || null;
  }

  // AC4: Create report
  createReport(
    type: 'article' | 'comment' | 'user',
    targetId: string,
    reporterId: string,
    reason: string
  ): ContentReport {
    const report: ContentReport = {
      id: `report-${Date.now()}`,
      type,
      targetId,
      reporterId,
      reason,
      status: 'pending',
      timestamp: new Date(),
    };

    this.reports.push(report);
    logger.info('Report created', { type, targetId, reason });

    return report;
  }

  // AC4: Get pending reports
  getPendingReports(): ContentReport[] {
    return this.reports.filter((r) => r.status === 'pending');
  }

  // AC4: Resolve report
  resolveReport(reportId: string, adminId: string, action: 'approved' | 'dismissed'): void {
    const report = this.reports.find((r) => r.id === reportId);

    if (!report) return;

    report.status = action === 'approved' ? 'resolved' : 'dismissed';
    report.resolvedAt = new Date();
    report.resolvedBy = adminId;

    logger.info('Report resolved', { reportId, action, adminId });
  }

  // AC5: Bulk action
  bulkApproveArticles(articleIds: string[], adminId: string, adminName: string): ModerationAction[] {
    return articleIds.map((id) => this.approveArticle(id, adminId, adminName));
  }

  // AC5: Bulk reject
  bulkRejectArticles(
    articleIds: string[],
    reason: string,
    adminId: string,
    adminName: string
  ): ModerationAction[] {
    return articleIds.map((id) => this.rejectArticle(id, reason, adminId, adminName));
  }

  // AC5: Bulk ban
  bulkBanUsers(userIds: string[], reason: string, adminId: string, adminName: string): ModerationAction[] {
    return userIds.map((id) => this.banUser(id, reason, adminId, adminName));
  }

  // AC6: Record action
  private recordAction(action: ModerationAction): void {
    this.auditLog.push(action);

    // Keep last 10000 actions
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-10000);
    }
  }

  // AC6: Get audit log
  getAuditLog(filter?: { adminId?: string; targetType?: string; limit?: number }): ModerationAction[] {
    let log = [...this.auditLog];

    if (filter?.adminId) {
      log = log.filter((a) => a.adminId === filter.adminId);
    }

    if (filter?.targetType) {
      log = log.filter((a) => a.targetType === filter.targetType);
    }

    const limit = filter?.limit || 100;
    return log.slice(-limit).reverse();
  }

  // AC7: Search reports
  searchReports(query: string): ContentReport[] {
    return this.reports.filter((r) => r.reason.toLowerCase().includes(query.toLowerCase()));
  }

  // AC1: Get dashboard stats
  getDashboardStats() {
    const pendingReports = this.getPendingReports().length;
    const totalActions = this.auditLog.length;
    const bannedUsers = Array.from(this.userStatuses.values()).filter((s) => s.status === 'banned').length;
    const suspendedUsers = Array.from(this.userStatuses.values()).filter((s) => s.status === 'suspended').length;

    return {
      pendingReports,
      totalActions,
      bannedUsers,
      suspendedUsers,
      totalReports: this.reports.length,
      reportsResolved: this.reports.filter((r) => r.status === 'resolved').length,
      reportsThisWeek: this.reports.filter((r) => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return r.timestamp.getTime() > weekAgo;
      }).length,
    };
  }
}

export const moderationService = new ModerationService();
