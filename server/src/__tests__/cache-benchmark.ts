import fetch from 'node-fetch';
import { cacheService } from '../services/cache';

const BASE_URL = 'http://localhost:3000/api';

interface BenchmarkResult {
  endpoint: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  cacheHitRate: number;
  targetMet: boolean;
}

async function benchmark(): Promise<void> {
  await cacheService.connect();

  const endpoints = [
    '/articles',
    '/categories',
    '/search?q=technology',
    '/cache/health',
  ];

  const results: BenchmarkResult[] = [];
  const TARGET_RESPONSE_TIME = 100; // milliseconds
  const ITERATIONS = 10;

  for (const endpoint of endpoints) {
    const times: number[] = [];
    let hits = 0;
    let misses = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const start = Date.now();
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const end = Date.now();
      const duration = end - start;

      times.push(duration);

      const data = (await response.json()) as any;
      if (data._cache === 'HIT') hits++;
      if (data._cache === 'MISS') misses++;
    }

    const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const cacheHitRate = hits > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

    results.push({
      endpoint,
      avgTime,
      minTime,
      maxTime,
      cacheHitRate,
      targetMet: avgTime < TARGET_RESPONSE_TIME,
    });
  }

  console.log('\n=== CACHE PERFORMANCE BENCHMARK ===\n');
  console.log(`Target response time: ${TARGET_RESPONSE_TIME}ms\n`);

  for (const result of results) {
    const status = result.targetMet ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.endpoint}`);
    console.log(`  Avg: ${result.avgTime}ms | Min: ${result.minTime}ms | Max: ${result.maxTime}ms`);
    console.log(`  Cache hit rate: ${result.cacheHitRate}%\n`);
  }

  const allPassed = results.every((r) => r.targetMet);
  console.log(`\nOverall: ${allPassed ? '✅ ALL TARGETS MET' : '❌ SOME TARGETS FAILED'}\n`);

  await cacheService.disconnect();
  process.exit(allPassed ? 0 : 1);
}

benchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
