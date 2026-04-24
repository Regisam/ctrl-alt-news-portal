# Logging Guide — Ctrl Alt News

## Quick Start

### Start Loki Stack (Development)

```bash
docker-compose -f docker-compose.loki.yml up -d
```

Services available after 30s:
- **Grafana UI:** http://localhost:3000 (admin/admin)
- **Loki API:** http://localhost:3100
- **Promtail:** http://localhost:9080

### View Logs

1. Open Grafana: http://localhost:3000
2. Go to **Explore** (left sidebar)
3. Select **Loki** datasource
4. Write LogQL query (see examples below)

---

## Log Structure

All server logs are structured JSON:

```json
{
  "timestamp": "2026-04-24T10:30:45.123Z",
  "level": "info|warn|error|debug",
  "service": "ctrl-alt-news-server",
  "message": "Request completed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "duration_ms": 42,
  "status_code": 200,
  "path": "/api/articles",
  "method": "GET"
}
```

### Log Levels

- **debug** — Detailed diagnostic information
- **info** — General informational messages
- **warn** — Warning messages (slow requests, client errors)
- **error** — Error messages and exceptions

---

## Common Queries (LogQL)

### All logs
```logql
{service="ctrl-alt-news-server"}
```

### Errors only
```logql
{service="ctrl-alt-news-server"} | json | level="error"
```

### Slow requests (>1s)
```logql
{service="ctrl-alt-news-server"} | json | duration_ms > 1000
```

### Specific endpoint
```logql
{service="ctrl-alt-news-server"} | json | path="/api/articles"
```

### By status code
```logql
{service="ctrl-alt-news-server"} | json | status_code="500"
```

### Request rate (last 5 minutes)
```logql
sum(rate({service="ctrl-alt-news-server"} | json [5m]))
```

### Error rate
```logql
sum(rate({service="ctrl-alt-news-server"} | json | level="error" [5m]))
```

### By request ID (trace request)
```logql
{service="ctrl-alt-news-server"} | json | request_id="XXXX"
```

---

## Server-Side Logging

### Using the Logger in Code

```typescript
import { logger } from '../logger';

// Simple log
logger.info('Article retrieved', {
  article_id: 'art-5678',
  duration_ms: 42,
});

// Error with exception
try {
  // code
} catch (error) {
  logger.error('Failed to retrieve article', {
    article_id: 'art-5678',
    error: error.message,
  });
}
```

### Middleware (Automatic Logging)

HTTP requests are automatically logged with:
- Method, path, status code
- Duration
- Request ID (generated or from header)

```typescript
// Request automatically logs:
// {
//   "request_id": "uuid",
//   "method": "GET",
//   "path": "/api/articles",
//   "status_code": 200,
//   "duration_ms": 42
// }
```

---

## Client-Side Logging

### Using the Client Logger

```typescript
import { clientLogger } from '@/lib/logger';

// Log user action
clientLogger.info('Article viewed', {
  article_id: 'art-5678',
  time_on_page: 30,
});

// Automatically sanitizes: passwords, tokens, email, phone, SSN, credit cards
clientLogger.error('Login failed', {
  email: 'user@example.com', // NOT sent to server
  password: 'secret123',       // NOT sent to server (sanitized)
  reason: 'Invalid credentials',
});
```

### What Gets Sanitized

- `password`, `secret`, `token`, `apikey`, `api_key`, `auth`
- `email`
- `phone`, `mobile`
- `ssn`, `social_security`
- `credit_card`, `card_number`, `cc_number`

Example: `{ password: '[REDACTED]', email: '[REDACTED]' }`

---

## Retention Policy

### Development Environment
- **Retention:** 7 days
- **Purpose:** Debugging, development testing

### Production Environment
- **Retention:** 30 days
- **Purpose:** Incident investigation, compliance

Adjust in `loki-config.yml`:
```yaml
limits_config:
  retention_period: 168h  # 7 days (dev)
  # or
  retention_period: 720h  # 30 days (prod)
```

---

## Troubleshooting

### Logs not appearing in Grafana

1. Verify Promtail is running:
   ```bash
   docker logs ctrl-alt-promtail
   ```

2. Verify Loki is receiving logs:
   ```bash
   curl http://localhost:3100/loki/api/v1/label
   ```

3. Check log file permissions:
   ```bash
   ls -la logs/
   ```

4. Restart services:
   ```bash
   docker-compose -f docker-compose.loki.yml restart
   ```

### High disk usage

1. Check Loki storage:
   ```bash
   du -sh /var/lib/docker/volumes/*/loki-data/
   ```

2. Reduce retention period in `loki-config.yml`

3. Increase ingestion rate limits if hitting them:
   ```yaml
   ingestion_rate_mb: 10  # Increase this
   ```

### Promtail not collecting logs

1. Verify log directory exists:
   ```bash
   ls -la logs/
   ```

2. Check Promtail volume mounts in `docker-compose.loki.yml`

3. Verify `__path__` patterns in `promtail-config.yml`

---

## Best Practices

1. **Include request IDs** — Trace requests end-to-end
2. **Avoid logging PII** — Client logger auto-sanitizes, but be careful on server
3. **Use appropriate levels** — info for normal flow, warn for anomalies, error for failures
4. **Include context** — Add relevant business data (user_id, article_id, etc.)
5. **Don't log secrets** — Passwords, tokens, API keys never in logs

---

## Performance Impact

- **Server logging overhead:** <5% latency impact (async)
- **Client logging overhead:** <10ms per log (non-blocking fetch)
- **Storage consumption:** ~1MB per 10k logs (gzip compressed)

Monitor with:
```bash
docker stats ctrl-alt-loki
```

---

## Next Steps

1. Start Loki stack: `docker-compose -f docker-compose.loki.yml up -d`
2. View logs in Grafana: http://localhost:3000
3. Run sample queries
4. Integrate logger into your code
5. Create custom dashboards (Story 8.2)

---

*Last Updated: 2026-04-24*
