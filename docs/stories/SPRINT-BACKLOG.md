# Sprint Backlog & Planning

**Document**: `docs/stories/SPRINT-BACKLOG.md`  
**Status**: Draft  
**Last Updated**: 2026-04-16  
**Scrum Master**: River

---

## How to Use This Document

Each sprint section lists stories ready for development. Use this to:
1. Assign stories to developers
2. Track story progress (checkboxes)
3. Manage dependencies and blockers
4. Plan daily standups
5. Prepare sprint demos

---

## Sprint 1: Backend Infrastructure (Apr 28 - May 10)

**Sprint Goal**: Express.js server + PostgreSQL schema ready for development

**Team**: Dex (@dev), Dara (@data-engineer)  
**Capacity**: 80 hours

### Stories

#### Story 1.1: Express.js + TypeScript Setup (8h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Initialize Express.js with TypeScript
- [ ] Setup environment variables (.env)
- [ ] Configure CORS middleware
- [ ] Implement request logging
- [ ] Create error handling middleware
- [ ] Setup health check endpoints
- [ ] Configure npm scripts (dev, build, start)
- [ ] Document server architecture

**Dependencies**: None  
**Blockers**: None  
**Sprint Goal Impact**: HIGH (foundation)

---

#### Story 1.2: PostgreSQL Schema + Prisma Setup (32h)

**Assigned to**: @data-engineer  
**Status**: Ready

**Tasks**:
- [ ] Design ER diagram (10+ tables)
- [ ] Initialize Prisma
- [ ] Create schema.prisma with all models
- [ ] Add indexes for performance
- [ ] Implement role-based access
- [ ] Create first migration
- [ ] Seed database with sample data
- [ ] Test Prisma client queries

**Dependencies**: Story 1.1 (server running)  
**Blockers**: None  
**Sprint Goal Impact**: HIGH (foundation)

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 2/2 (100%) | In Progress |
| Effort Remaining | 0h | ~80h used |
| Quality Gate | Passing | To verify |

---

## Sprint 2: Authentication & Database Ops (May 11 - May 24)

**Sprint Goal**: User authentication complete, database migrations working

**Team**: Dex (@dev), Dara (@data-engineer)  
**Capacity**: 140 hours

### Stories

#### Story 1.3: Database Migrations + Seed Data (16h)

**Assigned to**: @data-engineer  
**Status**: Ready

**Tasks**:
- [ ] Create migration scripts
- [ ] Implement rollback capability
- [ ] Write seed script with realistic data
- [ ] Test migrations on fresh database
- [ ] Document migration process
- [ ] Setup npm scripts for migrations

**Dependencies**: Story 1.2  
**Blockers**: None  
**Priority**: HIGH

---

#### Story 1.4: Error Handling & Logging (8h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create error handler middleware
- [ ] Define error types and codes
- [ ] Implement request logging
- [ ] Add database error handling
- [ ] Create health check endpoints
- [ ] Setup log file rotation

**Dependencies**: Story 1.1  
**Blockers**: None  
**Priority**: HIGH

---

#### Story 2.1: JWT Implementation (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create JWT utility functions
- [ ] Generate secret keys
- [ ] Implement token generation
- [ ] Implement token validation
- [ ] Create refresh token flow
- [ ] Add logout endpoint
- [ ] Test token expiration

**Dependencies**: Story 1.1  
**Blockers**: None  
**Priority**: HIGH

---

#### Story 2.2: Google OAuth 2.0 Integration (Start - 20h planned, ~12h this sprint)

**Assigned to**: @dev  
**Status**: In Progress (spills to Sprint 3)

**Tasks**:
- [ ] Create Google Cloud OAuth app
- [ ] Setup OAuth routes (/auth/oauth/google, callback)
- [ ] Implement token exchange
- [ ] User auto-creation on OAuth
- [ ] Store googleId in user record
- [ ] Frontend OAuth button (partial)

