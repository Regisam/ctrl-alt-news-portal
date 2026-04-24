# Distributed Tracing Guide

This guide explains how to use distributed tracing with OpenTelemetry and Jaeger to debug performance issues and track requests through the Ctrl Alt News Portal stack.

## Overview

Distributed tracing captures the full lifecycle of a request as it flows through different services and components:

```
GET /api/articles (request arrives)
├── Parse request (10ms)
├── Authenticate user (20ms)
├── Query database (300ms)
│   └── Execute SQL (250ms)
│   └── Parse result (50ms)
├── Fetch from cache (30ms)
├── Serialize response (40ms)
└── Send response (total: 400ms)
```

Each component is a "span" with timing and status information. This helps identify:
- **Bottlenecks** - Which component is slowest?
- **N+1 queries** - Are we querying database in a loop?
- **Timeout cascades** - Does one slow service block others?
- **Missing instrumentation** - What components aren't being tracked?

## Getting Started

### 1. Start Jaeger Backend

```bash
# Run Jaeger all-in-one container
docker-compose -f docker-compose.jaeger.yml up -d

# Verify it's running
curl http://localhost:16686/api/services

# Access Jaeger UI
open http://localhost:16686
```

### 2. Configure Environment Variables

```bash
# .env or environment
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
NODE_ENV=development  # 100% sampling in dev
```

### 3. Start Application with Tracing

Tracing is initialized automatically when the server starts (via `server/tracing.ts`).

```bash
npm run dev
```

## Reading Traces in Jaeger UI

### Finding Traces

1. **Open Jaeger UI**: `http://localhost:16686`
2. **Select service**: "ctrl-alt-news-server" (from dropdown)
3. **Filter by conditions**:
   - **Latency**: Find requests slower than 100ms
   - **Error**: Find failed requests
   - **Tags**: Filter by request ID, user ID, endpoint

### Understanding the Trace Waterfall

```
Request Timeline (horizontal axis = time)

GET /api/articles?limit=10 ............................ 523ms total

├─ HTTP middleware ......... 5ms
├─ Auth middleware ........ 15ms
├─ ArticleService.getArticles .......................... 490ms
│  ├─ database: SELECT articles ...................... 280ms
│  │  ├─ query execution ...................... 220ms
│  │  └─ result parsing ...................... 60ms
│  ├─ cache: GET categories_cache ............. 30ms
│  └─ transform results ...................... 180ms
└─ Response serialization ........... 8ms
```

**Key observations:**
- **Vertical alignment** = Sequential execution (one after another)
- **Horizontal overlap** = Parallel execution (happening at same time)
- **Bar width** = Duration of that operation
- **Color** = Operation type (HTTP, DB, cache, etc.)

### Identifying Bottlenecks

**Scenario 1: Slow Database Query**
```
- DB span is widest (takes most time)
- Solution: Check EXPLAIN plan, add indexes, optimize query
- Links to check: Click span → view "db.statement" attribute
```

**Scenario 2: N+1 Query Problem**
```
- Many narrow database spans in sequence
- Solution: Use batch queries or JOIN, eager load relations
- Pattern: Loop creating new span each iteration
```

**Scenario 3: Slow External API**
```
- "external_api" span is wide
- Solution: Add caching, implement timeout, use circuit breaker
- Check: "http.url" attribute for the external endpoint
```

**Scenario 4: Unaccounted Time**
```
- Waterfall shows 500ms total but spans only add to 200ms
- Solution: Add custom spans for missing components
- Check: Are there gaps between spans?
```

## Creating Custom Spans

For business logic not automatically instrumented:

```typescript
import { getTracer } from '../tracing';

const tracer = getTracer();

async function complexBusinessLogic(data: any) {
  // Create named span
  const span = tracer.startSpan('business:processArticle', {
    attributes: {
      'article.id': data.id,
      'article.category': data.category,
    },
  });

  try {
    // Your business logic here
    const result = await doExpensiveWork(data);

    // Record outcome
    span.setAttributes({
      'business:processed_items': result.count,
      'business:status': 'success',
    });

    return result;
  } catch (error) {
    span.recordException(error);
    span.setAttributes({
      'business:status': 'failed',
      'business:error': error.message,
    });
    throw error;
  } finally {
    span.end();
  }
}
```

## Trace Attributes Reference

### HTTP Spans
- `http.method` - GET, POST, PUT, DELETE
- `http.url` - Full request URL
- `http.target` - URL path
- `http.status_code` - Response status
- `http.duration_ms` - Request duration
- `http.request_id` - Unique request identifier (for correlation)
- `http.user_id` - Authenticated user ID
- `http.error` - Whether request failed

### Database Spans
- `db.system` - postgresql, mysql, mongodb, etc.
- `db.statement` - SQL query (sanitized, no parameters)
- `db.operation` - SELECT, INSERT, UPDATE, DELETE
- `db.rows_affected` - Number of rows modified
- `db.duration_ms` - Query duration

### Cache Spans
- `cache.operation` - GET, SET, DELETE
- `cache.key` - Cache key accessed
- `cache.hit` - true/false (cache hit or miss)
- `cache.ttl_ms` - Time-to-live if set

## Common Trace Queries

### 1. Find Slowest Requests (Last Hour)
```
Service: ctrl-alt-news-server
Limit: 20
Sort: Longest first
```

### 2. Find Errors
```
Service: ctrl-alt-news-server
Tags: http.status_code >= 400
Limit: 50
```

