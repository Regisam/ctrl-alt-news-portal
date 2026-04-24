# Observability Runbook

**Ctrl Alt News Portal - Production Monitoring & Incident Response Guide**

This runbook documents how to access observability tools, interpret metrics and logs, respond to alerts, and debug production issues.

## Quick Navigation

- **Accessing Tools** → [access-guide.md](access-guide.md)
- **Querying Logs** → [log-querying-guide.md](log-querying-guide.md)
- **Understanding Metrics** → [metrics-interpretation.md](metrics-interpretation.md)
- **Handling Alerts** → [alerting-guide.md](alerting-guide.md)
- **On-Call Procedures** → [on-call-guide.md](on-call-guide.md)
- **Troubleshooting** → [troubleshooting/](troubleshooting/)
- **Reading Traces** → [../guides/distributed-tracing-guide.md](../guides/distributed-tracing-guide.md)
- **Quick Reference** → [quick-reference.txt](quick-reference.txt)

## Observability Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Application (Node.js/React)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   HTTP       │  │  Database    │  │    Async     │           │
│  │  Requests    │  │   Queries    │  │  Operations  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────┬──────────────────────┬──────────────────────────┬────┘
           │ Logs                 │ Metrics                  │ Traces
           ↓                      ↓                          ↓
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│      Loki        │   │   Prometheus     │   │      Jaeger      │
│  (Log Storage)   │   │  (Metrics DB)    │   │  (Trace Storage) │
│  localhost:3100  │   │ localhost:9090   │   │ localhost:16686  │
└────────┬─────────┘   └────────┬─────────┘   └──────────────────┘
         │                      │
         └──────────┬───────────┘
                    ↓
         ┌──────────────────────────┐
         │      Grafana             │
         │  (Visualization)         │
         │  localhost:3001          │
         └────────┬─────────────────┘
                  │
                  ↓
         ┌──────────────────────────┐
         │    AlertManager          │
         │  (Alert Routing)         │
         │  localhost:9093          │
         └────────┬─────────────────┘
                  │
                  ↓
         ┌──────────────────────────┐
         │  Slack #alerts           │
         │  (Team Notifications)    │
         └──────────────────────────┘
```

## Tool Endpoints (Local Development)

| Tool | URL | Purpose |
|------|-----|---------|
| **Grafana** | http://localhost:3001 | View metrics dashboards |
| **Prometheus** | http://localhost:9090 | Query metrics directly |
| **Loki** | http://localhost:3100 | Query logs directly |
| **Jaeger** | http://localhost:16686 | View distributed traces |
| **AlertManager** | http://localhost:9093 | Manage alert routing |

Default login: `admin` / `admin`

## Key Metrics at a Glance

| Metric | Normal Range | Alert Threshold | What It Means |
|--------|--------------|-----------------|---------------|
| **Error Rate** | <1% | >5% for 1+ min | % of requests failing |
| **Latency (p99)** | <500ms | >2000ms for 2+ min | 99th percentile request time |
| **Memory Usage** | <300MB | >500MB for 5+ min | Node.js heap memory |
| **CPU Usage** | <30% | >80% for 5+ min | CPU utilization |
| **Disk Space** | >30% free | <10% free | Storage usage |

## Alert Response Flowchart

```
┌─────────────────┐
│  Alert Fires    │
│  (Slack msg)    │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│ Read Alert Message &    │
│ Click Runbook Link      │
└────────┬────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Follow Troubleshooting Guide    │
│ (see troubleshooting/ folder)   │
└────────┬────────────────────────┘
         │
         ├─ Issue Found?
         │
         ├─ YES → Mitigate
         │        React to alert with ⏸️
         │        Implement fix
         │        Monitor resolution
         │
         └─ NO → Escalate
                  Page L2 after 5 min
                  Document investigation
```

## Common Incident Scenarios

### 1. High Error Rate Alert
**Error rate > 5%** for more than 1 minute

1. Go to Grafana "Ctrl Alt News - Application Metrics" dashboard
2. Check which endpoint is failing (see Error Rate panel)
3. Check logs for errors: `{level="error"} | json | status_code >= 500`
4. See [troubleshooting/high-error-rate.md](troubleshooting/high-error-rate.md)

### 2. High Latency Alert
**P99 latency > 2 seconds** for more than 2 minutes

1. Go to Grafana and check request latency panel
2. Identify which endpoint is slow
3. Check database metrics for query latency
4. See [troubleshooting/slow-requests.md](troubleshooting/slow-requests.md)

### 3. High Memory Usage Alert
**Memory > 500MB** for more than 5 minutes

1. Check Grafana memory usage panel
2. Check if memory is growing (leak) or stable (load spike)
3. See [troubleshooting/memory-leak.md](troubleshooting/memory-leak.md)

### 4. Service Won't Start
**Application logs show startup errors**

1. Check application logs: `docker logs <container>`
2. Verify dependencies (database, cache)
3. See [troubleshooting/service-startup-failure.md](troubleshooting/service-startup-failure.md)

### 5. Intermittent 503 Errors
**Random 503 errors affecting ~1% of requests**

1. Check rate limiting metrics
2. Check downstream service status (dependencies)
3. See [troubleshooting/intermittent-503s.md](troubleshooting/intermittent-503s.md)

## Incident Response Template

Use this template when documenting incidents:

```
INCIDENT: [Brief title]
TIME: [When it started]
ALERT: [Which alert fired]
SEVERITY: [P1 Critical | P2 Major | P3 Minor]

INVESTIGATION:
- [What you found in logs]
- [What you found in metrics]
- [What you found in traces]

ROOT CAUSE:
[Brief explanation of what went wrong]

MITIGATION (Immediate):
[What you did to fix it]

IMPACT:
- Duration: [Start time] to [End time]
- Error Rate: [Peak %]
- Users Affected: [Estimate]

PERMANENT FIX:
[Code/config change to prevent recurrence]

POSTMORTEM:
- Date: [Schedule within 48 hours]
- Attendees: [Who should attend]
- Focus: How do we prevent this in the future?
```

## Escalation Chain

- **You (L1)**: Acknowledge alert, investigate, mitigate (target: <5 min response)
- **Senior Dev (L2)**: Page if unresolved after 5 min (target: <10 min to help)
- **Manager (L3)**: Page if critical and no progress after 15 min

See [on-call-guide.md](on-call-guide.md) for detailed procedures.

## Useful Commands

```bash
# SSH into server
ssh deploy@production.example.com

# View application logs
docker logs -f ctrl-alt-news

# Check database connections
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check disk space
df -h

# Check running processes
ps aux | grep node

# Restart application
docker restart ctrl-alt-news
```

## Getting Help

- **Documentation**: Read the appropriate guide in this runbook
- **Team Slack**: Post in #incidents with alert details
- **On-Call Manager**: Page if P1 critical incident (>30 min)

## Runbook Review Schedule

- **Quarterly**: Review and update for accuracy
- **After each major incident**: Add new troubleshooting guide if needed
- **Annually**: Full refresh and team training

Last Updated: 2026-04-24  
Next Quarterly Review: 2026-07-24
