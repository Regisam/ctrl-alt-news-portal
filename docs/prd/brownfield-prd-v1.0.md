# Ctrl Alt News Portal — Brownfield PRD v1.0
**Product Requirement Document — Transforming into a Professional, Scalable Blog Platform**

**Document**: `docs/prd/brownfield-prd-v1.0.md`  
**Status**: Draft  
**Last Updated**: 2026-04-16  
**Product Manager**: Morgan (AIOS PM Agent)  
**Stakeholders**: Development Team, Technical Leadership, Content Team  

---

## Executive Summary

**Ctrl Alt News Portal** is a React 19 + Express.js SPA currently in **prototype stage** with mock data, client-side routing, and design placeholders. This PRD outlines the transformation into a **professional, production-grade blog platform** comparable to Medium, Dev.to, and Hacker News.

### Current State (Prototype)
- Single-page app with 50+ mock articles
- No backend API (data hardcoded in client)
- No database persistence
- Placeholder AdSense ads (728×90 leaderboard banners)
- Bilingual UI (EN/PT-BR)
- Cyberpunk brutalism aesthetic
- No user authentication
- No real comments, search, or contact functionality

### Target State (Professional Platform)
- Production-grade REST API with full CRUD operations
- PostgreSQL database with optimized schema
- Real user authentication (OAuth 2.0 + JWT)
- Full-text search across articles
- Persistent comments & discussion threads
- Real AdSense integration + premium monetization
- Email notifications & contact system
- Performance optimizations (caching, CDN, code splitting)
- SEO optimization (meta tags, Open Graph, sitemaps)
- Analytics integration (Google Analytics)
- Deployment readiness (CI/CD, monitoring, error tracking)

---

## 1. Features Analysis: Current vs. Professional Standards

### 1.1 Features Currently Implemented

| Feature | Status | Completeness | Notes |
|---------|--------|--------------|-------|
| **Core** | | | |
| Home Page | ✓ | 85% | Hero, 4 category carousels, trending, gadgets |
| Article Detail Page | ✓ | 70% | Content display, no persistence, mock comments |
| Category Pages | ✓ | 80% | AI, Science, Robotics, Gadgets grids |
| Search Page | ✓ | 5% | UI only, no backend implementation |
| Theme System | ✓ | 100% | Dark/light mode working |
| **Monetization** | | | |
| AdSense Banners | ✓ | 30% | Placeholders only, not connected |
| Gadgets/Affiliate | ✓ | 50% | Mock products, fake Amazon URLs |
| **Social** | | | |
| Comments Section | ✓ | 10% | UI mock only, no persistence |
| Social Sharing | ✗ | 0% | Not implemented |
| **Content Management** | | | |
| Article Display | ✓ | 70% | Mock data in client |
| Bilingual Support | ✓ | 60% | Manual EN/PT-BR in components |
| **User Features** | | | |
| User Accounts | ✗ | 0% | Not implemented |
| Authentication | ✗ | 0% | No OAuth/JWT |
| Reading List | ✗ | 0% | Not implemented |
| User Preferences | ✓ | 30% | Theme only |
| **Email** | | | |
| Contact Form | ✓ | 20% | UI only, doesn't submit |
| Notifications | ✗ | 0% | No email service |
| Newsletter Signup | ✗ | 0% | Not implemented |

### 1.2 Features Missing (vs. Professional Platforms)

**Industry Standard Features (Medium, Dev.to, Hacker News)**

| Feature Category | What's Missing | Impact | Priority |
|------------------|---|---|---|
| **Backend API** | REST API endpoints, database CRUD, validation | CRITICAL | P0 |
| **Content Management** | CMS for editors, drafts, scheduled publishing | HIGH | P1 |
| **User System** | Auth, profiles, follow/subscribe, reading history | CRITICAL | P0 |
| **Discovery** | Advanced search (full-text, filters), trending, recommendations | HIGH | P1 |
| **Engagement** | Real comments, reactions (like/clap), bookmarks | CRITICAL | P0 |
| **Monetization** | Real AdSense, premium subscriptions, sponsored content | MEDIUM | P1 |
| **SEO** | Meta tags, sitemaps, structured data (JSON-LD) | MEDIUM | P1 |
| **Analytics** | User behavior, article performance, conversion tracking | MEDIUM | P1 |
| **Email** | Contact form submission, newsletters, notifications | MEDIUM | P1 |
| **Performance** | Code splitting, image optimization, caching, CDN | MEDIUM | P1 |
| **Accessibility** | Color contrast audit, ARIA improvements, keyboard nav | LOW | P2 |
| **Testing** | Unit tests, integration tests, E2E tests | MEDIUM | P1 |

---

## 2. Backend Requirements (Detailed)

### 2.1 REST API Architecture

**Base URL**: `https://api.ctrlaltnews.com/v1` (or `/api/v1` for self-hosted)

#### Core Resource Endpoints

