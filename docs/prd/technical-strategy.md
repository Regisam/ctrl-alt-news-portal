# Technical Strategy: Backend Architecture & Tech Stack Decisions

**Document**: `docs/prd/technical-strategy.md`  
**Purpose**: Architectural decisions, technology selection, and implementation patterns  
**Date**: 2026-04-16  
**Audience**: Engineering leads, architects, developers  

---

## Overview

This document outlines the technical approach for transforming Ctrl Alt News from a prototype to a production-grade platform. It includes architecture decisions, technology selections, and implementation patterns.

---

## 1. Architecture Overview

### 1.1 Current State (Monorepo SPA)

```
┌─────────────────────────────────┐
│  React 19 Frontend (Vite)       │
│  - Client-side routing (Wouter) │
│  - Mock data in JS              │
│  - 50+ articles hardcoded       │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Express.js Server              │
│  - Serves static SPA            │
│  - No API routes                │
│  - No database                  │
└─────────────────────────────────┘
```

### 1.2 Target State (Full-Stack with API)

```
┌──────────────────────────────────────┐
│  React 19 Frontend (Vite + React18+)  │
│  - Client-side routing (Wouter)       │
│  - Real API calls (fetch/axios)       │
│  - User authentication (JWT)          │
│  - Caching layer (React Query)        │
└─────────────────┬────────────────────┘
                  │ HTTP/JSON
     ┌────────────▼────────────┐
     │  API Gateway / LB (Nginx)│  (Q3+)
     └────────────┬────────────┘
     ┌────────────▼──────────────────────┐
     │  Express.js API Layer             │
     │  - 20+ REST endpoints             │
     │  - JWT middleware                 │
     │  - Request validation (Zod)       │
     │  - Error handling                 │
     └────────────┬─────────────────────┘
     ┌────────────▼──────────────────────┐
     │  Prisma ORM + PostgreSQL          │
     │  - User model + auth              │
     │  - Article CRUD                   │
     │  - Comments & reactions           │
     │  - Full-text search index         │
     └───────────────────────────────────┘
           ↓
     ┌─────────────────────────────┐
     │  Redis Cache (Q3+)          │
     │  - Article cache (1h TTL)   │
     │  - Session storage          │
     │  - Pub/Sub for real-time    │
     └─────────────────────────────┘
```

---

## 2. Technology Stack Selection

### 2.1 Backend API Framework

#### Options Considered

| Framework | Pros | Cons | Decision |
|-----------|------|------|----------|
| **Express.js** | Lightweight, popular, middleware ecosystem | Minimal structure | ✓ CHOSEN |
| **Fastify** | High performance, TypeScript-first | Smaller ecosystem | Alternative |
| **Hono** | Super lightweight, modern | Less mature | Not selected |
| **NestJS** | Full-featured, DI, microservices ready | Opinionated, heavy | Overkill for MVP |
| **Deno** | Modern, built-in TS | Immature ecosystem | Not selected |

**Decision**: Express.js + TypeScript
- **Why**: Perfect balance of simplicity and maturity
- **Middleware**: Use express-async-errors, helmet, cors, compression
- **Type Safety**: TypeScript strict mode

**Setup**:
```typescript
// server/index.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

const app = express();

app.use(helmet());                    // Security headers
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(compression());               // Gzip responses
app.use(express.json());             // Parse JSON bodies

// Routes
app.use('/api/v1', apiRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(process.env.PORT || 3001);
```

---

### 2.2 Database & ORM

#### Options Considered

| Technology | Pros | Cons | Decision |
|-----------|------|------|----------|
| **PostgreSQL + Prisma** | Type-safe, migrations, best-in-class | Requires schema design | ✓ CHOSEN |
| **MongoDB + Mongoose** | Flexible schema, fast writes | Less structured, harder to query | Not selected |
| **Supabase (PG + Auth + Realtime)** | Managed, PostgreSQL + Auth bundled | Vendor lock-in | Alternative |
| **MySQL** | Popular, good perf | Less advanced features | Not selected |
| **SQLite** | Lightweight, good for MVP | Doesn't scale to concurrent users | Not selected |

**Decision**: PostgreSQL + Prisma
- **Why**: Type-safe ORM, excellent migrations, handles complex queries
- **Database**: Managed PostgreSQL on Railway/AWS RDS
- **Connection**: Prisma Client with pooling

**Schema Highlights**:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  username          String    @unique
  passwordHash      String?
  oauthProvider     String?
  oauthId           String?
  fullName          String?
  bio               String?
  avatarUrl         String?
  isAdmin           Boolean   @default(false)
  isAuthor          Boolean   @default(false)
  emailVerified     Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  articles          Article[]
  comments          Comment[]
  bookmarks         Bookmark[]
  reactions         Reaction[]
}

