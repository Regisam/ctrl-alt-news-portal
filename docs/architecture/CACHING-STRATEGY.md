# Caching Strategy — Redis Implementation Plan
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Phase 4 (Performance Optimization)  
**Prerequisites**: Working PostgreSQL + API endpoints (Sprints 1-3)

---

## Overview

Caching strategy for Ctrl Alt News Portal using Redis. Designed to reduce database load, improve API response times, and handle peak traffic gracefully.

**Phase Approach**:
- **Sprint 1-3 (MVP)**: No Redis. Optimize PostgreSQL queries instead.
- **Sprint 4 (Performance)**: Add Redis for hot data.
- **Post-MVP**: Expand caching for realtime features.

---

## When to Implement

**Start Redis in Sprint 4 only if**:
- PostgreSQL queries exceed 100ms p95 on 50K MAU
- Database CPU consistently > 60%
- Load tests show < 100 RPS capacity

Otherwise, database queries with good indexes are sufficient for MVP.

---

## Caching Strategy

### 1. Article Cache

**What to cache**: Full article detail (title, content, author, category)

**Key**: `article:{id}`  
**TTL**: 1 hour (3600 seconds)  
**Size**: ~50KB per article  
**Invalidation**: On article update/publish

**Pattern**:
```typescript
export async function getArticleById(articleId: string) {
  const cacheKey = `article:${articleId}`;
  
  // Check Redis cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Cache miss: query database
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true } },
      category: true,
      tags: { include: { tag: true } }
    }
  });
  
  if (!article) return null;
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(article));
  
  return article;
}
```

### 2. Article List Cache (by Category)

**What to cache**: Paginated article lists per category

**Key**: `articles:category:{categoryId}:page:{page}`  
**TTL**: 30 minutes (1800 seconds)  
**Invalidation**: When article published in category

