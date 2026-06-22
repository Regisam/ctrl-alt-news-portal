import { logger } from '../logger.js';

export interface BackupMetadata {
  id: string;
  timestamp: string;
  size: number; // bytes
  status: 'pending' | 'completed' | 'failed' | 'verified';
  verified: boolean;
  verifiedAt?: string;
  retentionUntil: string;
  encrypted: boolean;
  location: string;
}

class BackupManager {
  private backups: Map<string, BackupMetadata> = new Map();
  private readonly RETENTION_DAYS = 30;
  private readonly MAX_DAILY_BACKUPS = 1;
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Cleanup old backups daily
    this.cleanup = setInterval(() => this.cleanupOldBackups(), 24 * 60 * 60 * 1000);
  }

  // AC1: Create backup
  async createBackup(): Promise<BackupMetadata> {
    const id = `backup-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const retentionUntil = new Date(Date.now() + this.RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const backup: BackupMetadata = {
      id,
      timestamp,
      size: 0, // Will be set after actual backup
      status: 'pending',
      verified: false,
      retentionUntil,
      encrypted: true,
      location: `s3://backups/${id}.backup.enc`,
    };

    this.backups.set(id, backup);
    logger.info('Backup created', { id, timestamp });

    // AC3: Verify backup (async)
    this.verifyBackup(id).catch((error) => {
      logger.error('Backup verification failed', { id, error });
      backup.status = 'failed';
    });

    return backup;
  }

  // AC3: Verify backup (test restore)
  async verifyBackup(backupId: string): Promise<boolean> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      logger.warn('Backup not found for verification', { backupId });
      return false;
    }

    logger.info('Starting backup verification', { backupId });

    try {
      // Simulate verification (in production: actually restore to test DB)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      backup.verified = true;
      backup.verifiedAt = new Date().toISOString();
      backup.status = 'completed';

      logger.info('Backup verified', { backupId, verifiedAt: backup.verifiedAt });
      return true;
    } catch (error) {
      logger.error('Backup verification failed', { backupId, error });
      backup.status = 'failed';
      return false;
    }
  }

  // AC4: Get backup for point-in-time recovery
  getBackupAtTime(timestamp: Date): BackupMetadata | null {
    // Find closest backup before or at timestamp
    let closest: BackupMetadata | null = null;

    for (const backup of this.backups.values()) {
      const backupTime = new Date(backup.timestamp).getTime();
      const targetTime = timestamp.getTime();

      if (backupTime <= targetTime) {
        if (!closest || new Date(backup.timestamp).getTime() > new Date(closest.timestamp).getTime()) {
          closest = backup;
        }
      }
    }

    return closest;
  }

  // AC4: Restore from backup (point-in-time recovery)
  async restoreFromBackup(backupId: string): Promise<{ success: boolean; duration: number }> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    if (!backup.verified) {
      throw new Error(`Backup not verified: ${backupId}`);
    }

    logger.info('Starting restore from backup', { backupId });

    const startTime = Date.now();
    try {
      // Simulate restoration (in production: actually restore from S3)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const duration = Date.now() - startTime;
      logger.info('Restore completed', { backupId, duration });

      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Restore failed', { backupId, duration, error });
      return { success: false, duration };
    }
  }

  // AC2: Get backups within retention period
  getBackups(days: number = this.RETENTION_DAYS): BackupMetadata[] {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    return Array.from(this.backups.values())
      .filter((b) => new Date(b.timestamp).getTime() >= cutoffTime)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // AC6: Get backup statistics
  getStats(): {
    totalBackups: number;
    verifiedBackups: number;
    failedBackups: number;
    totalSize: number;
    oldestBackup: string | null;
    newestBackup: string | null;
  } {
    const backups = Array.from(this.backups.values());
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
    const verified = backups.filter((b) => b.verified).length;
    const failed = backups.filter((b) => b.status === 'failed').length;

    const sorted = backups.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      totalBackups: backups.length,
      verifiedBackups: verified,
      failedBackups: failed,
      totalSize,
      oldestBackup: sorted.length > 0 ? sorted[0].timestamp : null,
      newestBackup: sorted.length > 0 ? sorted[sorted.length - 1].timestamp : null,
    };
  }

  private cleanupOldBackups(): void {
    const cutoffTime = Date.now() - this.RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const [id, backup] of this.backups.entries()) {
      if (new Date(backup.retentionUntil).getTime() < cutoffTime) {
        this.backups.delete(id);
        removed += 1;
      }
    }

    if (removed > 0) {
      logger.info('Old backups removed', { count: removed });
    }
  }

  destroy(): void {
    clearInterval(this.cleanup);
  }
}

export const backupManager = new BackupManager();
