# Database Optimization Patterns — Developer Guide

**Audience:** Backend developers, API implementers  
**Context:** Story 7.2 (API Performance Optimization & Database Indexing)  
**Last Updated:** 2026-04-23

This guide documents proven optimization patterns used to achieve **8,718 queries/sec throughput** on the Ctrl Alt News database.

---

## Pattern 1: Eager Loading with Prisma `include`

### Problem
N+1 queries when fetching related data in loops.

**❌ Anti-pattern (N+1 queries):**
```typescript
// Queries database N+1 times: 1 for articles + N for each author
const articles = await prisma.article.findMany({
  where: { status: 'PUBLISHED' }
});

for (const article of articles) {
  const author = await prisma.user.findUnique({
    where: { id: article.authorId }
  });
  article.author = author;
}
```

### Solution
Use Prisma `include` to fetch relations in a single query.

**✅ Optimized (single query):**
```typescript
const articles = await prisma.article.findMany({
  where: { status: 'PUBLISHED' },
  include: {
    author: {
      select: { id: true, fullName: true, avatarUrl: true }
    },
    category: {
      select: { id: true, nameEn: true, namePt: true }
    }
  }
});
```

### Performance Impact
- **Before:** N+1 queries (1 + articles count)
- **After:** 1 query with JOINs
- **Result:** 10,000 articles → 10,000x fewer queries

### When to Use
- Fetching articles with author/category
- Fetching comments with author info
- Any 1-to-many or many-to-one relation

### Implementation Rules
1. **Select only needed fields** to reduce payload size
2. **Avoid circular references** (article → author → articles)
3. **Use `select` for nested relations** to be explicit about what you fetch
4. **Limit depth** to 2-3 levels of nesting

---

## Pattern 2: Composite Indexes for Common Query Patterns

### Problem
Query plans with full table scans when filtering and sorting together.

**❌ Anti-pattern (separate indexes):**
```sql
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
-- Query planner must choose one index; filters on status scan the entire result
```

### Solution
Create composite indexes matching query filter + sort order.

**✅ Optimized (composite index):**
```sql
CREATE INDEX idx_articles_status_published 
  ON articles(status, "publishedAt" DESC) 
  WHERE "deletedAt" IS NULL AND status = 'PUBLISHED';
```

### Query That Benefits
```typescript
const articles = await prisma.article.findMany({
  where: {
    status: 'PUBLISHED',
    deletedAt: null
  },
  orderBy: { publishedAt: 'desc' },
  take: 20
});
```

### Execution Plan
```
Index Scan using idx_articles_status_published on articles
  Index Cond: (status = 'PUBLISHED')
  Filter: ("deletedAt" IS NULL)
```

### Index Design Rules
1. **Filter columns first** (WHERE clause)
2. **Sort columns last** (ORDER BY)
3. **Include equality predicates** before range predicates
4. **Add partial index** (WHERE clause) to exclude soft-deleted rows

**Example Pattern:**
```sql
-- Pattern: Filter on (col1, col2, col3) ORDER BY col4 DESC
CREATE INDEX idx_table_filters_sort
  ON table(col1, col2, col3, col4 DESC)
  WHERE deleted_at IS NULL;
```

### Performance Impact
- **Before:** Index + full scan of result set
- **After:** Index range scan only
- **Result:** 100+ articles scanned → 20 articles scanned

---

## Pattern 3: Foreign Key Indexes for JOIN Performance

### Problem
JOIN operations scan entire table on the right side.

**❌ Slow JOINs (no index on foreign key):**
```sql
SELECT a.*, u.full_name
FROM articles a
JOIN users u ON a.author_id = u.id
WHERE a.status = 'PUBLISHED'
-- Scans all users to find author_id matches
```

### Solution
Index all foreign key columns.

**✅ Optimized (FK index):**
```sql
CREATE INDEX idx_articles_author_id ON articles("authorId");
CREATE INDEX idx_articles_category_id ON articles("categoryId");
CREATE INDEX idx_comments_article_id ON comments("articleId");
```

### Execution Plan (optimized)
```
Nested Loop
  -> Index Scan using idx_articles_status_published on articles
  -> Index Scan using users_pkey on users
       Index Cond: (id = a.author_id)
```

### Implementation Rules
1. **Always index foreign keys** — Prisma best practice
2. **Index both sides of relationship** for bidirectional queries
3. **Use composite FK + filter** for complex joins

**Example (articles by author):**
```sql
-- Query: GET /users/:id/articles
CREATE INDEX idx_articles_author_created
  ON articles("authorId", "createdAt" DESC)
  WHERE "deletedAt" IS NULL;
```

