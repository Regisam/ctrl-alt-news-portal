import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  storage,
  storagePreferences,
  storageHistory,
  UserPreferences,
  ReadingHistoryItem,
  STORAGE_KEYS,
  MAX_HISTORY_ITEMS,
} from "../../lib/storage";

describe("storage abstraction layer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("core storage operations", () => {
    it("should set and get items", () => {
      const data = { test: "value" };
      const success = storage.setItem("test-key", data);

      expect(success).toBe(true);
      const retrieved = storage.getItem<typeof data>("test-key", null);
      expect(retrieved).toEqual(data);
    });

    it("should return default value for missing items", () => {
      const defaultValue = { default: true };
      const retrieved = storage.getItem("non-existent", defaultValue);

      expect(retrieved).toEqual(defaultValue);
    });

    it("should remove items", () => {
      storage.setItem("test-key", { value: 123 });
      const success = storage.removeItem("test-key");

      expect(success).toBe(true);
      const retrieved = storage.getItem("test-key", null);
      expect(retrieved).toBeNull();
    });

    it("should clear all items", () => {
      storage.setItem("key1", "value1");
      storage.setItem("key2", "value2");

      const success = storage.clear();

      expect(success).toBe(true);
      expect(storage.getItem("key1", null)).toBeNull();
      expect(storage.getItem("key2", null)).toBeNull();
    });

    it("should handle corrupted JSON gracefully", () => {
      localStorage.setItem("test-key", "invalid json");
      const defaultValue = { default: true };

      const retrieved = storage.getItem("test-key", defaultValue);

      expect(retrieved).toEqual(defaultValue);
    });

    it("should handle localStorage errors gracefully", () => {
      const setItemSpy = vi.spyOn(window.localStorage, "setItem");
      setItemSpy.mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

      const success = storage.setItem("test-key", { value: "too large" });

      expect(success).toBe(false);
      setItemSpy.mockRestore();
    });

    it("should work with SSR (typeof window === undefined)", () => {
      const originalWindow = global.window;
      // @ts-expect-error Testing SSR scenario
      delete global.window;

      const retrieved = storage.getItem("test-key", "default");
      const success = storage.setItem("test-key", "value");

      expect(retrieved).toBe("default");
      expect(success).toBe(false);

      global.window = originalWindow;
    });
  });

  describe("storagePreferences", () => {
    it("should get default preferences if not set", () => {
      const prefs = storagePreferences.get();

      expect(prefs).toEqual({
        favoriteCategories: [],
        darkMode: false,
      });
    });

    it("should set and get preferences", () => {
      const prefs: UserPreferences = {
        favoriteCategories: ["AI", "Science"],
        darkMode: true,
      };

      const success = storagePreferences.set(prefs);

      expect(success).toBe(true);
      const retrieved = storagePreferences.get();
      expect(retrieved).toEqual(prefs);
    });

    it("should update partial preferences", () => {
      storagePreferences.set({
        favoriteCategories: ["AI"],
        darkMode: false,
      });

      const success = storagePreferences.update({
        darkMode: true,
      });

      expect(success).toBe(true);
      const prefs = storagePreferences.get();
      expect(prefs).toEqual({
        favoriteCategories: ["AI"],
        darkMode: true,
      });
    });

    it("should handle corrupted preferences data", () => {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify({
        invalid: "structure",
      }));

      const prefs = storagePreferences.get();

      expect(prefs).toEqual({
        favoriteCategories: [],
        darkMode: false,
      });
    });

    it("should validate favorite categories", () => {
      const prefs: UserPreferences = {
        favoriteCategories: ["AI", "Science", "Robotics"],
        darkMode: false,
      };

      const success = storagePreferences.set(prefs);
      const retrieved = storagePreferences.get();

      expect(success).toBe(true);
      expect(retrieved.favoriteCategories).toEqual([
        "AI",
        "Science",
        "Robotics",
      ]);
    });
  });

  describe("storageHistory", () => {
    it("should get empty history if not set", () => {
      const history = storageHistory.get();

      expect(history.items).toEqual([]);
    });

    it("should add item to history", () => {
      const item: ReadingHistoryItem = {
        articleId: "article-1",
        title: "Test Article",
        category: "AI",
        timestamp: 1000000,
        timeSpentMs: 5000,
      };

      const success = storageHistory.addItem(item);

      expect(success).toBe(true);
      const history = storageHistory.get();
      expect(history.items).toHaveLength(1);
      expect(history.items[0]).toEqual(item);
    });

    it("should add items in FIFO order (newest first)", () => {
      const item1: ReadingHistoryItem = {
        articleId: "article-1",
        title: "First",
        category: "AI",
        timestamp: 1000,
        timeSpentMs: 5000,
      };
      const item2: ReadingHistoryItem = {
        articleId: "article-2",
        title: "Second",
        category: "Science",
        timestamp: 2000,
        timeSpentMs: 3000,
      };

      storageHistory.addItem(item1);
      storageHistory.addItem(item2);

      const history = storageHistory.get();
      expect(history.items[0]).toEqual(item2);
      expect(history.items[1]).toEqual(item1);
    });

    it("should enforce max history limit", () => {
      for (let i = 0; i < MAX_HISTORY_ITEMS + 10; i++) {
        const item: ReadingHistoryItem = {
          articleId: `article-${i}`,
          title: `Article ${i}`,
          category: "AI",
          timestamp: i * 1000,
          timeSpentMs: 5000,
        };
        storageHistory.addItem(item);
      }

      const history = storageHistory.get();

      expect(history.items).toHaveLength(MAX_HISTORY_ITEMS);
      expect(history.items[0].articleId).toBe(
        `article-${MAX_HISTORY_ITEMS + 9}`
      );
    });

    it("should remove item from history", () => {
      const item: ReadingHistoryItem = {
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timestamp: 1000,
        timeSpentMs: 5000,
      };

      storageHistory.addItem(item);
      const success = storageHistory.removeItem("article-1");

      expect(success).toBe(true);
      const history = storageHistory.get();
      expect(history.items).toHaveLength(0);
    });

    it("should clear all history", () => {
      storageHistory.addItem({
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timestamp: 1000,
        timeSpentMs: 5000,
      });

      const success = storageHistory.clear();

      expect(success).toBe(true);
      const history = storageHistory.get();
      expect(history.items).toHaveLength(0);
    });

    it("should get item by ID", () => {
      const item: ReadingHistoryItem = {
        articleId: "article-1",
        title: "Test",
        category: "AI",
        timestamp: 1000,
        timeSpentMs: 5000,
      };

      storageHistory.addItem(item);
      const retrieved = storageHistory.getItemById("article-1");

      expect(retrieved).toEqual(item);
    });

    it("should return null for non-existent item", () => {
      const retrieved = storageHistory.getItemById("non-existent");

      expect(retrieved).toBeNull();
    });

    it("should handle corrupted history data", () => {
      localStorage.setItem(
        STORAGE_KEYS.READING_HISTORY,
        JSON.stringify({
          invalid: "structure",
        })
      );

      const history = storageHistory.get();

      expect(history.items).toEqual([]);
    });
  });
});
