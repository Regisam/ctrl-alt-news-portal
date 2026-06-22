# Incident Response Runbook

**Last Updated**: 2026-06-22  
**Version**: 1.0  
**Severity Levels**: Low | Medium | High | Critical

---

## Quick Access

- **Health Dashboard**: `GET /api/health`
- **Alerts**: `GET /api/monitoring/alerts`
- **Metrics**: `GET /api/monitoring/metrics`
- **Alert History**: `GET /api/monitoring/alerts/history`

---

## Alert Severity Levels

| Level | Response Time | Action |
|-------|---------------|--------|
| Low | <24h | Log and monitor |
| Medium | <4h | Notify ops, investigate root cause |
| High | <1h | Page on-call, start mitigation |
| Critical | Immediate | Page on-call + team lead, begin incident response |

---

## Common Incidents & Recovery

### 1. High Memory Usage Alert

**Symptom**: `Process memory usage critical: >90%`

**Steps**:
1. Check memory usage: `curl http://localhost:3000/api/health`
2. Identify process eating memory:
   ```bash
   ps aux | grep node
   ```
3. Check logs for memory leaks:
   ```bash
   tail -100 logs/error.log | grep -i memory
   ```
4. **Action**: Restart server if memory > 95%
   ```bash
   systemctl restart ctrl-alt-news
   ```
5. **Follow-up**: Review logs, identify memory leak

---

### 2. High CPU Load Alert

**Symptom**: `CPU load critical: >90%`

**Steps**:
1. Check CPU usage: `top -b -n 1 | head -20`
2. Check active requests:
   ```bash
   curl http://localhost:3000/api/monitoring/metrics
   ```
3. **Action**: Check for runaway queries or requests
4. **Follow-up**: Scale horizontally (add more instances) if sustained

---

### 3. Server Downtime

**Symptom**: `GET /api/health` → Connection refused

**Steps**:
1. Check if server is running:
   ```bash
   ps aux | grep "node dist"
   ```
2. Check logs:
   ```bash
   tail -50 logs/combined.log
   ```
3. Restart server:
   ```bash
   systemctl restart ctrl-alt-news
   ```
4. Verify recovery:
   ```bash
   curl -v http://localhost:3000/api/health
   ```

---

### 4. High Error Rate

**Symptom**: Error rate >5% of requests

**Steps**:
1. Check recent errors:
   ```bash
   curl http://localhost:3000/api/monitoring/alerts/history?limit=50
   ```
2. Analyze error patterns:
   ```bash
   tail -200 logs/error.log | grep -E "status.*[45]\d{2}"
   ```
3. **Common causes**:
   - Database connection lost → Verify DB credentials
   - Third-party API down → Check external service status
   - Code bug → Review recent deployments
4. **Action**: Roll back last deployment if error rate spiked after deploy
   ```bash
   git revert <commit-hash>
   npm run build && systemctl restart ctrl-alt-news
   ```

---

## Preventive Monitoring

### Daily Checks

1. **Server Health** (Morning)
   ```bash
   curl http://localhost:3000/api/health
   ```
   - Verify uptime, memory, CPU reasonable

2. **Active Alerts** (Throughout day)
   ```bash
   curl http://localhost:3000/api/monitoring/alerts
   ```
   - Monitor for emerging patterns

3. **Error Log Review** (End of day)
   ```bash
   tail -1000 logs/error.log | wc -l
   ```
   - Ensure error count not growing exponentially

---

## Alert Management

### Clear Resolved Alert

```bash
curl -X DELETE http://localhost:3000/api/monitoring/alerts/{alert-id}
```

### Export Alert History

```bash
curl http://localhost:3000/api/monitoring/alerts/history?limit=1000 > alerts.json
```

---

## Escalation

### When to Escalate

- **Critical alert active >15 min** → Page on-call engineer
- **Repeated incidents** → Schedule postmortem
- **Unable to resolve** → Involve platform team

### Contacts

| Role | Name | Phone | On-Call |
|------|------|-------|---------|
| On-Call Engineer | TBD | TBD | Rotate weekly |
| Platform Lead | TBD | TBD | Always available |
| Database Admin | TBD | TBD | Business hours |

---

## Postmortem Template

**After any Critical/High alert:**

1. What was the impact? (Users affected, duration)
2. What was the root cause?
3. What was the fix?
4. What prevents recurrence?
5. Owner & timeline for prevention

---

## Testing

Run monthly incident drills:

```bash
# Test alert system
curl -X POST http://localhost:3000/api/monitoring/test-alert \
  -H "Content-Type: application/json" \
  -d '{"severity":"high","message":"Test drill"}'
```

Record response time, notification delivery, and team communication.

---

**Last Drill**: None yet  
**Next Scheduled**: 2026-07-22
