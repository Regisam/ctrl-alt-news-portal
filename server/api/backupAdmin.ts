import { Router } from 'express';
import { backupManager } from '../lib/backupManager.js';
import { logger } from '../logger.js';

const router = Router();

// AC1: Create backup manually
router.post('/create', async (_req, res) => {
  try {
    const backup = await backupManager.createBackup();

    res.json({
      message: 'Backup created',
      backup,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create backup', { error });
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// AC2: List backups
router.get('/list', (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
    const backups = backupManager.getBackups(days);

    res.json({
      timestamp: new Date().toISOString(),
      window: { days },
      count: backups.length,
      backups: backups.map((b) => ({
        id: b.id,
        timestamp: b.timestamp,
        size: b.size,
        sizeGB: (b.size / 1024 / 1024 / 1024).toFixed(2),
        status: b.status,
        verified: b.verified,
        verifiedAt: b.verifiedAt,
        retentionUntil: b.retentionUntil,
        encrypted: b.encrypted,
        location: b.location,
      })),
    });
  } catch (error) {
    logger.error('Failed to list backups', { error });
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// AC6: Get backup statistics
router.get('/stats', (_req, res) => {
  try {
    const stats = backupManager.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      ...stats,
      totalSizeGB: (stats.totalSize / 1024 / 1024 / 1024).toFixed(2),
    });
  } catch (error) {
    logger.error('Failed to get backup stats', { error });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// AC3: Verify specific backup
router.post('/verify/:backupId', async (req, res) => {
  try {
    const { backupId } = req.params;
    const verified = await backupManager.verifyBackup(backupId);

    res.json({
      message: 'Backup verification completed',
      backupId,
      verified,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Backup verification failed', { error });
    res.status(500).json({ error: 'Verification failed' });
  }
});

// AC4: Restore from backup
router.post('/restore/:backupId', async (req, res) => {
  try {
    const { backupId } = req.params;
    const result = await backupManager.restoreFromBackup(backupId);

    res.json({
      message: 'Restore completed',
      backupId,
      success: result.success,
      durationMs: result.duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Restore failed', { error });
    res.status(500).json({ error: 'Restore failed' });
  }
});

// AC4: Get backup for point-in-time recovery
router.get('/backup-at-time', (req, res) => {
  try {
    const timestamp = new Date(req.query.timestamp as string);

    if (isNaN(timestamp.getTime())) {
      return res.status(400).json({ error: 'Invalid timestamp' });
    }

    const backup = backupManager.getBackupAtTime(timestamp);

    if (!backup) {
      return res.status(404).json({ error: 'No backup found for this time' });
    }

    res.json({
      timestamp: new Date().toISOString(),
      requestedTime: timestamp.toISOString(),
      backup: {
        id: backup.id,
        timestamp: backup.timestamp,
        verified: backup.verified,
      },
    });
  } catch (error) {
    logger.error('Failed to find backup at time', { error });
    res.status(500).json({ error: 'Failed to find backup' });
  }
});

export default router;
