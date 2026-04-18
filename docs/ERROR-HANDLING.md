# Error Handling & Logging Guide

**Document**: `docs/ERROR-HANDLING.md`  
**Status**: Complete  
**Last Updated**: 2026-04-18  
**Owner**: Dex (@dev)

---

## Overview

The error handling system provides:
- **Structured error responses** with consistent JSON format
- **Comprehensive logging** with file rotation and request tracking
- **Request tracing** via UUID for debugging
- **Graceful shutdown** to prevent data loss
- **Production-ready** error recovery

---

## AppError Class

### Factory Methods

Use factory methods to create typed errors:

```typescript
import { AppError } from './src/middleware/errorHandler';

// 400 Bad Request
throw AppError.badRequest('Invalid email format', { field: 'email' });

// 401 Unauthorized
throw AppError.unauthorized('Missing authentication token');

// 403 Forbidden
throw AppError.forbidden('You cannot access this resource');

// 404 Not Found
throw AppError.notFound('User'); // Results in "User not found"

// 409 Conflict
throw AppError.conflict('Email already registered');

// 500 Internal Error
throw AppError.internal('Database connection failed');
```

### Direct Constructor

For custom status codes:

```typescript
throw new AppError(
  400,
  'CUSTOM_ERROR',
  'Custom error message',
  { additionalInfo: 'value' }
);
```

### Response Format

All AppError responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Email already exists",
    "code": "CONFLICT",
    "status": 409,
    "details": {
      "email": "john@example.com"
    }
  }
}
```

---

## Middleware Stack

### Request Logger (First)

Every request gets a UUID for tracking across logs:

```
Incoming Request
├─ requestId: "550e8400-e29b-41d4-a716-446655440000"
├─ method: "POST"
├─ path: "/api/articles"
├─ query: { limit: "10" }
└─ ip: "192.168.1.1"

... request processing ...

Outgoing Response
├─ requestId: "550e8400-e29b-41d4-a716-446655440000"
├─ statusCode: 201
├─ duration: "45ms"
└─ ip: "192.168.1.1"
```

### Error Handler (Last)

Catches all errors (sync and async) and returns structured responses:

```typescript
// AppError → Formatted JSON response
if (err instanceof AppError) {
  logger.warn('AppError', { code, statusCode, requestId });
  res.status(err.statusCode).json(err.toJSON());
}

// Unexpected error → 500 with requestId for tracing
else {
  logger.error('Unexpected error', { message, stack, requestId });
  res.status(500).json({ error, requestId });
}
```

### 404 Handler

Unknown routes return proper 404 response:

```json
{
  "success": false,
  "error": {
    "message": "Route not found",
    "code": "NOT_FOUND",
    "status": 404
  }
}
```

---

## Logging System

### Winston Configuration

**Console Output** (always):
```
2026-04-18 19:45:30 [info] Incoming Request { requestId: '550e8400...', method: 'GET', ... }
2026-04-18 19:45:31 [warn] AppError { code: 'NOT_FOUND', statusCode: 404, ... }
2026-04-18 19:45:32 [error] Unexpected error { message: 'ECONNREFUSED', stack: '...' }
```

**File Logging** (to `logs/` directory):

#### logs/combined.log
All logs (info, warn, error, debug):
```json
{"timestamp":"2026-04-18 19:45:30","level":"info","message":"Incoming Request","requestId":"550e8400..."}
{"timestamp":"2026-04-18 19:45:31","level":"warn","message":"AppError","code":"NOT_FOUND"}
{"timestamp":"2026-04-18 19:45:32","level":"error","message":"Unexpected error","stack":"..."}
```

#### logs/error.log
Errors only (faster scanning for issues):
```json
{"timestamp":"2026-04-18 19:45:32","level":"error","message":"Unexpected error"}
```

### Log Rotation

Files automatically rotate when they exceed 10MB:
- **Max file size**: 10MB
- **Max files**: 5
- **Naming**: `error.log.1`, `error.log.2`, etc.

Older files are automatically deleted.

### Logging Best Practices

Log at the right level:

```typescript
// INFO: Important application events
logger.info('User login successful', { userId: '123' });

// WARN: Recoverable errors, validation failures
logger.warn('AppError', { code: 'UNAUTHORIZED', statusCode: 401 });

// ERROR: Unexpected failures requiring attention
logger.error('Database connection failed', { error: err.message, stack: err.stack });
```

---

## Request Tracing

Every request gets a UUID (`requestId`) that flows through the entire request lifecycle:

```typescript
// In middleware
req.id = uuidv4(); // "550e8400-e29b-41d4-a716-446655440000"

// Available in route handlers
app.get('/api/articles', (req: any, res) => {
  console.log(req.id); // "550e8400-e29b-41d4-a716-446655440000"
});

// Available in error handlers
if (err instanceof AppError) {
  logger.warn('AppError', { requestId: req.id, code: err.code });
  res.json({ error: { requestId: req.id, ... } });
}
```

### Using requestId for Debugging

Match logs across multiple services:

```bash
# Find all logs for a specific request
grep "550e8400-e29b-41d4-a716-446655440000" logs/combined.log

