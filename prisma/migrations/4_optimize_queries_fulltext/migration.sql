-- Migration: 4_optimize_queries_fulltext
-- Purpose: Full-text search index + query optimization
-- Date: 2026-04-23
-- Author: Dara (Data Engineer)

-- ============================================================================
-- 1. CREATE FULL-TEXT SEARCH INDEX (GiST for fast ranked search)
-- ============================================================================

-- Create GiST index on tsvector for full-text search ranking
CREATE INDEX IF NOT EXISTS idx_articles_search_tsvector
  ON article_search_index
  USING GiST("searchVector");

-- ============================================================================
-- 2. CREATE TRIGGER TO AUTO-UPDATE TSVECTOR ON ARTICLE WRITE
-- ============================================================================

-- Function to update searchVector when article content changes
CREATE OR REPLACE FUNCTION update_article_searchVector()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO article_search_index ("articleId", "searchVector")
  VALUES (
    NEW.id,
    to_tsvector('english',
      COALESCE(NEW."titleEn", '') || ' ' ||
      COALESCE(NEW."titlePt", '') || ' ' ||
      COALESCE(NEW."excerptEn", '') || ' ' ||
      COALESCE(NEW."excerptPt", '')
    )
  )
  ON CONFLICT ("articleId") DO UPDATE SET
    "searchVector" = to_tsvector('english',
      COALESCE(NEW."titleEn", '') || ' ' ||
      COALESCE(NEW."titlePt", '') || ' ' ||
      COALESCE(NEW."excerptEn", '') || ' ' ||
      COALESCE(NEW."excerptPt", '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT/UPDATE of articles
CREATE TRIGGER trigger_update_article_searchVector
  AFTER INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_searchVector();

-- ============================================================================
-- 3. VERIFY INDEXES ARE PROPERLY CREATED (idempotent)
-- ============================================================================

-- These indexes should already exist from schema but verify they're present
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles("categoryId");
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles("authorId");
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles("publishedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments("articleId");
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments("authorId");

-- ============================================================================
-- 4. ADD COMPOSITE INDEX FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Composite index: (status, deletedAt, publishedAt) for article listing queries
CREATE INDEX IF NOT EXISTS idx_articles_status_deleted_published
  ON articles(status, "deletedAt", "publishedAt" DESC)
  WHERE "deletedAt" IS NULL AND status = 'PUBLISHED';

-- Composite index: (articleId, status, createdAt) for comment queries
CREATE INDEX IF NOT EXISTS idx_comments_article_status_created
  ON comments("articleId", status, "createdAt" DESC)
  WHERE "deletedAt" IS NULL AND status = 'APPROVED';

-- ============================================================================
-- 5. BACKFILL SEARCH INDEX FOR EXISTING ARTICLES
-- ============================================================================

-- Populate search vectors for all existing articles
INSERT INTO article_search_index ("articleId", "searchVector")
SELECT
  a.id,
  to_tsvector('english',
    COALESCE(a."titleEn", '') || ' ' ||
    COALESCE(a."titlePt", '') || ' ' ||
    COALESCE(a."excerptEn", '') || ' ' ||
    COALESCE(a."excerptPt", '')
  )
FROM articles a
ON CONFLICT ("articleId") DO NOTHING;

-- ============================================================================
-- 6. COMMENT ON INDEXES FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_articles_category_id IS 'Foreign key lookup optimization for category joins';
COMMENT ON INDEX idx_articles_author_id IS 'Foreign key lookup optimization for author joins';
COMMENT ON INDEX idx_articles_published_at IS 'Date-based sorting for published articles';
COMMENT ON INDEX idx_articles_search_tsvector IS 'Full-text search ranking via GiST index';
COMMENT ON INDEX idx_articles_status_deleted_published IS 'Composite index for article listing (PUBLISHED, not deleted)';
COMMENT ON INDEX idx_comments_article_status_created IS 'Composite index for comment retrieval (approved, not deleted)';

-- ============================================================================
-- VERIFICATION QUERIES (run manually for EXPLAIN ANALYZE)
-- ============================================================================

-- Verify index usage:
-- EXPLAIN ANALYZE SELECT * FROM articles WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL ORDER BY "publishedAt" DESC LIMIT 20;
-- EXPLAIN ANALYZE SELECT * FROM articles WHERE "categoryId" = '...' AND status = 'PUBLISHED';
-- EXPLAIN ANALYZE SELECT * FROM article_search_index WHERE "searchVector" @@ plainto_tsquery('english', 'AI');
