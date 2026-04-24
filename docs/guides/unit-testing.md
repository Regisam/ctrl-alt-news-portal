# Unit Testing Best Practices — Jest/Vitest Guide

## Overview

This guide covers best practices for writing unit tests using Jest (Node.js) and Vitest (client-side). Unit tests verify individual functions and components in isolation, forming the foundation of your test pyramid.

**Quick Reference**:
- **Framework**: Vitest (configured in `vitest.config.ts`)
- **Coverage Requirement**: 60% minimum (80% for critical paths)
- **Naming**: `{component/function}.test.ts{x}` or `{component/function}.spec.ts{x}`
- **Execution**: `npm run test` (unit + integration), `npm run test:coverage` (with coverage report)

---

## Test File Organization

### Structure

```
client/src/
├── components/
│   ├── Header.tsx
│   └── __tests__/
│       └── Header.test.tsx          ← Tests for Header

server/
├── middleware/
│   ├── authentication.ts
│   └── __tests__/
│       └── authentication.test.ts   ← Tests for auth middleware
```

### Naming Conventions

| Pattern | Use Case |
|---------|----------|
| `*.test.ts` | Vitest default convention |
| `*.spec.ts` | Alternative convention (also works) |
| `__tests__/` | Recommended directory structure |
| Descriptive test names | `should authenticate valid token` |

**Good**:
```typescript
// Button.test.tsx
describe('Button', () => {
  it('should render with label', () => {
    // test body
  });
});
```

**Bad**:
```typescript
// test1.tsx (unclear what's being tested)
it('test', () => { /* ... */ });
```

---

## Writing Effective Unit Tests

### 1. Test Structure — Arrange, Act, Assert

```typescript
describe('calculateTotal', () => {
  it('should sum array of numbers correctly', () => {
    // ARRANGE: Set up test data
    const prices = [10, 20, 30];
    
    // ACT: Execute the function
    const result = calculateTotal(prices);
    
    // ASSERT: Verify the result
    expect(result).toBe(60);
  });
});
```

### 2. Meaningful Test Names

**Good**:
- `should render loading spinner while fetching data`
- `should throw error when credentials are invalid`
- `should return empty array when no items exist`

**Bad**:
- `test1` — Unclear what's being tested
- `render` — Too vague, doesn't describe behavior
- `it should work` — Not specific enough

### 3. One Assertion Per Test (When Possible)

**Good** (focused):
```typescript
it('should render username in header', () => {
  render(<UserProfile user={{ name: 'Alice' }} />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
});

it('should render avatar image', () => {
  render(<UserProfile user={{ avatar: '/img.jpg' }} />);
  expect(screen.getByRole('img')).toHaveAttribute('src', '/img.jpg');
});
```

**Acceptable** (related assertions):
```typescript
it('should render user profile with all fields', () => {
  render(<UserProfile user={{ name: 'Alice', role: 'Admin' }} />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Admin')).toBeInTheDocument();
});
```

**Bad** (testing multiple behaviors):
```typescript
it('should work', () => {
  render(<UserProfile user={{ name: 'Alice' }} />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  // Also testing api, theme, auth — too much
});
```

---

## Testing React Components

### Using React Testing Library

**Good Pattern** (test user behavior, not implementation):
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

**Avoid**:
```typescript
// ❌ Testing implementation details (ref, state)
it('should set state on click', () => {
  const ref = createRef();
  render(<Button ref={ref}>Click</Button>);
  expect(ref.current.state.clicked).toBe(true);
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should increment count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  it('should decrement count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(-1);
  });
});
```

---

## Mocking & Test Doubles

### Mock Functions (vi.fn())

```typescript
describe('handleSubmit', () => {
  it('should call API on form submit', () => {
    const mockApi = vi.fn().mockResolvedValue({ success: true });
    
    handleSubmit(mockApi, { email: 'test@example.com' });
    
    expect(mockApi).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
```

### Mocking Modules

```typescript
import { fetchUser } from './api';

vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Alice' }),
}));

describe('getUserProfile', () => {
  it('should fetch user data', async () => {
    const user = await getUserProfile(1);
    expect(user.name).toBe('Alice');
  });
});
```

### Mocking HTTP Requests

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({ id: 1, name: 'Alice' }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchUser', () => {
  it('should fetch user data', async () => {
    const user = await fetchUser(1);
    expect(user.name).toBe('Alice');
  });
});
```

---

## Async & Promise Testing

### Proper async/await handling

**Good**:
```typescript
it('should load data asynchronously', async () => {
  const { result } = renderHook(() => useFetchUser(1));
  
  // Wait for loading to complete
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  
  expect(result.current.user).toBeDefined();
});
```

**Bad** (hardcoded timeout):
```typescript
it('should load data', async () => {
  const user = await fetchUser(1);
  
  // ❌ Flaky — depends on network speed
  await new Promise(resolve => setTimeout(resolve, 500));
  
  expect(user).toBeDefined();
});
```

### Testing Rejected Promises

```typescript
it('should handle API errors', async () => {
  const mockApi = vi.fn().mockRejectedValue(new Error('Network error'));
  
  await expect(fetchUser()).rejects.toThrow('Network error');
});
```

---

## Testing Error Scenarios

### Error Handling

```typescript
describe('parseJSON', () => {
  it('should throw on invalid JSON', () => {
    expect(() => parseJSON('not json')).toThrow(SyntaxError);
  });

  it('should parse valid JSON', () => {
    expect(parseJSON('{"a": 1}')).toEqual({ a: 1 });
  });
});
```

### Boundary Conditions

```typescript
describe('divide', () => {
  it('should divide two numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should throw when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it('should handle decimal results', () => {
    expect(divide(10, 3)).toBeCloseTo(3.33, 1);
  });
});
```

---

## Common Patterns

### Testing Array Operations

```typescript
describe('filterEvenNumbers', () => {
  it('should filter even numbers', () => {
    expect(filterEvenNumbers([1, 2, 3, 4, 5])).toEqual([2, 4]);
  });

  it('should return empty array for empty input', () => {
    expect(filterEvenNumbers([])).toEqual([]);
  });

  it('should return empty array when no evens', () => {
    expect(filterEvenNumbers([1, 3, 5])).toEqual([]);
  });
});
```

### Testing Object Transformations

```typescript
describe('normalizeUser', () => {
  it('should convert user to lowercase', () => {
    const input = { name: 'ALICE', email: 'TEST@EXAMPLE.COM' };
    const result = normalizeUser(input);
    
    expect(result).toEqual({
      name: 'alice',
      email: 'test@example.com',
    });
  });
});
```

### Testing API Response Handling

```typescript
describe('processApiResponse', () => {
  it('should extract data from API response', () => {
    const response = {
      status: 200,
      data: { users: [{ id: 1, name: 'Alice' }] },
    };
    
    const result = processApiResponse(response);
    expect(result).toEqual([{ id: 1, name: 'Alice' }]);
  });
});
```

---

## Anti-Patterns & Pitfalls

### ❌ Don't: Test Implementation Details

```typescript
// BAD — Tests internals, not behavior
it('should create component state', () => {
  const { rerender } = render(<Counter />);
  expect(component.instance.state.count).toBe(0); // ❌ Accessing internal state
});

