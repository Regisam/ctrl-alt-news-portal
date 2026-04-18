import { describe, it, expect } from 'vitest';
import logger from './logger';

describe('Logger', () => {
  it('should be a Winston logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
  });
});
