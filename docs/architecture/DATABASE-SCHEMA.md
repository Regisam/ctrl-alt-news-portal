# Database Schema Design — PostgreSQL + Prisma
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Ready for Implementation  
**Format**: Prisma Schema + SQL Reference

---

## Overview

Complete PostgreSQL database schema for Ctrl Alt News Portal, designed for:
- **10 core tables** (users, articles, categories, comments, reactions, bookmarks, contacts, page_views, tags, article_tags)
- **Full-text search** support (PostgreSQL tsvector)
- **Relational integrity** (foreign keys, constraints)
- **Performance** (strategic indexes on all common queries)
- **Analytics ready** (page views, engagement metrics)

---

## Prisma Schema File

**Location**: `prisma/schema.prisma`

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUM DEFINITIONS
// ============================================================================

enum UserRole {
  USER    // Regular reader
  AUTHOR  // Can create articles
  ADMIN   // Full access
}

enum ArticleStatus {
  DRAFT     // Not published
  PUBLISHED // Visible to all
  ARCHIVED  // Hidden but kept for history
}

enum CommentStatus {
  PENDING   // Awaiting moderation
  APPROVED  // Visible
  REJECTED  // Spam/inappropriate
}

enum ReactionType {
  LIKE  // Simple like
  CLAP  // Multiple claps (1-50)
}

// ============================================================================
// CORE MODELS
// ============================================================================

/// User account (local email/password or OAuth)
model User {
  id                String     @id @default(cuid())
  
  // Email & Authentication
  email             String     @unique
  emailVerified     Boolean    @default(false)
  passwordHash      String?    // Null if OAuth only
  
  // OAuth
  googleId          String?    @unique
  oauthProvider     String?    // "google", "github", etc.
  
  // Profile
  username          String?    @unique
  fullName          String?
  bio               String?    @db.Text
  avatarUrl         String?    @default("https://api.dicebear.com/7.x/avataaars/svg")
  
  // Roles & Permissions
  role              UserRole   @default(USER)
  
  // Timestamps
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  lastLoginAt       DateTime?
  
  // Relations
  articles          Article[]
  comments          Comment[]
  bookmarks         Bookmark[]
  reactions         Reaction[]
  pageViews         PageView[]
  
  @@index([email])
  @@index([googleId])
  @@map("users")
}

/// Article (blog post)
model Article {
  id                String     @id @default(cuid())
  
  // Content (Bilingual)
  titleEn           String
  titlePt           String
  slug              String     @unique // For SEO: /articles/my-article-slug
  
  excerptEn         String     @db.Text
  excerptPt         String     @db.Text
  
  contentEn         String     @db.Text // Markdown
  contentPt         String     @db.Text // Markdown
  
  // Media
  featuredImageUrl  String?
  
  // Metadata
  categoryId        String
  authorId          String
  status            ArticleStatus @default(DRAFT)
  readingTimeMinutes Int?
  viewCount         Int        @default(0) // Denormalized for performance
  
  // Publishing
  publishedAt       DateTime?
  scheduledAt       DateTime?  // For future publishing
  
  // Content Management
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  deletedAt         DateTime?  // Soft delete
  
  // Relations
  category          Category   @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  author            User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments          Comment[]
  reactions         Reaction[]
  bookmarks         Bookmark[]
  pageViews         PageView[]
  tags              ArticleTag[]
  
  // Indexes
  @@index([categoryId])
  @@index([authorId])
  @@index([publishedAt])
  @@index([status])
  @@index([slug])
  @@map("articles")
}

/// Category (AI, Science, Robotics, Gadgets)
model Category {
  id                String     @id @default(cuid())
  
  // Bilingual
  nameEn            String
  namePt            String
  
  slug              String     @unique // For URL: /category/ai
  descriptionEn     String?    @db.Text
  descriptionPt     String?    @db.Text
  
  // Styling
  colorHex          String     @default("#06B6D4") // Neon color
  iconUrl           String?
  
  // Metadata
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  // Relations
  articles          Article[]
  
  @@unique([nameEn])
  @@unique([namePt])
  @@map("categories")
}

