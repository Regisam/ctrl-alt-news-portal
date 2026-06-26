import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger.js';

// Set test environment
process.env.NODE_ENV = 'test';

// AC6: Test setup/teardown
export const testSetup = {
  testUsers: [
    {
      id: 'test-user-1',
      email: 'test1@example.com',
      password: 'TestPass123!',
      name: 'Test User 1',
    },
    {
      id: 'test-user-2',
      email: 'test2@example.com',
      password: 'TestPass456!',
      name: 'Test User 2',
    },
  ],

  testArticles: [
    {
      id: 'test-article-1',
      title: 'Test Article 1',
      content: 'This is a test article with enough content for testing purposes',
      category: 'Test',
      excerpt: 'Test excerpt',
    },
    {
      id: 'test-article-2',
      title: 'Test Article 2',
      content: 'Another test article with sufficient content for validation',
      category: 'Technology',
      excerpt: 'Another excerpt',
    },
  ],

  // AC6: Create fixtures
  async createTestUser(data: Partial<typeof testSetup.testUsers[0]> = {}) {
    const user = { ...testSetup.testUsers[0], ...data };
    logger.debug('Creating test user', { email: user.email });
    return user;
  },

  // AC6: Create test article
  async createTestArticle(data: Partial<typeof testSetup.testArticles[0]> = {}) {
    const article = { ...testSetup.testArticles[0], ...data };
    logger.debug('Creating test article', { title: article.title });
    return article;
  },

  // AC6: Cleanup
  async cleanup() {
    logger.debug('Cleaning up test data');
    // TODO: Clear database tables
  },
};

// AC5: Setup/teardown hooks
beforeAll(async () => {
  logger.info('Starting integration tests');
});

afterAll(async () => {
  logger.info('Finished integration tests');
  await testSetup.cleanup();
});

beforeEach(async () => {
  // Clear state before each test
});

afterEach(async () => {
  // Cleanup after each test
});