**Dependencies**: Story 2.1  
**Blockers**: None  
**Priority**: HIGH

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 4 (1 partial) | In Progress |
| Effort Remaining | 20h | ~120h used |
| Quality Gate | Passing | To verify |

---

## Sprint 3: Articles API & Accessibility (May 25 - Jun 7)

**Sprint Goal**: Full articles CRUD, search 50% complete, accessibility audit started

**Team**: Dex (@dev), Dara (@data-engineer), Uma (@ux-design-expert)  
**Capacity**: 160 hours

### Stories

#### Story 2.2: Google OAuth 2.0 (Finish - 8h remaining)

**Assigned to**: @dev  
**Status**: Continuation

**Remaining Tasks**:
- [ ] Frontend OAuth button integration
- [ ] Test full OAuth flow
- [ ] Error handling (consent denied)
- [ ] User linking flow

**Dependencies**: Story 2.1  
**Blockers**: None

---

#### Story 2.3: User Profiles (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create profile endpoints
- [ ] Implement profile update logic
- [ ] Add password hashing
- [ ] Create avatar upload handling
- [ ] Implement public profiles
- [ ] Add profile validation

**Dependencies**: Story 2.2  
**Blockers**: None

---

#### Story 2.4: Authorization Middleware (8h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create authMiddleware
- [ ] Create roleMiddleware
- [ ] Protect admin routes
- [ ] Protect editor routes
- [ ] Test authorization
- [ ] Document role hierarchy

**Dependencies**: Story 2.3  
**Blockers**: None

---

#### Story 3.1: Articles CRUD API (32h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create articles controller
- [ ] Implement GET (list + detail)
- [ ] Implement POST (create)
- [ ] Implement PUT (update)
- [ ] Implement DELETE (soft delete)
- [ ] Add pagination
- [ ] Test all CRUD operations
- [ ] Add rate limiting

**Dependencies**: Story 2.4  
**Blockers**: None

---

#### Story 3.2: Search & Filtering (Start - 32h planned, ~24h this sprint)

**Assigned to**: @dev  
**Status**: In Progress (finishes Sprint 4)

**Tasks**:
- [ ] Create PostgreSQL FTS index
- [ ] Implement full-text search
- [ ] Implement category filter
- [ ] Implement author filter
- [ ] Implement date range filter
- [ ] Add sorting (relevance, newest)

**Dependencies**: Story 3.1  
**Blockers**: None

---

#### Story 6.1: WCAG AA Compliance (32h)

**Assigned to**: @ux-design-expert  
**Status**: Ready (parallel with development)

**Tasks**:
- [ ] Run Axe accessibility audit
- [ ] Fix color contrast issues
- [ ] Add alt text to images
- [ ] Add ARIA labels
- [ ] Fix heading hierarchy
- [ ] Implement focus management
- [ ] Test with screen reader
- [ ] Document accessibility fixes

**Dependencies**: None (parallel)  
**Blockers**: None

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 5 (2 partial) | In Progress |
| Effort Remaining | 40h (carry over) | ~160h used |
| Quality Gate | Passing | To verify |

---

## Sprint 4: Engagement & Categories (Jun 8 - Jun 21)

**Sprint Goal**: Comments CRUD, categories complete, search complete

**Team**: Dex (@dev), Uma (@ux-design-expert)  
**Capacity**: 150 hours

### Stories

#### Story 3.2: Search & Filtering (Finish - 8h remaining)

**Assigned to**: @dev  
**Status**: Continuation

**Remaining Tasks**:
- [ ] Complete read time filter
- [ ] Test search performance
- [ ] Finalize sorting logic
- [ ] Performance benchmarks

---

#### Story 3.3: Categories + Tags (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create categories endpoints
- [ ] Create tags endpoints
- [ ] Implement tag creation/deletion
- [ ] Link articles to categories
- [ ] Add category colors to DB
- [ ] Create category landing pages

---

#### Story 3.4: Publishing Workflow (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Add status field to articles
- [ ] Implement publish endpoint
- [ ] Implement unpublish endpoint
- [ ] Create drafts endpoint
- [ ] Implement archive functionality
- [ ] Add audit logging

