# Troubleshooting: High Error Rate

**Alert:** Error rate >5% for 1+ minute

## Quick Diagnosis (First 2 Minutes)

```bash
# 1. Check if alert is still firing
# Go to: http://localhost:9090/alerts
# Look for HighErrorRate - is it RED or GREEN?

# 2. Check error logs
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={level="error"} | json' \
  --data-urlencode 'limit=50'

# 3. Check which endpoint is failing
# Go to: http://localhost:3001
# Dashboard: "Ctrl Alt News - Application Metrics"
# Look at: "Error Rate by Endpoint" panel
```

## Root Cause Determination (Minutes 2-5)

### Scenario 1: All Endpoints Affected (~100% errors)

**Indicators:**
- All requests failing
- Error logs show similar pattern
- Recent deployment or config change

**Diagnosis:**
```bash
# Check if service is running
docker ps | grep ctrl-alt-news

# Check service logs for startup errors
docker logs ctrl-alt-news --tail 50

# Check if database is accessible
docker exec ctrl-alt-news psql -U postgres -c "SELECT 1"

# Check if Redis/cache is running (if used)
docker ps | grep redis
```

**Most likely cause:** Service crash or database connection issue

**Fix:**
1. Check logs for specific errors
2. Restart service: `docker restart ctrl-alt-news`
3. Wait 30 seconds for startup
4. Check alert status (should clear within 1 min)

### Scenario 2: Specific Endpoint Failing (~50% of that endpoint)

**Indicators:**
- Error rate high for one endpoint (e.g., /api/articles)
- Other endpoints work fine
- Error code consistent (e.g., all 500 or all 503)

**Diagnosis:**
```bash
# Find which endpoint
# Dashboard: "Ctrl Alt News - Application Metrics" → "Error Rate by Endpoint"

# Check logs for that endpoint
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={level="error"} |= "/api/articles" | json' \
  --data-urlencode 'limit=20'

# Check database for that operation
# If endpoint is GET /api/articles, check articles table
psql -U postgres -c "SELECT COUNT(*) FROM articles; SELECT pg_database_size('ctrl_alt_news');"
```

**Most likely cause:** 
- Database query timeout for that operation
- Missing data/index for that endpoint
- Configuration issue specific to that feature

**Fix:**
1. Check the specific query in app code
2. Run EXPLAIN ANALYZE on the slow query
3. Add index if needed: `CREATE INDEX idx_articles_category ON articles(category);`
4. Restart service: `docker restart ctrl-alt-news`

### Scenario 3: Intermittent Errors (~5-20% of requests)

**Indicators:**
- Some requests work, some fail
- Pattern: errors come and go
- Error code: mostly 503 or 504 (timeout)

**Diagnosis:**
```bash
# Check if resource-constrained
docker stats ctrl-alt-news

# Check error distribution over time
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={level="error"} | json | status_code=503' \
  --data-urlencode 'step=10s'

# Check if it's a pattern (every N requests)
docker logs ctrl-alt-news --tail 200 | grep -c "ERROR"
```

**Most likely cause:**
- Resource exhaustion (memory, connections, file handles)
- Rate limiting or circuit breaker triggered
- Intermittent external service failure

**Fix:**
1. If memory high: restart service
2. If connections high: check for connection leak
3. If rate limited: increase rate limit or reduce traffic
4. If external service: check its status

## Detailed Investigation (Minutes 5-15)

### Check Recent Deployment

```bash
git log --oneline -5
git diff HEAD~1..HEAD server/
```

If recent change broke this endpoint:
```bash
git revert HEAD
docker build -t ctrl-alt-news .
docker-compose up -d
```

### Check Database State

```bash
# Connection count
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Slow queries
psql -U postgres -c "
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Index usage
psql -U postgres -c "
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY tablename;"

# Check for locks
psql -U postgres -c "SELECT * FROM pg_locks WHERE NOT granted;"
```

### Check Application Logs

```bash
# Get last 100 errors
docker logs ctrl-alt-news --tail 200 | grep -i error

# Look for pattern (stack trace signature)
docker logs ctrl-alt-news --tail 200 | grep -i "at.*:.*:"

# Count errors by type
docker logs ctrl-alt-news --tail 500 | grep -i error | cut -d: -f1 | sort | uniq -c
```

### Check External Services

If errors mention timeout or connection refused:

```bash
# Test database connectivity
nc -zv localhost 5432

# Test Redis (if used)
nc -zv localhost 6379

# Test external APIs
curl -v https://external-api.example.com/health
```

## Resolution Checklist

- [ ] Alert confirmed (not flaky)
- [ ] Root cause identified (single issue, not mysterious)
- [ ] Scope understood (which users affected)
- [ ] Temporary mitigation applied (service restarted, traffic redirected)
- [ ] Permanent fix implemented (code change, config update, index added)
- [ ] Alert cleared (error rate <1% for 5 minutes)
- [ ] Service performing normally
- [ ] Incident documented in #incidents

## When to Escalate

Escalate to L2 if:
- Unknown error message in logs
- Database won't respond
- Deployment failed and can't rollback
- Need to modify production config
- After 10 minutes without improvement

## Prevention for Future

1. **Add monitoring for that endpoint** - Create custom metric
2. **Add slow query alert** - Notify if that query takes >500ms
3. **Add integration test** - Test that endpoint in CI/CD
4. **Document the fix** - Add comment to code explaining why it was failing
