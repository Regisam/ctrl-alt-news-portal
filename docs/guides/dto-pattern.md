# DTO Pattern Guide

## Overview

The DTO (Data Transfer Object) layer standardizes API responses and error handling across the entire application.

## ApiResponse<T>

All API endpoints return a consistent response format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  statusCode: number;
}
```

## Usage in Routers

### Success Response

```typescript
import { UserDTO } from '../types/api.js';

router.get('/:userId', (req, res) => {
  try {
    const user: UserDTO = { id: '1', email: 'test@example.com', ... };
    res.success(user, 'User retrieved');
  } catch (error) {
    res.error(500, 'Failed to get user');
  }
});
```

### Created Response (201)

```typescript
router.post('/', (req, res) => {
  try {
    const user = await createUser(req.body);
    res.created(user, 'User created');
  } catch (error) {
    res.conflict('Email already exists');
  }
});
```

### Error Responses

```typescript
// Bad Request (400)
res.badRequest('Missing required field', { field: 'email' });

// Not Found (404)
res.notFound('User not found');

// Conflict (409)
res.conflict('Email already in use');

// Generic Error
res.error(500, 'Internal server error', { details: '...' });
```

## Validation with Zod

Use validation middleware before route handlers:

```typescript
import { validateRequest, createUserSchema } from '../middleware/validation.js';

router.post('/', validateRequest(createUserSchema), (req, res) => {
  // req.body is already validated
  const user = req.body; // Typed!
  res.created(user);
});
```

### Custom Schema

```typescript
import { z } from 'zod';

const customSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(0).max(150),
  email: z.string().email(),
});

router.post('/', validateRequest(customSchema), (req, res) => {
  // ...
});
```

## HTTP Status Codes

Consistent status code usage:

| Status | Usage |
|--------|-------|
| 200 | Success response |
| 201 | Resource created |
| 400 | Bad request / validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |

## DTO Types

Pre-defined DTOs for common entities:

```typescript
import {
  UserDTO,
  ArticleDTO,
  CommentDTO,
  NotificationDTO,
  ProfileDTO,
} from '../types/api.js';
```

## Response Examples

### Success

```json
{
  "success": true,
  "data": {
    "id": "123",
    "email": "test@example.com",
    "name": "John Doe",
    "createdAt": "2026-06-25T10:30:00Z"
  },
  "message": "User retrieved",
  "timestamp": "2026-06-25T10:30:05Z",
  "statusCode": 200
}
```

### Error

```json
{
  "success": false,
  "error": "Email already in use",
  "timestamp": "2026-06-25T10:30:05Z",
  "statusCode": 409
}
```

### Validation Error

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "errors": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Must be at least 8 characters" }
    ]
  },
  "timestamp": "2026-06-25T10:30:05Z",
  "statusCode": 400
}
```

## Benefits

1. **Consistency**: All responses follow same format
2. **Type Safety**: Full TypeScript support
3. **Error Handling**: Centralized, no duplicates
4. **Validation**: Built-in request validation
5. **Documentation**: Clear, self-documenting APIs

## Migration Path

Old pattern (deprecated):

```typescript
res.status(400).json({ error: 'Bad request' });
```

New pattern:

```typescript
res.badRequest('Bad request');
```

Both work (backward compatible), but use new pattern in new code.
