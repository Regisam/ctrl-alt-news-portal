# Meta Tags & Open Graph Implementation Guide

## Overview

This guide explains how meta tags and Open Graph tags are implemented in Ctrl Alt News to enable proper social media sharing and search engine visibility.

## What Are Meta Tags?

Meta tags are HTML elements that provide information about a webpage to search engines and social media platforms. They don't appear on the page itself but are critical for:

- **SEO**: Helping search engines understand page content
- **Social Sharing**: Enabling rich previews when articles are shared on Facebook, Twitter, LinkedIn, WhatsApp
- **User Experience**: Improving click-through rates with attractive preview text and images

## Implementation

### 1. Core Utility: `client/src/lib/meta-tags.ts`

The `generateMetaTags()` function accepts an Article object and returns all necessary meta tags:

```typescript
import { generateMetaTags } from '@/lib/meta-tags';
import type { Article } from '@/lib/data';

const article: Article = {
  id: 1,
  title: { en: 'GPT-5 Breaks Every Benchmark', pt: 'GPT-5 Quebra Todos os Benchmarks' },
  excerpt: { en: 'OpenAI\'s latest model...', pt: '...' },
  category: 'AI',
  author: 'Alex Chen',
  date: 'Feb 24, 2026',
  readTime: '5 min',
  views: '48.2K',
  image: 'https://example.com/image.jpg',
};

const metaTags = generateMetaTags(article, {}, 'en');
console.log(metaTags.title); // "GPT-5 Breaks Every Benchmark: The New..."
console.log(metaTags.ogImage); // "https://example.com/image.jpg"
```

#### Available Tags

| Tag | Purpose | Max Length |
|-----|---------|-----------|
| `title` | Page title for browser tab | 60 chars |
| `description` | Meta description for search results | 160 chars |
| `keywords` | Keywords for search engines | N/A |
| `ogTitle` | Title for social media preview | 100 chars |
| `ogDescription` | Description for social media | 160 chars |
| `ogImage` | Featured image for social preview | N/A |
| `ogUrl` | Canonical URL | N/A |
| `ogType` | Content type (always 'article') | N/A |
| `twitterCard` | Twitter card type | 'summary_large_image' |
| `canonical` | Canonical URL (prevents duplicates) | N/A |

### 2. React Component: `client/src/components/MetaTags.tsx`

The `<MetaTags />` component uses `react-helmet-async` to inject meta tags into the document head.

**Usage:**

```typescript
import MetaTags from '@/components/MetaTags';

export default function ArticleDetail() {
  const article = { /* ... */ };

  return (
    <>
      <MetaTags article={article} lang="en" />
      {/* Article content */}
    </>
  );
}
```

**Props:**

- `article` (required): Article object with title, excerpt, image, etc.
- `lang` (optional): 'en' or 'pt' (default: 'en')
- `siteUrl` (optional): Base URL for canonical links (default: 'https://ctrlaltnews.com')
- `siteName` (optional): Site name for OG tags (default: 'Ctrl Alt News')
- `twitterHandle` (optional): Twitter handle for attribution (default: '@ctrlaltnews')

### 3. Setup: HelmetProvider

The app must be wrapped with `HelmetProvider` for the Helmet component to work:

**`client/src/main.tsx`:**

```typescript
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
```

## Meta Tags Generated

### Basic Meta Tags

```html
<meta name="title" content="Article Title">
<meta name="description" content="Article excerpt...">
<meta name="keywords" content="category, tag1, tag2">
<meta name="author" content="Author Name">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### Open Graph Tags (Facebook, LinkedIn)

```html
<meta property="og:type" content="article">
<meta property="og:url" content="https://ctrlaltnews.com/article/123">
<meta property="og:title" content="Article Title">
<meta property="og:description" content="Article excerpt...">
<meta property="og:image" content="https://ctrlaltnews.com/images/featured.jpg">
<meta property="og:site_name" content="Ctrl Alt News">
<meta property="article:published_time" content="2026-02-24">
<meta property="article:author" content="Author Name">
<meta property="article:section" content="AI">
```

### Twitter Card Tags

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://ctrlaltnews.com/article/123">
<meta name="twitter:title" content="Article Title">
<meta name="twitter:description" content="Article excerpt...">
<meta name="twitter:image" content="https://ctrlaltnews.com/images/featured.jpg">
<meta name="twitter:creator" content="@ctrlaltnews">
```

