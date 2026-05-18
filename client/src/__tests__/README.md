# Test Suite — Ctrl Alt News Portal

**Test Infrastructure**: Story 15.1 Phase 2

---

## Structure

```
__tests__/
├── helpers/
│   └── async-test-utils.ts        # Reusable async testing utilities
├── templates/
│   └── ASYNC_COMPONENT_TEST_TEMPLATE.md  # Template for writing async tests
├── components/                    # Component tests
├── hooks/                         # Hook tests
├── pages/                         # Page tests
├── lib/                           # Library tests
├── setup.ts                       # Global test setup
└── README.md                      # This file
```

---

## Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run specific file
npm test -- useMyHook.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Writing Async Component Tests

1. **Read**: `docs/guides/ASYNC_TESTING_PATTERNS.md`
2. **Use Template**: `templates/ASYNC_COMPONENT_TEST_TEMPLATE.md`
3. **Use Helpers**: `helpers/async-test-utils.ts`

### Quick Async Test Example

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

it('should load async data', async () => {
  render(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

---

## Test Helpers

Located in `helpers/async-test-utils.ts`:

### `renderWithAsync(component, options?)`
Render component and wait for async data to load.

```typescript
const { getByText } = await renderWithAsync(<MyComponent />);
expect(getByText('Data')).toBeInTheDocument();
```

### `createMockLocalStorage(initialData?)`
Create isolated localStorage mock for tests.

```typescript
const storage = createMockLocalStorage({ theme: 'dark' });
expect(storage.getItem('theme')).toBe('dark');
```

### `waitForAsyncComponent(text, options?)`
Wait for specific text to appear in async component.

```typescript
render(<AsyncComponent />);
await waitForAsyncComponent('Loading complete');
```

### `createAsyncHookTestFixture()`
Setup fixture for async hook testing.

```typescript
const fixture = createAsyncHookTestFixture();
const { result } = renderHook(() => useMyHook());
await fixture.waitForAsyncState();
```

### `expectAsyncText(text, options?)`
Assert text appears after async render.

```typescript
await expectAsyncText('Data loaded', { timeout: 1000 });
```

### `flushAsyncUpdates(timeoutMs?)`
Wait for all pending async operations.

```typescript
await flushAsyncUpdates(100);
```

### `mockAsyncFunction(config)`
Create mock async function with configurable delay.

```typescript
const mockFetch = mockAsyncFunction({ delay: 100, result: { ok: true } });
const result = await mockFetch();
```

---

## Common Patterns

### Pattern 1: Component with Async Data

```typescript
it('should display async data', async () => {
  render(<MyComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Pattern 2: Hook with Async State

```typescript
it('should load hook data', async () => {
  const { result } = renderHook(() => useMyHook());
  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });
  expect(result.current.data).toBeTruthy();
});
```

### Pattern 3: User Interaction with Async

```typescript
it('should handle async action on click', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  await user.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
});
```

### Pattern 4: localStorage Persistence

```typescript
beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

it('should persist data', async () => {
  render(<MyComponent />);
  await waitFor(() => {
    expect(localStorage.getItem('key')).toBeTruthy();
  });
});
```

---

## Best Practices

### ✅ DO

- ✅ Make test functions `async` if they use `waitFor()`
- ✅ Wrap async assertions in `waitFor()`
- ✅ Clear localStorage/sessionStorage in `afterEach()`
- ✅ Use `getByRole()` for semantic queries
- ✅ Test user-visible behavior, not React internals
- ✅ Run tests multiple times to catch flakiness
- ✅ Use reasonable timeouts (500-2000ms)

### ❌ DON'T

- ❌ Don't forget `async` keyword on test function
- ❌ Don't assert outside `waitFor()` for async data
- ❌ Don't leave mocks/storage dirty between tests
- ❌ Don't use brittle DOM selectors
- ❌ Don't test implementation details
- ❌ Don't use extreme timeouts (1ms or 10000ms)
- ❌ Don't ignore flaky test failures

---

## Gotchas Reference

### Gotcha 1: Forgetting `async`

```typescript
// ❌ WRONG
it('should work', () => {
  await waitFor(() => {}); // SyntaxError
});

// ✅ CORRECT
it('should work', async () => {
  await waitFor(() => {});
});
```

### Gotcha 2: Assertion Outside waitFor()

```typescript
// ❌ WRONG
render(<Component />);
expect(screen.getByText('Data')).toBeInTheDocument(); // Fails
await waitFor(() => {});

// ✅ CORRECT
render(<Component />);
await waitFor(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
});
```

### Gotcha 3: localStorage Cross-Contamination

```typescript
// ❌ WRONG: No cleanup
describe('MyTests', () => {
  it('test 1', () => { localStorage.setItem('key', 'value1'); });
  it('test 2', () => { // Gets 'value1' from previous test!
    expect(localStorage.getItem('key')).toBe('value2');
  });
});

// ✅ CORRECT: Clean up after each
afterEach(() => {
  localStorage.clear();
});
```

---

## Document References

- **Async Testing Guide**: `docs/guides/ASYNC_TESTING_PATTERNS.md`
- **Test Template**: `templates/ASYNC_COMPONENT_TEST_TEMPLATE.md`
- **Gotchas Doc**: `docs/GOTCHAS_STORY_14.1.md`
- **Story 15.1**: `docs/stories/15.1.story.md`

---

## Story 15.1 Phase 2 Deliverables

✅ `async-test-utils.ts` — Reusable helper library  
✅ `ASYNC_TESTING_PATTERNS.md` — Complete guide with examples  
✅ `ASYNC_COMPONENT_TEST_TEMPLATE.md` — Template for new tests  
✅ `README.md` — This file

---

**Created**: 2026-05-18  
**Story**: Story 15.1 Async Test Infrastructure  
**Phase**: Phase 2 (Test Helpers & Documentation)
