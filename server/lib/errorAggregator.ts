import { createErrorFingerprint, classifyErrorSeverity, getErrorSignature } from './errorFingerprint.js';
import { logger } from '../logger.js';

export interface ErrorRecord {
  fingerprint: string;
  type: string;
  message: string;
  signature: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  firstSeen: string;
  lastSeen: string;
  users: Set<string>;
  recentRequests: Array<{
    timestamp: string;
    userId?: string;
    method: string;
    path: string;
    status: number;
  }>;
}

class ErrorAggregator {
  private errors: Map<string, ErrorRecord> = new Map();
  private cleanup: NodeJS.Timeout;
  private readonly MAX_RECENT_REQUESTS = 10;
  private readonly RETENTION_DAYS = 30;

  constructor() {
    // Cleanup old errors every day
    this.cleanup = setInterval(() => this.cleanupOldErrors(), 24 * 60 * 60 * 1000);
  }

  recordError(
    errorType: string,
    message: string,
    stack: string | undefined,
    context?: {
      userId?: string;
      method?: string;
      path?: string;
      status?: number;
    }
  ): void {
    const fingerprint = createErrorFingerprint({ type: errorType, message, stack });
    const severity = classifyErrorSeverity(errorType, message);
    const signature = getErrorSignature({ type: errorType, message, stack });
    const now = new Date().toISOString();

    let record = this.errors.get(fingerprint);

    if (!record) {
      // AC1-3: New error
      record = {
        fingerprint,
        type: errorType,
        message,
        signature,
        severity,
        count: 0,
        firstSeen: now,
        lastSeen: now,
        users: new Set(),
        recentRequests: [],
      };
      this.errors.set(fingerprint, record);
    }

    // AC2: Increment frequency
    record.count += 1;
    record.lastSeen = now;

    // AC6: Track affected users
    if (context?.userId) {
      record.users.add(context.userId);
    }

    // AC10: Store request details for replay
    if (context) {
      record.recentRequests.push({
        timestamp: now,
        userId: context.userId,
        method: context.method || 'unknown',
        path: context.path || 'unknown',
        status: context.status || 0,
      });

      // Keep only recent requests
      if (record.recentRequests.length > this.MAX_RECENT_REQUESTS) {
        record.recentRequests.shift();
      }
    }

    // AC9: Alert on error spike (10x increase)
    if (record.count % 10 === 0 && record.count > 10) {
      logger.warn('Error spike detected', {
        fingerprint,
        type: errorType,
        message,
        count: record.count,
        severity,
      });
    }
  }

  // AC7: Get all errors for dashboard
  getErrors(limit: number = 100): ErrorRecord[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((error) => ({
        ...error,
        users: error.users, // Keep as Set for JSON serialization
      }));
  }

  // AC11: Regex search for errors
  searchErrors(pattern: string): ErrorRecord[] {
    const regex = new RegExp(pattern, 'i');
    return Array.from(this.errors.values()).filter(
      (error) =>
        regex.test(error.message) ||
        regex.test(error.type) ||
        regex.test(error.signature)
    );
  }

  // AC8: Export errors as JSON
  exportAsJSON(): string {
    const errors = this.getErrors();
    return JSON.stringify(
      {
        exported: new Date().toISOString(),
        count: errors.length,
        errors: errors.map((e) => ({
          ...e,
          userCount: e.users.size,
          users: Array.from(e.users),
        })),
      },
      null,
      2
    );
  }

  // AC8: Export errors as CSV
  exportAsCSV(): string {
    const headers = ['Fingerprint', 'Type', 'Message', 'Severity', 'Count', 'First Seen', 'Last Seen', 'Affected Users'];
    const errors = this.getErrors();

    const rows = errors.map((e) => [
      e.fingerprint,
      e.type,
      `"${e.message.replace(/"/g, '""')}"`,
      e.severity,
      e.count,
      e.firstSeen,
      e.lastSeen,
      e.users.size,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  private cleanupOldErrors(): void {
    const cutoffDate = new Date(Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000);

    for (const [fingerprint, error] of this.errors.entries()) {
      if (new Date(error.lastSeen) < cutoffDate) {
        this.errors.delete(fingerprint);
      }
    }

    logger.debug('Error cleanup completed', { remaining: this.errors.size });
  }

  getStats(): {
    totalErrors: number;
    uniqueErrors: number;
    totalOccurrences: number;
    criticalCount: number;
  } {
    const errors = Array.from(this.errors.values());
    return {
      totalErrors: errors.length,
      uniqueErrors: errors.length,
      totalOccurrences: errors.reduce((sum, e) => sum + e.count, 0),
      criticalCount: errors.filter((e) => e.severity === 'critical').length,
    };
  }

  destroy(): void {
    clearInterval(this.cleanup);
    this.errors.clear();
  }
}

export const errorAggregator = new ErrorAggregator();
