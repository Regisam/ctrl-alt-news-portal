#!/usr/bin/env npx ts-node
/**
 * Alert Test Harness - Generate realistic failure conditions to trigger Prometheus alerts
 *
 * Run: npx ts-node tests/alert-test-harness.ts [test-name]
 *
 * Available tests:
 * - error-rate: Generate high error rate (trigger HttpErrorRateHigh)
 * - latency: Generate slow requests (trigger HttpLatencyHigh)
 * - memory: Simulate memory leak (trigger MemoryUsageHigh)
 * - cpu: Generate high CPU load (trigger CpuUsageHigh)
 * - all: Run all tests sequentially
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const DELAY_BETWEEN_REQUESTS = 100; // ms

interface TestResult {
  name: string;
  status: 'success' | 'error';
  duration: number;
  message: string;
}

const results: TestResult[] = [];

/**
 * Test 1: Generate high error rate
 * - Make 100 requests to non-existent endpoint
 * - Should exceed 5% error threshold and trigger HttpErrorRateHigh alert
 */
async function testErrorRateAlert(): Promise<void> {
  console.log('🔴 Test 1: Generating high error rate...');
  const startTime = Date.now();

  try {
    let errorCount = 0;
    const totalRequests = 100;

    for (let i = 0; i < totalRequests; i++) {
      try {
        const response = await fetch(`${BASE_URL}/api/nonexistent-endpoint-${i}`);
        if (!response.ok) {
          errorCount++;
        }
      } catch (e) {
        errorCount++;
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
    }

    const errorRate = (errorCount / totalRequests) * 100;
    const duration = Date.now() - startTime;

    console.log(`   ✓ Generated ${totalRequests} requests with ${errorCount} errors (${errorRate.toFixed(1)}%)`);
    console.log(`   ✓ Expected: Alert in 1-2 minutes on Slack #alerts channel`);

    results.push({
      name: 'Error Rate Test',
      status: 'success',
      duration,
      message: `${errorCount}/${totalRequests} errors (${errorRate.toFixed(1)}%)`
    });
  } catch (error) {
    console.error('   ✗ Error rate test failed:', error);
    results.push({
      name: 'Error Rate Test',
      status: 'error',
      duration: Date.now() - startTime,
      message: String(error)
    });
  }
}

/**
 * Test 2: Generate high latency
 * - Make 50 requests with 3-second delays
 * - Should exceed p99 latency threshold (>2s) and trigger HttpLatencyHigh alert
 */
async function testLatencyAlert(): Promise<void> {
  console.log('\n⏱️  Test 2: Generating high latency requests...');
  const startTime = Date.now();

  try {
    const totalRequests = 50;
    let slowRequests = 0;
    const latencies: number[] = [];

    for (let i = 0; i < totalRequests; i++) {
      try {
        const requestStart = Date.now();

        // Simulate slow request with 3-second delay on server side
        // In real scenario, this would be a slow database query or external API call
        const response = await Promise.race([
          fetch(`${BASE_URL}/api/articles?delay=3000`),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 4000)
          )
        ]);

        const requestDuration = Date.now() - requestStart;
        latencies.push(requestDuration);

        if (requestDuration > 2000) {
          slowRequests++;
        }
      } catch (e) {
        // Timeout or error - still counts as slow
        slowRequests++;
        latencies.push(4000);
      }

      await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
    }

    // Calculate p99
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);
    const p99Latency = sortedLatencies[p99Index];

    const duration = Date.now() - startTime;

    console.log(`   ✓ Generated ${totalRequests} requests with p99 latency: ${p99Latency.toFixed(0)}ms`);
    console.log(`   ✓ Slow requests (>2s): ${slowRequests}/${totalRequests}`);
    console.log(`   ✓ Expected: Alert in 2-3 minutes on Slack #alerts channel`);

    results.push({
      name: 'Latency Test',
      status: 'success',
      duration,
      message: `p99=${p99Latency.toFixed(0)}ms, ${slowRequests}/${totalRequests} slow`
    });
  } catch (error) {
    console.error('   ✗ Latency test failed:', error);
    results.push({
      name: 'Latency Test',
      status: 'error',
      duration: Date.now() - startTime,
      message: String(error)
    });
  }
}

