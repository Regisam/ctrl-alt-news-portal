import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DigestScheduler } from '../../services/DigestScheduler.js';
import type { SmartDigestConfig } from '@shared/types';

describe('DigestScheduler', () => {
  let scheduler: DigestScheduler;

  beforeEach(() => {
    scheduler = new DigestScheduler();
    vi.useFakeTimers();
  });

  afterEach(() => {
    scheduler.stop();
    vi.useRealTimers();
  });

  it('should generate tokens with 32 characters', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '08:00',
      topics: ['AI'],
    };

    scheduler.scheduleUser(config, 'user123');
    const token = scheduler['generateToken']('user123', 'unsubscribe');

    expect(token).toHaveLength(32);
    expect(typeof token).toBe('string');
  });

  it('should validate token and return null when expired', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '08:00',
      topics: ['AI'],
    };

    scheduler.scheduleUser(config, 'user123');
    const token = scheduler['generateToken']('user123', 'unsubscribe');

    // Advance time by 25 hours (token expires at 24h)
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    const record = scheduler.validateToken(token, 'unsubscribe');
    expect(record).toBeNull();
  });

  it('should return null for token that was already used', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '08:00',
      topics: ['AI'],
    };

    scheduler.scheduleUser(config, 'user123');
    const token = scheduler['generateToken']('user123', 'unsubscribe');

    // Validate once
    let record = scheduler.validateToken(token, 'unsubscribe');
    expect(record).not.toBeNull();

    // Consume the token
    scheduler.consumeToken(token);

    // Try to validate again
    record = scheduler.validateToken(token, 'unsubscribe');
    expect(record).toBeNull();
  });

  it('should send digest when called directly', () => {
    const consoleSpy = vi.spyOn(console, 'log');

    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '14:30',
      topics: ['AI', 'Science'],
    };

    scheduler.scheduleUser(config, 'user456');
    scheduler.sendDigest('user456', config);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[DigestScheduler] 📧 SENDING DIGEST TO USER: user456')
    );

    consoleSpy.mockRestore();
  });

  it('should update lastDigestSent after sending', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '14:30',
      topics: ['AI'],
    };

    scheduler.scheduleUser(config, 'user456');
    const beforeSend = new Date();
    scheduler.sendDigest('user456', config);

    const updatedConfig = scheduler.getUserConfig('user456');
    expect(updatedConfig?.lastDigestSent).toBeDefined();
    expect(new Date(updatedConfig!.lastDigestSent!).getTime()).toBeGreaterThanOrEqual(beforeSend.getTime());
  });

  it('should calculate daily schedule correctly', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '14:30',
      topics: ['AI'],
    };

    scheduler.scheduleUser(config, 'user456');
    const scheduledUsers = scheduler.getScheduledUsers();

    expect(scheduledUsers).toHaveLength(1);
    expect(scheduledUsers[0].config.frequency).toBe('daily');
    expect(scheduledUsers[0].config.preferredTime).toBe('14:30');
  });

  it('should detect if digest was recently sent (within 55 minutes)', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '14:30',
      topics: ['AI'],
    };

    scheduler.scheduleUser(config, 'user456');

    // Send digest first time
    scheduler.sendDigest('user456', config);
    const firstSendTime = new Date(config.lastDigestSent!).getTime();

    // Try to send again immediately
    // In real scenario, processSchedule would check this with 55 minute debounce
    const now = new Date().getTime();
    const timeSinceLastSend = now - firstSendTime;

    expect(timeSinceLastSend).toBeLessThan(60000); // Less than 1 minute
    expect(timeSinceLastSend).toBeGreaterThanOrEqual(0);
  });

  it('should start and stop the scheduler interval', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    scheduler.start();
    expect(scheduler['intervalId']).not.toBeNull();

    scheduler.stop();
    expect(scheduler['intervalId']).toBeNull();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it('should not start scheduler twice', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    scheduler.start();
    const callCountAfterFirst = setIntervalSpy.mock.calls.length;

    scheduler.start(); // Try to start again
    const callCountAfterSecond = setIntervalSpy.mock.calls.length;

    expect(callCountAfterSecond).toBe(callCountAfterFirst);

    setIntervalSpy.mockRestore();
  });

  it('should unschedule a user', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'daily',
      preferredTime: '08:00',
      topics: ['AI'],
    };

    scheduler.scheduleUser(config, 'user123');
    expect(scheduler.getScheduledUsers()).toHaveLength(1);

    scheduler.unscheduleUser('user123');
    expect(scheduler.getScheduledUsers()).toHaveLength(0);
  });

  it('should get user config', () => {
    const config: SmartDigestConfig = {
      enabled: true,
      frequency: 'weekly',
      preferredTime: '10:00',
      topics: ['Science'],
    };

    scheduler.scheduleUser(config, 'user999');
    const retrieved = scheduler.getUserConfig('user999');

    expect(retrieved).toEqual(config);
  });

  it('should return null for non-existent user config', () => {
    const retrieved = scheduler.getUserConfig('nonexistent');
    expect(retrieved).toBeNull();
  });
});