---

#### Story 4.1: Comments CRUD API (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create comments controller
- [ ] Implement GET (list comments)
- [ ] Implement POST (create)
- [ ] Implement PUT (edit)
- [ ] Implement DELETE
- [ ] Add pagination
- [ ] Test all comment operations

---

#### Story 4.2: Comment Threading (Start - 32h planned, ~18h this sprint)

**Assigned to**: @dev  
**Status**: In Progress (finishes Sprint 5)

**Tasks**:
- [ ] Add parentId to model
- [ ] Create reply endpoint
- [ ] Implement thread structure
- [ ] Test nesting limits
- [ ] Query optimization

---

#### Story 6.2: Mobile Responsiveness (32h)

**Assigned to**: @ux-design-expert  
**Status**: Ready (parallel)

**Tasks**:
- [ ] Test all breakpoints (320px-2560px)
- [ ] Fix sidebar on mobile
- [ ] Adjust touch targets
- [ ] Fix form layout
- [ ] Test on real devices
- [ ] Measure CLS

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 4 (2 partial) | In Progress |
| Effort Remaining | 40h (carry over) | ~150h used |
| Quality Gate | Passing | To verify |

---

## Sprint 5: Moderation & Admin Start (Jun 22 - Jul 5)

**Sprint Goal**: Comment moderation, email notifications, admin auth, design tokens

**Team**: Dex (@dev), Uma (@ux-design-expert)  
**Capacity**: 145 hours

### Stories

#### Story 4.2: Comment Threading (Finish - 14h remaining)

**Assigned to**: @dev  
**Status**: Continuation

---

#### Story 4.3: Comment Moderation (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Add status field (PENDING, APPROVED, REJECTED)
- [ ] Create moderation endpoints
- [ ] Implement approval/rejection
- [ ] Create spam detection rules
- [ ] Add user flagging
- [ ] Create moderation dashboard

---

#### Story 4.4: Email Notifications (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Choose email service
- [ ] Create email service
- [ ] Create email templates
- [ ] Implement comment notifications
- [ ] Implement reply notifications
- [ ] Add unsubscribe link

---

#### Story 5.1: Admin Authentication (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create admin middleware
- [ ] Implement role checks
- [ ] Create admin routes base
- [ ] Implement session management
- [ ] Add admin activity logging
- [ ] Test permission enforcement

---

#### Story 5.2: Articles Dashboard (Start - 32h planned, ~20h this sprint)

**Assigned to**: @dev  
**Status**: In Progress (finishes Sprint 6)

**Tasks**:
- [ ] Create articles list endpoint
- [ ] Implement filters
- [ ] Implement bulk operations
- [ ] Quick edit functionality
- [ ] Pagination

---

#### Story 6.3: Design Tokens (16h)

**Assigned to**: @ux-design-expert  
**Status**: Ready (parallel)

**Tasks**:
- [ ] Create design tokens file
- [ ] Extract colors
- [ ] Define spacing scale
- [ ] Define typography
- [ ] Define shadows
- [ ] Update Tailwind config

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 5 (2 partial) | In Progress |
| Effort Remaining | 35h (carry over) | ~145h used |
| Quality Gate | Passing | To verify |

---

## Sprint 6: Dashboard & Performance (Jul 6 - Jul 19)

**Sprint Goal**: Admin dashboard complete, Redis caching, i18n, DB optimization

**Team**: Dex (@dev), Dara (@data-engineer), Uma (@ux-design-expert)  
**Capacity**: 140 hours

### Stories

#### Story 5.2: Articles Dashboard (Finish - 12h remaining)

**Assigned to**: @dev  
**Status**: Continuation

---

#### Story 5.3: Users Dashboard (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create users list endpoint
- [ ] Implement user search
- [ ] Create role change endpoint
- [ ] Create account deactivation
- [ ] User detail view
- [ ] Activity logging

---

