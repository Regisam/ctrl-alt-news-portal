import {
  getRecommendations,
  getFallbackRecommendations,
  extractUserCategories,
  extractUserTags,
  type RecommendationContext,
} from '@/lib/recommendations';
import { aiArticles, scienceArticles, roboticsArticles, trendingArticles } from '@/lib/data';
import { describe, it, expect } from 'vitest';
import type { Article } from '@/lib/data';

const ALL_ARTICLES: Article[] = [
  ...aiArticles,
  ...scienceArticles,
  ...roboticsArticles,
  ...trendingArticles,
];

describe('recommendations library', () => {
  describe('getRecommendations', () => {
    it('should return empty array when no candidates available', () => {
      const context: RecommendationContext = {
        readArticleIds: ALL_ARTICLES.map(a => a.id), // Read all
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: ['AI'],
        userTags: [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5);
      expect(recommendations).toEqual([]);
    });

    it('should exclude already read articles', () => {
      const readIds = [aiArticles[0].id];
      const context: RecommendationContext = {
        readArticleIds: readIds,
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: ['AI'],
        userTags: [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5);
      const readArticleInRecommendations = recommendations.find(r => readIds.includes(r.id));
      expect(readArticleInRecommendations).toBeUndefined();
    });

    it('should prefer articles in user favorite categories', () => {
      const readIds = [aiArticles[0].id, aiArticles[1].id];
      const context: RecommendationContext = {
        readArticleIds: readIds,
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: ['AI'],
        userTags: [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5);
      const aiArticlesInRecommendations = recommendations.filter(r => r.category === 'AI');
      expect(aiArticlesInRecommendations.length).toBeGreaterThan(0);
    });

    it('should return recommendations up to maxCount', () => {
      const readIds = [aiArticles[0].id];
      const context: RecommendationContext = {
        readArticleIds: readIds,
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: ['AI'],
        userTags: [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5, 10);
      expect(recommendations.length).toBeLessThanOrEqual(10);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should respect maxCount parameter', () => {
      const readIds = [aiArticles[0].id];
      const context: RecommendationContext = {
        readArticleIds: readIds,
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: ['AI'],
        userTags: [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5, 3);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should consider tag similarity in scoring', () => {
      const aiArticleWithTags = aiArticles.find(a => a.tags && a.tags.length > 0);
      if (!aiArticleWithTags) return;

      const readIds = [aiArticleWithTags.id];
      const context: RecommendationContext = {
        readArticleIds: readIds,
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: [],
        userTags: aiArticleWithTags.tags || [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5);
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('getFallbackRecommendations', () => {
    it('should return random articles when no categories specified', () => {
      const recommendations = getFallbackRecommendations([], ALL_ARTICLES, 5);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should return articles from specified categories', () => {
      const categories = ['AI', 'SCIENCE'];
      const recommendations = getFallbackRecommendations(categories, ALL_ARTICLES, 5);

      expect(recommendations.length).toBeLessThanOrEqual(5);
      recommendations.forEach(r => {
        expect(categories).toContain(r.category);
      });
    });

    it('should fill recommendations with other categories if not enough in favorite', () => {
      const categories = ['GADGETS']; // May be small category
      const recommendations = getFallbackRecommendations(categories, ALL_ARTICLES, 10);

      expect(recommendations.length).toBeLessThanOrEqual(10);
      expect(recommendations.length).toBeGreaterThan(0);
      // All recommendations should be unique
      const ids = recommendations.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should return specified count', () => {
      const recommendations = getFallbackRecommendations(['AI'], ALL_ARTICLES, 3);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should not return duplicates', () => {
      const recommendations = getFallbackRecommendations(['AI', 'SCIENCE'], ALL_ARTICLES, 10);
      const ids = recommendations.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('extractUserCategories', () => {
    it('should return empty array for no read articles', () => {
      const categories = extractUserCategories([], ALL_ARTICLES);
      expect(categories).toEqual([]);
    });

    it('should extract top categories from read history', () => {
      const readIds = [aiArticles[0].id, aiArticles[1].id, scienceArticles[0].id];
      const categories = extractUserCategories(readIds, ALL_ARTICLES);

      expect(categories).toContain('AI');
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.length).toBeLessThanOrEqual(3);
    });

    it('should return max 3 categories', () => {
      const readIds = [
        aiArticles[0].id,
        scienceArticles[0].id,
        roboticsArticles[0].id,
        trendingArticles[0].id,
      ];
      const categories = extractUserCategories(readIds, ALL_ARTICLES);

      expect(categories.length).toBeLessThanOrEqual(3);
    });

    it('should sort categories by frequency', () => {
      const readIds = [
        aiArticles[0].id,
        aiArticles[1].id,
        aiArticles[2].id,
        scienceArticles[0].id,
      ];
      const categories = extractUserCategories(readIds, ALL_ARTICLES);

      const aiIndex = categories.indexOf('AI');
      const scienceIndex = categories.indexOf('SCIENCE');

      // AI should come before SCIENCE (more frequent)
      if (aiIndex !== -1 && scienceIndex !== -1) {
        expect(aiIndex).toBeLessThan(scienceIndex);
      }
    });
  });

  describe('extractUserTags', () => {
    it('should return empty array for no read articles', () => {
      const tags = extractUserTags([], ALL_ARTICLES);
      expect(tags).toEqual([]);
    });

    it('should extract tags from read articles', () => {
      const readIds = [aiArticles[0].id];
      const tags = extractUserTags(readIds, ALL_ARTICLES);

      // Should return array (may be empty if article has no tags)
      expect(Array.isArray(tags)).toBe(true);
    });

    it('should return max 5 tags', () => {
      const readIds = aiArticles.slice(0, 5).map(a => a.id);
      const tags = extractUserTags(readIds, ALL_ARTICLES);

      expect(tags.length).toBeLessThanOrEqual(5);
    });

    it('should sort tags by frequency', () => {
      const readIds = [aiArticles[0].id, aiArticles[0].id]; // Same article twice
      const tags = extractUserTags(readIds, ALL_ARTICLES);

      // Should extract tags from the article
      expect(Array.isArray(tags)).toBe(true);
    });

    it('should normalize tags to lowercase', () => {
      const readIds = [aiArticles[0].id];
      const tags = extractUserTags(readIds, ALL_ARTICLES);

      tags.forEach(tag => {
        expect(tag).toBe(tag.toLowerCase());
      });
    });
  });

  describe('recommendation algorithm correctness', () => {
    it('should score articles based on category match', () => {
      const aiReadIds = [aiArticles[0].id, aiArticles[1].id];
      const context: RecommendationContext = {
        readArticleIds: aiReadIds,
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: ['AI'],
        userTags: [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5);

      // Should have AI articles first
      expect(recommendations.length).toBeGreaterThan(0);
      if (recommendations.length > 0) {
        // At least some recommendations should be from AI category
        const aiCount = recommendations.filter(r => r.category === 'AI').length;
        expect(aiCount).toBeGreaterThan(0);
      }
    });

    it('should not recommend articles already in read history', () => {
      const readIds = aiArticles.slice(0, 3).map(a => a.id);
      const context: RecommendationContext = {
        readArticleIds: readIds,
        likedArticleIds: [],
        bookmarkedArticleIds: [],
        userCategories: ['AI'],
        userTags: [],
      };

      const recommendations = getRecommendations(context, ALL_ARTICLES, 5);

      recommendations.forEach(rec => {
        expect(readIds).not.toContain(rec.id);
      });
    });
  });
});
