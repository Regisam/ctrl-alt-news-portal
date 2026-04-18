# Security Architecture — Authentication, Authorization & Data Protection
**Author**: Aria (System Architect)  
**Date**: 2026-04-16  
**Status**: Ready for Implementation  
**Standards**: OWASP Top 10, GDPR

---

## 1. Authentication Layer

### JWT Token Strategy

**Access Token**:
- **TTL**: 15 minutes (900 seconds)
- **Storage**: Memory (not localStorage, prevents XSS)
- **Claims**: `userId`, `role`, `iat`, `exp`
- **Secret**: `process.env.JWT_SECRET` (32+ bytes, random)

**Refresh Token**:
- **TTL**: 7 days (604800 seconds)
- **Storage**: httpOnly cookie (secure, not accessible to JavaScript)
- **Cookie flags**: `HttpOnly`, `Secure` (HTTPS only), `SameSite=Strict`
- **Secret**: `process.env.JWT_REFRESH_SECRET` (separate key)

### Token Generation

```typescript
// server/auth/jwt.ts
import jwt from 'jsonwebtoken';

export function generateTokens(userId: string, role: 'USER' | 'AUTHOR' | 'ADMIN') {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m', algorithm: 'HS256' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d', algorithm: 'HS256' }
  );

  return { accessToken, refreshToken };
}

// Set refresh token as httpOnly cookie
export function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  });
}
```

### Token Verification Middleware

```typescript
// server/middleware/auth.ts
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' }
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Attach to request
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
      });
    }
    
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
    });
  }
}
```

---

## 2. Authorization Layer

### Role-Based Access Control (RBAC)

**Roles**:
- **USER**: Read articles, comment, bookmark (default)
- **AUTHOR**: Can create articles (elevate to AUTHOR role)
- **ADMIN**: Full access (article management, user management, analytics)

### Role Check Middleware

```typescript
// server/middleware/authorize.ts
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Requires ${roles.join(' or ')} role`
        }
      });
    }
    next();
  };
}

// Usage
app.post('/articles', authMiddleware, requireRole('ADMIN', 'AUTHOR'), createArticle);
app.get('/admin/users', authMiddleware, requireRole('ADMIN'), listAdminUsers);
```

### Resource Ownership Check

```typescript
// server/middleware/ownership.ts
export async function requireOwnership(resourceType: 'article' | 'comment') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params.id;
    const userId = req.userId;
    
    let owner;
    if (resourceType === 'article') {
      const article = await prisma.article.findUnique({
        where: { id: resourceId },
        select: { authorId: true }
      });
      owner = article?.authorId;
    } else if (resourceType === 'comment') {
      const comment = await prisma.comment.findUnique({
        where: { id: resourceId },
        select: { authorId: true }
      });
      owner = comment?.authorId;
    }
    
    if (owner !== userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot modify other users\' resources' }
      });
    }
    
    next();
  };
}

// Usage
app.put('/comments/:id', authMiddleware, requireOwnership('comment'), updateComment);
```

---

## 3. Password Security

### Bcrypt Configuration

**Cost Factor**: 12 (standard, ~100ms per hash)

```typescript
// server/auth/password.ts
import bcrypt from 'bcrypt';

const BCRYPT_COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Password Validation

```typescript
// server/validation/password.ts
import { z } from 'zod';

// Zod schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[!@#$%^&*]/, 'Password must contain special character');

// Example valid passwords:
// - "MySecurePass123!"
// - "Ctrl@ltNews2026"

// Example invalid passwords:
// - "password123" (no uppercase, no special char)
// - "PASSWORD!" (no number)
// - "Pass1" (too short)
```

### Password Reset Flow (Future)

```typescript
// Phase 2 implementation
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal if email exists (security best practice)
    return res.json({ success: true, message: 'If email exists, reset link sent' });
  }
  
  // Generate reset token (1 hour TTL)
  const resetToken = jwt.sign(
    { userId: user.id, type: 'reset' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
  
  // Send email with reset link
  await sendEmail({
    to: email,
    subject: 'Password Reset',
    html: `Click here: https://ctrlaltnews.io/reset?token=${resetToken}`
  });
  
  res.json({ success: true, message: 'If email exists, reset link sent' });
});
```

---

## 4. Input Validation & Sanitization

### Zod Schemas (All Endpoints)

```typescript
// server/validation/schemas.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).regex(/[!@#$%^&*]/),
  fullName: z.string().min(2).max(100)
});

export const createArticleSchema = z.object({
  titleEn: z.string().min(5).max(200),
  titlePt: z.string().min(5).max(200),
  excerptEn: z.string().min(10).max(500),
  excerptPt: z.string().min(10).max(500),
  contentEn: z.string().min(50),
  contentPt: z.string().min(50),
  categoryId: z.string().cuid(),
  featuredImageUrl: z.string().url().optional()
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().cuid().optional()
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  topic: z.enum(['Editorial', 'Press', 'Advertising', 'Other']),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000)
});
```

### Validation Middleware

```typescript
// server/middleware/validate.ts
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message
            }))
          }
        });
      }
      next(error);
    }
  };
}

// Usage
app.post('/auth/register', validate(registerSchema), registerHandler);
app.post('/articles', authMiddleware, validate(createArticleSchema), createArticleHandler);
```

### SQL Injection Prevention

Use Prisma exclusively (never concatenate SQL):

```typescript
// GOOD: Parameterized with Prisma
const articles = await prisma.article.findMany({
  where: { categoryId: categoryId }
});

// BAD: Raw SQL concatenation (never do this!)
const articles = await prisma.$queryRaw`
  SELECT * FROM articles WHERE categoryId = '${categoryId}' -- VULNERABLE!
`;

