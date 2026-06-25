import { Request, Response, NextFunction } from 'express';
import { rateLimitManager, RateLimitConfig } from '../lib/rateLimitManager.js';
import { logger } from '../logger.js';

// AC2: Extract IP from request (handle proxies)
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// AC1-2: User-based rate limiting middleware
export function createRateLimiter(config: RateLimitConfig = {}) {
  const defaultConfig: RateLimitConfig = {
    windowMs: config.windowMs ?? 60 * 1000, // 1 minute
    maxRequests: config.maxRequests ?? 100,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    // AC2: Get identifier (user ID or IP)
    const identifier = req.user?.userId || getClientIp(req);

    // AC1: Check rate limit
    const { allowed, remaining, resetTime } = rateLimitManager.isAllowed(
      identifier,
      defaultConfig
    );

    // AC8: Add rate limit headers
    const headers = rateLimitManager.getHeaders(identifier, defaultConfig);
    Object.entries(headers).forEach(([key, value]) => {
      if (value) res.set(key, value);
    });

    if (!allowed) {
      logger.warn('Rate limit exceeded', { identifier });

      // AC11: Clear error message
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Please retry after ${headers['Retry-After']} seconds.`,
        statusCode: 429,
        retryAfter: parseInt(headers['Retry-After'] || '60'),
      });
      return;
    }

    next();
  };
}

// AC1: Strict rate limiter for sensitive endpoints
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10, // 10 requests per minute
});

// AC1: Default rate limiter for API
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100, // 100 requests per minute
});

// AC1: Relaxed rate limiter for public endpoints
export const publicRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300, // 300 requests per minute
});

// AC10: Per-endpoint configuration
export const endpointRateLimiters = {
  // Auth endpoints - strict
  register: createRateLimiter({ windowMs: 3600000, maxRequests: 5 }), // 5 per hour
  login: createRateLimiter({ windowMs: 900000, maxRequests: 10 }), // 10 per 15 min
  logout: createRateLimiter({ windowMs: 60000, maxRequests: 50 }),

  // Search - moderate
  search: createRateLimiter({ windowMs: 60000, maxRequests: 60 }),

  // Comments - moderate
  postComment: createRateLimiter({ windowMs: 60000, maxRequests: 30 }),

  // Public read - relaxed
  getArticles: createRateLimiter({ windowMs: 60000, maxRequests: 300 }),
};

// AC6-7: Admin endpoint for rate limit management
export function rateLimitAdminRouter() {
  const express = require('express');
  const router = express.Router();

  // AC7: Get analytics
  router.get('/analytics', (_req: Request, res: Response) => {
    const analytics = rateLimitManager.getAnalytics();
    res.json({ success: true, data: analytics });
  });

  // AC6: Whitelist endpoint
  router.post('/whitelist/:identifier', (req: Request, res: Response) => {
    const { identifier } = req.params;
    rateLimitManager.whitelist(identifier);
    res.json({ success: true, message: `${identifier} added to whitelist` });
  });

  // AC6: Remove from whitelist
  router.delete('/whitelist/:identifier', (req: Request, res: Response) => {
    const { identifier } = req.params;
    rateLimitManager.removeWhitelist(identifier);
    res.json({ success: true, message: `${identifier} removed from whitelist` });
  });

  // AC6: Blacklist endpoint
  router.post('/blacklist/:identifier', (req: Request, res: Response) => {
    const { identifier } = req.params;
    const { durationMs } = req.body;
    rateLimitManager.addToBlacklist(identifier, durationMs);
    res.json({ success: true, message: `${identifier} added to blacklist` });
  });

  // AC6: Remove from blacklist
  router.delete('/blacklist/:identifier', (req: Request, res: Response) => {
    const { identifier } = req.params;
    rateLimitManager.removeFromBlacklist(identifier);
    res.json({ success: true, message: `${identifier} removed from blacklist` });
  });

  // AC1: Reset rate limit
  router.post('/reset/:identifier', (req: Request, res: Response) => {
    const { identifier } = req.params;
    rateLimitManager.reset(identifier);
    res.json({ success: true, message: `Rate limit reset for ${identifier}` });
  });

  return router;
}
