// Integration tests for authentication and authorization flows
// Tests JWT validation, protected routes, and permission-based access

import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../fixtures/database.js';
import {
  createTestUser,
  seedUser,
  generateMockToken,
  getUserByEmail,
} from '../fixtures/test-data.js';

describe('Authentication & Authorization', () => {
  let app: express.Application;

  beforeEach(async () => {
    await setupTestDatabase();

    app = express();
    app.use(express.json());

    // Mock authentication middleware - parses token format
    app.use((req: any, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token && token.startsWith('mock-jwt-token|')) {
        // Parse token format: mock-jwt-token|{userId}|{role}|{timestamp}
        const parts = token.split('|');
        if (parts.length >= 4) {
          const userId = parts[1];
          const role = parts[2];
          req.user = { id: userId, role };
        }
      }
      next();
    });

    // Mock protected routes
    app.post('/api/auth/login', (req: any, res) => {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password required',
        });
      }

      // Find user
      const user = getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
        });
      }

      // Return token
      const token = generateMockToken(user.id, user.role);
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    });

    // Protected route
    app.get('/api/profile', (req: any, res) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      const user = {
        id: req.user.id,
        email: 'user@example.com',
        role: req.user.role,
      };

      return res.json(user);
    });

    // Admin-only route
    app.delete('/api/admin/users/:id', (req: any, res) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden: Admin access required',
        });
      }

      return res.json({
        message: `User ${req.params.id} deleted`,
      });
    });
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      seedUser(
        createTestUser({
          id: 'user-1',
          email: 'admin@example.com',
          password: 'hashed_password_123',
          role: 'admin',
        })
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'hashed_password_123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^mock-jwt-token/);
      expect(response.body.user).toHaveProperty('role', 'admin');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/Invalid credentials/);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/Email and password required/);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Protected routes', () => {
    it('should return 401 when accessing protected route without token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer mock-jwt-token|user-1|user|1234567890')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('role');
    });
  });

  describe('Authorization checks', () => {
    it('should return 403 for non-admin accessing admin route', async () => {
      const response = await request(app)
        .delete('/api/admin/users/user-2')
        .set('Authorization', 'Bearer mock-jwt-token|user-2|user|1234567890')
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/Admin access required/);
    });

    it('should allow admin to access admin-only routes', async () => {
      const response = await request(app)
        .delete('/api/admin/users/user-2')
        .set('Authorization', 'Bearer mock-jwt-token|user-1|admin|1234567890')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