# Output:
# Incoming Request
# Database query executed
# Outgoing Response
```

---

## Async Error Handling

Use `asyncHandler` wrapper to catch promise rejections in async route handlers:

```typescript
import { asyncHandler } from './src/middleware/errorHandler';

// Without asyncHandler - errors won't be caught
app.get('/api/articles/:id', async (req, res) => {
  const article = await db.article.findUnique(...); // Throws but not caught!
  res.json(article);
});

// With asyncHandler - errors properly caught by error middleware
app.get('/api/articles/:id', asyncHandler(async (req, res) => {
  const article = await db.article.findUnique(...); // Caught and handled
  res.json(article);
}));
```

---

## Graceful Shutdown

The server handles shutdown signals properly:

```bash
# Sends SIGTERM to Node process
kill <PID>

# Server logs:
# 2026-04-18 19:45:45 [info] SIGTERM received, shutting down gracefully
# 2026-04-18 19:45:45 [info] Server closed
```

Graceful shutdown:
1. Stops accepting new requests
2. Waits for active requests to complete
3. Closes database connections
4. Exits cleanly after 10 seconds (or sooner)

---

## Common Patterns

### Validation Error

```typescript
app.post('/api/articles', asyncHandler(async (req, res) => {
  if (!req.body.title) {
    throw AppError.badRequest('Title is required', { field: 'title' });
  }
  const article = await db.article.create({ data: req.body });
  res.status(201).json(article);
}));
```

### Not Found Error

```typescript
app.get('/api/articles/:id', asyncHandler(async (req, res) => {
  const article = await db.article.findUnique({
    where: { id: req.params.id },
  });
  if (!article) {
    throw AppError.notFound('Article');
  }
  res.json(article);
}));
```

### Authentication Error

```typescript
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const user = await findUserByEmail(req.body.email);
  if (!user) {
    throw AppError.unauthorized('Invalid credentials');
  }
  res.json({ token: generateToken(user) });
}));
```

### Conflict Error

```typescript
app.post('/api/users', asyncHandler(async (req, res) => {
  const existing = await db.user.findUnique({
    where: { email: req.body.email },
  });
  if (existing) {
    throw AppError.conflict('Email already registered');
  }
  const user = await db.user.create({ data: req.body });
  res.status(201).json(user);
}));
```

---

## Testing Error Handling

### Unit Tests

```typescript
import { AppError } from './src/middleware/errorHandler';

describe('AppError Factory Methods', () => {
  it('should create 404 error', () => {
    const error = AppError.notFound('Article');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Article not found');
  });

  it('should convert to JSON', () => {
    const error = AppError.badRequest('Invalid', { field: 'email' });
    const json = error.toJSON();
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.details).toEqual({ field: 'email' });
  });
});
```

### Integration Tests

```typescript
// Simulate error and verify response
app.get('/test-error', () => {
  throw AppError.badRequest('Test error');
});

const res = await request(app).get('/test-error');
expect(res.status).toBe(400);
expect(res.body.error.code).toBe('BAD_REQUEST');
```

---

## Troubleshooting

### Logs Not Being Created

**Problem**: `logs/` directory missing  
**Solution**: Logger automatically creates the directory. If still missing:
```bash
mkdir -p logs
# Ensure write permissions
chmod 755 logs
```

### No requestId in Error Response

**Problem**: Errors missing `requestId` field  
**Solution**: Ensure `requestLogger` middleware is loaded before routes:
```typescript
app.use(requestLogger); // Must be early
app.use('/api', apiRouter);
```

### Logs Not Being Rotated

**Problem**: Log files exceed 10MB  
**Solution**: Winston rotation is automatic. If not working:
1. Check disk space: `df -h`
2. Check file permissions: `ls -la logs/`
3. Verify Winston config in `server/src/logger.ts`

### Console Output Flooding

**Problem**: Too many logs in console  
**Solution**: Adjust LOG_LEVEL environment variable:
```bash
export LOG_LEVEL=warn  # Only show warnings and errors
export LOG_LEVEL=info  # (default) Show info, warn, error
```

---

## Environment Variables

Configure logging behavior:

```bash
# Set log level (debug, info, warn, error)
export LOG_LEVEL=info

# Set Node environment (production vs development)
export NODE_ENV=production

# Port configuration
export PORT=3000
```

---

## Production Recommendations

1. **Monitor logs regularly**: Set up log aggregation (ELK, Datadog, CloudWatch)
2. **Alert on errors**: Create alerts for ERROR level logs
3. **Archive old logs**: Move logs older than 30 days to cold storage
4. **Encrypt sensitive data**: Don't log passwords, tokens, or PII
5. **Use correlation IDs**: Trace requests through multiple services via requestId
6. **Set appropriate log levels**: Use WARN in production, DEBUG in development

---

## Related Files

- **Logger config**: `server/src/logger.ts`
- **Error middleware**: `server/src/middleware/errorHandler.ts`
- **Request logger**: `server/src/middleware/requestLogger.ts`
- **Server entry**: `server/index.ts`

---

**Last Updated**: 2026-04-18 19:40 UTC  
**Status**: Complete and Production Ready
