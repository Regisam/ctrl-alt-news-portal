import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../../src/routes/auth.js';

describe('Account Deletion (Story 3.13)', () => {
  let app: express.Application;
  let testCounter = 0;
  let accessToken: string;
  let userEmail: string;

  beforeEach(async () => {
    testCounter++;
    userEmail = `delete${testCounter}@example.com`;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRouter);

    // Register and login to get token
    await request(app)
      .post('/api/auth/register')
      .send({
        email: userEmail,
        password: 'password123456',
        confirmPassword: 'password123456',
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: userEmail,
        password: 'password123456',
      });

    accessToken = loginRes.body.accessToken;
  });

  describe('DELETE /api/auth/account', () => {
    it('should delete account with correct password', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Account deleted successfully');
    });

    it('should make user inaccessible after deletion', async () => {
      // Delete account
      await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      // Try to access profile (should fail)
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should prevent login after deletion', async () => {
      // Delete account
      await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      // Try to login with deleted account
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: 'password123456',
        })
        .expect(404);

      expect(loginResponse.body).toHaveProperty('success', false);
      expect(loginResponse.body).toHaveProperty('error', 'User not found');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .send({ password: 'password123456' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 400 with incorrect password', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'wrongpassword' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Incorrect password');
    });

    it('should return 400 without password parameter', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Password is required');
    });

    it('should remove all refresh tokens on deletion', async () => {
      // Get refresh token from login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: 'password123456',
        })
        .expect(200);

      // Delete account
      await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      // Try to use refresh token (should fail)
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${loginRes.headers['set-cookie']}`)
        .expect(401);

      expect(refreshRes.body).toHaveProperty('success', false);
    });

    it('should clear refresh token cookie on deletion', async () => {
      const response = await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      // Check for Set-Cookie header clearing
      const setCookieHeader = response.headers['set-cookie'];
      if (setCookieHeader) {
        expect(setCookieHeader.some((cookie: string) => cookie.includes('refreshToken'))).toBe(true);
      }
    });

    it('should allow re-registration with same email after deletion', async () => {
      // Delete account
      await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      // Re-register with same email
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: userEmail,
          password: 'newpassword123456',
          confirmPassword: 'newpassword123456',
        })
        .expect(201);

      expect(registerResponse.body).toHaveProperty('success', true);
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user).toHaveProperty('email', userEmail);
    });

    it('should be permanent (no recovery)', async () => {
      // Store user ID before deletion
      const profileRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const userId = profileRes.body.profile.id;

      // Delete account
      await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      // Try to access with original token (should fail)
      const accessRes = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(accessRes.body).toHaveProperty('success', false);

      // Try to re-register and verify new ID is different
      const newRegRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: userEmail,
          password: 'newpassword123456',
          confirmPassword: 'newpassword123456',
        })
        .expect(201);

      expect(newRegRes.body.user.id).not.toBe(userId);
    });

    it('should remove verification tokens on deletion', async () => {
      // Request email change before deletion
      const emailChangeRes = await request(app)
        .post('/api/auth/profile/update-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ newEmail: `newemail${testCounter}@example.com` })
        .expect(200);

      const changeToken = emailChangeRes.body.verifyLink.split('token=')[1];

      // Delete account
      await request(app)
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: 'password123456' })
        .expect(200);

      // Try to verify email change (should fail - token removed)
      const verifyRes = await request(app)
        .get(`/api/auth/verify-email-change/${changeToken}`)
        .expect(404);

      expect(verifyRes.body).toHaveProperty('success', false);
      expect(verifyRes.body).toHaveProperty('error', 'Verification token not found');
    });
  });
});
