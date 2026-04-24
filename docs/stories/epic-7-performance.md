# EPIC 7: Performance Optimization & Deployment Pipeline

**Epic ID**: EPIC-7  
**Status**: Draft  
**Sprints**: 6-7 (70 hours)  
**Priority**: P1 (High)  
**Product Manager**: Morgan  
**DevOps Lead**: Gage (DevOps Expert)  
**Date Created**: 2026-04-16

---

## Epic Summary

Optimize API and frontend performance, implement caching strategy, and establish CI/CD pipeline for automated testing and deployment. Achieve production-ready performance metrics.

**Rationale**: Professional platform requires fast, reliable deployment. Performance directly impacts user experience and SEO (PRD section 2.8).

**Success Criteria**:
- [ ] API response time: <300ms p99, <100ms avg
- [ ] Frontend performance: LCP < 2.5s, CLS < 0.1
- [ ] Lighthouse score: >= 90 (performance, accessibility)
- [ ] CI/CD pipeline: automated tests, builds, deploys
- [ ] Zero-downtime deployments working
- [ ] Error tracking and monitoring in place
- [ ] Database query optimization: no N+1 queries

---

## Story 7.1: Caching Strategy (Redis Setup & Implementation)

**Status**: Ready  
**Sprint**: 6  
**Effort**: L (32 hours)  
**Owner**: @data-engineer (Dara)

### Description

Implement Redis caching layer for frequently accessed data: articles, categories, search results. Reduce database load and improve API response times.

**Reference**: Technical Strategy section 1.2 (Target state - Redis cache)

### Acceptance Criteria

- [ ] Redis server running locally (dev) and cloud (prod)
- [ ] Article cache: TTL 1 hour (invalidated on update)
- [ ] Category cache: TTL 24 hours (rarely changes)
- [ ] Search results cache: TTL 1 hour (user-dependent)
- [ ] Session cache: TTL 7 days (refresh tokens)
- [ ] Cache invalidation strategy implemented (on CRUD)
- [ ] Cache hit ratio: >= 80% for articles
- [ ] Cache misses logged (debug)
- [ ] Cache warm-up on startup (popular articles)
- [ ] API response time with cache: < 100ms avg

### Tasks

1. Install Redis client (`redis` or `ioredis`)
2. Setup Redis connection with error handling
3. Create cache service (`services/cacheService.ts`)
4. Implement article cache (GET by id, slug)
5. Implement category cache (GET all)
6. Implement cache invalidation on article update/delete
7. Implement search result cache (query-based)
8. Implement cache warm-up script
9. Add cache statistics endpoint (admin)
10. Test cache performance with load testing

### Dependencies

- **Blocked by**: Story 1.1 (server running)
- **Blocks**: Story 7.2

### Notes

- Use Redis for cache only (session storage is secondary)
- Cache keys: `article:{id}`, `category:all`, `search:{query_hash}`
- Invalidation: on article update/delete, parent relationships
- Cache warm-up: run on server startup, load top 100 articles
- Consider cache preloading strategy (Phase 2)

---

## Story 7.2: API Performance Optimization & Database Indexing

**Status**: Ready  
**Sprint**: 6-7  
**Effort**: M (16 hours)  
**Owner**: @data-engineer (Dara)

### Description

Optimize database queries, add missing indexes, and prevent N+1 query problems. Ensure all queries execute in <300ms.

**Reference**: PRD section 2.1 (Performance requirements), Technical Strategy section 1.2

### Acceptance Criteria

- [ ] All article queries < 300ms (p99)
- [ ] Index on articles.category_id, articles.author_id
- [ ] Index on comments.article_id, comments.author_id
- [ ] Index on articles.published_at (date filtering)
- [ ] Index on articles search (full-text tsvector)
- [ ] N+1 queries eliminated (use eager loading)
- [ ] Query plan reviewed (EXPLAIN ANALYZE)
- [ ] Slow query log analyzed and optimized
- [ ] Database connection pooling configured
- [ ] Query timeout: 10 seconds (prevent hangs)

### Tasks

1. Add missing indexes to schema (Prisma migration)
2. Review all queries with EXPLAIN ANALYZE
3. Identify N+1 queries in application code
4. Add eager loading with Prisma (`include`)
5. Optimize search query (full-text with ranking)
6. Setup database connection pool (`max_connections: 20`)
7. Add slow query logging
8. Create query optimization guide
9. Test with load (1000+ queries/sec)
10. Document performance benchmarks

### Dependencies

- **Blocked by**: Story 7.1 (caching ready)
- **Blocks**: None

### Notes

- Use Prisma `include` for eager loading
- Index cost: slower writes, faster reads (acceptable trade-off)
- Connection pool: 20 connections for dev, 50+ for prod
- Slow query threshold: 100ms (log and investigate)
- Monitor query performance with tools like pgAdmin

---

## Story 7.3: Frontend Code Splitting & Lazy Loading

