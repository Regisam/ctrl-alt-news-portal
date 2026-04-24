// Test data builders/factories for creating consistent test data

import { getTestDatabase } from './database.js';

/**
 * Create a test article with default values
 * Allows partial overrides for specific test needs
 */
export function createTestArticle(overrides?: Partial<{
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
}>) {
  const defaults = {
    id: `article-${Date.now()}`,
    title: 'Test Article',
    content: 'This is test article content',
    category: 'AI',
    createdAt: new Date(),
  };
  return { ...defaults, ...overrides };
}

/**
 * Create a test user with default values
 */
export function createTestUser(overrides?: Partial<{
  id: string;
  email: string;
  password: string;
  role: string;
}>) {
  const defaults = {
    id: `user-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'test_password_hashed',
    role: 'user',
  };
  return { ...defaults, ...overrides };
}

/**
 * Seed an article into test database
 */
export function seedArticle(article: ReturnType<typeof createTestArticle>) {
  const db = getTestDatabase();
  db.articles.push(article);
  return article;
}

/**
 * Seed a user into test database
 */
export function seedUser(user: ReturnType<typeof createTestUser>) {
  const db = getTestDatabase();
  db.users.push(user);
  return user;
}

/**
 * Seed multiple articles at once
 */
export function seedArticles(
  articles: Array<ReturnType<typeof createTestArticle>>
) {
  return articles.map((article) => seedArticle(article));
}

/**
 * Get article from test database by ID
 */
export function getArticleById(id: string) {
  const db = getTestDatabase();
  return db.articles.find((a) => a.id === id);
}

/**
 * Get user from test database by email
 */
export function getUserByEmail(email: string) {
  const db = getTestDatabase();
  return db.users.find((u) => u.email === email);
}

/**
 * Get all articles in test database
 */
export function getAllArticles() {
  const db = getTestDatabase();
  return db.articles;
}

/**
 * Generate a mock JWT token for testing auth
 * In real tests, would use actual JWT signing
 * Format: mock-jwt-token|{userId}|{role}|{timestamp}
 */
export function generateMockToken(userId: string, role: string = 'user') {
  // This is a simplified mock token
  // In production, use: jwt.sign({ userId, role }, SECRET, { expiresIn: '1h' })
  return `mock-jwt-token|${userId}|${role}|${Date.now()}`;
}
