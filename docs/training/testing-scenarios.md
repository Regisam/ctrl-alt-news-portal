# Common Testing Scenarios — Worked Examples

## Scenario 1: Unit Testing a React Hook

### Code to Test

```typescript
// useArticleFilter.ts
export function useArticleFilter(articles: Article[], category: string) {
  const [filtered, setFiltered] = React.useState<Article[]>([]);

  React.useEffect(() => {
    const result = articles.filter(a => a.category === category);
    setFiltered(result);
  }, [articles, category]);

  return filtered;
}
```

### Test

```typescript
import { renderHook } from '@testing-library/react';
import { useArticleFilter } from './useArticleFilter';

describe('useArticleFilter', () => {
  const mockArticles = [
    { id: 1, category: 'tech', title: 'React' },
    { id: 2, category: 'science', title: 'Physics' },
    { id: 3, category: 'tech', title: 'Node.js' },
  ];

  it('should filter articles by category', () => {
    const { result } = renderHook(() =>
      useArticleFilter(mockArticles, 'tech'),
    );

    expect(result.current).toHaveLength(2);
    expect(result.current[0].title).toBe('React');
    expect(result.current[1].title).toBe('Node.js');
  });

  it('should return empty array when no matches', () => {
    const { result } = renderHook(() =>
      useArticleFilter(mockArticles, 'nonexistent'),
    );

    expect(result.current).toHaveLength(0);
  });
});
```

---

## Scenario 2: Integration Test — API Endpoint with Auth

### Code to Test

```typescript
// server/routes/articles.ts
router.post('/api/articles', authenticateUser, async (req, res) => {
  const { title, category, excerpt, body } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const article = await Article.create({
    title,
    category,
    excerpt,
    body,
    authorId: req.user.id,
  });

  res.status(201).json(article);
});
```

### Test

```typescript
import request from 'supertest';
import app from '../../server';

describe('POST /api/articles', () => {
  let authToken: string;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    authToken = response.body.token;
  });

  it('should create article with valid data', async () => {
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'New Article',
        category: 'tech',
        excerpt: 'Excerpt',
        body: 'Body content',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.authorId).toBeDefined();
  });

  it('should reject request without auth', async () => {
    await request(app)
      .post('/api/articles')
      .send({ title: 'Test' })
      .expect(401);
  });

  it('should return 400 for missing fields', async () => {
    const response = await request(app)
      .post('/api/articles')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Only title' })
      .expect(400);

    expect(response.body.error).toContain('Missing required fields');
  });
});
```

---

## Scenario 3: E2E Test — User Search Workflow

### Code to Test

The user should be able to:
1. Navigate to home
2. Search for "React"
3. See search results
4. Click on first result
5. Read article details

### Test

```typescript
import { test, expect } from '@playwright/test';

test('should search for article and view details', async ({ page }) => {
  // Navigate to home
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/Ctrl Alt News/);

  // Perform search
  await page.fill('input[type="search"]', 'React');
  await page.click('button:has-text("Search")');

  // Verify search results
  await expect(page).toHaveURL(/\/search\?q=React/);
  const results = await page.locator('[data-testid="search-result"]');
  await expect(results).toHaveCount(3); // or more

  // Click first result
  await results.first().click();

  // Verify article detail page
  await expect(page).toHaveURL(/\/articles\/\d+/);
  await expect(page.locator('h1')).toContainText('React');
});
```

---

## Scenario 4: Error Handling

### Code to Test

```typescript
export async function fetchArticle(id: number) {
  const response = await fetch(`/api/articles/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch article: ${response.statusText}`);
  }

  return response.json();
}
```

### Test

```typescript
describe('fetchArticle error handling', () => {
  it('should throw error on 404', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    await expect(fetchArticle(999)).rejects.toThrow('Not Found');
  });

  it('should return article on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, title: 'Test' }),
    });

    const article = await fetchArticle(1);
    expect(article.title).toBe('Test');
  });
});
```

---

## Scenario 5: Testing with Complex Data

### Code to Test

```typescript
export function aggregateArticleStats(articles: Article[]) {
  return {
    totalArticles: articles.length,
    byCategory: groupBy(articles, 'category'),
    averageLength: articles.reduce((sum, a) => sum + a.body.length, 0) /
      articles.length,
    recentCount: articles.filter(
      a => new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length,
  };
}
```

### Test

```typescript
describe('aggregateArticleStats', () => {
  const mockArticles = [
    {
      id: 1,
      category: 'tech',
      body: 'a'.repeat(500),
      createdAt: new Date('2026-04-20'),
    },
    {
      id: 2,
      category: 'tech',
      body: 'b'.repeat(300),
      createdAt: new Date('2026-04-19'),
    },
    {
      id: 3,
      category: 'science',
      body: 'c'.repeat(700),
      createdAt: new Date('2026-04-15'),
    },
  ];

  it('should calculate correct statistics', () => {
    const stats = aggregateArticleStats(mockArticles);

    expect(stats.totalArticles).toBe(3);
    expect(stats.byCategory).toEqual({
      tech: [mockArticles[0], mockArticles[1]],
      science: [mockArticles[2]],
    });
    expect(stats.averageLength).toBe(500); // (500+300+700)/3
  });

  it('should count only recent articles', () => {
    const stats = aggregateArticleStats(mockArticles);
    expect(stats.recentCount).toBe(2); // Only Apr 20 and 19
  });

  it('should handle empty array', () => {
    const stats = aggregateArticleStats([]);
    expect(stats.totalArticles).toBe(0);
    expect(stats.byCategory).toEqual({});
    expect(stats.averageLength).toBe(NaN);
  });
});
```

---

*Last Updated: 2026-04-24*
