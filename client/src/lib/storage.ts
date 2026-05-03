// localStorage abstraction layer for EPIC-11 personalization
// All localStorage operations must go through this module

export const STORAGE_KEYS = {
  USER_PREFERENCES: "ctrl-alt-preferences",
  READING_HISTORY: "ctrl-alt-reading-history",
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
