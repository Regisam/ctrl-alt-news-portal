import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../../lib/authService.js';
import { testSetup } from '../setup.js';

describe('AuthService', () => {
  // AC2: Password hashing tests
  describe('Password Hashing', () => {
    it('should hash password successfully', async () => {
      const password = 'TestPass123!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const password = 'TestPass123!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPass123!';
      const wrongPassword = 'WrongPass456!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  // AC4: JWT token tests
  describe('JWT Tokens', () => {
    it('should generate valid token', () => {
      const userId = 'test-user-1';
      const email = 'test@example.com';

      const token = authService.generateToken(userId, email);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should verify valid token', () => {
      const userId = 'test-user-1';
      const email = 'test@example.com';

      const token = authService.generateToken(userId, email);
      const payload = authService.verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(userId);
      expect(payload?.email).toBe(email);
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const payload = authService.verifyToken(invalidToken);

      expect(payload).toBeNull();
    });

    // AC7: Token revocation
    it('should revoke token', () => {
      const userId = 'test-user-1';
      const email = 'test@example.com';

      const token = authService.generateToken(userId, email);
      authService.revokeToken(token);

      const payload = authService.verifyToken(token);
      expect(payload).toBeNull();
    });
  });

  // AC9: Validation tests
  describe('Validation', () => {
    it('should validate email format', () => {
      expect(authService.isValidEmail('test@example.com')).toBe(true);
      expect(authService.isValidEmail('invalid-email')).toBe(false);
      expect(authService.isValidEmail('test@')).toBe(false);
    });

    it('should validate password strength', () => {
      const weakPassword = 'weak';
      const strongPassword = 'StrongPass123!';

      const weakResult = authService.isValidPassword(weakPassword);
      expect(weakResult.valid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);

      const strongResult = authService.isValidPassword(strongPassword);
      expect(strongResult.valid).toBe(true);
      expect(strongResult.errors.length).toBe(0);
    });
  });

  // AC8: Password reset tests
  describe('Password Reset', () => {
    it('should generate reset token', () => {
      const userId = 'test-user-1';
      const resetToken = authService.generateResetToken(userId);

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
    });

    it('should verify reset token', () => {
      const userId = 'test-user-1';
      const resetToken = authService.generateResetToken(userId);

      const verifiedUserId = authService.verifyResetToken(resetToken);
      expect(verifiedUserId).toBe(userId);
    });

    it('should reject invalid reset token', () => {
      const invalidToken = 'invalid.reset.token';
      const verifiedUserId = authService.verifyResetToken(invalidToken);

      expect(verifiedUserId).toBeNull();
    });
  });

  // AC11: Token extraction
  describe('Token Extraction', () => {
    it('should extract valid bearer token', () => {
      const token = 'test-token-123';
      const authHeader = `Bearer ${token}`;

      const extracted = authService.extractToken(authHeader);
      expect(extracted).toBe(token);
    });

    it('should reject invalid bearer format', () => {
      const extracted1 = authService.extractToken('InvalidFormat token');
      expect(extracted1).toBeNull();

      const extracted2 = authService.extractToken('Bearer');
      expect(extracted2).toBeNull();

      const extracted3 = authService.extractToken(undefined);
      expect(extracted3).toBeNull();
    });
  });
});

describe('Integration: Auth Flow', () => {
  it('should complete registration flow', async () => {
    const testUser = await testSetup.createTestUser();

    // Hash password
    const hashedPassword = await authService.hashPassword(testUser.password);
    expect(hashedPassword).toBeDefined();

    // Verify password
    const passwordValid = await authService.verifyPassword(testUser.password, hashedPassword);
    expect(passwordValid).toBe(true);

    // Generate token
    const token = authService.generateToken(testUser.id, testUser.email);
    expect(token).toBeDefined();

    // Verify token
    const payload = authService.verifyToken(token);
    expect(payload?.userId).toBe(testUser.id);
    expect(payload?.email).toBe(testUser.email);
  });

  it('should complete login flow', async () => {
    const testUser = await testSetup.createTestUser();

    // Login: generate token
    const token = authService.generateToken(testUser.id, testUser.email);

    // Verify token for subsequent requests
    const payload = authService.verifyToken(token);
    expect(payload).toBeDefined();
    expect(payload?.userId).toBe(testUser.id);
  });

  it('should complete logout flow', async () => {
    const testUser = await testSetup.createTestUser();

    // Login
    const token = authService.generateToken(testUser.id, testUser.email);

    // Verify token works
    let payload = authService.verifyToken(token);
    expect(payload).toBeDefined();

    // Logout: revoke token
    authService.revokeToken(token);

    // Verify token no longer works
    payload = authService.verifyToken(token);
    expect(payload).toBeNull();
  });
});
