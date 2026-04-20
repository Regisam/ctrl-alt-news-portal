# Ctrl Alt News Portal — Development Roadmap

**Status**: Active (Updated during Sprint 4)  
**Last Updated**: 2026-04-20  
**Product Manager**: Morgan  
**Scrum Master**: River

---

## Overview

The Ctrl Alt News Portal MVP development roadmap spans **15 weeks (8 sprints)** across **8 epics** with **33 user stories** (updated from 32). Timeline: **Sprint 1 (theoretical Apr 28) → Current: Sprint 4 Complete**, targeting **Q3 2026 launch**.

**NOTE**: Timeline rebaselined on 2026-04-20. Sprint 4 completed ahead of schedule with 5 stories (not 4 as originally planned).

Total Effort: **~610 hours** (18 weeks at 50% allocation, 3 developers)

---

## Executive Timeline

```
┌─────────────────────────────────────────────────────────────────────┐
│ CTRL ALT NEWS PORTAL MVP — 15-WEEK DEVELOPMENT ROADMAP              │
└─────────────────────────────────────────────────────────────────────┘

SPRINT 1 (Apr 28 - May 10)  ████ 80h   EPIC 1: Backend Infrastructure
├── Story 1.1: Express.js + TypeScript
└── Story 1.2: PostgreSQL Schema + Prisma

SPRINT 2 (May 11 - May 24) ████████ 140h EPIC 1 + EPIC 2: Auth
├── Story 1.3: Migrations + Seed
├── Story 1.4: Error Handling
├── Story 2.1: JWT Implementation
└── Story 2.2: Google OAuth (start)

SPRINT 3 (May 25 - Jun 7)  ████████████ 160h EPIC 2 + EPIC 3 (start)
├── Story 2.2: Google OAuth (cont)
├── Story 2.3: User Profiles
├── Story 2.4: Authorization
├── Story 3.1: Articles CRUD
├── Story 3.2: Search (start)
└── EPIC 6 (parallel): Accessibility

SPRINT 4 (COMPLETED 2026-04-20)  ████████████████ 180h EPIC 3 + EPIC 4
├── Story 3.2: Search (finished)
├── Story 3.3: Categories (finished)
├── Story 3.4: Publishing Workflow (finished)
├── Story 4.1: Comment Threading & Validation ✅
├── Story 4.2: Real-time WebSocket Updates ✅
├── Story 4.3: Comment Notifications ✅
├── Story 4.4: Reply Counter & Analytics ✅
├── Story 4.5: Trending Comments API ✅
└── EPIC 6 (cont): Responsive Design

SPRINT 5 (NEXT)  ████████████ 145h EPIC 5: Admin Dashboard
├── Story 5.1: Admin Authentication
├── Story 5.2: Articles Dashboard (start)
├── Story 5.3: Users Dashboard (start)
├── Story 5.4: Analytics Dashboard (start)
└── EPIC 6 (cont): Design Tokens

SPRINT 6 (Jul 6 - Jul 19)  ████████████ 140h EPIC 5 + EPIC 7 (start)
├── Story 5.2: Articles Dashboard (cont)
├── Story 5.3: Users Dashboard
├── Story 5.4: Analytics
├── Story 7.1: Redis Caching
├── Story 7.2: DB Optimization (start)
└── EPIC 6 (cont): i18n Setup

SPRINT 7 (Jul 20 - Aug 2)  ████████████ 150h EPIC 7 + EPIC 8 (start)
├── Story 7.2: DB Optimization (cont)
├── Story 7.3: Frontend Optimization
├── Story 7.4: CI/CD (start)
├── Story 8.1: AdSense Integration
└── Story 8.2: Meta Tags + Schema (start)

SPRINT 8 (Aug 3 - Aug 16) ███████ 100h EPIC 7 + EPIC 8 (finish)
├── Story 7.4: CI/CD (finish)
├── Story 8.2: Meta Tags (finish)
├── Story 8.3: Sitemaps
├── Story 8.4: Google Analytics
└── Buffer + Stabilization
```

---

## Detailed Sprint Breakdown

### Sprint 1: Backend Foundation (Apr 28 - May 10) — 80 hours

**Focus**: Express.js server + PostgreSQL setup  
**Stories**: EPIC-1.1, EPIC-1.2  
**Deliverables**: Running API server, database schema

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 1.1 | Express.js + TypeScript Setup | 8h (S) | @dev | Ready |
| 1.2 | PostgreSQL Schema + Prisma | 32h (L) | @data-engineer | Ready |
| **Buffer** | Testing, documentation | 40h | @dev | — |