**Pattern**:
```typescript
export async function listArticlesByCategory(categoryId: string, page: number = 1, limit: number = 20) {
  const cacheKey = `articles:category:${categoryId}:page:${page}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const articles = await prisma.article.findMany({
    where: { categoryId, status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: { author: true, category: true }
  });
  
  const result = { articles, page, limit };
  
  // Cache for 30 minutes
  await redis.setex(cacheKey, 1800, JSON.stringify(result));
  
  return result;
}
```

### 3. Category List Cache

**What to cache**: All categories (static, rarely changes)

**Key**: `categories:list`  
**TTL**: 24 hours (86400 seconds)  
**Size**: ~2KB total  
**Invalidation**: Manual (admin updates category)

**Pattern**:
```typescript
export async function listCategories() {
  const cacheKey = 'categories:list';
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query database
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'asc' }
  });
  
  // Cache for 24 hours
  await redis.setex(cacheKey, 86400, JSON.stringify(categories));
  
  return categories;
}
```

### 4. Search Results Cache

**What to cache**: Full-text search results (expensive queries)

**Key**: `search:{query}:{categoryId}:{page}`  
**TTL**: 1 hour (3600 seconds)  
**Invalidation**: On new article publish

**Pattern**:
```typescript
export async function searchArticles(query: string, categoryId?: string, page: number = 1) {
  const cacheKey = `search:${query}:${categoryId || 'all'}:${page}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Execute search (expensive database query)
  const results = await prisma.$queryRaw`
    SELECT a.* FROM articles a
    JOIN article_search_index si ON a.id = si."articleId"
    WHERE si."searchVector" @@ plainto_tsquery('english', ${query})
    ${categoryId ? `AND a."categoryId" = ${categoryId}` : ''}
    AND a.status = 'PUBLISHED'
    AND a."deletedAt" IS NULL
    ORDER BY ts_rank(si."searchVector", plainto_tsquery('english', ${query})) DESC
    LIMIT ${20} OFFSET ${(page - 1) * 20}
  `;
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(results));
  
  return results;
}
```

### 5. User Profile Cache

**What to cache**: User bio, avatar, article count (changes infrequently)

**Key**: `user:{id}:profile`  
**TTL**: 2 hours (7200 seconds)  
**Invalidation**: On user profile update

**Pattern**:
```typescript
export async function getUserProfile(userId: string) {
  const cacheKey = `user:${userId}:profile`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { articles: true } }
    }
  });
  
  await redis.setex(cacheKey, 7200, JSON.stringify(user));
  return user;
}
```

### 6. Trending Articles Cache

**What to cache**: Top 10 trending articles (expensive aggregation)

**Key**: `trending:7d` (7-day trending)  
**TTL**: 2 hours (3600 seconds)  
**Invalidation**: Periodically (can be stale)

**Pattern**:
```typescript
export async function getTrendingArticles(days: 7) {
  const cacheKey = `trending:${days}d`;
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Expensive aggregation query
  const trending = await prisma.$queryRaw`
    SELECT a.id, a."titleEn", a.slug, COUNT(pv.id) as view_count
    FROM articles a
    LEFT JOIN page_views pv ON a.id = pv."articleId"
    WHERE a.status = 'PUBLISHED'
    AND a."deletedAt" IS NULL
    AND pv."createdAt" > NOW() - INTERVAL '${days} days'
    GROUP BY a.id
    ORDER BY view_count DESC
    LIMIT 10
  `;
  
  // Cache for 2 hours
  await redis.setex(cacheKey, 7200, JSON.stringify(trending));
  
  return trending;
}
```

---

## Cache Invalidation Strategy

### On Article Publish

```typescript
export async function publishArticle(articleId: string) {
  // Update article
  const article = await prisma.article.update({
    where: { id: articleId },
    data: { status: 'PUBLISHED', publishedAt: new Date() }
  });
  
  // Invalidate caches
  await redis.del(`article:${articleId}`); // Clear article cache
  await redis.del(`articles:category:${article.categoryId}:page:*`); // Clear all category pages
  await redis.del('trending:7d'); // Clear trending
  await redis.del('trending:30d');
  
  // Invalidate search cache for broad queries
  await redis.eval(`
    local keys = redis.call('keys', 'search:*')
    for i=1,#keys do
      redis.call('del', keys[i])
    end
  `, 0);
  
  return article;
}
```

### On Article Update

```typescript
export async function updateArticle(articleId: string, updates: any) {
  const article = await prisma.article.update({
    where: { id: articleId },
    data: updates
  });
  
  // Invalidate article and list caches
  await redis.del(`article:${articleId}`);
  await redis.del(`articles:category:${article.categoryId}:page:*`);
  
  return article;
}
```

### On Comment Created

```typescript
export async function createComment(articleId: string, data: any) {
  const comment = await prisma.comment.create({
    data: { ...data, articleId }
  });
  
  // Invalidate article cache (comment count changed)
  await redis.del(`article:${articleId}`);
  
  return comment;
}
```

### On User Profile Update

```typescript
export async function updateUserProfile(userId: string, updates: any) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: updates
  });
  
  // Invalidate user cache
  await redis.del(`user:${userId}:profile`);
  
  return user;
}
```

---

## Redis Keys Schema

### Naming Conventions

Use colons (`:`) to namespace keys hierarchically:

```
article:{id}                          # Full article detail
article:{id}:viewCount                # Just view count
articles:category:{catId}:page:{num}  # Category articles paginated
categories:list                        # All categories
search:{query}:{catId}:{page}         # Search results
trending:{days}d                      # Trending articles
user:{id}:profile                     # User profile
user:{id}:articles:page:{num}         # User's articles
session:{sessionId}                   # Session data (future)
```

### Key Management Utility

```typescript
// lib/cache.ts
export const CACHE_KEYS = {
  article: (id: string) => `article:${id}`,
  categoryArticles: (catId: string, page: number) => `articles:category:${catId}:page:${page}`,
  categoriesList: () => `categories:list`,
  search: (query: string, catId?: string, page: number = 1) => 
    `search:${query}:${catId || 'all'}:${page}`,
  trending: (days: number) => `trending:${days}d`,
  userProfile: (id: string) => `user:${id}:profile`,
};

// Batch invalidation
export async function invalidateArticleCache(articleId: string, categoryId: string) {
  const keys = [
    CACHE_KEYS.article(articleId),
    `articles:category:${categoryId}:page:*`,
    'trending:7d',
    'trending:30d',
  ];
  
  for (const key of keys) {
    if (key.includes('*')) {
      // Pattern delete
      const pattern = key;
      const matches = await redis.keys(pattern);
      if (matches.length > 0) {
        await redis.del(...matches);
      }
    } else {
      await redis.del(key);
    }
  }
}
```

---

## TTL Strategy

| Cache Type | TTL | Rationale |
|-----------|-----|-----------|
| Article detail | 1h | Content rarely changes |
| Category articles | 30m | Updates frequently |
| Categories | 24h | Static |
| Search results | 1h | Query results can be stale |
| User profile | 2h | Bio/avatar changes infrequently |
| Trending | 2h | Can be 2h old |
| Session | 7d | User login session |
| Comments count | 5m | Changes frequently |

---

## Memory Usage Estimate

Assuming 1000 articles, 100 users, peak caching:

```
Articles (1000 × 50KB):       50 MB
Category lists (20 × 2KB):    0.04 MB
User profiles (100 × 5KB):    0.5 MB
Search results (500 × 20KB):  10 MB
Trending (1 × 10KB):          0.01 MB
Sessions (100 × 1KB):         0.1 MB
──────────────────────────────────────
Total estimate:               ~60 MB

Free tier (128-256 MB Redis)  ✅ Comfortable
```

---

## Redis Setup

### Local Development

**Docker Compose**:
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

**Start**: `docker-compose up -d redis`

### Production (Railway)

1. Add Redis to Railway project (click "Add Service")
2. Copy `REDIS_URL` from Railway env
3. Add to `.env`: `REDIS_URL=redis://...`

### Node.js Client Setup

**Install**:
```bash
npm install redis
```

**Initialize**:
```typescript
// lib/redis.ts
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
  // Graceful fallback: continue without cache if Redis unavailable
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export async function initRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export default redis;
```

---

## Error Handling & Fallback

If Redis is unavailable, queries still work (hit database instead):

```typescript
export async function getArticleById(articleId: string) {
  try {
    const cacheKey = `article:${articleId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (redisError) {
    console.warn('Cache error, falling back to database:', redisError);
    // Fall through to database query
  }
  
  // Database fallback (always works)
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: true, category: true }
  });
  
  // Try to cache (no error if it fails)
  try {
    if (article) {
      await redis.setex(`article:${articleId}`, 3600, JSON.stringify(article));
    }
  } catch (err) {
    console.warn('Failed to cache, continuing:', err);
  }
  
  return article;
}
```

---

## Testing Cache

```typescript
// tests/cache.test.ts
import redis from '@/lib/redis';
import { getArticleById } from '@/api/articles';

