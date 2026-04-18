# Development Setup Guide

Ctrl Alt News Portal — Complete Setup Instructions

## Prerequisites

- **Node.js** 18+ (https://nodejs.org)
- **pnpm** 10+ (included in package.json)
- **PostgreSQL** 14+ (local or Railway)
- **Git** (for version control)
- **VS Code** or preferred editor

## Step 1: Install Dependencies

```bash
pnpm install
```

This installs:
- React 19 + TypeScript
- Tailwind CSS v4
- Prisma 5
- Express.js
- All dev dependencies

## Step 2: Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/ctrl_alt_news_dev"

# Other services (optional for development)
NODE_ENV=development
AIOS_VERSION=2.2.0
```

### Database Options

#### Local PostgreSQL (macOS/Linux with Homebrew)
```bash
# Install
brew install postgresql@16

# Start service
brew services start postgresql@16

# Create database
createdb ctrl_alt_news_dev

# Create user (optional)
createuser postgres -s
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

#### Docker (Recommended)
```bash
docker run -d \
  --name postgres-ctrl-alt \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ctrl_alt_news_dev \
  -p 5432:5432 \
  postgres:16
```

#### Railway (Production)
1. Create project at https://railway.app
2. Add PostgreSQL service
3. Copy `DATABASE_URL` from Railway dashboard
4. Paste into `.env`

## Step 3: Generate Prisma Client

```bash
npx prisma generate
```

This generates TypeScript types from schema.

## Step 4: Apply Migrations

Once database is running:

```bash
pnpm prisma:deploy
```

This creates all tables, indexes, and triggers.

## Step 5: Seed Development Data

```bash
pnpm prisma:seed
```

Creates test data:
- 4 categories
- 3 users (admin, author, reader)
- 5 articles
- Comments, reactions, bookmarks, etc.

## Step 6: Start Development Server

```bash
pnpm dev
```

Opens http://localhost:5173 (Vite dev server)

### Other Development Commands

```bash
# Type checking
pnpm check

# Linting
pnpm lint
pnpm lint:fix

# Code formatting
pnpm format
pnpm format:check

# Tests
pnpm test

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Step 7: Database Management

### View data in database

```bash
# Interactive Prisma Studio
npx prisma studio
```

Opens UI at http://localhost:5555

### Reset database (caution!)

```bash
# Deletes all data and re-applies migrations
pnpm prisma:reset

# Then re-seed
pnpm prisma:seed
```

### Create new migration

After editing `prisma/schema.prisma`:

```bash
pnpm prisma:migrate "your_migration_name"
```

Example:
```bash
pnpm prisma:migrate "add_article_featured_flag"
```

## Project Structure

```
├── client/src/
│   ├── pages/           # Route components
│   ├── components/      # Reusable UI
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   └── App.tsx          # Router
├── server/
│   ├── index.ts         # Express server
│   └── src/
│       └── prisma.ts    # DB client
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── seed.ts          # Seed script
│   └── migrations/      # Migration history
├── docs/
│   ├── DATABASE.md      # Schema docs
│   ├── SETUP.md         # This file
│   └── architecture/    # Design docs
├── .env.example         # Example env vars
├── package.json         # Dependencies
├── vite.config.ts       # Frontend bundler
└── tsconfig.json        # TypeScript config
```

## Useful Tips

### Enable Query Logging

Add to `.env`:
```env
DATABASE_LOG=query
```

Then in `server/src/prisma.ts`:
```typescript
new PrismaClient({
  log: ['query', 'error', 'warn'],
})
```

### Browser DevTools

Development mode includes:
- React DevTools (browser extension)
- Vite HMR (hot module reload)
- TypeScript error overlay

### Git Workflow

1. Create branch: `git checkout -b feature/my-feature`
2. Make changes
3. Check types: `pnpm check`
4. Format: `pnpm format`
5. Lint: `pnpm lint:fix`
6. Commit: `git commit -m "feat: description"`
7. Push: `git push origin feature/my-feature`

## Troubleshooting

### Port 5173 already in use
Vite will automatically find next available port. Or kill existing process:
```bash
kill -9 $(lsof -t -i :5173)
```

### Database connection refused
```
Error: P1001 Can't reach database server at localhost:5432
```

Check PostgreSQL is running:
```bash
# macOS
brew services list | grep postgres

# Docker
docker ps | grep postgres

# Linux
systemctl status postgresql
```

### Prisma type generation fails
```bash
# Clear node_modules
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install

# Regenerate
npx prisma generate
```

### Migration conflicts
```bash
# View migration status
npx prisma migrate status

# Resolve conflicts
npx prisma migrate resolve --rolled-back 0_init
```

### Can't import from @server or @shared
Check `tsconfig.json` path aliases:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["client/src/*"],
      "@server/*": ["server/*"],
      "@shared/*": ["shared/*"]
    }
  }
}
```

## Next Steps

After setup:

1. **Run dev server**: `pnpm dev`
2. **View database**: `npx prisma studio`
3. **Check routes**: Visit http://localhost:5173
4. **Read docs**: See `docs/DATABASE.md` for schema details
5. **Start coding**: Edit files in `client/src/` (auto-reload)

## Environment Comparison

| Variable | Development | Production |
|----------|-------------|-----------|
| NODE_ENV | development | production |
| DATABASE_URL | local postgres | Railway postgres |
| VITE_APP_ENV | dev | prod |
| Prisma logging | query, error, warn | error only |
| Source maps | enabled | disabled |

## Common Issues & Solutions

### TypeScript strict mode errors
Ensure all types are properly imported:
```typescript
import { User, Article } from '@prisma/client';
import type { GetServerSideProps } from 'express';
```

### Tailwind CSS not applying
Clear Tailwind cache:
```bash
rm -rf node_modules/.vite
pnpm dev
```

### Stale Prisma types
Regenerate types:
```bash
npx prisma generate --skip-engine
```

## Support

- **Database Questions**: See `docs/DATABASE.md`
- **Architecture**: See `docs/architecture/`
- **Prisma Docs**: https://prisma.io/docs
- **PostgreSQL Docs**: https://postgresql.org/docs

---

**Setup Guide Version**: 1.0  
**Last Updated**: 2026-04-18  
**Maintainer**: Dex (Development Agent)
