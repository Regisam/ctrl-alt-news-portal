/**
 * Engagement Vector Construction
 * Converts user engagement data into normalized vectors for similarity computation
 */

export interface UserEngagementVector {
  userId: string;
  topicEngagement: Record<string, number>; // topic -> normalized score [0, 1]
  authorEngagement: Record<string, number>; // author -> normalized score [0, 1]
  sentimentEngagement: Record<string, number>; // sentiment -> normalized score [0, 1]
  totalEngagement: number; // sum of all engagement
  lastUpdatedAt: Date;
}

export interface UserEngagementRaw {
  userId: string;
  reads: Array<{
    articleId: string;
    topic: string;
    author: string;
    sentiment?: 'breaking' | 'analysis' | 'opinion' | 'feature';
    scrollDepth: number; // 0-1
    timeSpent: number; // seconds
    readAt: Date;
  }>;
  bookmarks: Array<{
    articleId: string;
    topic: string;
    author: string;
    bookmarkedAt: Date;
  }>;
  reactions: Array<{
    articleId: string;
    topic: string;
    author: string;
    type: 'like' | 'love' | 'bookmark' | 'share';
    reactedAt: Date;
  }>;
}

const SENTIMENT_WEIGHTS: Record<string, number> = {
  breaking: 1.2, // Higher weight for breaking news engagement
  analysis: 1.0,
  opinion: 0.9,
  feature: 0.8,
};

const ENGAGEMENT_WEIGHTS = {
  read: 1.0,
  bookmark: 2.0, // Bookmarks indicate strong interest
  like: 0.5,
  love: 1.5,
  share: 2.5, // Shares show high engagement
};

const TEMPORAL_DECAY = 0.95; // Weekly decay factor for older engagement

/**
 * Convert raw engagement data to normalized vector
 * Applies temporal weighting and sentiment adjustments
 */
export function buildEngagementVector(
  userId: string,
  rawEngagement: UserEngagementRaw,
  referenceDate: Date = new Date()
): UserEngagementVector {
  const topicEngagement: Record<string, number> = {};
  const authorEngagement: Record<string, number> = {};
  const sentimentEngagement: Record<string, number> = {};

  const allEngagementScores: number[] = [];

  // Process reads
  for (const read of rawEngagement.reads) {
    const ageWeeks = (referenceDate.getTime() - read.readAt.getTime()) / (7 * 24 * 60 * 60 * 1000);
    const temporalWeight = Math.pow(TEMPORAL_DECAY, ageWeeks);

    // Engagement score = scroll depth * time spent (in minutes, capped at 10)
    const engagementScore = read.scrollDepth * Math.min(read.timeSpent / 60, 10) * temporalWeight;

    topicEngagement[read.topic] = (topicEngagement[read.topic] ?? 0) + engagementScore;
    authorEngagement[read.author] = (authorEngagement[read.author] ?? 0) + engagementScore;

    if (read.sentiment) {
      const sentimentWeight = SENTIMENT_WEIGHTS[read.sentiment] ?? 1.0;
      sentimentEngagement[read.sentiment] = (sentimentEngagement[read.sentiment] ?? 0) + engagementScore * sentimentWeight;
    }

    allEngagementScores.push(engagementScore);
  }

  // Process bookmarks (higher weight than reads)
  for (const bookmark of rawEngagement.bookmarks) {
    const ageWeeks = (referenceDate.getTime() - bookmark.bookmarkedAt.getTime()) / (7 * 24 * 60 * 60 * 1000);
    const temporalWeight = Math.pow(TEMPORAL_DECAY, ageWeeks);
    const score = ENGAGEMENT_WEIGHTS.bookmark * temporalWeight;

    topicEngagement[bookmark.topic] = (topicEngagement[bookmark.topic] ?? 0) + score;
    authorEngagement[bookmark.author] = (authorEngagement[bookmark.author] ?? 0) + score;
    allEngagementScores.push(score);
  }

  // Process reactions
  for (const reaction of rawEngagement.reactions) {
    const ageWeeks = (referenceDate.getTime() - reaction.reactedAt.getTime()) / (7 * 24 * 60 * 60 * 1000);
    const temporalWeight = Math.pow(TEMPORAL_DECAY, ageWeeks);
    const weight = ENGAGEMENT_WEIGHTS[reaction.type] ?? 1.0;
    const score = weight * temporalWeight;

    topicEngagement[reaction.topic] = (topicEngagement[reaction.topic] ?? 0) + score;
    authorEngagement[reaction.author] = (authorEngagement[reaction.author] ?? 0) + score;
    allEngagementScores.push(score);
  }

  // Normalize all scores to [0, 1]
  const maxScore = Math.max(...allEngagementScores, 1); // Avoid division by zero
  const totalEngagement = Object.values(topicEngagement).reduce((a, b) => a + b, 0);

  const normalizedTopics: Record<string, number> = {};
  for (const [topic, score] of Object.entries(topicEngagement)) {
    normalizedTopics[topic] = score / maxScore;
  }

  const normalizedAuthors: Record<string, number> = {};
  for (const [author, score] of Object.entries(authorEngagement)) {
    normalizedAuthors[author] = score / maxScore;
  }

  const normalizedSentiments: Record<string, number> = {};
  for (const [sentiment, score] of Object.entries(sentimentEngagement)) {
    normalizedSentiments[sentiment] = score / maxScore;
  }

  return {
    userId,
    topicEngagement: normalizedTopics,
    authorEngagement: normalizedAuthors,
    sentimentEngagement: normalizedSentiments,
    totalEngagement: totalEngagement / maxScore,
    lastUpdatedAt: new Date(),
  };
}

/**
 * Convert engagement vector to flat numeric array for correlation computation
 * Ensures consistent ordering across all users
 */
export function vectorToArray(vector: UserEngagementVector, allTopics: string[], allAuthors: string[], allSentiments: string[]): number[] {
  const array: number[] = [];

  // Topics (in sorted order)
  for (const topic of allTopics.sort()) {
    array.push(vector.topicEngagement[topic] ?? 0);
  }

  // Authors (in sorted order)
  for (const author of allAuthors.sort()) {
    array.push(vector.authorEngagement[author] ?? 0);
  }

  // Sentiments (in sorted order)
  for (const sentiment of allSentiments.sort()) {
    array.push(vector.sentimentEngagement[sentiment] ?? 0);
  }

  // Total engagement
  array.push(vector.totalEngagement);

  return array;
}

/**
 * Handle edge cases in vectors
 */
export function validateVector(vector: UserEngagementVector): { valid: boolean; reason?: string } {
  // Check for NaN/Infinity
  const allScores = [
    ...Object.values(vector.topicEngagement),
    ...Object.values(vector.authorEngagement),
    ...Object.values(vector.sentimentEngagement),
    vector.totalEngagement,
  ];

  for (const score of allScores) {
    if (!isFinite(score)) {
      return { valid: false, reason: 'Invalid score found (NaN or Infinity)' };
    }
  }

  // Check for new user (empty vector)
  if (vector.totalEngagement === 0) {
    return { valid: true }; // Valid but edge case (new user)
  }

  return { valid: true };
}