/// Comment on article (supports threading via parentId)
model Comment {
  id                String     @id @default(cuid())
  
  // Content
  content           String     @db.Text
  
  // Threading (replies)
  parentId          String?    // FK to parent comment for nested replies
  
  // Moderation
  status            CommentStatus @default(PENDING)
  
  // Relations
  articleId         String
  authorId          String
  
  // Timestamps
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  deletedAt         DateTime?  // Soft delete
  
  // Relations
  article           Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  author            User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent            Comment?   @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies           Comment[]  @relation("CommentReplies")
  
  // Indexes
  @@index([articleId])
  @@index([authorId])
  @@index([parentId])
  @@index([status])
  @@map("comments")
}

/// User reactions to articles (like, clap)
model Reaction {
  id                String     @id @default(cuid())
  
  // Reaction data
  reactionType      ReactionType
  count             Int        @default(1) // For claps (1-50)
  
  // Relations
  articleId         String
  userId            String
  
  // Timestamp
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  
  // Relations
  article           Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user              User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Constraint: one reaction per user per article per type
  @@unique([articleId, userId, reactionType])
  @@index([articleId])
  @@index([userId])
  @@map("reactions")
}

/// Bookmarks (saved articles for later reading)
model Bookmark {
  id                String     @id @default(cuid())
  
  // Relations
  userId            String
  articleId         String
  
  // Timestamp
  createdAt         DateTime   @default(now())
  
  // Relations
  user              User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  article           Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  // Constraint: one bookmark per user per article
  @@unique([userId, articleId])
  @@index([userId])
  @@index([articleId])
  @@map("bookmarks")
}

/// Tags for articles
model Tag {
  id                String     @id @default(cuid())
  
  // Metadata
  name              String     @unique
  slug              String     @unique
  
  // Timestamps
  createdAt         DateTime   @default(now())
  
  // Relations
  articles          ArticleTag[]
  
  @@map("tags")
}

/// Join table: Articles ↔ Tags
model ArticleTag {
  articleId         String
  tagId             String
  
  // Timestamp
  createdAt         DateTime   @default(now())
  
  // Relations
  article           Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag               Tag        @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([articleId, tagId])
  @@index([tagId])
  @@map("article_tags")
}

/// Contact form submissions
model Contact {
  id                String     @id @default(cuid())
  
  // Form data
  name              String
  email             String
  subject           String
  message           String     @db.Text
  
  // Metadata
  topic             String?    // e.g., "Editorial", "Press", "Advertising"
  status            String     @default("new") // "new", "responded"
  responseNotes     String?    @db.Text
  
  // Timestamps
  createdAt         DateTime   @default(now())
  respondedAt       DateTime?
  
  @@index([email])
  @@index([status])
  @@map("contacts")
}

/// Page view analytics
model PageView {
  id                String     @id @default(cuid())
  
  // Context
  pagePath          String     // e.g., "/articles/1", "/category/ai"
  referrer          String?    // Referring URL
  userAgent         String?    // Browser info (truncated for privacy)
  
  // Session
  sessionId         String?    // For tracking session flow
  
  // User & Article
  userId            String?    // Null for anonymous users
  articleId         String?    // Null for non-article pages
  
  // IP (hashed for privacy compliance)
  ipHashCrc32       String?    // CRC32 of hashed IP
  
  // Timestamp
  createdAt         DateTime   @default(now())
  
  // Relations
  user              User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
  article           Article?   @relation(fields: [articleId], references: [id], onDelete: SetNull)
  
  // Indexes for analytics queries
  @@index([articleId])
  @@index([userId])
  @@index([createdAt])
  @@index([pagePath])
  @@map("page_views")
}

// ============================================================================
// SEARCH INDEX (PostgreSQL FTS)
// ============================================================================

