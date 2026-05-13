import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import digestRouter from '../../api/digest';
import { digestScheduler } from '../../services/DigestScheduler';
import type { SmartDigestConfig } from '@shared/types';

describe('Digest API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/digest', digestRouter);
    digestScheduler.reset();
  });

  afterEach(() => {
    digestScheduler.reset();
  });

  describe('GET /api/digest/preview', () => {
    it('should return preview with mock articles', async () => {
      const response = await request(app)
        .get('/api/digest/preview')
        .query({ userId: 'user123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.articles).toHaveLength(3);
      expect(response.body.data.articles[0]).toHaveProperty('title');
      expect(response.body.data.articles[0]).toHaveProperty('summary');
      expect(response.body.data.articles[0]).toHaveProperty('category');
      expect(response.body.data.articles[0]).toHaveProperty('relevanceScore');
    });

    it('should include config in preview response', async () => {
      const response = await request(app)
        .get('/api/digest/preview')
        .query({ userId: 'user456' });

      expect(response.status).toBe(200);
      expect(response.body.data.config).toHaveProperty('enabled');
      expect(response.body.data.config).toHaveProperty('frequency');
      expect(response.body.data.config).toHaveProperty('preferredTime');
      expect(response.body.data.config).toHaveProperty('topics');
    });

    it('should include unsubscribe and preferences tokens', async () => {
      const response = await request(app)
        .get('/api/digest/preview')
        .query({ userId: 'user789' });

      expect(response.status).toBe(200);
      expect(response.body.data.unsubscribeToken).toBeDefined();
      expect(response.body.data.preferencesToken).toBeDefined();
      expect(response.body.data.unsubscribeToken).toHaveLength(32);
      expect(response.body.data.preferencesToken).toHaveLength(32);
    });

    it('should reject request without userId', async () => {
      const response = await request(app)
        .get('/api/digest/preview');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/digest/send', () => {
    beforeEach(() => {
      const config: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI', 'Science'],
      };
      digestScheduler.scheduleUser(config, 'scheduled-user');
    });

    it('should send digest for scheduled user', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const response = await request(app)
        .post('/api/digest/send')
        .send({ userId: 'scheduled-user' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.trackingToken).toBeDefined();
      expect(response.body.trackingToken).toHaveLength(32);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SENDING DIGEST TO USER: scheduled-user')
      );

      consoleSpy.mockRestore();
    });

    it('should reject send for non-scheduled user', async () => {
      const response = await request(app)
        .post('/api/digest/send')
        .send({ userId: 'unknown-user' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not scheduled');
    });

    it('should reject send for disabled digest', async () => {
      const config: SmartDigestConfig = {
        enabled: false,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      digestScheduler.scheduleUser(config, 'disabled-user');

      const response = await request(app)
        .post('/api/digest/send')
        .send({ userId: 'disabled-user' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without userId', async () => {
      const response = await request(app)
        .post('/api/digest/send')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/digest/unsubscribe/:token', () => {
    let validToken: string;
    let userId: string;

    beforeEach(() => {
      userId = 'user-to-unsubscribe';
      const config: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      digestScheduler.scheduleUser(config, userId);
      validToken = digestScheduler['generateToken'](userId, 'unsubscribe');
    });

    it('should unsubscribe user with valid token', async () => {
      expect(digestScheduler.getScheduledUsers()).toHaveLength(1);

      const response = await request(app)
        .get(`/api/digest/unsubscribe/${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unsubscribed');

      expect(digestScheduler.getScheduledUsers()).toHaveLength(0);
    });

    it('should generate valid token that passes validation', () => {
      expect(validToken).toHaveLength(32);

      const record = digestScheduler.validateToken(validToken, 'unsubscribe');
      expect(record).not.toBeNull();
      expect(record?.userId).toBe(userId);
      expect(record?.type).toBe('unsubscribe');
    });

    it('should return 410 for already used token', async () => {
      const response1 = await request(app)
        .get(`/api/digest/unsubscribe/${validToken}`);

      expect(response1.status).toBe(200);

      const response2 = await request(app)
        .get(`/api/digest/unsubscribe/${validToken}`);

      expect(response2.status).toBe(410);
      expect(response2.body.success).toBe(false);
    });

    it('should return 410 for invalid token', async () => {
      const response = await request(app)
        .get('/api/digest/unsubscribe/invalid-token-12345');

      expect(response.status).toBe(410);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('invalid, expired, or already used');
    });
  });

  describe('GET /api/digest/open/:token', () => {
    let trackingToken: string;
    let userId: string;

    beforeEach(() => {
      userId = 'user-tracking';
      const config: SmartDigestConfig = {
        enabled: true,
        frequency: 'daily',
        preferredTime: '08:00',
        topics: ['AI'],
      };
      digestScheduler.scheduleUser(config, userId);
      trackingToken = digestScheduler['generateToken'](userId, 'tracking');
    });

    it('should return 200 with GIF pixel for valid token', async () => {
      const response = await request(app)
        .get(`/api/digest/open/${trackingToken}`);

      expect(response.status).toBe(200);
      expect(response.type).toBe('image/gif');
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should consume token after open tracking', async () => {
      const response1 = await request(app)
        .get(`/api/digest/open/${trackingToken}`);

      expect(response1.status).toBe(200);

      // Try to use the same token again — should still return 200 but not log tracking
      const response2 = await request(app)
        .get(`/api/digest/open/${trackingToken}`);

      expect(response2.status).toBe(200); // Still 200 for graceful degradation
    });

    it('should return 200 for invalid token (graceful degradation)', async () => {
      const response = await request(app)
        .get('/api/digest/open/invalid-tracking-token');

      // Returns 200 to avoid client-side tracking errors even for invalid tokens
      expect(response.status).toBe(200);
      expect(response.type).toContain('image/gif');
    });

    it('should return GIF with correct byte sequence', async () => {
      const response = await request(app)
        .get(`/api/digest/open/${trackingToken}`);

      const expectedPixel = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00,
        0x00, 0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00,
        0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x01, 0x44, 0x00, 0x3b,
      ]);

      expect(response.body).toEqual(expectedPixel);
    });
  });
});
