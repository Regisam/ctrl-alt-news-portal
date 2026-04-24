# Architecture Decision Log (ADL)
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Final  
**Format**: Architecture Decision Records (ADR)

---

## Overview

This document records all major architecture decisions made during Ctrl Alt News Portal MVP design. Each decision includes context, options considered, rationale, and consequences.

---

## ADR-001: Backend Framework Selection

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: CRITICAL

### Context

Needed a backend framework for REST API serving ~10K users. Options: Express.js, Fastify, NestJS.

### Decision

**Selected**: Express.js 4.18+ with TypeScript

### Options Considered

| Option | Pros | Cons | Score |
|--------|------|------|-------|
| **Express.js** | Mature, simple, huge ecosystem | Minimal structure (needs discipline) | 9/10 |
| **Fastify** | Fast (~2-3% faster), TypeScript-first | Smaller ecosystem, niche | 8/10 |
| **NestJS** | Full-featured, DI, microservices | Heavy, opinionated, slow dev | 6/10 |

### Rationale

Express.js offers the best balance of simplicity and maturity. The 2-3% performance difference with Fastify is negligible for a news portal (database queries will be bottleneck, not framework). NestJS adds unnecessary complexity for MVP.

### Consequences

- Team must maintain discipline (organize routes, middleware, services)
- TypeScript strict mode required (prevents runtime errors)
- Ecosystem is mature (every library exists)
- Easy to migrate to microservices later if needed

### Risks

- Requires experienced developers (can be messy in wrong hands)
- Mitigation: Code reviews enforce patterns

---

## ADR-002: Database Technology Selection

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: CRITICAL

### Context

News portal requires relational data (users → articles → comments). Options: PostgreSQL, MongoDB, SQLite, Supabase.

### Decision

**Selected**: PostgreSQL + Prisma ORM

### Options Considered

| Option | Pros | Cons | Score |
|--------|------|------|-------|
| **PostgreSQL + Prisma** | Relational, FTS support, type-safe migrations | Requires schema design | 9/10 |
| **MongoDB** | Flexible schema, fast writes | No joins, harder to query | 5/10 |
| **Supabase** | Managed PG + Auth + Realtime | Vendor lock-in, less control | 7/10 |
| **SQLite** | Zero setup, file-based | Doesn't scale to concurrent users | 3/10 |

### Rationale

PostgreSQL with Prisma provides:
- Full relational integrity (foreign keys, constraints)
- Native full-text search with GIN indexes
- Type-safe Prisma Client (prevents N+1 queries, runtime errors)
- Excellent migration tooling
- Proven at scale (millions of rows)

MongoDB's document model adds complexity without benefits for a structured blog platform.

### Consequences

- Schema must be designed upfront (good practice anyway)
- Migrations required for schema changes
- Prisma generates types automatically (excellent DX)
- Can easily migrate to Supabase later if needed

### Risks

- Schema complexity if over-designed
- Mitigation: Keep schema simple, normalize properly

---

## ADR-003: ORM Selection (Prisma vs TypeORM vs Sequelize)

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: HIGH

### Context

Need ORM for type-safe database queries. Options: Prisma, TypeORM, Sequelize.

### Decision

**Selected**: Prisma Client

### Rationale

Prisma is superior for:
- **Auto-generated types**: No manual type definitions
- **Migration tooling**: `prisma migrate dev` is seamless
- **Type safety**: `include`/`select` prevent N+1 queries
- **Developer experience**: Readable query syntax
- **Relation loading**: Built-in lazy loading prevention

TypeORM requires manual type definitions and external migration tools. Sequelize is older, less ergonomic.

### Consequences

- Prisma is opinionated (some developers dislike it)
- Must use Prisma client exclusively (no raw SQL)
- Schema is source of truth (code-first approach)

### Risks

- Vendor lock-in to Prisma (unlikely to change)
- Mitigation: Prisma has large community, actively maintained

---

## ADR-004: Authentication Strategy

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: CRITICAL

### Context

Need to authenticate users (email/password + Google OAuth) and protect endpoints. Options: JWT, sessions, OAuth-only.

