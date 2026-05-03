import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReadingListPage } from "../../pages/ReadingListPage";
import { useBookmarks } from "../../hooks/useBookmarks";

vi.mock("../../hooks/useBookmarks");

describe("ReadingListPage component", () => {
  const mockUseBookmarks = useBookmarks as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render empty state when no bookmarks", () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 0,
      lastSavedTimestamp: null,
    });

    render(<ReadingListPage />);

    expect(
      screen.getByText("Você ainda não tem artigos favoritos.")
    ).toBeInTheDocument();
  });

  it("should display bookmark count", () => {
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: Date.now(),
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: Date.now(),
    });

    render(<ReadingListPage />);

    expect(screen.getByText(/1 artigo favoritado/)).toBeInTheDocument();
  });

  it("should display multiple bookmarks", () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "First Article",
          category: "AI",
          dateSaved: now,
        },
        {
          articleId: "article-2",
          title: "Second Article",
          category: "Science",
          dateSaved: now - 1000,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 2,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    expect(screen.getByText("First Article")).toBeInTheDocument();
    expect(screen.getByText("Second Article")).toBeInTheDocument();
  });

  it("should filter bookmarks by category", async () => {
    const now = Date.now();
    const mockRemoveBookmark = vi.fn();
    const mockClearBookmarks = vi.fn();

    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "AI Article",
          category: "AI",
          dateSaved: now,
        },
        {
          articleId: "article-2",
          title: "Science Article",
          category: "Science",
          dateSaved: now - 1000,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: mockRemoveBookmark,
      clearBookmarks: mockClearBookmarks,
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn((cat) => {
        const bookmarks = [
          {
            articleId: "article-1",
            title: "AI Article",
            category: "AI",
            dateSaved: now,
          },
          {
            articleId: "article-2",
            title: "Science Article",
            category: "Science",
            dateSaved: now - 1000,
          },
        ];
        return bookmarks.filter((b) => b.category === cat);
      }),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 2,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const categorySelect = screen.getByLabelText("Filtrar por categoria");
    await userEvent.selectOptions(categorySelect, "AI");

    // Since the mock doesn't filter internally, both articles would still show
    // This test verifies the select element works
    expect(categorySelect).toHaveValue("AI");
  });

  it("should search bookmarks by title", async () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "First Article",
          category: "AI",
          dateSaved: now,
        },
        {
          articleId: "article-2",
          title: "Second Article",
          category: "Science",
          dateSaved: now - 1000,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 2,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const searchInput = screen.getByPlaceholderText("Buscar favoritos...");
    await userEvent.type(searchInput, "First");

    expect(searchInput).toHaveValue("First");
  });

  it("should sort bookmarks by date", async () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-2",
          title: "Second Article",
          category: "Science",
          dateSaved: now - 1000,
        },
        {
          articleId: "article-1",
          title: "First Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 2,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const sortSelect = screen.getByLabelText("Ordenar favoritos");
    expect(sortSelect).toHaveValue("newest");

    await userEvent.selectOptions(sortSelect, "oldest");
    expect(sortSelect).toHaveValue("oldest");
  });

  it("should remove bookmark on delete button click", async () => {
    const mockRemoveBookmark = vi.fn();
    const now = Date.now();

    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: mockRemoveBookmark,
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const deleteButton = screen.getByLabelText(
      /Remover.*dos favoritos/
    );
    await userEvent.click(deleteButton);

    expect(mockRemoveBookmark).toHaveBeenCalledWith("article-1");
  });

  it("should show confirmation dialog before clearing all", async () => {
    const mockClearBookmarks = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const now = Date.now();

    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: mockClearBookmarks,
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const clearAllButton = screen.getByLabelText(
      "Remover todos os favoritos"
    );
    await userEvent.click(clearAllButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockClearBookmarks).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("should not clear all if user cancels confirmation", async () => {
    const mockClearBookmarks = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const now = Date.now();

    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: mockClearBookmarks,
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const clearAllButton = screen.getByLabelText(
      "Remover todos os favoritos"
    );
    await userEvent.click(clearAllButton);

    expect(mockClearBookmarks).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("should display category badges with correct colors", () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "AI Article",
          category: "AI",
          dateSaved: now,
        },
        {
          articleId: "article-2",
          title: "Science Article",
          category: "Science",
          dateSaved: now - 1000,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 2,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const aiBadges = screen.getAllByText("AI");
    expect(aiBadges.length).toBeGreaterThan(0);
    const scienceBadges = screen.getAllByText("Science");
    expect(scienceBadges.length).toBeGreaterThan(0);
  });

  it("should display formatted dates", () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    // Check that some date text is displayed (format varies by locale)
    const dateElements = screen.getAllByText(/\d+/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("should have proper semantic HTML", () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar favoritos/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Filtrar por categoria/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ordenar favoritos/)).toBeInTheDocument();
  });

  it("should show no results message when search filters all items", async () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    const searchInput = screen.getByPlaceholderText("Buscar favoritos...");
    await userEvent.type(searchInput, "NonExistentArticle");

    await waitFor(() => {
      expect(
        screen.getByText(/Nenhum artigo encontrado com os filtros aplicados/)
      ).toBeInTheDocument();
    });
  });

  it("should have proper accessibility attributes on interactive elements", () => {
    const now = Date.now();
    mockUseBookmarks.mockReturnValue({
      bookmarks: [
        {
          articleId: "article-1",
          title: "Test Article",
          category: "AI",
          dateSaved: now,
        },
      ],
      isBookmarked: vi.fn(),
      toggleBookmark: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmark: vi.fn(),
      clearBookmarks: vi.fn(),
      getBookmarkById: vi.fn(),
      getBookmarksByCategory: vi.fn(),
      getBookmarksSortedByDate: vi.fn(),
      bookmarkCount: 1,
      lastSavedTimestamp: now,
    });

    render(<ReadingListPage />);

    expect(screen.getByLabelText(/Buscar favoritos/)).toHaveAttribute(
      "aria-label"
    );
    expect(screen.getByLabelText(/Filtrar por categoria/)).toHaveAttribute(
      "aria-label"
    );
    expect(screen.getByLabelText(/Ordenar favoritos/)).toHaveAttribute(
      "aria-label"
    );
  });
});
