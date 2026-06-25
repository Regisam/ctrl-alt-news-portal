# Performance Optimization Guide

## Overview

Best practices for optimizing database queries and API response times.

## Database Indices

### Created Indices

**User table:**
```sql
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_createdAt ON "User"("createdAt");
CREATE INDEX idx_user_updatedAt ON "User"("updatedAt");
```

**Article table:**
```sql
CREATE INDEX idx_article_authorId ON "Article"("authorId");
CREATE INDEX idx_article_category ON "Article"(category);
CREATE INDEX idx_article_publishedAt ON "Article"("publishedAt");
CREATE INDEX idx_article_published ON "Article"(published);
CREATE INDEX idx_article_authorId_published ON "Article"("authorId", published);
CREATE INDEX idx_article_category_publishedAt ON "Article"(category, "publishedAt");
```

**Comment table:**
```sql
CREATE INDEX idx_comment_articleId ON "Comment"("articleId");
CREATE INDEX idx_comment_userId ON "Comment"("userId");
CREATE INDEX idx_comment_parentId ON "Comment"("parentId");
```

**Other indices (auto-created):**
- Following: followerId, followeeId, (followerId, followeeId)
- Notification: userId, read, createdAt
- Reputation: userId, score

### Index Strategy

- **Equality filters**: First column
- **Range filters**: After equality columns
- **Sorting**: Last columns
- **Composite indices**: Most selective first

## Query Optimization

### Select Only Needed Fields

❌ Before:
```typescript
const user = await db.user.findUnique({ where: { id } });
```

✅ After:
```typescript
const user = await db.user.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    name: true,
    // exclude password, timestamps if not needed
  },
});
```

### Prevent N+1 Queries

❌ Before:
```typescript
const articles = await db.article.findMany();
for (const article of articles) {
  article.author = await db.user.findUnique({
    where: { id: article.authorId },
  });
}
```

✅ After:
```typescript
const articles = await db.article.findMany({
  include: {
    author: {
      select: { id: true, name: true, email: true },
    },
  },
});
```

## Caching Strategy

### Cache Manager Usage

```typescript
import { cacheManager } from '../lib/cacheManager';

// Cache with TTL and tags
cacheManager.set('articles:list:page-1', articles, {
  ttl: 300, // 5 minutes
  tags: ['articles', 'list'], // for invalidation
});

// Retrieve from cache
const cached = cacheManager.get('articles:list:page-1');

// Invalidate by tag (when article is updated)
cacheManager.invalidateByTag('articles');
```

### Cache Invalidation Rules

| Event | Tags to Invalidate |
|-------|-------------------|
| Article created | articles, lists |
| Article updated | articles, article:{id}, lists |
| Article deleted | articles, article:{id}, lists |
| Comment added | comments, article:{id} |
| User profile updated | user:{id}, profiles |

## Performance Monitoring

### Query Performance

```typescript
import { QueryOptimizer, performanceMetrics } from '../lib/queryOptimizer';

const { result, duration } = await QueryOptimizer.measureQuery(
  'fetch-articles',
  () => db.article.findMany()
);

performanceMetrics.recordMetric('fetch-articles', duration);
```

### View Metrics

```typescript
const stats = performanceMetrics.getStats('fetch-articles');
console.log(stats);
// {
//   count: 100,
//   min: 10.5,
//   max: 250.3,
//   avg: 45.2,
//   p50: 40,
//   p95: 120,
//   p99: 200
// }
```

## Connection Pooling

### Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool (max connections)
  // Adjust based on load
}
```

Default: 2 connections (dev) → 10+ (production)

## Pagination

### Efficient Pagination

```typescript
import { QueryOptimizer } from '../lib/queryOptimizer';

const allArticles = await db.article.findMany({
  orderBy: { publishedAt: 'desc' },
  take: 1000, // Limit fetch
});

const paginated = QueryOptimizer.paginate(allArticles, page, 20);
// {
//   items: [...20 items],
//   pagination: {
//     page: 1,
//     pageSize: 20,
//     total: 1000,
//     pages: 50,
//     hasMore: true
//   }
// }
```

### Cursor-based (Better for Large Data)

```typescript
const articles = await db.article.findMany({
  take: 20,
  skip: 0,
  cursor: { id: 'last-id' }, // Optional, for next page
  orderBy: { id: 'asc' },
});
```

## HTTP Caching

### Response Headers

```typescript
// Cache for 5 minutes
res.set('Cache-Control', 'public, max-age=300');

// Cache for 1 hour
res.set('Cache-Control', 'public, max-age=3600');

// Don't cache
res.set('Cache-Control', 'no-cache, no-store');

// Revalidate on every request
res.set('Cache-Control', 'public, max-age=0, must-revalidate');
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Page load | <200ms | >500ms |
| Article list | <100ms | >250ms |
| Single article | <50ms | >150ms |
| Search | <300ms | >1000ms |
| User profile | <75ms | >200ms |

## Monitoring Commands

```bash
# View cache stats
curl http://localhost:3000/api/cache/stats

# View performance metrics
curl http://localhost:3000/api/metrics/performance

# Database query analysis
EXPLAIN ANALYZE SELECT * FROM "Article" ...;

# Connection pool status
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

## Troubleshooting

### Slow Queries

1. Check indices: `\d table_name` in psql
2. Analyze plan: `EXPLAIN ANALYZE query`
3. Look for sequential scans (bad)
4. Add indices as needed

### High Memory Usage

1. Check cache size: `cacheManager.getStats()`
2. Reduce cache TTL
3. Implement LRU eviction
4. Monitor connection pool

### Lock Contention

1. Use shorter transactions
2. Avoid SELECT FOR UPDATE
3. Implement optimistic locking
4. Check long-running queries

## Best Practices

1. **Index first**: Create indices before queries get slow
2. **Cache wisely**: Cache heavy operations, not everything
3. **Monitor early**: Set up metrics before problems arise
4. **Test at scale**: Use production-like data volumes
5. **Profile regularly**: Use EXPLAIN ANALYZE
6. **Paginate always**: Never fetch unlimited rows

