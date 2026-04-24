# Troubleshooting: High Latency (Slow Requests)

**Alert:** P99 latency >2 seconds for 2+ minutes

## Quick Diagnosis (First 2 Minutes)

```bash
# 1. Confirm alert is firing
# Go to: http://localhost:9090/alerts
# Look for HighLatency - is it RED or GREEN?

# 2. Check latency distribution
# Go to: http://localhost:3001
# Dashboard: "Ctrl Alt News - Application Metrics"
# Look at: "Request Latency (p50/p99)" panel

# 3. Which endpoint is slow?
# Same dashboard, look at: "Latency by Endpoint"
# Identify the slowest endpoint(s)
```

## Root Cause Determination (Minutes 2-5)

### Scenario 1: Slow Database Query

**Indicators:**
- Latency spike correlates with database latency
- One specific endpoint is slow
- Database CPU/disk high

**Diagnosis:**
```bash
# Check database query time
psql -U postgres -c "
SELECT query, calls, mean_time, max_time
FROM pg_stat_statements
WHERE mean_time > 500  -- milliseconds
ORDER BY mean_time DESC
LIMIT 10;"

# Run EXPLAIN ANALYZE on slow query
# Copy the query from logs and run it
psql -U postgres -c "EXPLAIN ANALYZE <your_query_here>;"

# Check for missing indexes
psql -U postgres -c "
SELECT schemaname, tablename, attname
FROM pg_attribute
WHERE NOT attnotnull
AND attname NOT IN (
  SELECT attname FROM pg_attribute a
  JOIN pg_index i ON a.attrelid = i.indrelid
  WHERE a.attnum = ANY(i.indkey)
)
LIMIT 20;"
```

**Most likely cause:**
- Missing index on WHERE clause columns
- N+1 queries (looping, calling DB per item)
- Unoptimized JOIN

**Fix:**
1. Identify the slow query from logs
2. Add index: `CREATE INDEX idx_table_column ON table(column);`
3. Or rewrite query to use JOIN instead of loop
4. Verify with: `EXPLAIN ANALYZE` (cost should drop)
5. Test in dev first, then apply to prod

### Scenario 2: Slow External API Call

**Indicators:**
- Latency spike for specific endpoint
- That endpoint calls external API
- External API status page shows slow/errors

**Diagnosis:**
```bash
# Check logs for external API calls
docker logs ctrl-alt-news | grep -i "external\|api.example.com"

# Test external API directly
curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/endpoint

# Check how long the call took
time curl https://api.example.com/endpoint

# Jaeger: Find traces with external API span
# Go to: http://localhost:16686
# Filter by: duration > 1000ms
# Look for span named "external_api" or "http_call"
```

**Most likely cause:**
- External API is overloaded
- Network latency
- External API returned large response
- Timeout misconfiguration

**Fix:**
1. Add timeout to external API call: `timeout: 5000` (5 seconds)
2. Add caching: Cache external API response for 1 hour
3. Add circuit breaker: Fail fast if external API is down
4. Reduce payload size: Ask external API for fewer fields

### Scenario 3: Memory/GC Pauses

**Indicators:**
- Latency spikes are brief (1-2 seconds) but frequent
- Memory usage is high (>300MB)
- Pattern: spikes happen every few minutes

**Diagnosis:**
```bash
# Check memory usage
docker stats ctrl-alt-news --no-stream

# Check if memory is growing
docker stats ctrl-alt-news

# Look for garbage collection in logs
docker logs ctrl-alt-news | grep -i "gc\|garbage"

# Run Node with GC diagnostics
docker stop ctrl-alt-news
docker run --rm -e NODE_OPTIONS="--expose-gc" ctrl-alt-news
# Trigger GC in code: global.gc()
```

**Most likely cause:**
- Memory leak causing frequent GC
- Under-provisioned memory for traffic
- Caching too much data in memory

**Fix:**
1. Increase Node memory: `-Xmx2g`
2. Implement TTL on caches
3. Profile memory usage (see memory-leak.md)
4. Restart service: `docker restart ctrl-alt-news`

### Scenario 4: High Load/Traffic Spike

**Indicators:**
- All endpoints slow at same time
- Request rate is high (e.g., 1000 req/sec)
- CPU or memory maxed out

**Diagnosis:**
```bash
# Check request rate
# Dashboard: "Ctrl Alt News - Application Metrics"
# Look at: "Request Rate" panel

# Check CPU/Memory
docker stats ctrl-alt-news

# Check if this is expected traffic
# Email #traffic Slack channel or check analytics

# Check if there's a traffic spike from crawler/bot
docker logs ctrl-alt-news | grep "User-Agent" | sort | uniq -c | sort -rn | head
```

**Most likely cause:**
- Legitimate traffic spike (viral content, marketing campaign)
- Bot/crawler hitting your site
- DDoS attack (unlikely but possible)

**Fix:**
1. Scale up: Add more service replicas if Kubernetes
2. Cache more aggressively for this spike
3. Rate limit if bot: Block user-agents, IP ranges
4. Wait for spike to pass

## Detailed Investigation (Minutes 5-15)

### Use Distributed Traces

```
1. Go to: http://localhost:16686
2. Service: ctrl-alt-news-server
3. Filter by: duration > 2000 (2 seconds)
4. Click trace to see waterfall
5. Identify widest span = bottleneck
```

**Waterfall interpretation:**
- Database span is widest → Database query is slow
- HTTP span is widest → External API is slow
- "transform results" span is wide → Application logic is slow

### Profile with Custom Spans

If you can't identify the bottleneck:
```javascript
// Add to code
const span = tracer.startSpan('process_articles');
const start = Date.now();
// ... your code ...
const duration = Date.now() - start;
span.setAttribute('duration_ms', duration);
span.end();
```

Then check Jaeger to see which operation is slow.

### Check for N+1 Queries

Pattern: Many database spans in sequence

```javascript
// DON'T DO THIS (N+1 queries):
const articles = await getArticles();
for (const article of articles) {
  article.author = await getAuthor(article.authorId); // N queries!
}

// DO THIS INSTEAD (1 query):
const articles = await getArticlesWithAuthors(); // JOIN in one query
```

## Resolution Checklist

- [ ] Root cause identified (DB, external API, GC, load)
- [ ] Latency improvement verified (P99 back to <500ms)
- [ ] Alert cleared (latency normal for 5 minutes)
- [ ] Performance remains stable under normal load
- [ ] If fix was code change: deployed and tested
- [ ] If fix was index: verified with EXPLAIN ANALYZE
- [ ] Incident documented in #incidents

## When to Escalate

Escalate to L2 if:
- Can't identify which query is slow
- External API is slow and you can't work around it
- Need to modify database schema
- After 10 minutes without improvement

## Prevention for Future

1. **Add performance tests** - Catch regressions in CI/CD
2. **Set up slow query log** - Alert on queries >500ms
3. **Monitor external API latency** - Know when it's your problem vs theirs
4. **Index strategy** - Regular index review and optimization
5. **Load testing** - Test before traffic spike hits
