import { logger } from '../logger.js';

// AC1-3: Rate limiting types
export interface RateLimitConfig {
  windowMs: number; // Time window in ms
  maxRequests: number; // Max requests per window
  message?: string;
  statusCode?: number;
}

export interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

export interface DDoSAlert {
  ip: string;
  timestamp: string;
  requestCount: number;
  anomalyScore: number;
}

class RateLimitManager {
  private requests: Map<string, RateLimitEntry> = new Map();
  private denyList: Set<string> = new Set();
  private allowList: Set<string> = new Set();
  private alerts: DDoSAlert[] = [];

  private readonly DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly DEFAULT_MAX_REQUESTS = 100;
  private readonly DDOS_THRESHOLD = 200; // Requests in window = DDoS
  private readonly CLEANUP_INTERVAL = 60 * 1000; // Cleanup every minute

  constructor() {
    // AC9: Setup cleanup interval
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  // AC1: Check if request is allowed
  isAllowed(
    identifier: string,
    config: RateLimitConfig = {}
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const windowMs = config.windowMs ?? this.DEFAULT_WINDOW_MS;
    const maxRequests = config.maxRequests ?? this.DEFAULT_MAX_REQUESTS;

    // AC6: Check whitelist
    if (this.allowList.has(identifier)) {
      logger.debug('Rate limit bypassed (whitelist)', { identifier });
      return { allowed: true, remaining: maxRequests, resetTime: 0 };
    }

    // AC6: Check blacklist/deny list
    if (this.denyList.has(identifier)) {
      logger.warn('Rate limit blocked (deny list)', { identifier });
      return { allowed: false, remaining: 0, resetTime: Date.now() + windowMs };
    }

    const now = Date.now();
    const entry = this.requests.get(identifier) || {
      count: 0,
      resetTime: now + windowMs,
      blocked: false,
    };

    // AC4: Sliding window - reset if window expired
    if (now >= entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
      entry.blocked = false;
    }

    entry.count++;
    this.requests.set(identifier, entry);

    // AC3: DDoS detection
    if (entry.count > this.DDOS_THRESHOLD) {
      entry.blocked = true;
      this.recordDDoSAlert(identifier, entry.count);
    }

    const allowed = entry.count <= maxRequests && !entry.blocked;
    const remaining = Math.max(0, maxRequests - entry.count);

    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count: entry.count,
        limit: maxRequests,
      });
    }

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  // AC3: Record DDoS alert
  private recordDDoSAlert(ip: string, requestCount: number): void {
    const anomalyScore = Math.min(100, (requestCount / this.DDOS_THRESHOLD) * 100);

    const alert: DDoSAlert = {
      ip,
      timestamp: new Date().toISOString(),
      requestCount,
      anomalyScore,
    };

    this.alerts.push(alert);

    // Keep last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    logger.warn('DDoS alert', { ip, requestCount, anomalyScore });

    // Auto-block if threshold exceeded
    if (anomalyScore > 80) {
      this.addToBlacklist(ip, 5 * 60 * 1000); // Block for 5 minutes
    }
  }

  // AC6: Add IP to whitelist
  whitelist(identifier: string): void {
    this.allowList.add(identifier);
    logger.info('Added to whitelist', { identifier });
  }

  // AC6: Remove from whitelist
  removeWhitelist(identifier: string): void {
    this.allowList.delete(identifier);
    logger.info('Removed from whitelist', { identifier });
  }

  // AC6: Add IP to blacklist
  addToBlacklist(identifier: string, durationMs?: number): void {
    this.denyList.add(identifier);
    logger.warn('Added to blacklist', { identifier, durationMs });

    // Auto-remove after duration
    if (durationMs) {
      setTimeout(() => {
        this.denyList.delete(identifier);
        logger.info('Removed from blacklist (auto-expire)', { identifier });
      }, durationMs);
    }
  }

  // AC6: Remove from blacklist
  removeFromBlacklist(identifier: string): void {
    this.denyList.delete(identifier);
    logger.info('Removed from blacklist', { identifier });
  }

  // AC7: Get analytics
  getAnalytics() {
    const stats = {
      totalTracked: this.requests.size,
      whitelisted: this.allowList.size,
      blacklisted: this.denyList.size,
      alerts: this.alerts.slice(-20), // Last 20 alerts
      topViolators: this.getTopViolators(10),
    };

    return stats;
  }

  // AC7: Get top violators
  private getTopViolators(limit: number = 10) {
    return Array.from(this.requests.entries())
      .map(([identifier, entry]) => ({
        identifier,
        count: entry.count,
        blocked: entry.blocked,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // AC9: Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [identifier, entry] of this.requests.entries()) {
      if (now >= entry.resetTime && entry.count === 0) {
        this.requests.delete(identifier);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Rate limit cleanup', { removed });
    }
  }

  // AC8: Get headers for response
  getHeaders(
    identifier: string,
    config: RateLimitConfig = {}
  ): Record<string, string> {
    const { allowed, remaining, resetTime } = this.isAllowed(identifier, config);
    const maxRequests = config.maxRequests ?? this.DEFAULT_MAX_REQUESTS;

    return {
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime),
      'Retry-After': allowed ? '' : String(Math.ceil((resetTime - Date.now()) / 1000)),
    };
  }

  // Reset specific identifier
  reset(identifier: string): void {
    this.requests.delete(identifier);
    logger.debug('Rate limit reset', { identifier });
  }

  // Clear all
  clear(): void {
    this.requests.clear();
    this.denyList.clear();
    this.allowList.clear();
    this.alerts = [];
    logger.info('Rate limit manager cleared');
  }
}

export const rateLimitManager = new RateLimitManager();
