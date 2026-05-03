import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUserPreferences } from "../../hooks/useUserPreferences";
import { storagePreferences } from "../../lib/storage";

describe("useUserPreferences hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.favoriteCategories).toEqual([]);
    expect(result.current.darkMode).toBe(false);
  });

  it("should restore preferences from localStorage", () => {
    storagePreferences.set({
      favoriteCategories: ["AI", "Science"],
      darkMode: true,
    });

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.favoriteCategories).toEqual(["AI", "Science"]);
    expect(result.current.darkMode).toBe(true);
  });

  it("should update favorite categories", () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updateFavoriteCategories(["AI", "Robotics"]);
    });

    expect(result.current.favoriteCategories).toEqual(["AI", "Robotics"]);
    const stored = storagePreferences.get();
    expect(stored.favoriteCategories).toEqual(["AI", "Robotics"]);
  });

  it("should update dark mode", () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updateDarkMode(true);
    });

    expect(result.current.darkMode).toBe(true);
    const stored = storagePreferences.get();
    expect(stored.darkMode).toBe(true);
  });

  it("should toggle dark mode", () => {
    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.darkMode).toBe(false);

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(true);

    act(() => {
      result.current.toggleDarkMode();
    });

    expect(result.current.darkMode).toBe(false);
  });

  it("should persist updates to localStorage", () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updateFavoriteCategories(["AI"]);
      result.current.updateDarkMode(true);
    });

    const stored = storagePreferences.get();
    expect(stored).toEqual({
      favoriteCategories: ["AI"],
      darkMode: true,
    });
  });

  it("should handle multiple updates", () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updateFavoriteCategories(["AI"]);
    });

    expect(result.current.favoriteCategories).toEqual(["AI"]);

    act(() => {
      result.current.updateFavoriteCategories(["Science"]);
    });

    expect(result.current.favoriteCategories).toEqual(["Science"]);

    act(() => {
      result.current.updateDarkMode(true);
    });

    expect(result.current.darkMode).toBe(true);

    const stored = storagePreferences.get();
    expect(stored).toEqual({
      favoriteCategories: ["Science"],
      darkMode: true,
    });
  });

  it("should maintain state across hook re-renders", () => {
    const { result, rerender } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updateFavoriteCategories(["Robotics"]);
      result.current.updateDarkMode(true);
    });

    const firstState = {
      categories: result.current.favoriteCategories,
      darkMode: result.current.darkMode,
    };

    rerender();

    const secondState = {
      categories: result.current.favoriteCategories,
      darkMode: result.current.darkMode,
    };

    expect(firstState).toEqual(secondState);
  });

  it("should support clearing favorite categories", () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updateFavoriteCategories(["AI", "Science"]);
    });

    expect(result.current.favoriteCategories).toHaveLength(2);

    act(() => {
      result.current.updateFavoriteCategories([]);
    });

    expect(result.current.favoriteCategories).toEqual([]);
  });

  it("should handle empty category list", () => {
    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updateFavoriteCategories([]);
    });

    expect(result.current.favoriteCategories).toEqual([]);
    const stored = storagePreferences.get();
    expect(stored.favoriteCategories).toEqual([]);
  });
});
