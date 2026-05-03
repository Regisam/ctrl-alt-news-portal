import { useState, useCallback } from "react";
import { storageBookmarks, BookmarkItem } from "../lib/storage";

export interface UseBookmarksReturn {
  bookmarks: BookmarkItem[];
  isBookmarked: (articleId: string) => boolean;
  toggleBookmark: (item: Omit<BookmarkItem, "dateSaved">) => boolean;
  addBookmark: (item: Omit<BookmarkItem, "dateSaved">) => boolean;
  removeBookmark: (articleId: string) => boolean;
  clearBookmarks: () => boolean;
  getBookmarkById: (articleId: string) => BookmarkItem | null;
  getBookmarksByCategory: (category: string) => BookmarkItem[];
  getBookmarksSortedByDate: (descending?: boolean) => BookmarkItem[];
  bookmarkCount: number;
  lastSavedTimestamp: number | null;
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    const stored = storageBookmarks.get();
    return stored.items;
  });

  const addBookmark = useCallback(
    (item: Omit<BookmarkItem, "dateSaved">): boolean => {
      const bookmarkItem: BookmarkItem = {
        ...item,
        dateSaved: Date.now(),
      };
      const success = storageBookmarks.addItem(bookmarkItem);
      if (success) {
        const updated = storageBookmarks.get();
        setBookmarks(updated.items);
      }
      return success;
    },
    []
  );

  const removeBookmark = useCallback((articleId: string): boolean => {
    const success = storageBookmarks.removeItem(articleId);
    if (success) {
      const updated = storageBookmarks.get();
      setBookmarks(updated.items);
    }
    return success;
  }, []);

  const isBookmarked = useCallback((articleId: string): boolean => {
    return bookmarks.some((b) => b.articleId === articleId);
  }, [bookmarks]);

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, "dateSaved">): boolean => {
      if (bookmarks.some((b) => b.articleId === item.articleId)) {
        return removeBookmark(item.articleId);
      } else {
        return addBookmark(item);
      }
    },
    [bookmarks, addBookmark, removeBookmark]
  );

  const clearBookmarks = useCallback((): boolean => {
    const success = storageBookmarks.clear();
    if (success) {
      setBookmarks([]);
    }
    return success;
  }, []);

  const getBookmarkById = useCallback((articleId: string): BookmarkItem | null => {
    return storageBookmarks.getItemById(articleId);
  }, []);

  const getBookmarksByCategory = useCallback((category: string): BookmarkItem[] => {
    return storageBookmarks.getByCategory(category);
  }, []);

  const getBookmarksSortedByDate = useCallback(
    (descending = true): BookmarkItem[] => {
      return storageBookmarks.sortByDate(descending);
    },
    []
  );

  const bookmarkCount = bookmarks.length;
  const lastSavedTimestamp =
    bookmarks.length > 0 ? bookmarks[0].dateSaved : null;

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    getBookmarkById,
    getBookmarksByCategory,
    getBookmarksSortedByDate,
    bookmarkCount,
    lastSavedTimestamp,
  };
}
