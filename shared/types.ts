/**
 * Shared types for frontend and backend
 */

export interface Article {
  id: string | number;
  title: string;
  category?: string;
  url: string;
  author: string;
  date: string;
  content?: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  favoriteCategories?: string[];
  darkMode?: boolean;
}

export interface RecommendationMetric {
  userId: string;
  articleId: string;
  event: 'impression' | 'click' | 'engagement';
  timestamp: string;
}
