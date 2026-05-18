# Async Testing Patterns Guide — Story 15.1

**Created**: 2026-05-18  
**Phase**: Test Infrastructure (Story 15.1 Phase 2)  
**Reference**: `docs/GOTCHAS_STORY_14.1.md`

---

## Overview

This guide documents best practices for testing async components and hooks in the Ctrl Alt News Portal. Based on 36 test failures fixed in Story 14.1, these patterns prevent common async testing pitfalls.

---

## Problem: Async Components Render as `null`

### The Issue

Components using async data (from hooks, APIs, localStorage) render as `null` until data loads:

```typescript
// ❌ PROBLEM: Component returns null until hook loads data
function RecommendationsWidget() {
  const { recommendations, isLoading } = useRecommendations();
  
  if (isLoading) return null; // Test runs before this changes to false
  
  return <div>{recommendations.map(...)}</div>;
}

// Test fails: "Unable to find element"
it('should display recommendations', () => {
  render(<RecommendationsWidget />);
  expect(screen.getByText('Recommended')).toBeInTheDocument(); // ❌ FAILS
});
```

**Root Cause**: Tests assert before async state updates complete.

---

## Solution 1: Use `waitFor()` (Most Common)

### Pattern

Wrap assertions in `waitFor()` to wait for async state updates:

```typescript
import { render, screen, waitFor } from '@testing-library/react';

it('should display recommendations', async () => {
  render(<RecommendationsWidget />);
  
  await waitFor(() => {
    expect(screen.getByText('Recommended')).toBeInTheDocument();
  });
});
```

### Key Points

- ✅ Makes test function `async`
- ✅ Wraps all assertions that depend on async data
- ✅ Adds `await` before `waitFor()`
- ✅ Default timeout: 1000ms

### Example with Timeout

```typescript
await waitFor(
  () => {
    expect(screen.getByText('Recommendations loaded')).toBeInTheDocument();
  },
  { timeout: 2000 } // Wait up to 2 seconds
);
```

---

## Solution 2: Fix Hook Initialization (Sync Where Possible)

### Anti-Pattern: Async State Update

```typescript
// ❌ BAD: useState initialized with async
useEffect(() => {
  const data = fetchData(); // sync
  Promise.resolve().then(() => {
    setState(data); // async update
  });
}, []);
```

### Pattern: Sync Initialization

```typescript
// ✅ GOOD: Initialize state sync in useState
const [data, setData] = useState(() => {
  // Initializer function runs during render
  return getStoredData(); // sync retrieval
});

// Then update async if needed
useEffect(() => {
  refreshData().then(setData);
}, []);
```

### Benefits

- State updates immediately during render
- Tests run faster
- Fewer `waitFor()` calls needed

---

## Solution 3: Clear localStorage Between Tests

### Pattern

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup(); // React cleanup
  localStorage.clear(); // ← Important!
  sessionStorage.clear();
});
```

### Why

- Prevents test contamination
- One test's data doesn't affect the next
- Isolates test state

---

## Solution 4: Use Test Helpers

### Helper Library

Located in `client/src/__tests__/helpers/async-test-utils.ts`

```typescript
import {
  renderWithAsync,
  createMockLocalStorage,
  waitForAsyncComponent,
  createAsyncHookTestFixture,
} from '@/__tests__/helpers/async-test-utils';
```

### Examples

#### `renderWithAsync()` — Render and wait for data

```typescript
it('should load async data', async () => {
  const { getByText } = await renderWithAsync(<MyAsyncComponent />);
  expect(getByText('Data loaded')).toBeInTheDocument();
});
```

#### `createMockLocalStorage()` — Isolated mock

```typescript
it('should persist to localStorage', () => {
  const storage = createMockLocalStorage({ theme: 'dark' });
  expect(storage.getItem('theme')).toBe('dark');
});
```

#### `waitForAsyncComponent()` — Wait for specific text

```typescript
it('should show results', async () => {
  render(<SearchResults />);
  await waitForAsyncComponent('Results loaded');
});
```

#### `createAsyncHookTestFixture()` — Hook testing fixture

```typescript
const fixture = createAsyncHookTestFixture();

afterEach(() => {
  fixture.clearAllMocks();
});

it('should load user data', async () => {
  const { result } = renderHook(() => useUserData());
  await fixture.waitForAsyncState();
  expect(result.current.user).toBeDefined();
});
```

---

## Decision Tree: Which Solution to Use?

```
Does the test fail with "element not found"?
└─ YES
   ├─ Is it a component render issue?
   │  └─ YES → Use Solution 1: waitFor()
   │
   ├─ Is it a hook state issue?
   │  └─ YES → Check Solution 2: Sync initialization
   │
   └─ Is it localStorage cross-contamination?
      └─ YES → Use Solution 3: Clear in afterEach()

