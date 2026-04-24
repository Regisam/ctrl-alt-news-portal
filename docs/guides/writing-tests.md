# Writing Tests Guide

A practical guide to writing effective unit and component tests.

## Test Structure

Use the **Arrange-Act-Assert** pattern:

```typescript
it('should calculate discount correctly', () => {
  // Arrange: Set up test data
  const price = 100;
  const discountPercent = 10;

  // Act: Execute the function
  const result = calculateDiscount(price, discountPercent);

  // Assert: Verify the result
  expect(result).toBe(90);
});
```

## Server-Side Tests (Jest)

### Basic Unit Test

```typescript
import { describe, it, expect } from 'vitest';
import { add, multiply } from './math';

describe('Math utilities', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should multiply two numbers', () => {
    expect(multiply(4, 5)).toBe(20);
  });
});
```

### Testing with Setup/Teardown

```typescript
describe('Database operations', () => {
  let db;

  beforeEach(() => {
    // Setup: Initialize database
    db = createMockDatabase();
  });

  afterEach(() => {
    // Cleanup: Close database
    db.close();
  });

  it('should insert and retrieve data', () => {
    db.insert({ id: 1, name: 'Test' });
    const result = db.get(1);
    expect(result.name).toBe('Test');
  });
});
```

### Testing Error Cases

```typescript
it('should throw error for invalid input', () => {
  expect(() => {
    processData(null);
  }).toThrow('Data cannot be null');
});

// For promises:
it('should reject with error', async () => {
  await expect(failingPromise()).rejects.toThrow('Error');
});
```

## Client-Side Tests (Vitest + React Testing Library)

### Component Rendering

```typescript
import { render, screen } from '@/__tests__/test-utils';
import Card from './Card';

it('should render card with title', () => {
  render(<Card title="Test Card">Content</Card>);

  expect(screen.getByText('Test Card')).toBeInTheDocument();
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

### User Interactions

```typescript
import { userEvent } from '@/__tests__/test-utils';

it('should submit form on button click', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  render(<Form onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText('Name'), 'John');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(handleSubmit).toHaveBeenCalledWith({ name: 'John' });
});
```

### Testing Lists and Conditional Rendering

```typescript
it('should render list of items', () => {
  const items = [
    { id: 1, title: 'Item 1' },
    { id: 2, title: 'Item 2' },
  ];

  render(<ItemList items={items} />);

  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 2')).toBeInTheDocument();
});

it('should show empty message when no items', () => {
  render(<ItemList items={[]} />);
  expect(screen.getByText('No items found')).toBeInTheDocument();
});
```

### Testing with Data Factories

```typescript
import { factories } from '@/__tests__/test-utils';

it('should render article card', () => {
  const article = factories.createArticle({
    title: 'Custom Title',
  });

  render(<ArticleCard article={article} />);

  expect(screen.getByText('Custom Title')).toBeInTheDocument();
});
```

## Common Assertions

```typescript
// Existence
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeEnabled();

// Text/Value
expect(element).toHaveTextContent('Text');
expect(input).toHaveValue('Value');

// Attributes
expect(button).toHaveAttribute('disabled');
expect(link).toHaveAttribute('href', '/page');

// Classes
expect(element).toHaveClass('active');

// Calls
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(3);
```

## Testing Async Code

### Using `waitFor()`

```typescript
it('should load data', async () => {
  render(<UserProfile userId={1} />);

  const name = await screen.findByText('John Doe');
  expect(name).toBeInTheDocument();
});
```

### Using async/await

```typescript
it('should fetch and display user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('John');
});
```

## Mocking Patterns

See `docs/guides/mocking.md` for detailed mocking examples.

## Performance Tips

- **Split tests**: One assertion per test when possible
- **Reuse setup**: Use `beforeEach` for common setup
- **Test behavior**: Not implementation details
- **Keep tests fast**: Mock external dependencies

## Naming Convention

```typescript
// ✅ Good: Describes behavior
describe('UserProfile', () => {
  it('should display user name when data loads');
  it('should show loading spinner initially');
  it('should handle error gracefully');
});

// ❌ Avoid: Too generic
describe('UserProfile', () => {
  it('works');
  it('renders');
});
```

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](../testing-best-practices.md)
