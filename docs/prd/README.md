# Ctrl Alt News Portal — PRD Documentation

**Status**: Draft (Ready for Review)  
**Date**: 2026-04-16  
**Product Manager**: Morgan (AIOS PM Agent)  

---

## Quick Navigation

This folder contains the complete Product Requirements Documentation for the Brownfield transformation of Ctrl Alt News Portal from a prototype to a production-grade platform.

### 📄 Documents

#### 1. **brownfield-prd-v1.0.md** — Main PRD
The comprehensive product requirements document with all details.

**Sections**:
- Executive summary
- Feature comparison (current vs. professional standards)
- Backend requirements & API design
- Database schema
- Monetization strategy
- Prioritized feature backlog (MoSCoW)
- Scalability & architecture
- Deployment & DevOps
- Success metrics & KPIs
- Risk assessment
- Quarterly roadmap (Q2–Q4 2026)
- Acceptance criteria
- Competitive analysis

**Start here** for complete context.

**Time to read**: 45 minutes  
**Audience**: Product managers, stakeholders, architects

---

#### 2. **feature-gaps-analysis.md** — Detailed Gap Analysis
A breakdown of missing features compared to professional platforms.

**Sections**:
- Feature status (current vs. required)
- Critical gaps blocking MVP (8 features)
- High-priority gaps for professionalism (14 features)
- Implementation effort estimates (hours)
- Phased implementation plan
- Dependency graph
- Risk factors
- Feature checklist

**Use this** to understand scope and prioritization.

**Time to read**: 30 minutes  
**Audience**: Engineering leads, product managers

---

#### 3. **technical-strategy.md** — Architecture & Tech Stack
Technical decisions, implementation patterns, and system design.

**Sections**:
- Architecture overview (current vs. target)
- Technology stack selection (with rationale)
  - Express.js + TypeScript
  - PostgreSQL + Prisma
  - JWT authentication + OAuth
  - Redis caching
  - PostgreSQL full-text search
- API design & patterns
- Testing strategy (pyramid)
- Performance optimization
- Security (OWASP)
- Monitoring & observability
- Deployment architecture
- Decision log

**Use this** for engineering deep dives.

**Time to read**: 40 minutes  
**Audience**: Architects, senior engineers, tech leads

---

## Executive Summary (2 min read)

### Current State (Prototype)
- React 19 SPA with mock data
- 50 hardcoded articles in JavaScript
- Client-side routing (Wouter)
- Express.js serves SPA (no API)
- Placeholder ads (no revenue)
- No user accounts, no persistence

### Goal
Transform into professional blog platform (like Medium/Dev.to) with:
- Real backend API with PostgreSQL
- User authentication & profiles
- Persistent data (articles, comments, bookmarks)
- Real monetization (AdSense, premium tier)
- Scalability for 25K+ users

### Effort
- **MVP** (backend + auth + basic features): ~260 hours (6–8 weeks, 1 dev)
- **Professional** (includes SEO, email, analytics): ~400 hours (10–12 weeks)
- **Scalable** (includes premium, trending, admin): ~500+ hours (12+ weeks)

### Timeline
- **Q2 2026**: Build backend API, get to MVP
- **Q3 2026**: Launch with SEO, email, real AdSense; acquire 5K users
- **Q4 2026**: Scale to 25K users, launch premium tier, $5K/month revenue

### Tech Stack (Recommended)
**Frontend**: React 19, Vite, TypeScript, Tailwind CSS  
**Backend**: Express.js, TypeScript, PostgreSQL, Prisma ORM  
**Infrastructure**: Railway/AWS, Redis, CloudFront CDN  
**Testing**: Vitest, Jest, Playwright  
**Monitoring**: Sentry, Google Analytics, Datadog (optional)

---

## Key Metrics (Success Criteria)

### By Phase

#### Q2 MVP (8 weeks)
- [ ] 20+ API endpoints functional
- [ ] Database with 10 core tables
- [ ] User authentication working
- [ ] 60%+ test coverage
- [ ] Deploy to production

#### Q3 Launch (4 weeks)
- [ ] 5K users sign up
- [ ] $500–1K monthly ad revenue
- [ ] 150+ articles published
- [ ] 99.5% uptime
- [ ] <2.5s page load time (p95)

