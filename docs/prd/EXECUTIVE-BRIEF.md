# Ctrl Alt News Portal — Executive Brief
**One-Page Roadmap for Leadership**

---

## Current State
- **React 19 prototype** with 50 mock articles (no database)
- **Zero revenue** (AdSense placeholders only)
- **Zero users** (can't create accounts)
- **Zero persistence** (data lost on reload)

---

## Vision
Transform into **professional blog platform** (like Medium/Dev.to) with:
- Real backend API + PostgreSQL database
- 25K+ users in 12 months
- $10K+/month revenue
- 400+ published articles
- 20+ active authors

---

## Timeline & Milestones

### Q2 2026 (April–June): Build MVP Backend
**Goal**: Get from prototype to production-ready API  
**Effort**: 260 hours (6–8 weeks, 1 dev)  
**Deliverable**: Full API, real data, user authentication

**Milestones**:
- Week 2: Database schema + migrations finalized
- Week 4: User authentication working (JWT + Google OAuth)
- Week 6: All CRUD endpoints live, admin dashboard functional
- Week 8: Deploy to production, zero critical bugs

**Success Criteria**:
- ✓ 20+ API endpoints working
- ✓ 60%+ test coverage
- ✓ API response time <300ms (p95)
- ✓ Deploy pipeline automated (GitHub Actions)

---

### Q3 2026 (July–Sept): Launch & Acquire 5K Users
**Goal**: Go live, start monetization, build community  
**Effort**: 200 hours (4–6 weeks, 1 dev)  
**Deliverable**: SEO optimized, real AdSense, email system

**Milestones**:
- Week 1: SEO optimization complete (meta tags, sitemaps, JSON-LD)
- Week 2: Real AdSense integrated (no more placeholders)
- Week 3: Email newsletter system live
- Week 4: Marketing campaign launch

**Success Criteria**:
- ✓ 5K users sign up
- ✓ 150+ articles published
- ✓ $500–1K monthly ad revenue
- ✓ 99.5% uptime
- ✓ <2.5s page load time

---

### Q4 2026 (Oct–Dec): Scale to 25K Users + Monetization
**Goal**: Reach 25K users, $10K+/month revenue, establish author network  
**Effort**: 150 hours (3–4 weeks, 1 dev)  
**Deliverable**: Premium subscription, advanced features

**Milestones**:
- Week 1: Premium subscription tier live (Stripe)
- Week 2: Author dashboard + verification program
- Week 3: Sponsored content program ready
- Week 4: Year-end retrospective + 2027 planning

**Success Criteria**:
- ✓ 25K users
- ✓ 500+ premium subscribers ($5K/month)
- ✓ $2K–3K monthly sponsored revenue
- ✓ 400+ articles published
- ✓ 20+ active authors

---

## Investment Summary

### Effort
- **MVP**: 260 hours (6–8 weeks)
- **Launch**: 200 hours (4–6 weeks)
- **Scale**: 150 hours (3–4 weeks)
- **Total Year 1**: ~610 hours (15–18 weeks, 1 full-time dev)

### Infrastructure Costs (Monthly)
| Item | Cost | Notes |
|------|------|-------|
| Database (Railway RDS) | $15–50 | Scales with usage |
| Cache (Redis) | $10–20 | Optional, recommended |
| CDN (CloudFront) | $5–30 | Pay-per-bandwidth |
| Email (SendGrid) | $10–20 | 100K emails/month |
| Monitoring (Sentry) | $29 | Error tracking |
| **Total** | **~$70–150/mo** | Very low initial cost |

### Revenue Projections
| Quarter | Users | Articles | Ad Revenue | Premium Revenue | Sponsored Revenue | **Total** |
|---------|-------|----------|------------|-----------------|------------------|----------|
| Q2 | — | — | — | — | — | **$0** |
| Q3 | 5K | 150 | $500–1K | $0 | $0 | **$500–1K** |
| Q4 | 25K | 400 | $3K–5K | $5K | $2K–3K | **$10K–13K** |

---

## Key Decisions

### Technology Stack (Recommended)
✓ **Frontend**: React 19, Vite, TypeScript, Tailwind CSS  
✓ **Backend**: Express.js, TypeScript, PostgreSQL, Prisma ORM  
✓ **Infrastructure**: Railway (MVP) / AWS (Scale), Redis, CloudFront  
✓ **Deployment**: GitHub Actions (CI/CD)  

### Monetization Strategy
✓ **Tier 1**: Google AdSense (must-have, $500–5K/mo)  
✓ **Tier 2**: Premium subscription (should-have, $5K/mo)  
✓ **Tier 3**: Sponsored content (could-have, $2K–3K/mo)  

### MVP Scope (Non-Negotiable)
✓ Backend REST API (20+ endpoints)  
✓ PostgreSQL database (10 core tables)  
✓ User authentication (JWT + Google OAuth)  
✓ Real comments system (persistent)  
✓ Full-text search  
✓ Admin/editor dashboard  

---

## Critical Success Factors

1. **Data Persistence** (Q2)
   - Without database, can't scale beyond prototype
   - Blocks all user-facing features

2. **User Authentication** (Q2)
   - Without logins, can't personalize or monetize
   - Foundation for all engagement

3. **Content Quality** (Ongoing)
   - Platform is only as good as articles
   - Need 5–8 new articles per week
   - Recruit 5–10 quality authors in Q3

4. **Marketing & Acquisition** (Q3)
   - Platform is ready, but need users
   - Budget: SEO, social media, partnerships
   - Target: 5K users in Q3 launch month

5. **Monetization Focus** (Q3–Q4)
   - Real AdSense (not placeholders)
   - Premium tier (Stripe integration)
   - Sponsored content relationships

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Tech delays** (API not ready) | Blocks launch | 260-hour estimate + buffer, weekly sprints |
| **Low engagement** (users don't return) | Revenue fails | Focus on content quality, email retention |
| **AdSense rejection** (account denied) | No ad revenue | Manual review, high editorial standards |
| **Competition** (Medium, Dev.to, Substack) | Market share | Differentiate: niche (AI/tech), bilingual, community |

---

## Go/No-Go Decision Criteria

### Go Forward If:
- ✓ Tech stack approved by @architect (April 22)
- ✓ Commitment: 1 FTE dev for 12+ months
- ✓ Budget: ~$1K/month infrastructure + marketing
- ✓ Content plan: 5–8 articles/week secured
- ✓ Author network: 5–10 committed writers

### Pause/Pivot If:
- ✗ Can't secure 1 FTE dev
- ✗ Q2 MVP delays >6 weeks
- ✗ Can't recruit 5+ quality authors
- ✗ Content quality doesn't meet market standards

---

## Next Steps

### This Week (April 16–20)
1. **Review** PRD documents (README.md → others)
2. **Approve** technology stack
3. **Lock** MVP scope

### Week of April 22
4. **Architecture review** with @architect (@dev present)
5. **Create epics** (@sm) from MVP scope
6. **Setup** development environment

### Week of April 29
7. **Sprint 1 kickoff** — Begin backend implementation
8. **Weekly standups** (Tuesday 10am)
9. **Sprint reviews** (Friday 4pm)

---

## Questions & Approvals

**Product**: Morgan ✓ (PRD author)  
**Architecture**: Aria ⏳ (Pending review April 22)  
**Engineering**: Dex ⏳ (Pending review April 22)  
**Stakeholder**: Regis ⏳ (Awaiting go/no-go decision)

---

## Key Metrics Dashboard (Track Monthly)

| Metric | Q2 Target | Q3 Target | Q4 Target |
|--------|-----------|-----------|-----------|
| Users | 0 → 100 | 5K | 25K |
| Articles | 50 (mock) | 150 | 400 |
| DAU | 0 | 500 | 2K |
| Monthly Revenue | $0 | $1K | $10K |
| Uptime | — | 99.5% | 99.9% |
| API Response Time (p95) | — | <300ms | <200ms |
| Test Coverage | 60% | 70% | 80% |

---

## Appendix: What Success Looks Like (Year 1)

**In 12 months**, Ctrl Alt News Portal is:
- **Professional**: Competes with Medium, Dev.to on feature parity
- **Profitable**: $10K+/month revenue, covers costs 2x over
- **Growing**: 25K monthly users, 20+ active authors
- **Scalable**: API handles 10x growth, infrastructure ready for 100K users
- **Community-driven**: NPS >40, strong author network, engaged readers

---

**Document**: Executive Brief v1.0  
**Status**: Draft  
**Date**: 2026-04-16  
**Next Review**: April 22, 2026 (architecture review)

---

**READY FOR STAKEHOLDER DECISION**
