# EPIC 3: Core Article Management System

**Epic ID**: EPIC-3  
**Status**: Draft  
**Sprints**: 3-4 (80 hours)  
**Priority**: P0 (Must-Have)  
**Product Manager**: Morgan  
**Technical Lead**: Aria (Architect)  
**Date Created**: 2026-04-16

---

## Epic Summary

Implement complete article CRUD operations, advanced search, filtering, and publishing workflow. Replaces mock data with persistent API-driven content management, supporting drafts, scheduled publishing, and archive functionality.

**Rationale**: Core platform functionality—users interact with articles. Replaces hardcoded mock data with dynamic, queryable content (PRD section 2.1).

**Success Criteria**:
- [ ] Articles fully queryable via REST API
- [ ] Full-text search working (SQL queries <300ms)
- [ ] Article filters (category, author, date range) functional
- [ ] Drafts and publishing workflow implemented
- [ ] Related articles algorithm working
- [ ] Frontend displays articles from API (not mock data)
- [ ] 20+ API endpoints tested and documented

---

## Story 3.1: Articles CRUD API (Create, Read, Update, Delete)

**Status**: Ready  
**Sprint**: 3  
**Effort**: L (32 hours)  
**Owner**: @dev (Dex)

### Description

Implement full REST API for article operations: list with pagination, create draft, read detail, update content, and delete. Support draft/published status.

**Reference**: PRD section 2.1 (API endpoints), Technical Strategy section 1.2

### Acceptance Criteria

- [ ] `GET /articles` returns paginated list (10 items default, max 100)
- [ ] `GET /articles?limit=20&page=2` supports pagination with metadata
- [ ] `GET /articles/:id` returns full article with metadata
- [ ] `GET /articles/:slug` alternative read by slug (SEO friendly)
- [ ] `POST /articles` creates new draft (requires EDITOR role)
- [ ] `PUT /articles/:id` updates article (requires author or ADMIN)
- [ ] `DELETE /articles/:id` soft delete (requires author or ADMIN)
- [ ] Articles include: title, content, excerpt, category, author, timestamps
- [ ] Status workflow: DRAFT → PUBLISHED → ARCHIVED
- [ ] View count incremented on read (not on PUT)
- [ ] Slug auto-generated from title (slugify)

### Tasks

1. Create article controller (`routes/articles.ts`)
2. Implement GET `/articles` with pagination
3. Implement GET `/articles/:id` and `/articles/:slug`
4. Implement POST `/articles` with validation
5. Implement PUT `/articles/:id` with conflict detection
6. Implement DELETE `/articles/:id` (soft delete)
7. Add Zod validation for article input
8. Create service layer (`services/articleService.ts`)
9. Test all CRUD operations with Postman/curl
10. Add rate limiting on POST (max 10 articles/day per editor)

### Dependencies

- **Blocked by**: Story 2.4 (authorization ready)
- **Blocks**: Stories 3.2, 3.3, 4.1, 5.2

### Notes

- Pagination: return `{ data: [], total, page, limit }`
- Slug uniqueness: use PostgreSQL unique constraint
- View count: increment on GET without updating updatedAt
- Body field: store markdown, don't sanitize (sanitize on render)
- Author auto-set to current user (from JWT)

---

## Story 3.2: Article Search & Filtering API

**Status**: Ready  
**Sprint**: 3  
**Effort**: L (32 hours)  
**Owner**: @dev (Dex)

### Description

Implement full-text search on article titles and content, plus filtering by category, author, date range, and read time. Uses PostgreSQL FTS for performance.

**Reference**: PRD section 2.1 (Search endpoints), UX/UI Analysis section 4.2 (search functionality)

### Acceptance Criteria

- [ ] `GET /articles/search?q=blockchain` returns matching articles
- [ ] Full-text search on title + content (PostgreSQL tsvector)
- [ ] Filtering by category: `?category=AI`
- [ ] Filtering by author: `?author_id={uuid}`
- [ ] Filtering by date range: `?from=2026-01-01&to=2026-04-30`
- [ ] Filtering by read time: `?min_read=5&max_read=20`
- [ ] Search results ranked by relevance (title matches > content)
- [ ] Search queries <300ms (with indexes)
- [ ] Combined filters work: `?q=AI&category=Science&from=2026-01-01`
- [ ] Empty search returns all published articles

### Tasks

1. Create PostgreSQL FTS index on articles (title + content)
2. Create search service (`services/searchService.ts`)
3. Implement full-text search with tsvector
4. Implement category filter
5. Implement author filter
6. Implement date range filter
7. Implement read time filter (calculated field)
8. Add sorting: relevance, newest, most viewed
9. Test search performance with 1000+ articles
10. Create search analytics (most searched terms)

### Dependencies

- **Blocked by**: Story 3.1 (article CRUD ready)
- **Blocks**: Story 3.3, frontend Search page

### Notes

- Use PostgreSQL `@@ ` operator for FTS
- Create indexes on filtered columns (category_id, author_id, published_at)
- Rank results by relevance using `ts_rank()`
- Calculate read time: words / 200 (standard metric)
- Consider Elasticsearch later (Phase 2) for advanced analytics

---

## Story 3.3: Category Management & Article Tagging