model ArticleSearchIndex {
  articleId         String     @id @unique
  
  // Full-text search vector (tsvector)
  // Automatically updated via trigger in raw SQL
  searchVector      Unsupported("tsvector")?
  
  // Relation
  article           Article    @relation(fields: [articleId], references: [id], onDelete: Cascade)
  
  @@index([searchVector], type: Gist)
  @@map("article_search_index")
}
```

---

## Raw SQL Schema (Reference)

**Location**: `prisma/migrations/{timestamp}_initial_schema.sql`

This is auto-generated by Prisma, but here's the complete SQL for reference:

```sql
-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Users table
CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "passwordHash" TEXT,
  "googleId" TEXT UNIQUE,
  "oauthProvider" TEXT,
  "username" TEXT UNIQUE,
  "fullName" TEXT,
  "bio" TEXT,
  "avatarUrl" TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg',
  "role" TEXT NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastLoginAt" TIMESTAMP(3)
);

-- Categories table
CREATE TABLE "categories" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nameEn" TEXT NOT NULL,
  "namePt" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "descriptionEn" TEXT,
  "descriptionPt" TEXT,
  "colorHex" TEXT NOT NULL DEFAULT '#06B6D4',
  "iconUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("nameEn"),
  UNIQUE ("namePt")
);

-- Articles table
CREATE TABLE "articles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "titleEn" TEXT NOT NULL,
  "titlePt" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "excerptEn" TEXT NOT NULL,
  "excerptPt" TEXT NOT NULL,
  "contentEn" TEXT NOT NULL,
  "contentPt" TEXT NOT NULL,
  "featuredImageUrl" TEXT,
  "categoryId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "readingTimeMinutes" INTEGER,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE,
  CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Comments table
CREATE TABLE "comments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "parentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "articleId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE,
  CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments" ("id") ON DELETE CASCADE
);

-- Reactions table
CREATE TABLE "reactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reactionType" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "articleId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reactions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE,
  CONSTRAINT "reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  UNIQUE ("articleId", "userId", "reactionType")
);

-- Bookmarks table
CREATE TABLE "bookmarks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "articleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "bookmarks_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE,
  UNIQUE ("userId", "articleId")
);

-- Tags table
CREATE TABLE "tags" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Article-Tags join table
CREATE TABLE "article_tags" (
  "articleId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("articleId", "tagId"),
  CONSTRAINT "article_tags_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE,
  CONSTRAINT "article_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE
);

-- Contacts table
CREATE TABLE "contacts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "topic" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "responseNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "respondedAt" TIMESTAMP(3)
);

-- Page views analytics table
CREATE TABLE "page_views" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "pagePath" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "sessionId" TEXT,
  "userId" TEXT,
  "articleId" TEXT,
  "ipHashCrc32" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "page_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL,
  CONSTRAINT "page_views_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE SET NULL
);