### 3. Find Requests by User
```
Service: ctrl-alt-news-server
Tags: http.user_id = "user-123"
Limit: 20
```

### 4. Find Specific Endpoint
```
Service: ctrl-alt-news-server
Tags: http.target = "/api/articles"
Limit: 20
```

### 5. Find Slow Database Queries
```
Service: ctrl-alt-news-server
Query: {span.name="database.query" && span.duration > 1000ms}
Limit: 20
```

## Performance Implications

### Tracing Overhead

Traces add a small overhead to each request:
- **Sampling 10%**: ~0.5-2% performance impact (production default)
- **Sampling 100%**: ~2-5% performance impact (development default)
- **No tracing**: Baseline (0% overhead)

### Storage Impact

Trace storage depends on:
- **Request volume** - More requests = more traces
- **Sampling rate** - Higher sampling = more traces stored
- **Span depth** - Deeper traces (more instrumentation) = larger traces

**Estimates** (1M requests/day):
- 10% sampling = ~100K traces/day ≈ 50GB/month
- Retention: 7 days = ~350GB disk
- With compression: ~50-100GB

### Sampling Strategy

```
Development: 100% sampling
├─ Capture everything for debugging
└─ Storage: ~1GB/day (local dev machine)

Staging: 50% sampling
├─ Balance between detail and cost
└─ Storage: reasonable for testing

Production: 10% sampling (default)
├─ Minimize overhead and storage
├─ Sufficient for performance debugging
└─ Increase to 100% temporarily if investigating issues
```

To change sampling at runtime (in Jaeger):
1. Go to `http://localhost:16686`
2. Click "System Architecture"
3. Select service
4. Adjust sampling percentage

## Troubleshooting

### Traces Not Appearing

**Problem**: No traces show up in Jaeger UI

**Diagnosis**:
```bash
# 1. Check Jaeger is running
curl http://localhost:16686/api/services

# 2. Check OTLP endpoint is reachable
curl http://localhost:4318/v1/traces

# 3. Check application logs for tracing init
npm run dev 2>&1 | grep -i tracing

# 4. Verify environment variable
echo $OTEL_EXPORTER_OTLP_ENDPOINT
```

**Solutions**:
- Ensure `docker-compose.jaeger.yml` container is running
- Check `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable is set correctly
- Verify firewall allows traffic to port 4318
- Check application logs for initialization errors

### Missing Spans

**Problem**: Expected spans don't appear in trace

**Diagnosis**:
- Is the code path being executed? (Add log statements)
- Is sampling rate 100%? (May be discarding traces at 10%)
- Is the span being created but not ended? (Span must call `.end()`)
- Is there an exception preventing span creation?

**Solutions**:
- Verify code path is executing (add console logs)
- In development, use 100% sampling: `NODE_ENV=development npm run dev`
- Ensure all spans call `.end()` in finally block
- Check for exceptions in span creation code

### Jaeger UI Shows Errors

**Problem**: "Error: no service instance" or similar

**Solutions**:
- Wait 30+ seconds for Jaeger to index traces
- Refresh Jaeger UI
- Generate some traffic: `curl http://localhost:3000/`
- Check Jaeger logs: `docker logs <container-id>`

## Best Practices

### 1. Name Spans Clearly
```typescript
// ✅ Good - describes what's happening
tracer.startSpan('database.query.articles');
tracer.startSpan('cache.get.article_categories');

// ❌ Bad - too vague
tracer.startSpan('query');
tracer.startSpan('operation');
```

### 2. Record Important Context
```typescript
// ✅ Good - includes relevant business context
span.setAttributes({
  'article.id': articleId,
  'article.category': category,
  'operation.rows_affected': 42,
});

// ❌ Bad - no context
// (span has no attributes)
```

### 3. Don't Leak PII
```typescript
// ✅ Good - ID without sensitive data
span.setAttribute('user.id', userId);

// ❌ Bad - could expose passwords, emails, etc.
span.setAttribute('user.data', JSON.stringify(userObject));
```

### 4. Always End Spans
```typescript
// ✅ Good - guarantees span.end() is called
try {
  // work
} finally {
  span.end();
}

// ❌ Bad - what if there's an error?
span.end();
```

### 5. Use Sampling Wisely
```typescript
// ✅ Good - respects sampling in environment
// Auto-handled by OpenTelemetry SDK

// ❌ Bad - always tracing everything
span.setAttributes({
  'every.field': 'stored',  // Blows up storage
});
```

## Integration with Other Tools

### With Logging

Logs and traces work together:
- **Logs** - Detailed messages about what happened
- **Traces** - Timing and request flow

Correlate them using request ID:
```bash
# In Jaeger, click on trace to see request ID
# In Loki, search for same request ID to see logs
```

### With Metrics

Traces and metrics are complementary:
- **Metrics** - Aggregated data (error rate, avg latency)
- **Traces** - Individual request details

Use metrics to find problems, traces to investigate them.

### With Alerts

Alerting rules can link to trace investigation:
```
Alert: "High latency detected"
→ Query Jaeger for slowest requests
→ Identify bottleneck spans
→ Implement optimization
```

## Further Reading

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger UI Guide](https://www.jaegertracing.io/docs/latest/frontend-ui/)
- [OWASP Tracing Best Practices](https://owasp.org/)
- [Observability Engineering (O'Reilly book)](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)
