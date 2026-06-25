# Advanced Search & Full-Text Search Guide

## Overview

Full-text search using PostgreSQL tsvector for fast, relevant article discovery.

## Features

- **Full-Text Search**: Search in title and content
- **Relevance Ranking**: Results scored by relevance (tf-idf)
- **Filtering**: Filter by category, author, date range
- **Autocomplete**: Search suggestions
- **Caching**: Fast repeated searches
- **Analytics**: Track popular searches

## API Endpoints

### Search Articles

```bash
GET /api/search/articles?q=technology&category=AI&limit=20&page=1
```

**Parameters:**
- `q` (required): Search query
- `category` (optional): Filter by category
- `author` (optional): Filter by author
- `dateFrom` (optional): Start date (ISO 8601)
- `dateTo` (optional): End date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "article-1",
        "title": "AI Breakthroughs 2026",
        "excerpt": "Latest developments...",
        "category": "AI",
        "author": "Alice Johnson",
        "score": 95,
        "matchedFields": ["title", "content"],
        "publishedAt": "2026-06-25T10:00:00Z"
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  }
}
```

### Autocomplete Suggestions

```bash
GET /api/search/suggestions?q=artif&limit=5
```

**Parameters:**
- `q` (required): Partial query
- `limit` (optional): Max suggestions (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      "artificial intelligence",
      "artificial neurons",
      "artificial systems",
      "artificial life",
      "artificial general intelligence"
    ]
  }
}
```

### Search Filters

```bash
GET /api/search/filters
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filters": {
      "categories": ["Technology", "AI", "Science", "Robotics"],
      "authors": ["Alice Johnson", "Bob Smith"],
      "dateRanges": [
        { "label": "Last 24 hours", "days": 1 },
        { "label": "Last week", "days": 7 }
      ]
    }
  }
}
```

### Search Statistics

```bash
GET /api/search/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-06-25T10:30:00Z",
    "stats": {
      "recentSearches": [...],
      "totalSearches": 1234,
      "averageDuration": "45.23",
      "topQueries": [
        { "query": "AI", "count": 156 },
        { "query": "technology", "count": 98 }
      ]
    }
  }
}
```

## Full-Text Search Setup

### PostgreSQL Configuration

Create tsvector index on articles:

```sql
-- Add search_vector column
ALTER TABLE articles ADD COLUMN search_vector tsvector;

-- Generate initial vectors
UPDATE articles SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'B');

-- Create index for fast searches
CREATE INDEX idx_search_vector ON articles USING gin(search_vector);

-- Create trigger to update tsvector on article changes
CREATE TRIGGER articles_search_vector_update BEFORE INSERT OR UPDATE
ON articles FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content);
```

### Relevance Ranking

Articles are ranked by:
1. **Title match (70%)**: Matches in title are more important
2. **Content match (30%)**: Matches in content are less important
3. **Frequency boost**: More matches = higher score

Example scoring:
```
Title match: +70 points
Content match: +30 points
Each additional match: +10 points (capped at 20)
```

## Usage Examples

### JavaScript/TypeScript

```typescript
import { searchManager } from '../lib/searchManager';

// Search
const results = await searchManager.search({
  query: 'artificial intelligence',
  category: 'AI',
  limit: 10,
});

// Autocomplete
const suggestions = searchManager.getAutocompleteSuggestions('artif', 5);

// Validate query
const validation = searchManager.validateQuery(userInput);
if (!validation.valid) {
  console.error(validation.error);
}
```

### cURL Examples

```bash
# Search for "AI" in Technology category
curl "http://localhost:3000/api/search/articles?q=AI&category=Technology&limit=20"

# Search with date range
curl "http://localhost:3000/api/search/articles?q=robot&dateFrom=2026-01-01&dateTo=2026-12-31"

# Get suggestions
curl "http://localhost:3000/api/search/suggestions?q=arti&limit=10"

# Get available filters
curl "http://localhost:3000/api/search/filters"

# Get search analytics
curl "http://localhost:3000/api/search/stats"
```

## Performance Optimization

### Caching Strategy

- **Search results**: Cache for 5 minutes
- **Autocomplete**: Cache for 10 minutes
- **Filters**: Cache for 1 hour
- **Tags**: Invalidate on article update

### Query Performance

- **Typical**: < 100ms for single keyword
- **Complex**: < 500ms with filters and date range
- **Large result set**: < 1 second for 10,000+ articles

### Index Maintenance

```sql
-- Analyze index usage
EXPLAIN ANALYZE SELECT * FROM articles WHERE search_vector @@ query;

-- Reindex if performance degrades
REINDEX INDEX idx_search_vector;

-- Vacuum table
VACUUM ANALYZE articles;
```

## Best Practices

1. **Validate Input**: Always validate search queries
2. **Use Filters**: Narrow results with category/author filters
3. **Cache Results**: Leverage caching for repeated searches
4. **Monitor**: Track popular searches via statistics
5. **Pagination**: Always paginate large result sets
6. **Language**: Currently English only (extensible)

## Troubleshooting

### Slow Searches

1. Check tsvector index exists: `\d+ articles`
2. Analyze query plan: `EXPLAIN ANALYZE`
3. Rebuild index: `REINDEX INDEX idx_search_vector`
4. Vacuum table: `VACUUM ANALYZE articles`

### No Results

1. Check query is valid (no dangerous patterns)
2. Verify search_vector is populated
3. Check article is published
4. Try broader search (remove filters)

### Wrong Results

1. Adjust relevance weights in scoring
2. Check stop words (English default)
3. Verify article content is indexed

