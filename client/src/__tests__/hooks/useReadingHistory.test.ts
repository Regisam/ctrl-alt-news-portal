import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReadingHistory } from "../../hooks/useReadingHistory";
import { storageHistory, ReadingHistoryItem } from "../../lib/storage";

describe("useReadingHistory hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should initialize with empty history", () => {
    const { result } = renderHook(() => useReadingHistory());

    expect(result.current.history).toEqual([]);
  });

  it("should restore history from localStorage", () => {
    const item: ReadingHistoryItem = {
      articleId: "article-1",
      title: "Test Article",
      category: "AI",
      timestamp: 1000000,
      timeSpentMs: 5000,
    };

    storageHistory.addItem(item);

    const { result } = renderHook(() => useReadingHistory());

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]).toEqual(item);
  });

  it("should add item to history", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test Article",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].articleId).toBe("article-1");
    expect(result.current.history[0].title).toBe("Test Article");
    expect(result.current.history[0].category).toBe("AI");
    expect(result.current.history[0].timeSpentMs).toBe(5000);
    expect(typeof result.current.history[0].timestamp).toBe("number");
  });

  it("should set timestamp when adding item", () => {
    const { result } = renderHook(() => useReadingHistory());
    const beforeAdd = Date.now();

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    const afterAdd = Date.now();
    const item = result.current.history[0];

    expect(item.timestamp).toBeGreaterThanOrEqual(beforeAdd);
    expect(item.timestamp).toBeLessThanOrEqual(afterAdd);
  });

  it("should add items in FIFO order (newest first)", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "First",
        category: "AI",
        timeSpentMs: 5000,
      });
      result.current.addToHistory({
        articleId: "article-2",
        title: "Second",
        category: "Science",
        timeSpentMs: 3000,
      });
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].articleId).toBe("article-2");
    expect(result.current.history[1].articleId).toBe("article-1");
  });

  it("should remove item from history", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.removeFromHistory("article-1");
    });

    expect(result.current.history).toHaveLength(0);
  });

  it("should clear all history", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
      result.current.addToHistory({
        articleId: "article-2",
        title: "Test2",
        category: "Science",
        timeSpentMs: 3000,
      });
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
  });

  it("should get item by ID", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    const item = result.current.getItemById("article-1");

    expect(item).not.toBeNull();
    expect(item?.articleId).toBe("article-1");
    expect(item?.title).toBe("Test");
  });

  it("should return null for non-existent item", () => {
    const { result } = renderHook(() => useReadingHistory());

    const item = result.current.getItemById("non-existent");

    expect(item).toBeNull();
  });

  it("should persist additions to localStorage", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    const stored = storageHistory.get();
    expect(stored.items).toHaveLength(1);
    expect(stored.items[0].articleId).toBe("article-1");
  });

  it("should persist removals to localStorage", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    act(() => {
      result.current.removeFromHistory("article-1");
    });

    const stored = storageHistory.get();
    expect(stored.items).toHaveLength(0);
  });

  it("should handle multiple additions and removals", () => {
    const { result } = renderHook(() => useReadingHistory());

    act(() => {
      for (let i = 1; i <= 5; i++) {
        result.current.addToHistory({
          articleId: `article-${i}`,
          title: `Article ${i}`,
          category: "AI",
          timeSpentMs: 5000,
        });
      }
    });

    expect(result.current.history).toHaveLength(5);

    act(() => {
      result.current.removeFromHistory("article-2");
      result.current.removeFromHistory("article-4");
    });

    expect(result.current.history).toHaveLength(3);
    const storedIds = result.current.history.map((item) => item.articleId);
    expect(storedIds).not.toContain("article-2");
    expect(storedIds).not.toContain("article-4");
  });

  it("should update state on successful operations", () => {
    const { result } = renderHook(() => useReadingHistory());

    let addSuccess = false;
    act(() => {
      addSuccess = result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    expect(addSuccess).toBe(true);
    expect(result.current.history).toHaveLength(1);
  });

  it("should maintain state across re-renders", () => {
    const { result, rerender } = renderHook(() => useReadingHistory());

    act(() => {
      result.current.addToHistory({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timeSpentMs: 5000,
      });
    });

    const firstHistory = result.current.history;

    rerender();

    const secondHistory = result.current.history;

    expect(firstHistory).toEqual(secondHistory);
    expect(firstHistory).toHaveLength(1);
  });
});
