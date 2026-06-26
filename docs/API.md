# Ctrl Alt News Portal — API Documentation

Complete REST API reference for the Ctrl Alt News Portal.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://ctrlaltnews.com/api`

## Authentication

All endpoints (except public ones) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```
POST /auth-v2/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response 200:
{
  "token": "eyJhbGc...",
  "userId": "user-123",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": null
  }
}
```

#### Login
```
POST /auth-v2/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response 200:
{
  "token": "eyJhbGc...",
  "userId": "user-123"
}
```

#### Get Current User
```
GET /auth-v2/me
Authorization: Bearer <token>

Response 200:
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "createdAt": "2026-06-26T00:00:00Z"
}
```

#### Logout
```
POST /auth-v2/logout
Authorization: Bearer <token>

Response 200:
{
  "status": "logged_out"
}
```

### Articles

#### Search Articles
```
GET /search/articles?q=AI&limit=20&offset=0
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "articles": [
      {
        "id": "article-1",
        "title": "AI Breakthroughs",
        "excerpt": "Latest advances in AI...",
        "category": "AI",
        "author": "Tech Writer",
        "views": 1234,
        "likes": 45,
        "publishedAt": "2026-06-26T00:00:00Z"
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

#### Get Articles by Category
```
GET /search/articles?category=AI
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "articles": [...],
    "category": "AI",
    "total": 450
  }
}
```

#### Get Article Detail
```
GET /search/articles/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "article-1",
  "title": "AI Breakthroughs",
  "content": "<h2>Introduction</h2><p>...",
  "excerpt": "Latest advances in AI...",
  "category": "AI",
  "author": "Tech Writer",
  "image": "https://...",
  "views": 1234,
  "likes": 45,
  "comments": 12,
  "publishedAt": "2026-06-26T00:00:00Z"
}
```

### Analytics

#### Get Live Metrics
```
GET /analytics-live/live
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "metrics": {
      "activeUsers": 234,
      "articlesViewed": 12453,
      "emailsSent": 1245,
      "pushNotifications": 890,
      "errorRate": 0.5,
      "avgResponseTime": 145
    },
    "timestamp": "2026-06-26T12:00:00Z"
  }
}
```

#### Get Time Series Data
```
GET /analytics-live/time-series/:metric?hours=24
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "metric": "activeUsers",
    "timeframe": "24h",
    "dataPoints": [
      { "timestamp": "2026-06-26T00:00:00Z", "value": 150 },
      { "timestamp": "2026-06-26T01:00:00Z", "value": 180 },
      ...
    ]
  }
}
```

#### Get Metrics for Date Range
```
GET /analytics-live/metrics?start=2026-06-20&end=2026-06-26
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "startDate": "2026-06-20",
    "endDate": "2026-06-26",
    "metrics": {
      "totalUsers": 5000,
      "totalViews": 125000,
      "avgSessionDuration": 450,
      "bounceRate": 0.25
    }
  }
}
```

#### Track Article View
```
POST /analytics-live/track-view
Authorization: Bearer <token>
Content-Type: application/json

{
  "articleId": "article-1"
}

Response 200:
{
  "status": "tracked",
  "articleId": "article-1"
}
```

#### Track Search
```
POST /analytics-live/track-search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "AI",
  "results": 150
}

Response 200:
{
  "status": "tracked",
  "query": "AI"
}
```

### Push Notifications

#### Get VAPID Public Key
```
GET /push/vapid-public-key

Response 200:
{
  "publicKey": "BO5..."
}
```

#### Subscribe to Push Notifications
```
POST /push/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}

Response 200:
{
  "subscriptionId": "sub-123",
  "status": "subscribed"
}
```

#### Get Push Subscriptions
```
GET /push/subscriptions
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "subscriptions": [
      {
        "id": "sub-123",
        "endpoint": "https://fcm.googleapis.com/...",
        "createdAt": "2026-06-26T00:00:00Z"
      }
    ]
  }
}
```

#### Unsubscribe from Push
```
POST /push/unsubscribe/:subscriptionId
Authorization: Bearer <token>

Response 200:
{
  "status": "unsubscribed"
}
```

#### Get Push Metrics
```
GET /push/metrics
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "sent": 5000,
    "delivered": 4800,
    "clicked": 1200,
    "dismissed": 3000,
    "failed": 200,
    "openRate": 0.24,
    "clickRate": 0.24
  }
}
```

### Email

#### Send Verification Email
```
POST /transactional/send-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "status": "sent",
  "tokenId": "token-123"
}
```

#### Send Password Reset Email
```
POST /transactional/send-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}

Response 200:
{
  "status": "sent",
  "resetUrl": "https://ctrlaltnews.com/reset?token=..."
}
```

#### Subscribe to Daily Digest
```
POST /digest/subscribe
Authorization: Bearer <token>
Content-Type: application/json

{
  "frequency": "daily",
  "time": "09:00",
  "categories": ["AI", "Science"]
}

Response 200:
{
  "status": "subscribed",
  "frequency": "daily"
}
```

### User Behavior

#### Start Session
```
POST /user-behavior/sessions/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-123"
}

