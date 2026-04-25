# Sitemap & Robots Configuration Implementation Guide

## Overview

This guide explains the implementation of XML sitemaps, robots.txt configuration, and canonical URLs for the Ctrl Alt News portal to improve SEO and search engine discovery.

## Components

### 1. Sitemap Generation (`client/src/lib/sitemap.ts`)

The sitemap module provides utilities for generating W3C-compliant XML sitemaps.

#### Key Functions

**`generateSitemapXML(articles, config)`**
- Generates XML sitemap from article data
- Includes: homepage, category pages, article pages
- Returns: Valid XML string matching W3C schema

**`generateCanonicalURL(baseUrl, articleTitle, articleId)`**
- Creates canonical URL with slug from article title
- Returns: `/article/{id}/{slug}` format
- Example: `/article/1/ai-revolution`

**`validateSitemapXML(xml)`**
- Validates XML structure against W3C schema
- Returns: Boolean (true = valid, false = invalid)

#### Usage Example

```typescript
import { generateSitemapXML } from '@/lib/sitemap';

const articles = [
  {
    id: 1,
    title: { en: 'AI Revolution', pt: 'Revolução da IA' },
    category: 'AI',
    // ... other fields
  },
];

const sitemap = generateSitemapXML(articles, {
  siteUrl: 'https://ctrlaltnews.com',
  baseUrl: 'https://ctrlaltnews.com',
});

console.log(sitemap); // Valid XML sitemap string
```

### 2. Server Endpoints (`server/index.ts`)

Two endpoints serve SEO files dynamically:

#### GET `/sitemap.xml`
- Returns: W3C-compliant XML sitemap
- Content-Type: `application/xml`
- Includes: Homepage (priority 1.0), categories (0.8), articles (0.6)
- Auto-updates: On article changes (when using dynamic data source)

#### GET `/robots.txt`
- Returns: Standard robots.txt file
- Content-Type: `text/plain`
- Rules:
  - Allow: `/article/`, `/category/`, `/search`
  - Disallow: `/admin`, `/api/internal`, `/api/auth`
  - Sitemap reference: Points to `/sitemap.xml`

#### Server Configuration

```typescript
// In server/index.ts
app.get('/sitemap.xml', (_req, res) => {
  const sitemap = generateSitemapXML(articles, config);
  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

app.get('/robots.txt', (_req, res) => {
  const robotsTxt = `User-agent: *
Allow: /article/
Disallow: /admin
Sitemap: https://ctrlaltnews.com/sitemap.xml`;
  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});
```

### 3. Canonical URLs

Canonical URLs prevent duplicate content issues and consolidate SEO value.

#### Implementation

- **Location**: MetaTags component (`client/src/components/MetaTags.tsx`)
- **HTML Tag**: `<link rel="canonical" href="..." />`
- **Format**: `https://ctrlaltnews.com/article/{id}/{slug}`

#### Example

```html
<link rel="canonical" href="https://ctrlaltnews.com/article/1/ai-revolution" />
```

This tag:
- Consolidates SEO metrics for the same article
- Prevents duplicate content penalties
- Appears in HTML `<head>`

### 4. Public Robots File (`public/robots.txt`)

Static robots.txt file served for environments without Node.js server.

```
User-agent: *
Allow: /
Allow: /article/
Allow: /category/
Allow: /search

Disallow: /admin
Disallow: /api/internal
Disallow: /api/auth

Sitemap: https://ctrlaltnews.com/sitemap.xml
```

## Sitemap Structure

### URL Priority Levels

- **Homepage** (1.0): Primary landing page
- **Category Pages** (0.8): AI, SCIENCE, ROBOTICS, GADGETS
- **Article Pages** (0.6): Individual articles

### Change Frequency

- **Homepage**: `daily` - Updated frequently with new articles
- **Categories**: `daily` - Updated as articles are added
- **Articles**: `weekly` - Updated when article content changes

### Last Modified Dates

- Uses article's `publishedAt` or `updatedAt` field
- Format: ISO 8601 (YYYY-MM-DD)
- Example: `2026-04-25`

## XML Sitemap Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ctrlaltnews.com</loc>
    <lastmod>2026-04-25</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ctrlaltnews.com/category/ai</loc>
    <lastmod>2026-04-25</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ctrlaltnews.com/article/1/ai-revolution</loc>
    <lastmod>2026-04-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
