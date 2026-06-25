# Content Recommendation Engine Guide

## Overview

Intelligent, personalized article recommendations based on user interests and behavior.

## How It Works

### Algorithm

**Scoring (100 points total):**
1. **Category Preference (50%)**: User's interest in article category
2. **Tag Matching (30%)**: Overlap with user's interests
3. **Recency (20%)**: Articles published in last 7 days get full points
4. **Diversity Boost**: Prevents all same-category recommendations

### Ranking

Articles ranked by score, with diversity constraints:
- Max 2 articles per category in results
- Avoids recently read articles
- Cold-start: Popular articles for new users

## API Endpoints

### Get Personalized Recommendations

```bash
GET /api/recommendations-v3/personalized?limit=5
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "articleId": "article-123",
        "title": "AI Breakthroughs 2026",
        "score": 85,
        "reason": "Personalized recommendation",
        "category": "AI"
      }
    ]
  }
}
```

### Track Article Read

```bash
POST /api/recommendations-v3/track/read/:articleId
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "AI"
}
```

**Behavior**: Updates user preferences, invalidates cache

### Track User Interest

```bash
POST /api/recommendations-v3/track/interest
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "AI",
  "weight": 2
}
```

**Weight**: 1 (default) to 10 (strong interest)

### Track Recommendation Click

```bash
POST /api/recommendations-v3/track/click/:articleId
Authorization: Bearer {token}
```

**Metrics**: Used to calculate click-through rate (CTR)

### Get User Preferences

```bash
GET /api/recommendations-v3/preferences
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "interests": {
        "AI": 8,
        "Technology": 6,
        "Science": 4
      },
      "readCount": 42,
      "lastUpdated": "2026-06-25T10:00:00Z"
    }
  }
}
```

### Get Metrics

```bash
GET /api/recommendations-v3/metrics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "recommendations": 1245,
      "clicks": 456,
      "clickThroughRate": 0.366,
      "usersTracked": 523,
      "articlesInCache": 892
    }
  }
}
```

### Performance Test

```bash
GET /api/recommendations-v3/performance
Authorization: Bearer {token}
```

**Target**: < 100ms response time

**Response:**
```json
{
  "success": true,
  "data": {
    "durationMs": 45.3,
    "target": "< 100ms",
    "passed": true
  }
}
```

## User Preferences

### Initial State (Cold Start)

- No read history
- No preferences
- Receives popular articles
- Personalization begins on first interaction

### Learning

Preferences updated when user:
1. **Reads article**: +2 points to category
2. **Clicks recommendation**: +1 point implicit
3. **Manually sets interest**: +weight points

### Decay

Preferences decay over time:
- Recent articles: Higher weight
- Old articles: Lower weight
- User behavior always takes precedence

## Personalization Example

**Day 1 (Cold Start):**
- User gets: Top 5 popular articles
- No personalization yet

**Day 2 (After reading AI article):**
- Preferences: AI +2
- Recommendations: More AI articles

**Day 3 (After reading Science article):**
- Preferences: AI +2, Science +2
- Recommendations: Mix of AI & Science

**Week 1 (10+ reads):**
- Preferences: AI +15, Technology +8, Science +6
- Recommendations: 70% AI, 20% Technology, 10% Science

## JavaScript Usage

```typescript
import { recommendationEngine } from '../lib/recommendationEngine';

// Get recommendations
const recs = recommendationEngine.getRecommendations(userId, 5);

// Track article read
recommendationEngine.trackArticleRead(userId, articleId, 'AI');

// Track interest
recommendationEngine.trackUserInterest(userId, 'Technology', 2);

// Get metrics
const metrics = recommendationEngine.getMetrics();
console.log(`CTR: ${metrics.clickThroughRate.toFixed(2)}`);
```

## Performance

### Response Times

- **Recommendations**: < 100ms (target)
- **With Cache**: < 10ms
- **Cached Duration**: 10 minutes

### Scalability

- **Users**: 100K+
- **Articles**: 1M+
- **Memory per User**: ~500 bytes
- **Total Memory**: 50MB for 100K users

### Optimization

1. **Caching**: 10-minute cache per user
2. **Cache Invalidation**: On preference change
3. **Lazy Loading**: Articles fetched on demand
4. **Batch Processing**: Metrics aggregated

## Monitoring

### Click-Through Rate (CTR)

```
CTR = clicks / recommendations
- Target: > 20% CTR
- Good: 15-20%
- Poor: < 10%
```

### Diversity

- **Category Coverage**: Ensures mix of categories
- **Author Coverage**: Varies content sources
- **Freshness**: Balances new vs trending

## Future Improvements

1. **Collaborative Filtering**: Learn from similar users
2. **Machine Learning**: Deep learning models
3. **Contextual**: Time-based, location-based
4. **Trending**: Real-time trending articles
5. **A/B Testing**: Experiment with algorithms

## Best Practices

1. **Track Everything**: Every read, every click
2. **Monitor CTR**: Key success metric
3. **Update Cache**: Invalidate on preference change
4. **Test Performance**: Ensure < 100ms
5. **Diversify Results**: Avoid filter bubbles
6. **Handle Cold Start**: Popular articles for new users