describe('Article Caching', () => {
  beforeEach(async () => {
    await redis.flushDb(); // Clear cache before each test
  });

  it('should cache article on first call', async () => {
    const article = await getArticleById('article_1');
    expect(article).toBeDefined();
    
    // Check Redis
    const cached = await redis.get('article:article_1');
    expect(cached).toBeTruthy();
  });

  it('should return cached article on second call', async () => {
    const article1 = await getArticleById('article_1');
    const article2 = await getArticleById('article_1');
    
    // Both should be identical (same reference from cache)
    expect(article1).toEqual(article2);
  });

  it('should invalidate cache on article update', async () => {
    await getArticleById('article_1'); // Populate cache
    
    // Update article
    await updateArticle('article_1', { titleEn: 'Updated' });
    
    // Cache should be cleared
    const cached = await redis.get('article:article_1');
    expect(cached).toBeNull();
  });
});
```

---

## Monitoring

Track cache performance with these metrics:

```typescript
// lib/cache-metrics.ts
export const cacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit() {
    this.hits++;
  },
  
  recordMiss() {
    this.misses++;
  },
  
  getHitRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : (this.hits / total) * 100;
  },
  
  reset() {
    this.hits = 0;
    this.misses = 0;
  }
};

// In GET /admin/metrics endpoint
app.get('/admin/metrics', requireAdmin, (req, res) => {
  res.json({
    cache: {
      hitRate: `${cacheMetrics.getHitRate().toFixed(2)}%`,
      hits: cacheMetrics.hits,
      misses: cacheMetrics.misses
    }
  });
});
```

---

## Checklist for Sprint 4

- [ ] Redis added to Railway
- [ ] REDIS_URL configured in `.env`
- [ ] Redis client initialized and connected
- [ ] Caching patterns implemented for hot queries
- [ ] Cache invalidation on mutations
- [ ] Fallback to database if Redis unavailable
- [ ] Cache hit rates monitored (target: > 70%)
- [ ] Memory usage monitored (< 256 MB)
- [ ] Load tests show improvement (TTFB < 100ms)
- [ ] Documentation updated

---

**Document Version**: 1.0  
**Ready for**: Sprint 4 (Performance Optimization)  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
