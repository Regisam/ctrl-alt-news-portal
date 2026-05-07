# Story 12.6: Implementation Plan (Preflight)

**Date:** 2026-05-06  
**Story:** 12.6 (Personalized Feed Real-Time Updates)  
**Effort:** M (16 hours)  
**Complexity:** COMPLEX  
**Status:** Planning Phase

---

## Architecture Overview

### Real-Time Feed Architecture

```
┌─────────────────────────────────────────────────────┐
│ CLIENT (React)                                      │
├─────────────────────────────────────────────────────┤
│ useLivePersonalizedFeed()                           │
│  ├─ Maintains: feed[], pendingUpdates[]             │
│  ├─ Handles: SSE connection, reconnection           │
│  └─ Batches: Updates every 500ms                    │
│                                                      │
│ Cleanup: Unsubscribe invisible articles             │
│ Memory: <2MB delta per user                         │
└─────────────────────────────────────────────────────┘
         ↓ SSE (Server-Sent Events)
         ↓ Delta Messages (JSON)
┌─────────────────────────────────────────────────────┐
│ SERVER (Express.js + Node.js)                       │
├─────────────────────────────────────────────────────┤
│ GET /api/feed/stream?userId={id}                    │
│  ├─ FeedStreamService: SSE connection management    │
│  ├─ Delta Encoder: Article changes only             │
│  ├─ Message Queue: Batch updates every 500ms        │
│  └─ Health: Heartbeat ping-pong every 30s           │
│                                                      │
│ RankingService.rankDelta():                         │
│  ├─ Incremental re-ranking (affected articles)      │
│  ├─ Hybrid scoring (rules + ML)                     │
│  └─ Performance: <200ms for 1000+ articles          │
└─────────────────────────────────────────────────────┘
```

### Delta Encoding Schema

```typescript
// Delta Message Format (only changed fields)
{
  type: "feed_update",
  messageId: 1,
  timestamp: 1714982400000,
  delta: {
    added: [
      { 
        id: "article-999",
        title: "New AI Breakthrough",
        category: "AI",
        rankScore: 0.92,
        position: 0
      }
    ],
    removed: ["article-500"],  // Just IDs
    reordered: [
      { id: "article-123", position: 2 },
      { id: "article-456", position: 3 }
    ],
    updated: [
      { id: "article-789", rankScore: 0.85 }  // Changed fields only
    ]
  }
}
```

### State Management (Client)

```typescript
interface LiveFeedState {
  feed: Article[];
  pendingUpdates: DeltaUpdate[];
  lastReceivedMessageId: number;
  isConnected: boolean;
  isReconciling: boolean;
  visibleRange: { start: number; end: number };
  subscriptions: Set<string>; // Active article IDs
}
```

---

## Implementation Sequence

### Phase 1: Core Server Infrastructure (4 hours)

**Task 1.1: Design Delta Encoding Schema** (30 min)
- Define DeltaUpdate interface
- Implement Delta encoder/decoder
- Add message ID tracking
- Test: Unit tests for delta encoding

**Task 1.2: Implement SSE Endpoint** (1.5 hours)
- Create `FeedStreamService` (SSE connection manager)
- Implement `/api/feed/stream?userId={id}` endpoint
- Add heartbeat ping-pong (30s interval)
- Add reconnection queue (message IDs for resend)
- Test: SSE connection stability

**Task 1.3: Implement Message Batching** (1 hour)
- Message queue with 500ms batching
- Deduplication of updates (same article in queue)
- Priority ordering (add > remove > reorder)
- Test: Batching correctness

**Task 1.4: Add Reconnection Logic** (1 hour)
- Exponential backoff (100ms, 200ms, 400ms, max 10s)
- Message resend for missed messages
- Client state reconciliation on connect
- Test: Offline/reconnect scenarios

---

### Phase 2: Ranking Optimization (3 hours)

**Task 2.1: Implement rankDelta()** (2 hours)
- Extend RankingService with incremental re-ranking
- Only recalculate affected articles (new + changed preferences)
- Keep existing scores for unchanged articles
- Performance benchmark: <200ms for 1000+ articles
- Test: Re-ranking accuracy with deltas

