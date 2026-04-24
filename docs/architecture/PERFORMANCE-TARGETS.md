# Performance Targets & Monitoring Strategy
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Ready for Implementation  
**Target Audience**: @dev, @qa, @devops

---

## Executive Summary

Performance targets for Ctrl Alt News Portal MVP, covering API response times, frontend metrics, database performance, and infrastructure.

**Primary Goal**: Provide a fast, snappy experience for readers (< 2.5s LCP) and editors (< 100ms API responses).

---

## 1. API Performance Targets

### Endpoint Response Times (p95 latency)

| Endpoint | Target | Notes |
|----------|--------|-------|
| `GET /articles` (list) | < 150ms | Simple list, no heavy joins |
| `GET /articles/:id` | < 100ms | Single article, cached |
| `POST /articles` (admin) | < 500ms | Heavy write, includes validations |
| `GET /articles/:id/comments` | < 200ms | Includes pagination |
| `POST /articles/:id/comments` | < 300ms | Insert + notification |
| `GET /search?q=...` | < 300ms | Full-text search, can be slower |
| `GET /categories` | < 50ms | Cached (24h) |
| `GET /users/me` | < 100ms | Cached (2h) |
| `POST /auth/login` | < 200ms | Includes password verify |
| `POST /auth/register` | < 300ms | Hash + DB insert |

### Database Query Targets

| Query Type | Target | Optimization |
|-----------|--------|--------------|
| Index lookups (email, ID) | < 10ms | Add indexes |
| FK joins (author, category) | < 30ms | Index on FK columns |
| Pagination (OFFSET LIMIT) | < 50ms | Indexed sort column |
| Full-text search | < 150ms | GIN index on tsvector |
| Aggregations (count, sum) | < 100ms | Denormalize where possible |

### Throughput Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **Concurrent users** | 100 (MVP) | 10K MAU typical usage pattern |
| **Requests per second** | 50 RPS | 100 RPS peak capacity |
| **Concurrent connections** | 200 | Database connection pool size |

---

## 2. Frontend Performance (Web Vitals)

### Core Web Vitals

| Metric | Target | Success Criteria |
|--------|--------|-----------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Good user experience |
| **FID** (First Input Delay) | < 100ms | Responsive UI |
| **CLS** (Cumulative Layout Shift) | < 0.1 | No unexpected shifts |

### Lighthouse Scores

| Category | Target |
|----------|--------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

### Time to First Byte (TTFB)

| Page | Target |
|------|--------|
| Home page | < 800ms |
| Article detail | < 600ms |
| Category page | < 700ms |
| Search results | < 1000ms |

### Bundle Sizes

| Asset | Target |
|-------|--------|
| Main JS bundle | < 300KB (gzipped) |
| CSS (all) | < 50KB (gzipped) |
| Images (per page) | < 500KB total |
| Total initial load | < 1MB |

---

## 3. Database Performance

### Query Execution Plans

All production queries must have execution plans verified:

```sql
-- Check query plan
EXPLAIN ANALYZE SELECT * FROM articles WHERE categoryId = 'cat_123' ORDER BY publishedAt DESC LIMIT 20;

-- Expected: Index Scan (not Sequential Scan)
-- Index Cond: (categoryId = 'cat_123')
-- Sort Method: Top-N heapsort (if sorting needed)
```

### Index Strategy

```sql
-- Essential indexes for fast queries
CREATE INDEX idx_articles_categoryId ON articles(categoryId);
CREATE INDEX idx_articles_authorId ON articles(authorId);
CREATE INDEX idx_articles_publishedAt ON articles(publishedAt DESC);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_slug ON articles(slug);

CREATE INDEX idx_comments_articleId ON comments(articleId);
CREATE INDEX idx_comments_authorId ON comments(authorId);
CREATE INDEX idx_comments_parentId ON comments(parentId);

CREATE INDEX idx_reactions_articleId ON reactions(articleId);
CREATE INDEX idx_reactions_userId ON reactions(userId);

CREATE INDEX idx_bookmarks_userId ON bookmarks(userId);
CREATE INDEX idx_bookmarks_articleId ON bookmarks(articleId);

CREATE INDEX idx_page_views_articleId ON page_views(articleId);
CREATE INDEX idx_page_views_createdAt ON page_views(createdAt DESC);

-- Full-text search index
CREATE INDEX idx_article_search ON article_search_index USING GIN(searchVector);
```

### N+1 Query Prevention

**Problem**: Loading articles with authors causes N+1 queries:
```typescript
// SLOW: N+1 queries
const articles = await prisma.article.findMany();
articles.forEach(a => {
  const author = await prisma.user.findUnique({ where: { id: a.authorId } });
  // Database hit for each article!
});

// FAST: Single query with join
const articles = await prisma.article.findMany({
  include: { author: true }  // Loads author in same query
});
```

**Enforcement**: Require `include` or `select` in all queries.

### Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Add connection pool settings
// DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public&connection_limit=20
```

---

## 4. Infrastructure Performance

### Server Resource Targets

| Resource | Target | Monitoring |
|----------|--------|-----------|
| **CPU** | < 60% avg, < 80% peak | CloudWatch, Datadog |
| **Memory** | < 512MB (Node.js) | Monitor process heap |
| **Disk I/O** | < 50% utilization | Monitor query slow log |
| **Network** | < 80% bandwidth | Monitor data transfer |

### Caching Efficiency (Post-Sprint 4)

| Cache Layer | Target Hit Rate |
|-------------|-----------------|
| Redis (article cache) | > 70% |
| Redis (category cache) | > 95% |
| Browser cache (static) | > 80% |
| CDN (images, CSS, JS) | > 90% |

### Deployment Performance

| Metric | Target |
|--------|--------|
| Deploy time | < 5 minutes |
| Zero-downtime | Yes (blue-green) |
| Rollback time | < 2 minutes |
| Database migration | < 1 minute |

---

## 5. Monitoring & Observability

### Application Performance Monitoring (APM)

Implement **Sentry** for error tracking + **Optional: New Relic/DataDog** for APM:

```typescript
// server/index.ts
import * as Sentry from "@sentry/node";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
  
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

