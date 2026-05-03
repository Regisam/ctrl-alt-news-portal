#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const args = process.argv.slice(2);
const thresholds = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = parseFloat(args[i + 1]);
  thresholds[key] = value;
}

// Read coverage summary
const coveragePath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(coveragePath)) {
  console.error('❌ Coverage report not found. Run: npm run test:coverage');
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
const total = coverage.total;

let passed = true;
const results = [];

Object.entries(thresholds).forEach(([metric, threshold]) => {
  const actual = total[metric]?.pct ?? 0;
  const status = actual >= threshold ? '✅' : '❌';

  if (actual < threshold) {
    passed = false;
  }

  results.push(`${status} ${metric}: ${actual.toFixed(2)}% (threshold: ${threshold}%)`);
});

console.log('\n📊 Coverage Thresholds Check:');
results.forEach(r => console.log(r));
console.log();

if (passed) {
  console.log('✅ All coverage thresholds passed!\n');
  process.exit(0);
} else {
  console.log('❌ Coverage thresholds not met\n');
  process.exit(1);
}
