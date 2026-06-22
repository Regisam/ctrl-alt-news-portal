# Rate Limiting & Throttling Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

Rate limiting protects the API from:
- Brute force attacks
- DoS (Denial of Service)
- Resource exhaustion
- Unfair usage

## Configuration

### Default Limits

```typescript
// 100 requests/minute per IP
default: { windowMs: 60s, maxRequests: 100 }

// 5 login attempts per 15 minutes
/api/auth/login: { windowMs: 15m, maxRequests: 5 }

// 30 searches per minute
/api/search: { windowMs: 60s, maxRequests: 30 }

// 50 article requests per minute
/api/articles: { windowMs: 60s, maxRequests: 50 }
```

## Features

- **AC1-6**: Per-user + per-IP limits
- **AC7**: Sliding window algorithm (accurate)
- **AC8**: Redis support (optional)
- **AC9**: Rate limit headers (X-RateLimit-*)
- **AC11**: Admin endpoints for management

## Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1687353045
Retry-After: 30
```

## Rate Limit Exceeded (429)

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 30,
  "rateLimitReset": "2026-06-22T10:30:45Z"
}
```

## Whitelisted Endpoints

These bypass rate limiting:
- `/api/health`
- `/api/status`
- `/api/version`
- `/metrics`
- `/api/monitoring`

## Admin Endpoints

### View Stats
```bash
GET /api/rate-limit/stats
```

### Check Client Limit
```bash
GET /api/rate-limit/check/:clientId
# clientId format: "user:123" or "ip:192.168.1.1"
```

### Reset One Client
```bash
POST /api/rate-limit/reset/:clientId
```

### Reset All
```bash
POST /api/rate-limit/reset-all
```

## Client Identification

- **Authenticated**: User ID (from token)
- **Anonymous**: IP address

## Algorithm

Sliding window: tracks requests across a time window, more accurate than fixed buckets.

## Best Practices

1. **Monitor limits**: Check `/api/rate-limit/stats`
2. **Adjust thresholds**: Edit ENDPOINT_LIMITS in middleware
3. **Test limits**: Use admin endpoints before deploying
4. **Log violations**: All 429s logged with client ID

## Troubleshooting

### Getting 429 too often?

1. Check your request rate: `GET /api/rate-limit/check/:clientId`
2. Wait for reset window to expire
3. Or reset manually (admin): `POST /api/rate-limit/reset/:clientId`

### Need higher limits?

1. If authenticated: higher quota by default
2. Contact ops to whitelist your IP (for services)
3. Adjust thresholds in config (if admin)

---

**See also**: docs/guides/monitoring-guide.md