```
Articles
  GET    /articles                    # List with pagination, filters
  GET    /articles/:id                # Single article detail
  POST   /articles                    # Create (admin only)
  PUT    /articles/:id                # Update (admin/author)
  DELETE /articles/:id                # Delete (admin only)
  GET    /articles/search?q=term      # Full-text search
  GET    /articles/:id/related        # Related articles

Categories
  GET    /categories                  # List all categories
  GET    /categories/:slug/articles   # Articles in category

Authors
  GET    /authors                     # List authors (with article count)
  GET    /authors/:id                 # Author profile + articles
  GET    /authors/:id/articles        # Author's articles

Comments
  GET    /articles/:id/comments       # Comments for article
  POST   /articles/:id/comments       # Post comment
  PUT    /comments/:id                # Edit comment
  DELETE /comments/:id                # Delete comment
  POST   /comments/:id/reply          # Reply to comment

Users
  POST   /auth/signup                 # Register account
  POST   /auth/login                  # JWT login
  POST   /auth/oauth/google           # OAuth flow
  POST   /auth/logout                 # Revoke token
  GET    /users/me                    # Current user profile
  PUT    /users/me                    # Update profile
  GET    /users/:id                   # Public user profile

Bookmarks & Interactions
  POST   /articles/:id/bookmark       # Save article
  DELETE /articles/:id/bookmark       # Remove bookmark
  GET    /users/me/bookmarks          # User's saved articles
  POST   /articles/:id/reactions      # Like/clap article
  GET    /articles/:id/reactions      # Reaction counts

Search & Discovery
  GET    /search?q=term&type=article  # Global search
  GET    /trending                    # Trending articles
  GET    /recommendations             # Personalized recommendations

Admin/Editor
  GET    /admin/articles              # Draft & published articles
  POST   /admin/articles              # Batch upload
  PUT    /admin/articles/:id/publish  # Schedule/publish
  GET    /admin/analytics             # Article analytics
```

### 2.2 Database Schema (PostgreSQL)

```sql
-- Core tables

users
  id (UUID)
  email (VARCHAR UNIQUE)
  username (VARCHAR UNIQUE)
  password_hash (VARCHAR, bcrypt)
  oauth_id (VARCHAR, nullable)
  oauth_provider (VARCHAR, nullable)
  full_name (VARCHAR)
  bio (TEXT)
  avatar_url (VARCHAR)
  is_admin (BOOLEAN)
  is_author (BOOLEAN)
  email_verified (BOOLEAN)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)

articles
  id (UUID)
  title_en (VARCHAR)
  title_pt (VARCHAR)
  slug (VARCHAR UNIQUE)
  excerpt_en (TEXT)
  excerpt_pt (TEXT)
  content_en (TEXT)
  content_pt (TEXT)
  category_id (FK -> categories)
  author_id (FK -> users)
  featured_image_url (VARCHAR)
  status (ENUM: draft, published, archived)
  published_at (TIMESTAMP, nullable)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)
  view_count (INTEGER, default 0)
  reading_time_minutes (INTEGER)

categories
  id (UUID)
  name_en (VARCHAR)
  name_pt (VARCHAR)
  slug (VARCHAR UNIQUE)
  color_hex (VARCHAR)
  icon_url (VARCHAR)
  description_en (TEXT)
  description_pt (TEXT)
  created_at (TIMESTAMP)

comments
  id (UUID)
  article_id (FK -> articles)
  author_id (FK -> users)
  parent_comment_id (FK -> comments, nullable) -- for nested replies
  content (TEXT)
  status (ENUM: approved, pending, rejected)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)

reactions
  id (UUID)
  article_id (FK -> articles)
  user_id (FK -> users)
  reaction_type (ENUM: like, clap)
  created_at (TIMESTAMP)
  UNIQUE(article_id, user_id, reaction_type)

bookmarks
  id (UUID)
  user_id (FK -> users)
  article_id (FK -> articles)
  created_at (TIMESTAMP)
  UNIQUE(user_id, article_id)

contacts
  id (UUID)
  name (VARCHAR)
  email (VARCHAR)
  subject (VARCHAR)
  message (TEXT)
  status (ENUM: new, responded)
  created_at (TIMESTAMP)

-- Search optimization

article_search_index
  article_id (FK)
  search_vector (tsvector) -- PostgreSQL full-text index

-- Analytics

page_views
  id (UUID)
  article_id (FK -> articles, nullable)
  user_id (FK -> users, nullable)
  session_id (VARCHAR)
  page_path (VARCHAR)
  referrer (VARCHAR)
  user_agent (VARCHAR)
  ip_address (VARCHAR, hashed)
  created_at (TIMESTAMP)

-- Indexes for performance
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_page_views_article ON page_views(article_id);
CREATE INDEX idx_article_search ON article_search_index USING gin(search_vector);
```

### 2.3 Authentication & Security

**JWT Token Flow**:
1. User signs up or logs in
2. Server returns `access_token` (15 min TTL) + `refresh_token` (7 day TTL)
3. Client stores tokens in `httpOnly` cookies (secure, no XSS vulnerability)
4. All API calls include `Authorization: Bearer {token}`
5. Token refresh on expiration using `refresh_token`