### Performance Impact
- **Before:** Table scan on join side (~100ms)
- **After:** Index seek on FK (~1ms)
- **Result:** 100x faster JOINs

---

## Pattern 4: Full-Text Search with GiST Index

### Problem
LIKE queries are slow on large text columns.

**❌ Slow text search:**
```sql
SELECT * FROM articles
WHERE title LIKE '%artificial%' OR content LIKE '%artificial%'
-- Full table scan, no index usage
```

### Solution
Use PostgreSQL full-text search with GiST index on tsvector.

**✅ Optimized (tsvector + GiST):**
```sql
-- 1. Create tsvector column in search index table
CREATE TABLE article_search_index (
  article_id UUID PRIMARY KEY,
  search_vector tsvector NOT NULL
);

-- 2. Create GiST index for fast ranking
CREATE INDEX idx_articles_search_tsvector
  ON article_search_index USING GiST(search_vector);

-- 3. Query with ranking
SELECT a.*, ts_rank(asi.search_vector, query) as rank
FROM article_search_index asi
JOIN articles a ON asi.article_id = a.id
WHERE asi.search_vector @@ plainto_tsquery('english', 'artificial')
ORDER BY rank DESC
```

### Trigger for Auto-Update
Maintain tsvector automatically when articles change:

```sql
CREATE FUNCTION update_article_searchvector()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO article_search_index (article_id, search_vector)
  VALUES (
    NEW.id,
    to_tsvector('english',
      COALESCE(NEW.title_en, '') || ' ' ||
      COALESCE(NEW.excerpt_en, '')
    )
  )
  ON CONFLICT (article_id) DO UPDATE SET
    search_vector = to_tsvector('english',
      COALESCE(NEW.title_en, '') || ' ' ||
      COALESCE(NEW.excerpt_en, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_searchvector
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_searchvector();
```

### Usage in API
```typescript
async function searchArticles(query: string) {
  return prisma.$queryRawUnsafe(`
    SELECT a.id, a."titleEn", a."slug",
           ts_rank(asi."searchVector", plainto_tsquery('english', $1)) as rank
    FROM article_search_index asi
    JOIN articles a ON asi."articleId" = a.id
    WHERE asi."searchVector" @@ plainto_tsquery('english', $1)
    ORDER BY rank DESC
    LIMIT 20
  `, query);
}
```

### Performance Impact
- **Before:** LIKE query (~500ms on 10K articles)
- **After:** GiST index (~4ms)
- **Result:** 125x faster full-text search

### Implementation Rules
1. **Use separate search table** to keep tsvector maintenance lightweight
2. **Auto-update with trigger** to prevent stale data
3. **Index with GiST** for ranked search (not GIST for boolean)
4. **Normalize text** before indexing (remove punctuation, lowercase)

---

## Pattern 5: Soft Delete Indexes with WHERE Clauses

### Problem
Soft-deleted rows pollute index efficiency.

**❌ Inefficient (includes deleted):**
```sql
CREATE INDEX idx_articles_status ON articles(status);
-- Scans both active and deleted articles
```

### Solution
Use partial index (WHERE clause) to exclude soft-deleted rows.

**✅ Optimized (partial index):**
```sql
CREATE INDEX idx_articles_status_published
  ON articles(status, "publishedAt" DESC)
  WHERE "deletedAt" IS NULL AND status = 'PUBLISHED';
```

### Execution Plan
```
Index Scan using idx_articles_status_published
  Index Cond: (status = 'PUBLISHED'::ArticleStatus)
  Filter: ("deletedAt" IS NULL)
```

### Implementation Rules
1. **Always add `WHERE "deletedAt" IS NULL`** to soft-delete tables
2. **Include status filter** if filtering by status in queries
3. **Index applies automatically** when WHERE clause matches

### Performance Impact
- **Before:** Index + soft-delete filter (scans ~2x rows)
- **After:** Index + built-in filter (scans only active)
- **Result:** 50% fewer index entries to scan

---

## Pattern 6: Connection Pooling Configuration

### Problem
Database connection overhead with high concurrency.

### Solution
Enable connection pooling via PgBouncer.

**✅ Production Configuration:**
```env
# .env.production
DATABASE_URL="postgresql://user:pass@db-host:6543/db_name?sslmode=require&schema=public&connection_limit=20"
DATABASE_URL_DIRECT="postgresql://user:pass@db-host:5432/db_name?sslmode=require"
```

