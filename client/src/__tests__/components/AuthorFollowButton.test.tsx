import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthorFollowButton } from '@/components/AuthorFollowButton';
import { storageAuthorFollow } from '@/lib/storage';

describe('AuthorFollowButton', () => {
  beforeEach(() => {
    storageAuthorFollow.clear();
  });

  it('should render follow button when not following', () => {
    render(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('should render following button when already following', () => {
    storageAuthorFollow.follow('Alex Chen');

    render(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('should toggle follow state on click', () => {
    const { rerender } = render(
      <AuthorFollowButton authorName="Alex Chen" variant="full" />
    );

    const button = screen.getByRole('button');

    // Click to follow
    fireEvent.click(button);
    rerender(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    expect(screen.getByText('Following')).toBeInTheDocument();

    // Click to unfollow
    fireEvent.click(button);
    rerender(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('should render compact variant without text', () => {
    render(<AuthorFollowButton authorName="Alex Chen" variant="compact" />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('Follow')).not.toBeInTheDocument();
    expect(screen.queryByText('Following')).not.toBeInTheDocument();
  });

  it('should render full variant with text and icon', () => {
    render(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('should have proper aria-label for accessibility', () => {
    render(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Follow Alex Chen');
  });

  it('should update aria-label when following', () => {
    storageAuthorFollow.follow('Alex Chen');

    render(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Unfollow Alex Chen');
  });

  it('should have title attribute for tooltip', () => {
    render(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Follow Alex Chen');
  });

  it('should apply custom className', () => {
    render(
      <AuthorFollowButton
        authorName="Alex Chen"
        variant="full"
        className="custom-class"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should apply different styles for follow vs following states', () => {
    const { rerender } = render(
      <AuthorFollowButton authorName="Alex Chen" variant="full" />
    );

    let button = screen.getByRole('button');
    const unfollowedClasses = button.className;

    // Follow the author
    fireEvent.click(button);
    rerender(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    button = screen.getByRole('button');
    const followedClasses = button.className;

    // Classes should be different
    expect(unfollowedClasses).not.toBe(followedClasses);
  });

  it('should persist follow state to localStorage on click', () => {
    render(<AuthorFollowButton authorName="Alex Chen" variant="full" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(storageAuthorFollow.isFollowing('Alex Chen')).toBe(true);

    fireEvent.click(button);
    expect(storageAuthorFollow.isFollowing('Alex Chen')).toBe(false);
  });

  it('should handle multiple authors independently', () => {
    const { rerender } = render(
      <>
        <AuthorFollowButton authorName="Alex Chen" variant="full" />
        <AuthorFollowButton authorName="James Wright" variant="full" />
      </>
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // Follow Alex Chen

    rerender(
      <>
        <AuthorFollowButton authorName="Alex Chen" variant="full" />
        <AuthorFollowButton authorName="James Wright" variant="full" />
      </>
    );

    expect(storageAuthorFollow.isFollowing('Alex Chen')).toBe(true);
    expect(storageAuthorFollow.isFollowing('James Wright')).toBe(false);
  });

  it('should default to full variant if not specified', () => {
    render(<AuthorFollowButton authorName="Alex Chen" />);

    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  it('should handle author name with spaces', () => {
    render(
      <AuthorFollowButton
        authorName="Dr. Sarah Kim"
        variant="full"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Follow Dr. Sarah Kim');

    fireEvent.click(button);
    expect(storageAuthorFollow.isFollowing('Dr. Sarah Kim')).toBe(true);
  });
});
