# Observability Training for Ctrl Alt News Portal

**Hands-on guide to understand and use our observability stack**

## Training Objectives

By the end of this training, you'll be able to:
- ✅ Access all observability tools (Grafana, Loki, Jaeger, AlertManager)
- ✅ Read and understand metrics dashboards
- ✅ Query logs to find and diagnose issues
- ✅ Navigate distributed traces to find performance bottlenecks
- ✅ Respond to and acknowledge alerts
- ✅ Use troubleshooting guides to resolve common issues

**Time Required:** 90 minutes (can be split into 3 sessions of 30 min each)

---

## Part 1: Introduction to Observability (15 minutes)

### What is Observability?

**Three pillars:**
1. **Logs** - What happened (event messages with timestamp, level, context)
2. **Metrics** - How much / how fast (aggregated measurements)
3. **Traces** - How does it work (request flow through system)

**Why we need all three:**
- Logs tell you WHAT (e.g., "database connection failed")
- Metrics tell you WHEN and HOW MUCH (e.g., "connection failures started at 2:30pm, affecting 5% of requests")
- Traces show you WHY (e.g., "request spent 2s waiting for DB, 3s in slow query")

### Our Stack

```
Application (Node.js + React)
    ├─→ Logs → Loki (storage) → Grafana (visualization)
    ├─→ Metrics → Prometheus (storage) → Grafana (visualization)
    └─→ Traces → Jaeger (storage + visualization)
                ↓
            AlertManager
                ↓
            Slack #alerts
```

### Key Concepts

- **Span** - Single operation (e.g., "database query", "API call")
- **Trace** - Chain of spans for one request
- **Label** - Tag on logs/metrics (e.g., service="api", endpoint="/articles")
- **Alert** - Rule that fires when metric exceeds threshold
- **SLA** - Service Level Agreement (e.g., "99.9% uptime", "<500ms latency")

---

## Part 2: Accessing the Tools (20 minutes)

### Exercise 1: Access Grafana

**Goal:** Get familiar with the dashboard interface

1. **Navigate:** Open http://localhost:3001
2. **Login:** admin / admin
3. **Explore home:** Click around, see what's available
4. **Find main dashboard:** Search "Ctrl Alt News" (or click on it if pinned)
5. **Explore panels:**
   - Look at "Error Rate" panel
   - Look at "Latency (P50/P99)" panel
   - Look at "Memory Usage" panel
   - What's the normal range for each?

**Questions to answer:**
- What's the current error rate?
- What's the P99 latency?
- How much memory is being used?

### Exercise 2: Access Prometheus

**Goal:** Understand metrics at the source

1. **Navigate:** Open http://localhost:9090
2. **Click "Graph" tab**
3. **Search for a metric:** Type `http_requests_total` in query box
4. **Click "Execute"**
5. **View results:** You should see a graph of requests over time
6. **Try other queries:**
   - `process_resident_memory_bytes` (memory)
   - `http_request_duration_seconds` (latency)

**Questions to answer:**
- How many requests per second?
- Is it increasing or steady?
- What's the trend over the last hour?

### Exercise 3: Access Loki (Logs)

**Goal:** Learn to query logs

1. **In Grafana:** Click "Explore" (left sidebar)
2. **Select "Loki"** from data source dropdown
3. **Write query:** `{service="ctrl-alt-news-api"}`
4. **Click "Run query"**
5. **View logs:** You should see log lines
6. **Try filtering:** `{level="error"}`
7. **Try text search:** `{level="error"} |= "timeout"`

**Questions to answer:**
- How many error logs in the last hour?
- What's the most common error?
- Can you find a timeout error?

### Exercise 4: Access Jaeger (Traces)

**Goal:** Understand request flow

1. **Navigate:** Open http://localhost:16686
2. **Select service:** "ctrl-alt-news-server" from dropdown
3. **Click "Find Traces"**
4. **Click on a trace** to see waterfall diagram
5. **Explore the waterfall:**
   - Each bar = one span
   - Width = duration
   - Understand: HTTP middleware → Database query → Response

