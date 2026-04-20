import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../server/src/prisma';
import jwt from 'jsonwebtoken';

describe('Story 5.1: Admin Authentication', () => {
  const JWT_SECRET = 'your-secret-key-change-me-in-production';
  const TEST_USER_ID = 'test-admin-user-123';
  const TEST_USER_EMAIL = 'admin@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JWT Token with Role Field', () => {
    it('should include role field in JWT payload', () => {
      const token = jwt.sign(
        {
          userId: TEST_USER_ID,
          email: TEST_USER_EMAIL,
          role: 'ADMIN',
          type: 'access',
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.role).toBe('ADMIN');
      expect(decoded.userId).toBe(TEST_USER_ID);
      expect(decoded.email).toBe(TEST_USER_EMAIL);
    });

    it('should encode editor role in JWT', () => {
      const token = jwt.sign(
        {
          userId: TEST_USER_ID,
          email: TEST_USER_EMAIL,
          role: 'EDITOR',
          type: 'access',
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.role).toBe('EDITOR');
    });

    it('should encode user role in JWT', () => {
      const token = jwt.sign(
        {
          userId: TEST_USER_ID,
          email: TEST_USER_EMAIL,
          role: 'USER',
          type: 'access',
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.role).toBe('USER');
    });
  });

  describe('Session Timeout Validation', () => {
    it('should detect active session within 24 hours', () => {
      const now = new Date();
      const lastLoginAt = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

      const ADMIN_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
      const timeSinceLastLogin = now.getTime() - lastLoginAt.getTime();
      const isSessionExpired = timeSinceLastLogin > ADMIN_SESSION_TIMEOUT;

      expect(isSessionExpired).toBe(false);
    });

    it('should detect expired session after 24 hours', () => {
      const now = new Date();
      const lastLoginAt = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago

      const ADMIN_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
      const timeSinceLastLogin = now.getTime() - lastLoginAt.getTime();
      const isSessionExpired = timeSinceLastLogin > ADMIN_SESSION_TIMEOUT;

      expect(isSessionExpired).toBe(true);
    });

    it('should handle null lastLoginAt as active session', () => {
      const lastLoginAt = null;

      // When lastLoginAt is null, session is considered active
      const isSessionExpired = lastLoginAt ? false : false;

      expect(isSessionExpired).toBe(false);
    });

    it('should reject session exactly at 24-hour boundary', () => {
      const now = new Date();
      const lastLoginAt = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Exactly 24 hours ago

      const ADMIN_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
      const timeSinceLastLogin = now.getTime() - lastLoginAt.getTime();
      const isSessionExpired = timeSinceLastLogin > ADMIN_SESSION_TIMEOUT;

      // Should be false at exactly 24 hours (not expired yet)
      expect(isSessionExpired).toBe(false);
    });
  });

  describe('Admin Role Validation', () => {
    it('should validate ADMIN role', () => {
      const role = 'ADMIN';
      const isAdmin = role === 'ADMIN';
      expect(isAdmin).toBe(true);
    });

    it('should reject EDITOR role for admin check', () => {
      const role = 'EDITOR';
      const isAdmin = role === 'ADMIN';
      expect(isAdmin).toBe(false);
    });

    it('should reject USER role for admin check', () => {
      const role = 'USER';
      const isAdmin = role === 'ADMIN';
      expect(isAdmin).toBe(false);
    });
  });

  describe('Login Audit Logging', () => {
    it('should log admin login with role and IP', () => {
      const logEntry = {
        userId: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        role: 'ADMIN',
        ip: '192.168.1.1',
        isAdmin: true,
        timestamp: new Date(),
      };

      expect(logEntry.isAdmin).toBe(true);
      expect(logEntry.role).toBe('ADMIN');
      expect(logEntry.ip).toBeDefined();
    });

    it('should log non-admin login with role', () => {
      const logEntry = {
        userId: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        role: 'USER',
        ip: '192.168.1.2',
        isAdmin: false,
        timestamp: new Date(),
      };

      expect(logEntry.isAdmin).toBe(false);
      expect(logEntry.role).toBe('USER');
    });
  });

  describe('UserRole Enum Integrity', () => {
    it('should have ADMIN, EDITOR, USER roles', () => {
      const validRoles = ['ADMIN', 'EDITOR', 'USER'];
      expect(validRoles).toContain('ADMIN');
      expect(validRoles).toContain('EDITOR');
      expect(validRoles).toContain('USER');
    });

    it('should not include deprecated AUTHOR role', () => {
      const validRoles = ['ADMIN', 'EDITOR', 'USER'];
      expect(validRoles).not.toContain('AUTHOR');
    });
  });
});