// GOOD: Raw SQL with parameters
const articles = await prisma.$queryRaw`
  SELECT * FROM articles WHERE categoryId = ${categoryId}
`;
```

---

## 5. CORS & CSRF Protection

### CORS Configuration

```typescript
// server/index.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',      // Local dev
  'http://localhost:5173',      // Vite dev
  process.env.FRONTEND_URL      // Production
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### CSRF Token (for forms, if needed)

httpOnly cookies + SameSite=Strict = automatic CSRF protection for same-site requests.

**Optional**: For SPA with independent domain, CSRF tokens are redundant (cookies handle it).

---

## 6. Rate Limiting

### Global Rate Limiter

```typescript
// server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per window
  message: 'Too many requests, please try again later'
});

// Usage
app.use(globalLimiter);
```

### Per-Endpoint Rate Limits

```typescript
// Strict limits for sensitive endpoints
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,    // 5 minutes
  max: 5,                     // 5 login attempts
  skipSuccessfulRequests: true // Don't count successful logins
});

export const contactFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 5,                     // 5 contact forms
  keyGenerator: (req) => req.ip // Rate limit by IP
});

// Usage
app.post('/auth/login', authLimiter, loginHandler);
app.post('/contact', contactFormLimiter, contactHandler);
```

---

## 7. HTTPS & Security Headers

### Helmet.js Middleware

```typescript
// server/index.ts
import helmet from 'helmet';

app.use(helmet());  // Enables:
  // - X-Content-Type-Options: nosniff (prevent MIME sniffing)
  // - X-Frame-Options: DENY (prevent clickjacking)
  // - X-XSS-Protection: 1; mode=block
  // - Strict-Transport-Security (HSTS) for HTTPS
  // - Content-Security-Policy
```

### Environment-Specific HTTPS

```typescript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
```

---

## 8. Secrets Management

### Environment Variables

**`.env.example`** (commit to repo, no secrets):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/ctrl_alt_news
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NODE_ENV=development
```

**`.env`** (DO NOT COMMIT):
```
DATABASE_URL=postgresql://user:password@localhost:5432/ctrl_alt_news
JWT_SECRET=random-32-byte-secret-key-here-abc123xyz789...
JWT_REFRESH_SECRET=another-random-secret-key...
GOOGLE_CLIENT_ID=actual-client-id-from-google
GOOGLE_CLIENT_SECRET=actual-client-secret
NODE_ENV=development
```

### Production (Railway)

Add secrets via Railway dashboard:
1. Go to Railway project → Variables
2. Add `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GOOGLE_CLIENT_SECRET`
3. Railway encrypts and injects at runtime

---

## 9. Data Protection & Privacy

### GDPR Compliance

**User Rights**:
1. **Access**: `GET /users/me` returns all user data
2. **Export**: `GET /users/me/export` returns JSON dump
3. **Delete**: `DELETE /users/me` soft-deletes user

**Right to be Forgotten Implementation**:
```typescript
app.delete('/users/me', authMiddleware, async (req, res) => {
  const userId = req.userId;
  
  // Soft delete user
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@example.com`, // Anonymize
      passwordHash: null,
      bio: '[Deleted]',
      avatarUrl: null
    }
  });
  
  // Anonymize comments
  await prisma.comment.updateMany({
    where: { authorId: userId },
    data: {
      content: '[Deleted comment]',
      authorId: null
    }
  });
  
  res.json({ success: true, message: 'Account deleted' });
});
```

### Data Retention

- **Articles**: Keep indefinitely (business value)
- **Comments**: Keep 1 year (archive after)
- **Page views**: Keep 90 days (analytics decay)
- **Deleted user data**: Soft-delete, keep for 6 months (GDPR), then hard-delete

---

## 10. Error Handling & Logging

### Secure Error Messages

**DON'T reveal internals**:
```typescript
// BAD
res.status(500).json({
  error: 'Database connection failed: ECONNREFUSED at postgres://...'
});

// GOOD
res.status(500).json({
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An error occurred. Please try again later.'
  }
});
```

### Structured Logging

```typescript
// server/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ]
});

// Log suspicious activity
logger.warn('Failed login attempt', {
  email: user.email,
  ip: req.ip,
  timestamp: new Date()
});

// Log successful sensitive operations
logger.info('Admin created article', {
  adminId: req.userId,
  articleId: article.id,
  timestamp: new Date()
});
```

---

## Security Checklist

### Before MVP Release

- [ ] All passwords hashed with bcrypt (cost 12)
- [ ] JWT tokens with 15m/7d TTL split
- [ ] httpOnly cookies for refresh tokens
- [ ] CORS configured (whitelist origins)
- [ ] Rate limiting on auth endpoints
- [ ] Helmet.js security headers enabled
- [ ] All inputs validated with Zod
- [ ] No SQL injection vectors (Prisma enforced)
- [ ] HTTPS enforced in production
- [ ] Secrets in `.env` (not committed)
- [ ] Error messages sanitized (no internals)
- [ ] Logging implemented (sensitive operations)
- [ ] GDPR right-to-delete implemented
- [ ] Admin endpoints require ADMIN role
- [ ] Resource ownership verified (can't edit others' comments)

### After MVP (Q3 2026)

- [ ] Audit logging for all admin actions
- [ ] Two-factor authentication (2FA)
- [ ] IP whitelisting for admin dashboard
- [ ] Database encryption at rest
- [ ] HTTPS certificate pinning (mobile app)
- [ ] Security.txt configuration
- [ ] Third-party penetration test
- [ ] OWASP Zap automated scanning

---

**Document Version**: 1.0  
**Ready for**: Sprint 1-2 (Implementation)  
**Author**: Aria (System Architect)  
**Date**: 2026-04-16
