import * as React from "react";
import {
  ReadingHistoryItem,
  storageHistory,
} from "../lib/storage";

export function useReadingHistory() {
  const [history, setHistory] = React.useState<ReadingHistoryItem[]>(() => {
    return storageHistory.get().items;
  });

  const addToHistory = React.useCallback(
    (item: Omit<ReadingHistoryItem, "timestamp">) => {
      const historyItem: ReadingHistoryItem = {
        ...item,
        timestamp: Date.now(),
      };
      const success = storageHistory.addItem(historyItem);
      if (success) {
        setHistory(storageHistory.get().items);
      }
      return success;
    },
    []
  );

  const removeFromHistory = React.useCallback((articleId: string) => {
    const success = storageHistory.removeItem(articleId);
    if (success) {
      setHistory(storageHistory.get().items);
    }
    return success;
  }, []);

  const clearHistory = React.useCallback(() => {
    const success = storageHistory.clear();
    if (success) {
      setHistory([]);
    }
    return success;
  }, []);

  const getItemById = React.useCallback((articleId: string) => {
    return storageHistory.getItemById(articleId);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getItemById,
  };
}
