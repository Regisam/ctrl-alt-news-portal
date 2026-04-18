# Implementation Guide for @dev — Sprint 1-2 Kickoff
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Audience**: @dev (Dex), Development Team  
**Scope**: Start of Sprints 1-2 (Backend Infrastructure)

---

## Welcome, @dev!

This guide takes you from zero to "hello world" with a working Express API + PostgreSQL + Prisma setup. All architectural decisions are locked in (see TECH-STACK-VALIDATION.md if curious). Your job: **implement exactly what these documents specify**.

---

## Pre-Start Checklist

- [ ] Forked/cloned `ctrl-alt-news-portal` repo
- [ ] Node.js 18+ installed (`node --version`)
- [ ] PostgreSQL installed locally OR Docker (`docker --version`)
- [ ] Git configured (`git config user.name`)
- [ ] VS Code with TypeScript + Prettier extensions
- [ ] Read TECH-STACK-VALIDATION.md (10 min, background)

---

## Sprint 1 Overview (Weeks 1-2)

**Goal**: Working Express API with PostgreSQL database.

### Stories in Sprint 1

1. **Story 1.1**: Setup Express.js + TypeScript (8h)
2. **Story 1.2**: PostgreSQL Schema + Prisma (32h)
3. **Story 1.3**: Seed Data (4h)
4. **Story 1.4**: Health Check + Basic Endpoints (6h)

**Total**: 50 hours (3-4 person weeks)

---

## Story 1.1: Express.js Setup

### What You're Building

A TypeScript-based Express server that:
- Listens on port 3001 (dev) or `PORT` env var (prod)
- Has CORS, JSON parsing, error handling middleware
- Returns `{ status: "ok" }` on GET /health
- Compiles with `npm run build`
- Starts with `npm start`

### Step-by-Step

**1. Install dependencies**:
```bash
npm install express cors compression dotenv zod winston
npm install --save-dev @types/express @types/node tsx ts-node-dev
```

**2. Create server file**:
```typescript
// server/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(compression());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes (stub for now)
app.get('/api/v1/articles', (req, res) => {
  res.json({ success: true, data: [] });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' }
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**3. Update `package.json` scripts**:
```json
{
  "scripts": {
    "dev": "vite --host",
    "server:dev": "tsx watch server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "node dist/index.js",
    "check": "tsc --noEmit",
    "lint": "eslint client/src --ext .ts,.tsx",
    "format": "prettier --write ."
  }
}
```

**4. Test locally**:
```bash
npm run server:dev
# In another terminal:
curl http://localhost:3001/health
# Should return: { "status": "ok" }
```

### Acceptance Criteria Check

- [ ] Server starts: `npm run server:dev`
- [ ] Health endpoint: GET /health → `{ status: "ok" }`
- [ ] CORS configured for localhost
- [ ] TypeScript compiles: `npm run check`
- [ ] Build works: `npm run build`
- [ ] Node can run dist: `npm start` (add dummy endpoint)

---

## Story 1.2: PostgreSQL + Prisma Schema

### What You're Building

- PostgreSQL database (local + Railway staging)
- Prisma schema with 10+ models
- First migration working
- Prisma Client generating types

### Step-by-Step

**1. Install Prisma**:
```bash
npm install @prisma/client prisma
npx prisma init
```

**2. Setup PostgreSQL**:

**Option A: Docker** (easier):
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ctrl_alt_news_dev \
  -p 5432:5432 \
  postgres:15-alpine

# Test connection
psql postgresql://postgres:postgres@localhost:5432/ctrl_alt_news_dev
```

**Option B: Local installation**:
```bash
createdb ctrl_alt_news_dev
psql ctrl_alt_news_dev
```

**3. Create `.env`**:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ctrl_alt_news_dev"
JWT_SECRET=dev-secret-key-at-least-32-bytes-long-here
JWT_REFRESH_SECRET=another-dev-secret-at-least-32-bytes
NODE_ENV=development
```

**4. Create `prisma/schema.prisma`**:

(Copy the full schema from DATABASE-SCHEMA.md — it's 300+ lines, ready to use)

**5. Run first migration**:
```bash
npx prisma migrate dev --name initial_schema

# This:
# - Creates database tables
# - Generates Prisma Client
# - Creates migration file
```

**6. Verify schema**:
```bash
npx prisma studio
# Opens GUI at http://localhost:5555 to browse database
```

### Acceptance Criteria Check

- [ ] PostgreSQL running and accessible
- [ ] `prisma/schema.prisma` created with all 10+ models
- [ ] `npx prisma migrate dev` succeeds
- [ ] Prisma Client generated (types in `node_modules/.prisma`)
- [ ] `npx prisma studio` shows all tables
- [ ] TypeScript recognizes Prisma types
- [ ] Can query database:
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const articles = await prisma.article.findMany();
```

---

## Story 1.3: Seed Data

### What You're Building

Populate database with sample data for testing:
- 1 admin user
- 4 categories (AI, Science, Robotics, Gadgets)
- 20 articles
- 40 comments

### Step-by-Step

