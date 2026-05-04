import type { Article } from './data';

export interface TopicStats {
  topic: string;
  count: number;
  percentage: number;
}

/**
 * Extract user's favorite topics from reading history
 * Analyzes article categories to determine user's topic preferences
 * @param readingHistory Array of articles user has read
 * @param topK Return top K topics (default: 5)
 * @returns Sorted array of topics with statistics
 */
export function extractUserTopics(
  readingHistory: Article[],
  topK: number = 5
): TopicStats[] {
  if (readingHistory.length === 0) {
    return [];
  }

  // Count topic frequencies
  const topicCounts = new Map<string, number>();

  readingHistory.forEach((article) => {
    const topic = article.category;
    topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  });

  // Convert to array with statistics
  const totalArticles = readingHistory.length;
  const topicStats = Array.from(topicCounts.entries()).map(([topic, count]) => ({
    topic,
    count,
    percentage: (count / totalArticles) * 100,
  }));

  // Sort by frequency (descending) then alphabetically
  topicStats.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.topic.localeCompare(b.topic);
  });

  // Return top K topics
  return topicStats.slice(0, topK);
}

/**
 * Get array of topic names from reading history
 * @param readingHistory Array of articles user has read
 * @param topK Return top K topics (default: 5)
 * @returns Array of topic names
 */
export function getTopTopics(
  readingHistory: Article[],
  topK: number = 5
): string[] {
  return extractUserTopics(readingHistory, topK).map((stat) => stat.topic);
}

/**
 * Calculate topic diversity (how varied are user's interests)
 * Returns 0 (only reads one topic) to 1 (reads all topics equally)
 * Uses Shannon entropy as diversity metric
 * @param readingHistory Array of articles user has read
 * @returns Diversity score between 0 and 1
 */
export function calculateTopicDiversity(readingHistory: Article[]): number {
  if (readingHistory.length === 0) {
    return 0;
  }

  const stats = extractUserTopics(readingHistory, Infinity);

  if (stats.length <= 1) {
    return 0;
  }

  // Calculate Shannon entropy for diversity
  let entropy = 0;
  const maxEntropy = Math.log2(stats.length);

  stats.forEach((stat) => {
    const probability = stat.percentage / 100;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  });

  // Normalize to 0-1 range
  return entropy / maxEntropy;
}

/**
 * Get primary topic (user's most-read category)
 * @param readingHistory Array of articles user has read
 * @returns Primary topic or null if no history
 */
export function getPrimaryTopic(readingHistory: Article[]): string | null {
  const topics = extractUserTopics(readingHistory, 1);
  return topics.length > 0 ? topics[0].topic : null;
}
