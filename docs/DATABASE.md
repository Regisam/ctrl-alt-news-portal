# Database Documentation

Ctrl Alt News Portal — PostgreSQL + Prisma ORM

## Overview

The database is built on **PostgreSQL** with **Prisma ORM** for type-safe database access in TypeScript.

**Setup Status**: Story 1.2 (PostgreSQL + Prisma Schema)

## Quick Start

### Prerequisites

- PostgreSQL 14+ running locally or Railway
- Node.js 18+
- Environment variables configured in `.env`

### Setup Instructions

1. **Install dependencies**:
```bash
pnpm install
```

2. **Configure database URL** in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ctrl_alt_news_dev"
```

3. **Generate Prisma Client**:
```bash
npx prisma generate
```

4. **Apply migrations** (when database is running):
```bash
pnpm prisma:deploy
```

5. **Seed development data**:
```bash
pnpm prisma:seed
```

## Database Schema

### Core Tables (10 total)

#### 1. **users** - User accounts
- `id` (CUID primary key)
- `email` (unique)
- `emailVerified` (boolean)
- `passwordHash` (nullable for OAuth)
- `googleId` (unique for OAuth)
- `oauthProvider` (google, github, etc.)
- `username` (unique)
- `fullName`
- `bio` (text)
- `avatarUrl` (Dicebear default)
- `role` (enum: USER, AUTHOR, ADMIN)
- `createdAt`, `updatedAt`, `lastLoginAt`

**Indexes**: email, googleId

---

#### 2. **categories** - Article categories
- `id` (CUID)
- `nameEn`, `namePt` (bilingual, unique)
- `slug` (unique)
- `descriptionEn`, `descriptionPt` (text, optional)
- `colorHex` (neon color code)
- `iconUrl` (optional)
- `createdAt`, `updatedAt`

**Fixed Categories**:
- AI (teal #06B6D4)
- Science (purple #A855F7)
- Robotics (red #EF4444)
- Gadgets (orange #F59E0B)

---

#### 3. **articles** - Blog posts
- `id` (CUID)
- `titleEn`, `titlePt` (bilingual)
- `slug` (unique, SEO)
- `excerptEn`, `excerptPt` (text summaries)
- `contentEn`, `contentPt` (markdown)
- `featuredImageUrl` (optional)
- `categoryId` (FK → categories)
- `authorId` (FK → users)
- `status` (enum: DRAFT, PUBLISHED, ARCHIVED)
- `readingTimeMinutes` (optional)
- `viewCount` (denormalized, default 0)
- `publishedAt`, `scheduledAt` (optional timestamps)
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)

**Indexes**: categoryId, authorId, publishedAt, status, slug

---

#### 4. **comments** - Article comments with threading
- `id` (CUID)
- `content` (text)
- `parentId` (FK → comments, self-referencing for nested replies)
- `status` (enum: PENDING, APPROVED, REJECTED)
- `articleId` (FK → articles)
- `authorId` (FK → users)
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)

**Indexes**: articleId, authorId, parentId, status

**Features**: Nested comment replies (recursion via parentId)

---

#### 5. **reactions** - User reactions to articles
- `id` (CUID)
- `reactionType` (enum: LIKE, CLAP)
- `count` (default 1, for claps 1-50)
- `articleId` (FK → articles)
- `userId` (FK → users)
- `createdAt`, `updatedAt`

**Constraint**: Unique on (articleId, userId, reactionType) — one reaction per user per article per type

**Indexes**: articleId, userId

---

#### 6. **bookmarks** - Saved articles
- `id` (CUID)
- `userId` (FK → users)
- `articleId` (FK → articles)
- `createdAt`

**Constraint**: Unique on (userId, articleId) — one bookmark per user per article

**Indexes**: userId, articleId

---

#### 7. **tags** - Article tags
- `id` (CUID)
- `name` (unique)
- `slug` (unique)
- `createdAt`

---

#### 8. **article_tags** - Many-to-many join
- `articleId` (FK → articles, part of composite PK)
- `tagId` (FK → tags, part of composite PK)
- `createdAt`

**Primary Key**: Composite (articleId, tagId)

**Indexes**: tagId

---

#### 9. **contacts** - Contact form submissions
- `id` (CUID)
- `name`
- `email`
- `subject`
- `message` (text)
- `topic` (Editorial, Press, Advertising, etc.)
- `status` (default 'new': new, responded)
- `responseNotes` (text, optional)
- `createdAt`, `respondedAt` (optional)

**Indexes**: email, status

---

#### 10. **page_views** - Analytics
- `id` (CUID)
- `pagePath` (e.g., /articles/slug, /category/ai)
- `referrer` (optional)
- `userAgent` (optional, truncated for privacy)
- `sessionId` (optional)
- `userId` (FK → users, nullable for anonymous)
- `articleId` (FK → articles, nullable for non-article pages)
- `ipHashCrc32` (CRC32 of hashed IP, privacy-compliant)
- `createdAt`

**Indexes**: articleId, userId, createdAt, pagePath

---

### Search Index

#### 11. **article_search_index** - Full-text search
- `articleId` (PK, FK → articles)
- `searchVector` (PostgreSQL tsvector, updated via trigger)

**Index Type**: GIN (fast for full-text search)

**Trigger**: Auto-updates on INSERT/UPDATE to articles
- Combines titleEn, excerptEn, contentEn into searchVector

---

## Relationships

```
User (1) ──→ (N) Article (author)
User (1) ──→ (N) Comment (author)
User (1) ──→ (N) Bookmark
User (1) ──→ (N) Reaction
User (1) ──→ (N) PageView

