# EPIC-10: Growth & Discovery — SEO + Social Sharing

**Epic ID**: EPIC-10  
**Sprint**: 12-13 (Growth & Discovery)  
**Status**: Draft  
**Date Created**: 2026-04-24  
**Owner**: @pm (Morgan)  
**Epic Type**: Growth & User Acquisition

---

## Vision

Enable organic traffic growth and viral sharing by optimizing for search engines and social platforms. Make every article discoverable via Google and shareable across social networks. Increase user acquisition by 3-5x through improved SEO and social discovery.

**Business Value**:
- 📈 Organic traffic growth (Google, Bing, DuckDuckGo)
- 🔗 Viral sharing potential (Facebook, Twitter, LinkedIn, WhatsApp)
- 📱 Mobile-first discoverability
- 💰 Lower acquisition cost (organic vs paid)
- 🎯 Better user targeting via rich previews
- ⏱️ Improved page performance (SEO ranking factor)

---

## Strategic Context

**Prerequisite Completion**: EPIC-9 (Testing & QA) ✅
- Stable codebase with test coverage → ready for scaling
- CI/CD gates enforcing quality → safe to iterate
- Performance baselines established → foundation for optimization

**Dependency Chain**:
```
EPIC-9 (Testing & QA) ✅
    ↓
EPIC-10 (Growth & Discovery) ← YOU ARE HERE
    ↓
EPIC-11 (Advanced Analytics & Personalization)
    ↓
EPIC-12+ (Platform Expansion)
```

**Market Context**:
- News portals depend on SEO for 40-60% of traffic
- Social sharing drives 20-30% of traffic for content platforms
- Meta tags & Open Graph essential for link previews
- Core Web Vitals affect Google ranking (mobile experience critical)

---

## Scope Definition

### IN Scope (MVP)

**Search Engine Optimization (SEO)**:
- Meta tags (title, description, keywords per article)
- Open Graph tags for social previews
- Twitter Card tags for Twitter sharing
- Structured data (schema.org JSON-LD for articles)
- Sitemap.xml generation
- robots.txt configuration
- Canonical URLs (prevent duplicate content)
- Mobile-first responsive design optimization
- Core Web Vitals monitoring (LCP, FID, CLS)
- Internal linking strategy for article discovery

**Social Sharing**:
- Share buttons (Facebook, Twitter, LinkedIn, WhatsApp, email)
- Dynamic social previews (title, image, description)
- OG image generation or custom per-article
- Twitter Card integration (summary_large_image)
- WhatsApp custom sharing text
- Email share with pre-filled subject/body
- Copy link to clipboard functionality

**Performance Optimization**:
- Image optimization (WebP, lazy loading)
- Code splitting per route
- CSS/JS minification verification
- CDN integration (if applicable)
- Browser caching headers
- Gzip compression

**Analytics & Monitoring**:
- Google Search Console integration
- Google Analytics 4 enhanced tracking
- Social share event tracking
- CTR monitoring (click-through rate)
- Bounce rate tracking
- Time on page metrics

### OUT of Scope

- Paid advertising setup (separate epic)
- Email marketing automation (separate epic)
- Influencer partnerships (marketing ops)
- Advanced personalization (EPIC-11)
- A/B testing framework (EPIC-11)
- Social media posting automation

---

## Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| **Organic Traffic** | +200% in 3 months | Google Analytics organic sessions |
| **Social Shares** | 2+ shares per article avg | Social share event tracking |
| **SEO Rankings** | Top 3 for target keywords | Google Search Console position data |
| **Page Speed** | <2s load (desktop), <3s (mobile) | Lighthouse score >90, Core Web Vitals green |
| **Click-Through Rate (CTR)** | +150% from search results | Google Search Console CTR metric |
| **Bounce Rate** | <50% organic traffic | Google Analytics bounce rate |
| **Mobile Performance** | 95+ Lighthouse mobile score | Lighthouse testing |
| **Social Preview Quality** | 100% articles with rich preview | Manual validation + automation |

---

## Stories (Planned)

