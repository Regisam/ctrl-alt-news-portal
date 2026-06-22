# Error Analytics & Aggregation Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

Error analytics groups and tracks production errors to:
- Identify patterns and root causes
- Prioritize fixes (most common first)
- Monitor error trends
- Replay errors for debugging

## Endpoints

### View Errors
```bash
GET /api/error-analytics/errors?limit=50&severity=high
```

Returns: Top errors, count, affected users, recent requests

### Search Errors
```bash
GET /api/error-analytics/search?pattern=TypeError
```

Regex search across error type/message/signature

### Get Stats
```bash
GET /api/error-analytics/stats
```

Total errors, occurrences, critical count

### Error Details
```bash
GET /api/error-analytics/error/:fingerprint
```

Full error details + recent requests for replay

### Export JSON
```bash
GET /api/error-analytics/export/json
```

All errors as JSON file

### Export CSV
```bash
GET /api/error-analytics/export/csv
```

All errors as CSV file

## Features

- **AC1-4**: Error grouping by fingerprint (ignores line numbers)
- **AC5**: Severity classification (critical/high/medium/low)
- **AC6**: Affected users tracking
- **AC7**: Error dashboard data
- **AC8**: JSON/CSV export
- **AC9**: Spike detection (10x increase)
- **AC10**: Request replay data
- **AC11**: Regex search
- **30-day retention**

## Error Response Format

```json
{
  "timestamp": "2026-06-22T10:30:45Z",
  "count": 150,
  "errors": [
    {
      "fingerprint": "a1b2c3d4e5f6",
      "type": "TypeError",
      "message": "Cannot read property 'x' of undefined",
      "severity": "high",
      "count": 145,
      "firstSeen": "2026-06-21T14:20:00Z",
      "lastSeen": "2026-06-22T10:30:00Z",
      "affectedUsers": 42,
      "recentRequests": [
        {
          "timestamp": "2026-06-22T10:30:00Z",
          "userId": "user123",
          "method": "GET",
          "path": "/api/articles",
          "status": 500
        }
      ]
    }
  ]
}
```

## Severity Levels

- **Critical**: OutOfMemoryError, StackOverflowError, Fatal errors
- **High**: TypeError, ReferenceError, Failed operations
- **Medium**: ValidationError, TimeoutError, Deprecated usage
- **Low**: Other errors (default)

## Best Practices

1. **Check daily**: Review top errors in dashboard
2. **Export weekly**: Export CSV for team analysis
3. **Search by pattern**: Find related errors
4. **Use replay data**: Reproduce errors from stored requests
5. **Monitor spikes**: Alert on 10x error increase

## Troubleshooting

### Error not appearing?

1. Check error is being thrown (not caught silently)
2. Verify it reaches the error handler
3. Check `/api/error-analytics/stats` for recent activity

### Can't find error?

1. Use search endpoint with partial pattern
2. Export to CSV for spreadsheet search
3. Check severity filter

---

**See also**: docs/guides/monitoring-guide.md, docs/runbooks/incident-response.md
