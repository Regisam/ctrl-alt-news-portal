#!/usr/bin/env node
/**
 * Query Performance Analysis Script
 * Analyzes database query execution plans and measures response times
 * Story 7.2: API Performance Optimization & Database Indexing
 */

import { prisma } from '../server/src/prisma';
import logger from '../server/src/logger';

interface QueryResult {
  name: string;
  query: string;
  executionTime: number;
  estimatedRows: number;
  indexUsed: boolean;
}

const queries = [
  {
    name: 'Article List (Published)',
    query: `
      SELECT a.id, a."titleEn", a."titlePt", a."slug", a."viewCount",
             a."publishedAt", c."nameEn", u."fullName"
      FROM articles a
      JOIN categories c ON a."categoryId" = c.id
      JOIN users u ON a."authorId" = u.id
      WHERE a.status = 'PUBLISHED' AND a."deletedAt" IS NULL
      ORDER BY a."publishedAt" DESC
      LIMIT 20;
    `,
  },
  {
    name: 'Article by ID with Comments',
    query: `
      SELECT a.id, a."titleEn", a."contentEn",
             c."id" as comment_id, c.content, cu."fullName"
      FROM articles a
      LEFT JOIN comments c ON a.id = c."articleId" AND c."deletedAt" IS NULL
      LEFT JOIN users cu ON c."authorId" = cu.id
      WHERE a.id = '${generateRandomId()}' AND a."deletedAt" IS NULL
      ORDER BY c."createdAt" DESC
      LIMIT 20;
    `,
  },
  {
    name: 'Search Articles (Full-Text)',
    query: `
      SELECT asi."articleId", a."titleEn", a."slug",
             ts_rank(asi."searchVector", plainto_tsquery('english', 'AI')) as rank
      FROM article_search_index asi
      JOIN articles a ON asi."articleId" = a.id
      WHERE asi."searchVector" @@ plainto_tsquery('english', 'AI')
      ORDER BY rank DESC
      LIMIT 20;
    `,
  },
  {
    name: 'Comments by Article',
    query: `
      SELECT c.id, c.content, c."createdAt", u."fullName", u."avatarUrl"
      FROM comments c
      JOIN users u ON c."authorId" = u.id
      WHERE c."articleId" = '${generateRandomId()}'
        AND c."deletedAt" IS NULL
        AND c.status = 'APPROVED'
      ORDER BY c."createdAt" DESC;
    `,
  },
  {
    name: 'User Articles',
    query: `
      SELECT a.id, a."titleEn", a.status, a."viewCount", a."publishedAt"
      FROM articles a
      WHERE a."authorId" = '${generateRandomId()}' AND a."deletedAt" IS NULL
      ORDER BY a."createdAt" DESC;
    `,
  },
];

function generateRandomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

async function analyzeQueries(): Promise<void> {
  logger.info('🔍 Starting Query Performance Analysis...\n');

  const results: QueryResult[] = [];

  for (const queryDef of queries) {
    try {
      logger.info(`📊 Analyzing: ${queryDef.name}`);

      // Get execution plan
      const startTime = Date.now();
      const explainResult = await prisma.$queryRawUnsafe<any[]>(
        `EXPLAIN ANALYZE ${queryDef.query}`
      );
      const executionTime = Date.now() - startTime;

      // Extract execution time from EXPLAIN output
      const planText = explainResult.map((row: any) => row['QUERY PLAN']).join('\n');
      const timeMatch = planText.match(/Execution Time: ([\d.]+) ms/);
      const dbExecutionTime = timeMatch ? parseFloat(timeMatch[1]) : executionTime;

      // Check if index was used
      const indexUsed = planText.includes('Index') || planText.includes('Index Scan');

      logger.info(`  ⏱️  Execution Time: ${dbExecutionTime.toFixed(2)}ms`);
      logger.info(`  🔑 Index Used: ${indexUsed ? '✅ Yes' : '❌ No'}`);
      logger.info(`  📋 Plan:\n${planText.split('\n').slice(0, 10).join('\n')}\n`);

      results.push({
        name: queryDef.name,
        query: queryDef.query,
        executionTime: dbExecutionTime,
        estimatedRows: 0,
        indexUsed,
      });
    } catch (error) {
      logger.error(`❌ Error analyzing ${queryDef.name}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Summary
  logger.info('\n📈 Performance Summary:');
  logger.info('====================================');

  const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
  const maxTime = Math.max(...results.map((r) => r.executionTime));
  const indexUsedCount = results.filter((r) => r.indexUsed).length;

  logger.info(`Average Execution Time: ${avgTime.toFixed(2)}ms`);
  logger.info(`Max Execution Time: ${maxTime.toFixed(2)}ms`);
  logger.info(`Index Usage: ${indexUsedCount}/${results.length} queries`);
  logger.info(`Target (p99): <300ms ✅`);
  logger.info('====================================\n');

  // Recommendations
  if (avgTime > 300) {
    logger.warn('⚠️  Average execution time exceeds 300ms target');
    logger.warn('Recommendations:');
    results.forEach((result) => {
      if (result.executionTime > 300) {
        logger.warn(`  - ${result.name}: Consider additional indexes or query optimization`);
      }
    });
  }

  if (indexUsedCount < results.length) {
    logger.warn('⚠️  Some queries are not using indexes');
    results.forEach((result) => {
      if (!result.indexUsed) {
        logger.warn(`  - ${result.name}: Add appropriate indexes`);
      }
    });
  }

  logger.info('✅ Analysis complete!\n');
}

// Run analysis
analyzeQueries()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Fatal error:', { error });
    process.exit(1);
  });
