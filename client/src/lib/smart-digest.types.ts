/**
 * Smart Digest types — Story 12.7
 *
 * Interfaces for digest generation, preferences, and payload
 */

export interface SmartDigestConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  preferredTime: string; // '08:00' UTC format
  topics: string[]; // user's topic preferences (AI, Science, Robotics, Gadgets, etc.)
  lastDigestSent?: Date;
}

export interface DigestArticle {
  id: string | number;
  title: string;
  summary: string; // 50-100 character excerpt
  link: string; // article URL
  category: string;
  relevanceScore: number; // 0-100 scale
  reason: string; // why recommended (topic match, trending, etc.)
}

export interface SmartDigestPayload {
  userId: string;
  digestDate: Date;
  articles: DigestArticle[]; // top 3-5 articles
  config: SmartDigestConfig;
  unsubscribeToken: string; // one-time use token
  preferencesToken: string; // one-time use token for settings
}

/**
 * Internal digest state for hook
 */
export interface SmartDigestState {
  digest: SmartDigestPayload | null;
  isLoading: boolean;
  error: Error | null;
}
