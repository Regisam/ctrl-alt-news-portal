import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactionButton } from '@/components/ReactionButton';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ReactionButton component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render with correct label and icon', () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={5}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Like')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render with clap type', () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="clap"
        count={3}
      />
    );

    expect(screen.getByText('Clap')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should not render count when count is 0', () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={0}
      />
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should not render count when count is undefined', () => {
    const { container } = render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
      />
    );

    const countBadge = container.querySelector('.count');
    expect(countBadge).not.toBeInTheDocument();
  });

  it('should have correct aria-label', () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={5}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Like reaction (5)');
  });

  it('should have aria-pressed set to false when not reacted', () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('should toggle reaction on click', async () => {
    const onReactionChange = vi.fn();
    const { rerender } = render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={0}
        onReactionChange={onReactionChange}
      />
    );

    const button = screen.getByRole('button');

    // Click to add reaction
    await userEvent.click(button);

    await waitFor(() => {
      expect(onReactionChange).toHaveBeenCalledWith('like', true);
    });

    // Re-render with updated count
    rerender(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={1}
        onReactionChange={onReactionChange}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should disable button during animation', async () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={0}
      />
    );

    const button = screen.getByRole('button') as HTMLButtonElement;

    await userEvent.click(button);

    // Button should be disabled immediately after click
    expect(button).toBeDisabled();

    // Should re-enable after animation (600ms)
    await waitFor(
      () => {
        expect(button).not.toBeDisabled();
      },
      { timeout: 700 }
    );
  });

  it('should update count when prop changes', async () => {
    const { rerender } = render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={5}
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();

    await act(async () => {
      rerender(
        <ReactionButton
          articleId="article-1"
          userId="user-1"
          type="like"
          count={10}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('should call onReactionChange with correct parameters', async () => {
    const onReactionChange = vi.fn();
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="clap"
        count={2}
        onReactionChange={onReactionChange}
      />
    );

    const button = screen.getByRole('button');
    await userEvent.click(button);

    await waitFor(() => {
      expect(onReactionChange).toHaveBeenCalledWith('clap', true);
    });
  });

  it('should have correct styling with CSS variables', () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={5}
      />
    );

    const button = screen.getByRole('button');
    const styleAttr = (button as HTMLButtonElement).getAttribute('style');

    expect(styleAttr).toContain('--bg-color');
    expect(styleAttr).toContain('--text-color');
    expect(styleAttr).toContain('--icon-color: #ef4444');
  });

  it('should apply animation class during animation state', async () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={0}
      />
    );

    const button = screen.getByRole('button');
    const iconWrapper = button.querySelector('div');

    await userEvent.click(button);

    // Icon wrapper should have a class that includes animate
    expect(iconWrapper?.className).toMatch(/animate/);

    // Should be removed after animation completes
    await waitFor(
      () => {
        expect(iconWrapper?.className).not.toMatch(/animate/);
      },
      { timeout: 700 }
    );
  });

  it('should handle rapid clicks gracefully', async () => {
    const onReactionChange = vi.fn();
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={0}
        onReactionChange={onReactionChange}
      />
    );

    const button = screen.getByRole('button') as HTMLButtonElement;

    // First click
    await userEvent.click(button);
    expect(button).toBeDisabled();

    // Second click while disabled should not register
    await userEvent.click(button);

    // Wait for animation to complete
    await waitFor(
      () => {
        expect(button).not.toBeDisabled();
      },
      { timeout: 700 }
    );

    // Only one call should have been made
    expect(onReactionChange).toHaveBeenCalledTimes(1);
  });

  it('should have correct clap icon color styling', () => {
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="clap"
        count={3}
      />
    );

    const button = screen.getByRole('button');
    const styleAttr = (button as HTMLButtonElement).getAttribute('style');

    expect(styleAttr).toContain('--icon-color: #f59e0b');
  });

  it('should be keyboard accessible', async () => {
    const onReactionChange = vi.fn();
    render(
      <ReactionButton
        articleId="article-1"
        userId="user-1"
        type="like"
        count={0}
        onReactionChange={onReactionChange}
      />
    );

    const button = screen.getByRole('button');

    // Tab to button
    button.focus();
    expect(button).toHaveFocus();

    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    await userEvent.click(button);

    await waitFor(() => {
      expect(onReactionChange).toHaveBeenCalled();
    });
  });
});
