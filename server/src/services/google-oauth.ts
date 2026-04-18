import { OAuth2Client } from 'google-auth-library';
import logger from '../logger';

const clientId = process.env.GOOGLE_CLIENT_ID || '';
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const redirectUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/oauth/google/callback';

export const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

export interface GoogleTokenPayload {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  iat: number;
  exp: number;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export async function getGoogleAuthUrl(): Promise<string> {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return url;
}

export async function exchangeCodeForToken(code: string): Promise<GoogleTokenPayload> {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: clientId,
    });

    const payload = ticket.getPayload() as GoogleTokenPayload;
    return payload;
  } catch (error) {
    logger.error('Error exchanging Google OAuth code', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to exchange authorization code');
  }
}
