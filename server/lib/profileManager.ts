import { logger } from '../logger.js';

// AC1: User profile
export interface UserProfile {
  userId: string;
  displayName: string;
  bio: string;
  avatar?: string;
  expertiseTags: string[];
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  privacy: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

// AC2: Profile stats
export interface ProfileStats {
  userId: string;
  followers: number;
  following: number;
  articlesPublished: number;
  commentsCount: number;
  joinDate: string;
}

// AC6 & AC7 & AC8: User settings
export interface UserSettings {
  userId: string;
  themePreference: 'light' | 'dark' | 'system';
  emailDigestFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
  notificationSettings: {
    commentReplies: boolean;
    reactions: boolean;
    newFollowers: boolean;
    mentions: boolean;
    articlePublished: boolean;
  };
  updatedAt: string;
}

class ProfileManager {
  private profiles: Map<string, UserProfile> = new Map();
  private settings: Map<string, UserSettings> = new Map();
  private stats: Map<string, ProfileStats> = new Map();
  private blockedUsers: Map<string, Set<string>> = new Map(); // userId -> blocked user IDs

  // AC1: Create/update profile
  updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    let profile = this.profiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        displayName: updates.displayName || 'Anonymous',
        bio: updates.bio || '',
        expertiseTags: updates.expertiseTags || [],
        socialLinks: updates.socialLinks || {},
        privacy: updates.privacy || 'public',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      if (updates.displayName) profile.displayName = updates.displayName;
      if (updates.bio) profile.bio = updates.bio;
      if (updates.expertiseTags) profile.expertiseTags = updates.expertiseTags;
      if (updates.socialLinks) profile.socialLinks = { ...profile.socialLinks, ...updates.socialLinks };
      if (updates.privacy) profile.privacy = updates.privacy;
      if (updates.avatar) profile.avatar = updates.avatar;
      profile.updatedAt = new Date().toISOString();
    }

    this.profiles.set(userId, profile);
    logger.info('Profile updated', { userId });

    return profile;
  }

  // AC2: Get profile stats
  getStats(userId: string): ProfileStats {
    return (
      this.stats.get(userId) || {
        userId,
        followers: 0,
        following: 0,
        articlesPublished: 0,
        commentsCount: 0,
        joinDate: new Date().toISOString(),
      }
    );
  }

  // Update stats
  updateStats(userId: string, updates: Partial<ProfileStats>): void {
    const stats = this.getStats(userId);
    if (updates.followers !== undefined) stats.followers = updates.followers;
    if (updates.following !== undefined) stats.following = updates.following;
    if (updates.articlesPublished !== undefined) stats.articlesPublished = updates.articlesPublished;
    if (updates.commentsCount !== undefined) stats.commentsCount = updates.commentsCount;
    this.stats.set(userId, stats);
  }

  // Get profile (respecting privacy)
  getProfile(userId: string, requesterId?: string): UserProfile | null {
    const profile = this.profiles.get(userId);

    if (!profile) return null;

    // Private profile check
    if (profile.privacy === 'private' && requesterId !== userId) {
      return null;
    }

    return profile;
  }

  // AC6 & AC7 & AC8: Get settings
  getSettings(userId: string): UserSettings {
    return (
      this.settings.get(userId) || {
        userId,
        themePreference: 'system',
        emailDigestFrequency: 'weekly',
        notificationSettings: {
          commentReplies: true,
          reactions: true,
          newFollowers: true,
          mentions: true,
          articlePublished: true,
        },
        updatedAt: new Date().toISOString(),
      }
    );
  }

  // Update settings
  updateSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
    const settings = this.getSettings(userId);

    if (updates.themePreference) settings.themePreference = updates.themePreference;
    if (updates.emailDigestFrequency) settings.emailDigestFrequency = updates.emailDigestFrequency;
    if (updates.notificationSettings) {
      settings.notificationSettings = { ...settings.notificationSettings, ...updates.notificationSettings };
    }
    settings.updatedAt = new Date().toISOString();

    this.settings.set(userId, settings);
    logger.info('Settings updated', { userId });

    return settings;
  }

  // AC9: Block user
  blockUser(userId: string, blockedUserId: string): boolean {
    if (userId === blockedUserId) return false;

    if (!this.blockedUsers.has(userId)) {
      this.blockedUsers.set(userId, new Set());
    }

    this.blockedUsers.get(userId)!.add(blockedUserId);
    logger.info('User blocked', { userId, blockedUserId });

    return true;
  }

  // AC9: Unblock user
  unblockUser(userId: string, blockedUserId: string): boolean {
    const blocked = this.blockedUsers.get(userId);

    if (!blocked || !blocked.has(blockedUserId)) {
      return false;
    }

    blocked.delete(blockedUserId);
    logger.info('User unblocked', { userId, blockedUserId });

    return true;
  }

  // AC9: Check if user is blocked
  isBlocked(userId: string, checkUserId: string): boolean {
    const blocked = this.blockedUsers.get(userId);
    return blocked ? blocked.has(checkUserId) : false;
  }

  // AC9: Get blocked users
  getBlockedUsers(userId: string): string[] {
    return Array.from(this.blockedUsers.get(userId) || new Set());
  }
}

export const profileManager = new ProfileManager();
