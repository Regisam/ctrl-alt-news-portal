-- Performance optimization: Add composite indexes for common query patterns

-- Articles: authorId + createdAt (for user's articles sorted by date)
CREATE INDEX IF NOT EXISTS idx_articles_author_created ON articles("authorId", "createdAt" DESC) WHERE "deletedAt" IS NULL;

-- Articles: categoryId + publishedAt (for category listings)
CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles("categoryId", "publishedAt" DESC) WHERE status = 'PUBLISHED' AND "deletedAt" IS NULL;

-- Articles: status + publishedAt (for published articles listing)
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, "publishedAt" DESC) WHERE "deletedAt" IS NULL;

-- Comments: articleId + createdAt (for article's comments)
CREATE INDEX IF NOT EXISTS idx_comments_article_created ON comments("articleId", "createdAt" DESC) WHERE "deletedAt" IS NULL;

-- Comments: articleId + status + createdAt (for approved comments only)
CREATE INDEX IF NOT EXISTS idx_comments_article_status_created ON comments("articleId", status, "createdAt" DESC) WHERE "deletedAt" IS NULL;

-- Comments: parentId + createdAt (for comment threads/replies)
CREATE INDEX IF NOT EXISTS idx_comments_parent_created ON comments("parentId", "createdAt" DESC) WHERE "deletedAt" IS NULL AND status = 'APPROVED';

-- PageViews: articleId + createdAt (for analytics)
CREATE INDEX IF NOT EXISTS idx_pageviews_article_date ON page_views("articleId", "createdAt" DESC);

-- Bookmarks: userId + createdAt (for user's bookmarks)
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks("userId", "createdAt" DESC);
