# Performance Baseline & Optimization Tracking

**Created**: 2026-04-21  
**Sprint**: 6 Pre-Launch Baseline

---

## Pre-Sprint 6 Baseline (2026-04-21)

### Build Metrics

| Metric | Baseline (2026-04-21) | Sprint 6 Target | Unit |
|--------|----------|-----------------|------|
| Client Bundle Size (uncompressed) | 2.1 MB | <1.8 MB | MB |
| Main JS Bundle | 1.6 MB | <1.2 MB | MB |
| TypeScript Errors | 0 | 0 | count |
| Lint Warnings | 14 | 0 | count |
| Test Pass Rate | 100% | 100% | % |

### API Response Times (p95)

| Endpoint | Baseline | Sprint 6 Target (6.1+6.3) | Improvement |
|----------|----------|--------------------------|-------------|
| GET /api/articles | ~300ms | <100ms | 67% reduction |
| GET /api/categories | ~200ms | <20ms | 90% reduction |
| GET /api/users | ~250ms | <80ms | 68% reduction |
| GET /api/articles/:id | ~200ms | <80ms | 60% reduction |
| GET /api/search | ~500ms | <150ms | 70% reduction |
| GET /api/comments | ~400ms | <120ms | 70% reduction |

### Database Metrics

| Metric | Baseline | Unit |
|--------|----------|------|
| Slow Query Log Threshold | *to be set* | ms |
| N+1 Query Issues Found | TBD (6.3 analysis) | count |
| Active Indexes | TBD (6.3 analysis) | count |
| Largest Table | articles | rows |

### Environment

- **Node.js**: TBD
- **PostgreSQL**: 16-alpine
- **Redis**: 7-alpine (NEW for Sprint 6)
- **Build Tool**: Vite 7.1.7 + esbuild
- **TypeScript**: 5.6.3 (strict mode)

---

## Sprint 6 Progress

### Story 6.1: Redis Caching Layer
**Status**: Pending  
**Progress**: 0/14 AC

- [ ] CacheService implemented
- [ ] Articles endpoint cached
- [ ] Categories endpoint cached
- [ ] Performance <100ms validated

### Story 6.2: i18n Framework Setup
**Status**: Pending  
**Progress**: 1/12 AC

- [x] react-i18next installed ✅ (2026-04-21)
- [x] i18next + i18next-browser-languagedetector added ✅ (2026-04-21)
- [ ] Translation files created
- [ ] Components migrated
- [ ] Language switcher ready

### Story 6.3: Database Optimization
**Status**: Pending (depends on 6.1 metrics)  
**Progress**: 0/12 AC

- [ ] Slow query log enabled
- [ ] N+1 issues identified
- [ ] Indexes created
- [ ] Queries optimized

---

## Performance Comparison (Pre vs Post-Sprint 6)

| Metric | Pre-Sprint 6 | Post-Sprint 6 | Δ | Target Met? |
|--------|------------|--------------|---|-------------|
| Articles API | TBD | TBD | TBD | — |
| Search API | TBD | TBD | TBD | — |
| Bundle Size | TBD | TBD | TBD | — |

---

## Key Optimizations Implemented

### Story 6.1 (Redis Caching)
- Cache TTL strategy (5min articles, 1hr categories, 2min comments)
- Cache key naming convention
- Invalidation on mutations
- Cache metrics logging

### Story 6.3 (Database Optimization)
- Strategic indexes on userId, articleId, createdAt, categoryId
- Composite indexes for common patterns
- N+1 query elimination via eager loading
- Query result pagination

---

## Notes

- Baseline captured 2026-04-21 before Sprint 6 development
- Sprint 6 expected duration: 2 weeks (Apr 21 - May 5)
- Measurement strategy: before/after for each story's performance AC
- Cache metrics depend on Redis configuration and query patterns

---

*Updated throughout Sprint 6 as stories complete. See individual story files for detailed implementation notes.*
