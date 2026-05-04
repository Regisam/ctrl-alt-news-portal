// localStorage abstraction layer for EPIC-11 personalization
// All localStorage operations must go through this module

export const STORAGE_KEYS = {
  USER_PREFERENCES: "ctrl-alt-preferences",
  READING_HISTORY: "ctrl-alt-reading-history",
  BOOKMARKS: "ctrl-alt-bookmarks",
  FOLLOWED_AUTHORS: "ctrl-alt-followed-authors",
} as const;

export const MAX_HISTORY_ITEMS = 100;

export interface UserPreferences {
  favoriteCategories: string[];
  darkMode: boolean;
}

export interface ReadingHistoryItem {
  articleId: string;
  title: string;
  category: string;
  timestamp: number;
  timeSpentMs: number;
}

export interface ReadingHistory {
  items: ReadingHistoryItem[];
}

export interface BookmarkItem {
  articleId: string;
  title: string;
  category: string;
  dateSaved: number;
  url?: string;
}

export interface Bookmarks {
  items: BookmarkItem[];
}

// Type guards
function isValidUserPreferences(data: unknown): data is UserPreferences {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.favoriteCategories) &&
    obj.favoriteCategories.every((c) => typeof c === "string") &&
    typeof obj.darkMode === "boolean"
  );
}

function isValidReadingHistoryItem(data: unknown): data is ReadingHistoryItem {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.articleId === "string" &&
    typeof obj.title === "string" &&
    typeof obj.category === "string" &&
    typeof obj.timestamp === "number" &&
    typeof obj.timeSpentMs === "number"
  );
}

function isValidReadingHistory(data: unknown): data is ReadingHistory {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    obj.items.every((item) => isValidReadingHistoryItem(item))
  );
}

function isValidBookmarkItem(data: unknown): data is BookmarkItem {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.articleId === "string" &&
    typeof obj.title === "string" &&
    typeof obj.category === "string" &&
    typeof obj.dateSaved === "number" &&
    (obj.url === undefined || typeof obj.url === "string")
  );
}

function isValidBookmarks(data: unknown): data is Bookmarks {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.items) &&
    obj.items.every((item) => isValidBookmarkItem(item))
  );
}

