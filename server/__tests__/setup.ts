// Global setup for integration tests
// Configures test environment, mocks, and common utilities

import { afterAll, beforeAll, afterEach } from 'vitest';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from './fixtures/database.js';

// Setup: Initialize test environment before all tests
beforeAll(async () => {
  console.log('🧪 Integration test suite starting...');
  // Global test setup can go here
});

// Teardown: Clean up after each test to prevent state leakage
afterEach(async () => {
  // Each test should call setupTestDatabase/teardownTestDatabase
  // This is a safety net for cleanup
});

// Final cleanup: Tear down test environment after all tests
afterAll(async () => {
  console.log('✅ Integration test suite completed');
  // Global cleanup can go here
});

// Mock process.env for tests if needed
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Suppress console logs during tests (optional)
const originalLog = console.log;
const originalError = console.error;
const testMode = process.env.DEBUG_TESTS !== 'true';

if (testMode) {
  console.log = (...args: any[]) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('Server running') || args[0].includes('listening'))
    ) {
      return; // Suppress server startup logs
    }
    originalLog(...args);
  };
}

export {};
