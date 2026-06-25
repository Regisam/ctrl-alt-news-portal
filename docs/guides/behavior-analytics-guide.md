# User Behavior Analytics v2 Guide

## Overview

Advanced user behavior analytics for understanding engagement patterns, retention, and churn.

## Session Management

### AC1: Start User Session

```bash
POST /api/user-behavior/sessions/start
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-123456"
  }
}
```

### AC1: End Session

```bash
POST /api/user-behavior/sessions/:id/end
Authorization: Bearer {token}
```

### AC1: Track Page View

```bash
POST /api/user-behavior/sessions/:id/pageview
```

### AC1: Get Active Sessions

```bash
GET /api/user-behavior/sessions/active
Authorization: Bearer {token}
```

## Event Tracking

### AC8: Track Custom Event

```bash
POST /api/user-behavior/events/track
Content-Type: application/json

{
  "userId": "user-123",
  "eventName": "article_read",
  "eventData": {
    "articleId": "article-456",
    "readTime": 120
  }
}
```

**Common Events:**
- `page_view` - User viewed page
- `article_read` - User read article
- `search_query` - User performed search
- `comment_posted` - User commented
- `share_clicked` - User shared content

## Funnel Analysis

### AC2: Define Funnel

```bash
POST /api/user-behavior/funnels/define
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "signup-funnel",
  "steps": [
    "landing_page",
    "signup_start",
    "email_verified",
    "profile_complete",
    "first_article"
  ]
}
```

### AC2: Track Funnel Step

```bash
POST /api/user-behavior/funnels/:id/track
Content-Type: application/json

{
  "userId": "user-123",
  "step": 2
}
```

### AC2: Get Funnel Metrics

```bash
GET /api/user-behavior/funnels/:id/metrics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "step": 1,
        "name": "landing_page",
        "totalUsers": 5000,
        "completions": 5000,
        "dropoffRate": 0
      },
      {
        "step": 2,
        "name": "signup_start",
        "totalUsers": 5000,
        "completions": 3500,
        "dropoffRate": 30
      }
    ]
  }
}
```

## Cohort Analysis

### AC3: Create Cohort

```bash
POST /api/user-behavior/cohorts/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "june-2026-signups",
  "name": "June 2026 Sign-ups",
  "criteria": "signupDate >= 2026-06-01"
}
```

### AC3: Add User to Cohort

```bash
POST /api/user-behavior/cohorts/:id/add-user
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "user-123"
}
```

### AC4: Calculate Retention

```bash
GET /api/user-behavior/cohorts/:id/retention?days=1,7,30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "retention": {
      "1": 4500,
      "7": 3200,
      "30": 1800
    }
  }
}
```

### AC9: Compare Cohorts

```bash
POST /api/user-behavior/cohorts/compare
Authorization: Bearer {token}
Content-Type: application/json

{
  "cohort1": "june-2026-signups",
  "cohort2": "may-2026-signups"
}
```

## User Engagement

### AC5: Predict Churn Risk

```bash
GET /api/user-behavior/users/:id/churn-risk
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "risk": "medium",
    "score": 65
  }
}
```

**Risk Levels:**
- `low` (0-40): User highly engaged
- `medium` (40-70): User moderately at risk
- `high` (70-100): User likely to churn

### AC6: Get Engagement Score

```bash
GET /api/user-behavior/users/:id/engagement
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "engagement": {
      "userId": "user-123",
      "score": 82,
      "level": "high",
      "factors": ["high_event_count", "high_engagement_duration"]
    }
  }
}
```

**Engagement Level:**
- `low` (0-40): < 5 events, < 5 min/month
- `medium` (40-70): 5-20 events, 5-60 min/month
- `high` (70-100): > 20 events, > 60 min/month

## Analytics & Trends

### AC10: Get Trends

```bash
GET /api/user-behavior/trends/event_count?days=30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trends": [
      { "date": "2026-05-27", "value": 1234 },
      { "date": "2026-05-28", "value": 1456 },
      { "date": "2026-05-29", "value": 1567 }
    ],
    "metric": "event_count"
  }
}
```

## Data Export

### AC11: Export Behavior Data

#### JSON Format

```bash
GET /api/user-behavior/export?format=json&userId=user-123
Authorization: Bearer {token}
```

#### CSV Format

```bash
GET /api/user-behavior/export?format=csv
Authorization: Bearer {token}
```

## Key Metrics

### Retention Metrics

| Metric | Definition | Formula |
|--------|------------|---------|
| **D1 Retention** | % returning after 1 day | Users active on day 2 / cohort size |
| **D7 Retention** | % returning after 7 days | Users active on day 8 / cohort size |
| **D30 Retention** | % returning after 30 days | Users active on day 31 / cohort size |

### Engagement Metrics

| Metric | Definition | Range |
|--------|-----------|-------|
| **Engagement Score** | Overall user engagement | 0-100 |
| **Session Duration** | Avg time spent per session | Minutes |
| **Page Views** | Avg pages per session | Count |
| **Event Count** | User actions per month | Count |

### Funnel Metrics

| Metric | Definition | Formula |
|--------|-----------|---------|
| **Conversion Rate** | % completing step | Step completions / Users |
| **Dropoff Rate** | % leaving at step | (Prev step - Current) / Prev step |

## Best Practices

1. **Session Tracking**
   - Start session on app open
   - End on app close
   - Track idle time (30+ min)

2. **Event Tracking**
   - Track user intents (not just clicks)
   - Include context in event data
   - Use consistent naming

3. **Cohort Analysis**
   - Segment by acquisition date
   - Segment by user characteristics
   - Compare retention across cohorts

4. **Churn Prevention**
   - Monitor high-risk users (score > 70)
   - Identify disengaging users early
   - Re-engage via email/push

5. **Optimization**
   - Fix high funnel dropoff (> 50%)
   - Improve low engagement levels (< 40)
   - Maintain high retention (> 40% D30)

## Sample Workflow

```
1. User opens app
   POST /api/user-behavior/sessions/start

2. User navigates pages
   POST /api/user-behavior/sessions/:id/pageview

3. User takes actions
   POST /api/user-behavior/events/track

4. User closes app
   POST /api/user-behavior/sessions/:id/end

5. Analyze engagement
   GET /api/user-behavior/users/:id/engagement

6. Predict churn
   GET /api/user-behavior/users/:id/churn-risk

7. View trends
   GET /api/user-behavior/trends/event_count

8. Compare cohorts
   POST /api/user-behavior/cohorts/compare
```

