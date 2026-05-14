import { nanoid } from 'nanoid';
import type { SmartDigestConfig } from '@shared/types';

interface TokenRecord {
  token: string;
  userId: string;
  type: 'unsubscribe' | 'preferences' | 'tracking';
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

interface ScheduledUser {
  userId: string;
  config: SmartDigestConfig;
  addedAt: Date;
}

export class DigestScheduler {
  private tokenStore: Map<string, TokenRecord> = new Map();
  private scheduledUsers: Map<string, ScheduledUser> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {}

  /**
   * Start the scheduler — processes every 60 seconds
   */
  start(): void {
    if (this.intervalId) {
      console.warn('[DigestScheduler] Already running');
      return;
    }

    console.log('[DigestScheduler] Starting scheduler (60s interval)');
    this.intervalId = setInterval(() => {
      this.processSchedule();
    }, 60000); // Check every 60 seconds

    // Also run once immediately
    this.processSchedule();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[DigestScheduler] Stopped');
    }
  }

  /**
   * Register a user for digest scheduling
   */
  scheduleUser(config: SmartDigestConfig, userId: string): void {
    this.scheduledUsers.set(userId, { userId, config, addedAt: new Date() });
    console.log(
      `[DigestScheduler] User ${userId} scheduled: ${config.frequency} at ${config.preferredTime}`
    );
  }

  /**
   * Unschedule a user (called via unsubscribe)
   */
  unscheduleUser(userId: string): void {
    this.scheduledUsers.delete(userId);
    console.log(`[DigestScheduler] User ${userId} unscheduled`);
  }

  /**
   * Main scheduling loop — called every 60 seconds
   */
  private processSchedule(): void {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.

    for (const [userId, scheduled] of this.scheduledUsers) {
      const { config } = scheduled;

      // Parse preferred time (format: "08:00")
      const [prefHour, prefMinute] = config.preferredTime.split(':').map(Number);

      let shouldSend = false;

      if (config.frequency === 'daily') {
        // Send if current time matches preferred time (within 1-minute window)
        shouldSend = currentHour === prefHour && currentMinute === prefMinute;
      } else if (config.frequency === 'weekly') {
        // Send on Monday (day 1) at preferred time
        shouldSend =
          currentDay === 1 && currentHour === prefHour && currentMinute === prefMinute;
      }

      if (shouldSend) {
        const lastSent = config.lastDigestSent ? new Date(config.lastDigestSent) : null;
        const now_ms = now.getTime();
        const lastSent_ms = lastSent ? lastSent.getTime() : 0;

        // Debounce: don't send if we sent in the last 55 minutes
        if (now_ms - lastSent_ms > 55 * 60 * 1000) {
          this.sendDigest(userId, config);
        }
      }
    }
  }

  /**
   * Send digest to user (mock: logs to console)
   */
  sendDigest(userId: string, config: SmartDigestConfig): void {
    console.log(`\n[DigestScheduler] 📧 SENDING DIGEST TO USER: ${userId}`);
    console.log(`   Frequency: ${config.frequency}`);
    console.log(`   Preferred time: ${config.preferredTime}`);
    console.log(`   Topics: ${config.topics.join(', ')}`);

    // Generate tokens for this digest
    const unsubscribeToken = this.generateToken(userId, 'unsubscribe');
    const preferencesToken = this.generateToken(userId, 'preferences');

    console.log(`   Unsubscribe token: ${unsubscribeToken}`);
    console.log(`   Preferences token: ${preferencesToken}`);
    console.log(
      `   [Email would be sent here with renderDigestEmail()]\n`
    );

    // Update config to record when digest was sent
    config.lastDigestSent = new Date();
    this.scheduledUsers.set(userId, { userId, config, addedAt: new Date() });
  }

  /**
   * Generate a one-time token for unsubscribe/preferences/tracking
   */
  generateToken(userId: string, type: 'unsubscribe' | 'preferences' | 'tracking'): string {
    const token = nanoid(32);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24h

    this.tokenStore.set(token, {
      token,
      userId,
      type,
      createdAt: now,
      expiresAt,
      used: false,
    });

    return token;
  }

  /**
   * Validate a token (check if exists, not expired, not used)
   */
  validateToken(
    token: string,
    type: 'unsubscribe' | 'preferences' | 'tracking'
  ): TokenRecord | null {
    const record = this.tokenStore.get(token);

    if (!record) {
      console.warn(`[DigestScheduler] Invalid token: ${token}`);
      return null;
    }

    if (record.used) {
      console.warn(`[DigestScheduler] Token already used: ${token}`);
      return null;
    }

    if (new Date() > record.expiresAt) {
      console.warn(`[DigestScheduler] Token expired: ${token}`);
      return null;
    }

    if (record.type !== type) {
      console.warn(`[DigestScheduler] Token type mismatch. Expected: ${type}, Got: ${record.type}`);
      return null;
    }

    return record;
  }

  /**
   * Consume (mark as used) a token — one-time use
   */
  consumeToken(token: string): void {
    const record = this.tokenStore.get(token);
    if (record) {
      record.used = true;
      console.log(`[DigestScheduler] Token consumed: ${token} (userId: ${record.userId})`);
    }
  }

  /**
   * Get user's digest config
   */
  getUserConfig(userId: string): SmartDigestConfig | null {
    return this.scheduledUsers.get(userId)?.config || null;
  }

  /**
   * Update user's digest config (Subtask 4.1.1: update frequency/time/topics)
   * Used when user updates preferences via UI
   */
  updateUserConfig(userId: string, updates: Partial<SmartDigestConfig>): SmartDigestConfig {
    const currentConfig = this.getUserConfig(userId);
    if (!currentConfig) {
      throw new Error(`User ${userId} not scheduled`);
    }

    const updatedConfig: SmartDigestConfig = {
      enabled: updates.enabled !== undefined ? updates.enabled : currentConfig.enabled,
      frequency: updates.frequency || currentConfig.frequency,
      preferredTime: updates.preferredTime || currentConfig.preferredTime,
      topics: updates.topics || currentConfig.topics,
      lastDigestSent: currentConfig.lastDigestSent,
    };

    // Update in scheduler
    this.scheduledUsers.set(userId, {
      userId,
      config: updatedConfig,
      addedAt: new Date(),
    });

    console.log(`[DigestScheduler] Updated config for user ${userId}:`, updatedConfig);
    return updatedConfig;
  }

  /**
   * Get all scheduled users (for testing/debugging)
   */
  getScheduledUsers(): ScheduledUser[] {
    return Array.from(this.scheduledUsers.values());
  }

  /**
   * Clear all data (for testing)
   */
  reset(): void {
    this.tokenStore.clear();
    this.scheduledUsers.clear();
    console.log('[DigestScheduler] Reset: cleared all users and tokens');
  }
}

// Singleton instance
export const digestScheduler = new DigestScheduler();