**Task 2.2: Implement Feed Reconciliation** (1 hour)
- Detect inconsistencies (client vs server)
- Fetch missing articles after disconnect
- Apply pending updates in correct order
- Test: Offline/reconnect data consistency

---

### Phase 3: React Client Hook (4 hours)

**Task 3.1: Build useLivePersonalizedFeed() Hook** (2.5 hours)
- SSE connection management
- Delta message parsing
- Feed array updates
- Pending updates batching (500ms)
- Cleanup on unmount
- Test: Hook lifecycle and updates

**Task 3.2: Implement Viewport Cleanup** (1 hour)
- Track visible articles (IntersectionObserver)
- Unsubscribe from invisible articles
- Memory monitoring (<2MB delta)
- Test: Memory usage under scroll

**Task 3.3: Integrate with PersonalizedFeed Component** (0.5 hours)
- Use hook in /feed page
- Display live updates
- Handle loading/error states
- Test: UI integration

---

### Phase 4: Testing & Performance (5 hours)

**Task 4.1: Unit Tests** (1.5 hours)
- Delta encoding/decoding
- rankDelta() correctness
- Message batching
- Reconnection logic
- Coverage: 80%+

**Task 4.2: Integration Tests** (1.5 hours)
- SSE endpoint communication
- Full update flow (client → server → client)
- Offline/reconnect scenarios
- Multi-user concurrent updates

**Task 4.3: Load Testing** (1.5 hours)
- 100+ concurrent users
- Measure: Latency (p50, p95, p99), message loss, memory
- Profile: CPU, heap, connection count
- Target: <2s latency, <5% message loss, <2MB/user

**Task 4.4: Performance Profiling** (0.5 hours)
- Memory leak detection (1+ hour profiling)
- Latency breakdown (encode, batch, send, decode, render)
- Optimization opportunities

---

## Critical Checkpoints (Risk Mitigation)

### Checkpoint 1: Delta Encoding Correctness (After Task 1.1)
- **Risk:** Incorrect delta → data inconsistency
- **Check:** Unit tests 100% pass
- **Action:** Manual review of edge cases (empty arrays, null values)

### Checkpoint 2: SSE Stability (After Task 1.2)
- **Risk:** Connection leaks → memory problems (AC7)
- **Check:** Resource cleanup verified, no hanging connections
- **Action:** Profiling for cleanup issues

### Checkpoint 3: Re-Ranking Performance (After Task 2.1)
- **Risk:** rankDelta() >200ms → user feels lag
- **Check:** Benchmark confirms <200ms for 1000+ articles
- **Action:** Optimize if needed (caching, parallelization)

### Checkpoint 4: Memory Stability (After Task 3.2)
- **Risk:** Viewport cleanup fails → memory leak
- **Check:** Memory profiling shows stable heap
- **Action:** Fix cleanup if heap grows over 1 hour test

### Checkpoint 5: Load Test Pass (After Task 4.3)
- **Risk:** Production fails under load
- **Check:** 100+ users, <2s latency, <5% loss
- **Action:** Bottleneck analysis and optimization

---

## Test Strategy

### Unit Tests (RankingService, Delta, Batching)
```
- Delta encoding: add/remove/reorder/update
- rankDelta(): correctness with various inputs
- Message batching: dedup, ordering, timing
- Reconnection: exponential backoff, resend queue
Coverage: 80%+, all passing
```

### Integration Tests (Full Flow)
```
- SSE endpoint: connection, message send, disconnect
- Client hook: receive, update, render
- Offline: disconnect, queue messages, reconnect
- Multi-user: concurrent updates from 5 users
All scenarios passing
```

### Load Tests (100+ Users)
```
- Setup: 100+ concurrent SSE connections
- Load: Send updates every 5-30s per user
- Measure: 
  - Latency (p50, p95, p99)
  - Message loss rate
  - Memory per user
  - CPU usage
- Target:
  - Latency p95 <2000ms
  - Message loss <5%
  - Memory <2MB/user
  - CPU <50% under load
```

