# Push Notifications & Web Push API Guide

## Overview

Browser-based push notifications using Web Push Protocol for real-time user engagement.

## Setup

### Environment Variables

```bash
# VAPID Keys (generate with: web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:admin@ctrlaltnews.com
```

### Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### HTTPS Requirement

Web Push only works over HTTPS. In development:
- Use localhost (works without HTTPS)
- Use self-signed certificate
- Use ngrok tunnel

## How It Works

### 1. Request Permission

```typescript
const permission = await Notification.requestPermission();
// Returns: 'granted', 'denied', 'default'
```

### 2. Register Service Worker

```typescript
const registration = await navigator.serviceWorker.register('/sw.js');
```

### 3. Subscribe to Push

```typescript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey),
});

// Send subscription to server
await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify(subscription),
});
```

### 4. Server Sends Push

```bash
POST /api/push/test
Authorization: Bearer {token}

{
  "title": "Breaking News",
  "body": "New article published"
}
```

### 5. Browser Receives & Displays

Service Worker handles `push` event and displays notification.

## API Endpoints

### Get VAPID Public Key

```bash
GET /api/push/vapid-public-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicKey": "BPn8..."
  }
}
```

### Subscribe to Push

```bash
POST /api/push/subscribe
Authorization: Bearer {token}
Content-Type: application/json

{
  "endpoint": "https://...",
  "keys": {
    "auth": "...",
    "p256dh": "..."
  }
}
```

### Get Subscriptions

```bash
GET /api/push/subscriptions
Authorization: Bearer {token}
```

### Unsubscribe

```bash
POST /api/push/unsubscribe/:subscriptionId
Authorization: Bearer {token}
```

### Send Test Notification

```bash
POST /api/push/test
Authorization: Bearer {token}

{
  "title": "Test",
  "body": "This is a test"
}
```

### Track Click

```bash
POST /api/push/track/click
Authorization: Bearer {token}

{
  "subscriptionId": "sub-123",
  "data": { "articleId": "article-456" }
}
```

### Track Dismiss

```bash
POST /api/push/track/dismiss
Authorization: Bearer {token}

{
  "subscriptionId": "sub-123"
}
```

### Get Metrics

```bash
GET /api/push/metrics
Authorization: Bearer {token}
```

## Service Worker

### Basic Service Worker

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || 'notification',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Track click
  fetch('/api/push/track/click', {
    method: 'POST',
    body: JSON.stringify({
      subscriptionId: event.notification.tag,
      data: event.notification.data,
    }),
  });

  // Open app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
```

## React Implementation

```typescript
import { useEffect, useState } from 'react';

function usePushNotifications() {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Check support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      return;
    }

    // Request permission
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        subscribeToPush();
      }
    });
  }, []);

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Get public key
      const res = await fetch('/api/push/vapid-public-key');
      const { data } = await res.json();

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      // Save subscription
      await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
      });

      setSubscribed(true);
    } catch (error) {
      console.error('Push subscription failed', error);
    }
  };

  return { subscribed, supported };
}

export default usePushNotifications;
```

## Notifications Types

### Breaking News

```javascript
{
  title: '⚡ Breaking News',
  body: 'Major story just published',
  icon: '/breaking-icon.png',
  tag: 'breaking-news',
  data: {
    articleId: 'article-123',
    url: '/articles/article-123'
  }
}
```

### New Recommendation

```javascript
{
  title: '📚 New Article for You',
  body: 'Based on your interests',
  icon: '/recommendation-icon.png',
  tag: 'recommendation',
  data: {
    articleId: 'article-456'
  }
}
```

### Engagement

```javascript
{
  title: '💬 Your article got comments',
  body: '5 new comments on "AI Trends"',
  icon: '/comment-icon.png',
  tag: 'engagement',
  data: {
    articleId: 'article-789'
  }
}
```

## Metrics

### Key Metrics

- **Sent**: Total push notifications sent
- **Delivered**: Successfully delivered
- **Failed**: Failed deliveries
- **Clicked**: User clicks
- **Dismissed**: User dismisses
- **Delivery Rate**: % of sent that delivered
- **Click Rate**: % of delivered that were clicked

### Target Rates

- **Delivery Rate**: > 95%
- **Click Rate**: > 20%
- **Churn**: < 5% per month

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ⚠️ Partial (iOS 16.1+) |
| Edge | ✅ Full |
| Opera | ✅ Full |

## Troubleshooting

### Notifications Not Showing

1. Check browser notification permission
2. Verify Service Worker registered
3. Check browser console for errors
4. Test with `/api/push/test` endpoint

### Service Worker Issues

1. Verify `/sw.js` is served with correct MIME type
2. Check browser DevTools → Application → Service Workers
3. Clear site data and re-register

### Subscription Failed

1. Verify VAPID keys are set
2. Check HTTPS is enabled (or localhost)
3. Verify browser supports Web Push

## Best Practices

1. **Permission**: Ask at right moment, not on load
2. **Content**: Relevant, timely, concise
3. **Frequency**: Don't spam users
4. **Action**: Each notification should have purpose
5. **Personalization**: Use user preferences
6. **Metrics**: Monitor click rates
7. **Testing**: Test across browsers
8. **Fallback**: Have email as fallback