Is the test slow or brittle?
└─ YES → Consider Solution 2: Fix async in hooks
```

---

## Common Gotchas

### ❌ Gotcha 1: Forgetting `async`/`await`

```typescript
// ❌ WRONG: Not async, can't await
it('should load data', () => {
  render(<Component />);
  await waitFor(() => {}); // SyntaxError
});

// ✅ CORRECT
it('should load data', async () => {
  render(<Component />);
  await waitFor(() => {});
});
```

### ❌ Gotcha 2: Assertion Outside `waitFor()`

```typescript
// ❌ WRONG: Assertion happens before async completes
it('should show text', async () => {
  render(<Component />);
  expect(screen.getByText('Loaded')).toBeInTheDocument(); // Might fail
  await waitFor(() => {});
});

// ✅ CORRECT: Assertion inside waitFor()
it('should show text', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### ❌ Gotcha 3: Timeout Too Short

```typescript
// ❌ WRONG: 50ms timeout for data that takes 200ms to load
await waitFor(
  () => { expect(...).toBeInTheDocument(); },
  { timeout: 50 } // Too short!
);

// ✅ CORRECT: Generous timeout
await waitFor(
  () => { expect(...).toBeInTheDocument(); },
  { timeout: 2000 }
);
```

### ❌ Gotcha 4: localStorage Not Cleared

```typescript
// ❌ WRONG: Test 1 sets localStorage['user'] = 'Alice'
// Then Test 2 reads it and fails because it expects 'Bob'
beforeEach(() => {
  // No clearing!
});

// ✅ CORRECT
afterEach(() => {
  localStorage.clear();
});
```

---

## Real-World Examples

### Example 1: Component with Async Hook

```typescript
// Component
function UserProfile({ userId }: { userId: string }) {
  const { user, isLoading } = useUser(userId);
  
  if (isLoading) return null;
  
  return <div>{user.name}</div>;
}

// ✅ Test
it('should display user profile', async () => {
  render(<UserProfile userId="123" />);
  
  await waitFor(() => {
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });
});
```

### Example 2: Hook with localStorage

```typescript
// Hook
function usePreferences() {
  const [prefs, setPrefs] = useState(() => {
    const stored = localStorage.getItem('prefs');
    return stored ? JSON.parse(stored) : DEFAULT_PREFS;
  });
  
  return prefs;
}

// ✅ Test
it('should load preferences from localStorage', () => {
  localStorage.setItem('prefs', JSON.stringify({ theme: 'dark' }));
  
  const { result } = renderHook(() => usePreferences());
  
  expect(result.current.theme).toBe('dark');
});

afterEach(() => {
  localStorage.clear();
});
```

### Example 3: Component with User Interaction

```typescript
// Component with async action
function LikeButton({ articleId }: { articleId: string }) {
  const [liked, setLiked] = useState(false);
  
  const handleClick = async () => {
    await likeArticle(articleId);
    setLiked(true);
  };
  
  return <button onClick={handleClick}>{liked ? 'Liked' : 'Like'}</button>;
}

// ✅ Test
it('should update like status after click', async () => {
  const user = userEvent.setup();
  render(<LikeButton articleId="123" />);
  
  const button = screen.getByRole('button', { name: 'Like' });
  await user.click(button);
  
  // Wait for async action to complete
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Liked' })).toBeInTheDocument();
  });
});
```

---

## Performance Tips

### ✅ Use Shorter Timeouts When Possible

```typescript
// If your async operation completes in 100ms, use:
await waitFor(() => {...}, { timeout: 500 }); // Not 5000
```

### ✅ Be Specific in Assertions

```typescript
// ✅ GOOD: Specific query
await waitFor(() => {
  expect(screen.getByTestId('user-name')).toHaveTextContent('Alice');
});

// ❌ SLOW: Broad query
await waitFor(() => {
  expect(screen.getByText(/.*Alice.*/)).toBeInTheDocument();
});
```

### ✅ Use `getByRole` When Possible

```typescript
// ✅ GOOD: Semantic, accessible
const button = screen.getByRole('button', { name: 'Submit' });

// ❌ SLOWER: DOM-based
const button = document.querySelector('.submit-btn');
```

---

## Checklist: Async Testing

- [ ] Test function is `async`
- [ ] All async assertions wrapped in `waitFor()`
- [ ] `await` before `waitFor()`
- [ ] localStorage cleared in `afterEach()`
- [ ] Timeout is reasonable (500-2000ms)
- [ ] Not testing React internals (state, hooks) directly
- [ ] Testing user-visible behavior instead

---

## References

- **Story 14.1**: `docs/GOTCHAS_STORY_14.1.md` — Original patterns
- **Test Utils**: `client/src/__tests__/helpers/async-test-utils.ts` — Helper functions
- **React Testing Library**: https://testing-library.com/docs/queries/about#priority
- **Vitest waitFor**: https://vitest.dev/guide/advanced/fixtures.html

---

**Created by**: Story 15.1 Phase 2  
**For**: Frontend testing standards, Ctrl Alt News Portal team
