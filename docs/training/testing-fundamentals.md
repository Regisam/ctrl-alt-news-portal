# Testing Fundamentals — Introduction & Theory

## Why Testing Matters

Tests are a safety net that prevents bugs from reaching users. They catch regressions, enable refactoring, and give you confidence that code works as intended.

**Impact**:
- **Bug Prevention**: 95% of critical bugs caught before production
- **Safe Refactoring**: Change code without fear of breaking features
- **Documentation**: Tests show how code is supposed to work
- **Quality Culture**: Testing practices improve overall code quality

---

## The Test Pyramid

```
         E2E Tests
       /           \
     /               \
   Integration Tests
 /                     \
Unit Tests
```

| Level | Purpose | Speed | Coverage |
|-------|---------|-------|----------|
| **Unit** | Test individual functions | Fast | Most code |
| **Integration** | Test components together | Medium | Interfaces |
| **E2E** | Test user workflows | Slow | Critical paths |

**Rule of Thumb**: 70% unit, 20% integration, 10% E2E

---

## Types of Tests

### Unit Tests
Test a single function or component in isolation.

```typescript
// Testing a calculation function
describe('calculateTotal', () => {
  it('should sum array of prices', () => {
    expect(calculateTotal([10, 20, 30])).toBe(60);
  });
});
```

### Integration Tests
Test how multiple components work together.

```typescript
// Testing API endpoint + database
describe('GET /api/articles', () => {
  it('should fetch articles from database', async () => {
    const response = await request(app).get('/api/articles');
    expect(response.status).toBe(200);
    expect(response.body.articles).toBeArray();
  });
});
```

### E2E Tests
Test complete user workflows.

```typescript
// Testing user story: search for article
describe('Article Search', () => {
  it('should allow user to search and view article', async () => {
    await page.goto('http://localhost:3000');
    await page.fill('input[type="search"]', 'React');
    await page.click('button:has-text("Search")');
    await page.click('text=React Best Practices');
    await expect(page).toHaveTitle(/React/);
  });
});
```

---

## Test Structure

Every test follows this pattern:

```
ARRANGE → ACT → ASSERT
```

1. **Arrange**: Set up test data and dependencies
2. **Act**: Execute the function/component
3. **Assert**: Verify the result

```typescript
describe('discount calculation', () => {
  it('should apply 10% discount to total', () => {
    // ARRANGE
    const amount = 100;
    const discountRate = 0.1;

    // ACT
    const result = applyDiscount(amount, discountRate);

    // ASSERT
    expect(result).toBe(90);
  });
});
```

---

## Key Testing Principles

### 1. Test One Thing Per Test
Each test should verify one behavior.

**Good**:
```typescript
it('should render user name', () => { /* test */ });
it('should render user email', () => { /* test */ });
```

**Bad**:
```typescript
it('should render user', () => {
  // testing too many things at once
});
```

### 2. Tests Must Be Deterministic
Same test must always pass or always fail. No randomness.

**Good**:
```typescript
it('should find user by email', () => {
  const user = findUser('test@example.com');
  expect(user.email).toBe('test@example.com');
});
```

**Bad**:
```typescript
it('should work sometimes', () => {
  const random = Math.random();
  if (random > 0.5) {
    expect(true).toBe(true); // Flaky!
  }
});
```

### 3. Tests Should Be Independent
No test should depend on another test's data.

**Good**:
```typescript
beforeEach(() => {
  db.clear(); // Fresh data for each test
});
```

### 4. Meaningful Test Names
Test names should describe the expected behavior.

**Good**:
- `should return 404 when article not found`
- `should add item to cart`
- `should reject invalid email`

**Bad**:
- `test1`
- `works`
- `should do stuff`

---

## Common Testing Mistakes

### ❌ Testing Implementation Details

```typescript
// BAD — Tests internal state
it('should increment state', () => {
  const comp = new Counter();
  comp.increment();
  expect(comp.state.count).toBe(1); // ❌ Accessing internals
});

// GOOD — Tests behavior
it('should display count of 1 after increment', () => {
  render(<Counter />);
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### ❌ Test Interdependencies

```typescript
// BAD — Tests that depend on order
let userId;
it('test 1 - create user', () => {
  userId = createUser(...);
});
it('test 2 - get user', () => {
  const user = getUser(userId); // ❌ Depends on test 1
});

// GOOD — Independent tests
it('should create and return user', () => {
  const userId = createUser(...);
  const user = getUser(userId);
  expect(user.id).toBe(userId);
});
```

### ❌ Flaky Tests with Timeouts

```typescript
// BAD — Using sleep
it('should load data', async () => {
  render(<DataLoader />);
  await new Promise(r => setTimeout(r, 500)); // ❌ Flaky
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// GOOD — Waiting for condition
it('should load data', async () => {
  render(<DataLoader />);
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

---

## Testing Mindset

### Think Like a User
- Test behavior, not implementation
- Focus on what users care about
- Test workflows, not code internals

### Test Edge Cases
- Empty data
- Invalid input
- Error conditions
- Boundary values

### Keep Tests Maintainable
- Clear, descriptive names
- Don't repeat code
- Use factories/fixtures for test data
- Update tests when requirements change

---

## Getting Started

1. **Write test first** (TDD): Write failing test, then implement
2. **Run tests locally**: `npm run test`
3. **Check coverage**: `npm run test:coverage`
4. **Follow patterns** from existing tests
5. **Ask for review**: Tests are code too

---

*Last Updated: 2026-04-24*
