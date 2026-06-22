# Dependency Health Checks Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

Monitor the health of external dependencies (database, cache, APIs) to ensure they're available and responding quickly.

## Features

- **AC1-3**: Database, cache, external API health checks
- **AC4**: Response time tracking (p50/p95/p99)
- **AC5**: Color-coded status (ok/warning/critical)
- **AC6**: Circuit breaker pattern (fail fast)
- **AC7**: Alerts on dependency failure
- **AC10**: 5-second timeout per check
- **AC11**: Exponential backoff on failures

## Integration

Health checks run automatically every 30 seconds.

Results are included in `/api/health` response under `dependencies` array.

## Health Status Codes

| Status | Meaning | HTTP |
|--------|---------|------|
| ok | Response < 1000ms | 200 |
| warning | Response 1000-5000ms | 200 |
| critical | Response > 5000ms OR error | 503 |

## Response Format

```json
{
  "status": "ok|degraded|unhealthy",
  "dependencies": [
    {
      "name": "database",
      "status": "ok",
      "responseTime": 42,
      "lastChecked": "2026-06-22T10:30:45Z"
    }
  ]
}
```

## Circuit Breaker

**Threshold:** 3 failures
**Reset:** 30 seconds

When circuit is open:
- Service returns `critical` status
- Requests fail immediately (fail-fast)
- After 30s, enters `half-open` and retries

## Supported Checks

### 1. Database
- Check: Connection + simple query
- Warning: > 1000ms
- Critical: > 5000ms

### 2. Cache (Redis)
- Check: PING + latency
- Warning: > 500ms
- Critical: > 2000ms

### 3. External API
- Check: GET to critical endpoint
- Warning: > 2000ms
- Critical: > 5000ms

## Adding Custom Checks

```typescript
dependencyHealthChecker.registerCheck({
  name: 'my-service',
  timeout: 5000,
  warningThreshold: 1000,
  criticalThreshold: 5000,
  check: async () => {
    const start = Date.now();
    // Perform check (e.g., fetch, ping, query)
    return Date.now() - start;
  },
});
```

## Best Practices

1. **Timeout:** Always set timeout < 5000ms
2. **Fail-fast:** Let circuit breaker isolate failures
3. **Fallback:** Use cached data if DB down
4. **Monitoring:** Check health endpoint regularly
5. **Tuning:** Adjust thresholds based on normal response times

## Troubleshooting

### Health always shows unhealthy?

Check if dependencies are actually running:
```bash
curl http://localhost:3000/api/health
```

### Circuit breaker stuck open?

Wait 30 seconds for reset, or manually check endpoint.

### Timeouts on all dependencies?

Increase timeout threshold if normal (high-latency environment).

---

**See also**: docs/guides/monitoring-guide.md