**Exit Criteria**:
- [ ] Express.js server running on port 3000
- [ ] PostgreSQL with 10+ tables created
- [ ] Prisma client working
- [ ] Health check endpoint functional

---

### Sprint 2: Authentication & Database Operations (May 11 - May 24) — 140 hours

**Focus**: User authentication, database migrations  
**Stories**: EPIC-1.3, EPIC-1.4, EPIC-2.1, EPIC-2.2 (start)  
**Deliverables**: JWT auth, Google OAuth start, migrations, logging

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 1.3 | Migrations + Seed Data | 16h (M) | @data-engineer | Ready |
| 1.4 | Error Handling + Logging | 8h (S) | @dev | Ready |
| 2.1 | JWT Implementation | 16h (M) | @dev | Ready |
| 2.2 | Google OAuth 2.0 (start) | 20h | @dev | Ready |
| **Buffer** | Testing, debugging | 80h | @dev, @qa | — |

**Exit Criteria**:
- [ ] Database migrations working
- [ ] JWT tokens generated and validated
- [ ] Error handling middleware active
- [ ] Google OAuth callback implemented

---

### Sprint 3: Articles API & Accessibility (May 25 - Jun 7) — 160 hours

**Focus**: Article CRUD, search, authorization, accessibility  
**Stories**: EPIC-2.2 (finish), EPIC-2.3, EPIC-2.4, EPIC-3.1, EPIC-3.2 (start), EPIC-6.1  
**Deliverables**: Full articles API, user profiles, auth middleware, accessibility audit

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 2.2 | Google OAuth 2.0 (finish) | 12h | @dev | Ready |
| 2.3 | User Profiles | 16h (M) | @dev | Ready |
| 2.4 | Authorization Middleware | 8h (S) | @dev | Ready |
| 3.1 | Articles CRUD API | 32h (L) | @dev | Ready |
| 3.2 | Search + Filtering (start) | 24h | @dev | Ready |
| 6.1 | WCAG AA Compliance | 32h (L) | @ux-design-expert | Ready |
| **Buffer** | Testing, review | 36h | @dev, @qa, @ux | — |

**Exit Criteria**:
- [ ] Articles CRUD working
- [ ] User authentication complete
- [ ] Authorization checks active
- [ ] Search functionality 50% complete
- [ ] Accessibility audit started

---

### Sprint 4: Comments & Real-time Features (COMPLETED 2026-04-20) — 180 hours

**Focus**: Comment threading, real-time WebSocket, notifications, analytics  
**Stories**: EPIC-4.1, EPIC-4.2, EPIC-4.3, EPIC-4.4, EPIC-4.5 (all 5 completed)  
**Deliverables**: Full comment system with real-time sync, trending API, reply counters

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 4.1 | Comment Threading & Validation | 16h (M) | @dev | ✅ Done |
| 4.2 | Real-time WebSocket Updates | 24h (L) | @dev | ✅ Done |
| 4.3 | Comment Notifications | 16h (M) | @dev | ✅ Done |
| 4.4 | Reply Counter & Analytics | 20h (M) | @dev | ✅ Done |
| 4.5 | Trending Comments API | 16h (M) | @dev | ✅ Done |
| **QA Gate** | Full test coverage | 8h | @qa | ✅ Pass |

**Exit Criteria** (All Met):
- [x] Comment threading 3-level deep
- [x] Real-time sync via WebSocket (<500ms latency)
- [x] Notifications working with JWT auth
- [x] Reply counters accurate, cached
- [x] Trending API with time windows
- [x] 37/37 tests passing, TypeScript 0 errors
- [x] All stories Ready for Review & deployed

---

### Sprint 5: Admin Dashboard & Design (NEXT) — 145 hours

**Focus**: Admin panel, user/article dashboards, design tokens  
**Stories**: EPIC-5.1, EPIC-5.2 (start), EPIC-5.3 (start), EPIC-5.4 (start), EPIC-6.3  
**Deliverables**: Admin dashboard skeleton, design tokens, auth system

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 5.1 | Admin Authentication | 16h (M) | @dev | Ready |
| 5.2 | Articles Dashboard (start) | 20h | @dev | Ready |
| 5.3 | Users Dashboard (start) | 16h (M) | @dev | Ready |
| 5.4 | Analytics Dashboard (start) | 16h (M) | @dev | Ready |
| 6.3 | Design Tokens | 16h (M) | @ux-design-expert | Ready |
| **Buffer** | Testing, integration | 61h | @dev, @qa | — |

**Exit Criteria**:
- [ ] Admin auth working (role-based)
- [ ] Article dashboard 50% complete
- [ ] User dashboard 50% complete
- [ ] Analytics dashboard 50% complete
- [ ] Design tokens extracted & documented

