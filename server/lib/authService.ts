import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../logger.js';

// AC1-2: Auth types
export interface AuthPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface AuthResult {
  userId: string;
  email: string;
  token: string;
  expiresIn: number;
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
  private readonly JWT_EXPIRY = '24h';
  private readonly BCRYPT_ROUNDS = 10;
  private revokedTokens: Set<string> = new Set();

  // AC1: User registration
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.BCRYPT_ROUNDS);
    } catch (error) {
      logger.error('Failed to hash password', { error });
      throw new Error('Password hashing failed');
    }
  }

  // AC2: Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Failed to verify password', { error });
      return false;
    }
  }

  // AC4: Generate JWT token
  generateToken(userId: string, email: string): string {
    try {
      const payload: Omit<AuthPayload, 'iat' | 'exp'> = { userId, email };
      const token = jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.JWT_EXPIRY,
        algorithm: 'HS256',
      });
      logger.info('Token generated', { userId });
      return token;
    } catch (error) {
      logger.error('Failed to generate token', { error });
      throw new Error('Token generation failed');
    }
  }

  // AC5: Verify JWT token
  verifyToken(token: string): AuthPayload | null {
    try {
      if (this.revokedTokens.has(token)) {
        return null;
      }

      const payload = jwt.verify(token, this.JWT_SECRET, {
        algorithms: ['HS256'],
      }) as AuthPayload;

      return payload;
    } catch (error) {
      logger.debug('Token verification failed', { error });
      return null;
    }
  }

  // AC7: Logout - revoke token
  revokeToken(token: string): void {
    this.revokedTokens.add(token);
    // Cleanup old tokens after 24h (in production, use Redis)
    setTimeout(() => {
      this.revokedTokens.delete(token);
    }, 24 * 60 * 60 * 1000);
  }

  // Extract token from Authorization header
  extractToken(authHeader?: string): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }

  // AC8: Generate password reset token
  generateResetToken(userId: string): string {
    try {
      const payload = { userId, type: 'reset' };
      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: '1h',
      });
    } catch (error) {
      logger.error('Failed to generate reset token', { error });
      throw new Error('Reset token generation failed');
    }
  }

  // Verify password reset token
  verifyResetToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as any;
      if (payload.type !== 'reset') return null;
      return payload.userId;
    } catch (error) {
      logger.debug('Reset token verification failed', { error });
      return null;
    }
  }

  // AC9: Validate email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  isValidPassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password must contain number');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const authService = new AuthService();
