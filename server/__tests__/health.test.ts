import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from '../health';

describe('Health Check Endpoints', () => {
  const app = express();
  app.use(healthRouter);

  describe('GET /health', () => {
    it('should return 200 with ok status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health');
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('GET /status', () => {
    it('should return deployment status', async () => {
      const response = await request(app).get('/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('buildId');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include environment variable from NODE_ENV', async () => {
      const response = await request(app).get('/status');
      expect(['development', 'staging', 'production']).toContain(
        response.body.environment
      );
    });
  });

  describe('GET /version', () => {
    it('should return version information', async () => {
      const response = await request(app).get('/version');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('buildId');
      expect(response.body).toHaveProperty('buildDate');
    });

    it('should return valid version format', async () => {
      const response = await request(app).get('/version');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });
});
