# Social Sharing Buttons Implementation Guide

**Story**: Story 10.5 (Social Sharing Buttons)  
**Status**: Complete  
**Date**: February 25, 2026

---

## Overview

The social sharing buttons enable users to share articles from the Ctrl Alt News portal across multiple social media platforms. The implementation provides platform-specific share URLs with pre-filled metadata, copy-to-clipboard functionality, and comprehensive analytics event tracking for monitoring user engagement.

## Supported Platforms

1. **Facebook** - Shares with Open Graph metadata from Story 10.4
2. **Twitter/X** - Shares with pre-filled text including article title and author
3. **LinkedIn** - Shares article URL with title information
4. **WhatsApp** - Shares with customizable message text
5. **Email** - Shares with pre-filled subject and body
6. **Copy Link** - Copies article URL to clipboard with fallback support

## Components

### ShareButton Component

**File**: `client/src/components/ShareButton.tsx`

The core component that renders individual share buttons with platform-specific styling and behavior.

#### Props

```typescript
interface ShareButtonProps {
  article: Article;
  platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email' | 'copy';
  text?: string;           // Optional custom share text
  className?: string;      // Optional CSS classes
  onShare?: (platform: SharePlatform) => void;  // Analytics callback
}
```

#### Usage Example

```tsx
import ShareButton from '@/components/ShareButton';
import type { Article } from '@/lib/data';

const handleShare = (platform: SharePlatform) => {
  console.log(`User shared article on ${platform}`);
};

<ShareButton
  article={article}
  platform="twitter"
  onShare={handleShare}
/>
```

#### Features

- **Platform-Specific Styling**: Each platform has unique colors and branding
- **Accessibility**: Full ARIA label support and keyboard navigation (Enter/Space)
- **Copy-to-Clipboard**: Built-in fallback for older browsers using `document.execCommand`
- **Error Handling**: Graceful failure with user-friendly toast notifications

### ShareButtons Component

**File**: `client/src/components/ShareButtons.tsx`

Container component that renders all share button variants together with consistent styling and spacing.

#### Props

```typescript
interface ShareButtonsProps {
  article: Article;
  onShare?: (platform: SharePlatform) => void;
  showLabel?: boolean;      // Show "Share" label (default: true)
  className?: string;       // Optional CSS classes
}
```

#### Usage Example

```tsx
import ShareButtons from '@/components/ShareButtons';

<ShareButtons
  article={article}
  onShare={handleShare}
  showLabel={true}
/>
```

#### Features

- **All Platforms**: Renders buttons for all 6 supported platforms
- **Responsive Layout**: Flexbox layout adapts to mobile and desktop
- **Label Control**: Optional label can be hidden for compact layouts
- **Consistent Styling**: Inherits design patterns from Article Detail page

## Utilities

### Share URL Generation

**File**: `client/src/lib/share-utils.ts`

#### generateShareUrl()

Generates platform-specific share URLs with properly encoded parameters.

```typescript
const url = generateShareUrl(
  'twitter',
  article,
  window.location.href,
  'Custom share text'
);
// Returns: https://twitter.com/intent/tweet?url=...&text=...
```

#### copyToClipboard()

Copies text to clipboard with automatic fallback for older browsers.

```typescript
await copyToClipboard(window.location.href);
// Toast notification shown on success/error
```

#### createShareEvent()

Creates a structured analytics event for tracking shares.

```typescript
const event = createShareEvent(article, 'twitter', userId);
// Returns: { event_name, article_id, platform, timestamp, user_id }
```

#### trackShareEvent()

Sends analytics events to Google Analytics (GA4).

```typescript
trackShareEvent(event);
// Integrates with gtag if available, otherwise silent
```

## Integration with ArticleDetail

The ShareButtons component is integrated into the ArticleDetail page, appearing between the article excerpt and tags section.

### File: `client/src/pages/ArticleDetail.tsx`

```tsx
import ShareButtons from '@/components/ShareButtons';
import { createShareEvent, trackShareEvent } from '@/lib/share-utils';

// In the component:
const handleShare = (platform: SharePlatform) => {
  if (article) {
    const event = createShareEvent(article, platform);
    trackShareEvent(event);
  }
};

return (
  <div>
    {/* ... article content ... */}
    {article && (
      <ShareButtons
        article={article}
        onShare={handleShare}
        className="mb-10"
      />
    )}
    {/* ... author bio, comments, etc ... */}
  </div>
);
```

## Share URL Formats