---

### Sprint 6: Dashboard & Performance (Jul 6 - Jul 19) — 140 hours

**Focus**: Admin dashboards, analytics, caching, performance  
**Stories**: EPIC-5.2 (finish), EPIC-5.3, EPIC-5.4, EPIC-7.1, EPIC-7.2 (start), EPIC-6.4  
**Deliverables**: Complete admin dashboard, Redis caching, i18n setup, DB optimization

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 5.2 | Articles Dashboard (finish) | 12h | @dev | Ready |
| 5.3 | Users Dashboard | 16h (M) | @dev | Ready |
| 5.4 | Analytics Dashboard | 16h (M) | @dev | Ready |
| 7.1 | Redis Caching | 32h (L) | @data-engineer | Ready |
| 7.2 | DB Optimization (start) | 12h | @data-engineer | Ready |
| 6.4 | i18n Framework Setup | 16h (M) | @dev | Ready |
| **Buffer** | Testing, performance | 36h | @dev, @qa | — |

**Exit Criteria**:
- [ ] Admin dashboard fully functional
- [ ] Redis caching implemented
- [ ] i18n configured (EN + PT-BR)
- [ ] Database indexed
- [ ] Analytics dashboard working

---

### Sprint 7: Optimization & Deployment (Jul 20 - Aug 2) — 150 hours

**Focus**: Frontend optimization, CI/CD, monetization start  
**Stories**: EPIC-7.2 (finish), EPIC-7.3, EPIC-7.4 (start), EPIC-8.1, EPIC-8.2 (start)  
**Deliverables**: Code splitting, CI/CD pipeline, AdSense, SEO meta tags

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 7.2 | DB Optimization (finish) | 4h | @data-engineer | Ready |
| 7.3 | Code Splitting + Lazy Loading | 16h (M) | @dev | Ready |
| 7.4 | CI/CD Pipeline (start) | 20h | @devops | Ready |
| 8.1 | AdSense Integration | 16h (M) | @dev | Ready |
| 8.2 | Meta Tags + Schema (start) | 12h | @dev | Ready |
| **Buffer** | Testing, docs | 82h | @dev, @qa, @devops | — |

**Exit Criteria**:
- [ ] Bundle size <150KB (gzip)
- [ ] Lighthouse score >=90
- [ ] CI/CD pipeline running
- [ ] AdSense placeholders working
- [ ] Meta tags on articles

---

### Sprint 8: Finalization & Launch (Aug 3 - Aug 16) — 100 hours

**Focus**: CI/CD finish, SEO completion, stabilization  
**Stories**: EPIC-7.4 (finish), EPIC-8.2 (finish), EPIC-8.3, EPIC-8.4, Buffer & Stabilization  
**Deliverables**: Production-ready deployment, sitemaps, GA4, launch ready

| Story | Title | Effort | Owner | Status |
|-------|-------|--------|-------|--------|
| 7.4 | CI/CD Pipeline (finish) | 12h | @devops | Ready |
| 8.2 | Meta Tags (finish) | 4h | @dev | Ready |
| 8.3 | Sitemaps + robots.txt | 8h (S) | @dev | Ready |
| 8.4 | Google Analytics 4 | 8h (S) | @dev | Ready |
| **Stabilization** | Bug fixes, polish | 68h | @dev, @qa | — |

**Exit Criteria**:
- [ ] All stories complete and tested
- [ ] Sitemaps generated and submitted
- [ ] GA4 tracking active
- [ ] Zero critical bugs
- [ ] Launch checklist signed off

---

## Epic Dependencies Graph

```
┌────────────────────────────────────────────────────────────────┐
│                    CTRL ALT NEWS PORTAL EPICS                   │
│                     (Dependency Graph)                          │
└────────────────────────────────────────────────────────────────┘

                         ┌─────────────┐
                         │  EPIC 1     │
                         │  Backend    │
                         │  Infra      │
                         └──────┬──────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
          ┌─────▼──────┐  ┌─────▼──────┐  ┌────▼─────┐
          │  EPIC 2    │  │  EPIC 3    │  │ EPIC 6   │
          │  Auth      │  │  Articles  │  │  UX/UI   │
          └─────┬──────┘  └─────┬──────┘  │(parallel)│
                │               │         └──────────┘
                ├─────┬─────────┤
                │     │         │
          ┌─────▼──┐ ┌─▼────┐ ┌────▼─────┐
          │ EPIC 4 │ │EPIC 5│ │ EPIC 7   │
          │Comments│ │Admin │ │Performance
          └─────┬──┘ └──┬───┘ │& Deploy  │
                │       │     └────┬─────┘
                │       │          │
                │   ┌───┴──────────┤
                │   │              │
          ┌─────▼───▼──────┐  ┌─────▼──┐
          │   EPIC 8       │  │ LAUNCH  │
          │ Monetization   │  │ Q3 2026 │
          │ & SEO          │  └─────────┘
          └────────────────┘
```

