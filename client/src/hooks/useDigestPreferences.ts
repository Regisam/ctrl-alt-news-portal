/**
 * useDigestPreferences — User digest preferences management (Story 12.7 Phase 4)
 *
 * Handles updating user's digest settings:
 * - Frequency (daily/weekly)
 * - Preferred time (HH:MM UTC)
 * - Topics of interest
 *
 * AC7: Preference management via localStorage
 * AC4.1.1: useDigestPreferences hook
 */

import { useState, useCallback } from 'react';
import type { SmartDigestConfig } from '@/lib/smart-digest.types';

interface UpdatePreferencesInput {
  frequency?: 'daily' | 'weekly';
  preferredTime?: string;
  topics?: string[];
  enabled?: boolean;
}

interface UseDigestPreferencesReturn {
  config: SmartDigestConfig | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (updates: UpdatePreferencesInput) => Promise<void>;
  resetPreferences: () => void;
  isEnabled: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}

const STORAGE_KEY = 'smartDigest:config';
const DEFAULT_CONFIG: SmartDigestConfig = {
  enabled: true,
  frequency: 'weekly',
  preferredTime: '08:00',
  topics: ['AI', 'Science'],
};

/**
 * Get digest config from localStorage with error handling
 */
function getStoredConfig(): SmartDigestConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SmartDigestConfig;
  } catch (error) {
    console.error('Failed to parse digest preferences from localStorage:', error);
    return null;
  }
}

/**
 * Save digest config to localStorage
 */
function saveConfig(config: SmartDigestConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save digest preferences to localStorage:', error);
    throw new Error('Failed to save preferences');
  }
}

/**
 * Main hook: Manage user digest preferences
 *
 * Subtask 4.1.3: Persist preferences to localStorage
 */
export function useDigestPreferences(): UseDigestPreferencesReturn {
  const [config, setConfig] = useState<SmartDigestConfig | null>(() => getStoredConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update one or more preference fields
   * Validates input and persists to localStorage
   *
   * Subtask 4.1.1: Update frequency/time/topics
   */
  const updatePreferences = useCallback(
    async (updates: UpdatePreferencesInput): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current config or use defaults
        const currentConfig = config || DEFAULT_CONFIG;

        // Validate frequency
        if (updates.frequency && !['daily', 'weekly'].includes(updates.frequency)) {
          throw new Error('Invalid frequency. Must be "daily" or "weekly"');
        }

        // Validate preferred time format (HH:MM)
        if (updates.preferredTime) {
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(updates.preferredTime)) {
            throw new Error('Invalid time format. Use HH:MM (UTC)');
          }
        }

        // Validate topics array
        if (updates.topics && !Array.isArray(updates.topics)) {
          throw new Error('Topics must be an array');
        }

        // Build updated config
        const updatedConfig: SmartDigestConfig = {
          enabled: updates.enabled !== undefined ? updates.enabled : currentConfig.enabled,
          frequency: updates.frequency || currentConfig.frequency,
          preferredTime: updates.preferredTime || currentConfig.preferredTime,
          topics: updates.topics || currentConfig.topics,
          lastDigestSent: currentConfig.lastDigestSent,
        };

        // Save to localStorage
        saveConfig(updatedConfig);
        setConfig(updatedConfig);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update preferences';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [config]
  );

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback((): void => {
    try {
      saveConfig(DEFAULT_CONFIG);
      setConfig(DEFAULT_CONFIG);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset preferences';
      setError(message);
    }
  }, []);

  /**
   * Enable digest notifications
   */
  const subscribe = useCallback((): void => {
    updatePreferences({ enabled: true }).catch((err) => {
      console.error('Failed to subscribe:', err);
    });
  }, [updatePreferences]);

  /**
   * Disable digest notifications (unsubscribe)
   * Note: This sets enabled=false; actual unsubscribe token removal happens via API
   */
  const unsubscribe = useCallback((): void => {
    updatePreferences({ enabled: false }).catch((err) => {
      console.error('Failed to unsubscribe:', err);
    });
  }, [updatePreferences]);

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
    isEnabled: config?.enabled ?? true,
    subscribe,
    unsubscribe,
  };
}

/**
 * Export preference utilities for use outside React components
 */
export { getStoredConfig, saveConfig, DEFAULT_CONFIG };