### Facebook
```
https://www.facebook.com/sharer/sharer.php?u={encoded_url}
```
Uses og:title, og:description, og:image from Story 10.4

### Twitter/X
```
https://twitter.com/intent/tweet?url={encoded_url}&text={encoded_text}&via=ctrlaltnews
```
Format: `{title} by {author} at Ctrl Alt News`

### LinkedIn
```
https://www.linkedin.com/sharing/share-offsite/?url={encoded_url}
```

### WhatsApp
```
https://wa.me/?text={encoded_text}
```
Format: `{title} - {url}`

### Email
```
mailto:?subject={encoded_subject}&body={encoded_body}
```
Subject: Article title
Body: `Check out: {title}\n\n{url}`

### Copy Link
Direct URL copy via clipboard API or fallback method

## Analytics Integration

All share events are tracked with the following schema:

```typescript
interface ShareEvent {
  event_name: 'article_shared';
  article_id: number;
  article_title: string;
  platform: string;  // facebook, twitter, linkedin, whatsapp, email, copy
  timestamp: string; // ISO 8601 format
  user_id?: string;  // Optional user identifier
}
```

### GA4 Integration

Events are sent to Google Analytics 4 with the following structure:

```javascript
gtag('event', 'article_shared', {
  article_id: 1,
  article_title: 'Article Title',
  platform: 'twitter',
  timestamp: '2026-02-25T10:30:00Z',
  user_id: 'user-123'
});
```

## Accessibility

### ARIA Labels

All buttons have descriptive ARIA labels:
- `Share on Facebook`
- `Share on X / Twitter`
- `Share on LinkedIn`
- `Share on WhatsApp`
- `Share on Email`
- `Copy Link`

### Keyboard Navigation

- **Enter**: Activate button
- **Space**: Activate button
- **Tab**: Navigate between buttons

### Color Contrast

All buttons meet WCAG 2.1 AA standards for color contrast against the dark background.

## Testing

### Unit Tests

**Component Tests**: 11 test cases covering:
- Button rendering and labels
- Click handlers and share URL generation
- Keyboard navigation (Enter/Space)
- Clipboard functionality with error handling
- Custom text support
- Accessibility features

**Utility Tests**: 14 test cases covering:
- URL generation for all 6 platforms
- Clipboard API with fallback
- Event creation and tracking
- GA4 integration

### Test Execution

```bash
# Run all tests
npm test

# Run specific test file
npm test -- share-utils.test.ts
npm test -- ShareButton.test.tsx
```

## Browser Compatibility

- **Modern Browsers**: Full support for all features
- **Older Browsers**: Clipboard fallback using `document.execCommand('copy')`
- **Mobile**: All platforms supported via native apps or web fallbacks
- **Accessibility**: Works with screen readers and keyboard-only navigation

## Performance Considerations

- **Lazy Loading**: Share buttons load only when article detail page is rendered
- **No External Dependencies**: Uses native browser APIs (clipboard, window.open)
- **Minimal Bundle Size**: ~400 bytes gzipped for components + utilities
- **Efficient Analytics**: Event tracking is non-blocking and deferred

## Future Enhancements (Story 10.6+)

1. **Share Count Display**: Show number of shares per article
2. **Social Media Preview**: Display live social preview before sharing
3. **Custom Share Messages**: Allow users to customize share text
4. **Share Analytics Dashboard**: Visual analytics for share metrics
5. **Deep Linking**: App-specific links for social apps
6. **Share Tracking**: Advanced metrics on which platforms drive traffic

## Troubleshooting

### Clipboard Not Working
- Verify HTTPS connection (required for Clipboard API)
- Check browser permissions
- Fallback to `document.execCommand` is automatic

### Share URLs Not Opening
- Ensure article URL is properly encoded
- Verify social platform URL patterns match current APIs
- Check for browser popup blocking

### Analytics Not Tracked
- Verify GA4 is initialized in `window.gtag`
- Check browser console for errors
- Ensure timestamps are in ISO 8601 format

## References

- **Story 10.4**: Open Graph Tags for Social Sharing
- **Story 10.6**: Share Analytics and Tracking
- **Components**: ShareButton, ShareButtons in `client/src/components/`
- **Utilities**: Share URL generation in `client/src/lib/share-utils.ts`
- **Tests**: Unit and integration tests in `client/src/__tests__/`

---

**Last Updated**: February 25, 2026  
**Author**: Development Team  
**Status**: Complete ✓
