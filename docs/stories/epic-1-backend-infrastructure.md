# EPIC 1: Backend Infrastructure & Database Foundation

**Epic ID**: EPIC-1  
**Status**: Draft  
**Sprints**: 1-2 (80 hours)  
**Priority**: P0 (Must-Have)  
**Product Manager**: Morgan  
**Technical Lead**: Aria (Architect)  
**Date Created**: 2026-04-16

---

## Epic Summary

Establish production-grade backend infrastructure with Express.js API server, PostgreSQL database, and Prisma ORM. This foundational epic enables all subsequent feature development by providing the core persistence layer, authentication readiness, and API structure.

**Rationale**: Current prototype has zero backend—all data is hardcoded client-side. This epic creates the backend foundation required for Epics 2-8.

**Success Criteria**:
- [ ] Express.js server with TypeScript configuration
- [ ] PostgreSQL database with 10+ tables (users, articles, comments, etc.)
- [ ] Prisma ORM schema and migrations
- [ ] Database queries execute in <300ms (indexed)
- [ ] Error handling middleware + structured logging
- [ ] Zero TypeScript errors
- [ ] All migration scripts working

---

## Story 1.1: Setup Express.js Server & TypeScript Configuration

**Status**: Ready  
**Sprint**: 1  
**Effort**: S (8 hours)  
**Owner**: @dev (Dex)

### Description

Configure production-ready Express.js server with TypeScript, middleware stack, environment handling, and development tooling. This establishes the API server foundation upon which all backend endpoints will be built.

**Reference**: Technical Strategy section 2.1 (Backend API Framework)

### Acceptance Criteria

- [ ] Express.js server running on `http://localhost:3000` (dev) and PORT env (prod)
- [ ] TypeScript compilation with strict mode enabled
- [ ] Environment variables configured (`.env`, `.env.example`)
- [ ] Middleware stack: CORS, JSON parser, error handling, logging
- [ ] Health check endpoint: `GET /health` returns `{ status: "ok" }`
- [ ] Request/response logging with timestamps and IDs
- [ ] Graceful shutdown handling
- [ ] npm scripts: `npm run dev` (ts-node), `npm run build`, `npm start`

### Tasks

1. Initialize Express.js with TypeScript (`express`, `@types/express`)
2. Setup environment configuration (`dotenv`, `zod` for validation)
3. Configure CORS middleware with allowed origins
4. Implement structured logging (Winston or Pino)
5. Add error handling middleware with 404/500 responses
6. Create health check and status endpoints
7. Setup npm scripts for dev/build/start
8. Test server startup and routing

### Dependencies

- **Blocked by**: None (first story)
- **Blocks**: Stories 1.2, 1.3, 1.4, 2.1

### Notes

- Use `express` (v4.18+) for stability
- Consider `tsx` or `ts-node-dev` for hot reload
- Logging should include request IDs for tracing
- CORS should be restrictive for security (allow `localhost:3000` in dev)

---

## Story 1.2: PostgreSQL Schema Design & Prisma Setup

**Status**: Ready  
**Sprint**: 1-2  
**Effort**: L (32 hours)  
**Owner**: @data-engineer (Dara)

### Description

Design comprehensive PostgreSQL schema covering users, articles, categories, comments, reactions, and bookmarks. Implement Prisma ORM with schema validation, indexes for performance, and migration strategy.

**Reference**: Technical Strategy section 1.2 (Target State architecture), PRD section 2.2 (Database schema)

### Acceptance Criteria

- [ ] PostgreSQL running locally or Docker
- [ ] Prisma schema (`schema.prisma`) with 10+ models
- [ ] All models have proper relationships (1-to-many, many-to-many)
- [ ] Indexes on frequently queried columns (articles.slug, users.email, comments.article_id)
- [ ] Soft deletes implemented (deletedAt timestamps)
- [ ] Timestamps (createdAt, updatedAt) on all tables
- [ ] Foreign key constraints with CASCADE/RESTRICT
- [ ] Role enum (ADMIN, EDITOR, USER) with constraints
- [ ] First migration created and reversible

### Tasks

1. Design ER diagram for 10+ tables (users, articles, categories, comments, reactions, bookmarks, etc.)
2. Initialize Prisma (`npm install @prisma/client prisma`)
3. Create `schema.prisma` with all models and relationships
4. Add indexes for performance-critical queries
5. Implement role-based access control (ADMIN, EDITOR, USER)
6. Create migration for schema creation
7. Seed database with sample data (5 users, 20 articles, 40 comments)
8. Test Prisma client with sample queries

### Dependencies

- **Blocked by**: Story 1.1 (server running)
- **Blocks**: Stories 1.3, 1.4, 2.2, 3.1, 4.1, 5.1

### Notes

- Use Prisma for ORM (better than raw SQL for type safety)
- Soft deletes: add `deletedAt DateTime?` to articles, comments, users
- Full-text search: PostgreSQL native (`tsvector`, `tsquery`)
- Consider denormalization for view counts (articles.viewCount)

### Schema Outline

```
Users
├── id (UUID primary)
├── email (unique)
├── name
├── password (hashed)
├── googleId (OAuth)
├── role (ADMIN, EDITOR, USER)
├── bio
├── avatar_url
├── createdAt, updatedAt

Articles
├── id (UUID primary)
├── slug (unique, for SEO)
├── title
├── content (markdown)
├── excerpt
├── authorId (FK → Users)
├── categoryId (FK → Categories)
├── status (DRAFT, PUBLISHED, ARCHIVED)
├── viewCount
├── publishedAt
├── deletedAt (soft delete)
├── createdAt, updatedAt

Categories
├── id (UUID)
├── name (AI, Science, Robotics, Gadgets)
├── slug (unique)
├── color (neon hex: #06B6D4, etc.)

Comments
├── id (UUID)
├── articleId (FK → Articles)
├── authorId (FK → Users)
├── parentId (FK → Comments, nullable, for threading)
├── content
├── status (PENDING, APPROVED, REJECTED)
├── deletedAt
├── createdAt, updatedAt

Reactions
├── id
├── articleId (FK → Articles)
├── userId (FK → Users)
├── type (LIKE, CLAP)
├── count (default 1)
├── unique(articleId, userId, type)

Bookmarks
├── userId (FK → Users)
├── articleId (FK → Articles)
├── createdAt

Tags
├── id
├── name
├── slug
├── articles (many-to-many)
```

