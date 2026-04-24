// Database fixture setup/teardown for integration tests
// This provides in-memory database initialization and cleanup patterns

export interface TestDatabase {
  articles: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: Date;
  }>;
  users: Array<{
    id: string;
    email: string;
    password: string; // hashed
    role: string;
  }>;
}

let testDB: TestDatabase | null = null;

/**
 * Initialize test database with seed data
 * Returns connection/database reference for tests
 */
export async function setupTestDatabase(): Promise<TestDatabase> {
  testDB = {
    articles: [
      {
        id: 'article-1',
        title: 'Getting Started with React',
        content: 'React is a JavaScript library for building user interfaces...',
        category: 'AI',
        createdAt: new Date('2026-04-20'),
      },
      {
        id: 'article-2',
        title: 'Machine Learning Basics',
        content: 'Machine learning is a subset of artificial intelligence...',
        category: 'Science',
        createdAt: new Date('2026-04-21'),
      },
      {
        id: 'article-3',
        title: 'Robotics Innovation',
        content: 'Modern robotics is transforming industries...',
        category: 'Robotics',
        createdAt: new Date('2026-04-22'),
      },
    ],
    users: [
      {
        id: 'user-1',
        email: 'admin@example.com',
        password: 'hashed_password_123', // In real tests, use bcrypt
        role: 'admin',
      },
      {
        id: 'user-2',
        email: 'user@example.com',
        password: 'hashed_password_456',
        role: 'user',
      },
    ],
  };

  return testDB;
}

/**
 * Clear all data and close database connection
 * Called in afterEach hooks to ensure test isolation
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testDB) {
    testDB.articles = [];
    testDB.users = [];
    testDB = null;
  }
}

/**
 * Get reference to test database
 * Useful for retrieving data in test assertions
 */
export function getTestDatabase(): TestDatabase {
  if (!testDB) {
    throw new Error(
      'Test database not initialized. Call setupTestDatabase() first.'
    );
  }
  return testDB;
}

/**
 * Reset database to seed data state
 * Useful for tests that modify data
 */
export async function resetTestDatabase(): Promise<void> {
  await teardownTestDatabase();
  await setupTestDatabase();
}
