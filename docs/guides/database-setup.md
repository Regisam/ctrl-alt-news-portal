# Database Setup Guide

## Local Development

### Prerequisites
- PostgreSQL 14+ installed
- Node.js 18+

### 1. Install PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
createdb ctrl_alt_news
```

Or using psql:
```bash
psql postgres -c "CREATE DATABASE ctrl_alt_news;"
```

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ctrl_alt_news"
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables from schema.prisma
- Generate Prisma Client
- Run migrations

### 5. Seed Data (Optional)

```bash
npx prisma db seed
```

### 6. Verify Connection

```bash
npx prisma studio  # Opens Prisma Studio at http://localhost:5555
```

## Production

### 1. Database Service

Use managed PostgreSQL:
- Railway: `DATABASE_URL` auto-configured
- AWS RDS: Create instance, update `DATABASE_URL`
- Heroku: `DATABASE_URL` auto-provisioned
- DigitalOcean: Create managed database

### 2. Environment Variables

Set in deployment platform:
```
DATABASE_URL=postgresql://user:password@host:5432/db
```

### 3. Run Migrations

During deployment (CI/CD):
```bash
npx prisma migrate deploy
```

This only runs unapplied migrations (safe for production).

## Common Commands

```bash
# Show database status
npx prisma db push

# Create new migration
npx prisma migrate dev --name add_field

# Reset database (DEV ONLY)
npx prisma migrate reset

# View migrations
ls prisma/migrations/

# Open Studio UI
npx prisma studio

# Validate schema
npx prisma validate
```

## Troubleshooting

### Connection Error
```
error: getaddrinfo ENOTFOUND localhost
```
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure credentials are correct

### Migration Failed
```
npx prisma migrate resolve --rolled-back migration_name
```

### Tables Not Showing
```bash
npx prisma db push --force-reset  # DEV ONLY
```

## Backup & Restore

### Backup
```bash
pg_dump ctrl_alt_news > backup.sql
```

### Restore
```bash
psql ctrl_alt_news < backup.sql
```

## Performance

### Connection Pooling

For production, add to `DATABASE_URL`:
```
postgresql://user:password@host:5432/db?sslmode=require
```

Prisma Client automatically manages a connection pool.

### Indexes

Prisma schema defines indexes:
- `User.email` (unique)
- `Article.authorId`, `category`, `publishedAt`
- `Comment.articleId`, `userId`
- `Notification.userId`, `read`

Add custom indexes if needed:
```prisma
@@index([fieldName])
```

Then migrate:
```bash
npx prisma migrate dev --name add_index
```
