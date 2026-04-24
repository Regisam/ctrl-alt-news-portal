# Hooks Testing Guide — Custom Hooks with renderHook

Comprehensive guide to testing React custom hooks with @testing-library/react.

## Quick Start

```bash
npm run test:components          # Run all hooks tests
npm run test:components:watch   # Watch mode for development
```

## Setup

Hooks tests use the same test utilities as component tests:

```typescript
import { renderHook, act } from '@testing-library/react';
import useCustomHook from '@/hooks/useCustomHook';
import { describe, it, expect } from 'vitest';
```

## Basic Hook Testing

### Simple Hook that Returns a Value

```typescript
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '@/hooks/useMobile';

describe('useIsMobile', () => {
  it('should return false for desktop viewport', () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(false);
  });

  it('should return true for mobile viewport', () => {
    window.innerWidth = 640;
    const { result } = renderHook(() => useIsMobile());
    
    expect(result.current).toBe(true);
  });
});
```

### Hook that Updates State

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('should initialize with 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should increment when increment called', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement when decrement called', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });
});
```

## Common Patterns

### Testing useState Hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useToggle } from '@/hooks/useToggle';

describe('useToggle', () => {
  it('should initialize with initial value', () => {
    const { result } = renderHook(() => useToggle(false));
    expect(result.current[0]).toBe(false);
  });

  it('should toggle value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(false);
  });

  it('should set value to specific value', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[2](true);
    });

    expect(result.current[0]).toBe(true);
  });
});
```

### Testing useEffect Hook

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTitle } from '@/hooks/useTitle';

describe('useTitle', () => {
  const originalTitle = document.title;

  afterEach(() => {
    document.title = originalTitle;
  });

  it('should set document title on mount', () => {
    renderHook(() => useTitle('My Page'));
    expect(document.title).toBe('My Page');
  });

  it('should update document title when prop changes', async () => {
    const { rerender } = renderHook(
      ({ title }) => useTitle(title),
      { initialProps: { title: 'Initial Title' } }
    );

    expect(document.title).toBe('Initial Title');

    rerender({ title: 'Updated Title' });

    expect(document.title).toBe('Updated Title');
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useTitle('Test'));
    unmount();

    expect(document.title).toBe(originalTitle);
  });
});
```

### Testing Custom Hooks with Dependencies

```typescript
import { renderHook } from '@testing-library/react';
import { usePrevious } from '@/hooks/usePrevious';

describe('usePrevious', () => {
  it('should return undefined on first render', () => {
    const { result } = renderHook(() => usePrevious(5));
    expect(result.current).toBeUndefined();
  });

  it('should return previous value after update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 5 } }
    );

    rerender({ value: 10 });
    expect(result.current).toBe(5);

    rerender({ value: 15 });
    expect(result.current).toBe(10);
  });
});
```

### Testing useCallback Hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAsync } from '@/hooks/useAsync';

describe('useAsync', () => {
  it('should initialize with pending state', () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve('data'))
    );

    expect(result.current.status).toBe('pending');
  });

  it('should resolve promise', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsync(() => Promise.resolve('data'))
    );

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.data).toBe('data');
  });

  it('should handle promise rejection', async () => {
    const error = new Error('Failed');
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(error))
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe(error);
  });
});
```

### Testing useLocalStorage Hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with stored value', () => {
    localStorage.setItem('key', JSON.stringify('stored value'));
    const { result } = renderHook(() => useLocalStorage('key', 'default'));

    expect(result.current[0]).toBe('stored value');
  });

  it('should initialize with default value if not in storage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should update localStorage on value change', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.getItem('key')).toBe(JSON.stringify('updated'));
    expect(result.current[0]).toBe('updated');
  });

  it('should persist across hook instances', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key', 'default'));
    const { result: result2 } = renderHook(() => useLocalStorage('key', 'default'));

    act(() => {
      result1.current[1]('shared value');
    });

    expect(result2.current[0]).toBe('shared value');
  });
});
```

## Advanced Patterns

### Testing Hook with Context

```typescript
import { createContext } from 'react';
import { renderHook } from '@testing-library/react';
import { useContextValue } from '@/hooks/useContextValue';

const TestContext = createContext('initial');

describe('useContextValue', () => {
  it('should return context value', () => {
    const wrapper = ({ children }) => (
      <TestContext.Provider value="test">
        {children}
      </TestContext.Provider>
    );

    const { result } = renderHook(() => useContextValue(TestContext), {
      wrapper,
    });

    expect(result.current).toBe('test');
  });
});
```

### Testing Hook that Uses Other Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFetch } from '@/hooks/useFetch';
import { vi } from 'vitest';

describe('useFetch', () => {
  it('should fetch data on mount', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: 'test' }),
      })
    );

    global.fetch = mockFetch;

    const { result } = renderHook(() => useFetch('/api/data'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ data: 'test' });
    expect(mockFetch).toHaveBeenCalledWith('/api/data');
  });

  it('should refetch when dependencies change', async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: 'new' }),
      })
    );

    global.fetch = mockFetch;

    const { rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: '/api/data1' } }
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/data1');
    });

    rerender({ url: '/api/data2' });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/data2');
    });
  });
});
```

## Key Concepts

### act() — Wrap State Updates

Always wrap state updates with `act()`:

```typescript
// Correct
act(() => {
  result.current.setValue(newValue);
});

// Wrong — will warn about state updates outside act()
result.current.setValue(newValue);
```

### rerender() — Update Props

Update hook props using `rerender()`:

```typescript
const { rerender } = renderHook(
  ({ count }) => useCustom(count),
  { initialProps: { count: 0 } }
);

rerender({ count: 1 }); // Updates hook props
```

### waitFor() — Wait for Async Updates

Wait for async state changes:

```typescript
await waitFor(() => {
  expect(result.current.data).toEqual(expectedData);
});
```

### Cleanup Between Tests

Always cleanup localStorage, timers, etc.:

```typescript
beforeEach(() => {
  localStorage.clear();
  vi.clearAllTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   ```typescript
   // Good — test the hook's interface
   expect(result.current.value).toBe(expectedValue);

   // Bad — testing internal state
   expect(component._state.internalVar).toBe(value);
   ```

2. **Use act() for All Updates**
   ```typescript
   // Correct
   act(() => {
     result.current.handleClick();
   });

   // Wrong
   result.current.handleClick();
   ```

3. **Test with Initial Props**
   ```typescript
   const { result } = renderHook(
     ({ initialValue }) => useCounter(initialValue),
     { initialProps: { initialValue: 10 } }
   );
   ```

4. **Mock External Dependencies**
   ```typescript
   beforeEach(() => {
     global.fetch = vi.fn();
     localStorage.clear();
   });
   ```

5. **Clean Up After Tests**
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();
     localStorage.clear();
     vi.useRealTimers();
   });
   ```

## File Structure

```
client/src/__tests__/hooks/
├── useIsMobile.test.ts
├── useLocalStorage.test.ts
├── useFetch.test.ts
├── useAsync.test.ts
└── useComposition.test.ts
```

## Running Tests

### All Hook Tests

```bash
npm run test:components -- hooks
```

### Single Hook

```bash
npm run test:components -- useIsMobile.test.ts
```

### Watch Mode

```bash
npm run test:components:watch
```

## References

- [React Testing Library Hooks](https://testing-library.com/docs/react-testing-library/api#renderhook)
- [Testing Custom Hooks](https://react-hooks-testing-library.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Common Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
