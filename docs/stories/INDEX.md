# Ctrl Alt News Portal — Stories & Epics Index

**Document**: `docs/stories/INDEX.md`  
**Status**: Draft  
**Last Updated**: 2026-04-16  
**Scrum Master**: River

---

## Quick Navigation

### Planning Documents

1. **[ROADMAP.md](./ROADMAP.md)** — 15-week development timeline, sprint breakdown, dependencies
   - Epic timeline visual
   - Resource allocation
   - Quality gates
   - Post-launch roadmap

2. **[SPRINT-BACKLOG.md](./SPRINT-BACKLOG.md)** — Sprint-by-sprint task list, daily standups, DoD
   - 8 sprint plans (Apr 28 - Aug 16)
   - Story assignments and progress tracking
   - Blockers and escalation
   - Definition of Done

---

## 8 Epics × 32 Stories

### EPIC 1: Backend Infrastructure & Database (Sprints 1-2)

**File**: [epic-1-backend-infrastructure.md](./epic-1-backend-infrastructure.md)

**Goal**: Production-grade Express.js server + PostgreSQL database foundation

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 1.1 | Express.js + TypeScript Setup | 8h (S) | @dev |
| 1.2 | PostgreSQL Schema + Prisma | 32h (L) | @data-engineer |
| 1.3 | Database Migrations + Seed | 16h (M) | @data-engineer |
| 1.4 | Error Handling + Logging | 8h (S) | @dev |

**Key Deliverables**:
- Express.js server on port 3000 (dev/prod)
- PostgreSQL with 10+ tables
- Prisma ORM configured
- Health check endpoints
- Structured logging and error handling

---

### EPIC 2: User Authentication & Authorization (Sprints 2-3)

**File**: [epic-2-authentication.md](./epic-2-authentication.md)

**Goal**: JWT + Google OAuth 2.0, user profiles, role-based access control

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 2.1 | JWT Implementation | 16h (M) | @dev |
| 2.2 | Google OAuth 2.0 Integration | 32h (L) | @dev |
| 2.3 | User Profiles & Settings | 16h (M) | @dev |
| 2.4 | Authorization Middleware | 8h (S) | @dev |

**Key Deliverables**:
- JWT tokens (15min access, 7day refresh)
- Google OAuth login working
- User profiles with settings
- ADMIN/EDITOR/USER role hierarchy
- Protected endpoints

---

### EPIC 3: Core Article Management (Sprints 3-4)

**File**: [epic-3-articles.md](./epic-3-articles.md)

**Goal**: Full REST API for articles, search, categories, publishing workflow

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 3.1 | Articles CRUD API | 32h (L) | @dev |
| 3.2 | Article Search & Filtering | 32h (L) | @dev |
| 3.3 | Category Management & Tags | 16h (M) | @dev |
| 3.4 | Drafts & Publishing Workflow | 16h (M) | @dev |

**Key Deliverables**:
- 20+ article endpoints
- Full-text search (<300ms)
- Category system (AI, Science, Robotics, Gadgets)
- Draft/publish workflow
- View counting

---

### EPIC 4: Comments & Engagement System (Sprints 4-5)

**File**: [epic-4-comments.md](./epic-4-comments.md)

**Goal**: Threaded comments, moderation, email notifications

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 4.1 | Comments CRUD API | 16h (M) | @dev |
| 4.2 | Comment Threading & Replies | 16h (M) | @dev |
| 4.3 | Comment Moderation Tools | 16h (M) | @dev |
| 4.4 | Email Notifications | 16h (M) | @dev |

**Key Deliverables**:
- Comments with nested replies (3-level limit)
- Moderation queue (PENDING/APPROVED/REJECTED)
- Email on comments + replies
- Spam detection rules
- User flagging system

---

### EPIC 5: Admin Dashboard & Analytics (Sprints 5-6)

**File**: [epic-5-admin.md](./epic-5-admin.md)

**Goal**: Admin interface for content, users, analytics

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 5.1 | Admin Authentication | 16h (M) | @dev |
| 5.2 | Article Management Dashboard | 32h (L) | @dev |
| 5.3 | User Management Dashboard | 16h (M) | @dev |
| 5.4 | Analytics Dashboard | 16h (M) | @dev |

**Key Deliverables**:
- Admin-only authentication & role checks
- Article CRUD interface (filters, bulk ops)
- User list (search, role change, deactivate)
- Analytics (views, comments, signups)
- Activity logging

---

### EPIC 6: UX/UI Compliance & Accessibility (Sprints 3-6, parallel)

**File**: [epic-6-ux-compliance.md](./epic-6-ux-compliance.md)

**Goal**: WCAG AA compliance, mobile responsiveness, design tokens, i18n

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 6.1 | WCAG AA Compliance | 32h (L) | @ux-design-expert |
| 6.2 | Mobile Responsiveness | 32h (L) | @ux-design-expert |
| 6.3 | Design Tokens | 16h (M) | @ux-design-expert |
| 6.4 | i18n Framework Setup | 16h (M) | @dev |

**Key Deliverables**:
- WCAG AA: 4.5:1 contrast, focus visible, ARIA labels
- Mobile: responsive 320px-2560px, no horizontal scroll
- Design tokens: colors, spacing, typography, shadows
- i18n: English + Portuguese (Brazil)

---

### EPIC 7: Performance & Deployment (Sprints 6-7)

**File**: [epic-7-performance.md](./epic-7-performance.md)

**Goal**: Caching, optimization, CI/CD pipeline, production readiness

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 7.1 | Redis Caching | 32h (L) | @data-engineer |
| 7.2 | Database Optimization | 16h (M) | @data-engineer |
| 7.3 | Frontend Code Splitting | 16h (M) | @dev |
| 7.4 | CI/CD Pipeline | 32h (L) | @devops |