### Canonical URL

```html
<link rel="canonical" href="https://ctrlaltnews.com/article/123">
```

## Testing Social Preview

### Facebook Sharing Debugger

1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/sharing/)
2. Enter the article URL
3. Verify:
   - ✓ Title appears correctly
   - ✓ Description matches excerpt
   - ✓ Featured image loads
   - ✓ Site name shows as "Ctrl Alt News"

### Twitter Card Validator

1. Go to [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Enter the article URL
3. Verify:
   - ✓ Card type is "summary_large_image"
   - ✓ Title and description display correctly
   - ✓ Image renders properly

### LinkedIn Post Inspector

1. Go to [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
2. Enter the article URL
3. Verify:
   - ✓ Title appears
   - ✓ Description shows
   - ✓ Featured image displays

### Manual Testing

Share article link on social platform to verify preview renders with:
- Article title
- Featured image
- Description/excerpt
- Correct URL

## Troubleshooting

### Tags Not Showing in Social Preview

**Problem:** Social media platforms show generic preview or old cached version

**Solutions:**

1. **Clear Cache**: Social platforms cache previews for 24 hours
   - Use the platform's sharing debugger to refresh cache
   - Example: [Facebook Debugger](https://developers.facebook.com/tools/debug/sharing/)

2. **Verify HTML**: Check that meta tags are present in page source
   ```bash
   curl -s https://ctrlaltnews.com/article/1 | grep -i "og:title"
   ```

3. **Check Canonical URL**: Ensure canonical URL matches the article URL
   ```html
   <link rel="canonical" href="https://ctrlaltnews.com/article/123">
   ```

4. **Image Validation**: Verify OG image URL is accessible
   - Image must be at least 600×315px
   - Use HTTPS URL only
   - Test with browser: `https://example.com/image.jpg`

### Images Not Displaying in Preview

**Problem:** Featured image doesn't appear in social media preview

**Solutions:**

1. Verify image URL is public and accessible
2. Ensure image is at least 600×315px (recommended: 1200×630px)
3. Use HTTPS URLs only
4. Check image format (JPG, PNG, WebP supported)
5. Test image: Open URL directly in browser

### Different Preview on Different Platforms

**Problem:** Preview looks different on Facebook vs. Twitter

**Explanation:** Different platforms have different requirements:

| Platform | Ideal Image Size | Card Type |
|----------|-----------------|-----------|
| Facebook | 1200×630px | OG tags |
| Twitter | 1200×630px | Twitter Card |
| LinkedIn | 1200×627px | OG tags |
| WhatsApp | 600×315px minimum | OG tags |

**Solution:** Use same 1200×630px image for all platforms

## Adding Meta Tags to New Content Types

To add meta tags to a new article or content type:

1. **Import MetaTags component:**
   ```typescript
   import MetaTags from '@/components/MetaTags';
   ```

2. **Add to JSX (top of component):**
   ```typescript
   <MetaTags article={article} lang={lang} />
   ```

3. **Ensure Article type has required fields:**
   - `id`: unique identifier
   - `title`: { en, pt }
   - `excerpt`: { en, pt }
   - `category`: one of AI, SCIENCE, ROBOTICS, GADGETS
   - `author`: author name
   - `date`: publication date
   - `image`: featured image URL

4. **Test with social debuggers:**
   - Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/sharing/)
   - Twitter: [Card Validator](https://cards-dev.twitter.com/validator)
   - LinkedIn: [Post Inspector](https://www.linkedin.com/post-inspector/)

## Performance Notes

- Meta tags are injected via Helmet (client-side)
- No server-side rendering overhead
- SSR (Server-Side Rendering) compatible with Helmet
- Canonical URLs prevent duplicate content penalties

## Security & Best Practices

✓ **DO:**
- Use descriptive, accurate titles
- Write compelling excerpts
- Use real article images
- Include author information
- Set canonical URLs

✗ **DON'T:**
- Use misleading titles (clickbait)
- Exceed character limits (truncated in preview)
- Use broken image links
- Duplicate OG tags
- Mix language in single article

## References

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [React Helmet Async](https://github.com/statelyai/react-helmet-async)
- [SEO Meta Tags](https://www.searchenginejournal.com/meta-tags-seo/)

---

**Last Updated:** 2026-04-24  
**Implementation Status:** Story 10.1 (Complete)  
**Maintainer:** @dev (Dex)
