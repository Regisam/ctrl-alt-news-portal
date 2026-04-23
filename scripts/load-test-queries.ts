#!/usr/bin/env node
/**
 * Load Testing Script
 * Simulates concurrent database queries to measure throughput
 * Target: 1000+ queries/sec without performance degradation
 * Story 7.2: API Performance Optimization & Database Indexing
 */

import { prisma } from '../server/src/prisma';
import logger from '../server/src/logger';

// Suppress Prisma query logging
prisma.$on('query' as never, () => {});

interface LoadTestResult {
  concurrency: number;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  totalTime: number;
  queriesPerSecond: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

async function runLoadTest(concurrency: number, queriesPerWorker: number): Promise<LoadTestResult> {
  const results: number[] = [];
  let failedQueries = 0;
  const startTime = Date.now();

  const workers = Array.from({ length: concurrency }, async () => {
    for (let i = 0; i < queriesPerWorker; i++) {
      try {
        const queryStartTime = Date.now();

        // Simulate a typical API query (article list)
        await prisma.article.findMany({
          where: {
            status: 'PUBLISHED',
            deletedAt: null,
          },
          include: {
            author: { select: { id: true, fullName: true } },
            category: { select: { id: true, nameEn: true } },
          },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        });

        const queryTime = Date.now() - queryStartTime;
        results.push(queryTime);
      } catch (error) {
        failedQueries++;
      }
    }
  });

  await Promise.all(workers);

  const totalTime = Date.now() - startTime;
  const totalQueries = concurrency * queriesPerWorker;
  const successfulQueries = totalQueries - failedQueries;
  const queriesPerSecond = (totalQueries / totalTime) * 1000;

  // Calculate statistics
  results.sort((a, b) => a - b);
  const avgResponseTime = results.reduce((a, b) => a + b, 0) / results.length;
  const maxResponseTime = Math.max(...results);
  const minResponseTime = Math.min(...results);
  const p95Index = Math.floor(results.length * 0.95);
  const p99Index = Math.floor(results.length * 0.99);
  const p95ResponseTime = results[p95Index];
  const p99ResponseTime = results[p99Index];

  return {
    concurrency,
    totalQueries,
    successfulQueries,
    failedQueries,
    totalTime,
    queriesPerSecond,
    avgResponseTime,
    maxResponseTime,
    minResponseTime,
    p95ResponseTime,
    p99ResponseTime,
  };
}

async function executeLoadTest(): Promise<void> {
  logger.info('🚀 Starting Load Testing...\n');

  const testConfigs = [
    { concurrency: 10, queriesPerWorker: 100 },    // 1,000 total
    { concurrency: 50, queriesPerWorker: 100 },    // 5,000 total
    { concurrency: 100, queriesPerWorker: 100 },   // 10,000 total
  ];

  const allResults: LoadTestResult[] = [];

  for (const config of testConfigs) {
    logger.info(
      `📊 Testing: ${config.concurrency} concurrent workers, ${config.queriesPerWorker} queries each`
    );

    const result = await runLoadTest(config.concurrency, config.queriesPerWorker);
    allResults.push(result);

    logger.info(`  ✅ Successful: ${result.successfulQueries}/${result.totalQueries}`);
    logger.info(`  ⏱️  Total Time: ${result.totalTime}ms`);
    logger.info(`  🔥 Throughput: ${result.queriesPerSecond.toFixed(2)} queries/sec`);
    logger.info(`  📈 Response Times:`);
    logger.info(`     - Min: ${result.minResponseTime}ms`);
    logger.info(`     - Avg: ${result.avgResponseTime.toFixed(2)}ms`);
    logger.info(`     - p95: ${result.p95ResponseTime}ms`);
    logger.info(`     - p99: ${result.p99ResponseTime}ms`);
    logger.info(`     - Max: ${result.maxResponseTime}ms\n`);
  }

  // Summary
  logger.info('📋 Load Test Summary:');
  logger.info('====================================');

  const maxThroughput = Math.max(...allResults.map((r) => r.queriesPerSecond));
  const target = 1000; // queries/sec

  logger.info(`Peak Throughput: ${maxThroughput.toFixed(2)} queries/sec`);
  logger.info(`Target: ${target}+ queries/sec`);
  logger.info(`Status: ${maxThroughput >= target ? '✅ PASS' : '⚠️  BELOW TARGET'}`);
  logger.info('====================================\n');

  if (maxThroughput < target) {
    logger.warn(`⚠️  Throughput is below target (${maxThroughput.toFixed(2)} < ${target})`);
    logger.warn('Recommendations:');
    logger.warn('  - Review query execution plans with EXPLAIN ANALYZE');
    logger.warn('  - Add connection pooling in production');
    logger.warn('  - Consider caching frequently accessed data');
  } else {
    logger.info(`✅ Load test passed! System can handle ${maxThroughput.toFixed(2)} queries/sec`);
  }

  logger.info('✅ Load testing complete!\n');
}

// Run load test
executeLoadTest()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Fatal error:', { error });
    process.exit(1);
  });