---

## Resource Allocation

**Team**: 3 developers @ 50% allocation = 1.5 FTE  
**Sprint Velocity**: ~140 hours/sprint (theoretical)  
**Duration**: 8 sprints × 2 weeks = 16 weeks (with 1-week buffer)

| Role | Sprint Allocation | Total |
|------|-----------------|-------|
| **@dev (Dex)** | 40h/sprint | ~320h |
| **@data-engineer (Dara)** | 20h/sprint | ~160h |
| **@ux-design-expert (Uma)** | 20h/sprint (Sprints 3-6) | ~80h |
| **@devops (Gage)** | 10h/sprint (Sprints 7-8) | ~20h |
| **@qa (Quinn)** | 20h/sprint (integrated) | ~160h |
| **Buffer** | 30h/sprint | ~240h |
| **TOTAL** | | **~610h** |

---

## Risk Assessment

| Risk | Sprint | Impact | Mitigation |
|------|--------|--------|-----------|
| PostgreSQL setup delays | 1 | Blocks all work | Use Docker Compose, script setup |
| OAuth approval slow | 2 | Blocks user system | Apply early, use test account |
| Search performance poor | 3-4 | User experience | Index strategy, query optimization |
| Email deliverability issues | 5 | Notification failures | Use reputable provider (Resend) |
| CI/CD complexity | 7-8 | Deployment delays | Start CI/CD early, iterate |
| AdSense approval delays | 7-8 | Revenue blocked | Alternative ad networks |

---

## Quality Gates

**Each Sprint Must Pass**:
- [ ] All stories: acceptance criteria 100% met
- [ ] Code review: 2+ approvals (Dex + Aria)
- [ ] Tests: 70%+ coverage, all passing
- [ ] TypeScript: 0 errors (strict mode)
- [ ] Lint: 0 errors (ESLint, Prettier)
- [ ] Performance: Lighthouse score >=85

**End of Sprint Demos**:
- [ ] Running feature demo for stakeholders
- [ ] Retrospective: what went well, what to improve
- [ ] Backlog refinement for next sprint

---

## Success Metrics (MVP Launch)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Feature Completeness** | 100% of P0 features | Story completion rate |
| **Quality** | <5 critical bugs at launch | QA testing + production monitoring |
| **Performance** | Lighthouse >=90 | Lighthouse audit |
| **Availability** | 99.5% uptime | Monitoring (Week 1-4 post-launch) |
| **User Adoption** | 100 signups Week 1 | Analytics dashboard |
| **Code Quality** | 70%+ test coverage | Coverage report |

---

## Post-Launch Roadmap (Phase 2)

**Q3 2026 (August-September)**:
- [ ] Premium subscription feature
- [ ] Advanced analytics + ML recommendations
- [ ] Mobile native apps (React Native)
- [ ] Author monetization (affiliate links)
- [ ] Scheduled publishing + content calendar
- [ ] 2FA for user accounts

**Q4 2026 (October-December)**:
- [ ] CDN integration (Cloudflare)
- [ ] Image optimization (WebP, srcset)
- [ ] Multi-language support (Spanish, French)
- [ ] Video embedding + transcoding
- [ ] Subscription newsletters
- [ ] Community badges + gamification

---

## Communication Schedule

| Meeting | Frequency | Attendees | Purpose |
|---------|-----------|-----------|---------|
| **Sprint Planning** | Every 2 weeks (Mon 10am) | All | Plan upcoming sprint |
| **Daily Standup** | Weekdays (Mon-Fri 9:30am) | Dev team | Blockers, progress |
| **Sprint Demo** | Every 2 weeks (Fri 4pm) | All + stakeholders | Show completed work |
| **Retrospective** | Every 2 weeks (Fri 5pm) | Dev team | Lessons learned |
| **Tech Sync** | Weekly (Wed 2pm) | Architects, leads | Architecture decisions |

---

## Approval & Sign-Off

| Role | Sign-Off | Date |
|------|----------|------|
| **Product Manager (Morgan)** | ☐ | TBD |
| **Scrum Master (River)** | ☐ | TBD |
| **Tech Lead (Aria)** | ☐ | TBD |
| **Stakeholders** | ☐ | TBD |

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-16  
**Next Review**: 2026-05-12 (after Sprint 1)
