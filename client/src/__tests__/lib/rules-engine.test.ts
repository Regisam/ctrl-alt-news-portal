import { describe, it, expect, beforeEach } from 'vitest';
import { RulesEngine, type Rule, type UserContext } from '@/lib/rules-engine';
import { aiArticles, scienceArticles, roboticsArticles } from '@/lib/data';

describe('RulesEngine', () => {
  let engine: RulesEngine;
  const allArticles = [...aiArticles, ...scienceArticles, ...roboticsArticles];

  const topicRule: Rule = {
    id: 'rule_ai_topic',
    name: 'AI Topic Rule',
    priority: 100,
    enabled: true,
    conditions: [
      { type: 'topic_interest', field: 'favoriteCategories', value: 'AI' },
    ],
    actions: [{ type: 'boost_articles', field: 'category', value: 'AI', weight: 2.0 }],
    metadata: { impressions: 0, clicks: 0, firing_count: 0 },
  };

  const fallbackRule: Rule = {
    id: 'rule_fallback',
    name: 'Fallback',
    priority: 999,
    enabled: true,
    conditions: [{ type: 'always_match' }],
    actions: [{ type: 'sort_articles', field: 'date', order: 'descending' }],
    metadata: { impressions: 0, clicks: 0, firing_count: 0 },
  };

  const userContext: UserContext = {
    favoriteCategories: ['AI'],
    readingHistory: [aiArticles[0], aiArticles[1]],
    bookmarks: [aiArticles[0].id.toString()],
  };

  beforeEach(() => {
    engine = new RulesEngine([topicRule, fallbackRule], 300000, 5);
    engine.setArticles(allArticles);
  });

  describe('Rule evaluation', () => {
    it('should evaluate and return recommendations', () => {
      const result = engine.evaluate(userContext);

      expect(result).toHaveProperty('articles');
      expect(result).toHaveProperty('firedRules');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('cacheHit');
      expect(Array.isArray(result.articles)).toBe(true);
      expect(Array.isArray(result.firedRules)).toBe(true);
    });

    it('should fire rules that match conditions', () => {
      const result = engine.evaluate(userContext);

      expect(result.firedRules.length).toBeGreaterThan(0);
      expect(result.firedRules).toContain('rule_ai_topic');
    });

    it('should apply rule actions to articles', () => {
      const result = engine.evaluate(userContext);

      // AI articles should be boosted, so they should appear first
      const hasAiArticles = result.articles.some(a => a.category === 'AI');
      expect(hasAiArticles).toBe(true);
    });

    it('should respect rule priority order', () => {
      const highPriorityRule: Rule = {
        id: 'rule_high_priority',
        name: 'High Priority',
        priority: 10,
        enabled: true,
        conditions: [{ type: 'always_match' }],
        actions: [{ type: 'sort_articles', field: 'date', order: 'ascending' }],
        metadata: { impressions: 0, clicks: 0, firing_count: 0 },
      };

      engine.addRule(highPriorityRule);

      const result = engine.evaluate(userContext);

      // High priority rule should fire first
      expect(result.firedRules[0]).toBe('rule_high_priority');
    });

    it('should handle disabled rules', () => {
      const disabledRule: Rule = {
        ...topicRule,
        enabled: false,
      };

      engine = new RulesEngine([disabledRule, fallbackRule], 300000, 5);
      engine.setArticles(allArticles);

      const result = engine.evaluate(userContext);

      expect(result.firedRules).not.toContain('rule_ai_topic');
      expect(result.firedRules).toContain('rule_fallback');
    });

    it('should always match "always_match" condition', () => {
      const emptyContext: UserContext = {
        favoriteCategories: [],
        readingHistory: [],
        bookmarks: [],
      };

      const result = engine.evaluate(emptyContext);

      // Fallback rule should always fire
      expect(result.firedRules).toContain('rule_fallback');
    });
  });

  describe('Performance', () => {
    it('should evaluate recommendations within performance budget', () => {
      const result = engine.evaluate(userContext);

      expect(result.executionTime).toBeLessThan(5); // 5ms budget
    });

    it('should execute multiple calls quickly', () => {
      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        engine.evaluate(userContext);
      }

      const totalTime = performance.now() - startTime;
      const avgTime = totalTime / 10;

      expect(avgTime).toBeLessThan(5);
    });
  });

  describe('Caching', () => {
    it('should cache results for same context', () => {
      const result1 = engine.evaluate(userContext);
      const result2 = engine.evaluate(userContext);

      expect(result2.cacheHit).toBe(true);
    });

    it('should return different cache key for different contexts', () => {
      const context1: UserContext = {
        favoriteCategories: ['AI'],
        readingHistory: [aiArticles[0]],
        bookmarks: [],
      };

      const context2: UserContext = {
        favoriteCategories: ['SCIENCE'],
        readingHistory: [scienceArticles[0]],
        bookmarks: [],
      };

      const result1 = engine.evaluate(context1);
      const result2 = engine.evaluate(context2);

      // Both should not be cache hits initially
      expect(result1.cacheHit).toBe(false);
      expect(result2.cacheHit).toBe(false);

      // Same context as result1 should hit cache
      const result1Again = engine.evaluate(context1);
      expect(result1Again.cacheHit).toBe(true);
    });

    it('should clear cache when articles change', () => {
      const result1 = engine.evaluate(userContext);
      expect(result1.cacheHit).toBe(false);

      const result2 = engine.evaluate(userContext);
      expect(result2.cacheHit).toBe(true);

      // Change articles - cache should clear
      engine.setArticles([...allArticles, roboticsArticles[0]]);

      const result3 = engine.evaluate(userContext);
      expect(result3.cacheHit).toBe(false);
    });
  });

  describe('Rule conditions', () => {
    it('should match topic_interest conditions', () => {
      const result = engine.evaluate(userContext);

      // User has AI in favoriteCategories, so AI rule should fire
      expect(result.firedRules).toContain('rule_ai_topic');
    });

    it('should handle empty reading history', () => {
      const emptyHistoryContext: UserContext = {
        favoriteCategories: ['AI'],
        readingHistory: [],
        bookmarks: [],
      };

      const result = engine.evaluate(emptyHistoryContext);

      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles.length).toBeGreaterThan(0);
    });

    it('should handle multiple favorite categories', () => {
      const multiContext: UserContext = {
        favoriteCategories: ['AI', 'SCIENCE', 'ROBOTICS'],
        readingHistory: [aiArticles[0], scienceArticles[0], roboticsArticles[0]],
        bookmarks: [],
      };

      const result = engine.evaluate(multiContext);

      expect(result.firedRules.length).toBeGreaterThan(0);
      expect(result.articles.length).toBeGreaterThan(0);
    });
  });

  describe('Rule actions', () => {
    it('should apply boost_articles action', () => {
      const result = engine.evaluate(userContext);

      // With AI boost, AI articles should be present
      const aiArticleCount = result.articles.filter(a => a.category === 'AI').length;
      expect(aiArticleCount).toBeGreaterThan(0);
    });

    it('should apply sort_articles action', () => {
      const sortedResult = engine.evaluate({
        favoriteCategories: [],
        readingHistory: [],
        bookmarks: [],
      });

      // Fallback rule sorts by date descending
      if (sortedResult.articles.length > 1) {
        const date1 = new Date(sortedResult.articles[0].date).getTime();
        const date2 = new Date(sortedResult.articles[1].date).getTime();
        expect(date1).toBeGreaterThanOrEqual(date2);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle no matching rules', () => {
      const strictContext: UserContext = {
        favoriteCategories: ['NONEXISTENT'],
        readingHistory: [],
        bookmarks: [],
      };

      const result = engine.evaluate(strictContext);

      // Fallback rule should catch this
      expect(result.firedRules).toContain('rule_fallback');
      expect(result.articles.length).toBeGreaterThan(0);
    });

    it('should handle empty articles', () => {
      engine.setArticles([]);

      const result = engine.evaluate(userContext);

      expect(Array.isArray(result.articles)).toBe(true);
      expect(result.articles.length).toBe(0);
    });

    it('should handle no rules', () => {
      const noRuleEngine = new RulesEngine([], 300000, 5);
      noRuleEngine.setArticles(allArticles);

      const result = noRuleEngine.evaluate(userContext);

      expect(result.articles.length).toBe(0);
      expect(result.firedRules.length).toBe(0);
    });
  });
});
