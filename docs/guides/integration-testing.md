# Integration Testing Guide — Supertest Patterns

Comprehensive guide to testing Express.js API endpoints with Supertest and Vitest.

## Quick Start

```bash
npm run test:integration          # Run all integration tests
npm run test:integration:watch   # Watch mode for development
```

## Setup & Fixtures

### Database Fixtures

Create reusable test data setup/teardown:

```typescript
// server/__tests__/fixtures/database.ts
import { setupTestDatabase, teardownTestDatabase, getTestDatabase } from './database.js';

describe('API Tests', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });
});
```

### Test Data Builders

Use factories to create consistent test objects:

```typescript
import { createTestArticle, createTestUser, seedArticles } from './fixtures/test-data.js';

// Create single article with overrides
const article = createTestArticle({ 
  title: 'Custom Title',
  category: 'AI'
});

// Seed articles into test database
seedArticles([article]);
```

## Common Test Patterns

### Testing GET Endpoints

```typescript
describe('GET /api/articles', () => {
  it('should return list of articles', async () => {
    const response = await request(app)
      .get('/api/articles')
      .expect(200);

    expect(response.body).toHaveProperty('articles');
    expect(Array.isArray(response.body.articles)).toBe(true);
  });

  it('should support pagination', async () => {
    const response = await request(app)
      .get('/api/articles?page=1&limit=10')
      .expect(200);

    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
  });
});
```

### Testing POST Endpoints (Creating Resources)

```typescript
describe('POST /api/articles', () => {
  it('should create article with valid data', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({
        title: 'New Article',
        content: 'Article content',
        category: 'AI',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('New Article');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({ title: 'Only Title' })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});
```

### Testing Authentication

```typescript
describe('Protected Routes', () => {
  it('should return 401 without authentication', async () => {
    const response = await request(app)
      .get('/api/profile')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  it('should return user profile with valid token', async () => {
    const token = generateMockToken('user-1', 'user');
    
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Testing Authorization (Role-Based Access)

```typescript
describe('Admin Routes', () => {
  it('should return 403 for non-admin users', async () => {
    const token = generateMockToken('user-1', 'user');
    
    const response = await request(app)
      .delete('/api/admin/users/user-2')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(response.body.error).toMatch(/Admin access required/);
  });

  it('should allow admin users', async () => {
    const token = generateMockToken('user-1', 'admin');
    
    const response = await request(app)
      .delete('/api/admin/users/user-2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

### Testing Error Scenarios

```typescript
describe('Error Handling', () => {
  it('should return 404 for non-existent resource', async () => {
    const response = await request(app)
      .get('/api/articles/nonexistent')
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 for invalid input', async () => {
    const response = await request(app)
      .post('/api/articles')
      .send({ title: '' })  // Empty title
      .expect(400);
  });

  it('should handle server errors gracefully', async () => {
    const response = await request(app)
      .get('/api/articles')
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });
});
```

## Supertest HTTP Methods

```typescript
// GET
await request(app).get('/api/articles').expect(200);

// POST (with data)
await request(app)
  .post('/api/articles')
  .send({ title: 'Article' })
  .expect(201);

// PUT (update)
await request(app)
  .put('/api/articles/id-123')
  .send({ title: 'Updated' })
  .expect(200);

// DELETE
await request(app)
  .delete('/api/articles/id-123')
  .expect(200);

// PATCH (partial update)
await request(app)
  .patch('/api/articles/id-123')
  .send({ title: 'Partial Update' })
  .expect(200);
```

## Assertions

### Status Codes

```typescript
// Expect specific status
await request(app).get('/api/articles').expect(200);

// Expect multiple possible statuses
await request(app)
  .get('/api/articles')
  .expect([200, 201]);
```

### Response Body

```typescript
const response = await request(app)
  .get('/api/articles')
  .expect(200);

// Check properties exist
expect(response.body).toHaveProperty('articles');

// Check values
expect(response.body.articles).toHaveLength(5);
expect(response.body.total).toBe(5);

// Check nested properties
expect(response.body.articles[0]).toHaveProperty('title');

// Type checks
expect(Array.isArray(response.body.articles)).toBe(true);
expect(typeof response.body.total).toBe('number');
```

### Headers

```typescript
// Check content type
await request(app)
  .get('/api/articles')
  .expect('Content-Type', /json/);

// Check custom headers
await request(app)
  .post('/api/articles')
  .set('Authorization', 'Bearer token')
  .expect(200);
```

## Running Tests

### All Integration Tests

```bash
npm run test:integration
```

### Watch Mode

```bash
npm run test:integration:watch
```

### With Coverage

```bash
npm run test:coverage
```

### Specific Test File

```bash
npm run test:integration -- server/__tests__/integration/articles.test.ts
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what the API returns, not how it's built internally
   - Focus on user-facing behavior

2. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should return 404 when article does not exist')
   
   // Bad
   it('returns error')
   ```

3. **Test Happy Path and Error Cases**
   - Always test successful scenarios
   - Always test error scenarios (400, 401, 403, 404, 500)
   - Test edge cases (empty arrays, null values, etc.)

4. **Keep Tests Isolated**
   - Each test should be independent
   - Use beforeEach/afterEach for setup/cleanup
   - Don't share state between tests

5. **Clean Fixtures**
   ```typescript
   afterEach(async () => {
     await teardownTestDatabase();
   });
   ```

6. **Use Meaningful Assertions**
   ```typescript
   // Good - specific assertion
   expect(response.body.articles[0].title).toBe('Expected Title');
   
   // Weak - vague assertion
   expect(response.body).toBeDefined();
   ```

## Common Errors & Fixes

**Issue**: Tests pass locally but fail in CI
- **Cause**: Async/await not properly handled
- **Fix**: Use `async/await` properly, don't mix callbacks

**Issue**: Flaky tests (pass sometimes, fail sometimes)
- **Cause**: Race conditions, hardcoded timeouts
- **Fix**: Use proper async patterns, avoid hardcoded waits

**Issue**: Tests timeout
- **Cause**: Missing async/await, infinite loops
- **Fix**: Check for promise handling, add timeouts to async operations

## File Structure

```
server/__tests__/
├── integration/          # API integration tests
│   ├── auth.test.ts
│   ├── articles.test.ts
│   ├── search.test.ts
│   └── health.test.ts
├── fixtures/            # Test data and utilities
│   ├── database.ts      # DB setup/teardown
│   └── test-data.ts     # Data factories
└── setup.ts             # Global test setup
```

## References

- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Vitest Documentation](https://vitest.dev/)
- [Express.js Testing Guide](https://expressjs.com/en/guide/testing.html)
