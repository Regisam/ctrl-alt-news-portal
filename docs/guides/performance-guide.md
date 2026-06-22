# Performance Optimization & Caching Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

Optimize response times and reduce server load through HTTP caching, response compression, and in-memory caching.

## Features Implemented

- **AC1**: HTTP caching headers (Cache-Control, ETag, Last-Modified)
- **AC2**: Response compression (gzip/brotli via express-compression)
- **AC3**: In-memory response caching (5-minute default TTL)
- **AC4**: Cache invalidation by pattern
- **AC5**: Cache hit rate tracking
- **AC9**: Performance metrics dashboard
- **AC10**: Caching strategy documentation

## Caching Strategy

### Static Assets (Images, CSS, JS, Fonts)
```
Cache-Control: public, max-age=31536000, immutable
TTL: 1 year
When: Build-time versioned assets
```

Versioned assets (hash in filename) are immutable and cached forever.

### API Endpoints (GET requests)
```
Cache-Control: public, max-age=300
TTL: 5 minutes
When: GET requests to /api/*
Invalidated: On POST/PUT/DELETE
```

API responses cached for 5 minutes, invalidated on mutations.

### HTML Pages
```
Cache-Control: public, max-age=0, must-revalidate
TTL: None (always check)
When: /index.html, / route
```

HTML never cached—always validate with ETag (304 Not Modified).

## ETag Support

**How it works:**
1. Server generates MD5 hash of response
2. Client receives `ETag: "abc123"`
3. Client sends `If-None-Match: "abc123"`
4. Server responds with `304 Not Modified` (no body sent)

**Saves bandwidth:** Full response not sent if unchanged.

## Cache Invalidation

### Manual Invalidation
```bash
POST /api/performance/cache/invalidate
{
  "pattern": "/api/articles/*"
}
```

### Clear All
```bash
POST /api/performance/cache/clear
```

### Automatic Invalidation
Cache entries expire after TTL (default 5 minutes).

## Performance Metrics

### View Cache Stats
```bash
GET /api/performance/metrics
```

Response:
```json
{
  "cache": {
    "entries": 42,
    "hits": 156,
    "misses": 12,
    "hitRate": 92.8,
    "sizeKB": 512
  }
}
```

### Target Response Times
- **p95**: < 200ms
- **p99**: < 500ms

Check via `/api/performance/metrics`.

## Compression

Responses automatically compressed with:
- **gzip** (default)
- **brotli** (for supported browsers)

**Threshold:** Responses > 1KB compressed

**Bypass:** Include `X-No-Compression` header

## Best Practices

1. **Static assets:** Serve with max-age=31536000 (versioned)
2. **API responses:** Cache GET, invalidate on POST/PUT/DELETE
3. **HTML:** Never cache (always validate with ETag)
4. **Monitor:** Check cache hit rate via `/api/performance/metrics`
5. **Tune TTL:** Adjust based on data freshness requirements
6. **Vary header:** Different Accept-Encoding requires separate cache entries

## Configuration

**Default TTL:** 5 minutes (300,000ms)
**Max cache size:** 100 entries
**Auto-cleanup:** Every 1 minute
**Eviction policy:** LRU (least recently used) when full

## Troubleshooting

### Cache not working?

Check if hitting static asset rules:
```bash
curl -I https://example.com/api/articles
# Should show: Cache-Control: public, max-age=300
```

### Stale data?

Data older than TTL is automatically removed. To force fresh:
```bash
POST /api/performance/cache/invalidate
{ "pattern": "*" }
```

### High memory usage?

Cache limited to 100 entries. Each ~1KB.
Max: ~100KB in-memory cache.

---

**See also**: docs/guides/monitoring-guide.md
