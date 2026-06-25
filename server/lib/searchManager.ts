import { logger } from '../logger.js';

// AC1-2: Full-text search types
export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  score: number;
  matchedFields: string[];
  publishedAt: string;
}

export interface SearchOptions {
  query: string;
  category?: string;
  author?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchStats {
  query: string;
  results: number;
  duration: number;
  timestamp: string;
}

class SearchManager {
  private searchHistory: SearchStats[] = [];

  // AC1: Full-text search with tsvector
  buildSearchQuery(options: SearchOptions): { query: string; params: any[] } {
    const { query, category, author, dateFrom, dateTo, limit = 20, offset = 0 } = options;

    // AC2: PostgreSQL tsvector query
    // In production, use parameterized queries to prevent SQL injection
    let sqlQuery = `
      SELECT 
        id, 
        title, 
        excerpt,
        category,
        author,
        published_at,
        ts_rank(search_vector, query) as score,
        ARRAY_AGG(CASE 
          WHEN title @@ query THEN 'title'
          WHEN content @@ query THEN 'content'
        END) as matched_fields
      FROM articles
      CROSS JOIN plainto_tsquery('english', $1) AS query
      WHERE search_vector @@ query
    `;

    const params: any[] = [query];

    // AC5: Add category filter
    if (category) {
      sqlQuery += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    // AC5: Add author filter
    if (author) {
      sqlQuery += ` AND author = $${params.length + 1}`;
      params.push(author);
    }

    // AC5: Add date range filter
    if (dateFrom) {
      sqlQuery += ` AND published_at >= $${params.length + 1}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      sqlQuery += ` AND published_at <= $${params.length + 1}`;
      params.push(dateTo);
    }

    sqlQuery += ` ORDER BY score DESC, published_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    return { query: sqlQuery, params };
  }

  // AC4: Relevance ranking
  calculateRelevanceScore(
    title: boolean,
    content: boolean,
    matchCount: number
  ): number {
    let score = 0;

    // Title match is more important (70%)
    if (title) score += 70;

    // Content match (30%)
    if (content) score += 30;

    // Boost for multiple matches
    score += Math.min(matchCount * 10, 20);

    return score;
  }

  // AC6: Autocomplete suggestions
  getAutocompleteSuggestions(query: string, limit: number = 5): string[] {
    // In production: query from articles table
    // SELECT DISTINCT LEFT(title, 50) FROM articles
    // WHERE title ILIKE query || '%'
    // ORDER BY popularity DESC
    // LIMIT limit

    // Mock suggestions
    const suggestions = [
      `${query} AI`,
      `${query} technology`,
      `${query} news`,
      `${query} guide`,
      `${query} tutorial`,
    ];

    return suggestions.slice(0, limit);
  }

  // AC7: Perform search
  async search(options: SearchOptions): Promise<{
    results: SearchResult[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const start = performance.now();

      // Build query
      const { query, params } = this.buildSearchQuery(options);

      logger.debug('Search query', { query: options.query, filters: { category: options.category, author: options.author } });

      // In production: execute against database
      // const results = await db.query(query, params);

      // Mock results
      const mockResults: SearchResult[] = [
        {
          id: 'article-1',
          title: `${options.query} - Latest News`,
          excerpt: `Breaking news about ${options.query}...`,
          category: options.category || 'Technology',
          author: options.author || 'Tech Writer',
          score: 95,
          matchedFields: ['title', 'content'],
          publishedAt: new Date().toISOString(),
        },
      ];

      const duration = performance.now() - start;

      // AC10: Track search analytics
      this.recordSearch({
        query: options.query,
        results: mockResults.length,
        duration,
        timestamp: new Date().toISOString(),
      });

      return {
        results: mockResults,
        total: mockResults.length,
        page: Math.floor((options.offset || 0) / (options.limit || 20)) + 1,
        pageSize: options.limit || 20,
      };
    } catch (error) {
      logger.error('Search failed', { error, query: options.query });
      throw error;
    }
  }

  // AC10: Record search analytics
  recordSearch(stats: SearchStats): void {
    this.searchHistory.push(stats);

    // Keep last 10000 searches in memory
    if (this.searchHistory.length > 10000) {
      this.searchHistory = this.searchHistory.slice(-10000);
    }

    logger.debug('Search recorded', { query: stats.query, results: stats.results });
  }

  // AC10: Get search statistics
  getSearchStats(limit: number = 100) {
    return {
      recentSearches: this.searchHistory.slice(-limit),
      totalSearches: this.searchHistory.length,
      averageDuration: (this.searchHistory.reduce((sum, s) => sum + s.duration, 0) / this.searchHistory.length).toFixed(2),
      topQueries: this.getTopQueries(10),
    };
  }

  // AC10: Get most popular searches
  private getTopQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const queryMap = new Map<string, number>();

    for (const stat of this.searchHistory) {
      queryMap.set(stat.query, (queryMap.get(stat.query) || 0) + 1);
    }

    return Array.from(queryMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // AC11: Validate search query
  validateQuery(query: string): { valid: boolean; error?: string } {
    if (!query || query.trim().length === 0) {
      return { valid: false, error: 'Search query cannot be empty' };
    }

    if (query.length > 500) {
      return { valid: false, error: 'Search query too long (max 500 characters)' };
    }

    // Prevent SQL injection attempts
    const dangerousPatterns = [';', '--', '/*', '*/', 'UNION', 'DROP', 'DELETE'];
    for (const pattern of dangerousPatterns) {
      if (query.toUpperCase().includes(pattern)) {
        return { valid: false, error: 'Invalid search query' };
      }
    }

    return { valid: true };
  }
}

export const searchManager = new SearchManager();
