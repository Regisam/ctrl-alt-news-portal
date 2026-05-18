# Async Component Test Template — Story 15.1

Use this template when writing tests for components that load async data.

---

## Template: Basic Async Component Test

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MyAsyncComponent } from '@/components/MyAsyncComponent';

describe('MyAsyncComponent', () => {
  // Setup: Clear mocks and storage before each test
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  // Cleanup: Clear after each test
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ✅ Basic async render test
  it('should render with default state', async () => {
    render(<MyAsyncComponent />);
    
    // Wait for async data to load
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });

  // ✅ Test with props
  it('should accept and use props', async () => {
    render(<MyAsyncComponent count={5} title="Custom" />);
    
    await waitFor(() => {
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  // ✅ Test error handling
  it('should handle errors gracefully', async () => {
    // Mock the failing hook/API
    vi.mocked(myAsyncFunction).mockRejectedValueOnce(
      new Error('API failed')
    );
    
    render(<MyAsyncComponent />);
    
    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  // ✅ Test loading state
  it('should show loading indicator', async () => {
    render(<MyAsyncComponent />);
    
    // Initially should show loading
    expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument();
    
    // Then should load data
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByText('Data loaded')).toBeInTheDocument();
    });
  });

  // ✅ Test with localStorage
  it('should persist to localStorage', async () => {
    render(<MyAsyncComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
    
    const stored = localStorage.getItem('myComponent');
    expect(stored).toBeTruthy();
  });
});
```

---

## Template: Async Hook Test

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMyAsyncHook } from '@/hooks/useMyAsyncHook';

describe('useMyAsyncHook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ✅ Basic hook test
  it('should load data', async () => {
    const { result } = renderHook(() => useMyAsyncHook());
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    
    // Wait for data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toBeTruthy();
  });

  // ✅ Test with parameters
  it('should accept parameters', async () => {
    const { result } = renderHook(() => useMyAsyncHook({ id: '123' }));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data.id).toBe('123');
  });

  // ✅ Test hook dependencies
  it('should refetch on dependency change', async () => {
    const { result, rerender } = renderHook(
      ({ id }) => useMyAsyncHook({ id }),
      { initialProps: { id: '1' } }
    );
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    const firstData = result.current.data;
    
    // Change dependency
    rerender({ id: '2' });
    
    await waitFor(() => {
      expect(result.current.data).not.toEqual(firstData);
    });
  });
});
```

---

## Template: Component with User Interaction

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyInteractiveComponent } from '@/components/MyInteractiveComponent';

describe('MyInteractiveComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ✅ Test user interaction with async action
  it('should handle button click with async action', async () => {
    const user = userEvent.setup();
    render(<MyInteractiveComponent />);
    
    const button = screen.getByRole('button', { name: /submit|save/i });
    
    // Click button
    await user.click(button);
    
    // Wait for async action to complete
    await waitFor(() => {
      expect(screen.getByText(/success|saved/i)).toBeInTheDocument();
    });
  });

  // ✅ Test form submission with validation
  it('should validate form before submit', async () => {
    const user = userEvent.setup();
    render(<MyInteractiveComponent />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Try to submit empty form
    await user.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/required|invalid/i)).toBeInTheDocument();
    });
    
    // Fill form
    const input = screen.getByRole('textbox');
    await user.type(input, 'valid input');
    
    // Submit again
    await user.click(submitButton);
    
    // Should succeed
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

---

## Template: Multiple Async Operations

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ComplexAsyncComponent } from '@/components/ComplexAsyncComponent';

describe('ComplexAsyncComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ✅ Test component that has multiple async operations
  it('should load all required data', async () => {
    render(<ComplexAsyncComponent />);
    
    // Wait for all async operations to complete
    await waitFor(
      () => {
        // Check all async data is loaded
        expect(screen.getByText('User data loaded')).toBeInTheDocument();
        expect(screen.getByText('Recommendations loaded')).toBeInTheDocument();
        expect(screen.getByText('Settings loaded')).toBeInTheDocument();
      },
      { timeout: 2000 } // Longer timeout for multiple operations
    );
  });

  // ✅ Test sequential async operations
  it('should load data in correct sequence', async () => {
    render(<ComplexAsyncComponent />);
    
    // First async operation completes
    await waitFor(() => {
      expect(screen.getByText('Step 1 complete')).toBeInTheDocument();
    });
    
    // Second async operation completes
    await waitFor(() => {
      expect(screen.getByText('Step 2 complete')).toBeInTheDocument();
    });
    
    // Final state
    await waitFor(() => {
      expect(screen.getByText('All done')).toBeInTheDocument();
    });
  });
});
```

---

## Tips & Tricks

### Tip 1: Timeout Management

```typescript
// For fast operations (< 500ms)
await waitFor(() => {...}, { timeout: 500 });

// For normal operations (500ms - 1.5s)
await waitFor(() => {...}, { timeout: 1000 });

// For slow operations (> 1.5s)
await waitFor(() => {...}, { timeout: 3000 });
```

### Tip 2: Multiple Assertions in One waitFor

```typescript
// ✅ All assertions wait for async data
await waitFor(() => {
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Email')).toBeInTheDocument();
  expect(screen.getByText('Phone')).toBeInTheDocument();
});
```

### Tip 3: Query by Role (Best Practice)

```typescript
// ✅ Accessible & semantic
const button = screen.getByRole('button', { name: 'Submit' });
const heading = screen.getByRole('heading', { name: 'Welcome' });
const table = screen.getByRole('table');

// ❌ Avoid (brittle, not semantic)
const button = document.querySelector('.submit-btn');
```

### Tip 4: Test IDs for Complex Selectors

```typescript
// Component
<div data-testid="user-card">
  <div>{user.name}</div>
</div>

// Test
const card = screen.getByTestId('user-card');
expect(card).toBeInTheDocument();
```

---

## Common Patterns

### Pattern: Wait for Loading State to Disappear

```typescript
await waitFor(() => {
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
```

### Pattern: Check Final Data

```typescript
await waitFor(() => {
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(5);
});
```

### Pattern: Handle Conditional Rendering

```typescript
// Component renders nothing until data loads
await waitFor(() => {
  expect(container.firstChild).not.toBeEmptyDOMElement();
});
```

---

## Checklist Before Submitting Tests

- [ ] All async assertions in `waitFor()`
- [ ] Test function is `async`
- [ ] localStorage/sessionStorage cleared in `afterEach()`
- [ ] Timeout is reasonable (500-2000ms)
- [ ] Tests are independent (one test's setup doesn't affect another)
- [ ] Using `getByRole()` where possible
- [ ] No flaky tests (run 3x to verify)
- [ ] Tests follow AAA pattern: Arrange → Act → Assert

---

**Reference**: `docs/guides/ASYNC_TESTING_PATTERNS.md`  
**Helpers**: `client/src/__tests__/helpers/async-test-utils.ts`