Category (1) ──→ (N) Article

Article (1) ──→ (N) Comment
Article (1) ──→ (N) Reaction
Article (1) ──→ (N) Bookmark
Article (1) ──→ (N) PageView
Article (1) ──→ (N) ArticleTag
Article (1) ──→ (1) ArticleSearchIndex

Comment (1) ──→ (N) Comment (parent-child replies)

Tag (1) ──→ (N) ArticleTag
```

---

## Enums

### UserRole
- `USER` — Regular reader
- `AUTHOR` — Can create articles
- `ADMIN` — Full access

### ArticleStatus
- `DRAFT` — Not published
- `PUBLISHED` — Visible to all
- `ARCHIVED` — Hidden but kept for history

### CommentStatus
- `PENDING` — Awaiting moderation
- `APPROVED` — Visible
- `REJECTED` — Spam/inappropriate

### ReactionType
- `LIKE` — Simple like
- `CLAP` — Multiple claps (1-50)

---

## Performance Considerations

### Denormalized Fields

**viewCount** on articles:
- Avoids slow COUNT(*) aggregations
- Updated incrementally when user views article
- Can be invalidated with cache (Redis)

### Strategic Indexes

All foreign key columns are indexed for join performance:
- `articles(categoryId, authorId, publishedAt, status)`
- `comments(articleId, authorId, parentId, status)`
- `reactions(articleId, userId)`
- `bookmarks(userId, articleId)`
- `page_views(articleId, userId, createdAt, pagePath)`

Full-text search uses PostgreSQL GIN index on tsvector.

### Soft Deletes

`deletedAt` field on articles, comments:
- Data recovery capability
- Referential integrity maintained
- Query pattern: `WHERE deletedAt IS NULL`

---

## Common Queries

### Get published articles by category
```typescript
const articles = await prisma.article.findMany({
  where: {
    categoryId: categoryId,
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() },
    deletedAt: null,
  },
  orderBy: { publishedAt: 'desc' },
  include: { author: true, category: true, tags: { include: { tag: true } } },
  take: 10,
  skip: 0,
});
```

### Get article with all relations
```typescript
const article = await prisma.article.findUnique({
  where: { slug: 'article-slug' },
  include: {
    author: true,
    category: true,
    comments: {
      where: { deletedAt: null, status: 'APPROVED' },
      include: { author: true, replies: true },
    },
    reactions: true,
    tags: { include: { tag: true } },
    searchIndex: true,
  },
});
```

### Full-text search
```typescript
const results = await prisma.$queryRaw`
  SELECT a.* FROM articles a
  JOIN article_search_index si ON a.id = si."articleId"
  WHERE si."searchVector" @@ plainto_tsquery('english', ${query})
  AND a.status = 'PUBLISHED'
  AND a."deletedAt" IS NULL
  ORDER BY ts_rank(si."searchVector", plainto_tsquery('english', ${query})) DESC
  LIMIT 20
`;
```

### Nested comments
```typescript
const comments = await prisma.comment.findMany({
  where: { articleId: articleId, parentId: null, deletedAt: null },
  include: { replies: { include: { author: true } }, author: true },
});
```

---

## Migrations

### Creating a new migration
```bash
# Edit prisma/schema.prisma, then:
pnpm prisma:migrate "add_new_field"
```

### Applying migrations to production
```bash
# Railway auto-runs migrations on deploy
# Or manually:
pnpm prisma:deploy
```

### Resetting database (development only)
```bash
pnpm prisma:reset
```

---

## Seeding

Development database is seeded with:
- 4 categories (AI, Science, Robotics, Gadgets)
- 3 users (admin, author, reader)
- 5 articles (1+ per category)
- 3 tags (Machine Learning, Neural Networks, Innovation)
- 4 comments (including 1 nested reply)
- 2 reactions (like, clap)
- 2 bookmarks
- 2 page views

**To seed**:
```bash
pnpm prisma:seed
```

---

## Prisma Client Usage

### Import in server code
```typescript
import { prisma } from '@server/src/prisma';

// Use prisma for queries
const user = await prisma.user.findUnique({ where: { email } });
```

### Client is a singleton
- Located in `server/src/prisma.ts`
- One connection per application instance
- Graceful shutdown on SIGINT/SIGTERM

---

## Files

- `prisma/schema.prisma` — Schema definition
- `prisma/migrations/0_init/migration.sql` — Initial migration
- `prisma/seed.ts` — Seed script
- `server/src/prisma.ts` — Client factory
- `.env` — Database connection URL

---

## Troubleshooting

### Connection refused
```
Error: P1001 Can't reach database server at localhost:5432
```
Solution: Ensure PostgreSQL is running on localhost:5432

### Missing .env
```
Error: Missing env var "DATABASE_URL"
```
Solution: Copy `.env.example` to `.env` and configure

### Migration conflicts
```
Error: Failed to apply migration
```
Solution: Run `npx prisma migrate resolve --rolled-back 0_init` to fix

### Seed fails
```
Error: Foreign key constraint failed
```
Solution: Run `pnpm prisma:reset` to reset database, then seed again

---

## References

- Prisma Docs: https://www.prisma.io/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- Railway Deployment: https://railway.app

**Last Updated**: 2026-04-18  
**Status**: Ready for Implementation  
**Maintainer**: Dex (Development Agent)