Response 200:
{
  "sessionId": "session-456"
}
```

#### Track Page View
```
POST /user-behavior/sessions/:sessionId/pageview
Authorization: Bearer <token>
Content-Type: application/json

{
  "page": "/articles/article-1"
}

Response 200:
{
  "status": "tracked"
}
```

#### Track Event
```
POST /user-behavior/events/track
Authorization: Bearer <token>
Content-Type: application/json

{
  "event": "button_click",
  "data": {
    "target": "subscribe_button",
    "value": 1
  }
}

Response 200:
{
  "status": "tracked"
}
```

#### Get Engagement Score
```
GET /user-behavior/users/:userId/engagement
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "userId": "user-123",
    "score": 75,
    "level": "high",
    "factors": {
      "events": 45,
      "sessions": 12,
      "duration": 3600
    }
  }
}
```

#### Get Churn Risk
```
GET /user-behavior/users/:userId/churn-risk
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "userId": "user-123",
    "risk": "low",
    "score": 25,
    "recentActivity": {
      "lastLogin": "2026-06-26T12:00:00Z",
      "lastAction": "2026-06-26T11:30:00Z"
    }
  }
}
```

### A/B Testing (Experiments)

#### Get Active Experiments
```
GET /experiments
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "experiments": [
      {
        "id": "exp-1",
        "name": "Button Color Test",
        "status": "running",
        "variants": [
          { "id": "var-1", "name": "Red", "traffic": 50 },
          { "id": "var-2", "name": "Blue", "traffic": 50 }
        ]
      }
    ]
  }
}
```

#### Get User Variant
```
GET /experiments/:experimentId/assign?userId=user-123
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "experimentId": "exp-1",
    "userId": "user-123",
    "variantId": "var-1",
    "variantName": "Red"
  }
}
```

#### Track Experiment Metric
```
POST /experiments/:experimentId/metrics
Authorization: Bearer <token>
Content-Type: application/json

{
  "metric": "conversion",
  "value": 1,
  "userId": "user-123"
}

Response 200:
{
  "status": "tracked"
}
```

#### Get Experiment Results
```
GET /experiments/:experimentId/results
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "experimentId": "exp-1",
    "status": "running",
    "variants": [
      {
        "id": "var-1",
        "name": "Red",
        "conversions": 150,
        "conversionRate": 0.45,
        "confidence": 0.95
      },
      {
        "id": "var-2",
        "name": "Blue",
        "conversions": 120,
        "conversionRate": 0.38,
        "confidence": 0.92
      }
    ]
  }
}
```

### Alerts

#### Get Alerts Dashboard
```
GET /alerts/dashboard
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "activeAlerts": 3,
    "criticalAlerts": 1,
    "warningAlerts": 2,
    "alerts": [
      {
        "id": "alert-1",
        "metric": "response_time",
        "severity": "warning",
        "message": "API response time > 500ms",
        "createdAt": "2026-06-26T12:00:00Z"
      }
    ]
  }
}
```

#### Get Alert History
```
GET /alerts/history
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "alerts": [
      {
        "id": "alert-1",
        "metric": "response_time",
        "severity": "warning",
        "status": "resolved",
        "createdAt": "2026-06-26T12:00:00Z",
        "resolvedAt": "2026-06-26T13:00:00Z"
      }
    ]
  }
}
```

### Admin

#### Get Pending Articles
```
GET /admin/pending-articles
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "articles": [
      {
        "id": "article-1",
        "title": "New Article",
        "author": "Writer Name",
        "createdAt": "2026-06-26T00:00:00Z",
        "status": "pending"
      }
    ]
  }
}
```

#### Approve Article
```
POST /admin/articles/:articleId/approve
Authorization: Bearer <token>

Response 200:
{
  "status": "approved",
  "articleId": "article-1"
}
```

#### Get Reports
```
GET /admin/reports
Authorization: Bearer <token>

Response 200:
{
  "data": {
    "reports": [
      {
        "id": "report-1",
        "reason": "Inappropriate content",
        "target": "article-1",
        "createdAt": "2026-06-26T00:00:00Z",
        "status": "open"
      }
    ]
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2026-06-26T12:00:00Z"
}
```

### Common Status Codes

- `200` — Success
- `201` — Created
- `400` — Bad Request
- `401` — Unauthorized
- `403` — Forbidden
- `404` — Not Found
- `429` — Too Many Requests
- `500` — Server Error

## Rate Limiting

API requests are rate limited:

- **Free tier:** 100 requests/minute
- **Premium tier:** 1000 requests/minute

Limits are returned in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1687000000
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { apiClient } from './lib/api';

// Register
const user = await apiClient.authAPI.register('user@example.com', 'password');

// Search articles
const results = await apiClient.articlesAPI.search('AI');

// Get metrics
const metrics = await apiClient.analyticsAPI.getLiveMetrics();
```

### cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth-v2/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get metrics
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/analytics-live/live
```

## Webhooks

Coming soon: Real-time event webhooks for integrations.

---

**Ctrl Alt News Portal API v1.0** | Last updated: 2026-06-26
