# EPIC-4: Comment Threading & Real-time Features

**Epic ID:** EPIC-4  
**Title:** Comment Threading & Real-time Features  
**Status:** Draft  
**Sprint:** 4  
**Created:** 2026-04-19  
**Owner:** @pm (Morgan)  
**Priority:** HIGH (Core engagement feature)

---

## Executive Summary

Enable nested comment conversations and real-time updates to drive user engagement and community interaction. Implement comment threading with reply depth control, real-time notifications via WebSockets, and live comment updates without page refresh.

**Business Value:**
- **Engagement:** Thread replies increase comment depth by 3-5x
- **Retention:** Real-time features improve session duration
- **Community:** Nested conversations encourage meaningful discussions

**Target Users:** Article readers wanting threaded discussions, community moderators managing conversations

---

## Strategic Goals

1. **Threading Depth:** Support up to 3 reply levels (reply → reply-to-reply → reply-to-reply-to-reply)
2. **Real-time Updates:** Live comment stream via WebSocket with <500ms latency
3. **Notification System:** Real-time alerts for replies, mentions, karma changes
4. **User Experience:** Seamless threading UI with collapse/expand controls
5. **Moderation:** Thread-aware moderation (delete parent → soft-delete children)

---

## High-Level Feature Set

### 4.1 — Comment Replies & Threading
- Comment → Reply structure (parent_id field)
- GET /api/articles/:id/comments (hierarchical response)
- POST /api/comments/:id/reply (create reply)
- Depth limiting (max 3 levels)
- Collapse/expand thread UI

### 4.2 — Real-time Comment Updates
- WebSocket connection: ws://api/comments/live
- Real-time comment stream for current article
- Live karma updates (upvotes, downvotes)
- Optimistic UI updates with server validation
- Connection recovery & retry logic

### 4.3 — Notification System
- Real-time alerts for replies to user's comments
- Mention notifications (@username)
- Karma milestone notifications (10, 50, 100 badges)
- Push notifications (Phase 2)
- Notification center (bell icon + dropdown)

### 4.4 — Reply Counter & Analytics
- Comment reply count tracking
- Thread popularity metrics
- "Popular discussions" ranking
- API: GET /api/comments/trending

### 4.5 — Thread Management UI
- Reply button on each comment
- Inline reply form (not page navigation)
- Parent comment context in replies
- Thread collapse/expand controls
- "View thread" modal for deep nesting

---

## Acceptance Criteria (Epic-level)

### Threading
- [x] Comment.parent_id foreign key implemented
- [x] GET /api/articles/:id/comments returns hierarchical tree
- [x] POST /api/comments/:id/reply endpoint
- [x] Depth validation (max 3 levels)
- [x] Client UI: reply button, inline form, collapse/expand
- [x] Edit/delete preserves thread structure (soft-delete)

### Real-time
- [x] WebSocket server: ws://api/comments/live
- [x] Optimistic UI (show immediately, validate server)
- [x] Live karma updates (upvote/downvote sync)
- [x] Connection recovery (auto-reconnect on disconnect)
- [x] Client: Socket.io or native WebSocket integration
- [x] Latency < 500ms for typical updates

### Notifications
- [x] Notification model (userId, type, content, read)
- [x] Real-time notification stream via WebSocket
- [x] Notification center UI (bell icon)
- [x] Mark as read / clear all
- [x] Notification types: reply, mention, karma_milestone

### Analytics
- [x] Reply count aggregation per comment
- [x] Popular threads ranking API
- [x] Thread depth analysis

---

## Stories (Breakdown)

| Story | Title | Effort | Owner |
|-------|-------|--------|-------|
| 4.1 | Comment Replies & Threading | L (20h) | @dev |
| 4.2 | Real-time Comment Updates (WebSocket) | L (24h) | @dev |
| 4.3 | User Notification System | M (16h) | @dev |
| 4.4 | Reply Counter & Analytics | S (8h) | @dev |
| 4.5 | Thread Management UI (Client) | M (12h) | @dev |

**Total Effort:** ~80 hours (10 days @ 8h/day)

---

## Technical Decisions

### Database
- **Comment.parent_id:** Foreign key to self (nullable)
- **Notification:** New table (userId, type, read, createdAt)
- **Indexes:** parent_id, (parent_id + createdAt) for ordering

### Backend
- **WebSocket:** Socket.io (auto-fallback, room-based subscriptions)
- **Real-time Sync:** Redis pub/sub for multi-server deployments
- **Optimistic UI:** Server echoes client timestamp → client matches response

### Frontend
- **Threading:** React tree component (recursive Comment component)
- **WebSocket:** Socket.io client library
- **State:** Zustand for real-time comment state + notifications

### Security
- **RBAC:** Users can only reply if not suspended
- **Rate Limiting:** 5 comments/min per user (prevent spam)
- **XSS Protection:** Sanitize reply text (DOMPurify)
- **WebSocket Auth:** JWT token in ws handshake

---

## Dependencies

### Blocks
- Epic 5 (Analytics Dashboard) — depends on comment stats
- Epic 6 (Email Digests) — depends on notification data

### Blocked By
- Epic 3 (Auth & Moderation) ✅ Complete
- Prisma schema migration (parent_id field)

---

## Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| Thread Engagement | 3-5x reply rate | @analyst |
| Real-time Latency | <500ms | @architect |
| Notification Delivery | 99% within 1s | @qa |
| Moderation Accuracy | 98% correct thread handling | @qa |

---

## Phase 1 Scope (MVP)

✅ **Included:**
- 3-level comment threading
- WebSocket live updates
- Notification center + real-time alerts
- Reply counter & trending API

⏳ **Phase 2+:**
- Push notifications (Expo)
- Email digests of missed comments
- Thread subscription (watch thread)
- Advanced filtering (my comments, my replies)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WebSocket connection instability | Medium | High | Implement retry logic, heartbeat, fallback to polling |
| N+1 query on nested comments | Medium | High | Eager loading, caching layer (Redis) |
| Real-time notification spam | Low | Medium | Rate limiting, notification grouping |
| Schema migration on production | Low | High | Zero-downtime migration (backward-compatible schema) |

---

## Handoff to @sm

**Next Step:** @sm creates stories 4.1-4.5 with detailed acceptance criteria.

**Inputs for @sm:**
- This epic (EPIC-4.md)
- Sprint 3 stories as reference (3.1-3.10)
- Architecture: Prisma schema, Socket.io setup
- Existing codebase patterns

---

## Change Log

- 2026-04-19: Epic created (Draft status)
- 2026-04-19: 5 stories defined, effort estimated

---

## Notes

- WebSocket setup pairs with existing auth (JWT in handshake)
- Notification system reuses User + Karma from Sprint 3
- Real-time sync leverages existing code quality (TypeScript, validation)
- Thread depth limiting prevents UI performance issues
- Moderation aware of threading (soft-delete children)

— Morgan, planejando o futuro 📊
