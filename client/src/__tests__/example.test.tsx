import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from './test-utils';
import React, { useState } from 'react';

/**
 * Example: Testing React components with React Testing Library
 *
 * This demonstrates:
 * - Rendering components
 * - Finding elements
 * - User interactions
 * - Testing hooks
 */

// Example component 1: Simple button component
function SimpleButton({
  onClick,
  label = 'Click me',
}: {
  onClick?: () => void;
  label?: string;
}) {
  return <button onClick={onClick}>{label}</button>;
}

describe('SimpleButton', () => {
  it('renders button with label', () => {
    render(<SimpleButton label="Test Button" />);

    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SimpleButton onClick={handleClick} label="Click" />);

    const button = screen.getByRole('button', { name: /click/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// Example component 2: Component with hooks
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

describe('Counter', () => {
  it('renders initial count as 0', () => {
    render(<Counter />);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  it('increments count when increment button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });
    await user.click(incrementButton);

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('decrements count when decrement button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });
    const decrementButton = screen.getByRole('button', { name: /decrement/i });

    await user.click(incrementButton);
    await user.click(incrementButton);
    await user.click(decrementButton);

    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });

  it('resets count when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const incrementButton = screen.getByRole('button', { name: /increment/i });
    const resetButton = screen.getByRole('button', { name: /reset/i });

    await user.click(incrementButton);
    await user.click(incrementButton);
    await user.click(resetButton);

    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});

// Example component 3: Form component
function SearchForm({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search input"
      />
      <button type="submit">Search</button>
    </form>
  );
}

describe('SearchForm', () => {
  it('renders search input and button', () => {
    const handleSearch = vi.fn();
    render(<SearchForm onSearch={handleSearch} />);

    expect(screen.getByLabelText(/search input/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('calls onSearch with query when form is submitted', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();

    render(<SearchForm onSearch={handleSearch} />);

    const input = screen.getByLabelText(/search input/i);
    const button = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'react');
    await user.click(button);

    expect(handleSearch).toHaveBeenCalledWith('react');
  });

  it('clears input after form submission', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();

    render(<SearchForm onSearch={handleSearch} />);

    const input = screen.getByLabelText(/search input/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /search/i });

    await user.type(input, 'test');
    await user.click(button);

    expect(input.value).toBe('');
  });

  it('does not call onSearch with empty query', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();

    render(<SearchForm onSearch={handleSearch} />);

    const button = screen.getByRole('button', { name: /search/i });
    await user.click(button);

    expect(handleSearch).not.toHaveBeenCalled();
  });
});