model Article {
  id                String    @id @default(cuid())
  titleEn           String
  titlePt           String
  slug              String    @unique
  excerptEn         String    @db.Text
  excerptPt         String    @db.Text
  contentEn         String    @db.Text
  contentPt         String    @db.Text
  categoryId        String
  authorId          String
  featuredImageUrl  String?
  status            ArticleStatus @default(DRAFT)
  publishedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  viewCount         Int       @default(0)
  readingTimeMinutes Int?
  
  category          Category  @relation(fields: [categoryId], references: [id])
  author            User      @relation(fields: [authorId], references: [id])
  comments          Comment[]
  reactions         Reaction[]
  bookmarks         Bookmark[]
  
  @@index([categoryId])
  @@index([authorId])
  @@index([publishedAt])
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ... other models
```

---

### 2.3 Authentication & Session Management

#### JWT Strategy

**Tokens**:
1. **Access Token** (15 minutes)
   - Short-lived, used for every API request
   - Stored in memory (not localStorage due to XSS risk)
   
2. **Refresh Token** (7 days)
   - Long-lived, stored in httpOnly cookie
   - Used to get new access token when expired
   - Secure: httpOnly, Secure, SameSite=Strict

**Flow**:
```
1. User logs in → Server returns access_token + refresh_token (in httpOnly cookie)
2. Client makes API request: Authorization: Bearer {access_token}
3. If access_token expires → Use refresh_token to get new access_token
4. If refresh_token expires → Redirect to login
```

**Implementation**:
```typescript
// server/auth/jwt.ts
import jwt from 'jsonwebtoken';

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Middleware for protected routes
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

#### OAuth 2.0 Integration

**Supported**: Google, GitHub (extensible)

**Google OAuth Flow**:
1. Frontend redirects to Google login
2. User authorizes
3. Google redirects to `/auth/callback?code=XXX`
4. Server exchanges code for ID token
5. Create/update user in DB
6. Return JWT tokens to client

**Implementation** (Node.js + google-auth-library):
```typescript
// server/routes/auth.ts
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.OAUTH_GOOGLE_CLIENT_ID);

app.post('/auth/oauth/google', async (req, res) => {
  const { idToken } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.OAUTH_GOOGLE_CLIENT_ID,
    });
    
    const { email, name, picture } = ticket.getPayload();
    
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName: name,
          avatarUrl: picture,
          oauthProvider: 'google',
          oauthId: ticket.getUserId(),
        },
      });
    }
    
    const { accessToken, refreshToken } = generateTokens(user.id);
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({ accessToken, user });
  } catch (err) {
    res.status(401).json({ error: 'OAuth failed' });
  }
});
```

---

### 2.4 Caching Strategy

#### Redis (Tier 1: Article Cache)

**Use Cases**:
1. **Article Cache**: Cache full articles, 1-hour TTL
2. **User Sessions**: Store refresh token metadata
3. **Rate Limiting**: Count API requests per user
4. **Pub/Sub**: Real-time notifications (future)

**Client**:
```typescript
// server/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cacheArticle = async (articleId: string, ttl = 3600) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  await redis.setex(`article:${articleId}`, ttl, JSON.stringify(article));
  return article;
};

export const getArticle = async (articleId: string) => {
  const cached = await redis.get(`article:${articleId}`);
  if (cached) return JSON.parse(cached);
  return cacheArticle(articleId);
};

export const invalidateArticle = async (articleId: string) => {
  await redis.del(`article:${articleId}`);
};
```

#### Application-Level Caching

**React Query** (on client):
- Cache API responses with stale-while-revalidate strategy
- Automatic invalidation on mutation
- Offline support

```typescript
// client/hooks/useArticle.ts
import { useQuery } from '@tanstack/react-query';

export const useArticle = (id: string) => {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/articles/${id}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000,   // 30 min (was cacheTime)
  });
};
```

#### Database Query Optimization

**Indexes** (PostgreSQL):
```sql
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC NULLS LAST);
CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_article_search ON article_search_index USING gin(search_vector);
```

**N+1 Prevention** (Prisma `include`):
```typescript
// WRONG (N+1 problem)
const articles = await prisma.article.findMany();
for (const article of articles) {
  article.author = await prisma.user.findUnique({ where: { id: article.authorId } });
}

// RIGHT (eager loading)
const articles = await prisma.article.findMany({
  include: { author: true, category: true }, // Fetch in one query
});
```

---

### 2.5 Search Implementation

#### Full-Text Search (PostgreSQL)

**Method 1: Native PostgreSQL tsvector**

```typescript
// Migration: Add search column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

// Trigger to auto-update search_vector
CREATE TRIGGER article_search_update BEFORE INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(search_vector, 'pg_catalog.english', title_en, excerpt_en, content_en);

// GIN Index for fast search
CREATE INDEX idx_article_search ON articles USING gin(search_vector);

// Query
const results = await prisma.$queryRaw`
  SELECT * FROM articles
  WHERE search_vector @@ plainto_tsquery('english', ${query})
  ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC
`;
```

**Method 2: Elasticsearch (Future Scale)**

For very large datasets (100K+ articles), Elasticsearch offers:
- Better relevance ranking
- Faceted search
- Analytics

But adds operational complexity. Defer to Q4 2026.

---

### 2.6 File Storage & CDN

#### Images

**Strategy**: CloudFront (AWS) + S3 or Manus CDN

**Current**: Manus CDN (images only)  
**Target**: Migrate to CloudFront (global coverage, better caching)

**Upload Flow**:
```
1. User uploads image in article editor
2. Image stored in S3 or Manus CDN
3. Return URL to server
4. Server saves URL in article record
5. CDN serves image globally (cached for 1 year)
```

**Implementation** (AWS SDK):
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: 'us-east-1' });