**OAuth 2.0 Integration** (Google, GitHub):
- `VITE_OAUTH_GOOGLE_CLIENT_ID` → sign in with Google
- `VITE_OAUTH_GITHUB_CLIENT_ID` → sign in with GitHub
- Redirect to `/auth/callback` with authorization code
- Server exchanges code for tokens, creates/updates user

**Password Security**:
- Bcrypt hashing (cost factor: 12)
- Min 8 chars, 1 uppercase, 1 number, 1 special char
- Rate limiting on login endpoint (5 attempts/5 min)

**CORS & CSRF**:
- CORS: Accept requests from allowed frontend origins only
- CSRF: Use SameSite=Strict cookies

### 2.4 API Response Format (Standard JSON)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title_en": "Article Title",
    "category": "AI"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email already exists",
    "details": [
      { "field": "email", "message": "Email already in use" }
    ]
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

---

## 3. Database & Data Model

### 3.1 Migration Strategy

**Phase 1**: Create PostgreSQL schema (see 2.2)
**Phase 2**: Migrate mock data from `client/src/lib/data.ts` into `articles` table
**Phase 3**: Add admin user account + seed categories

**Tools**:
- Prisma ORM for migrations & queries (preferred)
- Alternatively: raw SQL + FlywayDB for version control

**Migration Files**:
```
server/db/migrations/
  001_initial_schema.sql       # Create all tables
  002_add_full_text_search.sql # GIN index on articles
  003_seed_categories.sql      # Insert 4 base categories
  004_seed_admin_user.sql      # Create demo admin
```

### 3.2 Data Consistency Rules

- **Soft Deletes**: Articles marked `status = 'archived'`, never physically deleted
- **Optimistic Locking**: `updated_at` timestamp on all tables
- **Foreign Keys**: Cascade delete on user deletion (anonymize comments instead)
- **Indexes**: Mandatory on all FK columns, date ranges, search fields

---

## 4. Monetization Strategy

### 4.1 Current AdSense Placeholders

**Status**: 3 leaderboard banners (728×90) on:
- Home page (between carousels)
- Article detail page (above comments)

**Issue**: No real Google AdSense account connected. Placeholders only.

### 4.2 Monetization Tiers (MoSCoW)

#### Must Have (Tier 1: Revenue Required)
1. **Google AdSense Integration** (Real ads, not placeholders)
   - Publisher ID from Google AdSense account
   - Ad units for mobile & desktop
   - Est. CPM: $2–10 (tech content higher end)
   - Est. Monthly Revenue: $500–5K (at 10K users, 50% ad view rate)

#### Should Have (Tier 2: Scale & Professionalism)
2. **Premium Subscription**
   - $9.99/month or $99/year plan
   - Features: Ad-free experience, exclusive articles, early access
   - Stripe integration for payments
   - Est. Revenue: 5% conversion = 50 subscribers = $500/month

3. **Sponsored Content**
   - $500–2K per sponsored article (niche tech audience)
   - Clearly marked as "Sponsored" with disclosure badge
   - 1–2 per month = $1K–2K additional revenue

#### Could Have (Tier 3: Nice-to-Have)
4. **Newsletter Sponsorships**
   - Build email list (target 10K subscribers)
   - Sell sponsorship spots ($1K–5K per send)
   - Frequency: 2x/week digest

5. **Affiliate Links**
   - Amazon Associates (gadgets already partially done)
   - B2B tool affiliates (dev tools, hosting)
   - Commission: 2–10% per sale

#### Won't Have (Deliberately Excluded)
- Native advertising networks (too many ads, poor UX)
- Cryptocurrency/NFT promotions (brand risk, audience mismatch)
- Pay-per-article (barriers to organic growth)

### 4.3 Implementation Roadmap

| Q | Target | Action |
|---|--------|--------|
| Q2 2026 | Set up AdSense account | Verify domain, apply for Publisher ID |
| Q2 2026 | Integrate real AdSense | Replace placeholders with actual ad code |
| Q3 2026 | Launch premium tier | Build paywall UI, integrate Stripe |
| Q3 2026 | Grow subscriber base | Marketing, content quality improvements |
| Q4 2026 | Sponsorship program | Create sponsorship packages, outreach |

---

## 5. Feature Backlog: Prioritized Roadmap (MoSCoW)

### 5.1 MUST HAVE (P0 - Blocking Production)

These features are **non-negotiable** for a professional platform.

#### **Backend API & Database** (Sprint 1–2, 4 weeks)
- [ ] Set up Express.js REST API structure
- [ ] PostgreSQL database setup (local dev, staging, production)
- [ ] User authentication (signup, login, JWT tokens)
- [ ] Articles CRUD (create, read, update, delete)
- [ ] Categories management
- [ ] Comments system (create, edit, delete)
- [ ] Full-text search on articles
- [ ] Pagination & filtering

**Acceptance Criteria**:
- `npm run dev` starts both client and API on separate ports (3000 + 3001)
- All 20+ API endpoints functional with request/response validation
- Database migrations versioned and reproducible
- TypeScript: 0 errors
- Test coverage: 60%+ (API routes)

