# Runbook: Adding Tests to a Pull Request

## Step-by-Step Guide

### 1. Identify What Needs Testing
- New function? Add unit tests
- New API endpoint? Add integration tests
- New user workflow? Add E2E test
- Bug fix? Add regression test

### 2. Create Test File
```bash
# For new component
touch client/src/components/__tests__/MyComponent.test.tsx

# For new server function
touch server/__tests__/middleware/auth.test.ts
```

### 3. Write Tests

**Unit Test Template**:
```typescript
describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

**Integration Test Template**:
```typescript
describe('POST /api/endpoint', () => {
  it('should return 201 on success', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send(data)
      .expect(201);
    
    expect(response.body).toHaveProp('id');
  });
});
```

### 4. Run Tests Locally
```bash
npm run test              # Run all tests
npm run test:coverage    # Check coverage
npm run lint:fix         # Fix style issues
npm run check            # Type check
```

### 5. Verify Coverage
```bash
npm run test:coverage
open coverage/index.html  # Check covered lines
```

Target: >60% overall, >80% for your new code

### 6. Commit and Push
```bash
git add .
git commit -m "feat: add tests for new feature"
git push
```

### 7. Check CI Results
- Wait for GitHub Actions to complete
- Verify all tests pass
- Check coverage report

---

*Reference: See unit-testing.md and integration-testing.md for detailed patterns.*