app.post('/api/v1/upload', authMiddleware, async (req, res) => {
  const file = req.file;
  const key = `articles/${Date.now()}-${file.originalname}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    CacheControl: 'public, max-age=31536000', // 1 year
  }));
  
  const url = `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`;
  res.json({ url });
});
```

---

## 3. API Design & Patterns

### 3.1 REST Endpoints

**Base URL**: `/api/v1`

**Article Endpoints**:
```
GET    /articles                    # List (paginated)
GET    /articles?category=AI&limit=10
GET    /articles?search=quantum
POST   /articles                    # Create (admin/author)
GET    /articles/:id                # Detail
PUT    /articles/:id                # Update (author/admin)
DELETE /articles/:id                # Delete (admin)
GET    /articles/:id/related        # Related articles
POST   /articles/:id/reactions      # Like/clap
DELETE /articles/:id/reactions      # Unlike
GET    /articles/:id/comments       # Comments
POST   /articles/:id/comments       # Post comment
```

**Response Format** (Consistent):
```json
{
  "success": true,
  "data": { /* resource */ },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  },
  "timestamp": "2026-04-16T10:30:00Z"
}
```

**Error Format** (Consistent):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Must be valid email" }
    ]
  }
}
```

### 3.2 Input Validation (Zod)

```typescript
// server/validation/articles.ts
import { z } from 'zod';

export const createArticleSchema = z.object({
  titleEn: z.string().min(3).max(200),
  titlePt: z.string().min(3).max(200),
  excerptEn: z.string().min(10).max(500),
  excerptPt: z.string().min(10).max(500),
  contentEn: z.string().min(100),
  contentPt: z.string().min(100),
  categoryId: z.string().uuid(),
  featuredImageUrl: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
});

// Route
app.post('/articles', authMiddleware, async (req, res) => {
  try {
    const data = createArticleSchema.parse(req.body);
    const article = await prisma.article.create({
      data: { ...data, authorId: req.userId },
    });
    res.json({ success: true, data: article });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        details: err.errors,
      },
    });
  }
});
```

---

### 3.3 Error Handling

**Custom Error Class**:
```typescript
// server/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

// Usage
app.get('/articles/:id', async (req, res, next) => {
  try {
    const article = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!article) {
      throw new AppError(404, 'NOT_FOUND', 'Article not found');
    }
    res.json({ success: true, data: article });
  } catch (err) {
    next(err);
  }
});

// Error middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  
  res.status(status).json({
    success: false,
    error: { code, message: err.message, details: err.details },
  });
});
```

---

## 4. Testing Strategy

### 4.1 Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /____\
       
      /    \
     /Unit  \ Integration Tests (30%)
    /________\
    
   /          \
  / Unit Tests \ (60%)
 /____________\
```

### 4.2 Unit Tests (React Components)

**Tool**: Vitest + React Testing Library

```typescript
// client/src/components/__tests__/ArticleCard.test.tsx
import { render, screen } from '@testing-library/react';
import ArticleCard from '../ArticleCard';

describe('ArticleCard', () => {
  it('renders article title', () => {
    const article = {
      id: '1',
      titleEn: 'Test Article',
      categoryId: 'ai',
    };
    render(<ArticleCard article={article} />);
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });
  
  it('navigates to article on click', () => {
    // ...
  });
});
```

