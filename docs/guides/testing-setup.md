# Testing Setup Guide

This guide covers the testing infrastructure for Ctrl Alt News portal, including unit tests, integration tests, and testing best practices.

## Quick Start

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Open interactive test UI
npm run test:ui
```

## Testing Stack

### Server-Side Testing
- **Framework**: Jest + TypeScript
- **Location**: `server/__tests__/**/*.test.ts`
- **Configuration**: `jest.config.js`
- **Run**: `npm run test` (includes server tests)

### Client-Side Testing
- **Framework**: Vitest + React Testing Library
- **Location**: `client/src/**/*.test.tsx`
- **Configuration**: `vitest.config.ts`
- **Run**: `npm run test` (includes client tests)

### Test Utilities
- **Setup**: `client/src/__tests__/setup.ts` (Vitest setup with providers)
- **Helpers**: `client/src/__tests__/test-utils.tsx` (render helpers, factories, mocks)

## Writing Your First Test

### Server-Side Test Example

Create `server/__tests__/math.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Math utilities', () => {
  it('should add two numbers', () => {
    const sum = 2 + 3;
    expect(sum).toBe(5);
  });

  it('should multiply two numbers', () => {
    const product = 4 * 5;
    expect(product).toBe(20);
  });
});
```

Run with: `npm run test`

### Client-Side Test Example

Create `client/src/components/Button.test.tsx`:

```typescript
import { render, screen, userEvent } from '@/__tests__/test-utils';
import Button from './Button';

describe('Button', () => {
  it('renders button with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Coverage Goals

| Category | Target |
|----------|--------|
| Overall Coverage | >60% |
| Critical Code (lib, utils) | >80% |
| Branches | >40% |
| Functions | >40% |
| Lines | >40% |
| Statements | >40% |

### Viewing Coverage Reports

```bash
npm run test:coverage
# Opens: ./coverage/index.html
```

## Test Patterns

### Testing Async Operations

```typescript
it('should fetch data', async () => {
  const data = await fetchUser(1);
  expect(data.id).toBe(1);
});

it('should handle errors', async () => {
  await expect(failingFetch()).rejects.toThrow('Network error');
});
```

### Testing React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

it('should increment count', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Testing Components with Props

```typescript
it('renders with different props', () => {
  const { rerender } = render(<Component label="First" />);
  expect(screen.getByText('First')).toBeInTheDocument();

  rerender(<Component label="Second" />);
  expect(screen.getByText('Second')).toBeInTheDocument();
});
```

## Best Practices

### ✅ DO

- Write tests that test **behavior**, not implementation
- Use semantic queries: `getByRole`, `getByLabelText`, `getByText`
- Keep tests focused and single-responsibility
- Use descriptive test names: `it('should calculate discount for valid inputs')`
- Mock external dependencies (APIs, database)
- Use `userEvent` instead of `fireEvent` (closer to real user interactions)

### ❌ DON'T

- Test implementation details (internal state, DOM structure)
- Use `querySelector` or CSS selectors
- Write tests that are tightly coupled to component structure
- Create tests that are slow or flaky
- Mock things that don't need mocking
- Write tests without assertions

## Configuration

### Jest (Server)
- **Config File**: `jest.config.js`
- **Test Pattern**: `**/__tests__/**/*.test.ts`
- **Environment**: Node.js
- **TypeScript**: ts-jest

### Vitest (Client)
- **Config File**: `vitest.config.ts`
- **Test Pattern**: `**/*.test.tsx`
- **Environment**: jsdom (browser-like)
- **TypeScript**: Built-in support

## Troubleshooting

### Tests fail with "Cannot find module"

**Solution**: Make sure module aliases in `vitest.config.ts` and `jest.config.js` match your TypeScript `tsconfig.json`.

### "ReferenceError: localStorage is not defined"

**Solution**: localStorage mock is provided in `client/src/__tests__/setup.ts`. Make sure `setupFiles` is configured in `vitest.config.ts`.

### Tests are slow

**Solution**: 
- Use parallel execution: `vitest --reporter=verbose`
- Mock expensive operations
- Use `test.skip` or `test.only` to debug specific tests

### Flaky tests (intermittent failures)

**Solution**:
- Avoid hardcoded timeouts, use `waitFor()`
- Properly handle async operations
- Don't rely on timing assumptions

## Further Reading

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](../testing-best-practices.md)
