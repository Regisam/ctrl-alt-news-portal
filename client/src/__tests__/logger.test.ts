import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientLogger, log } from '../lib/logger';

describe('Client Logger', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should sanitize passwords', () => {
    const context = {
      username: 'john',
      password: 'secret123',
    };

    const spy = vi.spyOn(global, 'fetch');
    log('info', 'Login attempt', context);

    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls[0];
    const bodyString = call[1].body as string;
    const body = JSON.parse(bodyString);

    expect(body.context.password).toBe('[REDACTED]');
    expect(body.context.username).toBe('john');
  });

  it('should sanitize tokens', () => {
    const context = {
      auth_token: 'abc123xyz',
      user_id: 'user-456',
    };

    const spy = vi.spyOn(global, 'fetch');
    log('info', 'API call', context);

    const call = spy.mock.calls[0];
    const bodyString = call[1].body as string;
    const body = JSON.parse(bodyString);

    expect(body.context.auth_token).toBe('[REDACTED]');
    expect(body.context.user_id).toBe('user-456');
  });

  it('should sanitize emails', () => {
    const context = {
      email: 'user@example.com',
      name: 'John Doe',
    };

    const spy = vi.spyOn(global, 'fetch');
    log('error', 'User action', context);

    const call = spy.mock.calls[0];
    const bodyString = call[1].body as string;
    const body = JSON.parse(bodyString);

    expect(body.context.email).toBe('[REDACTED]');
    expect(body.context.name).toBe('John Doe');
  });

  it('should handle clientLogger methods', () => {
    const spy = vi.spyOn(global, 'fetch');

    clientLogger.info('Info message');
    expect(spy).toHaveBeenCalledTimes(1);

    clientLogger.warn('Warn message');
    expect(spy).toHaveBeenCalledTimes(2);

    clientLogger.error('Error message');
    expect(spy).toHaveBeenCalledTimes(3);

    clientLogger.debug('Debug message');
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('should include timestamp in logs', () => {
    const spy = vi.spyOn(global, 'fetch');
    log('info', 'Test message');

    const call = spy.mock.calls[0];
    const bodyString = call[1].body as string;
    const body = JSON.parse(bodyString);

    expect(body.timestamp).toBeDefined();
    expect(body.level).toBe('info');
    expect(body.message).toBe('Test message');
  });
});
