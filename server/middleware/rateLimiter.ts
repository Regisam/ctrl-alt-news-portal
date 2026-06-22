import { Request, Response, NextFunction } from 'express';
import { SlidingWindowStore, RateLimitConfig } from '../lib/rateLimitStore.js';
import { logger } from '../logger.js';

const store = new SlidingWindowStore();

// AC4: Whitelist endpoints that bypass rate limiting
const WHITELISTED_PATHS = [
  '/api/health',
  '/api/status',
  '/api/version',
  '/metrics',
  '/api/monitoring',
  '/favicon.ico',
];

// Default rate limit configs per endpoint
const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  // AC2: Configurable limits per endpoint
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 min (brute force protection)
  },
  '/api/search': {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 searches per minute
  },
  '/api/articles': {
    windowMs: 60 * 1000,
    maxRequests: 50, // 50 article requests per minute
  },
};

function getClientIdentifier(req: Request): string {
  // AC5: Per-user limits for authenticated users
  if (req.headers['x-user-id']) {
    return `user:${req.headers['x-user-id']}`;
  }

  // AC6: Per-IP limits for anonymous users
  return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
}

function isWhitelisted(path: string): boolean {
  return WHITELISTED_PATHS.some((whitelisted) => path.startsWith(whitelisted));
}

function getEndpointLimit(path: string): RateLimitConfig {
  // Find matching endpoint config
  for (const [endpoint, config] of Object.entries(ENDPOINT_LIMITS)) {
    if (path.startsWith(endpoint)) {
      return config;
    }
  }
  return ENDPOINT_LIMITS.default;
}

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  // AC4: Skip whitelisted endpoints
  if (isWhitelisted(req.path)) {
    return next();
  }

  const clientId = getClientIdentifier(req);
  const config = getEndpointLimit(req.path);

  // AC1: Check if client is limited
  const isLimited = store.isLimited(clientId, config);

  // AC9: Add rate limit headers to response
  const remaining = store.getRemainingRequests(clientId, config);
  const resetTime = store.getResetTime(clientId);

  res.set('X-RateLimit-Limit', config.maxRequests.toString());
  res.set('X-RateLimit-Remaining', Math.max(0, remaining).toString());
  res.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString()); // Unix timestamp

  if (isLimited) {
    // AC3: 429 (Too Many Requests) with Retry-After
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

    logger.warn('Rate limit exceeded', {
      clientId,
      path: req.path,
      retryAfter,
      config,
    });

    res.set('Retry-After', retryAfter.toString());
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
      rateLimitReset: new Date(resetTime).toISOString(),
    });
  }

  next();
}

export function getRateLimitStats() {
  return store.getStats();
}

export function resetRateLimit(clientId: string) {
  store.resetKey(clientId);
  logger.info('Rate limit reset', { clientId });
}

export function resetAllRateLimits() {
  store.resetAll();
  logger.info('All rate limits reset');
}

export function getRateLimitStore() {
  return store;
}
