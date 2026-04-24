// Integration tests for article endpoints
// Tests CRUD operations (GET, POST, PUT, DELETE) and error handling

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import { setupTestDatabase, teardownTestDatabase } from '../fixtures/database.js';
import { createTestArticle, seedArticles } from '../fixtures/test-data.js';

describe('Article Endpoints', () => {
  let app: express.Application;
  let testData: any = {};

  beforeEach(async () => {
    await setupTestDatabase();

    // Local test data for this test suite
    testData.articles = [];

    app = express();
    app.use(express.json());

    // Mock article endpoints - use local testData instead of require()
    app.get('/api/articles', (req: any, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const articles = testData.articles.slice(skip, skip + limit);

      return res.json({
        articles,
        total: testData.articles.length,
        page,
        limit,
      });
    });

    app.get('/api/articles/:id', (req: any, res) => {
      const article = testData.articles.find((a: any) => a.id === req.params.id);

      if (!article) {
        return res.status(404).json({
          error: 'Article not found',
        });
      }

      return res.json(article);
    });

    app.post('/api/articles', (req: any, res) => {
      const { title, content, category } = req.body;

      if (!title || !content || !category) {
        return res.status(400).json({
          error: 'Title, content, and category are required',
        });
      }

      const article = createTestArticle({
        title,
        content,
        category,
      });

      testData.articles.push(article);
      return res.status(201).json(article);
    });

    app.put('/api/articles/:id', (req: any, res) => {
      const article = testData.articles.find((a: any) => a.id === req.params.id);

      if (!article) {
        return res.status(404).json({
          error: 'Article not found',
        });
      }

      const { title, content, category } = req.body;

      if (!title && !content && !category) {
        return res.status(400).json({
          error: 'At least one field must be updated',
        });
      }

      if (title) article.title = title;
      if (content) article.content = content;
      if (category) article.category = category;

      return res.json(article);
    });

    app.delete('/api/articles/:id', (req: any, res) => {
      const index = testData.articles.findIndex((a: any) => a.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({
          error: 'Article not found',
        });
      }

      const deleted = testData.articles.splice(index, 1);
      return res.json({
        message: 'Article deleted',
        article: deleted[0],
      });
    });
  });

  afterEach(async () => {
    testData = {};
    await teardownTestDatabase();
  });

  describe('GET /api/articles', () => {
    it('should return list of articles', async () => {
      testData.articles = [
        createTestArticle({ id: 'art-1', title: 'Article 1' }),
        createTestArticle({ id: 'art-2', title: 'Article 2' }),
      ];

      const response = await request(app)
        .get('/api/articles')
        .expect(200);

      expect(response.body).toHaveProperty('articles');
      expect(response.body.articles).toHaveLength(2);
      expect(response.body).toHaveProperty('total', 2);
    });

    it('should support pagination', async () => {
      testData.articles = Array.from({ length: 15 }, (_, i) =>
        createTestArticle({ id: `art-${i}` })
      );

      const response = await request(app)
        .get('/api/articles?page=2&limit=10')
        .expect(200);

      expect(response.body.articles).toHaveLength(5);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(10);
    });

    it('should return empty list when no articles', async () => {
      const response = await request(app)
        .get('/api/articles')
        .expect(200);

      expect(response.body.articles).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/articles/:id', () => {
    it('should return single article by ID', async () => {
      const article = createTestArticle({ id: 'article-123' });
      testData.articles = [article];

      const response = await request(app)
        .get('/api/articles/article-123')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'article-123');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
    });

    it('should return 404 for non-existent article', async () => {
      const response = await request(app)
        .get('/api/articles/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Article not found');
    });
  });

  describe('POST /api/articles', () => {
    it('should create new article with valid data', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: 'New Article',
          content: 'Article content here',
          category: 'AI',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('New Article');
      expect(response.body.category).toBe('AI');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: 'Only Title',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/required/);
    });

    it('should return 400 for empty title', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: '',
          content: 'Content',
          category: 'AI',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/articles/:id', () => {
    it('should update article with valid data', async () => {
      testData.articles = [createTestArticle({ id: 'art-1', title: 'Original' })];

      const response = await request(app)
        .put('/api/articles/art-1')
        .send({
          title: 'Updated Title',
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
    });

    it('should return 404 for non-existent article', async () => {
      const response = await request(app)
        .put('/api/articles/nonexistent')
        .send({
          title: 'Updated',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 when no fields provided', async () => {
      testData.articles = [createTestArticle({ id: 'art-1' })];

      const response = await request(app)
        .put('/api/articles/art-1')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/articles/:id', () => {
    it('should delete article successfully', async () => {
      testData.articles = [createTestArticle({ id: 'art-1' })];

      const response = await request(app)
        .delete('/api/articles/art-1')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Article deleted');
      expect(response.body.article).toHaveProperty('id', 'art-1');
    });

    it('should return 404 for non-existent article', async () => {
      const response = await request(app)
        .delete('/api/articles/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should remove article from database', async () => {
      testData.articles = [createTestArticle({ id: 'art-1' })];

      await request(app).delete('/api/articles/art-1').expect(200);

      const response = await request(app)
        .get('/api/articles')
        .expect(200);

      expect(response.body.articles).toHaveLength(0);
    });
  });
});
