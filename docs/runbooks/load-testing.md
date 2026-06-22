# Load Testing & Capacity Planning Runbook

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

Load testing identifies system capacity limits and provides data for scaling decisions.

## Test Scenarios

### 1. Login Scenario
- Simulates user authentication
- Typical RPS: 10-100
- Helps identify auth bottlenecks

### 2. Read Scenario
- Browse articles, categories
- Typical RPS: 100-1000
- Most common traffic pattern

### 3. Create Scenario
- Create/edit articles, comments
- Typical RPS: 1-10
- Tests write performance

### 4. Search Scenario
- Full-text search queries
- Typical RPS: 10-100
- Identifies query optimization needs

## Running a Load Test

```bash
POST /api/load-test/run
{
  "scenario": "read",
  "rps": 100,
  "duration": 60,
  "concurrentUsers": 100
}
```

Parameters:
- **scenario**: login | read | create | search
- **rps**: Requests per second
- **duration**: Test duration in seconds
- **concurrentUsers**: Concurrent user connections

## Response Metrics

```json
{
  "result": {
    "testId": "load-test-1687353045000",
    "latency": {
      "p50": 45,
      "p95": 120,
      "p99": 250,
      "min": 10,
      "max": 500,
      "avg": 85
    },
    "capacity": {
      "requestsPerSecond": 100,
      "concurrentUsers": 100,
      "totalRequests": 6000,
      "successfulRequests": 5940,
      "failedRequests": 60,
      "successRate": 99.0
    },
    "bottleneck": "Database query performance",
    "recommendations": [
      "Optimize database queries",
      "Add caching layer"
    ]
  }
}
```

## Performance Targets

| Metric | Target | Alert |
|--------|--------|-------|
| p95 latency | < 200ms | > 300ms |
| p99 latency | < 500ms | > 1000ms |
| Success rate | > 99% | < 95% |
| Error rate | < 1% | > 5% |

## Load Testing Progression

### Step 1: Baseline (10 RPS)
```bash
POST /api/load-test/run
{
  "scenario": "read",
  "rps": 10,
  "duration": 60
}
```

Expected: p95 < 100ms, 100% success

### Step 2: Medium Load (100 RPS)
```bash
POST /api/load-test/run
{
  "scenario": "read",
  "rps": 100,
  "duration": 60
}
```

Expected: p95 < 200ms, > 99% success

### Step 3: High Load (1000 RPS)
```bash
POST /api/load-test/run
{
  "scenario": "read",
  "rps": 1000,
  "duration": 60
}
```

Expected: Identifies breaking point

## Capacity Planning

### Get Current Stats
```bash
GET /api/load-test/stats
```

Returns:
- Total tests run
- Average p95 latency
- Average success rate

### Get Capacity Forecast
```bash
GET /api/load-test/forecast?months=6
```

Returns:
- Current RPS capacity
- Forecasted RPS in 6 months
- Scaling needed? (yes/no)

## Bottleneck Identification

| Bottleneck | Indicator | Solution |
|-----------|-----------|----------|
| Database | p95 > 200ms, slow queries | Query optimization, indexing |
| Memory | p99 spikes, OOM errors | Cache optimization, memory increase |
| CPU | High CPU%, latency increases | Optimize algorithms, horizontal scale |
| Network | High bandwidth, timeouts | Connection pooling, compression |
| Cache | Low hit rate | Cache strategy, warmup |

## Scaling Decisions

**Scale Up (vertical):**
- Single bottleneck
- RPS < 10K
- Simple to implement

**Scale Out (horizontal):**
- Multiple bottlenecks
- RPS > 10K
- Load balancing needed

**Optimize (software):**
- Code/query issues
- Before hardware scaling
- Highest ROI

## Best Practices

1. **Warm up caches**: Run 5-min warm-up before testing
2. **Match production data**: Test DB size should match prod
3. **Test at peak load**: Identify limits, not averages
4. **Monitor during tests**: Watch CPU, memory, disk, network
5. **Multiple scenarios**: Test realistic traffic patterns
6. **Baseline regularly**: Monthly to track regressions
7. **Document results**: Build trend history

## Monitoring During Load Tests

Enable detailed monitoring:
- CPU usage
- Memory usage
- Disk I/O
- Network bandwidth
- Database connections
- Cache hit rate
- Error rate

## Load Testing Checklist

- [ ] Test environment ready
- [ ] Test data loaded (matches production size)
- [ ] External services mocked/isolated
- [ ] Monitoring enabled
- [ ] Baseline test (10 RPS) passes
- [ ] Medium load test (100 RPS) passes
- [ ] High load test (1000 RPS) completed
- [ ] Bottlenecks identified
- [ ] Recommendations documented
- [ ] Forecast generated
- [ ] Scaling decisions made
- [ ] Results archived

---

**See also**: docs/guides/monitoring-guide.md, docs/guides/performance-guide.md