#### **User Authentication** (Sprint 2, 2 weeks)
- [ ] OAuth 2.0 (Google sign-in)
- [ ] JWT token management (access + refresh)
- [ ] Protected routes (admin-only endpoints)
- [ ] User profile CRUD
- [ ] Password reset email
- [ ] Email verification flow

#### **Comments & Engagement** (Sprint 3, 2 weeks)
- [ ] Replace mock comments with real data
- [ ] Comment nesting (replies to comments)
- [ ] Comment moderation (admin approve/reject)
- [ ] Like/clap reactions on articles
- [ ] Bookmark system (save for later)

#### **Search Functionality** (Sprint 3, 2 weeks)
- [ ] Full-text search with PostgreSQL GIN index
- [ ] Filter by category, date range, author
- [ ] Relevance ranking
- [ ] UI: search page with results grid

#### **Admin/Editor Dashboard** (Sprint 4, 2 weeks)
- [ ] Protected admin area (`/admin`)
- [ ] Article management (create, edit, publish, archive)
- [ ] Draft & scheduling support
- [ ] User management (approve editors)
- [ ] Analytics dashboard (views, clicks)

**Deliverable**: Admin can publish a new article via UI in <2 min.

#### **Contact Form Backend** (Sprint 1, 1 week)
- [ ] Store contact submissions in database
- [ ] Email notification to admin on submission
- [ ] No spam (rate limiting, CAPTCHA optional)
- [ ] Admin can view & respond to messages

#### **Performance & Caching** (Sprint 4, 2 weeks)
- [ ] Redis caching layer for frequently accessed articles
- [ ] API response caching headers (ETag, Last-Modified)
- [ ] Database query optimization (indexes, N+1 prevention)
- [ ] Frontend code splitting (lazy load category pages)

**Target Metrics**:
- TTFB: < 200ms
- LCP: < 2.5s
- CLS: < 0.1

#### **Production Deployment** (Sprint 5, 1 week)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Automated tests on commit
- [ ] Blue-green deployment strategy
- [ ] Environment variables (.env) management
- [ ] Error tracking (Sentry integration)
- [ ] Uptime monitoring

---

### 5.2 SHOULD HAVE (P1 - High Priority)

These features are important for professionalism but not blocking MVP.

#### **SEO Optimization** (Sprint 6, 2 weeks)
- [ ] Dynamic meta tags (title, description)
- [ ] Open Graph tags for social sharing
- [ ] Structured data (JSON-LD for articles)
- [ ] XML sitemaps (articles, categories)
- [ ] robots.txt
- [ ] Canonical tags for multilingual content

**Example Meta Tag**:
```tsx
<title>{article.title_en} | Ctrl Alt News</title>
<meta name="description" content={article.excerpt_en.substring(0, 160)} />
<meta property="og:image" content={article.featured_image_url} />
<meta property="og:type" content="article" />
<meta property="article:published_time" content={article.published_at} />
```

#### **Email System** (Sprint 6, 2 weeks)
- [ ] Newsletter signup form
- [ ] Email service integration (SendGrid, Mailgun)
- [ ] Weekly digest email template
- [ ] User notification preferences
- [ ] Password reset emails (already in auth)
- [ ] Contact form submissions → admin email

#### **Real AdSense Integration** (Sprint 7, 1 week)
- [ ] Replace placeholder banners with real AdSense code
- [ ] Google Publisher ID configuration
- [ ] Ad unit IDs for mobile & desktop
- [ ] Analytics: track ad impressions & clicks
- [ ] Compliance: privacy policy & ad disclosures

#### **Image Optimization** (Sprint 7, 1 week)
- [ ] Next-gen formats (WebP with fallbacks)
- [ ] Responsive images (srcset, sizes)
- [ ] Lazy loading attributes
- [ ] Image CDN integration (Cloudinary or similar)
- [ ] Automatic compression on upload

#### **Bilingual Content Management** (Sprint 8, 2 weeks)
- [ ] I18n framework (react-i18next)
- [ ] Language switcher in header
- [ ] Dedicated translations for UI strings
- [ ] Admin can manage EN/PT-BR separately
- [ ] Fallback to EN if PT translation missing

#### **Author Program** (Sprint 8, 2 weeks)
- [ ] Author profiles (bio, article count, follow)
- [ ] Author verification badge
- [ ] Writer onboarding flow
- [ ] Article creation form (title, content, category, publish date)
- [ ] Draft saving & version history

#### **Trending & Recommendations** (Sprint 9, 2 weeks)
- [ ] Trending articles algorithm (views in last 7 days)
- [ ] Personalized recommendations (ML-based or simple rules)
- [ ] Sidebar: "Trending Now" widget
- [ ] Endpoint: `GET /trending?limit=5&category=AI`

#### **Unit & Integration Tests** (Sprint 10, 3 weeks)
- [ ] Jest/Vitest for React components (aim for 70%+ coverage)
- [ ] Integration tests for API routes
- [ ] E2E tests (Playwright): article creation, search, comments
- [ ] Mock data fixtures for testing

---

### 5.3 COULD HAVE (P2 - Nice-to-Have)

Lower priority, valuable but not urgent.

