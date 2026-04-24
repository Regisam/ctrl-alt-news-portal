# EPIC 8: Monetization & SEO Optimization

**Epic ID**: EPIC-8  
**Status**: Draft  
**Sprints**: 7-8 (50 hours)  
**Priority**: P1 (High)  
**Product Manager**: Morgan  
**Technical Lead**: Aria (Architect)  
**Date Created**: 2026-04-16

---

## Epic Summary

Implement real Google AdSense integration, SEO optimization (meta tags, structured data, sitemaps), and analytics tracking. Monetize platform while ensuring discoverability through search engines.

**Rationale**: Revenue generation and organic traffic growth (PRD section 2.5 - Monetization, section 2.8 - Analytics).

**Success Criteria**:
- [ ] Google AdSense real ads displaying
- [ ] Meta tags and Open Graph tags on all pages
- [ ] JSON-LD structured data for articles
- [ ] XML sitemaps generated and submitted
- [ ] Google Analytics 4 tracking configured
- [ ] robots.txt and meta robots tags
- [ ] Core Web Vitals optimized
- [ ] Organic traffic metrics dashboard

---

## Story 8.1: Google AdSense Real Integration

**Status**: Ready  
**Sprint**: 7  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Replace AdSense placeholder banners with real Google AdSense integration. Configure ad slots, implement responsive ad sizing, and track revenue.

**Reference**: PRD section 2.5 (Monetization), Current implementation has 3 ad placeholders on home page

### Acceptance Criteria

