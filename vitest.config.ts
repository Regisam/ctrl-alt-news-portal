import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';

// Set test environment early so it's available during module import
process.env.NODE_ENV = 'test';

// Detect available CPU cores and limit workers to avoid machine overload
const cpuCount = os.cpus().length;
const maxWorkers = Math.max(1, Math.floor(cpuCount / 3));

export default defineConfig({
  plugins: [react()],
  test: {
    // Use 'node' for server integration tests, 'jsdom' for client component tests
    environment: process.env.TEST_ENV === 'integration' ? 'node' : 'jsdom',
    globals: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: maxWorkers,
        minThreads: 1,
      },
    },
    setupFiles:
      process.env.TEST_ENV === 'integration'
        ? ['./server/__tests__/setup.ts']
        : ['./client/src/__tests__/setup.ts'],
    // Include both client component tests and server integration tests
    include: [
      'client/src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'server/__tests__/**/*.{test,spec}.{js,ts}',
    ],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: [
        'client/src/**/*.{ts,tsx}',
        'server/**/*.{ts,js}',
      ],
      exclude: [
        'node_modules/',
        'client/src/**/*.test.{ts,tsx}',
        'client/src/**/__tests__/**',
        'client/src/components/ui/**',  // Radix UI re-exports
        'client/src/main.tsx',            // Entry point
        'client/src/App.tsx',             // Root component
        'client/src/const.ts',            // Constants
        'server/**/*.test.ts',
        'server/**/__tests__/**',
        'server/index.ts',               // Server entry point
        'server/tracing.ts',             // Tracing setup
      ],
      // Coverage thresholds (enforced by CI/CD)
      branches: 70,
      functions: 60,
      lines: 28,
      statements: 28,
      // Per-path thresholds for critical code
      perFile: false,
      // Generate coverage-summary.json for CI/CD reporting
      reportsDirectory: './coverage',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
