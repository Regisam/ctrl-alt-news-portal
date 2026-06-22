import { logger } from '../logger.js';

// AC1: Emoji definitions with sentiment
export interface EmojiDef {
  emoji: string;
  name: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

// AC3: Emoji reaction
export interface EmojiReaction {
  id: string;
  articleId: string;
  commentId?: string;
  userId: string;
  emoji: string;
  timestamp: string;
}

// AC4: Aggregated reactions
export interface ReactionAggregation {
  targetId: string; // articleId or commentId
  totalReactions: number;
  reactions: Record<string, number>; // emoji -> count
  topEmojis: Array<{ emoji: string; count: number; percentage: number }>;
}

// AC1: Emoji library (10+ emojis)
const EMOJI_LIBRARY: EmojiDef[] = [
  { emoji: '👍', name: 'thumbs_up', sentiment: 'positive', category: 'approval' },
  { emoji: '❤️', name: 'heart', sentiment: 'positive', category: 'love' },
  { emoji: '😀', name: 'smile', sentiment: 'positive', category: 'emotion' },
  { emoji: '🔥', name: 'fire', sentiment: 'positive', category: 'intensity' },
  { emoji: '😢', name: 'cry', sentiment: 'negative', category: 'emotion' },
  { emoji: '👎', name: 'thumbs_down', sentiment: 'negative', category: 'disapproval' },
  { emoji: '😡', name: 'angry', sentiment: 'negative', category: 'emotion' },
  { emoji: '🤔', name: 'thinking', sentiment: 'neutral', category: 'emotion' },
  { emoji: '😮', name: 'surprised', sentiment: 'neutral', category: 'emotion' },
  { emoji: '🎉', name: 'party', sentiment: 'positive', category: 'celebration' },
  { emoji: '💡', name: 'lightbulb', sentiment: 'positive', category: 'idea' },
  { emoji: '⚡', name: 'lightning', sentiment: 'positive', category: 'intensity' },
];

class EmojiManager {
  private reactions: Map<string, EmojiReaction> = new Map();
  private articleReactions: Map<string, string[]> = new Map(); // articleId -> reactionIds
  private userReactions: Map<string, Set<string>> = new Map(); // userId:targetId:emoji -> reactionIds
  private userPreferences: Map<string, Record<string, number>> = new Map(); // userId -> emoji preference scores

