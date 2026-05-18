import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger.js';
import fs from 'fs';
import path from 'path';

describe('Logger', () => {
  const logDir = path.join(process.cwd(), 'logs-test');

  beforeEach(() => {
    // Create test log directory
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Cleanup test logs
    if (fs.existsSync(logDir)) {
      fs.rmSync(logDir, { recursive: true });
    }
  });

  it('should log info messages without errors', () => {
    expect(() => {
      logger.info('Test message', { key: 'value' });
    }).not.toThrow();
  });

  it('should log error messages without errors', () => {
    expect(() => {
      logger.error('Error message', { error: 'details' });
    }).not.toThrow();
  });

  it('should log with request ID without errors', () => {
    const requestId = 'req-12345';
    expect(() => {
      logger.info('Request log', { request_id: requestId });
    }).not.toThrow();
  });

  it('should handle complex metadata without errors', () => {
    expect(() => {
      logger.info('Complex log', {
        user_id: 'user-123',
        duration_ms: 42,
        context: { article_id: 'art-456' },
      });
    }).not.toThrow();
  });
});
