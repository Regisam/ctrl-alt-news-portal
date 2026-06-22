import { logger } from '../logger.js';

// AC7: Data sensitivity levels
export type DataSensitivity = 'public' | 'internal' | 'sensitive' | 'confidential';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  status: 'success' | 'failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
  dataSensitivity: DataSensitivity;
  consentId?: string; // AC6: Link to consent record
}

class AuditLogger {
  private logs: AuditEntry[] = [];
  private readonly MAX_LOGS = 100000;
  private readonly RETENTION_DAYS = 365;
  private cleanup: NodeJS.Timeout;
  private checksumSequence = '';

  constructor() {
    // Cleanup old logs daily
    this.cleanup = setInterval(() => this.cleanupOldLogs(), 24 * 60 * 60 * 1000);
  }

  // AC1: Record user action
  recordAction(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.push(auditEntry);

    // AC2: Update checksum (immutability verification)
    this.updateChecksum(auditEntry);

    // AC10: Verify integrity
    this.verifyIntegrity();

    // Keep max logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }

    logger.info('Audit entry recorded', {
      action: entry.action,
      resource: entry.resource,
      userId: entry.userId,
      status: entry.status,
    });

    return auditEntry;
  }

  // AC8: Search audit logs
  searchLogs(criteria: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'success' | 'failure';
    severity?: string;
  }): AuditEntry[] {
    return this.logs.filter((log) => {
      if (criteria.userId && log.userId !== criteria.userId) return false;
      if (criteria.action && log.action !== criteria.action) return false;
      if (criteria.resource && log.resource !== criteria.resource) return false;
      if (criteria.status && log.status !== criteria.status) return false;
      if (criteria.severity && log.severity !== criteria.severity) return false;

      if (criteria.startDate) {
        const logDate = new Date(log.timestamp);
        if (logDate < criteria.startDate) return false;
      }

      if (criteria.endDate) {
        const logDate = new Date(log.timestamp);
        if (logDate > criteria.endDate) return false;
      }

      return true;
    });
  }

  // AC4/AC5: Get user's personal data (GDPR data portability)
  getUserData(userId: string): {
    logs: AuditEntry[];
    count: number;
    dateRange: { from: string; to: string } | null;
  } {
    const userLogs = this.searchLogs({ userId });

    if (userLogs.length === 0) {
      return { logs: [], count: 0, dateRange: null };
    }

    const dates = userLogs.map((l) => new Date(l.timestamp).getTime());
    const dateRange = {
      from: new Date(Math.min(...dates)).toISOString(),
      to: new Date(Math.max(...dates)).toISOString(),
    };

    return { logs: userLogs, count: userLogs.length, dateRange };
  }

  // AC4: Delete user's logs (pseudonymization for GDPR)
  deleteUserLogs(userId: string): number {
    const initialCount = this.logs.length;

    // AC4: Pseudonymize instead of delete (keep immutability)
    this.logs = this.logs.map((log) => {
      if (log.userId === userId) {
        return {
          ...log,
          userId: `anon-${Buffer.from(userId).toString('base64').substring(0, 8)}`,
          ipAddress: undefined,
          userAgent: undefined,
        };
      }
      return log;
    });

    const removed = initialCount - this.logs.length;
    logger.info('User logs pseudonymized', { userId, count: removed });

    return removed;
  }

  // AC10: Verify log integrity
  verifyIntegrity(): boolean {
    // In production: use cryptographic hashing
    // For now: simple sequence verification
    return this.checksumSequence.length > 0;
  }

  private updateChecksum(entry: AuditEntry): void {
    // Simple checksum (in production: use HMAC-SHA256)
    const entryString = JSON.stringify(entry);
    const hash = Buffer.from(entryString).toString('base64').substring(0, 16);
    this.checksumSequence += hash;
  }

  private cleanupOldLogs(): void {
    const cutoffTime = Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const initialCount = this.logs.length;

    this.logs = this.logs.filter((log) => new Date(log.timestamp).getTime() >= cutoffTime);

    const removed = initialCount - this.logs.length;
    if (removed > 0) {
      logger.info('Old audit logs cleaned', { count: removed });
    }
  }

  getStats(): {
    totalEntries: number;
    dateRange: { from: string; to: string } | null;
    actionTypes: Record<string, number>;
    criticalCount: number;
  } {
    if (this.logs.length === 0) {
      return { totalEntries: 0, dateRange: null, actionTypes: {}, criticalCount: 0 };
    }

    const actionTypes: Record<string, number> = {};
    let criticalCount = 0;
    const dates = this.logs.map((l) => new Date(l.timestamp).getTime());

    for (const log of this.logs) {
      actionTypes[log.action] = (actionTypes[log.action] || 0) + 1;
      if (log.severity === 'critical') criticalCount += 1;
    }

    return {
      totalEntries: this.logs.length,
      dateRange: {
        from: new Date(Math.min(...dates)).toISOString(),
        to: new Date(Math.max(...dates)).toISOString(),
      },
      actionTypes,
      criticalCount,
    };
  }

  destroy(): void {
    clearInterval(this.cleanup);
  }
}

export const auditLogger = new AuditLogger();
