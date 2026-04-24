# Schema.org & Structured Data Implementation Guide

## Overview

This guide explains how schema.org structured data (JSON-LD) is implemented in Ctrl Alt News to enable rich snippets in search results and knowledge panels.

## What Is Structured Data?

Structured data is machine-readable information that helps search engines and social platforms understand page content. Schema.org provides standardized vocabulary for marking up articles, with benefits including:

- **Rich Snippets**: Enhanced search result preview with images, ratings, dates
- **Knowledge Panels**: Wikipedia-style panels in search results
- **Voice Search**: Better understanding for voice assistants
- **Social Sharing**: Enriched preview data across platforms
- **SEO Ranking**: Positive signal for search engine rankings

## Implementation

### 1. Core Utility: `client/src/lib/schema.ts`

The `generateArticleSchema()` function generates schema.org structured data for articles:

```typescript
import { generateArticleSchema, generateBreadcrumbSchema } from '@/lib/schema';
import type { Article } from '@/lib/data';

const article: Article = {
  id: 1,
  title: { en: 'GPT-5 Breaks Every Benchmark', pt: '...' },
  excerpt: { en: 'OpenAI\'s latest model...', pt: '...' },
  category: 'AI',
  author: 'Alex Chen',
  date: 'Apr 25, 2026',
  readTime: '5 min',
  views: '48.2K',
  image: 'https://example.com/image.jpg',
};

const articleSchema = generateArticleSchema(article);
const breadcrumbSchema = generateBreadcrumbSchema(article);
```

#### Available Functions

- `generateArticleSchema(article, config)` — Creates NewsArticle schema
- `generateBreadcrumbSchema(article, config)` — Creates BreadcrumbList schema

#### Schema Properties

| Property | Type | Purpose | Max |
|----------|------|---------|-----|
| headline | string | Article title for search results | 100 chars |
| description | string | Brief article summary | 160 chars |
| image | ImageObject[] | Featured image with dimensions | 1200×630px |
| datePublished | ISO 8601 | Publication date (RFC 3339 format) | — |
| author | Person | Author name and profile URL | — |
| publisher | Organization | Site info (logo, name, URL) | — |
| articleSection | string | Category (AI, Science, Robotics, Gadgets) | — |

### 2. React Component: `client/src/components/ArticleSchema.tsx`

The `<ArticleSchema />` component injects JSON-LD scripts into the page:

```typescript
import ArticleSchema from '@/components/ArticleSchema';

export default function ArticleDetail() {
  const article = { /* article data */ };

  return (
    <>
      <ArticleSchema article={article} />
      {/* Article content */}
    </>
  );
}
```

**Props:**

- `article` (required): Article object with title, excerpt, image, etc.
- `siteUrl` (optional): Base URL for canonical links (default: 'https://ctrlaltnews.com')
- `siteName` (optional): Site name for publisher schema (default: 'Ctrl Alt News')

### 3. Generated Schema Output

The component generates two `<script type="application/ld+json">` tags:

#### Article Schema (NewsArticle)

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Article Title",
  "description": "Article excerpt...",
  "image": [
    {
      "@type": "ImageObject",
      "url": "https://example.com/image.jpg",
      "width": 1200,
      "height": 630
    }
  ],
  "datePublished": "2026-04-25T10:00:00.000Z",
  "dateModified": "2026-04-25T10:00:00.000Z",
  "author": {
    "@type": "Person",
    "name": "Alex Chen",
    "url": "https://ctrlaltnews.com/author/alex-chen"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Ctrl Alt News",
    "logo": {
      "@type": "ImageObject",
      "url": "https://ctrlaltnews.com/logo.png",
      "width": 600,
      "height": 60
    },
    "url": "https://ctrlaltnews.com"
  },
  "articleSection": "AI"
}
```

#### Breadcrumb Schema (BreadcrumbList)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://ctrlaltnews.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "AI",
      "item": "https://ctrlaltnews.com/category/ai"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Article Title",
      "item": "https://ctrlaltnews.com/article/123"
    }
  ]
}
```

