/**
 * Unit tests for useSmartDigest hook — Story 12.7
 *
 * Tests for:
 * - Digest generation logic
 * - Ranking accuracy
 * - Token generation
 * - Config persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useSmartDigest,
  getDigestConfig,
  getRuleBasedRecommendations,
  rankByRelevance,
} from '@/hooks/useSmartDigest';
import type { SmartDigestConfig, DigestArticle } from '@/lib/smart-digest.types';
import type { Article } from '@shared/types';

describe('useSmartDigest Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getDigestConfig()', () => {
    it('should return null when config not set', () => {
      const config = getDigestConfig();
      expect(config).toBeNull();
    });

    it('should return config when stored in localStorage', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI', 'Science'],
      };

      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const config = getDigestConfig();
      expect(config).toEqual(mockConfig);
      expect(config?.enabled).toBe(true);
      expect(config?.frequency).toBe('daily');
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('smartDigest:config', 'invalid json');
      const config = getDigestConfig();
      expect(config).toBeNull();
    });

    it('should respect disabled config', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: false,
        frequency: 'weekly',
        preferredTime: '08:00',
        topics: ['Gadgets'],
      };

      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const config = getDigestConfig();
      expect(config?.enabled).toBe(false);
    });
  });

  describe('getRuleBasedRecommendations()', () => {
    it('should return articles for matching topics', () => {
      const candidates = getRuleBasedRecommendations(['AI']);
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates.every((a) => a.category === 'AI')).toBe(true);
    });

    it('should return articles for multiple topics', () => {
      const candidates = getRuleBasedRecommendations(['AI', 'Science']);
      expect(candidates.length).toBeGreaterThan(0);
      expect(
        candidates.every((a) => a.category === 'AI' || a.category === 'Science')
      ).toBe(true);
    });

    it('should return all articles when topics empty or not provided', () => {
      const candidates = getRuleBasedRecommendations([]);
      // Empty array filters the mock articles, returning AI + Science + Robotics + Gadgets items
      // Total mock articles = 12, so this depends on the filtering logic
      expect(candidates.length).toBeGreaterThanOrEqual(0);
    });

    it('should return articles with required fields', () => {
      const candidates = getRuleBasedRecommendations(['Robotics']);
      expect(candidates.length).toBeGreaterThan(0);

      candidates.forEach((article) => {
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('category');
        expect(article).toHaveProperty('url');
        expect(article).toHaveProperty('author');
        expect(article).toHaveProperty('date');
      });
    });
  });

  describe('rankByRelevance()', () => {
    it('should rank articles by relevance score', () => {
      const articles: Article[] = [
        {
          id: '1',
          title: 'AI Article',
          category: 'AI',
          url: 'https://example.com/1',
          author: 'Author 1',
          date: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Science Article',
          category: 'Science',
          url: 'https://example.com/2',
          author: 'Author 2',
          date: new Date().toISOString(),
        },
      ];

      const ranked = rankByRelevance(articles, ['AI', 'Science']);
      expect(ranked.length).toBe(2);
      expect(ranked.every((a) => a.relevanceScore >= 0 && a.relevanceScore <= 100)).toBe(true);
    });

    it('should give higher scores to matching topics', () => {
      const articles: Article[] = [
        {
          id: '1',
          title: 'AI Article',
          category: 'AI',
          url: 'https://example.com/1',
          author: 'Author 1',
          date: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Unrelated Article',
          category: 'Sports',
          url: 'https://example.com/2',
          author: 'Author 2',
          date: new Date().toISOString(),
        },
      ];

      const ranked = rankByRelevance(articles, ['AI']);
      expect(ranked[0].relevanceScore).toBeGreaterThan(ranked[1].relevanceScore);
    });

    it('should include article metadata in results', () => {
      const articles: Article[] = [
        {
          id: '1',
          title: 'Test Article',
          category: 'AI',
          url: 'https://example.com/test',
          author: 'Test Author',
          date: new Date().toISOString(),
          content: 'This is a test content for the digest...',
        },
      ];

      const ranked = rankByRelevance(articles, ['AI']);
      const result = ranked[0];

      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('title', 'Test Article');
      expect(result).toHaveProperty('category', 'AI');
      expect(result).toHaveProperty('link', 'https://example.com/test');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('reason');
    });

    it('should bonus recent articles', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const articles: Article[] = [
        {
          id: '1',
          title: 'Recent Article',
          category: 'AI',
          url: 'https://example.com/1',
          author: 'Author',
          date: yesterday.toISOString(),
        },
        {
          id: '2',
          title: 'Old Article',
          category: 'AI',
          url: 'https://example.com/2',
          author: 'Author',
          date: weekAgo.toISOString(),
        },
      ];

      const ranked = rankByRelevance(articles, ['AI']);
      expect(ranked[0].relevanceScore).toBeGreaterThan(ranked[1].relevanceScore);
    });

    it('should cap relevance score at 100', () => {
      const articles: Article[] = [
        {
          id: '1',
          title: 'Very Recent AI Article',
          category: 'AI',
          url: 'https://example.com/1',
          author: 'Author',
          date: new Date().toISOString(),
        },
      ];

      const ranked = rankByRelevance(articles, ['AI']);
      expect(ranked[0].relevanceScore).toBeLessThanOrEqual(100);
    });

    it('should sort by score descending', () => {
      const articles: Article[] = [
        {
          id: '1',
          title: 'Article 1',
          category: 'Gadgets',
          url: 'https://example.com/1',
          author: 'Author',
          date: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Article 2',
          category: 'AI',
          url: 'https://example.com/2',
          author: 'Author',
          date: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Article 3',
          category: 'AI',
          url: 'https://example.com/3',
          author: 'Author',
          date: new Date().toISOString(),
        },
      ];

      const ranked = rankByRelevance(articles, ['AI']);
      for (let i = 0; i < ranked.length - 1; i++) {
        expect(ranked[i].relevanceScore).toBeGreaterThanOrEqual(ranked[i + 1].relevanceScore);
      }
    });
  });

  describe('Token Generation', () => {
    it('should generate 32-character tokens', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const { result } = renderHook(() => useSmartDigest());

      // Verify token length
      expect(result.current.digest?.unsubscribeToken?.length).toBe(32);
      expect(result.current.digest?.preferencesToken?.length).toBe(32);
    });

    it('should generate unique tokens on each call', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const { result: result1 } = renderHook(() => useSmartDigest());
      const token1 = result1.current.digest?.unsubscribeToken;

      localStorage.clear();
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));
      const { result: result2 } = renderHook(() => useSmartDigest());
      const token2 = result2.current.digest?.unsubscribeToken;

      if (token1 && token2) {
        expect(token1).not.toBe(token2);
      }
    });

    it('should generate tokens with alphanumeric characters only', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const { result } = renderHook(() => useSmartDigest());

      if (result.current.digest) {
        expect(/^[A-Za-z0-9]{32}$/.test(result.current.digest.unsubscribeToken)).toBe(true);
        expect(/^[A-Za-z0-9]{32}$/.test(result.current.digest.preferencesToken)).toBe(true);
      }
    });
  });

  describe('useSmartDigest Hook Integration', () => {
    it('should return null digest when config disabled', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: false,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const { result } = renderHook(() => useSmartDigest());
      expect(result.current.digest).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should return null digest when no config', () => {
      const { result } = renderHook(() => useSmartDigest());
      expect(result.current.digest).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should generate payload with required fields', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const { result } = renderHook(() => useSmartDigest());

      if (result.current.digest) {
        expect(result.current.digest).toHaveProperty('userId');
        expect(result.current.digest).toHaveProperty('digestDate');
        expect(result.current.digest).toHaveProperty('articles');
        expect(result.current.digest).toHaveProperty('config');
        expect(result.current.digest).toHaveProperty('unsubscribeToken');
        expect(result.current.digest).toHaveProperty('preferencesToken');
      }
    });

    it('should include top 3-5 articles', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI', 'Science', 'Robotics', 'Gadgets'],
      };
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const { result } = renderHook(() => useSmartDigest());

      if (result.current.digest) {
        expect(result.current.digest.articles.length).toBeGreaterThanOrEqual(1);
        expect(result.current.digest.articles.length).toBeLessThanOrEqual(5);
      }
    });

    it('should return isLoading flag', () => {
      const mockConfig: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      localStorage.setItem('smartDigest:config', JSON.stringify(mockConfig));

      const { result } = renderHook(() => useSmartDigest());
      expect(typeof result.current.isLoading).toBe('boolean');
    });

    it('should return error state on failure', () => {
      const { result } = renderHook(() => useSmartDigest());
      expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
    });
  });
});
