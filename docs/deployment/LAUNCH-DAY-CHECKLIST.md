# 🚀 Launch Day Checklist — SAT 26 Set or TUE 29 Set

**Status**: DRAFT — Complete all items before launch  
**Time Required**: 2 hours pre-launch + 30 min live

---

## 12 Hours Before Launch (FRI 25 or MON 28)

### Infrastructure Verification (30 min)
- [ ] Database backups created and tested
- [ ] All environment variables set in Render dashboard
- [ ] SSL certificate valid (Render auto-provisions)
- [ ] Monitoring dashboards accessible (Sentry, Analytics, Render logs)
- [ ] Email service credentials verified
- [ ] Auth tokens and secrets rotated (if necessary)

### Code Verification (30 min)
- [ ] Final build locally: `npm run build` ✅
- [ ] All tests passing: `npm test` ✅
- [ ] TypeScript: `npm run check` ✅
- [ ] No console errors in browser
- [ ] Critical path tested locally
- [ ] No hardcoded secrets in code (grep for passwords)

### Team Coordination (30 min)
- [ ] Team aware of launch time
- [ ] On-call rotation confirmed (who monitors first 24h?)
- [ ] Rollback procedure reviewed
- [ ] Communication channel open (Slack #production)
- [ ] Stakeholders notified (send launch announcement draft)

---

## 2 Hours Before Launch

### Final Database Check (15 min)
```bash
# Connect to production database
psql $DATABASE_URL -c "SELECT version();"

# Verify migrations applied
psql $DATABASE_URL -c "SELECT version FROM _prisma_migrations LIMIT 5;"

# Check table counts
psql $DATABASE_URL -c "SELECT schemaname, COUNT(*) FROM pg_tables GROUP BY schemaname;"
```

### Final Environment Verification (15 min)
```bash
# Double-check all critical env vars set
echo "Database: $DATABASE_URL" | grep -q postgresql || echo "❌ DATABASE_URL missing"
echo "JWT: $JWT_SECRET" | wc -c | grep -qE "[3-9][0-9]" || echo "❌ JWT_SECRET too short"
echo "Email: $EMAIL_API_KEY" | wc -c | grep -qE "[3-9][0-9]" || echo "❌ EMAIL_API_KEY missing"

# Test critical services
curl -s https://api.sendgrid.com -H "Authorization: Bearer $EMAIL_API_KEY" > /dev/null && echo "✅ Email service OK" || echo "❌ Email service failed"
```

---

## 30 Minutes Before Launch

### Pre-Deploy Checklist (20 min)
- [ ] Recent backup taken (just in case)
- [ ] Rollback procedure reviewed and ready
- [ ] Monitoring dashboards open in browser
- [ ] Slack #production channel active
- [ ] On-call person ready
- [ ] Launch announcement ready to send

### Deploy Approval (10 min)
- [ ] Product manager: "Launch approved" ✅
- [ ] QA lead: "Staging tested, no critical issues" ✅
- [ ] DevOps (you): "All systems ready" ✅

**Decision**: Go/No-Go?
- [ ] **GO**: Proceed with deploy
- [ ] **NO-GO**: Document reason, reschedule, fix, return

---

## Launch Time (14:00 UTC or custom)

### Deploy Phase (5 min)

**Option A: Render Dashboard**
```
1. Open dashboard.render.com
2. Click service "ctrl-alt-news-portal"
3. Click "Deploy" button
4. Select branch "main"
5. Confirm "Deploy this commit"
6. Watch build logs (should complete in 2-3 min)
```

**Option B: Git Push**
```bash
git push origin main
# Render webhook triggers automatically
# Watch: Render dashboard for build status
```

### Verification Phase (5 min)

```bash
# 1. Wait for build to complete (check Render logs)
# 2. Check health endpoint
curl https://ctrl-alt-news-portal.onrender.com/health

# 3. Test critical path
# Open browser: https://ctrl-alt-news-portal.onrender.com
# → Try login with Google OAuth
# → Try reading an article
# → Try posting a comment
# → Verify notifications sent

# 4. Check monitoring
# → Sentry: No critical errors?
# → Analytics: Traffic showing?
# → Server logs: Clean startup?

# 5. If all good → Continue to Live Monitoring
# 6. If issues → Trigger ROLLBACK immediately
```

---

## Live Monitoring (First 24 hours)

### First 5 Minutes (Critical)
- [ ] Server responding (< 500ms latency)
- [ ] No 500 errors in logs
- [ ] Health endpoint returning `{ status: "ok" }`
- [ ] Users can login
- [ ] Critical path works end-to-end

### First Hour
- [ ] Error rate < 0.1%
- [ ] API response time < 200ms
- [ ] Database queries < 100ms
- [ ] No database connection errors
- [ ] Email service working (test transactional email)
- [ ] Analytics tracking working

### First 24 Hours
- [ ] Uptime > 99%
- [ ] No cascading errors
- [ ] User feedback positive (no critical reports)
- [ ] Performance stable
- [ ] Database backups working

**Alert Thresholds** (escalate if triggered):
- Error rate > 1% → Check logs immediately
- API response time > 500ms → Check database
- Downtime > 1 min → Trigger rollback
- Email service failing → Notify stakeholders

---

## Incident Response (If Problems)

### Tier 1: Server Issues (< 5 min to decide)
- Response slow? → Check database queries, monitor loads
- 500 errors? → Check logs for exception
- Down completely? → **ROLLBACK immediately**

### Tier 2: Data Issues (< 15 min)
- Missing data? → Check database backups
- Corruption? → Stop server, restore backup, rollback
- Users locked out? → Check auth service

### Tier 3: Service Issues (< 1 hour)
- Email not sending? → Check email service credentials
- Analytics not tracking? → Check GA tags
- Monitoring broken? → Switch to simple health checks

---

## Post-Launch (After 24 hours)

### Success Criteria Met? (YES → Ship 🎉)
- [ ] Uptime ≥ 99%
- [ ] Error rate < 0.1%
- [ ] No critical incidents
- [ ] Users reporting positively
- [ ] Launch announcement sent

### Issues Identified? (NO → Fix & Re-monitor)
- [ ] Document all issues found
- [ ] Prioritize by severity
- [ ] Create post-launch hotfix PRs
- [ ] Deploy fixes with care
- [ ] Continue monitoring 24/7 for 7 days

---

## Communication Timeline

### Pre-Launch (2 hours before)
```
📢 Announcement: "Ctrl Alt News will be launching in 2 hours. We will be performing maintenance during this time. Expected downtime: 10 minutes."
```

### At Launch
```
🚀 Announcement: "Ctrl Alt News Portal is now LIVE! 🎉 Visit us at https://ctrl-alt-news-portal.onrender.com"
```

### If Issues
```
⚠️ Notification: "We are experiencing technical difficulties. Our team is working on it. Estimated resolution time: 10 minutes."
```

### Post-Launch
```
✅ Announcement: "Ctrl Alt News is running smoothly! Thanks for your patience during the launch."
```

---

## Escalation Matrix

| Issue | Time | Owner | Action |
|-------|------|-------|--------|
| Server down | IMMEDIATE | Devops | Rollback |
| High error rate | 5 min | Dev + Devops | Check logs |
| Database slow | 15 min | Data Engineer | Optimize queries |
| Email service down | 30 min | Devops | Switch provider or fix |
| Performance degraded | 1 hour | Dev + Devops | Optimize code or infra |

---

## Post-Launch Retrospective (After 48 hours)

- [ ] What went well?
- [ ] What could be improved?
- [ ] Any unexpected issues?
- [ ] Action items for next launch?
- [ ] Update this checklist based on learnings

---

*Launch checklist by Gage (DevOps)*  
*This is YOUR safety net — follow it exactly* ✅