## Testing Schema Implementation

### Google Rich Results Test

1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter article URL or paste page HTML
3. Verify:
   - ✓ "NewsArticle" schema detected
   - ✓ Rich result preview displays correctly
   - ✓ No validation errors

### Schema.org Validator

1. Go to [schema.org Validator](https://validator.schema.org)
2. Enter article URL
3. Verify:
   - ✓ All required properties present
   - ✓ No validation warnings
   - ✓ Image dimensions specified

### Manual Browser Test

1. Open article in browser
2. Right-click → Inspect → View page source
3. Search for `<script type="application/ld+json">`
4. Verify:
   - ✓ Two script tags present (article + breadcrumb)
   - ✓ Valid JSON format
   - ✓ All required fields populated

## Common Patterns

### Article with Custom Config

```typescript
<ArticleSchema
  article={article}
  siteUrl="https://custom-domain.com"
  siteName="Custom News Site"
/>
```

### Multi-Language Support

```typescript
// Schema uses English title by default, falls back to Portuguese
const schema = generateArticleSchema(article);
// headline will be article.title.en (or article.title.pt if en missing)
```

### Image Fallback

If article has no featured image, category placeholder is used:
- AI → AI-specific image
- SCIENCE → Science-specific image
- ROBOTICS → Robotics-specific image
- GADGETS → Gadgets-specific image

## Troubleshooting

### "Schema not showing in Google"

**Causes:**
1. Google hasn't crawled page yet (can take days)
2. Page structure prevents indexing
3. Schema validation errors

**Solutions:**
1. Submit URL to Google Search Console
2. Wait 1-2 weeks for crawl
3. Check Google Rich Results Test for errors

### "Image not appearing in rich snippet"

**Causes:**
1. Missing or invalid image URL
2. Image dimensions not specified
3. Image blocked by robots.txt

**Solutions:**
1. Verify image URL is publicly accessible
2. Ensure image dimensions are set (1200×630px ideal)
3. Check robots.txt allows image crawling

### "Breadcrumb not showing"

**Causes:**
1. BreadcrumbList not rendering
2. Invalid position numbering
3. Incorrect hierarchy

**Solutions:**
1. Verify both script tags present in HTML
2. Check position sequence (1, 2, 3)
3. Ensure hierarchy matches site structure

## Performance Notes

- JSON-LD scripts are lightweight (1-2KB)
- No impact on page load time
- No server-side processing required
- Works with React client-side rendering

## Security & Best Practices

✓ **DO:**
- Use real article data (no fabrication)
- Keep dates in ISO 8601 format
- Specify image dimensions
- Include author information
- Use HTTPS URLs only

✗ **DON'T:**
- Markup non-articles as articles
- Use placeholder/dummy data
- Omit required fields
- Use inconsistent author names
- Link to inaccessible URLs

## Advanced: Custom Schema Types

To add schema for new content types (recipes, events, products):

1. Define new interface in `schema.ts`:
   ```typescript
   export interface RecipeSchemaType {
     '@context': string;
     '@type': 'Recipe';
     name: string;
     // ... recipe properties
   }
   ```

2. Create generator function:
   ```typescript
   export function generateRecipeSchema(recipe: Recipe): RecipeSchemaType {
     // implementation
   }
   ```

3. Add component wrapper:
   ```typescript
   export function RecipeSchema({ recipe }: Props) {
     const schema = generateRecipeSchema(recipe);
     return <script type="application/ld+json" dangerouslySetInnerHTML={{...}} />
   }
   ```

## References

- [Schema.org Documentation](https://schema.org)
- [Google Structured Data Guide](https://developers.google.com/search/docs/beginner/intro-structured-data)
- [NewsArticle Schema](https://schema.org/NewsArticle)
- [BreadcrumbList Schema](https://schema.org/BreadcrumbList)
- [JSON-LD Format](https://json-ld.org)

---

**Last Updated:** 2026-04-25  
**Implementation Status:** Story 10.2 (Complete)  
**Maintainer:** @dev (Dex)