---

## Story 1.3: Database Migrations & Seed Data

**Status**: Ready  
**Sprint**: 2  
**Effort**: M (16 hours)  
**Owner**: @data-engineer (Dara)

### Description

Implement versioned database migrations, rollback capabilities, and comprehensive seed data for development and testing. Ensure migrations are reproducible and support zero-downtime deployments.

**Reference**: Technical Strategy section 1.3 (Migration strategy)

### Acceptance Criteria

- [ ] `npm run db:migrate` applies all pending migrations
- [ ] `npm run db:migrate:rollback` reverts last migration
- [ ] `npm run db:seed` populates dev database with realistic data
- [ ] Seed includes: 5 users (3 editors, 1 admin, 1 user), 20 articles, 40 comments
- [ ] All migrations are reversible (down script)
- [ ] No migration failures on fresh PostgreSQL instance
- [ ] Seed data includes proper timestamps and relationships
- [ ] Migration scripts versioned in `prisma/migrations/`

### Tasks

1. Create Prisma migration for initial schema
2. Create Prisma migration for indexes and constraints
3. Implement seed script (`prisma/seed.ts`)
4. Add npm scripts: `db:migrate`, `db:migrate:rollback`, `db:seed`
5. Create sample data generator for realistic article content
6. Test migrations on fresh database instance
7. Document migration process in README
8. Test rollback and re-apply migrations

### Dependencies

- **Blocked by**: Story 1.2 (schema designed)
- **Blocks**: Story 1.4, 2.2, 3.1

### Notes

- Use Prisma migration system (built-in)
- Seed data should be idempotent (safe to run multiple times)
- Include sample article content (3-4 paragraphs) for realistic testing
- Use UUIDs for all primary keys (security + horizontal scaling)

---

## Story 1.4: Error Handling, Logging & Health Checks

**Status**: Ready  
**Sprint**: 2  
**Effort**: S (8 hours)  
**Owner**: @dev (Dex)

### Description

Implement comprehensive error handling middleware, structured logging throughout the API, and health check mechanisms for monitoring and debugging in production.

**Reference**: PRD section 2.8 (Monitoring & error tracking)

### Acceptance Criteria

- [ ] Global error handler catches all unhandled exceptions
- [ ] API errors return consistent JSON format: `{ error, code, statusCode, timestamp }`
- [ ] Request logging includes: method, URL, statusCode, duration, userId (if logged in)
- [ ] All database errors logged with stack trace
- [ ] Health check endpoints: `/health` (basic), `/health/db` (database), `/health/cache` (redis)
- [ ] Error codes defined (INVALID_INPUT, NOT_FOUND, UNAUTHORIZED, etc.)
- [ ] Logs go to stdout (dev) and file (prod)
- [ ] No sensitive data logged (passwords, tokens)

### Tasks

1. Create error handler middleware (`middleware/errorHandler.ts`)
2. Define error types and codes (`lib/errors.ts`)
3. Implement request logging middleware with IDs
4. Add database error handling (connection errors, query timeouts)
5. Create health check endpoints with dependencies
6. Setup logging to file in production mode
7. Add error type safety with TypeScript
8. Test error scenarios (404, 500, validation errors)

### Dependencies

- **Blocked by**: Story 1.1 (server running)
- **Blocks**: All future API stories

### Notes

- Use structured logging (JSON format for parsing)
- Include correlation IDs for tracing requests
- Health checks should fail gracefully (return 503, not crash)
- Consider Sentry integration for error tracking (optional, Phase 2)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Database queries | <300ms | To verify |
| Test coverage | 70%+ | To implement |
| Type safety | 0 TypeScript errors | To verify |
| Uptime | 99.5% (health checks) | To verify |
| API response time | <100ms avg | To measure |

---

## Epic Dependencies & Timeline

```
Sprint 1:
├── Story 1.1 (Setup Express) ────┐
│                                  ├──> Story 1.2 (Schema Design)
└──────────────────────────────────┘
                                    └──> Story 1.3 (Migrations)
                                         └──> Story 1.4 (Error Handling)
Sprint 2:
├── Story 1.4 complete
└──> Ready for EPIC 2 (Authentication)
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| PostgreSQL not installed | Blocks all work | Use Docker (docker-compose.yml) |
| Prisma schema conflicts | Rework required | Schema review before migration |
| Seed data inconsistencies | Test failures | Validate FK relationships in seed |

---

## Appendix: Files to Create/Modify

**New Files**:
- `server/middleware/errorHandler.ts`
- `server/middleware/logger.ts`
- `server/routes/health.ts`
- `server/lib/errors.ts`
- `server/lib/logger.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `.env.example`

**Modified Files**:
- `server/index.ts` (middleware setup)
- `package.json` (dependencies + scripts)
- `tsconfig.json` (Prisma paths)

**New Dependencies**:
```json
{
  "@prisma/client": "^5.x",
  "prisma": "^5.x",
  "zod": "^3.x",
  "winston": "^3.x",
  "dotenv": "^16.x"
}
```

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Aria (Architect)