// Core storage operations
export const storage = {
  getItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === "undefined") return defaultValue;
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[storage] Failed to get item "${key}":`, error);
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): boolean {
    try {
      if (typeof window === "undefined") return false;
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[storage] Failed to set item "${key}":`, error);
      return false;
    }
  },

  removeItem(key: string): boolean {
    try {
      if (typeof window === "undefined") return false;
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[storage] Failed to remove item "${key}":`, error);
      return false;
    }
  },

  clear(): boolean {
    try {
      if (typeof window === "undefined") return false;
      window.localStorage.clear();
      return true;
    } catch (error) {
      console.error("[storage] Failed to clear localStorage:", error);
      return false;
    }
  },
};

// User Preferences operations
export const storagePreferences = {
  get(): UserPreferences {
    const data = storage.getItem<unknown>(STORAGE_KEYS.USER_PREFERENCES, null);
    if (data === null) {
      return { favoriteCategories: [], darkMode: false };
    }
    if (isValidUserPreferences(data)) {
      return data;
    }
    console.warn(
      "[storage] Corrupted user preferences, resetting to defaults"
    );
    return { favoriteCategories: [], darkMode: false };
  },

  set(preferences: UserPreferences): boolean {
    return storage.setItem(STORAGE_KEYS.USER_PREFERENCES, preferences);
  },

  update(updates: Partial<UserPreferences>): boolean {
    const current = this.get();
    const updated = { ...current, ...updates };
    return this.set(updated);
  },
};

// Reading History operations
export const storageHistory = {
  get(): ReadingHistory {
    const data = storage.getItem<unknown>(
      STORAGE_KEYS.READING_HISTORY,
      null
    );
    if (data === null) {
      return { items: [] };
    }
    if (isValidReadingHistory(data)) {
      return data;
    }
    console.warn("[storage] Corrupted reading history, resetting to empty");
    return { items: [] };
  },

  set(history: ReadingHistory): boolean {
    return storage.setItem(STORAGE_KEYS.READING_HISTORY, history);
  },

  addItem(item: ReadingHistoryItem): boolean {
    const history = this.get();
    history.items.unshift(item);

    if (history.items.length > MAX_HISTORY_ITEMS) {
      history.items = history.items.slice(0, MAX_HISTORY_ITEMS);
    }

    return this.set(history);
  },

  removeItem(articleId: string): boolean {
    const history = this.get();
    history.items = history.items.filter((item) => item.articleId !== articleId);
    return this.set(history);
  },

  clear(): boolean {
    return this.set({ items: [] });
  },

  getItemById(articleId: string): ReadingHistoryItem | null {
    const history = this.get();
    return history.items.find((item) => item.articleId === articleId) ?? null;
  },
};

// Bookmarks operations
export const storageBookmarks = {
  get(): Bookmarks {
    const data = storage.getItem<unknown>(STORAGE_KEYS.BOOKMARKS, null);
    if (data === null) {
      return { items: [] };
    }
    if (isValidBookmarks(data)) {
      return data;
    }
    console.warn("[storage] Corrupted bookmarks, resetting to empty");
    return { items: [] };
  },

  set(bookmarks: Bookmarks): boolean {
    return storage.setItem(STORAGE_KEYS.BOOKMARKS, bookmarks);
  },

  addItem(item: BookmarkItem): boolean {
    const bookmarks = this.get();
    // Remove if already exists (update case)
    bookmarks.items = bookmarks.items.filter(
      (b) => b.articleId !== item.articleId
    );
    // Add new item at the beginning
    bookmarks.items.unshift(item);
    return this.set(bookmarks);
  },

  removeItem(articleId: string): boolean {
    const bookmarks = this.get();
    bookmarks.items = bookmarks.items.filter(
      (item) => item.articleId !== articleId
    );
    return this.set(bookmarks);
  },

  clear(): boolean {
    return this.set({ items: [] });
  },

  getItemById(articleId: string): BookmarkItem | null {
    const bookmarks = this.get();
    return bookmarks.items.find((item) => item.articleId === articleId) ?? null;
  },

  getByCategory(category: string): BookmarkItem[] {
    const bookmarks = this.get();
    return bookmarks.items.filter((item) => item.category === category);
  },

  sortByDate(descending = true): BookmarkItem[] {
    const bookmarks = this.get();
    return [...bookmarks.items].sort((a, b) => {
      return descending ? b.dateSaved - a.dateSaved : a.dateSaved - b.dateSaved;
    });
  },
};

// Author Follow Storage (Story 12.2)
export interface AuthorFollowItem {
  authorName: string;
  dateFollowed: number;
}

export interface FollowedAuthorsData {
  items: AuthorFollowItem[];
}

function isValidAuthorFollowItem(item: unknown): item is AuthorFollowItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'authorName' in item &&
    'dateFollowed' in item &&
    typeof (item as any).authorName === 'string' &&
    typeof (item as any).dateFollowed === 'number'
  );
}

function isValidFollowedAuthorsData(data: unknown): data is FollowedAuthorsData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as any).items) &&
    (data as any).items.every(isValidAuthorFollowItem)
  );
}

export const storageAuthorFollow = {
  get(): FollowedAuthorsData {
    const stored = storage.getItem<unknown>(STORAGE_KEYS.FOLLOWED_AUTHORS, null);

    if (stored && isValidFollowedAuthorsData(stored)) {
      return stored;
    }

    if (typeof window !== 'undefined') {
      console.warn('[storage] Invalid followed authors data, using defaults');
    }

    return { items: [] };
  },

  follow(authorName: string): FollowedAuthorsData {
    const current = this.get();

    const existing = current.items.findIndex((item) => item.authorName === authorName);
    if (existing >= 0) {
      current.items.splice(existing, 1);
    }

    const newItem: AuthorFollowItem = {
      authorName,
      dateFollowed: Date.now(),
    };

    current.items.unshift(newItem);
    storage.setItem(STORAGE_KEYS.FOLLOWED_AUTHORS, current);

    return current;
  },

  unfollow(authorName: string): FollowedAuthorsData {
    const current = this.get();
    current.items = current.items.filter((item) => item.authorName !== authorName);
    storage.setItem(STORAGE_KEYS.FOLLOWED_AUTHORS, current);
    return current;
  },

  isFollowing(authorName: string): boolean {
    const current = this.get();
    return current.items.some((item) => item.authorName === authorName);
  },

  getAll(): AuthorFollowItem[] {
    return this.get().items;
  },

  clear(): FollowedAuthorsData {
    const empty = { items: [] };
    storage.setItem(STORAGE_KEYS.FOLLOWED_AUTHORS, empty);
    return empty;
  },
};