- [ ] **Premium Subscription** (Stripe integration)
  - Ad-free reading
  - Exclusive articles
  - Early article access
- [ ] **Dark Mode Improvements** (color contrast audit, WCAG AA compliance)
- [ ] **Social Sharing Buttons** (Twitter, LinkedIn, Hacker News)
- [ ] **Reading List / Collections** (user can create topic bundles)
- [ ] **Comment Reactions** (emoji reactions on comments)
- [ ] **Article Claps System** (Medium-style multi-click reactions)
- [ ] **Push Notifications** (new article in favorite category)
- [ ] **Advanced Analytics** (heatmaps, session recording — privacy-respecting)
- [ ] **API Rate Limiting** (protect against abuse)
- [ ] **GraphQL API** (alternative to REST, optional)

---

### 5.4 WON'T HAVE (Deliberately Out of Scope)

Features explicitly excluded from roadmap:

- **Paywalls** (blocks organic growth; only premium tier, not full paywall)
- **AI-Generated Content** (brand consistency, trust, author autonomy)
- **Cryptocurrency/NFTs** (audience misalignment, regulatory risk)
- **Video Platform** (separate tech stack, low ROI initially)
- **Podcast Integration** (out of scope for text-first platform)
- **Comments On User Profiles** (keep simple for now)
- **Dark Theme Beyond Current** (current dark theme sufficient)
- **Mobile App** (web app sufficient, can use PWA if needed later)
- **Live Chat Support** (use email-based support first)

---

## 6. Scalability & Architecture

### 6.1 Current Bottlenecks & Solutions

| Bottleneck | Current | Solution | Timeline |
|-----------|---------|----------|----------|
| **Data Tier** | Mock data in client | PostgreSQL + API | Sprint 1–2 |
| **Caching** | None | Redis (articles, user profiles) | Sprint 4 |
| **CDN** | Manus CDN (images only) | CloudFront for all static assets | Sprint 7 |
| **API Scaling** | Single Express server | Load balancer + 2–3 replicas | Q3 2026 |
| **Database** | Single connection pool | Read replicas for reporting | Q4 2026 |
| **Search** | Client-side filtering | PostgreSQL full-text + Elasticsearch optional | Sprint 3 |

### 6.2 Infrastructure Roadmap

#### Phase 1: MVP (Current to Q2 2026)
```
Client (React)
     ↓
API Server (Express)
     ↓
PostgreSQL (single instance)
     ↓
Manus CDN (images)
```

#### Phase 2: Scalability (Q3 2026)
```
Client (React)
     ↓
Load Balancer
     ↓
API Servers (x2–3 replicas)
     ↓
PostgreSQL + Read Replicas
     ↓
Redis Cache Layer
     ↓
CloudFront CDN (global)
```

#### Phase 3: Enterprise (Q4 2026+)
```
[Same as Phase 2 +]
Elasticsearch for advanced search
Kafka for event streaming (analytics)
Observability: DataDog / New Relic
```

### 6.3 Performance Targets

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| **Time to First Byte (TTFB)** | ~500ms | <200ms | API caching, database optimization |
| **Largest Contentful Paint (LCP)** | ~3s | <2.5s | Code splitting, image optimization |
| **First Input Delay (FID)** | ~100ms | <100ms | React optimization, bundle size |
| **Cumulative Layout Shift (CLS)** | ~0.2 | <0.1 | Image dimensions, font preloading |
| **API Response Time (p95)** | — | <300ms | Query caching, indexing |
| **Database Query Time (p95)** | — | <50ms | Indexes, connection pooling |
| **Article Load Time** | — | <1s | Separate content endpoint, caching |

### 6.4 Scalability Constraints & Decisions

**Why not Serverless (Lambda)?**
- Stateful connections (WebSocket for comments, notifications later)
- Long-running batch jobs (email digests, analytics aggregation)
- Cost predictability (fixed monthly vs. per-request)

**Why PostgreSQL over MongoDB?**
- Strong ACID guarantees (financial transactions, comment integrity)
- Full-text search built-in
- Mature ecosystem (Prisma, TypeORM)
- Team familiarity with SQL

**Why Redis Cache over Application Cache?**
- Shared across multiple server instances
- Automatic expiration (TTL)
- Session storage (login tokens)
- Pub/Sub for real-time features (later)

---

## 7. Deployment & DevOps

### 7.1 Deployment Platforms (Options)

| Platform | Cost | Pros | Cons | Recommendation |
|----------|------|------|------|---|
| **Vercel** (Frontend) + **Railway** (Backend) | $20–100/mo | Simple, auto-scaling | Limited customization | ✓ MVP |
| **AWS (EC2 + RDS)** | $50–200/mo | Full control, mature | Complex setup, learning curve | ✓ Scale |
| **Heroku** | $50–500/mo | Easy deployment, managed DB | Expensive at scale | ✗ Avoid |
| **DigitalOcean** | $30–100/mo | Simple, good docs | Manual scaling | ✓ Budget |

**Recommendation for MVP**: Vercel + Railway  
**Recommendation for Scale**: AWS (EC2 for API, RDS for DB, S3 for assets)