#### Q4 Growth (4 weeks)
- [ ] 25K users
- [ ] 500+ premium subscribers ($5K/month)
- [ ] 400+ articles
- [ ] $10K+ total monthly revenue
- [ ] 20+ active authors

---

## Feature Prioritization (MoSCoW)

### MUST HAVE (Critical, P0)
These are blocking production:
1. Backend REST API (20+ endpoints)
2. PostgreSQL database
3. User authentication (JWT + Google OAuth)
4. Real comments system (persistent)
5. Full-text search
6. Real AdSense integration
7. Admin/editor dashboard
8. Contact form backend

**Effort**: ~260 hours (6–8 weeks)  
**Timeline**: Sprint 1–4 (Q2 2026)

### SHOULD HAVE (High Priority, P1)
Important for professionalism & monetization:
- SEO optimization (meta tags, sitemaps, JSON-LD)
- Email system (newsletter, contact notifications)
- Image optimization (WebP, responsive, lazy load)
- Bilingual i18n framework
- Author program & profiles
- Trending & recommendations
- Testing infrastructure (unit + E2E)
- Performance optimization (caching, indexing)
- Deployment & CI/CD

**Effort**: ~200 hours (4–6 weeks)  
**Timeline**: Sprint 5–8 (Q3 2026)

### COULD HAVE (Medium Priority, P2)
Nice-to-have for scale & engagement:
- Premium subscription (Stripe)
- Real-time comments (WebSocket)
- Advanced analytics (heatmaps, session recording)
- Sponsored content program
- Advanced search filters
- API rate limiting & DDoS protection

**Effort**: ~150 hours (3–4 weeks)  
**Timeline**: Sprint 9–12 (Q4 2026)

### WON'T HAVE (Deliberately Out of Scope)
Explicitly excluded:
- Full paywalls (premium tier only)
- AI-generated content
- Cryptocurrency/NFTs
- Video platform or podcasts
- Mobile app (web app + PWA if needed)
- Live chat support

---

## Architecture Overview

### Current (Prototype)
```
Client (React)
    ↓ [static files]
Server (Express)
    ↓ [no API]
[No database]
```

### Target (Professional)
```
Client (React + React Query)
    ↓ [API calls + JWT]
API Server (Express + Prisma)
    ↓ [ORM queries]
PostgreSQL Database
    ↓ [caching]
Redis Cache
    ↓ [global CDN]
CloudFront
```

---

## Monetization Plan

### Must Have
- **Google AdSense**: 3 leaderboard banners (728×90)
  - Est. CPM: $2–10 (tech content)
  - Est. Monthly Revenue: $500–5K (at 10K users)

### Should Have
- **Premium Subscription**: $9.99/month
  - Features: Ad-free reading, exclusive articles, early access
  - Target: 5% conversion = 500 subscribers @ $99/year = $5K/month (year 1)

- **Sponsored Content**: $500–2K per article
  - 1–2 per month = $1K–2K additional revenue

### Could Have
- Newsletter sponsorships
- Affiliate links (Amazon, dev tools)
- Tips/donations

### Combined Target
- Q2: $0 (still building)
- Q3: $500–1K/month (AdSense only)
- Q4: $5K–10K/month (AdSense + premium + sponsored)

---

## Risk Summary

### Technical Risks
| Risk | Mitigation |
|---|---|
| Database corruption | Daily automated backups |
| API performance degrades | Redis caching + load testing |
| Search becomes slow | PostgreSQL GIN index + Elasticsearch optional |
| Security breach | HTTPS, hashed passwords, rate limiting, GDPR compliance |

### Product Risks
| Risk | Mitigation |
|---|---|
| Low user engagement | Focus on content quality, community management |
| AdSense rejection | Manual review, high editorial standards |
| Competition from Medium | Differentiate with niche (AI/tech), community, analytics |

### Operational Risks
| Risk | Mitigation |
|---|---|
| Team capacity limits | Prioritize ruthlessly (MoSCoW), no gold-plating |
| Scope creep | Define MVP strictly, defer "nice-to-have" features |

---

## Next Steps

### Immediate (This Week)
1. **Review PRD Documents** (1–2 hours)
   - Product team reviews brownfield-prd-v1.0.md
   - Engineering reviews feature-gaps-analysis.md + technical-strategy.md

