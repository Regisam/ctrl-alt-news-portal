import { logger } from '../logger.js';
import { emailService } from './emailService.js';

// AC7-8: Token & transactional types
export interface EmailToken {
  id: string;
  token: string;
  userId: string;
  type: 'verification' | 'password-reset' | 'email-change';
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

export interface TransactionalEmail {
  type: string;
  userId: string;
  email: string;
  metadata: Record<string, any>;
}

class TransactionalEmailService {
  private tokens: Map<string, EmailToken> = new Map();
  private sentEmails: Array<{ type: string; email: string; timestamp: Date }> = [];

  // AC1: Send email verification
  async sendVerificationEmail(userId: string, email: string, verificationToken: string): Promise<boolean> {
    try {
      const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;

      const html = this.renderVerificationTemplate({ email, verifyUrl });

      const success = await emailService.sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        html,
      });

      if (success) {
        this.recordSentEmail('verification', email);
      }

      logger.info('Verification email sent', { userId, email });

      return success;
    } catch (error) {
      logger.error('Failed to send verification email', { error, userId });
      return false;
    }
  }

  // AC2: Send password reset email
  async sendPasswordResetEmail(userId: string, email: string, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}`;

      const html = this.renderPasswordResetTemplate({ email, resetUrl });

      const success = await emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html,
      });

      if (success) {
        this.recordSentEmail('password-reset', email);
      }

      logger.info('Password reset email sent', { userId, email });

      return success;
    } catch (error) {
      logger.error('Failed to send password reset email', { error, userId });
      return false;
    }
  }

  // AC3: Send welcome email
  async sendWelcomeEmail(userId: string, email: string, name: string): Promise<boolean> {
    try {
      const html = this.renderWelcomeTemplate({ name, email });

      const success = await emailService.sendEmail({
        to: email,
        subject: `Welcome to Ctrl Alt News, ${name}!`,
        html,
      });

      if (success) {
        this.recordSentEmail('welcome', email);
      }

      logger.info('Welcome email sent', { userId, email });

      return success;
    } catch (error) {
      logger.error('Failed to send welcome email', { error, userId });
      return false;
    }
  }

  // AC4: Send action confirmation email
  async sendConfirmationEmail(userId: string, email: string, action: string, details: Record<string, any>): Promise<boolean> {
    try {
      const html = this.renderConfirmationTemplate({ action, details });

      const success = await emailService.sendEmail({
        to: email,
        subject: `Confirmation: ${action}`,
        html,
      });

      if (success) {
        this.recordSentEmail('confirmation', email);
      }

      logger.info('Confirmation email sent', { userId, email, action });

      return success;
    } catch (error) {
      logger.error('Failed to send confirmation email', { error, userId });
      return false;
    }
  }

  // AC7: Generate and store token
  generateToken(userId: string, type: 'verification' | 'password-reset' | 'email-change'): string {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const emailToken: EmailToken = {
      id: `token-${Date.now()}`,
      token,
      userId,
      type,
      expiresAt: new Date(Date.now() + (type === 'password-reset' ? 3600000 : 86400000)), // 1h for reset, 24h for others
      createdAt: new Date(),
      used: false,
    };

    this.tokens.set(token, emailToken);

    logger.debug('Token generated', { userId, type });

    return token;
  }

  // AC7: Validate token
  validateToken(token: string, type: 'verification' | 'password-reset' | 'email-change'): { valid: boolean; userId?: string } {
    const emailToken = this.tokens.get(token);

    if (!emailToken) {
      return { valid: false };
    }

    // AC8: Check expiration
    if (emailToken.expiresAt < new Date()) {
      return { valid: false };
    }

    if (emailToken.type !== type) {
      return { valid: false };
    }

    if (emailToken.used) {
      return { valid: false };
    }

    return { valid: true, userId: emailToken.userId };
  }

  // AC7: Mark token as used
  useToken(token: string): boolean {
    const emailToken = this.tokens.get(token);

    if (!emailToken) return false;

    emailToken.used = true;
    logger.debug('Token used', { token: token.substring(0, 8) });

    return true;
  }

  // AC8: Cleanup expired tokens
  cleanupExpiredTokens(): number {
    const now = new Date();
    let removed = 0;

    for (const [token, emailToken] of this.tokens.entries()) {
      if (emailToken.expiresAt < now) {
        this.tokens.delete(token);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug('Expired tokens cleanup', { removed });
    }

    return removed;
  }

  // AC10: Track sent email
  private recordSentEmail(type: string, email: string): void {
    this.sentEmails.push({
      type,
      email,
      timestamp: new Date(),
    });

    // Keep last 1000 emails
    if (this.sentEmails.length > 1000) {
      this.sentEmails = this.sentEmails.slice(-1000);
    }
  }

  // AC10: Get transactional email log
  getEmailLog(limit: number = 50): Array<{ type: string; email: string; timestamp: Date }> {
    return this.sentEmails.slice(-limit).reverse();
  }

  // Template renderers
  private renderVerificationTemplate(data: { email: string; verifyUrl: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background: #007bff; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verify Your Email</h2>
    <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
    <p><a href="${data.verifyUrl}" class="button">Verify Email</a></p>
    <p>Or copy this link: <a href="${data.verifyUrl}">${data.verifyUrl}</a></p>
    <p>This link expires in 24 hours.</p>
  </div>
</body>
</html>
    `;
  }

  private renderPasswordResetTemplate(data: { email: string; resetUrl: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background: #28a745; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <p><a href="${data.resetUrl}" class="button">Reset Password</a></p>
    <p>Or copy this link: <a href="${data.resetUrl}">${data.resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `;
  }

  private renderWelcomeTemplate(data: { name: string; email: string }): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background: #007bff; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Ctrl Alt News!</h1>
    <p>Hi ${data.name},</p>
    <p>We're excited to have you join our community of news enthusiasts.</p>
    <p><a href="${process.env.BASE_URL}" class="button">Start Reading</a></p>
    <p>Happy reading!</p>
  </div>
</body>
</html>
    `;
  }

  private renderConfirmationTemplate(data: { action: string; details: Record<string, any> }): string {
    const detailsHtml = Object.entries(data.details)
      .map(([key, value]) => `<li>${key}: ${value}</li>`)
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Confirmation: ${data.action}</h2>
    <p>Your action has been confirmed. Here are the details:</p>
    <ul>${detailsHtml}</ul>
    <p>If you didn't make this change, please contact support.</p>
  </div>
</body>
</html>
    `;
  }

  // Clear data
  clear(): void {
    this.tokens.clear();
    this.sentEmails = [];
    logger.info('Transactional email service cleared');
  }
}

export const transactionalEmailService = new TransactionalEmailService();

// AC8: Cleanup expired tokens every hour
setInterval(() => {
  transactionalEmailService.cleanupExpiredTokens();
}, 60 * 60 * 1000);