### 4.3 Integration Tests (API Routes)

**Tool**: Supertest + Jest

```typescript
// server/__tests__/articles.test.ts
import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

describe('Articles API', () => {
  beforeEach(async () => {
    await prisma.article.deleteMany();
  });
  
  it('creates an article', async () => {
    const res = await request(app)
      .post('/api/v1/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        titleEn: 'Test',
        titlePt: 'Teste',
        contentEn: 'Content...',
        contentPt: 'Conteúdo...',
        categoryId: 'ai',
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.titleEn).toBe('Test');
  });
});
```

### 4.4 E2E Tests (Playwright)

**Tool**: Playwright

```typescript
// e2e/article-creation.spec.ts
import { test, expect } from '@playwright/test';

test('Author can create and publish article', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'author@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/admin');
  
  // Create article
  await page.click('button:has-text("New Article")');
  await page.fill('input[name="titleEn"]', 'My First Article');
  await page.fill('textarea[name="contentEn"]', 'Lorem ipsum dolor...');
  await page.selectOption('select[name="category"]', 'ai');
  
  // Publish
  await page.click('button:has-text("Publish")');
  await expect(page).toHaveURL(/\/article\/\d+/);
  await expect(page.locator('h1')).toContainText('My First Article');
});
```

---

## 5. Performance Optimization

### 5.1 Frontend Optimization

**Code Splitting**:
```typescript
// client/src/App.tsx
import { lazy, Suspense } from 'react';

const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

export const Router = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Switch>
      <Route path="/ai" component={CategoryPage} />
      <Route path="/admin" component={AdminDashboard} />
    </Switch>
  </Suspense>
);
```

**Bundle Size Targets**:
| Asset | Target | Current | Improvement |
|-------|--------|---------|-------------|
| Core JS (gzipped) | <150KB | ~200KB | Remove unused Radix components |
| CSS (gzipped) | <30KB | ~40KB | Purge unused Tailwind classes |
| Total (gzipped) | <200KB | ~300KB | 33% reduction |

**Image Optimization**:
- WebP format (automatic via CloudFront)
- Responsive images (srcset, sizes)
- Lazy loading (loading="lazy")

### 5.2 Backend Optimization

