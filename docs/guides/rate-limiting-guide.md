# API Rate Limiting & DDoS Protection Guide

## Overview

Protect API from abuse and DDoS attacks using intelligent rate limiting.

## Rate Limit Tiers

### 1. Strict (Auth Endpoints)
- **Rate**: 5-10 requests per window
- **Window**: 1 hour for registration, 15 min for login
- **Use**: POST /auth/register, POST /auth/login

### 2. Moderate (User Actions)
- **Rate**: 30-60 requests per minute
- **Window**: 1 minute
- **Use**: POST /comments, POST /articles

### 3. Default (API)
- **Rate**: 100 requests per minute
- **Window**: 1 minute
- **Use**: Most API endpoints

### 4. Public (Read-Only)
- **Rate**: 300 requests per minute
- **Window**: 1 minute
- **Use**: GET /articles, GET /search

## Configuration

### Per-Endpoint Rate Limiting

```typescript
import { endpointRateLimiters } from '../middleware/advancedRateLimiter';

// Apply to specific routes
app.post('/api/auth/register', endpointRateLimiters.register, registerHandler);
app.post('/api/auth/login', endpointRateLimiters.login, loginHandler);
app.post('/api/comments', endpointRateLimiters.postComment, postCommentHandler);
app.get('/api/articles', endpointRateLimiters.getArticles, getArticlesHandler);
```

### Custom Configuration

```typescript
import { createRateLimiter } from '../middleware/advancedRateLimiter';

// Create custom limiter
const customLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 50,
});

app.post('/api/custom-endpoint', customLimiter, handler);
```

## Response Headers

All rate-limited endpoints return:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1687000000
Retry-After: 60
```

## Error Response (429)

When rate limit exceeded:

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please retry after 60 seconds.",
  "statusCode": 429,
  "retryAfter": 60
}
```

## DDoS Detection

### Automatic Detection

- Monitors requests per IP
- Triggers alert at 200+ requests/minute
- Auto-blocks high-anomaly IPs (>80% score)
- 5-minute auto-block duration

### Anomaly Score

```
score = (requestCount / threshold) * 100
- score < 50: Normal traffic
- score 50-80: Suspicious
- score > 80: Likely DDoS, auto-block
```

## IP Management

### Whitelist (Bypass Rate Limits)

```bash
# Add to whitelist
POST /api/rate-limit/whitelist/192.168.1.100

# Remove from whitelist
DELETE /api/rate-limit/whitelist/192.168.1.100
```

**Whitelisted IPs:**
- Internal services
- Load balancers
- Monitoring systems
- Trusted partners

### Blacklist (Block Completely)

```bash
# Add to blacklist (permanent)
POST /api/rate-limit/blacklist/203.0.113.45

# Add to blacklist (temporary, 1 hour)
POST /api/rate-limit/blacklist/203.0.113.45
Content-Type: application/json

{ "durationMs": 3600000 }

# Remove from blacklist
DELETE /api/rate-limit/blacklist/203.0.113.45
```

## Analytics & Monitoring

### View Rate Limit Analytics

```bash
GET /api/rate-limit/analytics
```

**Response:**
```json
{
  "totalTracked": 1234,
  "whitelisted": 5,
  "blacklisted": 3,
  "alerts": [
    {
      "ip": "203.0.113.45",
      "timestamp": "2026-06-25T10:30:00Z",
      "requestCount": 250,
      "anomalyScore": 85
    }
  ],
  "topViolators": [
    {
      "identifier": "203.0.113.45",
      "count": 250,
      "blocked": true
    }
  ]
}
```

## Client Implementation

### JavaScript/Fetch

```javascript
async function apiCall() {
  const response = await fetch('/api/articles');

  // Check rate limit headers
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');

  console.log(`Requests remaining: ${remaining}/${limit}`);

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After'));
    console.log(`Rate limited. Retry after ${retryAfter}s`);
    
    // Implement exponential backoff
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return apiCall(); // Retry
  }

  return response.json();
}
```

### Exponential Backoff

```javascript
async function callWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Retry in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}
```

## Best Practices

1. **Handle 429 Responses**: Implement retry logic with backoff
2. **Monitor Headers**: Track X-RateLimit-* headers
3. **Cache Results**: Reduce redundant requests
4. **Batch Requests**: Combine multiple operations
5. **Use Webhooks**: For real-time updates instead of polling
6. **Whitelist Services**: Internal services should be whitelisted
7. **Implement Backoff**: Exponential backoff for retries

## Troubleshooting

### Too Many Requests Errors

1. Check rate limit headers
2. Implement exponential backoff
3. Batch requests if possible
4. Request to be whitelisted if legitimate service

### False Positives

1. Check if IP is whitelisted
2. Monitor anomaly score
3. Adjust thresholds if needed
4. Contact support

### DDoS Attacks

1. Check /api/rate-limit/analytics
2. Review topViolators list
3. Manually block suspicious IPs
4. Monitor auto-blocks

## Performance Impact

- **Memory**: ~1KB per tracked identifier
- **CPU**: O(1) lookups per request
- **Cleanup**: Automatic every 60 seconds
- **Max Tracked**: 10,000+ identifiers

