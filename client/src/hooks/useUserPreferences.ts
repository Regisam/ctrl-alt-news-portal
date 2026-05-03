import * as React from "react";
import {
  UserPreferences,
  storagePreferences,
} from "../lib/storage";

export function useUserPreferences() {
  const [preferences, setPreferences] = React.useState<UserPreferences>(() => {
    return storagePreferences.get();
  });

  const updateFavoriteCategories = React.useCallback(
    (categories: string[]) => {
      const updated = { ...preferences, favoriteCategories: categories };
      setPreferences(updated);
      storagePreferences.set(updated);
    },
    [preferences]
  );

  const updateDarkMode = React.useCallback((darkMode: boolean) => {
    setPreferences((prev) => {
      const updated = { ...prev, darkMode };
      storagePreferences.set(updated);
      return updated;
    });
  }, []);

  const toggleDarkMode = React.useCallback(() => {
    setPreferences((prev) => {
      const updated = { ...prev, darkMode: !prev.darkMode };
      storagePreferences.set(updated);
      return updated;
    });
  }, []);

  return {
    favoriteCategories: preferences.favoriteCategories,
    darkMode: preferences.darkMode,
    updateFavoriteCategories,
    updateDarkMode,
    toggleDarkMode,
  };
}
