// Integration tests for search and filtering endpoints
// Tests query parameters, filtering, and response formatting

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import { setupTestDatabase, teardownTestDatabase } from '../fixtures/database.js';
import { createTestArticle } from '../fixtures/test-data.js';

describe('Search & Filter Endpoints', () => {
  let app: express.Application;
  let testData: any = {};

  beforeEach(async () => {
    await setupTestDatabase();

    testData.articles = [];

    app = express();
    app.use(express.json());

    // Mock search endpoint
    app.get('/api/search', (req: any, res) => {
      const query = (req.query.q || '').toLowerCase();
      const category = req.query.category;
      const sortBy = req.query.sort || 'date';

      let results = testData.articles;

      // Filter by search query
      if (query) {
        results = results.filter(
          (a: any) =>
            a.title.toLowerCase().includes(query) ||
            a.content.toLowerCase().includes(query)
        );
      }

      // Filter by category
      if (category) {
        results = results.filter(
          (a: any) => a.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Sort results
      if (sortBy === 'date') {
        results.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === 'title') {
        results.sort((a: any, b: any) => a.title.localeCompare(b.title));
      }

      return res.json({
        query,
        category: category || null,
        results,
        count: results.length,
      });
    });

    // Mock articles by category endpoint
    app.get('/api/articles/category/:category', (req: any, res) => {
      const category = req.params.category;

      const articles = testData.articles.filter(
        (a: any) => a.category.toLowerCase() === category.toLowerCase()
      );

      if (articles.length === 0) {
        return res.status(404).json({
          error: `No articles found for category: ${category}`,
        });
      }

      return res.json({
        category,
        articles,
        count: articles.length,
      });
    });
  });

  afterEach(async () => {
    testData = {};
    await teardownTestDatabase();
  });

  describe('GET /api/search', () => {
    it('should search articles by title', async () => {
      testData.articles = [
        createTestArticle({
          id: 'art-1',
          title: 'React Tutorial',
          category: 'AI',
        }),
        createTestArticle({
          id: 'art-2',
          title: 'Vue Guide',
          category: 'AI',
        }),
      ];

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'React' })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'react');
      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].title).toMatch(/React/);
    });

    it('should search articles by content', async () => {
      testData.articles = [
        createTestArticle({
          id: 'art-1',
          title: 'First Article',
          content: 'This is about AI and machine learning',
          category: 'AI',
        }),
        createTestArticle({
          id: 'art-2',
          title: 'Second Article',
          content: 'This is about robotics',
          category: 'Robotics',
        }),
      ];

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'machine learning' })
        .expect(200);

      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].id).toBe('art-1');
    });

    it('should filter by category', async () => {
      testData.articles = [
        createTestArticle({ id: 'art-1', category: 'AI' }),
        createTestArticle({ id: 'art-2', category: 'Science' }),
        createTestArticle({ id: 'art-3', category: 'AI' }),
      ];

      const response = await request(app)
        .get('/api/search')
        .query({ category: 'AI' })
        .expect(200);

      expect(response.body.results).toHaveLength(2);
      expect(response.body.category).toBe('AI');
    });

    it('should combine search query and category filter', async () => {
      testData.articles = [
        createTestArticle({
          id: 'art-1',
          title: 'React in AI',
          category: 'AI',
        }),
        createTestArticle({
          id: 'art-2',
          title: 'React Guide',
          category: 'Science',
        }),
        createTestArticle({
          id: 'art-3',
          title: 'Python for AI',
          category: 'AI',
        }),
      ];

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'React', category: 'AI' })
        .expect(200);

      expect(response.body.results).toHaveLength(1);
      expect(response.body.results[0].title).toMatch(/React/);
    });

    it('should sort results by date descending', async () => {
      testData.articles = [
        createTestArticle({
          id: 'art-1',
          title: 'Older Article',
          createdAt: new Date('2026-04-20'),
        }),
        createTestArticle({
          id: 'art-2',
          title: 'Newer Article',
          createdAt: new Date('2026-04-24'),
        }),
      ];

      const response = await request(app)
        .get('/api/search')
        .query({ sort: 'date' })
        .expect(200);

      expect(response.body.results[0].id).toBe('art-2');
      expect(response.body.results[1].id).toBe('art-1');
    });

    it('should sort results by title alphabetically', async () => {
      testData.articles = [
        createTestArticle({ id: 'art-1', title: 'Zebra Article' }),
        createTestArticle({ id: 'art-2', title: 'Apple Article' }),
        createTestArticle({ id: 'art-3', title: 'Banana Article' }),
      ];

      const response = await request(app)
        .get('/api/search')
        .query({ sort: 'title' })
        .expect(200);

      expect(response.body.results[0].title).toMatch(/Apple/);
      expect(response.body.results[1].title).toMatch(/Banana/);
      expect(response.body.results[2].title).toMatch(/Zebra/);
    });

    it('should return empty results for non-matching query', async () => {
      testData.articles = [
        createTestArticle({ id: 'art-1', title: 'React Tutorial' }),
      ];

      const response = await request(app)
        .get('/api/search')
        .query({ q: 'NonExistent' })
        .expect(200);

      expect(response.body.results).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });
  });

  describe('GET /api/articles/category/:category', () => {
    it('should return articles for valid category', async () => {
      testData.articles = [
        createTestArticle({ id: 'art-1', category: 'AI' }),
        createTestArticle({ id: 'art-2', category: 'Science' }),
        createTestArticle({ id: 'art-3', category: 'AI' }),
      ];

      const response = await request(app)
        .get('/api/articles/category/AI')
        .expect(200);

      expect(response.body).toHaveProperty('category', 'AI');
      expect(response.body.articles).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('should be case-insensitive', async () => {
      testData.articles = [
        createTestArticle({ id: 'art-1', category: 'AI' }),
      ];

      const response = await request(app)
        .get('/api/articles/category/ai')
        .expect(200);

      expect(response.body.articles).toHaveLength(1);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/articles/category/NonExistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/No articles found/);
    });
  });
});