// GOOD — Tests user behavior
it('should increment counter when button clicked', () => {
  render(<Counter />);
  fireEvent.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText('1')).toBeInTheDocument();
});
```

### ❌ Don't: Use Sleep/Timeout Instead of waitFor

```typescript
// BAD — Flaky, slow, timing-dependent
it('should load data', async () => {
  render(<UserList />);
  await new Promise(r => setTimeout(r, 1000)); // ❌
  expect(screen.getByText('Alice')).toBeInTheDocument();
});

// GOOD — Waits for condition
it('should load data', async () => {
  render(<UserList />);
  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

### ❌ Don't: Create Test Interdependencies

```typescript
// BAD — Tests depend on execution order
let userId;
it('should create user', () => {
  userId = createUser({ name: 'Alice' });
  expect(userId).toBeDefined();
});
it('should fetch user', () => {
  // ❌ Depends on previous test
  expect(fetchUser(userId).name).toBe('Alice');
});

// GOOD — Each test is independent
it('should create user', () => {
  const userId = createUser({ name: 'Alice' });
  expect(userId).toBeDefined();
});
it('should fetch user', () => {
  const userId = createUser({ name: 'Bob' });
  expect(fetchUser(userId).name).toBe('Bob');
});
```

### ❌ Don't: Snapshot Tests for Logic

```typescript
// BAD — Snapshots change often, not maintainable for logic
it('should format user', () => {
  const result = formatUser({ name: 'Alice', age: 30 });
  expect(result).toMatchSnapshot(); // ❌ Fragile
});

// GOOD — Explicit assertions
it('should format user', () => {
  const result = formatUser({ name: 'Alice', age: 30 });
  expect(result).toBe('Alice (30)');
});
```

---

## Setup & Fixtures

### Setup Before Each Test

```typescript
describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    vi.clearAllMocks(); // Clear mocks from previous test
  });

  it('should create user', () => {
    const user = userService.create({ name: 'Alice' });
    expect(user.id).toBeDefined();
  });
});
```

### Reusable Test Fixtures

```typescript
// fixtures.ts
export const mockUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
};

export const mockUsers = [mockUser, { id: 2, name: 'Bob' }];

// usage.test.ts
it('should filter users by name', () => {
  expect(filterUsers(mockUsers, 'Alice')).toEqual([mockUser]);
});
```

---

## Performance Considerations

### Slow Tests (>100ms)

```typescript
// BAD — Importing heavy modules in every test
import heavyModule from './heavy'; // ❌ Slow setup

it('should do something', () => {
  // test
});

// GOOD — Lazy import or mock
vi.mock('./heavy', () => ({ default: vi.fn() }));

it('should do something', () => {
  // test
});
```

### Test Suite Execution

- Unit tests should complete in **<2 seconds** for 100+ tests
- Use `vi.mock()` to avoid expensive imports
- Parallelize tests (Vitest default)
- Skip slow tests in development: `it.skip('slow test', () => {})`

---

## Debugging Tests

### Run Single Test File

```bash
npm run test -- src/components/Button.test.tsx
```

### Run Tests Matching Pattern

```bash
npm run test -- --grep "should render"
```

### Debug Mode (Inspector)

```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### View Full Error Output

```bash
npm run test -- --reporter=verbose
```

---

## Coverage Thresholds

### Vitest Configuration (vitest.config.ts)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },
}
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### View HTML Report

```bash
open coverage/index.html
```

### Coverage Interpretation

| Metric | Meaning |
|--------|---------|
| **Lines** | % of executable lines tested |
| **Statements** | % of code statements executed |
| **Functions** | % of functions called |
| **Branches** | % of conditional branches taken |

**Target: >60% overall, >80% for critical business logic**

---

## Code Review Checklist

Before submitting tests for review:

- ✅ Test names describe expected behavior
- ✅ AAA pattern followed (Arrange, Act, Assert)
- ✅ No hardcoded timeouts or sleep() calls
- ✅ Proper async/await handling
- ✅ Mock/stub usage appropriate and clear
- ✅ Test isolation verified (independent of other tests)
- ✅ Error cases covered
- ✅ Coverage threshold met for new code
- ✅ Tests are deterministic (not flaky)
- ✅ No implementation details tested

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about/#priority)

---

*Last Updated: 2026-04-24*
