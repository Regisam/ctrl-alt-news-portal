import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../../src/routes/auth.js';

describe('User Profile Management (Story 3.12)', () => {
  let app: express.Application;
  let testCounter = 0;
  let accessToken: string;
  let userEmail: string;

  beforeEach(async () => {
    testCounter++;
    userEmail = `profile${testCounter}@example.com`;

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

  describe('GET /api/auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('id');
      expect(response.body.profile).toHaveProperty('email', userEmail);
      expect(response.body.profile).toHaveProperty('emailVerified');
      expect(response.body.profile).toHaveProperty('createdAt');
      expect(response.body.profile).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when no auth token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('POST /api/auth/profile/update-email', () => {
    it('should send email verification link for new email', async () => {
      const newEmail = `updated${testCounter}@example.com`;
      const response = await request(app)
        .post('/api/auth/profile/update-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ newEmail })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('verifyLink');
      expect(response.body.verifyLink).toMatch(/verify-email-change\?token=/);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-email')
        .send({ newEmail: 'test@example.com' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ newEmail: 'not-an-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid email format');
    });

    it('should return 409 for email already in use', async () => {
      // Register another user with different email
      const otherEmail = `other${testCounter}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email: otherEmail,
          password: 'password123456',
          confirmPassword: 'password123456',
        });

      // Try to update to that email
      const response = await request(app)
        .post('/api/auth/profile/update-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ newEmail: otherEmail })
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Email already in use');
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'New email is required');
    });
  });

  describe('GET /api/auth/verify-email-change/:token', () => {
    it('should verify email change with valid token', async () => {
      const newEmail = `verified${testCounter}@example.com`;

      // Request email change
      const changeRes = await request(app)
        .post('/api/auth/profile/update-email')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ newEmail })
        .expect(200);

      const token = changeRes.body.verifyLink.split('token=')[1];

      // Verify email change
      const response = await request(app)
        .get(`/api/auth/verify-email-change/${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Email verified successfully');
    });

    it('should return 404 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email-change/invalid-token')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Verification token not found');
    });
  });

  describe('POST /api/auth/profile/update-password', () => {
    it('should update password with valid current password', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'password123456',
          newPassword: 'newpassword123456',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');
    });

    it('should allow login with new password after update', async () => {
      // Update password
      await request(app)
        .post('/api/auth/profile/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'password123456',
          newPassword: 'newpassword123456',
        })
        .expect(200);

      // Login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: userEmail,
          password: 'newpassword123456',
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('success', true);
      expect(loginRes.body).toHaveProperty('accessToken');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-password')
        .send({
          currentPassword: 'password123456',
          newPassword: 'newpassword123456',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 with incorrect current password', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123456',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Current password is incorrect');
    });

    it('should return 400 for password < 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'password123456',
          newPassword: 'short',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Password must be at least 8 characters');
    });

    it('should return 400 if new password same as current', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'password123456',
          newPassword: 'password123456',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'New password cannot be same as current');
    });
  });

  describe('POST /api/auth/profile/update-name', () => {
    it('should update user name', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-name')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'John Doe' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('name', 'John Doe');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-name')
        .send({ name: 'John Doe' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-name')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Name must not be empty');
    });

    it('should return 400 for name > 100 chars', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app)
        .post('/api/auth/profile/update-name')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: longName })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Name cannot exceed 100 characters');
    });
  });

  describe('POST /api/auth/profile/update-avatar', () => {
    it('should update avatar with valid URL', async () => {
      const avatarUrl = 'https://example.com/avatar.jpg';
      const response = await request(app)
        .post('/api/auth/profile/update-avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ avatarUrl })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('avatar', avatarUrl);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-avatar')
        .send({ avatarUrl: 'https://example.com/avatar.jpg' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ avatarUrl: 'not-a-url' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid URL format');
    });

    it('should return 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/auth/profile/update-avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Avatar URL is required');
    });
  });
});