### Performance Profiling
```
- Heap snapshot: Start, after 30 min, after 1 hour
- Memory growth rate: Should be flat
- CPU flame graph: Identify hot spots
- Network: Message size, compression ratio
```

---

## Error Handling & Edge Cases

### Network Failures
- Connection drops → Auto-reconnect with backoff
- Message loss → Server tracks messageId, client requests missing
- Offline → Queue updates locally, sync on reconnect

### Data Consistency
- Client/server divergence → Reconcile on reconnect
- Reordered messages → Apply in messageId order
- Duplicate updates → Deduplicate in queue

### Resource Leaks
- SSE connections → Clean up on disconnect
- Event listeners → Remove in cleanup
- Timers → Clear batching timers
- Memory → Monitor heap, unsubscribe invisible

### Browser Issues
- Silent disconnect → Heartbeat detects, reconnects
- Tab switch → Connection survives (SSE persistent)
- Window close → Cleanup on unload

---

## Implementation Order

**1. Start: Task 1.1 (Delta Encoding)** ← Blueprint
2. Task 1.2 (SSE Endpoint) ← Infrastructure
3. Task 1.3 (Message Batching) ← Optimization
4. Task 1.4 (Reconnection) ← Resilience
5. Task 2.1 (rankDelta) ← Scoring
6. Task 2.2 (Reconciliation) ← Consistency
7. Task 3.1 (React Hook) ← Client
8. Task 3.2 (Cleanup) ← Memory safety
9. Task 3.3 (Integration) ← UI
10. Task 4.1-4.4 (Tests + Performance) ← Validation

---

## File Structure

### New Files
```
server/services/FeedStreamService.ts (250 lines)
  ├─ SSE connection management
  ├─ Message batching (500ms)
  ├─ Heartbeat + reconnection
  └─ Delta encoding

server/api/feed-stream.ts (200 lines)
  ├─ GET /api/feed/stream endpoint
  ├─ User context extraction
  └─ Response headers (SSE)

client/src/hooks/useLivePersonalizedFeed.ts (300 lines)
  ├─ SSE connection + reconnection
  ├─ Delta message handling
  ├─ Feed state management
  ├─ Viewport cleanup
  └─ Memory monitoring

server/__tests__/services/FeedStreamService.test.ts (400 lines)
  ├─ Delta encoding tests
  ├─ Message batching tests
  ├─ Reconnection logic tests
  └─ 80%+ coverage

server/__tests__/api/feed-stream.test.ts (350 lines)
  ├─ SSE endpoint tests
  ├─ Integration tests
  └─ Full flow scenarios

server/__tests__/load/feed-stream-load.test.ts (300 lines)
  ├─ 100+ concurrent users
  ├─ Latency measurements
  ├─ Memory profiling
  └─ Performance validation
```

### Modified Files
```
server/services/RankingService.ts
  ├─ Add rankDelta() method
  └─ Incremental re-ranking logic

server/index.ts
  ├─ Register GET /api/feed/stream
  └─ Error handling

client/src/pages/PersonalizedFeed.tsx
  ├─ Use useLivePersonalizedFeed() hook
  └─ Live update UI
```

---

## Success Criteria

✅ **All AC Met:**
- AC1-AC14 all implemented and tested
- <500ms latency for article insertion
- <200ms re-ranking for 1000+ articles
- <2MB memory per user (stable)
- 100+ concurrent users supported

✅ **Quality:**
- 80%+ test coverage
- Zero TypeScript errors
- All tests passing
- CodeRabbit CRITICAL: 0

✅ **Performance:**
- Latency p95 <2000ms
- Message loss <5%
- Memory stable (1+ hour test)
- CPU <50% under load

---

## Next Steps

1. ✅ Review this plan
2. → Execute Task 1.1 (Delta Encoding)
3. → Continue through Task List
4. → Run checkpoints
5. → Validate with tests
6. → Mark Story "Ready for Review"

---

*Plan created: 2026-05-06*  
*Status: Ready for Implementation*