### Prisma Configuration
```typescript
// server/src/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export { prisma };
```

### Pool Size Recommendations
| Environment | Pool Size | Reasoning |
|-------------|-----------|-----------|
| Development | 10 | Low concurrent load |
| Staging | 20 | Testing concurrent scenarios |
| Production | 50-100 | High concurrent requests |

### Performance Impact
- **Before:** 1 connection per request (connection setup ~5ms)
- **After:** Reuse from pool (~0.1ms)
- **Result:** 50x faster connection reuse

---

## Pattern 7: Query Timeout Enforcement

### Problem
Slow queries hang resources indefinitely.

### Solution
Set query timeouts in Prisma.

**✅ Implementation:**
```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Set timeout on all queries
async function queryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ]);
}

// Usage
await queryWithTimeout(
  () => prisma.article.findMany(),
  10000 // 10 seconds
);
```

### Timeout Values
| Query Type | Recommended |
|------------|-------------|
| Simple select | 1 second |
| Complex join | 5 seconds |
| Aggregation | 10 seconds |
| Migration | No timeout |

---

## Pattern 8: Index Maintenance & Monitoring

### Problem
Indexes degrade over time without maintenance.

### Solution
Regular EXPLAIN ANALYZE and REINDEX.

**✅ Monitoring Script:**
```typescript
// Check query performance
async function checkQueryPlan(query: string) {
  const plan = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE ${query}
  `);
  
  // Look for:
  // - Full table scans (bad)
  // - Index scans (good)
  // - Seq scan vs Index scan ratio
  console.log(plan);
}

// Run analysis
await checkQueryPlan(`
  SELECT * FROM articles 
  WHERE status = 'PUBLISHED' 
  ORDER BY published_at DESC 
  LIMIT 20
`);
```

### Maintenance Tasks
```sql
-- Check index bloat
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Rebuild fragmented indexes
REINDEX INDEX idx_articles_status_published;

-- Update table statistics
ANALYZE articles;
```

---

## Quick Reference: Optimization Checklist

When optimizing a slow query:

- [ ] **Check execution plan** with EXPLAIN ANALYZE
- [ ] **Verify index usage** (should see Index Scan, not Seq Scan)
- [ ] **Add missing FK indexes** on join columns
- [ ] **Use composite indexes** for filter + sort patterns
- [ ] **Implement eager loading** with Prisma `include`
- [ ] **Exclude soft deletes** with partial indexes (WHERE)
- [ ] **Add connection pooling** in production
- [ ] **Set query timeouts** to prevent hangs
- [ ] **Monitor with slow query log** for regressions

---

## Performance Testing

### Test Your Optimization

Use the performance analysis scripts from Story 7.2:

```bash
# Analyze query execution plans
npx tsx scripts/analyze-query-performance.ts

# Load test with concurrent queries
npx tsx scripts/load-test-queries.ts
```

### Expected Results (Story 7.2 Baseline)

| Metric | Target | Achieved |
|--------|--------|----------|
| Avg Query Time | <300ms | 0.03ms |
| Peak Throughput | 1,000+ qps | 8,718 qps |
| P99 Latency | <300ms | 20ms |
| Index Coverage | 100% | 5/5 queries |

---

## Common Mistakes to Avoid

❌ **Don't:**
- Create too many indexes (> 5 per table)
- Index low-cardinality columns (status, boolean)
- Forget to include soft-delete filters
- Mix `select` and `include` without thought
- Ignore EXPLAIN ANALYZE output

✅ **Do:**
- Index foreign keys and commonly filtered columns
- Use composite indexes for filter + sort
- Monitor query performance regularly
- Verify each index with EXPLAIN ANALYZE
- Document why each index exists

---

## Further Reading

- **PostgreSQL Index Documentation:** https://www.postgresql.org/docs/current/indexes.html
- **Prisma Performance Guide:** https://www.prisma.io/docs/guides/performance
- **Full-Text Search:** https://www.postgresql.org/docs/current/textsearch.html
- **Connection Pooling:** https://www.pgbouncer.org/

---

## Questions?

For questions about database optimization:
1. Check `docs/architecture/performance-benchmarks.md` for test results
2. Review the Story 7.2 implementation in git history
3. Run performance analysis scripts to diagnose issues
4. Contact @data-engineer (Dara) for architecture guidance

---

**Document:** `docs/guides/database-optimization-patterns.md`  
**Story:** 7.2 (API Performance Optimization & Database Indexing)  
**Last Updated:** 2026-04-23 by Dara (Data Engineer)
