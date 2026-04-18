# EPIC 4: Comments & User Engagement System

**Epic ID**: EPIC-4  
**Status**: Draft  
**Sprints**: 4-5 (70 hours)  
**Priority**: P0 (Must-Have)  
**Product Manager**: Morgan  
**Technical Lead**: Aria (Architect)  
**Date Created**: 2026-04-16

---

## Epic Summary

Implement discussion system with threaded comments, moderation tools, and email notifications. Users can comment on articles, reply to comments, and receive notifications. Admins moderate and manage spam.

**Rationale**: Core engagement feature. Converts passive readers into active community participants (PRD section 2.2 - Engagement).

**Success Criteria**:
- [ ] Comments fully persisted and queryable
- [ ] Comment threading (replies to comments) working
- [ ] Comment moderation queue implemented
- [ ] Email notifications on new comments sent
- [ ] Comment spam filtering basic rules
- [ ] 10+ engagement endpoints tested
- [ ] No unmoderated spam visible publicly

---

## Story 4.1: Comments API (Create, Read, Delete)

**Status**: Ready  
**Sprint**: 4  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement core comment CRUD operations. Users can post comments on articles, read all comments, and delete their own comments. Comments require authentication.

**Reference**: PRD section 2.2 (Comments), UX/UI Analysis section 3.4 (Comments section)

### Acceptance Criteria

- [ ] `GET /articles/:id/comments` returns all comments for article (paginated)
- [ ] Comment format: id, author, content, createdAt, score, replyCount
- [ ] `POST /articles/:id/comments` creates new comment (requires auth)
- [ ] `DELETE /comments/:id` deletes comment (author or admin only)
- [ ] `PUT /comments/:id` edits comment (author or admin, with edited flag)
- [ ] Comments sorted by creation time (newest first, configurable)
- [ ] Comment threads visible (parentId field)
- [ ] User cannot post empty comments
- [ ] Max comment length: 5000 characters
- [ ] Comment marked as "(edited)" if updated after creation

### Tasks

1. Create comments controller (`routes/comments.ts`)
2. Implement GET `/articles/:id/comments` with pagination
3. Implement POST `/articles/:id/comments`
4. Implement PUT `/comments/:id` for editing
5. Implement DELETE `/comments/:id`
6. Add Zod validation for comment content
7. Test comment creation, editing, deletion
8. Add rate limiting on comment creation (max 5/minute per user)
9. Update article view count (comments listed)
10. Test pagination with 100+ comments

### Dependencies

- **Blocked by**: Story 3.1 (articles CRUD ready)
- **Blocks**: Stories 4.2, 4.3, 4.4

### Notes

- Comments require authentication (userId required)
- Soft deletes: mark as deleted, preserve for history
- Allow editing within 5 minutes (configurable)
- Rate limiting: prevent spam (5 comments/minute per user)
- Store comment IP for moderation (optional)

---

## Story 4.2: Comment Threading & Nested Replies

**Status**: Ready  
**Sprint**: 4  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Extend comments to support threading—replies to other comments forming conversation threads. Build nested structure with proper nesting limits.

**Reference**: PRD section 2.2 (Comments - threading), UX/UI Analysis section 4.2

### Acceptance Criteria

- [ ] `POST /comments/:id/reply` creates reply to comment
- [ ] Replies linked via parentId field
- [ ] Thread depth limited to 3 levels (to prevent excessive nesting)
- [ ] `GET /articles/:id/comments/threads` returns tree structure
- [ ] Each thread shows: top-level comment + replies collapsed
- [ ] Reply preview in comment card: "X replies to this comment"
- [ ] Thread expansion: `GET /comments/:id/replies` returns child comments
- [ ] Comment with replies cannot be hard-deleted (soft delete enforced)
- [ ] Replies inherit article context (article_id)
- [ ] Notification sent to parent comment author when replied

### Tasks

1. Add parentId to comment model (self-referential FK)
2. Create reply endpoint: `POST /comments/:id/reply`
3. Implement thread structure (recursive query, tree building)
4. Create flat vs. threaded comment views
5. Implement reply notification (story 4.4)
6. Add nesting depth check (max 3)
7. Test thread structure with nested replies
8. Create thread view with expansion
9. Add reply count to comments
10. Test performance with deeply nested threads

### Dependencies

- **Blocked by**: Story 4.1 (comments CRUD ready)
- **Blocks**: Story 4.3, 4.4

### Notes

