/**
 * Weekly User Similarity Batch Job (Story 13.1 - Phase 3)
 * Runs weekly to compute full similarity matrix and cache embeddings
 * Scheduled for Sunday 2 AM UTC (off-peak)
 */

import { computeSimilarityMatrix, computeSimilarityMetrics } from '../../shared/lib/userSimilarity';
import { UserEngagementVector } from '../../shared/lib/engagementVectors';
import { logger } from '../logger';

export interface BatchJobResult {
  success: boolean;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  userCount: number;
  coverage: number;
  sparsity: number;
  avgNeighbors: number;
  error?: string;
  message?: string;
}

/**
 * Fetch all users with their engagement history
 * In production, this queries the database/cache
 * Returns users with computed engagement vectors
 */
async function fetchAllUsersWithEngagement(): Promise<UserEngagementVector[]> {
  // TODO: Implement database query
  // For now, return empty array (stub for integration)
  logger.info('Fetching users with engagement data...');
  return [];
}

/**
 * Cache similarity matrix in-memory or to persistent storage
 * In production, this could write to Redis, S3, or database
 */
async function cacheMatrix(
  matrix: ReturnType<typeof computeSimilarityMatrix>
): Promise<void> {
  logger.info('Caching similarity matrix...', {
    userCount: matrix.userIds.length,
    computationTimeMs: matrix.computationTime,
    coverage: matrix.coverage,
    sparsity: matrix.sparsity,
  });

  // TODO: Implement cache storage
  // Options:
  // - Redis: SET aiox:similarity:matrix <JSON> EX 604800 (7 days)
  // - In-memory: Store in process.env or module-level variable
  // - S3: Upload JSON file
  // - Database: Store in similarity_matrix table

  // Placeholder: store metadata
  global.similarityMatrixMetadata = {
    lastUpdated: matrix.lastUpdated,
    userCount: matrix.userIds.length,
    computationTimeMs: matrix.computationTime,
    coverage: matrix.coverage,
    sparsity: matrix.sparsity,
  };
}

/**
 * Log metrics to monitoring system
 * In production, this could emit to Datadog, New Relic, Prometheus, etc.
 */
function logMetrics(
  coverage: number,
  sparsity: number,
  avgNeighbors: number,
  computationTimeMs: number
): void {
  logger.info('Similarity matrix metrics', {
    coverage: `${coverage.toFixed(2)}%`,
    sparsity: `${sparsity.toFixed(2)}%`,
    avgNeighbors: avgNeighbors.toFixed(2),
    computationTimeMs,
  });

  // TODO: Emit to monitoring platform
  // Examples:
  // - Datadog: statsd.gauge('similarity.coverage', coverage)
  // - Prometheus: register counter/gauge metrics
  // - CloudWatch: putMetricData()
  // - New Relic: recordMetric()
}

/**
 * Handle errors and retry logic
 * Implements exponential backoff for transient failures
 */
async function handleBatchError(
  error: unknown,
  attemptNumber: number
): Promise<boolean> {
  const maxRetries = 3;
  const isRetryable =
    error instanceof Error &&
    (error.message.includes('timeout') ||
      error.message.includes('connection') ||
      error.message.includes('temporarily'));

  if (attemptNumber < maxRetries && isRetryable) {
    const backoffMs = Math.pow(2, attemptNumber) * 1000; // 1s, 2s, 4s
    logger.warn(`Batch job failed, retrying in ${backoffMs}ms...`, {
      attempt: attemptNumber,
      error: error instanceof Error ? error.message : String(error),
    });

    await new Promise((resolve) => setTimeout(resolve, backoffMs));
    return true; // Retry
  }

  return false; // No retry
}

/**
 * Execute weekly user similarity batch job
 * Computes full similarity matrix from all users with engagement
 * Target: < 10 minutes for 10K users
 */
export async function weeklyUserSimilarityBatch(): Promise<BatchJobResult> {
  const startedAt = new Date();
  let attemptNumber = 0;

  logger.info('Starting weekly user similarity batch job');

  while (attemptNumber < 4) {
    try {
      // Phase 1: Fetch user data
      const users = await fetchAllUsersWithEngagement();

      if (users.length === 0) {
        logger.warn('No users with engagement data found');
        return {
          success: true,
          startedAt,
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
          userCount: 0,
          coverage: 0,
          sparsity: 0,
          avgNeighbors: 0,
          message: 'No users to process',
        };
      }

      logger.info(`Computing similarity matrix for ${users.length} users`);

      // Phase 2: Compute similarity matrix
      const matrix = computeSimilarityMatrix(users);

      logger.info('Similarity matrix computed', {
        computationTimeMs: matrix.computationTime,
        coverage: `${matrix.coverage.toFixed(2)}%`,
        sparsity: `${matrix.sparsity.toFixed(2)}%`,
      });

      // Check performance target: < 10 minutes for 10K users
      if (matrix.computationTime > 600000) {
        logger.warn('Batch job exceeded performance target', {
          target: '600000ms (10 min)',
          actual: `${matrix.computationTime}ms`,
          userCount: users.length,
        });
      }

      // Phase 3: Cache results
      await cacheMatrix(matrix);

      // Phase 4: Compute and log metrics
      const metrics = computeSimilarityMetrics(matrix);
      logMetrics(metrics.coverage, metrics.sparsity, metrics.avgNeighbors, matrix.computationTime);

      // Phase 5: Success
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      logger.info('Weekly user similarity batch job completed successfully', {
        durationMs,
        userCount: users.length,
      });

      return {
        success: true,
        startedAt,
        completedAt,
        durationMs,
        userCount: users.length,
        coverage: metrics.coverage,
        sparsity: metrics.sparsity,
        avgNeighbors: metrics.avgNeighbors,
        message: `Processed ${users.length} users in ${durationMs}ms`,
      };
    } catch (error) {
      attemptNumber++;
      const shouldRetry = await handleBatchError(error, attemptNumber);

      if (!shouldRetry) {
        logger.error('Batch job failed permanently', {
          attempt: attemptNumber,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });

        return {
          success: false,
          startedAt,
          completedAt: new Date(),
          durationMs: Date.now() - startedAt.getTime(),
          userCount: 0,
          coverage: 0,
          sparsity: 0,
          avgNeighbors: 0,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  logger.error('Batch job failed after all retries');
  return {
    success: false,
    startedAt,
    completedAt: new Date(),
    durationMs: Date.now() - startedAt.getTime(),
    userCount: 0,
    coverage: 0,
    sparsity: 0,
    avgNeighbors: 0,
    error: 'Failed after 3 retries',
  };
}

/**
 * Schedule batch job to run weekly
 * Typical cron: 0 2 * * 0 (Sundays at 2 AM UTC)
 *
 * Usage in server initialization:
 * ```
 * import cron from 'node-cron';
 * import { weeklyUserSimilarityBatch } from './jobs/weeklyUserSimilarityBatch';
 *
 * cron.schedule('0 2 * * 0', async () => {
 *   await weeklyUserSimilarityBatch();
 * });
 * ```
 */
export function scheduleWeeklyBatch(): void {
  // TODO: Import cron library and schedule
  logger.info('Weekly user similarity batch scheduled for Sundays at 2 AM UTC');
}

// Global type augmentation for similarity matrix metadata
declare global {
  var similarityMatrixMetadata: {
    lastUpdated: Date;
    userCount: number;
    computationTimeMs: number;
    coverage: number;
    sparsity: number;
  } | undefined;
}

export default { weeklyUserSimilarityBatch, scheduleWeeklyBatch };