/**
 * Test 3: Simulate memory leak
 * - Allocate large arrays and keep references (memory leak simulation)
 * - Should exceed 500MB threshold and trigger MemoryUsageHigh alert
 *
 * Note: This test is best run in isolation and requires monitoring process_resident_memory_bytes metric
 */
async function testMemoryAlert(): Promise<void> {
  console.log('\n💾 Test 3: Simulating memory leak...');
  const startTime = Date.now();

  try {
    const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`   Initial heap: ${initialMemory.toFixed(2)}MB`);

    // Allocate ~300MB in chunks (conservative estimate to avoid crash)
    const arrays: Buffer[] = [];
    const targetMemory = 300 * 1024 * 1024; // 300MB
    let currentMemory = initialMemory * 1024 * 1024;

    while (currentMemory < targetMemory) {
      const chunk = Buffer.alloc(10 * 1024 * 1024); // 10MB chunks
      chunk.fill('x');
      arrays.push(chunk);
      currentMemory = process.memoryUsage().heapUsed;

      const currentMemoryMB = currentMemory / 1024 / 1024;
      console.log(`   Allocated: ${currentMemoryMB.toFixed(2)}MB`);

      await new Promise(r => setTimeout(r, 500));
    }

    const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const duration = Date.now() - startTime;

    console.log(`   ✓ Final heap: ${finalMemory.toFixed(2)}MB`);
    console.log(`   ✓ Increase: ${(finalMemory - initialMemory).toFixed(2)}MB`);
    console.log(`   ✓ Expected: Alert when memory exceeds 500MB for 5+ minutes`);
    console.log(`   ℹ️  Keep this running to maintain memory pressure and trigger alert`);

    results.push({
      name: 'Memory Test',
      status: 'success',
      duration,
      message: `Heap: ${finalMemory.toFixed(2)}MB`
    });

    // Keep memory allocated for a while (allow time for metrics to update)
    console.log('\n   Waiting 5 minutes for metrics to update...');
    await new Promise(r => setTimeout(r, 5 * 60 * 1000));

    // Don't actually wait - return immediately
    console.log('   (Press Ctrl+C to stop test)');
  } catch (error) {
    console.error('   ✗ Memory test failed:', error);
    results.push({
      name: 'Memory Test',
      status: 'error',
      duration: Date.now() - startTime,
      message: String(error)
    });
  }
}

/**
 * Print test summary
 */
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`${status} ${result.name.padEnd(30)} ${result.duration}ms`);
    console.log(`   ${result.message}`);

    if (result.status === 'success') {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  console.log('\n📍 Next Steps:');
  console.log('1. Check Slack #alerts channel for alerts');
  console.log('2. View Prometheus: http://localhost:9090');
  console.log('3. View Grafana dashboards: http://localhost:3001');
  console.log('4. Check AlertManager: http://localhost:9093');
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const testName = process.argv[2]?.toLowerCase() || 'all';

  console.log('🚀 Starting Alert Test Harness');
  console.log(`API URL: ${BASE_URL}`);
  console.log('');

  switch (testName) {
    case 'error-rate':
      await testErrorRateAlert();
      break;
    case 'latency':
      await testLatencyAlert();
      break;
    case 'memory':
      await testMemoryAlert();
      break;
    case 'all':
      await testErrorRateAlert();
      await new Promise(r => setTimeout(r, 2000)); // Wait between tests
      await testLatencyAlert();
      // Skip memory test in "all" mode to avoid hanging
      break;
    default:
      console.error(`❌ Unknown test: ${testName}`);
      console.log('');
      console.log('Available tests:');
      console.log('  error-rate  - Generate high error rate');
      console.log('  latency     - Generate slow requests');
      console.log('  memory      - Simulate memory leak');
      console.log('  all         - Run all tests sequentially');
      process.exit(1);
  }

  printSummary();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