### 7.2 Environment Variables

**.env.example** (commit to repo):
```bash
# Backend API
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/ctrl_alt_news
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=another-secret-key-min-32-chars
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...

# Email
SENDGRID_API_KEY=SG.xxx
ADMIN_EMAIL=regis@ctrlaltnews.com

# AdSense
GOOGLE_ADSENSE_PUBLISHER_ID=ca-pub-xxxxx

# Frontend
VITE_API_URL=http://localhost:3001/api/v1
VITE_OAUTH_GOOGLE_CLIENT_ID=...
VITE_APP_NAME=Ctrl Alt News

# Monitoring
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=development
```

### 7.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run check       # TypeScript
      - run: npm run lint        # ESLint
      - run: npm run test        # Unit tests
      - run: npm run build       # Build check

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: railwayapp/railway-action@v1  # Deploy to Railway
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
```

### 7.4 Database Migrations in Production

**Using Prisma**:
```bash
# Local: Apply migrations
npm run prisma:migrate:dev --name "add_search_index"

# Staging/Production: Deploy safely
npm run prisma:migrate:deploy  # Safe, zero-downtime migrations
```

### 7.5 Monitoring & Error Tracking

**Sentry Integration** (error tracking):
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.errorHandler());  // Express middleware
```

**Health Check Endpoint**:
```typescript
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: "error", message: error.message });
  }
});
```

---

## 8. Success Metrics & KPIs

### 8.1 Product Metrics

| Metric | Current | Target (6 mo) | Target (1 yr) |
|--------|---------|----------------|---------------|
| **Traffic** | | | |
| Monthly Users | 0 (prototype) | 5K | 25K |
| Monthly Page Views | 0 | 50K | 250K |
| Avg. Session Duration | — | 3 min | 5 min |
| Return User Rate | — | 20% | 40% |
| **Content** | | | |
| Published Articles | 50 (mock) | 150 | 400 |
| Articles per Week | 0 | 3–5 | 5–8 |
| **Engagement** | | | |
| Comments per Article | 0 | 2–5 | 5–10 |
| Avg. Comment Quality Score | — | 3.5/5 | 4/5 |
| Bookmarks per Article | 0 | 10% | 20% |
| **Monetization** | | | |
| Monthly Ad Revenue | $0 | $500–1K | $5K–10K |
| Premium Subscribers | 0 | 50 | 500 |
| Subscription Revenue | $0 | $500 | $5K |
| Total MRR | $0 | $1K | $10K+ |

### 8.2 Technical Metrics

| Metric | Target | Tool |
|--------|--------|------|
| **API Availability** | 99.5% | Uptime Robot |
| **Page Load Time (p95)** | <2.5s | Lighthouse CI |
| **API Response Time (p95)** | <300ms | Datadog / self-hosted |
| **Error Rate** | <0.5% | Sentry |
| **Test Coverage** | >70% | Jest coverage reports |
| **Core Web Vitals** | All green | Lighthouse, PageSpeed Insights |

### 8.3 Business Metrics

| Metric | Target |
|--------|--------|
| **Cost per User Acquisition** | <$2 (organic) |
| **Lifetime Value (LTV)** | >$50 |
| **LTV:CAC Ratio** | >10:1 |
| **Churn Rate** | <5% (monthly) |
| **Viral Coefficient** | >1.2 (share rate) |

---

## 9. Risk Assessment & Mitigation

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Database corrupts** | Low | Critical | Daily automated backups, point-in-time recovery |
| **API performance degrades** | Medium | High | Caching layer (Redis), query monitoring, load testing |
| **Search becomes slow** | Medium | Medium | PostgreSQL GIN index + Elasticsearch optional |
| **Dependency vulnerabilities** | High | Medium | `npm audit` in CI/CD, weekly updates, Snyk integration |
| **User data leaked** | Low | Critical | HTTPS only, hashed passwords, rate limiting, GDPR compliance |

### 9.2 Product Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Low user engagement** | Medium | High | Focus on content quality, community management |
| **AdSense account rejected** | Medium | Medium | Manual review, high editorial standards, appeal process |
| **Competition from Medium** | High | High | Differentiate with niche (tech/AI), community, analytics |
| **Monetization conflicts** | Medium | Medium | User surveys, transparent about ads, premium tier for ad-free |

### 9.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Team capacity limits** | High | Medium | Prioritize ruthlessly (MoSCoW), no gold-plating |
| **Scope creep** | High | High | Define MVP strictly, defer "nice-to-have" features |
| **Key person dependency** | Medium | High | Document architecture (this PRD), knowledge sharing |

---

## 10. Roadmap & Timeline

### 10.1 Quarterly Breakdown

#### Q2 2026 (April–June): MVP Stabilization & Backend
**Goal**: Move from prototype to production-ready backend

- **Sprint 1–2**: Express.js REST API + PostgreSQL schema + data migration
- **Sprint 3**: User authentication (JWT + OAuth Google)
- **Sprint 4**: Comments, bookmarks, search
- **Sprint 5**: Admin dashboard for editors
- **Sprint 6**: CI/CD, error tracking, performance optimization