**Status**: Ready  
**Sprint**: 4  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement category endpoints and article tagging system. Categories are predefined (AI, Science, Robotics, Gadgets) but support extensibility. Tags are user-defined keywords.

**Reference**: PRD section 2.1 (Categories), UX/UI Analysis section 2.2 (Category colors)

### Acceptance Criteria

- [ ] `GET /categories` returns all categories with article count
- [ ] `GET /categories/:slug/articles` returns articles in category
- [ ] Category schema: id, name, slug, color (neon hex), description
- [ ] Articles require exactly one category
- [ ] Tags support: create, list, search
- [ ] Articles can have 1-10 tags
- [ ] `GET /articles/tags/{tag}` returns articles with tag
- [ ] Category colors match design system (AI: cyan, Science: purple, etc.)
- [ ] Categories are admin-only to create (predefined in seed)
- [ ] Tags auto-created from article input

### Tasks

1. Create categories endpoint (`routes/categories.ts`)
2. Create tag endpoints (`routes/tags.ts`)
3. Implement category endpoints: GET all, GET by slug, create (admin)
4. Implement tag endpoints: GET all, search, delete (admin)
5. Update article model: categoryId required, tags many-to-many
6. Migrate existing articles to categories (seed data)
7. Add category color validation (hex format)
8. Test category filters on search
9. Create category landing pages (frontend)
10. Implement tag cloud widget

### Dependencies

- **Blocked by**: Story 3.2 (search ready)
- **Blocks**: Story 3.4, frontend category pages

### Notes

- Categories: predefined set (4 main + extensible)
- Store category colors in database (not hardcoded in frontend)
- Tags: auto-create if not exists, lowercase
- Tag limit: prevent spam (max 10 per article)
- Category slugs: lowercase, hyphenated (ai, science, robotics, gadgets)

---

## Story 3.4: Article Drafts & Publishing Workflow

**Status**: Ready  
**Sprint**: 4  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement article draft system, scheduled publishing, and publishing workflow with editorial review. Support draft collaboration and version history (optional Phase 2).

**Reference**: PRD section 2.1 (Content management), Technical Strategy section 3.2

### Acceptance Criteria

- [ ] Article status field: DRAFT, PUBLISHED, ARCHIVED
- [ ] Editors can save drafts without publishing
- [ ] `PUT /articles/:id/publish` promotes draft to published
- [ ] Scheduled publishing: `publishAt` timestamp (optional, Phase 2)
- [ ] `PUT /articles/:id/unpublish` reverts to draft
- [ ] Draft visibility: only author + admins can read
- [ ] `GET /articles/drafts` returns user's draft articles
- [ ] Archive articles: `PUT /articles/:id/archive`
- [ ] Archived articles not in public list but accessible by ID
- [ ] Publishing creates audit log entry

### Tasks

1. Add status field to article model (DRAFT, PUBLISHED, ARCHIVED)
2. Add publishAt timestamp for scheduled publishing
3. Create publish endpoint: `PUT /articles/:id/publish`
4. Create unpublish endpoint: `PUT /articles/:id/unpublish`
5. Create archive endpoint: `PUT /articles/:id/archive`
6. Create drafts endpoint: `GET /articles/drafts`
7. Update article queries to exclude drafts from public view
8. Add visibility checks (draft only readable by author/admin)
9. Create audit log for publish events
10. Test workflow: draft → review → publish

### Dependencies

- **Blocked by**: Story 3.3 (tags ready)
- **Blocks**: None (complete)

### Notes

- Only published articles shown in public feeds
- Status transitions: DRAFT → PUBLISHED | ARCHIVED, PUBLISHED → ARCHIVED
- Scheduled publishing requires async job queue (Phase 2)
- Audit log: who, what, when (for compliance)
- Consider draft versioning (Phase 2)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| API endpoints | 20+ endpoints documented | To verify |
| Search performance | <300ms queries | To measure |
| Full-text indexing | All articles indexed | To verify |
| Category coverage | 4 main categories | To verify |

---

## Epic Dependencies & Timeline

```
Sprint 3:
├── Story 3.1 (CRUD) ──┐
│                      ├──> Story 3.2 (Search)
└────────────────────┘
                       └──> Story 3.3 (Categories)

Sprint 4:
├── Story 3.3 complete
└──> Story 3.4 (Publishing Workflow)
     └──> Ready for EPIC 4 (Comments) & frontend integration
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Search query performance | Slow user experience | Create indexes on filtered columns |
| PostgreSQL FTS complexity | Implementation delay | Use Prisma raw queries if needed |
| Category migration | Data inconsistency | Validate in seed script |

---

## Appendix: Files to Create/Modify

**New Files**:
- `server/routes/articles.ts`
- `server/routes/categories.ts`
- `server/routes/tags.ts`
- `server/services/articleService.ts`
- `server/services/searchService.ts`
- `types/article.ts`
- `types/category.ts`

**Modified Files**:
- `prisma/schema.prisma` (Article, Category, Tag models)
- `server/index.ts` (route registration)
- `package.json` (slugify dependency)

**New Dependencies**:
```json
{
  "slugify": "^1.x"
}
```

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Aria (Architect)