#### Story 5.4: Analytics Dashboard (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create overview endpoint
- [ ] Implement articles analytics
- [ ] Implement users analytics
- [ ] Implement comments analytics
- [ ] Create charts (traffic, engagement)
- [ ] Add caching

---

#### Story 7.1: Redis Caching (32h)

**Assigned to**: @data-engineer  
**Status**: Ready

**Tasks**:
- [ ] Install Redis client
- [ ] Create cache service
- [ ] Implement article caching
- [ ] Implement category caching
- [ ] Cache invalidation strategy
- [ ] Cache warm-up script
- [ ] Performance testing

---

#### Story 7.2: DB Optimization (Start - 16h planned, ~12h this sprint)

**Assigned to**: @data-engineer  
**Status**: In Progress (finishes Sprint 7)

**Tasks**:
- [ ] Review query plans
- [ ] Add missing indexes
- [ ] Identify N+1 queries
- [ ] Optimize search queries

---

#### Story 6.4: i18n Framework Setup (16h)

**Assigned to**: @dev  
**Status**: Ready (parallel)

**Tasks**:
- [ ] Install i18n library
- [ ] Create translation files
- [ ] Extract text from components
- [ ] Setup i18n config
- [ ] Create language switcher
- [ ] Test language switching

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 5 (2 partial) | In Progress |
| Effort Remaining | 20h (carry over) | ~140h used |
| Quality Gate | Passing | To verify |

---

## Sprint 7: Optimization & Monetization (Jul 20 - Aug 2)

**Sprint Goal**: Code splitting, CI/CD pipeline, AdSense, SEO meta tags

**Team**: Dex (@dev), Dara (@data-engineer), Gage (@devops)  
**Capacity**: 150 hours

### Stories

#### Story 7.2: DB Optimization (Finish - 4h remaining)

**Assigned to**: @data-engineer  
**Status**: Continuation

---

#### Story 7.3: Code Splitting + Lazy Loading (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Implement route code splitting
- [ ] Add Suspense boundaries
- [ ] Lazy load admin dashboard
- [ ] Optimize images
- [ ] Run Lighthouse
- [ ] Monitor bundle size

---

#### Story 7.4: CI/CD Pipeline (Start - 32h planned, ~20h this sprint)

**Assigned to**: @devops  
**Status**: In Progress (finishes Sprint 8)

**Tasks**:
- [ ] Create GitHub Actions workflow
- [ ] Add lint step
- [ ] Add test step
- [ ] Add build step
- [ ] Add staging deploy
- [ ] Setup health checks

---

#### Story 8.1: AdSense Integration (16h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Apply for AdSense
- [ ] Create ad slots
- [ ] Replace placeholders with real code
- [ ] Configure responsive sizing
- [ ] Test ad loading
- [ ] Track ad performance

---

#### Story 8.2: Meta Tags + Schema (Start - 16h planned, ~12h this sprint)

**Assigned to**: @dev  
**Status**: In Progress (finishes Sprint 8)

**Tasks**:
- [ ] Create meta tag helper
- [ ] Add global meta tags
- [ ] Implement dynamic meta tags
- [ ] Create JSON-LD schemas
- [ ] Add canonical URLs
- [ ] Test with Google Rich Results

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 4 (3 partial) | In Progress |
| Effort Remaining | 36h (carry over) | ~150h used |
| Quality Gate | Passing | To verify |

---

## Sprint 8: Launch Preparation (Aug 3 - Aug 16)

**Sprint Goal**: All features complete, production ready

**Team**: Dex (@dev), Gage (@devops), QA (@qa)  
**Capacity**: 100 hours

### Stories

#### Story 7.4: CI/CD Pipeline (Finish - 12h remaining)

**Assigned to**: @devops  
**Status**: Continuation

**Remaining Tasks**:
- [ ] Production deploy setup
- [ ] Rollback mechanism
- [ ] Deploy notifications
- [ ] Documentation

---

#### Story 8.2: Meta Tags + Schema (Finish - 4h remaining)