### Decision

**Selected**: JWT tokens (15m access + 7d refresh) + Google OAuth 2.0

### Rationale

JWT provides:
- Stateless authentication (scales horizontally)
- Mobile-friendly (APIs expect Bearer tokens)
- Flexible TTL (short-lived access, long-lived refresh)
- No session storage needed

Split tokens approach:
- Access token: 15 minutes (stolen token useful only 15min)
- Refresh token: 7 days, httpOnly cookie (secure storage)
- Token refresh: Auto-retry failed requests

Google OAuth:
- Social login (users trust Google)
- Reduces password fatigue
- Integrates with existing infrastructure

### Consequences

- Must implement token refresh logic
- Client must handle token expiration gracefully
- Logout requires client-side cleanup (no server-side sessions)
- Old tokens remain valid until expiration (not revocable)

### Risks

- Token theft (mitigation: httpOnly cookies for refresh tokens)
- Token reuse attacks (mitigation: short TTL)
- See SECURITY-ARCHITECTURE.md for full mitigations

---

## ADR-005: Caching Strategy

**Status**: ✅ DECIDED (PHASED)  
**Date**: 2026-04-16  
**Severity**: MEDIUM

### Context

High-traffic content (articles, categories) needs caching. Options: In-memory, Redis, CDN.

### Decision

**Selected**: No caching for MVP. Redis in Sprint 4 if needed.

### Rationale

- PostgreSQL with proper indexes handles MVP load (< 100 concurrent users)
- Redis adds operational complexity (separate service, monitoring)
- Better to optimize database queries first (lower hanging fruit)
- Easy to add Redis later (application-layer caching)

Phased approach:
- **Sprints 1-3**: Optimize PostgreSQL (indexes, query planning)
- **Sprint 4**: Add Redis if load tests show need
- **Post-MVP**: Full caching strategy

### Consequences

- Higher database load initially (acceptable for MVP)
- Can scale to ~1K concurrent users with just PostgreSQL + indexes
- Easy to add Redis without code refactor

### Risks

- If database performance poor, can't add caching as quick fix
- Mitigation: Invest time in proper database indexing first

---

## ADR-006: Deployment Platform

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: CRITICAL

### Context

Need to deploy MVP (backend + database). Options: Railway, Render, Vercel, AWS.

### Decision

**Selected**: Railway.app for both staging and production

### Rationale

Railway provides:
- Integrated PostgreSQL (one-click add)
- GitHub integration (push → deploy)
- Zero DevOps knowledge required
- Transparent pricing (no surprise AWS bills)
- Auto-scaling available later

Staging on `staging` branch → auto-deploy  
Production on `main` branch → manual deploy (safety)

### Consequences

- Vendor lock-in to Railway (acceptable risk, easy migration)
- Limited advanced features (Kubernetes, custom networking)
- Pricing ~$5-20/month MVP tier

### Risks

- If Railway downtime, app unavailable
- Mitigation: Daily backups, can migrate to AWS in 2 days

### Future Migration Path

If scaling beyond Railway:
1. Export PostgreSQL dump
2. Migrate to AWS RDS
3. Containerize app (Docker, ECR)
4. Deploy to ECS or EKS
5. All code changes minimal

---

## ADR-007: Frontend Framework Confirmation

**Status**: ✅ DECIDED (Pre-existing)  
**Date**: 2026-04-16  
**Severity**: MEDIUM

### Context

Frontend already React 19 + Vite. Confirm this is correct for backend team.

### Decision

**Confirmed**: React 19 + Vite + React Query

### Rationale

Already implemented and excellent. No changes needed.

### Additions Recommended

- React Query for client-side caching (prevent redundant API calls)
- Zod for runtime validation (match backend schemas)
- Axios for HTTP client (interceptors for auth tokens)

---

## ADR-008: API Response Format Standard

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: MEDIUM

### Context

Need consistent JSON response format across all endpoints.

### Decision

**Selected**: Wrapped response format with standard error structure

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": [...]
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

### Rationale

