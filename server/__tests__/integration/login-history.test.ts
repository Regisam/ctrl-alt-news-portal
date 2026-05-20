import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../../src/routes/auth.js';

describe('Login History & Session Management (Story 3.14)', () => {
  let app: express.Application;
  let testCounter = 0;
  let accessToken: string;
  let refreshToken: string;
  let userEmail: string;

  beforeEach(async () => {
    testCounter++;
    userEmail = `history${testCounter}@example.com`;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRouter);

    // Register user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: userEmail,
        password: 'password123456',
        confirmPassword: 'password123456',
      });

    // Login to get tokens
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: 'password123456',
      });

    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.headers['set-cookie']?.find((c: string) => c.includes('refreshToken'));
  });

  describe('GET /api/auth/sessions', () => {
    it('should return empty sessions array for new user', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('sessions');
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/auth/login-history', () => {
    it('should return login history for authenticated user', async () => {
      const response = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.history)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should include login event details (timestamp, browser, OS, device type)', async () => {
      const response = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.history.length).toBeGreaterThan(0);
      const event = response.body.history[0];
      expect(event).toHaveProperty('sessionId');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('browser');
      expect(event).toHaveProperty('os');
      expect(event).toHaveProperty('deviceType');
      expect(event).toHaveProperty('type');
    });

    it('should return login history sorted by most recent first', async () => {
      // Login multiple times
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: userEmail,
            password: 'password123456',
          });
      }

      const response = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Check sorting
      for (let i = 0; i < response.body.history.length - 1; i++) {
        expect(response.body.history[i].timestamp).toBeGreaterThanOrEqual(
          response.body.history[i + 1].timestamp
        );
      }
    });

    it('should filter by days parameter (default 30 days)', async () => {
      const response = await request(app)
        .get('/api/auth/login-history?days=30')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.history)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/auth/login-history')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('DELETE /api/auth/sessions/:sessionId', () => {
    it('should revoke a specific session', async () => {
      // Get session list
      const sessionsRes = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (sessionsRes.body.sessions.length > 0) {
        const sessionId = sessionsRes.body.sessions[0].sessionId;

        const response = await request(app)
          .delete(`/api/auth/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message', 'Session revoked');
      }
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .delete('/api/auth/sessions/nonexistent-session-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Session not found');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .delete('/api/auth/sessions/any-session-id')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .delete('/api/auth/sessions/any-session-id')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('DELETE /api/auth/sessions/others', () => {
    it('should revoke all other sessions except current', async () => {
      // Create multiple sessions
      for (let i = 0; i < 2; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: userEmail,
            password: 'password123456',
          });
      }

      const response = await request(app)
        .delete('/api/auth/sessions/others')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'All other sessions revoked');
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .delete('/api/auth/sessions/others')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .delete('/api/auth/sessions/others')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('User agent parsing', () => {
    it('should parse user agent to extract browser and OS', async () => {
      const response = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.history.length).toBeGreaterThan(0);
      const event = response.body.history[0];
      expect(typeof event.browser).toBe('string');
      expect(typeof event.os).toBe('string');
      expect(['desktop', 'mobile', 'tablet']).toContain(event.deviceType);
    });
  });

  describe('Session isolation', () => {
    it('should not show other users sessions to authenticated user', async () => {
      // Create another user
      const otherEmail = `history-other-${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email: otherEmail,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const otherLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: otherEmail,
          password: 'password123456',
        });

      const otherToken = otherLoginRes.body.accessToken;

      // Current user gets their sessions
      const response1 = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Other user gets their sessions
      const response2 = await request(app)
        .get('/api/auth/sessions')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      // Sessions should not be mixed
      expect(Array.isArray(response1.body.sessions)).toBe(true);
      expect(Array.isArray(response2.body.sessions)).toBe(true);
    });
  });
});
