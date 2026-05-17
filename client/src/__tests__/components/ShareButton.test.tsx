import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from '@/components/ShareButton';
import { toast } from 'sonner';
import type { Article } from '@/lib/data';

vi.mock('sonner');

const mockArticle: Article = {
  id: 1,
  title: { en: "Test Article Title", pt: "Título do Artigo de Teste" },
  excerpt: { en: "Test excerpt", pt: "Trecho de teste" },
  category: 'AI',
  author: "John Doe",
  date: "Feb 24, 2026",
  readTime: "5 min",
  views: "1.2K",
  image: "https://example.com/image.jpg",
};

describe("ShareButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as unknown as { gtag?: unknown }).gtag;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should render the button with correct label", () => {
    render(<ShareButton article={mockArticle} platform="twitter" />);
    const button = screen.getByRole('button', { name: /Share on X \/ Twitter/i });
    expect(button).toBeInTheDocument();
  });

  it("should render with correct aria-label", () => {
    render(<ShareButton article={mockArticle} platform="facebook" />);
    const button = screen.getByRole('button', { name: /Share on Facebook/i });
    expect(button).toHaveAttribute('aria-label', 'Share on Facebook');
  });

  it("should open share URL in new window for social platforms", () => {
    window.open = vi.fn() as unknown as typeof window.open;

    render(<ShareButton article={mockArticle} platform="twitter" />);
    const button = screen.getByRole('button', { name: /Share on X \/ Twitter/i });

    fireEvent.click(button);

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it("should handle copy to clipboard for copy platform", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<ShareButton article={mockArticle} platform="copy" />);
    const button = screen.getByRole('button', { name: /Copy Link/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!');
    });
  });

  it("should call onShare callback when provided", () => {
    window.open = vi.fn() as unknown as typeof window.open;
    const onShareMock = vi.fn();

    render(
      <ShareButton
        article={mockArticle}
        platform="linkedin"
        onShare={onShareMock}
      />
    );
    const button = screen.getByRole('button', { name: /Share on LinkedIn/i });

    fireEvent.click(button);

    expect(onShareMock).toHaveBeenCalledWith('linkedin');
  });

  it("should support keyboard navigation with Enter key", () => {
    window.open = vi.fn() as unknown as typeof window.open;
    const onShareMock = vi.fn();

    render(
      <ShareButton
        article={mockArticle}
        platform="whatsapp"
        onShare={onShareMock}
      />
    );
    const button = screen.getByRole('button', { name: /Share on WhatsApp/i });

    fireEvent.keyDown(button, { key: 'Enter' });

    expect(window.open).toHaveBeenCalled();
    expect(onShareMock).toHaveBeenCalledWith('whatsapp');
  });

  it("should support keyboard navigation with Space key", () => {
    window.open = vi.fn();
    const onShareMock = vi.fn();

    render(
      <ShareButton
        article={mockArticle}
        platform="email"
        onShare={onShareMock}
      />
    );
    const button = screen.getByRole('button', { name: /Share on Email/i });

    fireEvent.keyDown(button, { key: ' ' });

    expect(window.open).toHaveBeenCalled();
    expect(onShareMock).toHaveBeenCalledWith('email');
  });

  it("should apply custom className", () => {
    render(
      <ShareButton
        article={mockArticle}
        platform="twitter"
        className="custom-class"
      />
    );
    const button = screen.getByRole('button', { name: /Share on X \/ Twitter/i });

    expect(button).toHaveClass('custom-class');
  });

  it("should render all platform types correctly", () => {
    const platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp', 'email', 'copy'] as const;

    platforms.forEach((platform) => {
      const { unmount } = render(
        <ShareButton article={mockArticle} platform={platform} />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label');

      unmount();
    });
  });

  it("should handle copy to clipboard error gracefully", async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Copy failed"));
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<ShareButton article={mockArticle} platform="copy" />);
    const button = screen.getByRole('button', { name: /Copy Link/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to copy link');
    });
  });

  it("should use article URL from window.location when available", () => {
    const mockOpen = vi.fn() as unknown as typeof window.open;
    window.open = mockOpen;

    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/article/1' },
      writable: true,
    });

    render(<ShareButton article={mockArticle} platform="twitter" />);
    const button = screen.getByRole('button', { name: /Share on X \/ Twitter/i });

    fireEvent.click(button);

    const mockOpenFn = mockOpen as unknown as ReturnType<typeof vi.fn>;
    const callArgs = mockOpenFn.mock.calls[0][0] as string;
    expect(callArgs).toContain('https%3A%2F%2Fexample.com%2Farticle%2F1');
  });
});