2. **Approve Tech Stack** (30 min decision meeting)
   - Confirm: Express.js + PostgreSQL + Prisma
   - Confirm: Railway for hosting, Redis for cache
   - Confirm: GitHub Actions for CI/CD

3. **Lock MVP Scope** (30 min)
   - Confirm 8 critical features for MVP
   - Define Definition of Done
   - Identify any dependencies or blockers

### Week 2
4. **Create Stories & Epics** (AIOS @sm, @po)
   - Break down MVP into 4–5 epics (Database, API, Auth, etc.)
   - Create stories for each epic
   - Estimate effort per story

5. **Setup Development Environment**
   - Create PostgreSQL database (local + staging)
   - Setup Express.js project structure
   - Initialize Prisma with migrations
   - Configure GitHub Actions CI/CD template

### Week 3–4
6. **Begin Sprint 1** (@dev)
   - Database schema + migrations
   - Basic API scaffolding
   - First 5 CRUD endpoints
   - Authentication setup

---

## Document Overview

| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| **brownfield-prd-v1.0.md** | Complete PRD with all details | Product, Leadership | 45 min |
| **feature-gaps-analysis.md** | Detailed feature gaps & effort | Engineering, PM | 30 min |
| **technical-strategy.md** | Architecture, tech stack, patterns | Architects, Devs | 40 min |
| **README.md** (this file) | Navigation & executive summary | Everyone | 5 min |

---

## Contact & Questions

**Product Manager**: Morgan (AIOS PM Agent)  
**Architecture Lead**: Aria (AIOS Architect) — pending review  
**Engineering Lead**: Dex (AIOS Dev) — pending review  

**Slack Channel**: #ctrl-alt-news-brownfield  
**GitHub Repo**: `https://github.com/.../ctrl-alt-news-portal` (private)

---

## Approval Status

| Role | Name | Status | Date |
|------|------|--------|------|
| **Product Manager** | Morgan | ✓ Draft Complete | 2026-04-16 |
| **Architect** | Aria | ⏳ Pending | — |
| **Engineering Lead** | Dex | ⏳ Pending | — |
| **Stakeholder** | Regis | ⏳ Pending | — |

**Next Gate**: Architecture review with @architect & @dev (tentative: April 23, 2026)

---

## Document Version

**Version**: 1.0 (Draft)  
**Created**: 2026-04-16  
**Last Updated**: 2026-04-16  
**Status**: Draft — Awaiting Technical Review  

**Change Log**:
- 2026-04-16: Initial draft complete (3 documents, 1500+ lines)

---

## How to Use This Documentation

### For Product Managers
1. Read: **brownfield-prd-v1.0.md** (executive summary + feature backlog)
2. Use for: Sprint planning, stakeholder communication, roadmap decisions

### For Architects
1. Read: **technical-strategy.md** (architecture + tech stack)
2. Review: **feature-gaps-analysis.md** (effort estimates)
3. Use for: Architecture decisions, technology selection, design reviews

### For Engineering Leads
1. Read: **feature-gaps-analysis.md** (scope + effort)
2. Read: **technical-strategy.md** (implementation patterns)
3. Read: **brownfield-prd-v1.0.md** Section 11 (acceptance criteria)
4. Use for: Sprint planning, code review guidelines, testing strategy

### For Developers
1. Read: **technical-strategy.md** (API design, testing, patterns)
2. Review: **brownfield-prd-v1.0.md** Section 2 (API specifications)
3. Use for: Implementation reference, code patterns, testing guidelines

### For Stakeholders
1. Read: **brownfield-prd-v1.0.md** sections: Executive Summary, Monetization, Timeline, KPIs
2. Use for: Business decisions, investor updates, budget allocation

---

## Supporting Documents

These PRD documents reference the existing architecture documentation:
- `docs/brownfield-architecture.md` — Current system state (LEIA PRIMEIRO)
- `.aios-core/constitution.md` — AIOS framework rules
- `package.json` — Current dependencies and build setup

---

## License & Attribution

Generated by Morgan (AIOS PM Agent) using the Synkra AIOS framework.  
Ctrl Alt News Portal © 2026 — All Rights Reserved.

---

**Ready for review. Submit PRD for architectural approval by April 22, 2026.**