### Custom Metrics Logging

```typescript
// server/lib/metrics.ts
import winston from 'winston';

const metricsLogger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/metrics.log' })
  ]
});

// Log request metrics
export function logRequestMetrics(req: Request, res: Response, duration: number) {
  metricsLogger.info('Request completed', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    durationMs: duration,
    userAgent: req.headers['user-agent']
  });
}

// Usage in middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequestMetrics(req, res, duration);
  });
  next();
});
```

### Health Check Endpoint

```typescript
// GET /health
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      redis: 'unknown'
    }
  };
  
  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'ok';
  } catch (err) {
    health.checks.database = 'error';
    health.status = 'degraded';
  }
  
  // Check Redis (if implemented)
  try {
    await redis.ping();
    health.checks.redis = 'ok';
  } catch (err) {
    health.checks.redis = 'unavailable';
    // Redis is optional, not critical
  }
  
  res.json(health);
});
```

### Slowlog Monitoring

```sql
-- Monitor slow queries (> 500ms)
SELECT query, mean_time, stddev_time, min_time, max_time, calls
FROM pg_stat_statements
WHERE mean_time > 500
ORDER BY mean_time DESC
LIMIT 20;

-- Identify missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'articles'
ORDER BY abs(correlation) DESC;
```

---

## 6. Load Testing Strategy

### Test Scenarios

**Scenario 1: Normal Load**
- 50 concurrent users
- Mix: 70% reads, 20% comments, 10% article creation
- Duration: 5 minutes
- Expected: All endpoints < target latency

**Scenario 2: Peak Load**
- 100 concurrent users
- Same mix
- Duration: 10 minutes
- Expected: p99 latency < 2x target

**Scenario 3: Spike Test**
- 10 → 200 concurrent in 30 seconds
- Duration: 5 minutes
- Expected: Graceful degradation, no crashes

**Scenario 4: Search Load**
- 50 concurrent full-text searches
- Duration: 3 minutes
- Expected: p95 < 300ms

### Tools

```bash
# Install k6 (lightweight load testing)
npm install -g k6

# Run load test
k6 run load-test.js

# Apache Bench (simple)
ab -n 1000 -c 50 http://localhost:3000/api/v1/articles

# Wrk (fast, scriptable)
wrk -t4 -c50 -d30s http://localhost:3000/api/v1/articles
```

### k6 Load Test Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '3m', target: 50 },   // Stay at 50
    { duration: '1m', target: 100 },  // Spike to 100
    { duration: '2m', target: 100 },  // Stay at 100
    { duration: '1m', target: 0 },    // Ramp down
  ],
};

export default function() {
  // Test article listing
  const listRes = http.get('http://localhost:3000/api/v1/articles');
  check(listRes, {
    'list status 200': (r) => r.status === 200,
    'list response < 150ms': (r) => r.timings.duration < 150,
  });

  sleep(1);

  // Test article detail
  const detailRes = http.get('http://localhost:3000/api/v1/articles/cart_123abc');
  check(detailRes, {
    'detail status 200': (r) => r.status === 200,
    'detail response < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}
```

---

## 7. Performance Optimization Checklist

### Sprint 1-3 (MVP)

- [ ] All database queries have execution plans verified
- [ ] No N+1 queries (use Prisma `include`)
- [ ] Essential indexes created
- [ ] API response times < targets
- [ ] Frontend bundle size < 300KB gzipped
- [ ] Images optimized (WebP, lazy load)
- [ ] Code splitting implemented (routes)
- [ ] CSS minified and critical path inlined

### Sprint 4 (Performance)

- [ ] Redis cache implemented
- [ ] Cache hit rates > 70%
- [ ] API responses < 50ms p95 (with cache)
- [ ] Load testing shows 100 RPS capacity
- [ ] Monitoring dashboards live (Sentry, APM)
- [ ] Slowlog queries identified and optimized

### Q3 2026 (Scale)

- [ ] CDN configured for static assets
- [ ] Database query optimization complete
- [ ] Connection pooling tuned
- [ ] Auto-scaling configured
- [ ] Performance budget enforced in CI/CD

---

## 8. Performance Degradation Plan

If performance targets not met:

**1. Identify bottleneck** (database, API, frontend, network)
```bash
# Check database query time
EXPLAIN ANALYZE SELECT ...;

# Check API response time
time curl http://localhost:3000/api/v1/articles

# Check frontend metrics
lighthouse http://localhost:3000
```

**2. Optimize in priority order**:
1. Add missing indexes (quick win)
2. Implement caching (medium effort)
3. Denormalize data (moderate effort)
4. Refactor queries (high effort)
5. Scale horizontally (last resort)

**3. Re-test**:
```bash
k6 run load-test.js --summary-export=results.json
```

---

## Deployment Validation

Before each production release:

```bash
# 1. Run performance tests
npm run test:performance

# 2. Check bundle size
npm run analyze-bundle

# 3. Lighthouse audit
npm run lighthouse

# 4. Load test
k6 run load-test.js

# 5. Monitor after deploy (5 min)
# - Check error rate (< 0.1%)
# - Check latency (p95 < target)
# - Check CPU/memory (< limits)
```

---

**Document Version**: 1.0  
**Ready for**: Sprint 1+ (Ongoing monitoring)  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