- Nesting limit: prevent UI complexity (3 levels recommended)
- Thread queries: use PostgreSQL recursive CTEs or N+1 queries
- Cache thread structure (comments don't change frequently)
- Reply notifications: notify parent comment author (story 4.4)

---

## Story 4.3: Comment Moderation & Admin Tools

**Status**: Ready  
**Sprint**: 5  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement moderation queue for comments pending review, admin tools to approve/reject/delete, and basic spam detection rules.

**Reference**: PRD section 2.2 (Moderation), UX/UI Analysis section 5.2

### Acceptance Criteria

- [ ] Comments require approval before visibility (status: PENDING, APPROVED, REJECTED)
- [ ] `GET /admin/comments/pending` returns unapproved comments
- [ ] `PUT /admin/comments/:id/approve` approves comment (admin only)
- [ ] `PUT /admin/comments/:id/reject` rejects comment with reason (admin only)
- [ ] Rejected comments soft-deleted (visible to author, not public)
- [ ] Comment flags: spam, inappropriate, duplicate (reasons)
- [ ] Users can flag comments: `POST /comments/:id/flag`
- [ ] Admin moderation dashboard shows flagged comments
- [ ] Auto-spam detection: keywords, excessive links
- [ ] Moderation audit log (who, what, when)

### Tasks

1. Add status field to comment model (PENDING, APPROVED, REJECTED)
2. Create moderation endpoints (`routes/admin/comments.ts`)
3. Implement approval endpoint
4. Implement rejection endpoint with reason
5. Create spam detection rules (keywords, links)
6. Implement user flagging (`POST /comments/:id/flag`)
7. Create moderation dashboard endpoint
8. Add audit logging for moderation actions
9. Create notification for rejected comments
10. Test moderation workflow: flag → review → approve/reject

### Dependencies

- **Blocked by**: Story 4.2 (threading ready)
- **Blocks**: Story 4.4

### Notes

- Moderation status default: PENDING (requires approval)
- Spam keywords: maintain list in `.env` or database
- Auto-rejection: too many links (>3) or blacklisted keywords
- Moderation reason: required for rejections
- Audit trail: immutable log of all moderation actions
- Consider ML-based spam detection (Phase 2)

---

## Story 4.4: Email Notifications on Comment Activity

**Status**: Ready  
**Sprint**: 5  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Send email notifications when users receive replies, their articles are commented on, or comments require moderation attention.

**Reference**: PRD section 2.6 (Email notifications), Technical Strategy section 3.3

### Acceptance Criteria

- [ ] Email sent when comment posted on user's article
- [ ] Email sent when user receives reply to their comment
- [ ] Email contains comment text, author, and link to article
- [ ] User can unsubscribe from notifications (per-email preference)
- [ ] Admin receives digest of pending comments (daily)
- [ ] Email templates styled (HTML) with dark mode support
- [ ] Unsubscribe link in email footer
- [ ] No emails sent if user opted out
- [ ] Email delivery tracked (success/failure logged)
- [ ] Retry logic for failed sends (3 attempts, exponential backoff)

### Tasks

1. Choose email service (SendGrid, AWS SES, or Resend)
2. Create email service (`services/emailService.ts`)
3. Create email templates (HTML, handlebars or similar)
4. Implement notification on comment creation
5. Implement notification on reply
6. Implement admin digest (daily pending comments)
7. Add unsubscribe link and preference handling
8. Create notification preferences endpoint: `PUT /users/me/notification-prefs`
9. Test email delivery (sandbox)
10. Setup retry queue for failed emails

### Dependencies

- **Blocked by**: Story 4.3 (moderation ready)
- **Blocks**: None (complete)

### Notes

- Email service: recommend Resend (modern, good DX)
- Templates: HTML with inline styles (email client compatibility)
- Unsubscribe: list-unsubscribe header (RFC 8058)
- Rate limiting: max 1 email per comment per user per hour
- Digest email: daily summary (admin only, for now)
- Consider push notifications (Phase 2)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Comments persisted | 100% of comments saved | To verify |
| Moderation coverage | All comments reviewable | To verify |
| Email delivery | 99% success rate | To measure |
| Spam filtered | 95% of spam caught | To measure |

---

## Epic Dependencies & Timeline

```
Sprint 4:
├── Story 4.1 (CRUD) ───┐
│                       ├──> Story 4.2 (Threading)
└─────────────────────┘
                        └──> Story 4.3 (Moderation)

Sprint 5:
├── Story 4.3 complete
└──> Story 4.4 (Email Notifications)
     └──> Complete
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Email service costs | Budget concern | Start with free tier (SendGrid, SES) |
| Spam accuracy low | Moderation burden | Manual review + ML (Phase 2) |
| Email deliverability | Emails in spam | SPF, DKIM, DMARC setup |

---

## Appendix: Files to Create/Modify

**New Files**:
- `server/routes/comments.ts`
- `server/routes/admin/comments.ts`
- `server/services/emailService.ts`
- `server/services/notificationService.ts`
- `server/lib/spam-detector.ts`
- `server/templates/emails/new-comment.html`
- `server/templates/emails/reply-to-comment.html`
- `server/templates/emails/pending-comments-digest.html`
- `types/comment.ts`

**Modified Files**:
- `prisma/schema.prisma` (Comment model updates)
- `server/index.ts` (route registration)
- `package.json` (email service dependency)

**New Dependencies**:
```json
{
  "resend": "^3.x",
  "handlebars": "^4.x",
  "uuid": "^9.x"
}
```

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Aria (Architect)