```

## Robots.txt Configuration

### User-Agent Rules

```
User-agent: *
```
- Applies to all search engine bots

### Allow Paths

```
Allow: /article/       # Individual articles
Allow: /category/      # Category pages
Allow: /search         # Search results
Allow: /               # Root directory
```

### Disallow Paths

```
Disallow: /admin       # Admin panel
Disallow: /api/internal # Internal APIs
Disallow: /api/auth    # Authentication endpoints
```

### Sitemap Reference

```
Sitemap: https://ctrlaltnews.com/sitemap.xml
```

## SEO Benefits

### 1. Improved Discoverability
- Sitemaps help search engines discover all articles
- No need to follow internal links to find content
- Faster indexing of new articles

### 2. Consolidated Metrics
- Canonical URLs prevent duplicate content penalties
- All traffic consolidates to single URL
- Improves SEO ranking

### 3. Crawl Efficiency
- robots.txt prevents wasting crawl budget on admin/api
- Allows search engines to focus on public content
- Reduces server load from bot traffic

### 4. Crawl Control
- Explicit rules about what can/cannot be indexed
- Protects private content
- Manages bot behavior

## Performance Considerations

### Sitemap Generation Time
- Target: <500ms for 100+ articles
- Caching: Recommended for high-traffic sites
- Update frequency: Daily or on article changes

### File Sizes
- Typical sitemap: 5-100 KB (depending on article count)
- robots.txt: <1 KB (static)
- No impact on page load times

## Testing & Validation

### 1. Google Rich Results Test
- URL: https://search.google.com/test/rich-results
- Test: Paste article URL
- Validates: Schema.org markup + canonical URL

### 2. Google Search Console
- URL: https://search.google.com/search-console
- Submit: Sitemap at `/sitemap.xml`
- Monitor: Crawl stats, coverage, errors

### 3. XML Sitemap Validator
- URL: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Validates: XML structure, URL format, priorities

### 4. Robots.txt Tester
- In Google Search Console under "Tools"
- Test: robots.txt rules for specific URLs
- Validates: Allow/Disallow effectiveness

## Troubleshooting

### Issue: Sitemap Not Generating
**Cause**: Missing article data or articles array empty
**Solution**: Ensure articles are fetched from database before sitemap generation

### Issue: Canonical URL Not Appearing
**Cause**: MetaTags component not rendered in ArticleDetail
**Solution**: Verify ArticleSchema component is in page `<head>`

### Issue: robots.txt Returns 404
**Cause**: Static file not in `/public` directory or server not configured
**Solution**: Check `/public/robots.txt` exists and server returns it for `GET /robots.txt`

### Issue: Sitemap XML Invalid
**Cause**: Special characters not escaped in URLs
**Solution**: Use `escapeXML()` utility for any user-generated content in URLs

## Maintenance

### Regular Tasks

1. **Weekly**: Verify sitemap is accessible via `GET /sitemap.xml`
2. **Monthly**: Check Google Search Console for crawl errors
3. **On Article Update**: Confirm `lastmod` date updates
4. **Quarterly**: Review robots.txt rules and update if needed

### Monitoring

```
Google Search Console → Coverage
- Monitor: Article indexing status
- Alert on: Excluded/blocked URLs

Google Search Console → Performance
- Monitor: Average position (ranking)
- Alert on: Sudden drops in impressions
```

## References

- [W3C XML Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [RFC 9309: robots.txt Specification](https://datatracker.ietf.org/doc/rfc9309/)
- [Google Search Central: Crawlable Resources](https://developers.google.com/search/docs/beginner/get-started)
- [Canonical URLs Documentation](https://developers.google.com/search/docs/beginner/canonical)

## FAQ

**Q: How often should the sitemap be updated?**
A: Automatically on article creation/modification. For high-traffic sites, cache for 24 hours.

**Q: Can I have multiple sitemaps?**
A: Yes, if >50K URLs. Create `sitemap_index.xml` with references to multiple sitemaps.

**Q: Does robots.txt affect rankings?**
A: Only indirectly - it controls crawling. Use canonical URLs for ranking consolidation.

**Q: What's the difference between robots.txt and canonical URL?**
A: robots.txt controls crawling; canonical URL consolidates SEO metrics.
