# Troubleshooting: Intermittent 503 Errors

**Symptom:** Random 503 (Service Unavailable) errors affecting ~1-5% of requests

## Quick Diagnosis (First 2 Minutes)

```bash
# 1. Confirm 503 errors are happening
# Dashboard: "Ctrl Alt News - Application Metrics"
# Look for: "Errors by Status Code" showing 503s

# 2. Check if it's intermittent or constant
# Is the alert red now? Or was it just a spike?
curl http://localhost:3000/api/health
# If 200 OK → error is intermittent
# If 503 → error is constant

# 3. Check error rate
# It should be <1% (intermittent) not >5% (constant)
curl -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query=rate({level="error"} | status_code=503 [1m])'
```

## Root Cause Determination (Minutes 2-5)

### Scenario 1: Rate Limiting

**Indicators:**
- 503 errors from same IP address
- Errors correlate with traffic spikes
- Error message mentions "rate limit"

**Diagnosis:**
```bash
# Check rate limit logs
docker logs ctrl-alt-news | grep -i "rate\|limit"

# Check if Nginx/reverse proxy has rate limit
nginx -T | grep limit_req

# Check application rate limit config
grep -r "rateLimit\|rateLimiter" server/
```

**Most likely cause:**
- Too many requests from single user/IP
- Rate limit threshold too low
- No burst allowance

**Fix:**
```javascript
// Increase rate limit
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000                   // 1000 requests per window (increased from 100)
});

// Or add burst allowance
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 100,                   // 100 per minute
  skipSuccessfulRequests: true // Don't count successful
});
```

### Scenario 2: Connection Pool Exhausted

**Indicators:**
- 503 errors when traffic is high
- Error message: "no available connections"
- Doesn't affect all requests (intermittent)

**Diagnosis:**
```bash
# Check database connection count
psql -U postgres -c "
SELECT count(*) as total_connections,
       count(*) FILTER (WHERE state = 'active') as active,
       count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity;"

# Check connection pool config
grep -r "pool\|Pool" server/ | grep -i "max\|size"

# Check pool status
docker logs ctrl-alt-news | grep -i "pool\|connection" | tail -20
```

**Most likely cause:**
- Database connection pool at max (usually 10-20)
- Idle connections not being released
- Queries taking too long, holding connections

**Fix:**
```javascript
// Increase pool size
const pool = new Pool({
  max: 30,  // Increased from 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Or reduce query time to free connections faster
// Or implement connection queue/retry logic
```

### Scenario 3: Downstream Service Timeout

**Indicators:**
- 503 when external API is slow
- Error message: "timeout" or "ECONNRESET"
- Error happens randomly, not consistently

**Diagnosis:**
```bash
# Check external API status
curl -I https://external-api.example.com/health

# Check timeout configured
grep -r "timeout" server/ | grep -i "external\|api"

# Check logs for timeout messages
docker logs ctrl-alt-news | grep -i "timeout\|ECONNRESET" | tail -10
```

**Most likely cause:**
- External API is overloaded/slow
- Network latency is high
- Timeout is too short

**Fix:**
```javascript
// Increase timeout
const axios = require('axios');
const response = await axios.get(url, {
  timeout: 10000  // Increased from 5000 (10 seconds)
});

// Or add retry logic
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.get(url, { timeout: 5000 });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}

// Or fail fast instead of 503
// Return cached data or default response
```

### Scenario 4: Memory/Resource Pressure

**Indicators:**
- 503s happen when memory is high
- CPU usage spikes at same time
- Errors are intermittent, not constant

**Diagnosis:**
```bash
# Check memory at time of 503s
docker stats ctrl-alt-news --no-stream

# Check if memory is causing GC pauses
docker logs ctrl-alt-news | grep -i "gc"

# Look for "out of memory" errors
docker logs ctrl-alt-news | grep -i "OOM\|memory"
```

**Most likely cause:**
- Garbage collection pauses blocking requests
- Memory exhaustion causing slowdown
- Under-provisioned for traffic

**Fix:**
```bash
# Increase Node heap
export NODE_OPTIONS="--max-old-space-size=2048"
docker restart ctrl-alt-news

# Or scale horizontally
docker-compose scale ctrl-alt-news=3

# Or reduce memory usage
# - Add caching to reduce computation
# - Paginate results
# - Remove unused data structures
```

## Detailed Investigation (Minutes 5-15)

### Check Error Pattern

```bash
# Get all 503 errors in last hour
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={level="error"} | status_code=503' \
  --data-urlencode 'start=<1hour_ago>' \
  --data-urlencode 'end=now'

# Analyze pattern:
# - Same endpoint every time? → Rate limit on that endpoint
# - Random endpoints? → System-wide issue (pool, memory)
# - Same user/IP? → That user is being rate limited
# - Correlated with traffic? → Overload
```

### Load Test to Reproduce

```bash
# Generate sustained load
ab -n 1000 -c 100 http://localhost:3000/api/articles

# Monitor while load test runs
# Dashboard: "Ctrl Alt News - Application Metrics"
# Watch for 503s appearing

# If 503s appear during load → Configuration issue
# If no 503s during load → Issue is not reproducible locally
```

### Check Logs During Error

```bash
# Get logs 30 seconds before and after error
# Time of error: 14:35:00
# Get logs from 14:34:30 to 14:35:30
docker logs ctrl-alt-news --since="2024-04-24T14:34:30" --until="2024-04-24T14:35:30"

# Look for:
# - Connection refused
# - Pool exhausted
# - Timeout
# - Out of memory
```

## Resolution Checklist

- [ ] Root cause identified (rate limit, pool, timeout, memory)
- [ ] Applied configuration fix (increased limit, pool size, timeout)
- [ ] Tested under load (load test shows no 503s)
- [ ] Alert cleared (error rate <1% for 15 minutes)
- [ ] Monitored in production (no 503s for at least 1 hour)
- [ ] Incident documented in #incidents

## When to Escalate

Escalate to L2 if:
- Can't reproduce the issue
- External API is consistently timing out
- Need to refactor code for performance
- After 15 minutes without progress

## Prevention for Future

1. **Add circuit breaker** - Fail fast if external API is down
2. **Add retry logic** - Automatically retry failed external calls
3. **Monitor pool usage** - Alert if connections >80% of max
4. **Set timeout early** - Fail fast instead of hanging
5. **Load test before deployment** - Find limits in staging
6. **Rate limit intelligently** - Allow bursts, but cap sustained traffic
