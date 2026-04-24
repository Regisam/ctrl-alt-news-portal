# Integration Testing Guide — API & Service Patterns

## Overview

Integration tests verify that multiple components work together correctly. This guide covers testing Express.js API endpoints, database operations, authentication flows, and service interactions.

**Quick Reference**:
- **Framework**: Vitest + Supertest for HTTP endpoints
- **Execution**: `npm run test` (includes integration tests)
- **Environment**: Isolated test database or in-memory fixtures
- **Setup/Teardown**: Database reset between tests

---

## Testing Express API Endpoints

### Basic Setup with Supertest

```typescript
import request from 'supertest';
import express, { Express } from 'express';
import { articleRouter } from '../../server/routes/articles';

describe('GET /api/articles', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', articleRouter);
  });

  it('should return list of articles', async () => {
    const response = await request(app)
      .get('/api/articles')
      .expect(200);

    expect(response.body).toHaveProperty('articles');
    expect(Array.isArray(response.body.articles)).toBe(true);
  });

  it('should return 404 for non-existent article', async () => {
    await request(app)
      .get('/api/articles/999')
      .expect(404);
  });
});
```

### Testing Request/Response Cycles

```typescript
describe('POST /api/articles', () => {
  it('should create new article with valid payload', async () => {
    const articleData = {
      title: 'Test Article',
      category: 'technology',
      excerpt: 'Test excerpt',
      body: 'Test body content',
    };

    const response = await request(app)
      .post('/api/articles')
      .send(articleData)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.title).toBe('Test Article');
  });

  it('should return 400 for missing required fields', async () => {
    const invalidData = {
      title: 'Missing category',
    };

    const response = await request(app)
      .post('/api/articles')
      .send(invalidData)
      .expect(400);

    expect(response.body.error).toContain('category');
  });
});
```

---

## Best Practices

- Isolate tests — Reset database between tests
- Use realistic data — Test with actual schema/types
- Test error paths — Verify error handling works
- Mock external services — Don't call real APIs
- Clean up after tests — Remove test data

---

*Last Updated: 2026-04-24*