**Key Deliverables**:
- Redis cache (article, category, search, session)
- Database indexes & query optimization (<300ms p99)
- Code splitting (bundle <150KB gzip)
- GitHub Actions: lint, test, build, deploy
- Zero-downtime deployments

---

### EPIC 8: Monetization & SEO (Sprints 7-8)

**File**: [epic-8-monetization.md](./epic-8-monetization.md)

**Goal**: Google AdSense, SEO optimization, analytics integration

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 8.1 | Google AdSense Integration | 16h (M) | @dev |
| 8.2 | Meta Tags & Schema | 16h (M) | @dev |
| 8.3 | Sitemaps & robots.txt | 8h (S) | @dev |
| 8.4 | Google Analytics 4 | 8h (S) | @dev |

**Key Deliverables**:
- Real AdSense ads (3 slots home, 1 article detail)
- Meta tags (OG, Twitter, canonical)
- JSON-LD structured data (Article, Organization, BreadcrumbList)
- XML sitemap + robots.txt
- GA4 tracking (page views, custom events, goals)

---

## Story Status Summary

**Total**: 32 stories across 8 epics

| Status | Count | Epics |
|--------|-------|-------|
| **Ready** | 32 | All |
| **In Progress** | 0 | — |
| **Blocked** | 0 | — |
| **Complete** | 0 | — |

---

## Key Metrics & Goals

### Timeline
- **Duration**: 15 weeks (8 × 2-week sprints)
- **Start**: Sprint 1 (Apr 28, 2026)
- **Launch**: Q3 2026 (end of Aug)

### Effort
- **Total**: ~610 hours
- **Team**: 3 developers @ 50% allocation
- **Sprint Velocity**: ~140 hours/sprint

### Quality
- **Test Coverage**: 70%+
- **TypeScript**: 0 errors (strict mode)
- **Linting**: ESLint + Prettier passing
- **Lighthouse**: >=90 (performance, accessibility)

### Performance
- **API Response**: <100ms avg, <300ms p99
- **Bundle Size**: <150KB gzip
- **LCP**: <2.5s
- **CLS**: <0.1

---

## How to Use These Documents

### For Project Managers

1. Read **ROADMAP.md** for timeline and milestones
2. Track progress using **SPRINT-BACKLOG.md**
3. Monitor quality gates and risk assessment

### For Developers

1. Find your epic in this INDEX
2. Read the epic file for context and acceptance criteria
3. Check **SPRINT-BACKLOG.md** for your assigned stories
4. Update story progress daily

### For QA/Testing

1. Read acceptance criteria in each epic
2. Use **SPRINT-BACKLOG.md** for Definition of Done
3. Run quality gates: tests, linting, TypeScript
4. Report bugs against specific stories

### For UX/Design

1. Focus on EPIC 6 (UX/UI Compliance)
2. Parallel work with development (Sprints 3-6)
3. Ensure design tokens used across all components

### For DevOps

1. Focus on EPIC 7 (Performance & Deployment)
2. Story 7.4: CI/CD pipeline
3. Manage production deployment and monitoring

---

## Dependencies & Blockers

### Critical Path

```
EPIC 1 (Infrastructure)
  ↓
EPIC 2 (Authentication) + EPIC 3 (Articles)
  ↓
EPIC 4 (Comments) + EPIC 5 (Admin)
  ↓
EPIC 7 (Performance & Deployment)
  ↓
EPIC 8 (Monetization & SEO)
```

### Parallel Work

- **EPIC 6 (UX/UI)** runs Sprints 3-6 (parallel with development)

### High-Risk Dependencies

| Risk | Impact | Sprint | Mitigation |
|------|--------|--------|-----------|
| PostgreSQL setup | Blocks EPIC 1 | Sprint 1 | Docker Compose |
| Google OAuth approval | Blocks EPIC 2 | Sprint 2 | Apply early |
| Search performance | User experience | Sprint 3-4 | Index strategy |
| Email service setup | Blocks EPIC 4 | Sprint 5 | Use Resend (reliable) |
| CI/CD complexity | Deployment delays | Sprint 7-8 | Start early |

---

## Decision Log

### Decided

- [ ] Technology stack: Express.js + PostgreSQL + Prisma + React 19
- [ ] Deployment: GitHub Actions + Railway/AWS
- [ ] Email service: Resend (modern, good DX)
- [ ] Cache: Redis (in-memory, fast)
- [ ] Admin framework: Custom (Radix UI)

### To Decide

- [ ] Specific cloud provider (Railway, Vercel, AWS, Render)
- [ ] CDN strategy (Cloudflare, Akamai)
- [ ] Monitoring tool (Sentry, DataDog, New Relic)
- [ ] Premium subscription model (Stripe integration)

---

## Success Criteria (MVP Launch)

- [ ] All 32 stories completed
- [ ] <5 critical bugs on day 1
- [ ] Lighthouse score >=90
- [ ] 99.5% uptime (Week 1)
- [ ] 100+ user signups (Week 1)

---

## Getting Help

### Questions About

| Topic | Contact |
|-------|---------|
| Epic scope/stories | River (@sm - Scrum Master) |
| Technical architecture | Aria (@architect) |
| Product direction | Morgan (@pm) |
| UX/UI design | Uma (@ux-design-expert) |
| DevOps/deployment | Gage (@devops) |
| Development | Dex (@dev) |
| Database design | Dara (@data-engineer) |

---

## Document Maintenance

- **Last Updated**: 2026-04-16
- **Next Review**: 2026-05-12 (after Sprint 1)
- **Owner**: River (Scrum Master)
- **Version**: 1.0

---

**For questions, contact: River (@sm) or Morgan (@pm)**
