# Ctrl Alt News Portal

Technology news and insights platform built with React 19 and Express.js.

## Project Structure

```
client/          # React frontend (TypeScript)
server/          # Express.js backend (TypeScript)
shared/          # Shared types
docs/            # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for Redis and PostgreSQL)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install --legacy-peer-deps --ignore-scripts

# Start Docker services (Redis + PostgreSQL)
docker-compose up -d

# Run development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Build & Deploy

```bash
# Build production bundle
npm run build

# Start production server
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run lint` - Check code style (ESLint)
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier
- `npm test` - Run test suite

## Caching Layer (Redis)

This project implements a Redis caching layer to improve API response times and reduce database load.

### Configuration

Redis is configured via environment variables:

```env
# .env or .env.local
REDIS_URL=redis://localhost:6379
```

Default: `redis://localhost:6379`

### Cached Endpoints

| Endpoint | TTL | Purpose |
|----------|-----|---------|
| `GET /api/articles` | 5 min | List of published articles |
| `GET /api/articles/:id` | 1 min | Single article detail |
| `GET /api/categories` | 1 hour | All categories |
| `GET /api/users/:id` | 10 min | User public profile |
| `GET /api/articles/:id/comments` | 2 min | Article comments |
| `GET /api/search?q=...` | 5 min | Search results |

### Cache Invalidation

Cache is automatically invalidated when:

- Articles are created, updated, or deleted
- Comments are posted
- User profiles are updated
- Categories change

### Cache Health Check

Monitor cache status via health endpoint:

```bash
curl http://localhost:3000/api/cache/health
```

Response includes connection status and hit/miss metrics:

```json
{
  "success": true,
  "health": {
    "status": "ok",
    "message": "Redis is connected"
  },
  "metrics": {
    "hits": 1234,
    "misses": 567,
    "hitRate": 68.5
  }
}
```

### Performance Targets

Cached endpoints achieve <100ms response time:

- Articles list: ~50ms (80% reduction)
- Categories: ~20ms (90% reduction)
- User profiles: ~40ms (80% reduction)
- Search: ~100ms (80% reduction)

### Graceful Fallback

If Redis is unavailable, the application gracefully falls back to direct database queries. No requests will fail due to cache unavailability.

### Implementation Details

**Cache Service** (`server/src/services/cache.ts`):
- Uses ioredis client with connection pooling
- Automatic reconnection with exponential backoff
- JSON serialization for complex data types
- Metrics tracking (hits, misses, hit rate calculation)
- Health check endpoint

**Cache Invalidation Manager** (`server/src/services/cache-invalidation.ts`):
- Pattern-based invalidation using wildcards
- Coordinated cache busting across related caches
- Ensures consistency after mutations

### Development

Enable debug logging:

```bash
export DEBUG=cache:*
npm run dev
```

Run cache tests:

```bash
npm test -- cache.test.ts
npm test -- cache-integration.test.ts
```

Run performance benchmark:

```bash
npm run benchmark
```

## Architecture

- **Frontend**: React 19 with TypeScript, Tailwind CSS, Wouter routing
- **Backend**: Express.js server serving SPA with client-side routing
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis with ioredis client
- **Build**: Vite (frontend) + esbuild (backend)

## Contributing

1. Create a feature branch
2. Make changes and test locally
3. Run linting and type checking: `npm run lint && npm run check`
4. Commit with conventional commit messages
5. Push and create a pull request

## License

MIT
