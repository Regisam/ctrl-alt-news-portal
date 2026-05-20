import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../../src/routes/auth.js';

// Mock Google OAuth services
let mockUserCounter = 0;
vi.mock('../../src/services/google-oauth.js', () => ({
  exchangeCodeForToken: vi.fn(async () => {
    mockUserCounter++;
    return {
      sub: `google-user-${mockUserCounter}`,
      email: `oauth${mockUserCounter}@example.com`,
      name: 'OAuth User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
    };
  }),
  getGoogleAuthUrl: vi.fn(() => 'https://accounts.google.com/o/oauth2/auth'),
  extractUserProfile: vi.fn((payload) => ({
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    email_verified: payload.email_verified,
  })),
}));

describe('OAuth Login History Tracking (Story 3.14 Phase 2)', () => {
  let app: express.Application;
  let testCounter = 0;

  beforeEach(() => {
    testCounter++;
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRouter);

    // Reset mock counter and configure mock for this test
    mockUserCounter = testCounter;
  });

  describe('OAuth login event tracking', () => {
    it('should track OAuth login event in login history', async () => {
      // First OAuth login (creates new user)
      const callbackRes = await request(app)
        .get('/api/auth/oauth/google/callback')
        .query({ code: `mock-auth-code-${testCounter}-1` })
        .expect(302);

      // Extract access token from redirect URL
      const redirectUrl = callbackRes.headers.location;
      const accessTokenMatch = redirectUrl?.match(/accessToken=([^&]+)/);
      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

      expect(accessToken).toBeTruthy();

      // Verify login history was recorded
      const historyRes = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(historyRes.body).toHaveProperty('success', true);
      expect(historyRes.body).toHaveProperty('history');
      expect(historyRes.body.history.length).toBeGreaterThan(0);

      // Verify login event has correct type
      const loginEvent = historyRes.body.history[0];
      expect(loginEvent).toHaveProperty('type', 'oauth');
      expect(loginEvent).toHaveProperty('sessionId');
      expect(loginEvent).toHaveProperty('timestamp');
      expect(loginEvent).toHaveProperty('browser');
      expect(loginEvent).toHaveProperty('os');
      expect(loginEvent).toHaveProperty('deviceType');
    });

    it('should include device information in OAuth login history', async () => {
      // OAuth login
      const callbackRes = await request(app)
        .get('/api/auth/oauth/google/callback')
        .query({ code: 'mock-auth-code' })
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        .expect(302);

      const redirectUrl = callbackRes.headers.location;
      const accessTokenMatch = redirectUrl?.match(/accessToken=([^&]+)/);
      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

      // Get login history
      const historyRes = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const loginEvent = historyRes.body.history[0];
      expect(loginEvent.browser).toBeTruthy();
      expect(loginEvent.os).toBeTruthy();
      expect(loginEvent.deviceType).toBeTruthy();
    });

    it('should track IP address in OAuth login event', async () => {
      const callbackRes = await request(app)
        .get('/api/auth/oauth/google/callback')
        .query({ code: 'mock-auth-code' })
        .expect(302);

      const redirectUrl = callbackRes.headers.location;
      const accessTokenMatch = redirectUrl?.match(/accessToken=([^&]+)/);
      const accessToken = accessTokenMatch ? accessTokenMatch[1] : null;

      const historyRes = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const loginEvent = historyRes.body.history[0];
      expect(loginEvent).toHaveProperty('ipAddress');
      expect(loginEvent.ipAddress).toBeTruthy();
    });

    it('should distinguish OAuth login from local login in history', async () => {
      // First register and login locally
      const email = `test-oauth-${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const localLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'password123456',
        });

      const localAccessToken = localLoginRes.body.accessToken;

      // Get local login history
      const localHistoryRes = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${localAccessToken}`)
        .expect(200);

      // Should have one local login
      expect(localHistoryRes.body.history[0].type).toBe('local');
    });

    it('should handle multiple OAuth login sessions', async () => {
      // Reset counter to ensure same user for both logins
      mockUserCounter = testCounter;

      // First OAuth login
      const res1 = await request(app)
        .get('/api/auth/oauth/google/callback')
        .query({ code: `mock-auth-code-${testCounter}-same-user` })
        .expect(302);

      const redirectUrl1 = res1.headers.location;
      const token1 = redirectUrl1?.match(/accessToken=([^&]+)/)?.[1];

      // Get history after first login
      const history1 = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(history1.body.history.length).toBe(1);

      // Second OAuth login - mock will increment counter, so set it back to same user
      mockUserCounter = testCounter; // Reset to same user

      const res2 = await request(app)
        .get('/api/auth/oauth/google/callback')
        .query({ code: `mock-auth-code-${testCounter}-same-user-2` })
        .expect(302);

      const redirectUrl2 = res2.headers.location;
      const token2 = redirectUrl2?.match(/accessToken=([^&]+)/)?.[1];

      // Get history after second login (same user)
      const history2 = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      // Should have two login events (both OAuth)
      expect(history2.body.history.length).toBe(2);
      expect(history2.body.history[0].type).toBe('oauth');
      expect(history2.body.history[1].type).toBe('oauth');

      // Verify most recent login is first (sorted by timestamp descending)
      expect(history2.body.history[0].timestamp).toBeGreaterThanOrEqual(
        history2.body.history[1].timestamp
      );
    });

    it('should include unique sessionId for each OAuth login', async () => {
      // Reset counter to ensure same user for both logins
      mockUserCounter = testCounter;

      // First OAuth login
      const res1 = await request(app)
        .get('/api/auth/oauth/google/callback')
        .query({ code: `mock-auth-code-${testCounter}-unique-session-1` })
        .expect(302);

      const token1 = res1.headers.location?.match(/accessToken=([^&]+)/)?.[1];

      // Reset counter to same user for second login
      mockUserCounter = testCounter;

      // Second OAuth login
      const res2 = await request(app)
        .get('/api/auth/oauth/google/callback')
        .query({ code: `mock-auth-code-${testCounter}-unique-session-2` })
        .expect(302);

      const token2 = res2.headers.location?.match(/accessToken=([^&]+)/)?.[1];

      const history = await request(app)
        .get('/api/auth/login-history')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const sessionIds = history.body.history.map((event: any) => event.sessionId);

      // Each session should have unique sessionId
      expect(sessionIds.length).toBe(new Set(sessionIds).size);
    });
  });
});
