import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use 'node' for server integration tests, 'jsdom' for client component tests
    environment: process.env.TEST_ENV === 'integration' ? 'node' : 'jsdom',
    globals: true,
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
      reporter: ['text', 'json', 'html'],
      include: [
        'client/src/**/*.{ts,tsx}',
        'server/**/*.{ts,js}',
      ],
      exclude: [
        'node_modules/',
        'client/src/**/*.test.{ts,tsx}',
        'client/src/**/__tests__/**',
        'server/**/*.test.ts',
        'server/**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
