import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../logger';
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

  it('should log info messages', () => {
    const spy = vi.spyOn(console, 'log');
    logger.info('Test message', { key: 'value' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log error messages', () => {
    const spy = vi.spyOn(console, 'error');
    logger.error('Error message', { error: 'details' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should log with request ID', () => {
    const spy = vi.spyOn(console, 'log');
    const requestId = 'req-12345';
    logger.info('Request log', { request_id: requestId });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should handle complex metadata', () => {
    const spy = vi.spyOn(console, 'log');
    logger.info('Complex log', {
      user_id: 'user-123',
      duration_ms: 42,
      context: { article_id: 'art-456' },
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
