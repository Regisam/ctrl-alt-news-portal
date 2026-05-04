import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useImplicitFeedback } from '@/hooks/useImplicitFeedback';
import * as useReadingHistoryModule from '@/hooks/useReadingHistory';
import * as useBookmarksModule from '@/hooks/useBookmarks';
import type { ReadingHistoryItem, BookmarkItem } from '@/lib/storage';
import type { Reaction } from '@/hooks/useReactions';

const mockHistory: ReadingHistoryItem[] = [
  {
    articleId: '1',
    title: 'AI Article',
    category: 'AI',
    timestamp: Date.now(),
    timeSpentMs: 120000,
  },
];

const mockBookmarks: BookmarkItem[] = [
  {
    articleId: '2',
    title: 'Science Article',
    category: 'SCIENCE',
    dateSaved: Date.now(),
  },
];

describe('useImplicitFeedback', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should return preferences when hook is called', () => {
    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: [],
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
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

    const { result } = renderHook(() => useImplicitFeedback());

    expect(result.current).toHaveProperty('preferences');
    expect(result.current).toHaveProperty('topCategories');
    expect(result.current).toHaveProperty('hasSignals');
  });

  it('should return empty preferences when no signals exist', () => {
    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: [],
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
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

    localStorage.removeItem('ctrl-alt-reactions');

    const { result } = renderHook(() => useImplicitFeedback());

    expect(result.current.preferences).toEqual([]);
    expect(result.current.hasSignals).toBe(false);
  });

  it('should have hasSignals=false when no signals exist', () => {
    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: [],
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
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

    const { result } = renderHook(() => useImplicitFeedback());

    expect(result.current.hasSignals).toBe(false);
  });

  it('should return topCategories (max 3)', () => {
    const history: ReadingHistoryItem[] = [
      {
        articleId: '1',
        title: 'AI',
        category: 'AI',
        timestamp: Date.now(),
        timeSpentMs: 120000,
      },
      {
        articleId: '2',
        title: 'Science',
        category: 'SCIENCE',
        timestamp: Date.now(),
        timeSpentMs: 120000,
      },
      {
        articleId: '3',
        title: 'Robotics',
        category: 'ROBOTICS',
        timestamp: Date.now(),
        timeSpentMs: 120000,
      },
      {
        articleId: '4',
        title: 'Gadgets',
        category: 'GADGETS',
        timestamp: Date.now(),
        timeSpentMs: 120000,
      },
    ];

    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history,
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
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

    const { result } = renderHook(() => useImplicitFeedback());

    expect(result.current.topCategories.length).toBeLessThanOrEqual(3);
  });

  it('should read reactions from localStorage', () => {
    const mockReactions: Reaction[] = [
      {
        articleId: '1',
        userId: 'user1',
        type: 'like',
        timestamp: Date.now(),
      },
    ];

    localStorage.setItem('ctrl-alt-reactions', JSON.stringify(mockReactions));

    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: mockHistory,
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
      bookmarks: mockBookmarks,
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

    const { result } = renderHook(() => useImplicitFeedback());

    expect(result.current.hasSignals).toBe(true);
  });

  it('should handle invalid reactions in localStorage gracefully', () => {
    localStorage.setItem('ctrl-alt-reactions', 'invalid-json');

    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: [],
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
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

    expect(() => renderHook(() => useImplicitFeedback())).not.toThrow();
  });

  it('should have hasSignals=true when history exists', () => {
    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: mockHistory,
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
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

    const { result } = renderHook(() => useImplicitFeedback());

    expect(result.current.hasSignals).toBe(true);
  });

  it('should return sorted preferences by score', () => {
    const history: ReadingHistoryItem[] = [
      {
        articleId: '1',
        title: 'AI 1',
        category: 'AI',
        timestamp: Date.now(),
        timeSpentMs: 120000,
      },
      {
        articleId: '2',
        title: 'AI 2',
        category: 'AI',
        timestamp: Date.now(),
        timeSpentMs: 120000,
      },
      {
        articleId: '3',
        title: 'Science 1',
        category: 'SCIENCE',
        timestamp: Date.now(),
        timeSpentMs: 60000,
      },
    ];

    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history,
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
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

    const { result } = renderHook(() => useImplicitFeedback());

    for (let i = 0; i < result.current.preferences.length - 1; i++) {
      expect(result.current.preferences[i].score).toBeGreaterThanOrEqual(
        result.current.preferences[i + 1].score
      );
    }
  });

  it('should combine signals from history and bookmarks', () => {
    vi.spyOn(useReadingHistoryModule, 'useReadingHistory').mockReturnValue({
      history: mockHistory,
      addToHistory: vi.fn(),
      removeFromHistory: vi.fn(),
      clearHistory: vi.fn(),
      getItemById: vi.fn(),
    });

    vi.spyOn(useBookmarksModule, 'useBookmarks').mockReturnValue({
      bookmarks: mockBookmarks,
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

    const { result } = renderHook(() => useImplicitFeedback());

    expect(result.current.preferences.length).toBeGreaterThan(0);
    expect(result.current.hasSignals).toBe(true);
  });
});