**Database Query Optimization**:
1. Eager load relations (prevent N+1)
2. Select only needed fields
3. Use pagination (don't fetch 10K articles)
4. Index foreign keys & search fields

**API Response Compression**:
```typescript
app.use(compression());  // Gzip by default
```

**Caching Headers**:
```typescript
app.get('/api/v1/articles/:id', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300'); // 5 min
  // ...
});
```

### 5.3 Performance Monitoring

**Metrics to Track**:
- TTFB (Time to First Byte): <200ms
- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1
- API response time (p95): <300ms

**Tools**:
- Lighthouse CI (built into GitHub Actions)
- Datadog APM (advanced, optional)
- Sentry for error tracking

---

## 6. Security Considerations

### 6.1 OWASP Top 10

| Vulnerability | Mitigation |
|---|---|
| **Injection** | Use parameterized queries (Prisma), input validation (Zod) |
| **Broken Auth** | JWT with short TTL, bcrypt hashing, rate limiting |
| **Sensitive Data Exposure** | HTTPS only, secure cookies (httpOnly, Secure, SameSite) |
| **XML External Entities** | No XML parsing needed |
| **Broken Access Control** | Middleware role checks (admin, author) |
| **Security Misconfiguration** | Helmet.js, environment variable secrets |
| **XSS** | React auto-escapes by default, sanitize user content |
| **Insecure Deserialization** | Validate JSON schema (Zod) |
| **Using Components with Known Vulnerabilities** | `npm audit`, weekly updates |
| **Insufficient Logging** | Sentry + structured logging |

### 6.2 Key Security Practices

```typescript
// server/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize'; // or equivalent for SQL

app.use(helmet()); // Security headers

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,  // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// XSS protection: React auto-escapes, use trusted lib for HTML
import DOMPurify from 'isomorphic-dompurify';
const cleanHtml = DOMPurify.sanitize(userHtml);
```

### 6.3 Secrets Management

**.env file** (DO NOT COMMIT):
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=very-long-random-secret-min-32-chars
OAUTH_GOOGLE_CLIENT_SECRET=xxx
SENDGRID_API_KEY=SG.xxx
```

**Deployment** (GitHub Secrets or Railway environment):
- Store all secrets as environment variables
- Never commit `.env` (add to .gitignore)
- Rotate secrets quarterly

---

## 7. Monitoring & Observability

### 7.1 Logging

**Structured Logging**:
```typescript
// server/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('Article created', { articleId, userId });
logger.error('Database error', { error: err.message });
```

### 7.2 Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.errorHandler());
```

### 7.3 Health Checks

```typescript
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date() });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});
```

---

## 8. Deployment Architecture

### 8.1 Staging Environment

**Setup** (parallel to production):
- Same code, same infrastructure
- Real data (anonymized production backup)
- Separate database, Redis, S3 bucket
- Staging domain: `staging.ctrlaltnews.com`

**Purpose**:
- Test migrations before production
- Load testing
- Security audit
- Verify deployment process

### 8.2 Blue-Green Deployment

**Process**:
1. Deploy new version to "Green" environment
2. Run smoke tests on Green
3. Switch load balancer from Blue to Green
4. Keep Blue running for instant rollback if needed
5. After 24h, retire Blue (or re-deploy as next Green)

**Benefits**: Zero downtime, instant rollback.

### 8.3 Database Migration Strategy

**Before Deployment**:
```bash
# Test migration locally
npm run prisma:migrate:dev --name "add_search_index"

# Commit migration files
git add prisma/migrations/
git commit -m "chore: add search index migration"
```

**During Deployment**:
```bash
# Run migrations (safe, locks table temporarily)
npm run prisma:migrate:deploy

# If rollback needed:
npm run prisma:migrate:resolve --rolled-back migration_name
```

**Prisma Best Practices**:
- **Never** use `prisma db push` in production (might lose data)
- Always use `prisma migrate` (tracks history)
- Test migrations on staging first

---

## 9. Technology Summary

### Frontend
- **React 19** (framework)
- **Vite** (bundler)
- **TypeScript 5.6** (language)
- **Tailwind CSS v4** (styling)
- **Wouter** (routing)
- **React Query** (caching)
- **Zod** (validation)
- **Vitest** (unit tests)
- **Playwright** (E2E tests)

### Backend
- **Express.js 4.21** (API framework)
- **TypeScript 5.6** (language)
- **Prisma** (ORM)
- **PostgreSQL 14+** (database)
- **Redis** (cache, sessions)
- **jsonwebtoken** (JWT)
- **Zod** (validation)
- **Helmet** (security)
- **Sentry** (error tracking)
- **Winston** (logging)

### Infrastructure
- **Railway or AWS** (hosting)
- **GitHub Actions** (CI/CD)
- **CloudFront + S3** (CDN)
- **PostgreSQL RDS** (managed database)
- **Redis Cloud** (managed cache)
- **Datadog or New Relic** (monitoring, optional)

---

## 10. Decision Log

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Express + TypeScript | Balance of simplicity and type safety | 2026-04-16 | APPROVED |
| PostgreSQL + Prisma | Type-safe, excellent migrations, scales well | 2026-04-16 | APPROVED |
| JWT + httpOnly cookies | Secure, XSS-resistant, industry standard | 2026-04-16 | APPROVED |
| Redis for caching | Shared across instances, automatic expiration | 2026-04-16 | APPROVED |
| PostgreSQL full-text search | Built-in, no external dependency, sufficient for MVP | 2026-04-16 | APPROVED |
| Railway for MVP, AWS for scale | Railway simpler, AWS when hitting limits | 2026-04-16 | APPROVED |
| Defer Elasticsearch to Q4 | Full-text search sufficient, reduces complexity | 2026-04-16 | APPROVED |
| Defer GraphQL to Q4 | REST API sufficient for MVP, GraphQL overhead | 2026-04-16 | APPROVED |

---

## Appendix: Tech Debt & Future Improvements

### Current Limitations (Acceptable for MVP)
- No real-time comments (no WebSocket)
- No advanced caching (Redis optional, add if needed)
- No ML-based recommendations (rule-based algorithm sufficient)
- No separate frontend/backend repos (monorepo OK for MVP)

### Future Improvements (Q3–Q4 2026)
1. **Elasticsearch**: For advanced search features
2. **GraphQL**: Alongside REST API for flexibility
3. **Microservices**: If traffic justifies splitting (unlikely year 1)
4. **WebSocket**: Real-time comments, notifications
5. **Message Queue** (Kafka): Event streaming for analytics
6. **CDN Edge Caching**: More aggressive caching
7. **Serverless Functions** (AWS Lambda): Background jobs (email digest)

---

**Document**: Technical Strategy v1.0  
**Status**: Draft — Awaiting architecture review  
**Last Updated**: 2026-04-16
