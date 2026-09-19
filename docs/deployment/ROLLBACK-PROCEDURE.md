# 🔄 Rollback Procedure — Production Recovery

**Created**: 2026-09-19  
**Purpose**: Quick recovery if production deploy fails  
**Time to Rollback**: < 5 minutes

---

## Quick Recovery (< 5 min)

**If production is down or broken, follow this**:

### Step 1: Assess Severity (1 min)
```bash
# Check if server is responding
curl -I https://ctrl-alt-news-portal.onrender.com

# Check logs for obvious errors
# → Render dashboard: "Logs" tab
```

**Decision Tree**:
- ✅ Server responding + features working → NO ROLLBACK (just monitor)
- ⚠️ Server slow or errors in logs → Wait 2 min, check if auto-recovery
- 🔴 Server down or critical error → ROLLBACK NOW

### Step 2: Initiate Rollback (2 min)

**Via Render Dashboard**:
1. Login to dashboard.render.com
2. Click service "ctrl-alt-news-portal"
3. Go to "Deployments" tab
4. Find previous stable deploy (look for ✅ green checkmark)
5. Click "Revert" button
6. Confirm "Yes, revert to this deploy"

**Via Git** (if dashboard unavailable):
```bash
# Find last known good commit
git log --oneline | head -5
# e.g., a829d34 fix: Resolve all TypeScript/ESLint errors

# Revert to that commit
git revert HEAD --no-edit
git push origin main
# Render will auto-redeploy with previous code
```

### Step 3: Verify Recovery (2 min)

```bash
# 1. Wait for Render to restart (1 min)
# 2. Test health endpoint
curl https://ctrl-alt-news-portal.onrender.com/health

# Expected: { "status": "ok", "timestamp": "..." }

# 3. Test critical path
# Open browser: https://ctrl-alt-news-portal.onrender.com
# Try: Login → View article → Post comment

# 4. Check logs for errors
# Render dashboard: Logs tab should show clean startup
```

### Step 4: Post-Rollback

- [ ] Notify team (Slack, email)
- [ ] Log incident (what happened?)
- [ ] Schedule post-mortem (when did deploy fail?)
- [ ] Fix root cause locally
- [ ] Re-test locally before re-deploy
- [ ] Deploy fix with careful monitoring

---

## Staged Rollback Scenarios

### Scenario 1: Build Failed
**Symptom**: Server won't start, logs show "Build command failed"

**Recovery**:
1. Rollback via dashboard (2 min)
2. Root cause: Check what changed in build (likely package.json or build config)
3. Fix: `npm run build` locally, verify success
4. Re-deploy: Push fixed code

### Scenario 2: Server Crashes on Startup
**Symptom**: Server starts, then crashes (logs show error), 503 errors

**Recovery**:
1. Rollback via dashboard (2 min)
2. Root cause: Check error logs for missing env var or dependency
3. Fix: Verify all env vars set, run locally with same env
4. Re-deploy: Push fixed code

### Scenario 3: Database Connection Error
**Symptom**: Server starts but errors on first request ("Cannot connect to database")

**Recovery**:
1. Rollback (2 min)
2. Check: Verify DATABASE_URL set in Render dashboard
3. Verify: PostgreSQL service still running (check Render dashboard)
4. Test locally: `psql $DATABASE_URL -c "SELECT 1;"`
5. If DB is down: Wait for Render auto-recovery or restore from backup
6. Re-deploy: After DB confirmed working

### Scenario 4: Performance Degradation
**Symptom**: Server running but very slow (> 3s response time)

**Recovery**:
1. Monitor for 2 min (might just be initial load)
2. If persists: Rollback (safer to serve old code quickly than new code slowly)
3. Check metrics: Database load, memory usage (Render dashboard)
4. Fix: Optimize slow queries or add caching
5. Re-deploy with monitoring

### Scenario 5: Data Corruption
**Symptom**: Users report missing data or weird behavior

**Recovery**:
1. DO NOT proceed with normal rollback
2. STOP production server immediately
3. Restore database from backup (most recent known good)
4. Verify data integrity (sample queries, check tables)
5. THEN rollback code
6. Contact affected users (data loss?)

---

## Backup Restoration (If Needed)

**Only if database is corrupted**:

```bash
# 1. List available backups
# Render dashboard → Database → Backups tab

# 2. Restore from backup
# Click "Restore" on the backup you want
# Render handles this automatically

# 3. Point production server to restored DB
# Render automatically updates DATABASE_URL

# 4. Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM articles;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 5. Restart production server
# Click "Deploy" → Revert to last working code
```

---

## Communication Template

**If rollback happens, post in Slack/email**:

```
🚨 PRODUCTION INCIDENT — Rollback Initiated

Time: 2026-09-26 14:15 UTC
Service: Ctrl Alt News Portal (Render)
Status: RECOVERED ✅

What happened:
- Deploy of commit [COMMIT] introduced [ERROR]
- Server went down / became slow / data issue
- Action: Rolled back to commit [PREVIOUS_COMMIT]

Timeline:
- 14:12 — Incident detected
- 14:14 — Rollback initiated
- 14:15 — Service recovered ✅
- Total downtime: 3 minutes

Next steps:
- [Fix A] will be deployed after local testing
- [Fix B] will be deployed with monitoring
- Post-mortem: TBD

Thanks for your patience.
```

---

## Prevention Tips

**To avoid needing rollback**:

1. ✅ Run quality gates before push (`npm run check && npm run build`)
2. ✅ Test locally with production env vars
3. ✅ Review what changed before deploy
4. ✅ Have monitoring live (alert on errors)
5. ✅ Deploy during business hours (not at night)
6. ✅ Have teammate on standby
7. ✅ Document deploy in Slack (pinned message)

---

## Rollback History

| Date | Commit | Reason | Recovery Time |
|------|--------|--------|----------------|
| — | — | — | — |

*Add entries as rollbacks occur*

---

*Rollback procedure by Gage (DevOps)*  
*Keep this procedure SHORT and testable* ⚡