- Consistent contract for frontend (easier parsing)
- Error codes enable i18n (translate error codes, not messages)
- Timestamps for debugging and client-side time sync
- `success` flag for simple boolean checks
- `details` array for validation errors (which field, what's wrong)

### Consequences

- All endpoints must follow this format
- Middleware ensures consistency
- Frontend knows exact structure to expect

---

## ADR-009: Database Migration Strategy

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: HIGH

### Context

How to handle schema changes without data loss or downtime?

### Decision

**Selected**: Prisma Migrate with version control

**Approach**:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name description`
3. Creates migration file in Git
4. On deploy, Railway runs `npx prisma migrate deploy`
5. All migrations are versioned, reversible, reproducible

### Rationale

- Migrations in Git = code review + audit trail
- Prisma handles SQL generation (less error-prone)
- Reversible if needed (create reverse migration)
- Zero-downtime (no data loss with proper migration strategy)

### Consequences

- Must plan migrations carefully (not reversible if data dependent)
- Cannot use ALTER TABLE directly (must use migrations)
- Database schema is version controlled

### Risks

- If migration breaks production, must create reverse migration
- Mitigation: Test all migrations in staging first

---

## ADR-010: Security Model

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: CRITICAL

### Context

How to secure API endpoints and protect user data?

### Decision

**Selected**: Role-based access control (RBAC) with JWT

**Roles**:
- USER: Read articles, comment
- AUTHOR: Create articles
- ADMIN: All operations

**Security Layers**:
1. HTTPS (enforced in production)
2. CORS (whitelist origins)
3. Rate limiting (5 logins/5min)
4. Input validation (Zod on all endpoints)
5. Password hashing (bcrypt cost 12)
6. JWT tokens (short-lived access, refresh rotation)
7. Resource ownership checks (can't edit others' comments)
8. Error messages sanitized (no internal details)

### Rationale

See SECURITY-ARCHITECTURE.md for complete details.

### Consequences

- Every endpoint must validate input and check authorization
- Password resets require email (not implemented in MVP, mark TODO)
- Token theft impacts security (mitigation: short TTL)

### Risks

- Complex security implementation = bugs
- Mitigation: Use libraries (bcrypt, jsonwebtoken, helmet.js)

---

## ADR-011: Performance Strategy

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: MEDIUM

### Context

What performance targets matter most?

### Decision

**Selected**: Optimize in priority order

1. **Database queries** (< 150ms p95): Most impact
2. **API responses** (< 150ms p95): User perception
3. **Frontend rendering** (LCP < 2.5s): Load time
4. **Caching** (Redis if needed): Fine-tuning
5. **Infrastructure** (scaling): Last resort

### Rationale

- Database is bottleneck for content-heavy site
- Proper indexing solves 80% of issues
- Caching is premature optimization (start simple)
- Infrastructure scaling is expensive (delay)

### Consequences

- Must index all foreign keys and sort columns
- Must test all queries with EXPLAIN ANALYZE
- No caching for MVP (keep it simple)
- Load test before production release

---

## ADR-012: Monitoring & Observability

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: MEDIUM

### Context

How to detect and debug production issues?

### Decision

**Selected**: Multi-layer monitoring

1. **Health checks** (`/health` endpoint): Liveness probe
2. **Sentry**: Error tracking + alerting
3. **Custom logging** (Winston): Structured logs
4. **Database logging** (PostgreSQL slow query log)
5. **APM** (optional, New Relic/DataDog): Later

### Rationale

- Health checks allow Railway to auto-restart unhealthy instances
- Sentry captures all exceptions (no blind spots)
- Structured logging enables root cause analysis
- Slow query log identifies DB bottlenecks

### Consequences

- Must initialize Sentry in production
- Errors automatically tracked and alerted
- Logs help with debugging
- Can add APM later if needed

---

## ADR-013: Testing Strategy

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: HIGH

### Context

How much testing is needed for MVP?

### Decision

**Selected**: Unit tests + integration tests, no E2E initially

**Testing Pyramid**:
```
       /\
      /  \    E2E (optional, post-MVP)
     /────\
    /      \  Integration (api routes + database)
   /────────\
  /          \ Unit (utils, validation)
 /────────────\
```

**Target**: 60%+ code coverage

### Rationale

- Unit tests fast (run in CI/CD every commit)
- Integration tests catch real issues (database, API)
- E2E tests slow (skip for MVP, do manually)
- 60% coverage = sweet spot (high enough, not perfectionism)

### Consequences

- Every API route tested
- Database queries tested with real database
- Must write tests as code is written (not after)

### Risks

- Insufficient testing = bugs in production
- Mitigation: QA gate (manual testing) before release

---

## ADR-014: Git Workflow

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: MEDIUM

### Context

How to manage branches and deployments?

### Decision

**Selected**: Git flow with staged deployments

**Branches**:
- `main`: Production code (stable)
- `staging`: Staging testing (auto-deploy)
- `feature/*`: Feature branches (develop here)

**Workflow**:
1. Create `feature/story-id` branch
2. Commit changes
3. Push to `feature/story-id`
4. Create PR (code review)
5. Merge to `staging` → auto-deploys
6. Test in staging for 24h
7. Merge to `main` → manual prod deploy
8. Delete feature branch

### Consequences

- No direct commits to main or staging
- All changes reviewed before merge
- Staging is pre-production testing ground
- Production deploys are deliberate, not automatic

---

## ADR-015: Documentation Standards

**Status**: ✅ DECIDED  
**Date**: 2026-04-16  
**Severity**: MEDIUM

### Context

How to document code and architecture?

### Decision

**Selected**: Architecture docs + inline comments only (no READMEs)

**What to document**:
- Architecture decisions (this file)
- API endpoints (API-SPECIFICATION.md)
- Database schema (DATABASE-SCHEMA.md)
- Complex functions (inline comments)

**What NOT to document**:
- Self-explanatory code (uses clear variable names)
- Simple functions (code is documentation)
- Change logs (git history is record)

### Rationale

- Over-documentation = maintenance burden
- Code should be self-documenting
- Architecture docs are reference (not tutorials)
- Comments only for "why", not "what"

### Consequences

- Code must be clean and readable
- Variable names must be descriptive
- No function-level comments for simple code

---

## 🔄 Decision Review Cycle

These decisions will be reviewed:
- After Sprint 1 (any early issues?)
- After Sprint 3 (major integration point)
- After production launch (lessons learned)
- Quarterly (evolving needs)

### How to Request Changes

If decision needs revisiting:
1. Document the problem (what's not working?)
2. Propose alternatives (how would you do it differently?)
3. Quantify impact (time saved? cost reduced? risk eliminated?)
4. Escalate to @architect (I'll make final call)

**Important**: Once implemented, don't change mid-sprint (costs more than following through).

---

## 📋 Architecture Decisions Status

| ADR | Title | Status | Impact |
|-----|-------|--------|--------|
| 001 | Backend Framework (Express) | ✅ DECIDED | Critical |
| 002 | Database (PostgreSQL) | ✅ DECIDED | Critical |
| 003 | ORM (Prisma) | ✅ DECIDED | High |
| 004 | Authentication (JWT) | ✅ DECIDED | Critical |
| 005 | Caching (Phased) | ✅ DECIDED | Medium |
| 006 | Deployment (Railway) | ✅ DECIDED | Critical |
| 007 | Frontend (React 19) | ✅ CONFIRMED | High |
| 008 | API Response Format | ✅ DECIDED | Medium |
| 009 | Migrations (Prisma) | ✅ DECIDED | High |
| 010 | Security Model (RBAC) | ✅ DECIDED | Critical |
| 011 | Performance Strategy | ✅ DECIDED | High |
| 012 | Monitoring (Multi-layer) | ✅ DECIDED | Medium |
| 013 | Testing (Unit + Integration) | ✅ DECIDED | High |
| 014 | Git Workflow | ✅ DECIDED | Medium |
| 015 | Documentation | ✅ DECIDED | Low |

**All decisions are LOCKED IN. No changes without explicit approval.**

---

**Document Version**: 1.0  
**Status**: FINAL - Ready for Implementation  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Next Review**: Post-Sprint 1 (2026-05-03)
