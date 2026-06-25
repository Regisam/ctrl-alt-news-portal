# Real-time Analytics Dashboard Guide

## Overview

Real-time analytics dashboard for monitoring platform performance, user behavior, and engagement metrics.

## Dashboard Metrics

### User Activity (AC3)

```bash
GET /api/analytics-live/users
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeUsers": 234,
    "activeSessions": 456,
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

### Article Metrics (AC4)

```bash
GET /api/analytics-live/articles
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalViews": 12453,
    "trending": [
      { "title": "AI Breakthrough", "views": 256, "category": "AI" },
      { "title": "New Robot", "views": 198, "category": "Robotics" }
    ],
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

### Performance Metrics (AC5)

```bash
GET /api/analytics-live/performance
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "avgResponseTime": 145,
    "errorCount": 2,
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

### Email Metrics (AC6)

```bash
GET /api/analytics-live/emails
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 1245,
    "opened": 456,
    "clicked": 123,
    "openRate": "36.6%",
    "clickRate": "27.0%",
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

### Push Metrics (AC7)

```bash
GET /api/analytics-live/push
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sent": 890,
    "clicked": 156,
    "clickRate": "17.5%",
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

### Search Analytics (AC8)

```bash
GET /api/analytics-live/search
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 3456,
    "noResults": 234,
    "rate": "6.8%",
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

### Time-Series Data (AC9)

```bash
GET /api/analytics-live/timeseries
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "timestamp": "2026-06-26T10:00:00Z",
        "users": 200,
        "articles": 5000,
        "emails": 100,
        "push": 50,
        "errors": 0
      }
    ],
    "count": 100,
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

## Filtering & Export

### AC10: Date Range Filter

```bash
GET /api/analytics-live/range?start=2026-06-25T00:00:00Z&end=2026-06-26T23:59:59Z
Authorization: Bearer {token}
```

### AC10: Articles by Category

```bash
GET /api/analytics-live/articles/AI
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "AI",
    "articles": [
      { "title": "AI Breakthrough", "views": 256 },
      { "title": "GPT-5 Released", "views": 189 }
    ],
    "count": 2,
    "timestamp": "2026-06-26T10:30:00Z"
  }
}
```

### AC11: Export as CSV

```bash
GET /api/analytics-live/export/csv
Authorization: Bearer {token}
```

**Response:** CSV file download
```
timestamp,users,articles,emails,push,errors
2026-06-26T10:00:00Z,200,5000,100,50,0
2026-06-26T10:01:00Z,205,5012,102,51,1
```

### AC11: Export as JSON

```bash
GET /api/analytics-live/export/json
Authorization: Bearer {token}
```

**Response:** JSON file download
```json
{
  "exportDate": "2026-06-26T10:30:00Z",
  "metrics": { ... },
  "timeSeries": [ ... ]
}
```

## Tracking Events

### Track Article View

```bash
POST /api/analytics-live/track/article-view
Content-Type: application/json

{
  "articleId": "article-123",
  "title": "AI Breakthrough",
  "category": "AI"
}
```

### Track Email Event

```bash
POST /api/analytics-live/track/email
Content-Type: application/json

{
  "type": "opened"  // 'sent' | 'opened' | 'clicked'
}
```

### Track Push Event

```bash
POST /api/analytics-live/track/push
Content-Type: application/json

{
  "type": "clicked"  // 'sent' | 'clicked' | 'dismissed'
}
```

## Dashboard Layout

### AC1: Grid Layout

```
┌─────────────────────────────────────────────┐
│          CTRL ALT NEWS ANALYTICS            │
├──────────────┬──────────────┬───────────────┤
│ Active Users │ Active Sess  │ Avg Response  │
│    234       │     456      │    145ms      │
├──────────────┼──────────────┼───────────────┤
│ Articles Vie │  Email Open  │  Push Clicks  │
│   12,453     │    36.6%     │    17.5%      │
├──────────────┴──────────────┴───────────────┤
│          TRENDING ARTICLES                  │
│ 1. AI Breakthrough (256 views)             │
│ 2. New Robot Technology (198 views)        │
│ 3. Gadget Review (156 views)               │
├─────────────────────────────────────────────┤
│          TIME-SERIES CHART                  │
│  Users ─────────────────────────            │
│  Articles ───────────────────────            │
│  Errors ──                                   │
├─────────────────────────────────────────────┤
│ [Date Range ▼] [Export CSV] [Export JSON]  │
└─────────────────────────────────────────────┘
```

### AC2: Real-time Updates

Dashboard updates every 10 seconds via WebSocket:
- User count updates
- Article view counts
- Email/push metrics
- Performance metrics
- Time-series data

## Key Metrics Explained

| Metric | What It Means | Good Value |
|--------|---------------|------------|
| Active Users | Current online users | Growing over time |
| Avg Response Time | Server speed (ms) | < 200ms |
| Email Open Rate | % of users opening | > 30% |
| Email Click Rate | % of opens clicking | > 20% |
| Push Click Rate | % of notifications clicked | > 15% |
| Search No Results | % of searches with no results | < 10% |
| Error Count | Total errors in period | As low as possible |

## Best Practices

1. **Monitor Trends** — Watch for anomalies and changes
2. **Act on Data** — Use metrics to drive decisions
3. **Set Baselines** — Know your normal metrics
4. **Alert on Anomalies** — Set thresholds for alerts
5. **Export Reports** — Share data with stakeholders
6. **Track Changes** — Monitor impact of new features
7. **Optimize** — Use data to identify optimization opportunities

## Real-time Updates

### JavaScript Usage

```typescript
import { analyticsService } from '../lib/analyticsService';

// Track article view
analyticsService.trackArticleView('article-1', 'AI Breakthrough', 'AI');

// Track email
analyticsService.trackEmail('opened');

// Track push
analyticsService.trackPush('clicked');

// Get live metrics
const metrics = analyticsService.getLiveMetrics();
console.log(`Active users: ${metrics.activeUsers}`);
```

### WebSocket Real-time

```typescript
const socket = new WebSocket('wss://ctrlaltnews.com/api/analytics-live/ws');

socket.addEventListener('message', (event) => {
  const metrics = JSON.parse(event.data);
  console.log(`Users: ${metrics.activeUsers}`);
});
```

## Troubleshooting

### Metrics Not Updating

1. Check tracking events are firing
2. Verify `analyticsService.trackArticleView()` called
3. Check WebSocket connection
4. Review server logs for errors

### High Response Times

1. Check database queries
2. Monitor Redis cache
3. Check server resources
4. Review slow query logs

### High Error Rate

1. Review error logs
2. Check external API connectivity
3. Monitor database health
4. Check rate limiting status

