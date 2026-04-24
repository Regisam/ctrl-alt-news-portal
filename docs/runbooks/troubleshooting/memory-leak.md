# Troubleshooting: Memory Leak

**Alert:** Memory usage >500MB for 5+ minutes

## Quick Diagnosis (First 2 Minutes)

```bash
# 1. Check if alert is firing
# Go to: http://localhost:9090/alerts
# Look for HighMemory - is it RED or GREEN?

# 2. Check memory usage now
docker stats ctrl-alt-news --no-stream

# 3. Is it growing or stable?
# Watch it for 30 seconds
docker stats ctrl-alt-news
# If growing consistently → memory leak
# If stable at 500MB → just using a lot of memory
```

## Quick Fixes (First 5 Minutes)

### Fix 1: Restart Service

```bash
# Restart to clear memory
docker restart ctrl-alt-news

# Wait 30 seconds for startup
sleep 30

# Check memory again
docker stats ctrl-alt-news --no-stream
```

**If memory goes back to <300MB:**
- Leak exists, will grow again over time
- Create ticket for detailed investigation

**If memory quickly grows back to 500MB:**
- More serious issue, proceed to detailed investigation

### Fix 2: Check for Hanging Processes

```bash
# See what's running
ps aux | grep node

# Check for zombie processes
ps aux | grep defunct

# Kill old Node processes if needed
pkill -9 node
docker restart ctrl-alt-news
```

## Root Cause Determination (Minutes 5-10)

### Scenario 1: Leak Confirmed (Memory Grows After Restart)

Memory goes back to normal after restart, then grows again over hours = **memory leak**

**Diagnosis:**
```bash
# Get heap dump (when memory is high)
docker exec ctrl-alt-news node -e "
const v8 = require('v8');
const fs = require('fs');
const filename = '/tmp/heap-dump-' + Date.now() + '.heapsnapshot';
const writeStream = fs.createWriteStream(filename);
v8.writeHeapSnapshot(filename);
console.log('Heap dump saved to', filename);
"

# This creates a heap snapshot you can analyze locally
# Download it and open in Chrome DevTools
```

**Most likely cause:**
- Event listeners not cleaned up
- Timers/intervals not cleared
- Caches growing without bound
- Global variables holding references

### Scenario 2: Just Using a Lot of Memory (No Leak)

Memory stays high but doesn't grow = **high memory usage under load**

**Diagnosis:**
```bash
# Check if memory correlates with request rate
# Dashboard: "Ctrl Alt News - Application Metrics"
# Compare: "Request Rate" vs "Memory Usage" panels

# If they move together:
# - High traffic = high memory (normal)
# - No traffic = still high memory (cache)

# If memory keeps growing even at low traffic:
# - Leak exists
```

**Most likely cause:**
- Large cache (article content, images)
- Heavy traffic (many concurrent requests)
- Legitimate memory usage for features

**Fix:**
- Implement cache TTL: `cache.set(key, value, { ttl: 3600 })`
- Add cache size limit: `cache.maxSize = 1000`
- Paginate results: Don't load all 10,000 articles at once
- Increase Node memory allocation

### Scenario 3: Memory Spike, Then Drops

Memory jumps to 500MB, then drops back to 300MB over 1 minute = **garbage collection**

**Diagnosis:**
```bash
# This is normal behavior, not a leak

# Confirm with GC logs
docker logs ctrl-alt-news | grep -i "gc\|garbage"

# If you see GC logs: this is expected
```

**Most likely cause:**
- Application processing large dataset (batch job)
- Loading lots of data into memory temporarily
- Normal GC behavior

**Fix:**
- No fix needed if it returns to normal
- Increase Node memory if spikes too high
- Consider processing data in chunks instead of all at once

## Detailed Investigation (Minutes 10-20)

### Generate Heap Dump

```bash
# When memory is high, generate dump
docker exec ctrl-alt-news kill -USR2 1
# Or use inspector:
docker exec ctrl-alt-news node --inspect=0.0.0.0:9229 index.js

# Connect with Chrome DevTools
# open chrome://inspect
```

### Analyze the Heap Dump

1. In Chrome DevTools, go to Memory tab
2. Load the heap dump file
3. Look for objects that shouldn't be there:
   - Large arrays that keep growing
   - Many instances of same class
   - Circular references

### Common Memory Leak Patterns

**Pattern 1: Event Listener Not Removed**
```javascript
// BAD: Listener never removed
element.addEventListener('click', handler);
// Element gets replaced but listener stays in memory

// GOOD: Remove listener
element.removeEventListener('click', handler);
```

**Pattern 2: Timer Not Cleared**
```javascript
// BAD: Interval never cleared
setInterval(() => {
  cache.set(key, value);
}, 1000);
// Cache keeps growing, interval never stops

// GOOD: Clear on shutdown
const interval = setInterval(() => {
  cache.set(key, value);
}, 1000);
process.on('SIGTERM', () => clearInterval(interval));
```

**Pattern 3: Cache Without TTL**
```javascript
// BAD: Cache unbounded
const cache = {};
cache[key] = expensiveData;
// If 1000 unique keys arrive, cache grows to 1000 items

// GOOD: Cache with TTL
const cache = new Map();
cache.set(key, expensiveData);
setTimeout(() => cache.delete(key), 3600000); // 1 hour TTL
```

**Pattern 4: Circular References**
```javascript
// BAD: Circular reference prevents GC
const parent = { name: 'parent' };
const child = { name: 'child', parent: parent };
parent.child = child; // Now parent and child reference each other
// When parent is "deleted", both stay in memory

// GOOD: Use weak references (advanced)
// Or break cycle on cleanup
```

## Fix Strategies

### For Unbounded Cache

```javascript
// Add size limit
const cache = new (require('lru-cache'))({
  max: 500,           // Max 500 items
  maxAge: 3600000     // 1 hour TTL
});
```

### For Event Listeners

```javascript
// Always remove listeners
function setup() {
  element.addEventListener('click', handler);
}

function teardown() {
  element.removeEventListener('click', handler);
}
```

### For Intervals/Timers

```javascript
// Store reference and clear on shutdown
let interval;

function start() {
  interval = setInterval(() => { /* work */ }, 1000);
}

process.on('SIGTERM', () => {
  clearInterval(interval);
  process.exit(0);
});
```

### For Global Variables

```javascript
// BAD: Global accumulates data
let globalCache = [];
function addToGlobal(data) {
  globalCache.push(data); // Keeps growing
}

// GOOD: Use scoped cache with limits
function addToCache(cache, data) {
  cache.push(data);
  if (cache.length > 100) {
    cache.shift(); // Remove oldest
  }
}
```

## Resolution Checklist

- [ ] Confirmed leak exists (memory grew after restart)
- [ ] Identified root cause (unbounded cache, listener, timer, etc.)
- [ ] Implemented fix (add TTL, remove listener, etc.)
- [ ] Tested fix (memory stable after fix for 30 min)
- [ ] Verified alert cleared
- [ ] Deployed to production
- [ ] Monitored for 24 hours (no regression)
- [ ] Incident documented in #incidents

## When to Escalate

Escalate to L2 if:
- Heap dump analysis is unclear
- Can't find where leak is coming from
- Need to do major refactoring
- After 20 minutes without progress

## Prevention for Future

1. **Add memory tests** - Alert if memory grows >100MB in test
2. **Code review checklist** - Check for event listeners, timers
3. **Profiling in CI** - Run profiler on build to catch leaks early
4. **Resource limits** - Set max memory, container will restart if exceeded
5. **Caching strategy** - All caches must have TTL and size limits
