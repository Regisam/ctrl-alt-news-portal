import { describe, it, expect } from 'vitest';
import { RulesEngine, type Rule, type UserContext } from '@/lib/rules-engine';
import { aiArticles, scienceArticles, roboticsArticles, trendingArticles } from '@/lib/data';

/**
 * Performance benchmarking tests for RulesEngine
 * Ensures recommendations are evaluated within acceptable time bounds
 */
describe('RulesEngine Performance', () => {
  const allArticles = [...aiArticles, ...scienceArticles, ...roboticsArticles, ...trendingArticles];

  const rules: Rule[] = [
    {
      id: 'rule_ai',
      name: 'AI Topic',
      priority: 100,
      enabled: true,
      conditions: [{ type: 'topic_interest', field: 'favoriteCategories', value: 'AI' }],
      actions: [{ type: 'boost_articles', field: 'category', value: 'AI', weight: 2.0 }],
      metadata: { impressions: 0, clicks: 0, firing_count: 0 },
    },
    {
      id: 'rule_science',
      name: 'Science Topic',
      priority: 101,
      enabled: true,
      conditions: [{ type: 'topic_interest', field: 'favoriteCategories', value: 'SCIENCE' }],
      actions: [{ type: 'boost_articles', field: 'category', value: 'SCIENCE', weight: 2.0 }],
      metadata: { impressions: 0, clicks: 0, firing_count: 0 },
    },
    {
      id: 'rule_robotics',
      name: 'Robotics Topic',
      priority: 102,
      enabled: true,
      conditions: [{ type: 'topic_interest', field: 'favoriteCategories', value: 'ROBOTICS' }],
      actions: [{ type: 'boost_articles', field: 'category', value: 'ROBOTICS', weight: 2.0 }],
      metadata: { impressions: 0, clicks: 0, firing_count: 0 },
    },
    {
      id: 'rule_default',
      name: 'Default Chronological',
      priority: 999,
      enabled: true,
      conditions: [{ type: 'always_match' }],
      actions: [{ type: 'sort_articles', field: 'date', order: 'descending' }],
      metadata: { impressions: 0, clicks: 0, firing_count: 0 },
    },
  ];

  describe('Single recommendation evaluation', () => {
    it('should evaluate single recommendation in < 5ms', () => {
      const engine = new RulesEngine(rules, 300000, 5);
      engine.setArticles(allArticles);

      const userContext: UserContext = {
        favoriteCategories: ['AI'],
        readingHistory: [aiArticles[0], aiArticles[1]],
        bookmarks: [aiArticles[0].id.toString()],
      };

      const startTime = performance.now();
      const result = engine.evaluate(userContext);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5);
      expect(result.executionTime).toBeLessThan(5);
    });

    it('should evaluate with large article list in < 5ms', () => {
      const engine = new RulesEngine(rules, 300000, 5);
      // Duplicate articles to simulate larger catalog
      const largeList = [
        ...allArticles,
        ...allArticles,
        ...allArticles,
      ];
      engine.setArticles(largeList);

      const userContext: UserContext = {
        favoriteCategories: ['AI', 'SCIENCE'],
        readingHistory: allArticles.slice(0, 5),
        bookmarks: allArticles.slice(0, 3).map((a) => a.id.toString()),
      };

      const startTime = performance.now();
      const result = engine.evaluate(userContext);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5);
      expect(result.executionTime).toBeLessThan(5);
    });

    it('should evaluate with many rules in < 5ms', () => {
      const manyRules: Rule[] = [];
      for (let i = 0; i < 20; i++) {
        manyRules.push({
          id: `rule_${i}`,
          name: `Rule ${i}`,
          priority: 100 - i,
          enabled: i % 3 !== 0, // Disable some rules
          conditions: [{ type: 'always_match' }],
          actions: [{ type: 'sort_articles', field: 'date', order: 'descending' }],
          metadata: { impressions: 0, clicks: 0, firing_count: 0 },
        });
      }

      const engine = new RulesEngine(manyRules, 300000, 5);
      engine.setArticles(allArticles);

      const userContext: UserContext = {
        favoriteCategories: ['AI'],
        readingHistory: [aiArticles[0]],
        bookmarks: [],
      };

      const startTime = performance.now();
      const result = engine.evaluate(userContext);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5);
      expect(result.executionTime).toBeLessThan(5);
    });
  });

  describe('Cached evaluation performance', () => {
    it('should use cache and return in < 1ms', () => {
      const engine = new RulesEngine(rules, 300000, 5);
      engine.setArticles(allArticles);

      const userContext: UserContext = {
        favoriteCategories: ['AI'],
        readingHistory: [aiArticles[0]],
        bookmarks: [],
      };

      // First evaluation (cache miss)
      engine.evaluate(userContext);

      // Second evaluation (cache hit)
      const startTime = performance.now();
      const result = engine.evaluate(userContext);
      const duration = performance.now() - startTime;

      expect(result.cacheHit).toBe(true);
      expect(duration).toBeLessThan(1);
      expect(result.executionTime).toBeLessThan(1);
    });

    it('should cache multiple different contexts efficiently', () => {
      const engine = new RulesEngine(rules, 300000, 5);
      engine.setArticles(allArticles);

      const contexts: UserContext[] = [
        {
          favoriteCategories: ['AI'],
          readingHistory: [aiArticles[0]],
          bookmarks: [],
        },
        {
          favoriteCategories: ['SCIENCE'],
          readingHistory: [scienceArticles[0]],
          bookmarks: [],
        },
        {
          favoriteCategories: ['ROBOTICS'],
          readingHistory: [roboticsArticles[0]],
          bookmarks: [],
        },
      ];

      // Populate cache
      contexts.forEach((ctx) => engine.evaluate(ctx));

      // Re-evaluate all contexts (should hit cache)
      const startTime = performance.now();
      contexts.forEach((ctx) => {
        const result = engine.evaluate(ctx);
        expect(result.cacheHit).toBe(true);
      });
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(3);
    });
  });

  describe('Batch evaluation performance', () => {
    it('should evaluate 100 times in reasonable time', () => {
      const engine = new RulesEngine(rules, 300000, 5);
      engine.setArticles(allArticles);

      const userContext: UserContext = {
        favoriteCategories: ['AI', 'SCIENCE'],
        readingHistory: aiArticles.slice(0, 3),
        bookmarks: [aiArticles[0].id.toString()],
      };

      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        engine.evaluate(userContext);
      }
      const totalDuration = performance.now() - startTime;

      const avgDuration = totalDuration / 100;

      // Average should be very fast due to caching
      expect(avgDuration).toBeLessThan(1);
    });
  });

  describe('Memory efficiency', () => {
    it('should not cause memory issues with large article sets', () => {
      const engine = new RulesEngine(rules, 300000, 5);

      const largeList = [];
      for (let i = 0; i < 1000; i++) {
        largeList.push({
          ...aiArticles[0],
          id: 10000 + i,
          title: { en: `Article ${i}`, pt: `Artigo ${i}` },
        });
      }

      // Should not throw or degrade significantly
      expect(() => {
        engine.setArticles(largeList);

        const result = engine.evaluate({
          favoriteCategories: ['AI'],
          readingHistory: largeList.slice(0, 10),
          bookmarks: largeList.slice(0, 5).map((a) => a.id.toString()),
        });

        expect(result.executionTime).toBeLessThan(10); // Slightly more lenient for large dataset
      }).not.toThrow();
    });
  });

  describe('Performance budget compliance', () => {
    it('should respect 5ms performance budget for all scenarios', () => {
      const scenarios = [
        {
          name: 'Single user, few articles',
          articles: allArticles,
          context: {
            favoriteCategories: ['AI'],
            readingHistory: [aiArticles[0]],
            bookmarks: [],
          },
        },
        {
          name: 'Multiple interests, many articles',
          articles: [...allArticles, ...allArticles, ...allArticles],
          context: {
            favoriteCategories: ['AI', 'SCIENCE', 'ROBOTICS'],
            readingHistory: allArticles,
            bookmarks: allArticles.slice(0, 5).map((a) => a.id.toString()),
          },
        },
        {
          name: 'Cold start (no history)',
          articles: allArticles,
          context: {
            favoriteCategories: [],
            readingHistory: [],
            bookmarks: [],
          },
        },
      ];

      scenarios.forEach(({ name, articles, context }) => {
        const engine = new RulesEngine(rules, 300000, 5);
        engine.setArticles(articles);

        const result = engine.evaluate(context);

        expect(result.executionTime).toBeLessThan(5);
      });
    });
  });
});
