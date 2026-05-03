import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkButton } from "../../components/BookmarkButton";
import { useBookmarks } from "../../hooks/useBookmarks";

vi.mock("../../hooks/useBookmarks");

describe("BookmarkButton component", () => {
  const mockUseBookmarks = useBookmarks as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should render bookmark button", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("should have correct aria-label when not bookmarked", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      'Adicionar "Test Article" aos favoritos'
    );
  });

  it("should have correct aria-label when bookmarked", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(true),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: Date.now(),
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "aria-label",
      'Remover "Test Article" dos favoritos'
    );
  });

  it("should have aria-pressed attribute", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("should toggle bookmark on click", async () => {
    const mockToggle = vi.fn().mockReturnValue(true);
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: mockToggle,
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(mockToggle).toHaveBeenCalledWith({
      articleId: "article-1",
      title: "Test Article",
      category: "AI",
      url: undefined,
    });
  });

  it("should show feedback message on successful toggle", async () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    await userEvent.click(button);

    await waitFor(() => {
      const feedback = screen.getByRole("status");
      expect(feedback).toBeInTheDocument();
      expect(feedback).toHaveTextContent("Removido dos favoritos");
    });
  });

  it("should show label when showLabel prop is true", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
        showLabel={true}
      />
    );

    expect(screen.getByText("Favoritar")).toBeInTheDocument();
  });

  it("should show 'Favorito' label when bookmarked", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(true),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: Date.now(),
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
        showLabel={true}
      />
    );

    expect(screen.getByText("Favorito")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    const { container } = render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should pass URL to toggleBookmark when provided", async () => {
    const mockToggle = vi.fn().mockReturnValue(true);
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: mockToggle,
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
        url="https://example.com/article-1"
      />
    );

    const button = screen.getByRole("button");
    await userEvent.click(button);

    expect(mockToggle).toHaveBeenCalledWith({
      articleId: "article-1",
      title: "Test Article",
      category: "AI",
      url: "https://example.com/article-1",
    });
  });

  it("should have correct styling when bookmarked", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(true),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: Date.now(),
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-amber-500");
  });

  it("should have correct styling when not bookmarked", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("text-gray-400");
  });

  it("should have title attribute for accessibility", () => {
    mockUseBookmarks.mockReturnValue({
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn().mockReturnValue(true),
      bookmarks: [],
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(
      <BookmarkButton
        articleId="article-1"
        title="Test Article"
        category="AI"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title");
  });
});