- [ ] Google AdSense account setup (approval process)
- [ ] Real ad code integrated into ad slots
- [ ] Three ad slots on home page: top (728x90), between carousels (728x90), sidebar (300x600)
- [ ] One ad slot on article detail page (leaderboard 728x90)
- [ ] Ads responsive (adapt to viewport width)
- [ ] Ad performance tracked (impressions, clicks, revenue)
- [ ] No overlap between ads and content
- [ ] Ads load asynchronously (don't block page)
- [ ] Fallback content if ads don't load
- [ ] Revenue dashboard in admin panel (optional, Phase 2)

### Tasks

1. Apply for Google AdSense account and wait for approval
2. Create ad slots in AdSense console
3. Replace placeholder banners with real AdSense code
4. Configure responsive ad sizing (responsive.js)
5. Test ad loading and display
6. Implement ad performance tracking
7. Create fallback content (gray box with text)
8. Verify ads on staging environment
9. Monitor ad performance metrics
10. Document ad strategy (placement, frequency)

### Dependencies

- **Blocked by**: Story 7.3 (frontend optimized)
- **Blocks**: None

### Notes

- AdSense approval: usually 2-3 weeks, requires domain
- Ad sizes: 728x90 (leaderboard), 300x600 (sidebar), 300x250 (medium rectangle)
- Responsive ads: use `data-ad-format="auto"` or `data-full-width-responsive="true"`
- Load ads async: `async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"`
- Consider alternative ad networks later (Phase 2)

---

## Story 8.2: Meta Tags & Schema.org Structured Data

**Status**: Ready  
**Sprint**: 7-8  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement SEO-critical meta tags and structured data markup (JSON-LD). Improve search engine indexing and rich snippet display.

**Reference**: PRD section 2.6 (SEO optimization), Technical Strategy section 4.2

### Acceptance Criteria

- [ ] Global meta tags: title, description, viewport, charset
- [ ] Open Graph tags: og:title, og:description, og:image
- [ ] Twitter Card tags: twitter:card, twitter:creator
- [ ] Canonical URLs to prevent duplicate content
- [ ] JSON-LD Article schema on article detail pages
- [ ] JSON-LD Organization schema in header
- [ ] JSON-LD BreadcrumbList on category pages
- [ ] Article meta: author, datePublished, dateModified, images
- [ ] Mobile: viewport, app-icons, theme-color
- [ ] Dynamic meta tags (updated per page/article)

### Tasks

1. Create meta tag helper (`lib/seoHelpers.ts`)
2. Add global meta tags to HTML head
3. Implement dynamic meta tags per page (route)
4. Create JSON-LD Article schema component
5. Create JSON-LD Organization schema
6. Create JSON-LD BreadcrumbList
7. Add canonical URLs to prevent duplication
8. Test with Google Rich Results Test tool
9. Validate structured data with Schema.org validator
10. Monitor search console for indexing

### Dependencies

- **Blocked by**: Story 3.1 (articles CRUD ready)
- **Blocks**: Story 8.3

### Notes

- Meta tags: per-route configuration (React Helmet or similar)
- JSON-LD: embed in `<script type="application/ld+json">`
- Canonical URL: essential to avoid duplicate content penalties
- Open Graph: for social sharing (Facebook, LinkedIn, etc.)
- Twitter Cards: for Twitter link preview
- Test with: Google Rich Results, Schema.org validator

---

## Story 8.3: Sitemap & robots.txt Generation

**Status**: Ready  
**Sprint**: 8  
**Effort**: S (8 hours)  
**Owner**: @dev (Dex)

### Description

Generate XML sitemaps for search engine crawlers and configure robots.txt to guide crawler behavior.

**Reference**: PRD section 2.6 (SEO - sitemaps)

### Acceptance Criteria

- [ ] `robots.txt` created with crawl rules
- [ ] XML sitemap generated: `/sitemap.xml`
- [ ] Sitemap includes all published articles
- [ ] Sitemap excludes drafts and archived articles
- [ ] Sitemap indexes (max 50K URLs per sitemap): `/sitemap-index.xml`
- [ ] Sitemap includes: lastmod, changefreq, priority
- [ ] robots.txt disallows: `/admin`, `/auth`, `/drafts`
- [ ] Sitemap auto-updated when articles published
- [ ] Sitemap submitted to Google Search Console
- [ ] Performance: sitemap generation < 1 second

### Tasks

1. Create sitemap service (`services/sitemapService.ts`)
2. Implement XML sitemap generation
3. Implement sitemap index (for 50K+ articles)
4. Create robots.txt file
5. Add caching to sitemap (regenerate on article update)
6. Add sitemap endpoint: `GET /sitemap.xml`, `GET /sitemap-index.xml`
7. Add robots.txt endpoint: `GET /robots.txt`
8. Test sitemap validity (online validators)
9. Submit sitemap to Google Search Console
10. Monitor sitemap updates

### Dependencies

- **Blocked by**: Story 8.2 (structured data ready)
- **Blocks**: None

### Notes

- Sitemap size limit: 50K URLs, 50MB gzip
- Update frequency: `weekly` for articles, `daily` for home
- Priority: `1.0` for home, `0.8` for articles, `0.5` for archives
- Robots.txt: simple text file, not XML
- Disallow rules: `/admin`, `/auth`, `/search` (avoid duplicate content)

---

## Story 8.4: Google Analytics 4 & Conversion Tracking

**Status**: Ready  
**Sprint**: 8  
**Effort**: S (8 hours)  
**Owner**: @dev (Dex)

### Description

Integrate Google Analytics 4 (GA4) to track user behavior, page views, and engagement metrics. Setup conversion events for business goals.

**Reference**: PRD section 2.8 (Analytics), Technical Strategy section 4.2

### Acceptance Criteria

- [ ] Google Analytics 4 property created and configured
- [ ] GA4 tracking code added to frontend
- [ ] Page views tracked automatically
- [ ] Custom events: article_view, comment_posted, ad_impression
- [ ] User engagement tracked: scroll depth, time on page
- [ ] Goals/conversions: newsletter signup, ad clicks
- [ ] User sessions tracked (via GA4 session ID)
- [ ] Dimensions: article_category, article_author, user_role
- [ ] Analytics dashboard accessible in admin panel
- [ ] Privacy: GDPR compliance (no PII collected)

### Tasks

1. Create Google Analytics property (GA4)
2. Add GA4 tracking code to frontend
3. Configure page view tracking
4. Create custom event tracking (`lib/analytics.ts`)
5. Track article views (with article ID, category)
6. Track comments posted
7. Track ad impressions/clicks
8. Configure goals/conversions
9. Create analytics dashboard mock-up
10. Verify tracking with Google Analytics real-time

### Dependencies

- **Blocked by**: Story 3.1 (articles ready)
- **Blocks**: None

### Notes

- GA4 tracking: embed `gtag.js` in page head
- Custom events: use `gtag('event', 'event_name', data)`
- Session tracking: GA4 auto-generates session ID
- GDPR compliance: don't track PII (email, names) directly
- Dimensions: create custom dimensions in GA4 config
- Dashboard: integrate GA4 API (optional, Phase 2)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| AdSense approval | Within 30 days | To monitor |
| SEO coverage | 100% of articles indexed | To verify |
| Sitemap validation | 0 errors | To verify |
| GA4 events tracked | 95%+ accuracy | To measure |
| Organic traffic growth | 20% MoM | To monitor |

---

## Epic Dependencies & Timeline

```
Sprint 7:
├── Story 8.1 (AdSense) ────┬──> Story 8.2 (Meta Tags)
│                           │
└───────────────────────────┘

Sprint 8:
├── Story 8.2 complete
├── Story 8.3 (Sitemaps) ───┬──> Story 8.4 (GA4)
│                           │
└───────────────────────────┘
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AdSense approval delays | Revenue blocked | Apply early, use alternative networks |
| SEO penalties | Indexing issues | Use canonical URLs, avoid duplicate content |
| Analytics data quality | Unreliable metrics | Validate tracking, test events |

---

## Appendix: Files to Create/Modify

**New Files**:
- `server/routes/seo.ts` (sitemap, robots.txt)
- `server/services/sitemapService.ts`
- `lib/seoHelpers.ts` (meta tags)
- `lib/analytics.ts` (GA4 events)
- `components/AnalyticsProvider.tsx`
- `public/robots.txt`

**Modified Files**:
- `client/src/App.tsx` (GA4 script, meta tag provider)
- `client/src/pages/*.tsx` (dynamic meta tags)
- `server/index.ts` (sitemap endpoints)
- `package.json` (google-analytics, xml dependencies)

**New Dependencies**:
```json
{
  "gtag": "^0.x",
  "js-sitemap": "^1.x"
}
```

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Aria (Architect)
