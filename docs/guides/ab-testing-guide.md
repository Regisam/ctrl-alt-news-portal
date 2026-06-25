# A/B Testing Framework Guide

## Overview

A/B testing framework for running controlled experiments and validating changes before full rollout.

## Quick Start

### AC1: Create Experiment

```bash
POST /api/experiments/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "exp-001",
  "name": "New Homepage Layout",
  "description": "Testing new homepage design vs current",
  "status": "draft",
  "variants": [
    {
      "id": "control",
      "name": "Control (Current)",
      "description": "Existing homepage",
      "traffic": 50
    },
    {
      "id": "variant-a",
      "name": "New Layout",
      "description": "Redesigned homepage",
      "traffic": 50
    }
  ],
  "startDate": "2026-06-26T00:00:00Z",
  "minSampleSize": 100,
  "confidenceLevel": 0.95
}
```

### AC1: Start Experiment

```bash
POST /api/experiments/:id/start
Authorization: Bearer {token}
```

## Variant Assignment

### AC2-3: Assign User to Variant

```bash
POST /api/experiments/:id/assign
Content-Type: application/json

{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "variantId": "control"
  }
}
```

Traffic allocation is automatic:
- 50% → control variant
- 50% → variant-a

### AC8: Feature Flag Evaluation

```bash
GET /api/experiments/:id/flag/new-layout?userId=user-123
```

Returns true/false for whether feature is enabled.

## Metrics & Tracking

### AC4: Track Metric

```bash
POST /api/experiments/:id/track
Content-Type: application/json

{
  "userId": "user-123",
  "metricName": "page_load_time",
  "value": 1200
}
```

**Common Metrics:**
- `conversion` (0 or 1)
- `page_load_time` (ms)
- `bounce_rate` (0-100)
- `engagement_score` (0-100)
- `click_through_rate` (0-100)

## Results & Analysis

### AC5-6: View Results

```bash
GET /api/experiments/:id/results
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "experimentId": "exp-001",
        "variantId": "control",
        "totalUsers": 2543,
        "conversions": 382,
        "conversionRate": 0.150,
        "confidence": 0.92,
        "winner": false
      },
      {
        "experimentId": "exp-001",
        "variantId": "variant-a",
        "totalUsers": 2517,
        "conversions": 427,
        "conversionRate": 0.170,
        "confidence": 0.95,
        "winner": true
      }
    ],
    "count": 2
  }
}
```

### AC5: Statistical Significance

- **Confidence**: 0.95 = 95% confidence in results
- **Sample Size**: Minimum 100 users per variant
- **Winner**: Variant with highest conversion rate at confidence level

Example interpretation:
- Variant A has 95% confidence → statistically significant
- Variant A wins with 17% conversion vs Control's 15%

## Targeting & Segmentation

### AC7: Targeting Rules

```bash
PUT /api/experiments/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetingRules": [
    "user_segment:premium",
    "country:US",
    "platform:web"
  ]
}
```

Only users matching ALL rules are included in experiment.

## Control & Management

### AC1: List Experiments

```bash
GET /api/experiments
Authorization: Bearer {token}
```

### AC1: Get Experiment

```bash
GET /api/experiments/:id
Authorization: Bearer {token}
```

### AC1: Update Experiment

```bash
PUT /api/experiments/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "variants": [
    { "id": "control", "name": "Control", "traffic": 50 },
    { "id": "variant-a", "name": "Variant A", "traffic": 50 }
  ]
}
```

### AC9: Stop Experiment

```bash
POST /api/experiments/:id/stop
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Variant A clearly winning"
}
```

Experiment stops immediately and final results calculated.

## Results & Export

### AC10: View History

```bash
GET /api/experiments/history/all
Authorization: Bearer {token}
```

Returns all completed and stopped experiments.

### AC11: Export Results

#### JSON Format

```bash
GET /api/experiments/:id/export?format=json
Authorization: Bearer {token}
```

#### CSV Format

```bash
GET /api/experiments/:id/export?format=csv
Authorization: Bearer {token}
```

## Best Practices

### 1. Minimum Sample Size
- Ensure at least 100 users per variant
- Larger sample = more reliable results
- Calculate based on baseline conversion rate

### 2. Statistical Significance
- Target 95% confidence level (industry standard)
- Larger differences need fewer samples
- Smaller differences need more samples

### 3. Duration
- Run for at least 1-2 weeks
- Avoid weekday/weekend effects
- Account for seasonal trends

### 4. Traffic Allocation
- 50/50 split for most experiments
- Vary if you have strong priors
- Higher traffic for new features

### 5. Metric Selection
- Choose primary metric aligned with goals
- Track secondary metrics for insights
- Avoid too many metrics (multiple comparison problem)

### 6. Interpretation
- Winner must meet confidence threshold
- Look at effect size (not just significance)
- Consider business implications
- Check for interactions

## Example Workflow

```
1. Create experiment
   POST /api/experiments/create

2. Start experiment
   POST /api/experiments/:id/start

3. User visits site
   GET /api/experiments/:id/assign?userId=123
   → Returns variant assignment

4. Enable feature based on variant
   GET /api/experiments/:id/flag/new-feature?userId=123
   → Returns true/false

5. User performs action
   POST /api/experiments/:id/track
   → Track conversion/metric

6. After 2 weeks, check results
   GET /api/experiments/:id/results
   → View statistical results

7. Declare winner and stop
   POST /api/experiments/:id/stop
   → Winner identified, rollout to all

8. Archive experiment
   GET /api/experiments/history/all
   → Historical record
```

## Common Pitfalls

### Alert: Peeking
Don't stop experiment early just because one variant is winning.
- Continue until minimum sample size
- Wait for confidence threshold

### Alert: Multiple Comparisons
If running multiple experiments, adjust significance threshold.
- Use Bonferroni correction
- Or accept higher false positive rate

### Alert: Interaction Effects
Results may vary by segment.
- Analyze by user cohort
- Check for unexpected patterns

### Alert: Statistical vs Business Significance
Statistical significance ≠ business value.
- Consider implementation cost
- Evaluate long-term impact
- Check for side effects