**Deliverable**: API fully functional, frontend connects to real data, deploy to Railway/AWS

**Success Criteria**:
- Zero type errors
- 60%+ test coverage
- API response time <300ms (p95)
- No manual data management needed

#### Q3 2026 (July–September): Production Launch & Scale
**Goal**: Ship to production, acquire first 5K users, launch monetization

- **Sprint 7–8**: SEO optimization, email system, real AdSense
- **Sprint 9**: Content quality improvements, author program
- **Sprint 10**: Trending/recommendations, performance tuning
- **Sprint 11–12**: Marketing, paid acquisition, premium tier prep

**Deliverable**: Live on production, first 5K users, $500–1K/month revenue

**Success Criteria**:
- 99.5% uptime
- <2 critical bugs
- 3–5 articles published per week
- 5K users sign up

#### Q4 2026 (October–December): Growth & Expansion
**Goal**: Reach 25K users, $5K/month revenue, establish author network

- **Sprint 13–14**: Premium subscription (Stripe)
- **Sprint 15–16**: Advanced search (Elasticsearch), personalization
- **Sprint 17–18**: Sponsored content program, affiliate network
- **Sprint 19–20**: 2026 retrospective, 2027 planning

**Deliverable**: Multi-revenue streams, 25K users, profitable

**Success Criteria**:
- 25K monthly users
- 500+ premium subscribers ($5K/month)
- $2K–3K sponsored revenue
- Net promoter score (NPS) >40

### 10.2 Milestone Dependencies

```
Q2 MVP (API + Auth) 
  ↓
Q3 Launch (SEO + Ads + Content)
  ↓
Q4 Growth (Premium + Monetization)
```

**Critical Path**:
1. Backend API fully functional (blocking everything)
2. Data migration from client to DB (blocking launch)
3. User authentication (blocking personalization)
4. SEO optimization (blocking organic traffic)

---

## 11. Acceptance Criteria & Definition of Done

### 11.1 Sprint-Level DoD

**Code**:
- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes (`npm run lint`)
- [ ] All new code has unit tests (70%+ coverage)
- [ ] No console warnings or errors
- [ ] Code reviewed by 1+ peer

**Testing**:
- [ ] Unit tests pass (`npm run test`)
- [ ] Integration tests pass
- [ ] No regressions in existing features
- [ ] Manual QA on desktop + mobile

**Documentation**:
- [ ] README updated if new features
- [ ] API docs updated (if backend changes)
- [ ] Complex logic has comments
- [ ] Migration guides (if DB changes)

**Performance**:
- [ ] No new performance regressions
- [ ] API response time <300ms (p95)
- [ ] Lighthouse score ≥80

### 11.2 Feature-Level Acceptance Criteria

**Example: User Authentication**
- [ ] User can sign up with email + password
- [ ] User can log in and receive JWT token
- [ ] Token persists across page refreshes
- [ ] Expired token triggers re-login
- [ ] Google OAuth sign-in works
- [ ] Password reset email sends
- [ ] Rate limiting prevents brute force (5 attempts/5 min)
- [ ] Passwords hashed with bcrypt

**Example: Comments System**
- [ ] User can post comment on article
- [ ] Comment appears immediately (optimistic update)
- [ ] Admin can moderate (approve/reject/delete)
- [ ] User can edit own comments
- [ ] Comments nested up to 3 levels
- [ ] Pagination for 100+ comments (20 per page)
- [ ] No XSS vulnerabilities (content sanitized)

---

## 12. Success Story: Example User Journeys

### 12.1 Reader Journey (Organic)
1. Lands on home page via Google search
2. Sees trending articles about AI
3. Clicks article, reads full content
4. Sees "Sign up for newsletter" CTA
5. Returns via email link → bookmarks article
6. Browses category page, subscribes to premium
7. Reads ad-free for entire month

### 12.2 Author Journey
1. Fills writer application form
2. Gets email: "Welcome! Here's your dashboard"
3. Creates new article (title, content, category)
4. Saves as draft, gets feedback from editor
5. Publishes to main feed
6. Article goes viral: 5K views in 1 week
7. Earns $50 from ad revenue (5% share)
8. Pitches sponsored article idea

### 12.3 Admin Journey
1. Logs in to `/admin` dashboard
2. Sees 5 new contact form submissions
3. Reviews pending comments (15 items)
4. Approves good comments, rejects spam
5. Views article analytics (top 10 articles)
6. Schedules new article to publish tomorrow
7. Sends weekly digest email to 1K subscribers

---

## 13. Open Questions & Decisions Pending

1. **Database**: Prisma ORM vs. Drizzle vs. raw SQL?
2. **Search**: PostgreSQL full-text only, or add Elasticsearch?
3. **Payment**: Stripe vs. Paddle vs. LemonSqueezy for subscriptions?
4. **Email**: SendGrid vs. Mailgun vs. AWS SES?
5. **Analytics**: Google Analytics + Sentry, or custom in-house?
6. **Image Storage**: Manus CDN, Cloudinary, or AWS S3?
7. **Deployment**: Vercel + Railway, or AWS, or DigitalOcean?
8. **Comment Moderation**: Manual only, or AI-assisted (toxic comment detection)?