-- Article search index table
CREATE TABLE "article_search_index" (
  "articleId" TEXT NOT NULL PRIMARY KEY,
  "searchVector" TSVECTOR,
  CONSTRAINT "article_search_index_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles" ("id") ON DELETE CASCADE
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

CREATE INDEX "articles_categoryId_idx" ON "articles"("categoryId");
CREATE INDEX "articles_authorId_idx" ON "articles"("authorId");
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt");
CREATE INDEX "articles_status_idx" ON "articles"("status");
CREATE INDEX "articles_slug_idx" ON "articles"("slug");

CREATE INDEX "comments_articleId_idx" ON "comments"("articleId");
CREATE INDEX "comments_authorId_idx" ON "comments"("authorId");
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");
CREATE INDEX "comments_status_idx" ON "comments"("status");

CREATE INDEX "reactions_articleId_idx" ON "reactions"("articleId");
CREATE INDEX "reactions_userId_idx" ON "reactions"("userId");

CREATE INDEX "bookmarks_userId_idx" ON "bookmarks"("userId");
CREATE INDEX "bookmarks_articleId_idx" ON "bookmarks"("articleId");

CREATE INDEX "article_tags_tagId_idx" ON "article_tags"("tagId");

CREATE INDEX "contacts_email_idx" ON "contacts"("email");
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

CREATE INDEX "page_views_articleId_idx" ON "page_views"("articleId");
CREATE INDEX "page_views_userId_idx" ON "page_views"("userId");
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");
CREATE INDEX "page_views_pagePath_idx" ON "page_views"("pagePath");

-- Full-text search index (GIN for fast lookups)
CREATE INDEX "article_search_index_searchVector_idx" ON "article_search_index" USING GIN ("searchVector");

-- ============================================================================
-- TRIGGERS (Auto-update search vector on article changes)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_article_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "article_search_index" ("articleId", "searchVector")
  VALUES (
    NEW."id",
    TO_TSVECTOR('english', COALESCE(NEW."titleEn", '') || ' ' || COALESCE(NEW."excerptEn", '') || ' ' || COALESCE(NEW."contentEn", ''))
  )
  ON CONFLICT ("articleId") DO UPDATE SET
    "searchVector" = EXCLUDED."searchVector";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_search_vector_trigger
AFTER INSERT OR UPDATE ON "articles"
FOR EACH ROW
EXECUTE FUNCTION update_article_search_vector();
```

---

## Key Design Decisions

### 1. Bilingual Content (titleEn/titlePt)

**Decision**: Separate columns per language instead of JSON.

**Rationale**:
- Indexed columns (better for queries)
- Type-safe (never null, always strings)
- Easier filtering: WHERE titleEn ILIKE '%blockchain%'
- Simpler Prisma schema

**Alternative**: Single JSON field `title: { en: "...", pt: "..." }` — harder to query, loses type safety.

### 2. Soft Deletes (deletedAt)

**Decision**: Keep deleted records with `deletedAt` timestamp.

**Rationale**:
- Data recovery (can restore if accidental delete)
- Referential integrity (foreign keys don't break)
- Analytics (see historical data)
- GDPR compliance (can export user data history)

**Query Pattern**:
```typescript
// Only active articles
const articles = await prisma.article.findMany({
  where: { deletedAt: null }
});
```

### 3. Denormalized viewCount

**Decision**: Store `viewCount` on articles instead of calculating from page_views.

**Rationale**:
- Aggregation queries are slow (COUNT(*) on 1M page_views takes 500ms)
- Read-heavy workload (view counts displayed on every list/grid)
- Easy to invalidate with cache

**Update Pattern**:
```typescript
// When user views article
await prisma.article.update({
  where: { id: articleId },
  data: { viewCount: { increment: 1 } }
});
```

### 4. Composite Primary Key for ArticleTag

**Decision**: `@@id([articleId, tagId])` instead of auto-increment ID.

**Rationale**:
- Natural key (prevents duplicates)
- Faster queries (no extra column)
- Simpler schema

### 5. OneToMany Comment Replies (parentId)

**Decision**: Self-referencing Comment.parentId for nested replies.

**Rationale**:
- Unlimited nesting depth
- Simple recursive queries
- Supported by Prisma with `@relation("CommentReplies")`

**Query Pattern**:
```typescript
// Get article with nested comments
const article = await prisma.article.findUnique({
  where: { id: articleId },
  include: {
    comments: {
      where: { parentId: null }, // Top-level only
      include: { replies: true } // With nested replies
    }
  }
});
```

---

## Performance Indexes

| Index | Purpose | Query |
|-------|---------|-------|
| `users(email)` | Login lookup | `SELECT * FROM users WHERE email = ?` |
| `users(googleId)` | OAuth lookup | `SELECT * FROM users WHERE googleId = ?` |
| `articles(categoryId)` | Category filtering | `SELECT * FROM articles WHERE categoryId = ? ORDER BY publishedAt DESC` |
| `articles(authorId)` | Author articles | `SELECT * FROM articles WHERE authorId = ?` |
| `articles(publishedAt)` | Trending/recent | `SELECT * FROM articles WHERE status = 'PUBLISHED' ORDER BY publishedAt DESC` |
| `articles(slug)` | Article detail lookup | `SELECT * FROM articles WHERE slug = ?` |
| `comments(articleId)` | Article comments | `SELECT * FROM comments WHERE articleId = ? ORDER BY createdAt DESC` |
| `reactions(articleId, userId)` | Check user reaction | `SELECT * FROM reactions WHERE articleId = ? AND userId = ?` |
| `bookmarks(userId)` | User bookmarks | `SELECT * FROM bookmarks WHERE userId = ?` |
| `page_views(articleId, createdAt)` | Analytics | `SELECT COUNT(*) FROM page_views WHERE articleId = ? AND createdAt > NOW() - INTERVAL 1 day` |
| `article_search_index(searchVector)` GIN | Full-text search | `SELECT * FROM article_search_index WHERE searchVector @@ plainto_tsquery(?)` |

---

## Seeding Strategy

**Location**: `prisma/seed.ts`

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const aiCat = await prisma.category.create({
    data: {
      nameEn: 'Artificial Intelligence',
      namePt: 'Inteligência Artificial',
      slug: 'ai',
      colorHex: '#06B6D4',
    }
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ctrlaltnews.io',
      passwordHash: await bcrypt.hash('AdminPassword123!', 12),
      fullName: 'Admin User',
      role: 'ADMIN',
    }
  });

  // Create sample articles
  await prisma.article.create({
    data: {
      titleEn: 'Getting Started with GPT-4',
      titlePt: 'Começando com GPT-4',
      slug: 'getting-started-gpt-4',
      excerptEn: 'A comprehensive guide...',
      excerptPt: 'Um guia abrangente...',
      contentEn: 'Lorem ipsum dolor sit amet...',
      contentPt: 'Lorem ipsum dolor sit amet...',
      categoryId: aiCat.id,
      authorId: adminUser.id,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      readingTimeMinutes: 8,
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seeding**:
```bash
npm run prisma:seed
```

---

## Migrations Workflow

### Creating a Migration

```bash
# Make changes to prisma/schema.prisma, then:
npx prisma migrate dev --name add_featured_image

# This will:
# 1. Create migration file: prisma/migrations/{timestamp}_add_featured_image/migration.sql
# 2. Apply migration to local database
# 3. Generate updated Prisma Client
```

### Applying Migration in Production

```bash
# Deploy to Railway: just push to main branch
# Railway auto-runs: npx prisma migrate deploy

# Check migration status:
npx prisma migrate status
```

---

## ER Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CTRL ALT NEWS SCHEMA                         │
├─────────────────────────────────────────────────────────────────────┤

┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ email (U)    │
│ passwordHash │─────────┐
│ googleId (U) │         │
│ role         │         │
│ username (U) │         │
│ fullName     │         │
│ bio          │         │
│ avatarUrl    │         │
│ createdAt    │         │
│ updatedAt    │         │
│ lastLoginAt  │         │
└──────────────┘         │
       ▲                 │
       │ 1               │
       │                 │
   ┌───┴──────────────────┴─────────────┬──────────────┐
   │                                    │              │
   │ N                              N    │ N           │ 1
   │                                    ▼              ▼
┌──────────────┐    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  articles    │    │   comments   │  │  reactions   │  │  bookmarks   │
├──────────────┤    ├──────────────┤  ├──────────────┤  ├──────────────┤
│ id (PK)      │    │ id (PK)      │  │ id (PK)      │  │ id (PK)      │
│ slug (U)     │    │ content      │  │ reactionType │  │ userId (FK)  │
│ titleEn      │    │ parentId (FK)│  │ count        │  │ articleId(FK)│
│ titlePt      │    │ status       │  │ articleId(FK)│  │ createdAt    │
│ contentEn    │    │ articleId(FK)│  │ userId (FK)  │  └──────────────┘
│ contentPt    │    │ authorId(FK) │  │ createdAt    │
│ categoryId(FK)   │ createdAt    │  │ updatedAt    │
│ authorId(FK) │    │ updatedAt    │  └──────────────┘
│ status       │    │ deletedAt    │
│ viewCount    │    └──────────────┘
│ publishedAt  │           ▲
│ createdAt    │           │ 1
│ updatedAt    │           │ N
│ deletedAt    │      Self-reference:
└──────────────┘      Comment replies
       │                (parentId)
       │ N
       │
       ├─────────────┬──────────────┬────────────────┐
       │             │              │                │
  ┌────┴────────┐  1 │      1 │     │      1 │
  │ categories  │    │       ▼      ▼            ▼
  ├─────────────┤    │   ┌──────────────────┐
  │ id (PK)     │    │   │  article_tags    │
  │ nameEn (U)  │    │   ├──────────────────┤
  │ namePt (U)  │    │   │ articleId (PK,FK)│
  │ slug (U)    │    │   │ tagId (PK, FK)   │
  │ colorHex    │    │   │ createdAt        │
  │ iconUrl     │    │   └──────────────────┘
  │ createdAt   │    │           │
  │ updatedAt   │    │           │ N
  └─────────────┘    │           │
                     │      ┌────┴────────┐
                     │      │    tags     │
                     │      ├─────────────┤
                     │      │ id (PK)     │
                     │      │ name (U)    │
                     │      │ slug (U)    │
                     │      │ createdAt   │
                     │      └─────────────┘
                     │
                     └─ Other tables:
                        - contacts (form submissions)
                        - page_views (analytics)
                        - article_search_index (FTS)
```

---

## Query Examples (Prisma Client)

### Get article with all relations

```typescript
const article = await prisma.article.findUnique({
  where: { slug: 'my-article-slug' },
  include: {
    author: { select: { id: true, fullName: true, avatarUrl: true } },
    category: true,
    comments: {
      where: { deletedAt: null, status: 'APPROVED' },
      include: { author: true, replies: true }
    },
    reactions: true,
    tags: { include: { tag: true } }
  }
});
```

### List published articles by category

```typescript
const articles = await prisma.article.findMany({
  where: {
    categoryId: categoryId,
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() },
    deletedAt: null
  },
  orderBy: { publishedAt: 'desc' },
  take: 10,
  skip: (page - 1) * 10,
  include: { author: true, category: true }
});
```

### Full-text search

```typescript
const results = await prisma.$queryRaw`
  SELECT a.* FROM articles a
  JOIN article_search_index si ON a.id = si."articleId"
  WHERE si."searchVector" @@ plainto_tsquery('english', ${query})
  AND a.status = 'PUBLISHED'
  AND a.deletedAt IS NULL
  ORDER BY ts_rank(si."searchVector", plainto_tsquery('english', ${query})) DESC
  LIMIT 20
`;
```

---

## Constraints Summary

| Constraint | Type | Purpose |
|-----------|------|---------|
| `users(email)` UNIQUE | Data integrity | Prevent duplicate emails |
| `users(googleId)` UNIQUE | Data integrity | Prevent duplicate OAuth accounts |
| `articles(slug)` UNIQUE | SEO | Each article has unique URL slug |
| `categories(nameEn, namePt)` UNIQUE | Business rule | No duplicate category names |
| `reactions(articleId, userId, type)` UNIQUE | Business rule | One reaction per user per article type |
| `bookmarks(userId, articleId)` UNIQUE | Business rule | One bookmark per user per article |
| FK: articles → categories | Referential | Delete category → cascade delete articles |
| FK: articles → users (author) | Referential | Delete user → cascade delete articles |
| FK: comments → articles | Referential | Delete article → cascade delete comments |

---

## Migration Checklist

- [ ] Prisma initialized: `npm install @prisma/client prisma`
- [ ] PostgreSQL database created (local or Railway)
- [ ] `.env` configured with DATABASE_URL
- [ ] `prisma/schema.prisma` created (from above)
- [ ] First migration created: `npx prisma migrate dev --name initial_schema`
- [ ] Seed data applied: `npm run prisma:seed`
- [ ] TypeScript client generated: `npx prisma generate`
- [ ] Queries tested in development
- [ ] Ready for @dev to implement API endpoints

---

**Document Version**: 1.0  
**Ready for**: Story 1.2 (PostgreSQL Schema Design & Prisma Setup)  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