**1. Create seed script**:
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        nameEn: 'Artificial Intelligence',
        namePt: 'Inteligência Artificial',
        slug: 'ai',
        colorHex: '#06B6D4',
        descriptionEn: 'Latest in AI and machine learning'
      }
    }),
    prisma.category.create({
      data: {
        nameEn: 'Science',
        namePt: 'Ciência',
        slug: 'science',
        colorHex: '#A855F7',
        descriptionEn: 'Scientific discoveries and research'
      }
    }),
    // ... more categories
  ]);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ctrlaltnews.io',
      passwordHash: await bcrypt.hash('AdminPassword123!', 12),
      fullName: 'Admin User',
      role: 'ADMIN',
      emailVerified: true
    }
  });

  // Create sample articles
  for (let i = 1; i <= 20; i++) {
    await prisma.article.create({
      data: {
        titleEn: `Article ${i}: Interesting Tech Topic`,
        titlePt: `Artigo ${i}: Tópico de Tecnologia Interessante`,
        slug: `article-${i}-interesting-tech-topic`,
        excerptEn: `This is a summary of article ${i}...`,
        excerptPt: `Este é um resumo do artigo ${i}...`,
        contentEn: `## Article ${i}\n\nFull content here...`,
        contentPt: `## Artigo ${i}\n\nConteúdo completo aqui...`,
        categoryId: categories[i % categories.length].id,
        authorId: admin.id,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        readingTimeMinutes: 5 + (i % 10)
      }
    });
  }

  console.log('Seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

**2. Update `package.json`**:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

**3. Install bcrypt**:
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**4. Run seed**:
```bash
npx prisma db seed
```

### Acceptance Criteria Check

- [ ] Seed script runs without errors
- [ ] Database has 1 admin user (email: admin@ctrlaltnews.io)
- [ ] Database has 4 categories
- [ ] Database has 20+ articles
- [ ] Can query articles:
```typescript
const articles = await prisma.article.findMany();
console.log(articles.length); // Should be 20
```

---

## Story 1.4: Health Check + Basic Endpoints

### What You're Building

Connect Express server to Prisma. Implement:
- Health check that verifies database
- GET /api/v1/articles (list articles)
- Error handling middleware

### Step-by-Step

**1. Create API routes structure**:
```
server/
├── index.ts
├── middleware/
│   └── errorHandler.ts
└── routes/
    ├── articles.ts
    └── health.ts
```

**2. Error handling middleware**:
```typescript
// server/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      },
      timestamp: new Date().toISOString()
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString()
  });
}
```

**3. Articles routes**:
```typescript
// server/routes/articles.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/v1/articles
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } }, category: true },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.article.count({
      where: { status: 'PUBLISHED', deletedAt: null }
    });

    res.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
```

**4. Health route**:
```typescript
// server/routes/health.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { database: 'ok' }
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    health.status = 'degraded';
    health.checks.database = 'error';
    return res.status(503).json(health);
  }

  res.json(health);
});

export default router;
```

**5. Update `server/index.ts`**:
```typescript
import healthRoutes from './routes/health';
import articlesRoutes from './routes/articles';
import { errorHandler } from './middleware/errorHandler';

app.get('/health', (req, res, next) => {
  const router = express.Router();
  return healthRoutes(req, res, next);
});

app.use('/api/v1/articles', articlesRoutes);

// Error handler LAST
app.use(errorHandler);
```

**6. Test**:
```bash
npm run server:dev

# Terminal 2:
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/articles
```

### Acceptance Criteria Check

- [ ] GET /health returns database status
- [ ] GET /api/v1/articles returns paginated articles
- [ ] Response format matches API spec
- [ ] Errors return standard error format
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors

---

## Running Tests

```bash
# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format

# Build
npm run build
```

All must pass before committing.

---

## Git Workflow

```bash
# Create feature branch (for each story)
git checkout -b story/1-1-express-setup

# Make commits as you work
git add .
git commit -m "feat: setup Express server with CORS [Story 1.1]"

# When done, push
git push origin story/1-1-express-setup

# Create PR on GitHub
# Request review from team lead
# Once approved, merge to main
```

---

## Debugging Tips

**TypeScript errors**:
```bash
npm run check
# Shows all type errors with file:line:col
```

**Database connection issues**:
```bash
# Test PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/ctrl_alt_news_dev
# If fails, check PostgreSQL is running: brew services list
```

**Prisma issues**:
```bash
# Reset database (WARNING: data loss!)
npx prisma migrate reset

# Open GUI
npx prisma studio
```

**API not responding**:
```bash
# Check server is running
lsof -i :3001
# If not there, start it: npm run server:dev
```

---

## Questions?

Ask in `#development` Slack channel. Reference the architecture docs:

1. **TECH-STACK-VALIDATION.md** — Why these choices
2. **DATABASE-SCHEMA.md** — Database design
3. **API-SPECIFICATION.md** — API endpoint specs
4. **INTEGRATION-POINTS.md** — Frontend-backend communication
5. **SECURITY-ARCHITECTURE.md** — Auth + security
6. **DEPLOYMENT-ARCHITECTURE.md** — How to deploy

---

## Next Steps (After Sprint 1)

- Sprint 2: Implement all 25+ API endpoints
- Sprint 3: User authentication (JWT + OAuth)
- Sprint 4: Performance optimization (Redis caching)

You've got this! 🚀

---

**Document Version**: 1.0  
**Ready for**: Day 1 Implementation  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