  // AC3: Add emoji reaction
  addEmojiReaction(
    targetId: string, // articleId or commentId
    userId: string,
    emoji: string,
    isComment: boolean = false
  ): EmojiReaction | null {
    // Validate emoji
    if (!EMOJI_LIBRARY.find((e) => e.emoji === emoji)) {
      return null;
    }

    // AC11: Prevent duplicate (same user, same target, same emoji)
    const key = `${userId}:${targetId}:${emoji}`;
    if (this.userReactions.has(key)) {
      return null; // Already reacted
    }

    const id = `emoji-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const reaction: EmojiReaction = {
      id,
      articleId: isComment ? '' : targetId,
      commentId: isComment ? targetId : undefined,
      userId,
      emoji,
      timestamp: new Date().toISOString(),
    };

    this.reactions.set(id, reaction);

    // Track by target
    const trackKey = isComment ? `comment:${targetId}` : `article:${targetId}`;
    if (!this.articleReactions.has(trackKey)) {
      this.articleReactions.set(trackKey, []);
    }
    this.articleReactions.get(trackKey)!.push(id);

    // Track by user
    if (!this.userReactions.has(key)) {
      this.userReactions.set(key, new Set());
    }
    this.userReactions.get(key)!.add(id);

    // AC7: Update user preferences
    this.updateUserPreference(userId, emoji);

    logger.debug('Emoji reaction added', { targetId, userId, emoji });

    return reaction;
  }

  // Remove emoji reaction
  removeEmojiReaction(reactionId: string, userId: string): boolean {
    const reaction = this.reactions.get(reactionId);

    if (!reaction || reaction.userId !== userId) {
      return false;
    }

    this.reactions.delete(reactionId);

    logger.debug('Emoji reaction removed', { reactionId, userId });

    return true;
  }

  // AC4: Get aggregated reactions for target
  getReactionAggregation(targetId: string, isComment: boolean = false): ReactionAggregation {
    const trackKey = isComment ? `comment:${targetId}` : `article:${targetId}`;
    const reactionIds = this.articleReactions.get(trackKey) || [];

    const reactions: Record<string, number> = {};
    let totalReactions = 0;

    for (const id of reactionIds) {
      const reaction = this.reactions.get(id);
      if (reaction) {
        reactions[reaction.emoji] = (reactions[reaction.emoji] || 0) + 1;
        totalReactions += 1;
      }
    }

    // AC8: Rank emojis by frequency
    const topEmojis = Object.entries(reactions)
      .map(([emoji, count]) => ({
        emoji,
        count,
        percentage: Math.round((count / totalReactions) * 100) || 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      targetId,
      totalReactions,
      reactions,
      topEmojis,
    };
  }

  // AC6: Classify sentiment of emoji
  getEmojiSentiment(emoji: string): 'positive' | 'negative' | 'neutral' | null {
    const emojiDef = EMOJI_LIBRARY.find((e) => e.emoji === emoji);
    return emojiDef ? emojiDef.sentiment : null;
  }

  // AC5: Get trending emojis globally
  getTrendingEmojis(limit: number = 10): Array<{ emoji: string; count: number }> {
    const globalReactions: Record<string, number> = {};

    for (const reaction of this.reactions.values()) {
      globalReactions[reaction.emoji] = (globalReactions[reaction.emoji] || 0) + 1;
    }

    return Object.entries(globalReactions)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // AC5: Get sentiment distribution
  getSentimentDistribution(): {
    positive: number;
    negative: number;
    neutral: number;
  } {
    let positive = 0,
      negative = 0,
      neutral = 0;

    for (const reaction of this.reactions.values()) {
      const sentiment = this.getEmojiSentiment(reaction.emoji);
      if (sentiment === 'positive') positive += 1;
      else if (sentiment === 'negative') negative += 1;
      else neutral += 1;
    }

    return { positive, negative, neutral };
  }

  // AC7: Update user emoji preference
  private updateUserPreference(userId: string, emoji: string): void {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, {});
    }

    const prefs = this.userPreferences.get(userId)!;
    prefs[emoji] = (prefs[emoji] || 0) + 1;
  }

  // AC7: Get user emoji preferences
  getUserPreferences(userId: string): Array<{ emoji: string; count: number; percentage: number }> {
    const prefs = this.userPreferences.get(userId) || {};
    const total = Object.values(prefs).reduce((a, b) => a + b, 0);

    return Object.entries(prefs)
      .map(([emoji, count]) => ({
        emoji,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  // AC9: Compare articles by emoji distribution
  compareArticles(articleIds: string[]): Record<
    string,
    {
      topEmojis: Array<{ emoji: string; count: number }>;
      sentiment: 'positive' | 'negative' | 'neutral';
    }
  > {
    const result: Record<string, any> = {};

    for (const articleId of articleIds) {
      const agg = this.getReactionAggregation(articleId);
      const topEmojis = agg.topEmojis.slice(0, 5);

      // Determine sentiment
      const sentiments = topEmojis.map((e) => this.getEmojiSentiment(e.emoji));
      const positiveCount = sentiments.filter((s) => s === 'positive').length;
      const negativeCount = sentiments.filter((s) => s === 'negative').length;

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      else if (negativeCount > positiveCount) sentiment = 'negative';

      result[articleId] = {
        topEmojis: topEmojis.map((e) => ({ emoji: e.emoji, count: e.count })),
        sentiment,
      };
    }

    return result;
  }

  // Get emoji library
  getEmojiLibrary(): EmojiDef[] {
    return EMOJI_LIBRARY;
  }

  // Get stats
  getStats(): {
    totalReactions: number;
    uniqueEmojis: number;
    totalUsers: number;
    avgReactionsPerUser: number;
  } {
    const uniqueEmojis = new Set(this.reactions.values().map((r) => r.emoji)).size;
    const uniqueUsers = new Set(this.reactions.values().map((r) => r.userId)).size;

    return {
      totalReactions: this.reactions.size,
      uniqueEmojis,
      totalUsers: uniqueUsers,
      avgReactionsPerUser:
        uniqueUsers > 0 ? Math.round((this.reactions.size / uniqueUsers) * 10) / 10 : 0,
    };
  }
}

export const emojiManager = new EmojiManager();
