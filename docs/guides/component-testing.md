# Component Testing Guide — React Testing Library Patterns

Comprehensive guide to testing React components with React Testing Library and Vitest.

## Quick Start

```bash
npm run test:components          # Run all component tests
npm run test:components:watch   # Watch mode for development
```

## Setup & Test Utilities

### Test Utilities

The project includes `client/src/__tests__/test-utils.tsx` which wraps React Testing Library with custom providers:

```typescript
// client/src/__tests__/test-utils.tsx
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { userEvent };
```

### Basic Test Template

```typescript
import { render, screen, userEvent } from '../test-utils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Updated text')).toBeInTheDocument();
  });
});
```

## Common Test Patterns

### Testing Component Rendering

```typescript
describe('SearchBar', () => {
  it('should render search button when closed', () => {
    render(<SearchBar lang="en" />);
    const button = screen.getByRole('button', { name: /open search/i });
    expect(button).toBeInTheDocument();
  });

  it('should render input field when opened', async () => {
    const user = userEvent.setup();
    render(<SearchBar lang="en" />);

    const openBtn = screen.getByRole('button', { name: /open search/i });
    await user.click(openBtn);

    const input = screen.getByRole('searchbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
  });
});
```

### Testing Props

```typescript
describe('ArticleCard', () => {
  it('should display article title from props', () => {
    const article = {
      id: '1',
      title: 'Test Article',
      author: 'John Doe',
      category: 'AI',
    };

    render(<ArticleCard article={article} />);
    expect(screen.getByText('Test Article')).toBeInTheDocument();
  });

  it('should accept optional props', () => {
    const article = { id: '1', title: 'Article' };
    const { container } = render(
      <ArticleCard article={article} featured={true} />
    );

    expect(container.querySelector('.featured')).toBeInTheDocument();
  });
});
```

### Testing Conditional Rendering

```typescript
describe('Conditional Rendering', () => {
  it('should show loading state initially', () => {
    render(<DataComponent isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show content when loaded', () => {
    render(<DataComponent isLoading={false} data="Content" />);
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should show error message on error', () => {
    render(<DataComponent error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
describe('Form Submission', () => {
  it('should submit form with valid data', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();

    render(<SearchForm onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText('Search...');
    const button = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'React');
    await user.click(button);

    expect(handleSubmit).toHaveBeenCalledWith('React');
  });

  it('should clear input after submission', async () => {
    const user = userEvent.setup();
    render(<SearchForm onSubmit={() => {}} />);

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'Test');
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(input).toHaveValue('');
  });
});
```

### Testing Events and Callbacks

```typescript
describe('Click Events', () => {
  it('should call onClick handler', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: /click me/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle keyboard events', async () => {
    const handleKeyDown = vi.fn();
    const user = userEvent.setup();

    render(<input onKeyDown={handleKeyDown} />);
    const input = screen.getByRole('textbox');

    await user.keyboard('{Enter}');

    expect(handleKeyDown).toHaveBeenCalled();
  });
});
```

### Testing Accessibility

```typescript
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    render(<SearchBar />);
    const input = screen.getByRole('searchbox');

    expect(input).toHaveAttribute('aria-label');
  });

  it('should have proper button roles', () => {
    render(<Navigation />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Menu />);

    const button = screen.getByRole('button', { name: /menu/i });
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem')).toBeInTheDocument();
  });
});
```

### Testing Async Operations

```typescript
import { waitFor } from '../test-utils';

describe('Async Component', () => {
  it('should load data on mount', async () => {
    render(<DataComponent />);

    await waitFor(() => {
      expect(screen.getByText('Data loaded')).toBeInTheDocument();
    });
  });

  it('should handle async callback', async () => {
    const handleAsync = vi.fn().mockResolvedValue('done');
    const user = userEvent.setup();

    render(<AsyncButton onClick={handleAsync} />);
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(handleAsync).toHaveBeenCalled();
    });
  });
});
```

## Query Methods Priority

Use queries in this order of preference:

1. **getByRole** — Most semantic, tests accessibility
   ```typescript
   screen.getByRole('button', { name: /submit/i })
   ```

2. **getByLabelText** — For form inputs
   ```typescript
   screen.getByLabelText('Email')
   ```

3. **getByPlaceholderText** — For inputs without labels
   ```typescript
   screen.getByPlaceholderText('Search...')
   ```

4. **getByText** — For text content
   ```typescript
   screen.getByText('Welcome')
   ```

5. **getByTestId** — Only when necessary
   ```typescript
   screen.getByTestId('custom-element')
   ```

## Assertions

### Component Presence

```typescript
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.queryByText('Not here')).not.toBeInTheDocument();
```

### Element Properties

```typescript
expect(input).toHaveValue('typed text');
expect(button).toBeEnabled();
expect(checkbox).toBeChecked();
expect(input).toHaveFocus();
expect(element).toHaveClass('active');
expect(element).toHaveAttribute('aria-label', 'Close');
```

### User Input Results

```typescript
expect(screen.getByText('Count: 1')).toBeInTheDocument();
expect(handleClick).toHaveBeenCalledTimes(1);
expect(handleChange).toHaveBeenCalledWith('new value');
```

## Best Practices

1. **Test User Behavior, Not Implementation**
   ```typescript
   // Good — tests what user sees
   await user.click(screen.getByRole('button', { name: /delete/i }));
   expect(screen.queryByText('Item')).not.toBeInTheDocument();

   // Bad — tests implementation detail
   expect(component.state.itemDeleted).toBe(true);
   ```

2. **Use Semantic Queries**
   ```typescript
   // Good
   screen.getByRole('button', { name: /submit/i })

   // Bad
   screen.getByTestId('btn-submit')
   ```

3. **Avoid Implementation Details**
   ```typescript
   // Good — test behavior
   it('should toggle menu', async () => {
     const user = userEvent.setup();
     await user.click(screen.getByRole('button', { name: /menu/i }));
     expect(screen.getByRole('menuitem')).toBeInTheDocument();
   });

   // Bad — testing internal state
   const { result } = renderHook(() => useMenuState());
   expect(result.current.isOpen).toBe(true);
   ```

4. **Async/Await Properly**
   ```typescript
   // Good
   const user = userEvent.setup();
   await user.click(button);

   // Bad — missing await
   user.click(button); // Race condition!
   ```

5. **Avoid Snapshots**
   - Don't use snapshot testing for components
   - Use specific assertions instead
   - Snapshots are brittle and hide actual failures

## File Structure

```
client/src/__tests__/
├── components/          # Component tests
│   ├── SearchBar.test.tsx
│   ├── ArticleCard.test.tsx
│   └── Form.test.tsx
├── hooks/               # Hook tests
│   ├── useIsMobile.test.ts
│   └── useFetch.test.ts
├── test-utils.tsx       # Custom render with providers
└── setup.ts            # Global test setup
```

## Running Tests

### All Component Tests

```bash
npm run test:components
```

### Watch Mode

```bash
npm run test:components:watch
```

### Single File

```bash
npm run test:components -- SearchBar.test.tsx
```

### With Coverage

```bash
npm run test:coverage -- client/src/__tests__/components
```

## Troubleshooting

### "Element not found" errors

Check if element is rendered:
```typescript
// Debug output
screen.debug();

// Or get all matching elements
screen.getAllByText(/partial match/i);
```

### Async/Await Issues

Always use `waitFor` for async state changes:
```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

### Mock Functions Not Calling

Ensure handlers are passed correctly:
```typescript
// Good
const handleClick = vi.fn();
render(<Button onClick={handleClick} />);

// Bad — handler never receives click
render(<Button />);
```

## References

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