**Decision Timeline**: Week of April 22, 2026 (after architecture review with @architect)

---

## 14. Glossary & Terminology

- **MVP**: Minimum Viable Product (backend + real data + auth)
- **MoSCoW**: Must, Should, Could, Won't prioritization
- **TTFB**: Time to First Byte
- **LCP**: Largest Contentful Paint
- **SEO**: Search Engine Optimization
- **JWT**: JSON Web Token
- **OAuth**: Open Authorization (3rd party login)
- **CRUD**: Create, Read, Update, Delete
- **TTL**: Time To Live (cache expiration)
- **GIN**: Generalized Inverted Index (database index type)
- **CPM**: Cost Per Mille (ad revenue metric)
- **NPS**: Net Promoter Score (customer satisfaction)

---

## 15. Sign-Off & Approvals

| Role | Name | Status | Date |
|------|------|--------|------|
| **Product Manager** | Morgan | Draft | 2026-04-16 |
| **Technical Lead** | Aria (Architect) | Pending | — |
| **Engineering Lead** | Dex (Dev) | Pending | — |
| **Stakeholder** | Regis | Pending | — |

---

## Appendix A: Competitive Analysis

### A.1 Feature Comparison: Medium vs. Dev.to vs. Ctrl Alt News

| Feature | Medium | Dev.to | Ctrl Alt News (Target) |
|---------|--------|--------|----------------------|
| **Core** | | | |
| Article Platform | ✓ | ✓ | ✓ |
| Bilingual Support | ✗ | ✗ | ✓ (EN/PT-BR) |
| Categories | ✓ | ✓ | ✓ |
| **Community** | | | |
| Comments | ✓ | ✓ | ✓ |
| Reactions | ✓ | ✓ | ✓ (planned) |
| User Profiles | ✓ | ✓ | ✓ (planned) |
| Follow Users | ✓ | ✓ | ✓ (could-have) |
| **Monetization** | | | |
| AdSense | ✓ | ✗ | ✓ |
| Premium Tier | ✓ | ✗ | ✓ (planned) |
| Author Payouts | ✓ | ✓ | ✓ (planned) |
| **SEO** | | | |
| Meta Tags | ✓ | ✓ | ✓ (planned) |
| Sitemaps | ✓ | ✓ | ✓ (planned) |
| Structured Data | ✓ | ✓ | ✓ (planned) |
| **Tech** | | | |
| Open Source | ✗ | ✗ | Potentially |
| API | ✓ | ✓ | ✓ (planned) |
| Self-Hosted | ✗ | ✗ | ✓ (optional) |

### A.2 Differentiation Strategy

**Why Ctrl Alt News vs. Medium?**
- Niche focus: AI, Science, Robotics (not general publishing)
- Bilingual: Portuguese support (underserved market)
- Independent: Own data, no algorithm lock-in
- Open: Potential self-hosted option
- Community: Smaller, more engaged (not scale-at-all-costs)

---

## Appendix B: Technical Debt Inventory

| Issue | Severity | Fix Timeline | Notes |
|-------|----------|--------------|-------|
| Bilingual logic scattered in components | Medium | Q3 (migrate to i18n) | Affects maintainability |
| Inline styles mixed with Tailwind | Low | Q2 (refactor after API) | Code smell, not breaking |
| Wouter patch required | Medium | Q4 (upgrade or fork) | Blocks router updates |
| Recharts unused | Low | Q2 (remove from bundle) | 30KB savings |
| No tests | High | Q2+ (add incrementally) | Blocks production confidence |
| Radix components not tree-shaken | Low | Q3 (optimize bundle) | Minor perf impact |
| Mock data in client | Critical | Q2 Sprint 1 (migrate to DB) | Blocking backend transition |

---

## Appendix C: References & Resources

### C.1 Documentation
- Brownfield Architecture: `docs/brownfield-architecture.md`
- Tech Stack: React 19, Express.js, PostgreSQL, Tailwind CSS v4
- Repo: `https://github.com/...` (private)

### C.2 Tools & Services
- **API Framework**: Express.js + TypeScript
- **ORM**: Prisma (recommended)
- **Database**: PostgreSQL 14+
- **Cache**: Redis
- **Auth**: jsonwebtoken (JWT), passport.js (OAuth)
- **Email**: SendGrid or Mailgun
- **Payments**: Stripe
- **Deployment**: Railway or AWS
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics 4
- **CI/CD**: GitHub Actions

### C.3 External References
- [Medium Platform](https://medium.com) — Benchmark
- [Dev.to](https://dev.to) — Benchmark
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Express.js Guide](https://expressjs.com)
- [Prisma ORM](https://www.prisma.io)
- [React 19 Docs](https://react.dev)

---

## Document History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-16 | Morgan (AIOS PM) | Initial PRD Draft |
| — | — | — | Pending review |

---

**End of Document**  
Generated for Ctrl Alt News Portal Brownfield Initiative  
Status: **DRAFT** — Awaiting Technical & Stakeholder Review