**Questions to answer:**
- What's the total request time?
- Which operation took the longest?
- Can you see database spans?

### Exercise 5: Access AlertManager

**Goal:** See where alerts are configured

1. **Navigate:** Open http://localhost:9093
2. **Click "Alerts"** - See all active alerts
3. **Click "Silences"** - See silenced alerts
4. **Click "Config"** - See alert routing rules
5. **Notice:** Alerts route to Slack #alerts channel

**Questions to answer:**
- Are there any active alerts right now?
- What's the highest severity?
- Where do alerts get routed?

---

## Part 3: Common Tasks (30 minutes)

### Task 1: Find Slow Requests

**Scenario:** Users report the site is slow

**Steps:**
1. Go to Grafana "Ctrl Alt News - Application Metrics"
2. Look at "Request Latency (p50/p99)" panel
3. Is P99 > 1 second? → Site is slow
4. Look at "Latency by Endpoint" → Which endpoint?
5. Go to Jaeger, filter by endpoint and duration > 1000ms
6. Click a slow trace, identify the widest span
7. If it's database: that query is slow
8. If it's external_api: that API is slow
9. If it's general: application logic is slow

**What you learned:**
- How to correlate metrics with traces
- How to identify bottlenecks
- Where to look next for deeper investigation

### Task 2: Find Error Patterns

**Scenario:** Error rate spiked to 10%

**Steps:**
1. Go to Prometheus, query: `rate(http_requests_total{status=~"5.."}[5m])`
2. Graph shows the error spike
3. Go to Grafana, "Error Rate by Endpoint"
4. Which endpoint is failing?
5. Go to Loki, query: `{level="error"} | json | endpoint="/api/articles"`
6. Read error messages
7. Look for patterns: Same error repeated? Or different errors?
8. Check recent git commits: Did we deploy something?

**What you learned:**
- How to correlate metrics with logs
- How to identify which part of the system is broken
- How to use git history for context

### Task 3: Respond to an Alert

**Scenario:** HighErrorRate alert fires

**Steps:**
1. See alert in #alerts Slack channel
2. Read alert message (alertname, value, threshold)
3. React with ⏸️ to acknowledge
4. Click runbook link or go to docs/runbooks/troubleshooting/high-error-rate.md
5. Follow step 1-3 in the runbook
6. Gather information: What's the error? What endpoint?
7. Make a decision: Can I fix it? Or need help?
8. If can fix: Implement fix (restart service, add index, etc.)
9. If need help: Message L2 in Slack
10. Monitor for 5 minutes to confirm alert clears

**What you learned:**
- Alert → Runbook → Investigation → Fix workflow
- When to escalate vs when to fix yourself

---

## Part 4: Practice Scenarios (25 minutes)

### Practice 1: Memory Leak Investigation

**Scenario:** Memory usage is growing over time

**Your task:**
1. Check if memory is actually growing (use docker stats)
2. Or simulate: `while true; do curl http://localhost:3000/; done` (load test)
3. Watch memory climb in Grafana
4. Determine: Is it a leak or just high usage?
5. If leak: Where is the data stored?
6. If high usage: Is it proportional to traffic?
7. Write up your findings: "Memory is [growing | stable]. This suggests [leak | normal]. Next steps: [restart | investigate | scale]"

**What you learned:**
- How to distinguish between leak and normal usage
- How to use stress testing to reproduce issues
- How to document findings for team

### Practice 2: N+1 Query Detection

**Scenario:** One endpoint is slow

**Your task:**
1. Go to Jaeger, filter by slow traces (>1000ms)
2. Click a slow trace
3. Look at database spans (count them)
4. If many database spans in sequence = N+1 query problem
5. If one big database span = single slow query problem
6. Write your finding: "This endpoint has [X] database queries. This suggests [N+1 pattern | slow single query]. Fix: [batch query | add index | join]"

**What you learned:**
- How to identify N+1 patterns in traces
- How to distinguish query problems
- How to recommend solutions

### Practice 3: Alert Response

**Scenario:** HighLatency alert fires