**Status**: Ready  
**Sprint**: 7  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement code splitting to reduce initial bundle size. Lazy load routes and heavy components to improve page load performance.

**Reference**: Technical Strategy section 4.1 (Frontend optimization)

### Acceptance Criteria

- [ ] Routes code-split with React.lazy
- [ ] Admin dashboard lazy loaded (separate chunk)
- [ ] Search page lazy loaded
- [ ] Category pages lazy loaded
- [ ] Initial bundle size < 150KB (gzip)
- [ ] Admin bundle < 100KB (gzip)
- [ ] Lighthouse performance score >= 90
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FCP (First Contentful Paint) < 1.2s
- [ ] CLS (Cumulative Layout Shift) < 0.1

### Tasks

1. Implement route-level code splitting (React.lazy)
2. Add Suspense boundaries with loading states
3. Lazy load admin dashboard (separate chunk)
4. Lazy load heavy components (carousel, modals)
5. Analyze bundle with `webpack-bundle-analyzer`
6. Remove unused dependencies (audit with npm-check)
7. Optimize image loading (next-gen formats, WebP)
8. Implement image lazy loading (`loading="lazy"`)
9. Run Lighthouse audit and fix issues
10. Monitor bundle size in CI (max 150KB threshold)

### Dependencies

- **Blocked by**: Story 7.2 (API performance ready)
- **Blocks**: Story 7.4

### Notes

- Use React.lazy for route-level splitting
- Suspense: show loading spinner or skeleton UI
- Image optimization: use Vite's built-in image optimization
- Remove unused node_modules (pruning)
- Bundle analysis: use `webpack-bundle-analyzer` or Vite plugin
- Performance budget: enforce max bundle size in CI

---

## Story 7.4: CI/CD Pipeline (GitHub Actions & Deployment)

**Status**: Ready  
**Sprint**: 7  
**Effort**: L (32 hours)  
**Owner**: @devops (Gage)

### Description

Establish automated testing, building, and deployment pipeline using GitHub Actions. Deploy to staging and production with zero-downtime.

**Reference**: Technical Strategy section 3.4 (CI/CD), PRD section 2.8 (Deployment)

### Acceptance Criteria

- [ ] GitHub Actions workflow runs on push to main
- [ ] Workflow steps: lint, test, build, deploy
- [ ] Linting passes (ESLint, Prettier)
- [ ] Tests pass (unit + integration)
- [ ] Build succeeds (Vite + esbuild)
- [ ] Deployment to staging on PR merge
- [ ] Deployment to production on tag release
- [ ] Rollback capability (revert to previous version)
- [ ] Health checks after deployment
- [ ] Deployment notifications (Slack, email)

### Tasks

1. Create GitHub Actions workflow file (`.github/workflows/ci-cd.yml`)
2. Add lint step (ESLint on client/src)
3. Add test step (Jest or Vitest)
4. Add build step (Vite + esbuild)
5. Add staging deploy step (Railway or AWS)
6. Add production deploy step (manual or auto)
7. Implement health check after deploy
8. Setup deployment notifications (Slack)
9. Add rollback mechanism (previous version)
10. Document deployment process in README

### Dependencies

- **Blocked by**: Story 7.3 (frontend optimized)
- **Blocks**: None (complete)

### Notes

- Use environment variables for secrets (GitHub Secrets)
- Staging deploy: auto on PR merge
- Production deploy: manual trigger (safer)
- Health check: `/health` endpoint
- Rollback: keep last 3 versions, quick revert
- Consider canary deployments (Phase 2)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| API response time | <100ms avg, <300ms p99 | To measure |
| Cache hit ratio | >= 80% | To measure |
| Lighthouse score | >= 90 | To verify |
| LCP | < 2.5s | To measure |
| Bundle size | < 150KB (gzip) | To verify |
| Deployment time | < 5 minutes | To measure |

---

## Epic Dependencies & Timeline

```
Sprint 6:
├── Story 7.1 (Redis Caching) ────┐
├── Story 7.2 (DB Optimization) ──┤
└─────────────────────────────────┴──> Sprint 7 ready

Sprint 7:
├── Story 7.3 (Frontend Code Split) ──┐
│                                      ├──> Story 7.4 (CI/CD)
└──────────────────────────────────────┘
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Cache invalidation complexity | Data inconsistency | Implement careful invalidation logic, monitor cache |
| Database locking during migration | Downtime | Use zero-downtime migration strategy |
| Deployment failures | Broken production | Implement health checks, rollback |

---

## Appendix: Files to Create/Modify

**New Files**:
- `server/services/cacheService.ts`
- `.github/workflows/ci-cd.yml`
- `scripts/warm-cache.ts`
- `performance-budget.json`

**Modified Files**:
- `server/index.ts` (Redis connection)
- `package.json` (redis dependency, npm scripts)
- `prisma/schema.prisma` (indexes)

**New Dependencies**:
```json
{
  "ioredis": "^5.x",
  "webpack-bundle-analyzer": "^4.x"
}
```

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Gage (DevOps)
