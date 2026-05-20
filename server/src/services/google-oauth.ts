import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { logger } from '../../logger.js';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || 'dev-client-id',
  process.env.GOOGLE_CLIENT_SECRET || 'dev-client-secret',
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/oauth/google/callback'
);

/**
 * Generate Google OAuth consent URL
 */
export function getGoogleAuthUrl(): string {
  const scopes = ['email', 'profile'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
  logger.info('Generated Google OAuth consent URL');
  return url;
}

/**
 * Exchange authorization code for ID token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenPayload | null> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    logger.info('Exchanged authorization code for tokens');

    if (!tokens.id_token) {
      logger.warn('No ID token in Google response');
      return null;
    }

    // Verify token signature and get payload
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID || 'dev-client-id',
    });

    const payload = ticket.getPayload();
    if (!payload) {
      logger.warn('Could not extract payload from ID token');
      return null;
    }

    logger.info(`Successfully verified token for user: ${payload.email}`);
    return payload;
  } catch (error) {
    logger.error(`Token exchange error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Verify ID token signature with Google public keys
 */
export async function verifyIdToken(idToken: string): Promise<TokenPayload | null> {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID || 'dev-client-id',
    });

    const payload = ticket.getPayload();
    if (!payload) {
      logger.warn('Could not extract payload from ID token');
      return null;
    }

    // Verify email is confirmed
    if (!payload.email_verified) {
      logger.warn(`Email not verified for: ${payload.email}`);
      return null;
    }

    return payload;
  } catch (error) {
    logger.error(`Token verification error: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export type GoogleUserProfile = {
  id: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
};

/**
 * Extract user profile from verified token payload
 */
export function extractUserProfile(payload: TokenPayload): GoogleUserProfile {
  return {
    id: payload.sub || '',
    email: payload.email || '',
    name: payload.name || '',
    picture: payload.picture || '',
    email_verified: payload.email_verified || false,
  };
}
