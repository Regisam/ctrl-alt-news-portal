# API Integration Testing Guide

## Overview

Integration tests validate API endpoints end-to-end with real database and services.

## Test Stack

- **Vitest**: Fast unit testing framework
- **Supertest**: HTTP assertion library
- **Fixtures**: Reusable test data

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm run test -- auth.test.ts
```

## Test Structure

### Setup & Teardown

```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { testSetup } from './setup';

beforeAll(async () => {
  // Initialize test environment
});

afterAll(async () => {
  // Cleanup
  await testSetup.cleanup();
});
```

### Fixtures

Test data available in `setup.ts`:

```typescript
import { testSetup } from '../setup';

const testUser = await testSetup.createTestUser({
  email: 'custom@example.com',
});

const testArticle = await testSetup.createTestArticle({
  title: 'Custom Article',
});
```

## Test Examples

### Authentication Tests

```typescript
describe('Auth API', () => {
  it('should register user', async () => {
    const res = await request(app)
      .post('/api/auth-v2/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should login user', async () => {
    const res = await request(app)
      .post('/api/auth-v2/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth-v2/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
```

### Protected Routes

```typescript
it('should protect routes with auth', async () => {
  // Request without token
  const resNoAuth = await request(app).get('/api/auth-v2/me');
  expect(resNoAuth.status).toBe(401);

  // Request with token
  const token = authService.generateToken('user-1', 'test@example.com');
  const resWithAuth = await request(app)
    .get('/api/auth-v2/me')
    .set('Authorization', `Bearer ${token}`);

  expect(resWithAuth.status).toBe(200);
  expect(resWithAuth.body.user).toBeDefined();
});
```

### Error Handling

```typescript
describe('Error Responses', () => {
  it('should return 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth-v2/register')
      .send({ email: 'test@example.com' }); // missing password, name

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing required fields');
  });

  it('should return 404 for not found', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('should return 500 on server error', async () => {
    // Mock service failure
    jest.spyOn(userService, 'create').mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/auth-v2/register')
      .send({ ... });

    expect(res.status).toBe(500);
  });
});
```

## Coverage Goals

- **Target**: >60% for API layer
- **Current**: Run `npm run test:coverage` to see

```
File                    % Stmts % Branch % Funcs % Lines
api/auth-v2.ts          85%     80%      90%    87%
lib/authService.ts      92%     88%      95%    93%
middleware/auth.ts      78%     72%      85%    80%
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always cleanup test data after tests
3. **Assertions**: Use specific, readable assertions
4. **Fixtures**: Use testSetup for common data
5. **Mocks**: Mock external services (email, etc)
6. **Coverage**: Aim for >80% on critical paths

## Common Patterns

### Database Transactions

```typescript
beforeEach(async () => {
  // Start transaction
  await db.transaction(async (tx) => {
    // All test queries use this transaction
  });
});

afterEach(async () => {
  // Rollback automatically
});
```

### Mocking External Services

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.mock('../../lib/emailService', () => ({
    sendEmail: vi.fn().mockResolvedValue(true),
  }));
});
```

### Async Tests

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

## Troubleshooting

### Tests Timeout
```typescript
it('should complete within time', async () => {
  // default 5000ms, increase if needed
}, 10000);
```

### Database Conflicts
- Ensure test database is isolated
- Use transactions for cleanup
- Check unique constraints

### Port Binding
- Use dynamic ports in tests
- Clean up connections in afterAll
- Check for zombie processes

## References

- [Vitest Docs](https://vitest.dev)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