### Phase 1: SEO Foundation (Stories 10.1-10.3)
- 10.1: Meta Tags & Open Graph Implementation
- 10.2: Structured Data & Schema.org
- 10.3: Sitemap & Robots Configuration

### Phase 2: Social Sharing (Stories 10.4-10.6)
- 10.4: Social Share Buttons Integration
- 10.5: Dynamic Social Previews
- 10.6: Share Analytics & Tracking

### Phase 3: Performance Optimization (Stories 10.7-10.9)
- 10.7: Image Optimization & Lazy Loading
- 10.8: Core Web Vitals Optimization
- 10.9: Code Splitting & Asset Optimization

### Phase 4: Analytics & Monitoring (Stories 10.10-10.11)
- 10.10: Google Search Console Integration
- 10.11: Social & SEO Analytics Dashboard

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **SEO changes break internal links** | HIGH | MEDIUM | Automated link validation tests |
| **OG tags not rendering correctly** | MEDIUM | MEDIUM | Manual social preview testing |
| **Performance regression from changes** | MEDIUM | HIGH | Lighthouse CI checks, Core Web Vitals monitoring |
| **Image optimization breaks quality** | LOW | LOW | Compression testing, visual QA |
| **Analytics tracking conflicts** | MEDIUM | LOW | GA4 event testing, no duplicate tracking |
| **Mobile layout breaks with optimization** | MEDIUM | MEDIUM | Responsive testing on all breakpoints |

---

## Dependencies

- **Blocked by**: EPIC-9 (Testing & QA) ✅ — Need stable test infrastructure
- **Blocks**: EPIC-11 (Advanced Analytics) — Provides baseline metrics
- **Related**: All content/article pages in codebase
- **Requires**: Google Search Console access, Google Analytics setup, social platform API knowledge

---

## Quality Gates (CodeRabbit Integration)

**Pre-Implementation**:
- [ ] SEO audit of current site (baseline)
- [ ] Competitive SEO analysis (keyword research)
- [ ] Core Web Vitals baseline measurement
- [ ] Social sharing audit (current state)

**Per Story**:
- [ ] All tests passing (unit + integration + E2E)
- [ ] No TypeScript errors
- [ ] ESLint passing
- [ ] CodeRabbit: 0 CRITICAL, <5 HIGH issues
- [ ] Lighthouse score ≥90 (mobile & desktop)
- [ ] Core Web Vitals all GREEN
- [ ] Social preview validation (manual testing)
- [ ] Google Search Console indexability check

**Post-Epic**:
- [ ] SEO ranking improvement documented (top 3 keywords)
- [ ] Organic traffic growth >200% (baseline to post-epic)
- [ ] Average shares per article ≥2
- [ ] Mobile Lighthouse score ≥95
- [ ] All Core Web Vitals <100ms (LCP), <100ms (FID), <0.1 (CLS)

---

## Specialized Agent Assignments

| Task | Assigned Agent | Rationale |
|------|-----------------|-----------|
| SEO Implementation | @dev | Code changes for meta tags, schema |
| Performance Testing | @qa | Lighthouse, Core Web Vitals validation |
| Analytics Setup | @architect | GA4 event architecture design |
| Mobile Optimization | @dev | Responsive design & performance tuning |
| Social Preview Testing | @qa | Cross-platform social preview validation |

---

## Key Questions Answered

**Q: Why focus on SEO + Social before personalization?**  
A: 80/20 rule — organic discovery (SEO + social) captures 60% of growth opportunity with 20% effort. Personalization comes after acquiring users.

**Q: What about paid ads?**  
A: Organic growth is lower-cost, sustainable long-term. Paid ads are secondary channel (future epic).

**Q: How does this connect to EPIC-11?**  
A: EPIC-10 brings users in via discovery. EPIC-11 keeps them through personalization & recommendations.

**Q: Timeline?**  
A: 2 sprints (12-13) = 4 weeks. 11 stories, ~2-3 per sprint.

---

## Change Log

| Date | Agent | Action | Notes |
|------|-------|--------|-------|
| 2026-04-24 | @pm (Morgan) | Epic Created | EPIC-10 drafted, ready for story creation |

---

*Last Updated: 2026-04-24*  
*Status: Draft*
