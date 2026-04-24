// Integration tests for health check endpoints
// Tests basic server connectivity and health status endpoints

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import healthRouter from '../../health.js';

describe('Health Check Endpoints', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(healthRouter);
  });

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(['ok', 'healthy'].includes(response.body.status)).toBe(true);
    });

    it('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });

    it('should include timestamp or uptime in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for either timestamp or uptime property
      const hasTimestamp =
        response.body.timestamp !== undefined ||
        response.body.uptime !== undefined;
      expect(hasTimestamp).toBe(true);
    });
  });

  describe('Error scenarios', () => {
    it('should return 404 for non-existent health endpoint', async () => {
      await request(app)
        .get('/health/invalid')
        .expect(404);
    });

    it('should not accept DELETE on health endpoints', async () => {
      const response = await request(app)
        .delete('/health')
        .expect([404, 405]); // Either not found or method not allowed
    });
  });
});