**Your task:**
1. Acknowledge alert in Slack (#alerts)
2. Open the HighLatency runbook (docs/runbooks/troubleshooting/slow-requests.md)
3. Follow the diagnosis steps
4. Determine root cause (database, external API, GC, load)
5. Implement fix (add index, increase timeout, restart service)
6. Monitor for 5 minutes
7. Write incident report in #incidents:
   ```
   **Incident:** HighLatency alert
   **Duration:** [start time] to [end time]
   **Root Cause:** [what was wrong]
   **Fix:** [what you did]
   **Prevention:** [what to do next time]
   ```

**What you learned:**
- Full incident response cycle
- How to document for team learning
- How to prevent recurrence

---

## Part 5: Key Takeaways (5 minutes)

### Remember

✅ **Three pillars:** Logs (what), Metrics (when/how much), Traces (how)

✅ **Tools are linked:**
- Metric spike → Check logs for errors → Check traces for bottleneck

✅ **Runbooks are your friend:**
- Don't memorize, follow the guide
- Each alert has a corresponding runbook

✅ **Escalate early:**
- If stuck after 5 minutes → Page L2
- If critical → Escalate immediately

✅ **Document everything:**
- What happened
- What you did
- What you learned
- What to do next time

### Next Steps

1. **Bookmark all tools:**
   - Grafana: http://localhost:3001
   - Prometheus: http://localhost:9090
   - Jaeger: http://localhost:16686
   - AlertManager: http://localhost:9093

2. **Read the runbooks:**
   - access-guide.md (how to use each tool)
   - alerting-guide.md (alert response procedure)
   - Each troubleshooting guide for different scenarios

3. **Do on-call shadowing:**
   - Shadow current on-call engineer for one shift
   - See how they respond to real alerts
   - Ask questions

4. **Get access:**
   - Request Slack notification permissions
   - Set up on-call phone alerts
   - Test your paging setup

### Q&A

**Q: What if I don't understand an error message?**
A: Google it, ask in #observability channel, or escalate to L2

**Q: What if the runbook doesn't solve it?**
A: Escalate to L2 and document what you tried

**Q: What if the service crashes while I'm investigating?**
A: Restart it immediately (docker restart), then continue investigating

**Q: Who do I contact with questions?**
A: Ask in #observability channel or contact [Observability Lead name]

---

## Training Completion Checklist

- [ ] Accessed all 5 tools (Grafana, Prometheus, Loki, Jaeger, AlertManager)
- [ ] Completed Exercise 1 (Grafana navigation)
- [ ] Completed Exercise 2 (Prometheus querying)
- [ ] Completed Exercise 3 (Loki log search)
- [ ] Completed Exercise 4 (Jaeger trace exploration)
- [ ] Completed Exercise 5 (AlertManager overview)
- [ ] Completed Task 1 (Find slow requests)
- [ ] Completed Task 2 (Find error patterns)
- [ ] Completed Task 3 (Respond to alert)
- [ ] Completed Practice 1 (Memory leak investigation)
- [ ] Completed Practice 2 (N+1 query detection)
- [ ] Completed Practice 3 (Full alert response)
- [ ] Understand the three pillars (logs, metrics, traces)
- [ ] Know how to follow a runbook
- [ ] Know when to escalate to L2

---

## Further Learning

### Recommended Reading
- observability-runbook.md - Full reference
- distributed-tracing-guide.md - Deep dive into traces
- metrics-interpretation.md - Understanding each metric
- log-querying-guide.md - LogQL syntax deep dive

### Advanced Topics (Optional)
- How to create custom metrics in your code
- How to create custom spans for business logic
- How to create Grafana dashboards
- How to tune alert thresholds
- How to write custom alert rules in Prometheus

### Resources
- [OpenTelemetry Docs](https://opentelemetry.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/)
- [LogQL Syntax Guide](https://grafana.com/docs/loki/latest/query_language/)

---

**Training Created:** 2026-04-24  
**Review Interval:** Quarterly  
**Next Training:** 2026-07-24  
**Owner:** Observability Team
