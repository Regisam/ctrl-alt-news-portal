# Mocking Guide

Mocking external dependencies in tests.

## Mocking Functions

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
const mockFnWithReturnValue = vi.fn(() => 'value');

mockFn();
expect(mockFn).toHaveBeenCalled();
```

## Mocking Modules

```typescript
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, name: 'John' })),
}));

import { fetchUser } from './api';

it('should use mocked API', async () => {
  const user = await fetchUser();
  expect(user.name).toBe('John');
});
```

## Mocking Fetch API

```typescript
import { mocks } from '@/__tests__/test-utils';

it('should handle API response', async () => {
  mocks.mockFetch({ status: 'success', data: [] });

  const response = await fetch('/api/items');
  const data = await response.json();

  expect(data.status).toBe('success');
});

it('should handle fetch error', async () => {
  mocks.mockFetchError(new Error('Network failed'));

  await expect(fetch('/api/items')).rejects.toThrow('Network failed');
});
```

## Mocking React Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import useUser from './useUser';

it('should return user data', () => {
  const { result } = renderHook(() => useUser(1));

  expect(result.current.isLoading).toBe(true);

  act(() => {
    // Trigger state update
  });

  expect(result.current.user).toBeDefined();
});
```

## Mocking localStorage

```typescript
import { mocks } from '@/__tests__/test-utils';

beforeEach(() => {
  localStorage.clear();
});

it('should save to localStorage', () => {
  localStorage.setItem('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');
});
```

## Clearing Mocks

```typescript
import { vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});
```

## Tips

- Mock at the boundary (API calls, external libraries)
- Don't mock implementation details
- Use factories for test data instead of mocks
- Keep mocks simple and focused
