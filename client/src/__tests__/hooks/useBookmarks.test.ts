import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookmarks } from "../../hooks/useBookmarks";
import { storageBookmarks, BookmarkItem } from "../../lib/storage";

describe("useBookmarks hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should initialize with empty bookmarks", () => {
    const { result } = renderHook(() => useBookmarks());

    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.bookmarkCount).toBe(0);
    expect(result.current.lastSavedTimestamp).toBeNull();
  });

  it("should restore bookmarks from localStorage", () => {
    const item: BookmarkItem = {
      articleId: "article-1",
      title: "Test Article",
      category: "AI",
      dateSaved: 1000000,
      url: "https://example.com/article-1",
    };

    storageBookmarks.addItem(item);

    const { result } = renderHook(() => useBookmarks());

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0]).toEqual(item);
    expect(result.current.bookmarkCount).toBe(1);
    expect(result.current.lastSavedTimestamp).toBe(1000000);
  });

  it("should check if article is bookmarked", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test Article",
        category: "AI",
      });
    });

    expect(result.current.isBookmarked("article-1")).toBe(true);
    expect(result.current.isBookmarked("article-2")).toBe(false);
  });

  it("should add bookmark", () => {
    const { result } = renderHook(() => useBookmarks());

    let success = false;
    act(() => {
      success = result.current.addBookmark({
        articleId: "article-1",
        title: "Test Article",
        category: "AI",
      });
    });

    expect(success).toBe(true);
    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0].articleId).toBe("article-1");
    expect(result.current.bookmarks[0].title).toBe("Test Article");
    expect(result.current.bookmarks[0].category).toBe("AI");
    expect(typeof result.current.bookmarks[0].dateSaved).toBe("number");
  });

  it("should add bookmark with optional URL", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test Article",
        category: "AI",
        url: "https://example.com/article-1",
      });
    });

    expect(result.current.bookmarks[0].url).toBe("https://example.com/article-1");
  });

  it("should set dateSaved timestamp when adding", () => {
    const { result } = renderHook(() => useBookmarks());
    const beforeAdd = Date.now();

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    const afterAdd = Date.now();
    const item = result.current.bookmarks[0];

    expect(item.dateSaved).toBeGreaterThanOrEqual(beforeAdd);
    expect(item.dateSaved).toBeLessThanOrEqual(afterAdd);
  });

  it("should update bookmark if articleId already exists", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "First Title",
        category: "AI",
      });
    });

    expect(result.current.bookmarks).toHaveLength(1);

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Updated Title",
        category: "Science",
      });
    });

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0].title).toBe("Updated Title");
    expect(result.current.bookmarks[0].category).toBe("Science");
  });

  it("should toggle bookmark (add when not bookmarked)", () => {
    const { result } = renderHook(() => useBookmarks());

    let success = false;
    act(() => {
      success = result.current.toggleBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    expect(success).toBe(true);
    expect(result.current.isBookmarked("article-1")).toBe(true);
  });

  it("should toggle bookmark (remove when bookmarked)", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    expect(result.current.isBookmarked("article-1")).toBe(true);

    let success = false;
    act(() => {
      success = result.current.toggleBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    expect(success).toBe(true);
    expect(result.current.isBookmarked("article-1")).toBe(false);
  });

  it("should remove bookmark", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    expect(result.current.bookmarks).toHaveLength(1);

    let success = false;
    act(() => {
      success = result.current.removeBookmark("article-1");
    });

    expect(success).toBe(true);
    expect(result.current.bookmarks).toHaveLength(0);
  });

  it("should clear all bookmarks", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test1",
        category: "AI",
      });
      result.current.addBookmark({
        articleId: "article-2",
        title: "Test2",
        category: "Science",
      });
    });

    expect(result.current.bookmarks).toHaveLength(2);

    let success = false;
    act(() => {
      success = result.current.clearBookmarks();
    });

    expect(success).toBe(true);
    expect(result.current.bookmarks).toHaveLength(0);
  });

  it("should get bookmark by ID", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    const item = result.current.getBookmarkById("article-1");

    expect(item).not.toBeNull();
    expect(item?.articleId).toBe("article-1");
    expect(item?.title).toBe("Test");
  });

  it("should return null for non-existent bookmark", () => {
    const { result } = renderHook(() => useBookmarks());

    const item = result.current.getBookmarkById("non-existent");

    expect(item).toBeNull();
  });

  it("should get bookmarks by category", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "AI Article",
        category: "AI",
      });
      result.current.addBookmark({
        articleId: "article-2",
        title: "Science Article",
        category: "Science",
      });
      result.current.addBookmark({
        articleId: "article-3",
        title: "Another AI",
        category: "AI",
      });
    });

    const aiBookmarks = result.current.getBookmarksByCategory("AI");

    expect(aiBookmarks).toHaveLength(2);
    expect(aiBookmarks.every((b) => b.category === "AI")).toBe(true);
  });

  it("should return empty array for non-existent category", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    const bookmarks = result.current.getBookmarksByCategory("NonExistent");

    expect(bookmarks).toHaveLength(0);
  });

  it("should get bookmarks sorted by date (newest first)", () => {
    act(() => {
      storageBookmarks.addItem({
        articleId: "article-1",
        title: "First",
        category: "AI",
        dateSaved: 1000,
      });
      storageBookmarks.addItem({
        articleId: "article-2",
        title: "Second",
        category: "Science",
        dateSaved: 2000,
      });
      storageBookmarks.addItem({
        articleId: "article-3",
        title: "Third",
        category: "Robotics",
        dateSaved: 1500,
      });
    });

    const { result: resultWithData } = renderHook(() => useBookmarks());
    const sorted = resultWithData.current.getBookmarksSortedByDate(true);

    expect(sorted[0].articleId).toBe("article-2");
    expect(sorted[1].articleId).toBe("article-3");
    expect(sorted[2].articleId).toBe("article-1");
  });

  it("should get bookmarks sorted by date (oldest first)", () => {
    act(() => {
      storageBookmarks.addItem({
        articleId: "article-1",
        title: "First",
        category: "AI",
        dateSaved: 1000,
      });
      storageBookmarks.addItem({
        articleId: "article-2",
        title: "Second",
        category: "Science",
        dateSaved: 2000,
      });
    });

    const { result: resultWithData } = renderHook(() => useBookmarks());
    const sorted = resultWithData.current.getBookmarksSortedByDate(false);

    expect(sorted[0].articleId).toBe("article-1");
    expect(sorted[1].articleId).toBe("article-2");
  });

  it("should persist additions to localStorage", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    const stored = storageBookmarks.get();

    expect(stored.items).toHaveLength(1);
    expect(stored.items[0].articleId).toBe("article-1");
  });

  it("should persist removals to localStorage", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    act(() => {
      result.current.removeBookmark("article-1");
    });

    const stored = storageBookmarks.get();

    expect(stored.items).toHaveLength(0);
  });

  it("should handle multiple additions and removals", () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      for (let i = 1; i <= 5; i++) {
        result.current.addBookmark({
          articleId: `article-${i}`,
          title: `Article ${i}`,
          category: "AI",
        });
      }
    });

    expect(result.current.bookmarks).toHaveLength(5);

    act(() => {
      result.current.removeBookmark("article-2");
      result.current.removeBookmark("article-4");
    });

    expect(result.current.bookmarks).toHaveLength(3);
    const ids = result.current.bookmarks.map((b) => b.articleId);
    expect(ids).not.toContain("article-2");
    expect(ids).not.toContain("article-4");
  });

  it("should maintain state across re-renders", () => {
    const { result, rerender } = renderHook(() => useBookmarks());

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    const firstBookmarks = result.current.bookmarks;

    rerender();

    const secondBookmarks = result.current.bookmarks;

    expect(firstBookmarks).toEqual(secondBookmarks);
    expect(firstBookmarks).toHaveLength(1);
  });

  it("should update bookmark count correctly", () => {
    const { result } = renderHook(() => useBookmarks());

    expect(result.current.bookmarkCount).toBe(0);

    act(() => {
      result.current.addBookmark({
        articleId: "article-1",
        title: "Test",
        category: "AI",
      });
    });

    expect(result.current.bookmarkCount).toBe(1);

    act(() => {
      result.current.addBookmark({
        articleId: "article-2",
        title: "Test2",
        category: "Science",
      });
    });

    expect(result.current.bookmarkCount).toBe(2);

    act(() => {
      result.current.removeBookmark("article-1");
    });

    expect(result.current.bookmarkCount).toBe(1);
  });
});
