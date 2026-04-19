import logger from '../logger';
import { NotificationService } from './notification-service';

const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000; // Run every 6 hours

let cleanupInterval: NodeJS.Timeout | null = null;

export function startNotificationCleanup(): void {
  if (cleanupInterval) {
    logger.warn('Notification cleanup already running');
    return;
  }

  logger.info('Starting notification cleanup scheduler (runs every 6 hours)');

  // Run cleanup immediately on startup
  runCleanup();

  // Then run periodically
  cleanupInterval = setInterval(runCleanup, CLEANUP_INTERVAL);
}

export function stopNotificationCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('Notification cleanup scheduler stopped');
  }
}

async function runCleanup(): Promise<void> {
  try {
    const count = await NotificationService.cleanupOldNotifications();
    if (count > 0) {
      logger.info('Notification cleanup completed', { count });
    }
  } catch (error) {
    logger.error('Notification cleanup failed', { error });
  }
}