**Assigned to**: @dev  
**Status**: Continuation

**Remaining Tasks**:
- [ ] Finalize JSON-LD
- [ ] Test all pages

---

#### Story 8.3: Sitemaps + robots.txt (8h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Create sitemap service
- [ ] Generate XML sitemap
- [ ] Create robots.txt
- [ ] Auto-update on article publish
- [ ] Submit to Google Search Console

---

#### Story 8.4: Google Analytics 4 (8h)

**Assigned to**: @dev  
**Status**: Ready

**Tasks**:
- [ ] Setup GA4 property
- [ ] Add tracking code
- [ ] Configure page views
- [ ] Create custom events
- [ ] Setup goals/conversions

---

#### Stabilization & Buffer (68h)

**Assigned to**: Full team  
**Status**: In Progress

**Activities**:
- [ ] Bug fixes
- [ ] Performance tuning
- [ ] Documentation
- [ ] Launch checklist review
- [ ] Production readiness checks
- [ ] Security audit

---

### Sprint Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Stories Completed | 8 | Complete |
| Critical Bugs | 0 | To verify |
| Quality Gate | All passing | To verify |
| Launch Readiness | 100% | To verify |

---

## Overall Backlog Status

| Epic | Stories | Completed | In Progress | To Start | Status |
|------|---------|-----------|------------|----------|--------|
| EPIC 1 | 4 | 0 | 0 | 4 | Not Started |
| EPIC 2 | 4 | 0 | 0 | 4 | Not Started |
| EPIC 3 | 4 | 0 | 0 | 4 | Not Started |
| EPIC 4 | 4 | 0 | 0 | 4 | Not Started |
| EPIC 5 | 4 | 0 | 0 | 4 | Not Started |
| EPIC 6 | 4 | 0 | 0 | 4 | Not Started |
| EPIC 7 | 4 | 0 | 0 | 4 | Not Started |
| EPIC 8 | 4 | 0 | 0 | 4 | Not Started |
| **TOTAL** | **32** | **0** | **0** | **32** | **Ready** |

---

## Daily Standup Template

**Time**: 9:30am (15 min)  
**Format**: What did you do yesterday? What's blocking you today? What will you do today?

```
🚀 DAILY STANDUP — Sprint N, Day X

[ ] @dev: 
    Yesterday: ...
    Today: ...
    Blockers: (none / list)

[ ] @data-engineer:
    Yesterday: ...
    Today: ...
    Blockers: (none / list)

[ ] @ux-design-expert:
    Yesterday: ...
    Today: ...
    Blockers: (none / list)

⚠️ RISKS: (none / list)
```

---

## Definition of Done (DoD)

A story is DONE when:

- [ ] All acceptance criteria met
- [ ] Code reviewed and approved (2+ reviewers)
- [ ] Unit tests written and passing (70%+ coverage)
- [ ] Linting passes (ESLint, Prettier)
- [ ] TypeScript: 0 errors (strict mode)
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] No regressions in other features
- [ ] Story updated in this document

---

## Blockers & Escalation

**If blocked** (waiting on external, unclear requirements, dependency delay):

1. Document blocker in daily standup
2. Add to "BLOCKERS" section of sprint
3. Notify Scrum Master (@sm / River)
4. Suggest mitigation (parallel work, remove from sprint)
5. Escalate if blocking > 1 day

**Example Blockers**:
- PostgreSQL not installed
- Google OAuth credentials not created
- Unclear acceptance criteria
- Dependency module broken
- Performance benchmark unclear

---

## Success Criteria (End of Sprint)

**Each Sprint is Successful When**:

- [ ] All planned stories completed (or moved to next sprint with justification)
- [ ] Quality gates passing: tests, linting, TypeScript
- [ ] Zero critical bugs on main branch
- [ ] Sprint demo shows working features
- [ ] Team retrospective completed
- [ ] Next sprint planned and sized

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-16  
**Next Update**: After Sprint 1 Complete (May 12)
