# Troubleshooting: Service Won't Start

**Symptom:** Application logs show startup errors, service exits immediately

## Quick Diagnosis (First 2 Minutes)

```bash
# 1. Check if service is running
docker ps | grep ctrl-alt-news
# If not listed → service crashed on startup

# 2. Check exit code
docker ps -a | grep ctrl-alt-news
# Look at STATUS column - shows exit code like "Exited (1)" or "Exited (137)"

# 3. Check the startup logs
docker logs ctrl-alt-news --tail 50
# This shows the last 50 lines of output before crash
```

## Interpreting Exit Codes

| Code | Meaning | Likely Cause |
|------|---------|--------------|
| 1 | General error | Exception thrown, see logs |
| 127 | Command not found | Missing dependency, binary not found |
| 137 | Killed (SIGKILL) | OOM (out of memory) |
| 139 | Segmentation fault | Memory corruption, native addon issue |
| 143 | Killed (SIGTERM) | Graceful shutdown signal |

## Root Cause Determination (Minutes 2-5)

### Scenario 1: Module Not Found

**Error message:** `Cannot find module '@opentelemetry/...'`

**Diagnosis:**
```bash
# Check if dependencies installed
ls -la node_modules/@opentelemetry

# List what's actually there
npm ls @opentelemetry/sdk-node

# Check package-lock.json is up to date
npm ls --depth=0
```

**Fix:**
```bash
# Reinstall dependencies
npm ci  # Use lock file

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Scenario 2: Database Connection Failed

**Error message:** `connect ECONNREFUSED 127.0.0.1:5432`

**Diagnosis:**
```bash
# Check if database is running
docker ps | grep postgres

# Test connection manually
psql -U postgres -h localhost -c "SELECT 1"

# Check database logs
docker logs <postgres-container> --tail 20
```

**Fix:**
```bash
# Start database if not running
docker-compose up -d postgres

# Wait for database to be ready (30 seconds)
sleep 30

# Then start application
docker restart ctrl-alt-news

# Or increase startup retry logic in app:
# while (!connected) { retry connection; wait 1 second; }
```

### Scenario 3: Port Already in Use

**Error message:** `EADDRINUSE: address already in use :::3000`

**Diagnosis:**
```bash
# Find what's using port 3000
lsof -i :3000
# or on Mac:
netstat -tuln | grep 3000

# Check if old instance is still running
docker ps | grep ctrl-alt-news
```

**Fix:**
```bash
# Kill old process
kill -9 <PID>

# Or restart all containers
docker-compose restart

# Or change port
docker run -p 3001:3000 ctrl-alt-news
```

### Scenario 4: Missing Environment Variables

**Error message:** `TypeError: Cannot read property 'DATABASE_URL' of undefined`

**Diagnosis:**
```bash
# Check environment variables in container
docker exec ctrl-alt-news env | grep DATABASE

# Check .env file
cat .env | grep DATABASE

# Check docker-compose.yml
cat docker-compose.yml | grep -A 10 "environment:"
```

**Fix:**
```bash
# Set environment variable
export DATABASE_URL="postgresql://user:pass@localhost/db"

# Or add to .env
echo "DATABASE_URL=postgresql://..." >> .env

# Or in docker-compose.yml:
# environment:
#   DATABASE_URL: postgresql://user:pass@postgres:5432/db

# Restart with environment
docker restart ctrl-alt-news
```

### Scenario 5: Permission Denied

**Error message:** `Error: EACCES: permission denied, open '/data/config.json'`

**Diagnosis:**
```bash
# Check file permissions
ls -la /data/config.json

# Check what user the container runs as
docker inspect ctrl-alt-news | grep -A 5 "User"
```

**Fix:**
```bash
# Fix permissions (from host or in container)
chmod 644 /data/config.json
chown 1000:1000 /data/config.json  # Or appropriate user

# Restart
docker restart ctrl-alt-news
```

### Scenario 6: Build Failed

**Error message:** Appears during `npm run build`

**Diagnosis:**
```bash
# Run build locally
npm run build 2>&1 | tail -50

# Check for TypeScript errors
npm run typecheck

# Check for lint errors
npm run lint
```

**Fix:**
```bash
# Fix the reported errors

# Re-build
npm run build

# Re-run tests to confirm
npm test

# Then restart container
docker build -t ctrl-alt-news .
docker restart ctrl-alt-news
```

## Detailed Investigation (Minutes 5-15)

### Step-by-Step Log Analysis

```bash
# Get full startup log (not just tail)
docker logs ctrl-alt-news > startup.log

# Search for ERROR lines
grep -i error startup.log

# Search for stack trace
grep -i "at.*:.*:" startup.log

# Search for warnings that might explain exit
grep -i "warning" startup.log
```

### Check Dependencies

```bash
# Are all production dependencies installed?
npm ls --production

# Are native modules built correctly?
npm rebuild

# Is Node version compatible?
node --version
npm --version
```

### Check Configuration

```bash
# Validate environment
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Validate JSON configs
cat config.json | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf-8')))"
```

## Resolution Checklist

- [ ] Root cause identified (missing module, connection, port, env, permissions, build)
- [ ] Error message understood (search Google, check docs)
- [ ] Fix applied (install deps, start DB, fix permissions)
- [ ] Service starts successfully
- [ ] Service stays running for at least 30 seconds
- [ ] Logs show normal startup (no errors)
- [ ] Service responds to requests: `curl http://localhost:3000`
- [ ] Incident documented in #incidents

## When to Escalate

Escalate to L2 if:
- Can't understand the error message
- Fix doesn't work after trying twice
- Error is in native addon (node-gyp, bcrypt, etc.)
- Need to rollback to previous version
- Database migration failed on startup

## Prevention for Future

1. **Add health check** - Container should exit if health check fails
2. **Add startup tests** - Run in CI before deploying
3. **Add readiness probe** - Kubernetes waits for readiness before serving traffic
4. **Validate on build** - Fail fast in CI, don't deploy broken builds
5. **Have rollback plan** - Know how to go back to previous version quickly

## Common Fixes Quick Reference

```bash
# Most common fix 1: Reinstall dependencies
npm ci && npm run build && docker restart ctrl-alt-news

# Most common fix 2: Start missing service
docker-compose up -d postgres && docker restart ctrl-alt-news

# Most common fix 3: Fix environment
export DATABASE_URL="..." && docker restart ctrl-alt-news

# Most common fix 4: Free up port
lsof -i :3000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
docker restart ctrl-alt-news
```
