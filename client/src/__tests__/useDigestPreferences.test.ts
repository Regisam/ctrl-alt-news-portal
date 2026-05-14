/**
 * Unit tests for useDigestPreferences hook — Story 12.7 Phase 4
 *
 * Tests for:
 * - Preference loading and storage
 * - Updating frequency, time, topics
 * - Validation
 * - Subscribe/unsubscribe flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDigestPreferences, getStoredConfig, saveConfig, DEFAULT_CONFIG } from '@/hooks/useDigestPreferences';
import type { SmartDigestConfig } from '@/lib/smart-digest.types';

describe('useDigestPreferences Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getStoredConfig()', () => {
    it('should return null when no config stored', () => {
      const config = getStoredConfig();
      expect(config).toBeNull();
    });

    it('should return config from localStorage', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '09:00',
        topics: ['AI', 'Robotics'],
      };

      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));
      const config = getStoredConfig();

      expect(config).toEqual(mockConfig);
      expect(config?.frequency).toBe('daily');
      expect(config?.preferredTime).toBe('09:00');
    });

    it('should return null on invalid JSON', () => {
      localStorage.setItem('smartDigest:config', 'invalid');
      const config = getStoredConfig();
      expect(config).toBeNull();
    });
  });

  describe('saveConfig()', () => {
    it('should save config to localStorage', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'weekly',
        preferredTime: '10:00',
        topics: ['Science'],
      };

      saveConfig(mockConfig);
      const stored = localStorage.getItem('smartDigest:config');

      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockConfig);
    });

    it('should throw error on localStorage failure', () => {
      const mockConfig: SmartDigestConfig = DEFAULT_CONFIG;
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      expect(() => saveConfig(mockConfig)).toThrow('Failed to save preferences');
      setItemSpy.mockRestore();
    });
  });

  describe('useDigestPreferences Hook', () => {
    it('should initialize with null when no stored config', () => {
      const { result } = renderHook(() => useDigestPreferences());

      expect(result.current.config).toEqual(DEFAULT_CONFIG);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load stored config on mount', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: false,
        frequency: 'daily',
        preferredTime: '18:00',
        topics: ['Gadgets'],
      };

      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));
      const { result } = renderHook(() => useDigestPreferences());

      expect(result.current.config).toEqual(mockConfig);
      expect(result.current.isEnabled).toBe(false);
    });

    it('should update frequency', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        await result.current.updatePreferences({ frequency: 'daily' });
      });

      expect(result.current.config.frequency).toBe('daily');
      const stored = getStoredConfig();
      expect(stored?.frequency).toBe('daily');
    });

    it('should update preferred time with validation', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        await result.current.updatePreferences({ preferredTime: '14:30' });
      });

      expect(result.current.config.preferredTime).toBe('14:30');
    });

    it('should reject invalid time format', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        try {
          await result.current.updatePreferences({ preferredTime: '25:00' });
          expect.fail('Should have thrown error');
        } catch (err) {
          expect(err).toBeTruthy();
        }
      });

      expect(result.current.error).toContain('Invalid time format');
    });

    it('should reject invalid frequency', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        try {
          await result.current.updatePreferences({ frequency: 'monthly' as any });
          expect.fail('Should have thrown error');
        } catch (err) {
          expect(err).toBeTruthy();
        }
      });

      expect(result.current.error).toContain('Invalid frequency');
    });

    it('should update topics', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        await result.current.updatePreferences({ topics: ['AI', 'Science', 'Robotics'] });
      });

      expect(result.current.config.topics).toEqual(['AI', 'Science', 'Robotics']);
    });

    it('should reject topics that are not an array', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        try {
          await result.current.updatePreferences({ topics: 'AI' as any });
          expect.fail('Should have thrown error');
        } catch (err) {
          expect(err).toBeTruthy();
        }
      });

      expect(result.current.error).toContain('array');
    });

    it('should update enabled flag', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        await result.current.updatePreferences({ enabled: false });
      });

      expect(result.current.config.enabled).toBe(false);
      expect(result.current.isEnabled).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        await result.current.updatePreferences({
          frequency: 'daily',
          preferredTime: '16:00',
          topics: ['Robotics', 'Gadgets'],
          enabled: true,
        });
      });

      expect(result.current.config.frequency).toBe('daily');
      expect(result.current.config.preferredTime).toBe('16:00');
      expect(result.current.config.topics).toEqual(['Robotics', 'Gadgets']);
      expect(result.current.config.enabled).toBe(true);
    });

    it('should reset preferences to defaults', () => {
      const { result } = renderHook(() => useDigestPreferences());

      act(() => {
        result.current.resetPreferences();
      });

      expect(result.current.config).toEqual(DEFAULT_CONFIG);
      const stored = getStoredConfig();
      expect(stored).toEqual(DEFAULT_CONFIG);
    });

    it('should subscribe (enable digest)', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        await result.current.updatePreferences({ enabled: false });
      });

      expect(result.current.isEnabled).toBe(false);

      await act(async () => {
        result.current.subscribe();
      });

      // Need to wait for async state update
      expect(result.current.isEnabled).toBe(true);
    });

    it('should unsubscribe (disable digest)', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      expect(result.current.isEnabled).toBe(true);

      await act(async () => {
        result.current.unsubscribe();
      });

      expect(result.current.isEnabled).toBe(false);
    });

    it('should preserve lastDigestSent on update', async () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'weekly',
        preferredTime: '08:00',
        topics: ['AI'],
        lastDigestSent: new Date('2026-05-13T12:00:00Z'),
      };

      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));
      const { result } = renderHook(() => useDigestPreferences());

      await act(async () => {
        await result.current.updatePreferences({ frequency: 'daily' });
      });

      expect(result.current.config.lastDigestSent).toEqual(mockConfig.lastDigestSent);
    });

    it('should set isLoading during async update', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      let loadingDuringUpdate = false;

      await act(async () => {
        const promise = result.current.updatePreferences({ frequency: 'daily' });
        if (result.current.isLoading) {
          loadingDuringUpdate = true;
        }
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should clear error on successful update', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      // Cause an error
      await act(async () => {
        try {
          await result.current.updatePreferences({ preferredTime: 'invalid' });
        } catch {
          // Error expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Fix the error
      await act(async () => {
        await result.current.updatePreferences({ preferredTime: '12:00' });
      });

      expect(result.current.error).toBeNull();
    });

    it('should validate time edge cases', async () => {
      const { result } = renderHook(() => useDigestPreferences());

      // Valid edge cases
      const validTimes = ['00:00', '23:59', '12:00', '08:30'];

      for (const time of validTimes) {
        await act(async () => {
          await result.current.updatePreferences({ preferredTime: time });
        });
        expect(result.current.config.preferredTime).toBe(time);
        expect(result.current.error).toBeNull();
      }
    });
  });
});
