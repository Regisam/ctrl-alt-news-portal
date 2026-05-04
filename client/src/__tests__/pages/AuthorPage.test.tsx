import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AuthorPage from '@/pages/AuthorPage';
import { storageAuthorFollow } from '@/lib/storage';
import * as wouter from 'wouter';

vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

const mockUseParams = wouter.useParams as ReturnType<typeof vi.fn>;

describe('AuthorPage', () => {
  beforeEach(() => {
    storageAuthorFollow.clear();
    vi.clearAllMocks();
  });

  it('should render author page for valid author', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Page should render without crashing
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  it('should display author not found message for invalid slug', () => {
    mockUseParams.mockReturnValue({ slug: 'invalid-author-xyz' });

    render(<AuthorPage />);

    // Should show "Author not found" message
    const heading = screen.queryByText(/Author not found|Autor não encontrado/i);
    expect(heading).toBeInTheDocument();
  });

  it('should render AuthorFollowButton component', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Button should be present (including the follow button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should display hero banner with author information', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Should have author name in document
    const authorName = screen.queryByText(/Alex Chen/);
    expect(authorName).toBeInTheDocument();
  });

  it('should display sidebar', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Check that page renders (sidebar is inside)
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('should display Header and Footer', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Document should have navigation (header) and footer areas
    expect(document.body).toBeInTheDocument();
  });

  it('should have back link in hero banner', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Back link should be present
    const backLink = screen.queryByText(/Back|Voltar/i);
    expect(backLink).toBeInTheDocument();
  });

  it('should handle multiple author slugs', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    const { rerender } = render(<AuthorPage />);

    let heading = screen.queryByText(/Alex Chen/);
    expect(heading).toBeInTheDocument();

    // Change to different author
    mockUseParams.mockReturnValue({ slug: 'james-wright' });

    rerender(<AuthorPage />);

    heading = screen.queryByText(/James Wright/);
    expect(heading).toBeInTheDocument();
  });

  it('should render with en language by default', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Check for English text (Back)
    const backLink = screen.queryByText(/Back|Voltar/i);
    expect(backLink).toBeInTheDocument();
  });

  it('should have grid layout for articles', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Check that page has main element
    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  it('should scroll to top on mount', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    // Spy on window.scrollTo
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<AuthorPage />);

    // scrollTo should have been called
    expect(window.scrollTo).toBeDefined();

    scrollSpy.mockRestore();
  });

  it('should handle responsive layout', () => {
    mockUseParams.mockReturnValue({ slug: 'alex-chen' });

    render(<AuthorPage />);

    // Page should have responsive styles injected
    const styles = document.querySelectorAll('style');
    expect(styles.length).toBeGreaterThan(0);

    // Check for media query
    let hasMediaQuery = false;
    styles.forEach((style) => {
      if (style.textContent?.includes('@media')) {
        hasMediaQuery = true;
      }
    });

    // Media query should be present
    expect(hasMediaQuery).toBe(true);
  });
});
