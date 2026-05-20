import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../../src/routes/auth.js';

describe('Password Reset System (Story 3.11)', () => {
  let app: express.Application;
  let testCounter = 0;

  beforeEach(async () => {
    testCounter++;
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRouter);
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should generate reset token for existing email', async () => {
      const email = `test${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('resetLink');
      expect(response.body).toHaveProperty('message');
      expect(response.body.resetLink).toMatch(/reset-password\?token=/);
    });

    it('should return 404 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Email is required');
    });

    it('should enforce 5-minute rate limit', async () => {
      const email = `ratelimit${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      // First request should succeed
      const firstResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      expect(firstResponse.body).toHaveProperty('success', true);

      // Second request should be rate limited
      const secondResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(400);

      expect(secondResponse.body).toHaveProperty('success', false);
      expect(secondResponse.body.error).toMatch(/Too many requests/);
    });
  });

  describe('GET /api/auth/reset-password/:token', () => {
    it('should validate token successfully', async () => {
      const email = `validate${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      const resetToken = resetResponse.body.resetLink.split('token=')[1];

      const response = await request(app)
        .get(`/api/auth/reset-password/${resetToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('email', email);
    });

    it('should return 404 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/reset-password/invalid-token')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('valid', false);
      expect(response.body).toHaveProperty('error', 'Reset token not found');
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    it('should reset password with valid token', async () => {
      const email = `reset${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      const resetToken = resetResponse.body.resetLink.split('token=')[1];

      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Password reset successfully');
    });

    it('should allow login with new password after reset', async () => {
      const email = `resetlogin${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      const resetToken = resetResponse.body.resetLink.split('token=')[1];

      // Reset password
      await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      // Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'newpassword123',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should prevent token reuse after reset', async () => {
      const email = `noreuse${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      const resetToken = resetResponse.body.resetLink.split('token=')[1];

      // First reset
      await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'newpassword123' })
        .expect(200);

      // Second attempt with same token
      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'anotherpassword123' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Reset token not found');
    });

    it('should return 400 for password < 8 characters', async () => {
      const email = `shortpw${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      const resetToken = resetResponse.body.resetLink.split('token=')[1];

      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'short' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Password must be at least 8 characters');
    });

    it('should return 400 for missing password', async () => {
      const email = `nopw${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      const resetResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);

      const resetToken = resetResponse.body.resetLink.split('token=')[1];

      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Password is required');
    });

    it('should return 404 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password/invalid-token')
        .send({ password: 'newpassword123' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Reset token not found');
    });
  });
});
