# EPIC 5: Admin Dashboard & Analytics

**Epic ID**: EPIC-5  
**Status**: Draft  
**Sprints**: 5-6 (60 hours)  
**Priority**: P1 (High)  
**Product Manager**: Morgan  
**Technical Lead**: Aria (Architect)  
**Date Created**: 2026-04-16

---

## Epic Summary

Build admin dashboard for content managers and administrators. Features include article management, user management, analytics, and system monitoring. Provides visibility into platform health and user engagement.

**Rationale**: Essential for business operations—editors need tools to manage content, admins need insight into platform performance (PRD section 2.7 - Admin/Editor).

**Success Criteria**:
- [ ] Admin authentication working
- [ ] Article management interface with CRUD
- [ ] User management interface with role controls
- [ ] Basic analytics: views, comments, engagement
- [ ] System health dashboard
- [ ] All admin operations logged
- [ ] Dashboard accessible only to admins/editors

---

## Story 5.1: Admin Authentication & Role System

**Status**: Ready  
**Sprint**: 5  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Establish admin-only access control for dashboard. Only ADMIN and EDITOR roles can access restricted areas. Implement permission checks and admin-only endpoints.

**Reference**: Story 2.1-2.2 (Authentication & data models), PRD section 2.7 (Admin system)

### Acceptance Criteria

- [ ] `/admin/*` routes require ADMIN or EDITOR role
- [ ] Non-admin users redirected to login
- [ ] Admin login endpoint: `POST /admin/login` (optional, separate from user auth)
- [ ] Session tracking for admins (separate from user sessions)
- [ ] Admin dashboard accessible only with valid JWT + admin role
- [ ] Permission hierarchy: ADMIN > EDITOR > USER
- [ ] Admins can impersonate users (optional, Phase 2)
- [ ] Admin actions logged with timestamp and actor
- [ ] Rate limiting on admin endpoints (slower than user endpoints)
- [ ] 2FA support for admins (optional, Phase 2)

### Tasks

1. Create admin middleware (`middleware/adminAuth.ts`)
2. Create admin routes base (`routes/admin/index.ts`)
3. Implement role checks for all admin routes
4. Create admin login endpoint (optional)
5. Implement session management for admins
6. Add admin activity logging
7. Test permission enforcement
8. Create admin user seeding (during database setup)
9. Implement rate limiting on admin endpoints
10. Test privilege escalation prevention

### Dependencies

- **Blocked by**: Story 2.1 (authentication ready), Story 1.2 (database schema)
- **Blocks**: Stories 5.2, 5.3, 5.4

### Notes

- Admin role check in middleware (fail-fast)
- Consider separate admin token if needed (different lifetime)
- Log all admin actions (audit trail required)
- Rate limiting: slower than user endpoints (avoid DoS)
- Consider 2FA for production (Phase 2)

---

## Story 5.2: Article Management Dashboard

**Status**: Ready  
**Sprint**: 5-6  
**Effort**: L (32 hours)  
**Owner**: @dev (Dex)

### Description

Create admin interface for managing articles: list all (published, draft, archived), create new, edit, publish, and delete. Provides quick overview of content.

**Reference**: PRD section 2.7 (Admin - article management), UX/UI Analysis section 5.2

### Acceptance Criteria

- [ ] `GET /admin/articles` returns all articles (published, draft, archived)
- [ ] Filter articles by status: DRAFT, PUBLISHED, ARCHIVED
- [ ] Filter articles by author
- [ ] Filter articles by date range
- [ ] Sort articles by: newest, most viewed, most commented
- [ ] Batch operations: publish, archive, delete multiple articles
- [ ] Quick edit: inline title/excerpt editing
- [ ] Create article button: `/admin/articles/create`
- [ ] Article detail view with all metadata
- [ ] Bulk import articles from CSV (optional, Phase 2)

### Tasks

1. Create admin articles endpoint (`routes/admin/articles.ts`)
2. Implement article list with filters
3. Implement bulk operations (publish, archive, delete)
4. Create article creation endpoint (admin dashboard)
5. Create article edit endpoint
6. Implement filtering and sorting
7. Add pagination (50 items per page)
8. Test bulk operations (atomicity)
9. Create article detail view
10. Test performance with 1000+ articles

### Dependencies

- **Blocked by**: Story 5.1 (admin auth ready)
- **Blocks**: None

### Notes

- All admin operations logged (audit trail)
- Bulk operations: atomic (all or nothing)
- Filter combinations: status + author + date
- Quick edit: inline updates without modal
- Consider article scheduling (publish at future date)

---

## Story 5.3: User Management Dashboard

**Status**: Ready  
**Sprint**: 6  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Admin interface for user management: list users, view profiles, edit roles, and deactivate accounts. Provides user visibility for moderation.

**Reference**: PRD section 2.7 (Admin - user management), Story 2.2 (User data models), Story 5.1 (Admin Auth)

### Acceptance Criteria

- [ ] `GET /admin/users` returns paginated user list
- [ ] User list includes: email, name, role, joinDate, articleCount, commentCount
- [ ] Filter users by role: ADMIN, EDITOR, USER
- [ ] Filter users by registration date
- [ ] Search users by email or name
- [ ] `PUT /admin/users/:id/role` changes user role (ADMIN only)
- [ ] `PUT /admin/users/:id/deactivate` disables account
- [ ] `PUT /admin/users/:id/reactivate` enables deactivated account
- [ ] User detail view shows: profile, articles, comments, activity
- [ ] User activity log: login history, actions

### Tasks

1. Create admin users endpoint (`routes/admin/users.ts`)
2. Implement user list with filters
3. Implement user search
4. Create role change endpoint
5. Create account deactivation endpoint
6. Implement user detail view
7. Add user activity logging
8. Create login history view
9. Test role changes with authorization
10. Test deactivation effect on user access

### Dependencies

- **Blocked by**: Story 5.1 (admin auth ready)
- **Blocks**: None

### Notes

- Role change: ADMIN only
- Deactivation: soft delete (user record preserved)
- Activity log: track logins, comments, article creation
- User detail: comprehensive profile view
- Consider user behavior analysis (Phase 2)

---

## Story 5.4: Basic Analytics Dashboard & Metrics

**Status**: Ready  
**Sprint**: 6  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Create analytics dashboard showing platform metrics: article views, comment counts, user engagement, and traffic overview. Metrics are read-only (no data manipulation).

**Reference**: PRD section 2.8 (Analytics), Technical Strategy section 4.2

### Acceptance Criteria

- [ ] `GET /admin/analytics/overview` returns platform summary
- [ ] Total metrics: articles, users, comments, views (this month)
- [ ] Articles analytics: top 10 by views, top 10 by comments
- [ ] Users analytics: new signups (7d, 30d), active users (7d, 30d)
- [ ] Comments analytics: total, pending moderation, approved
- [ ] Traffic chart: daily views over last 30 days
- [ ] Engagement chart: comments per day over last 30 days
- [ ] Author performance: articles per author, avg views
- [ ] Category breakdown: articles and views per category
- [ ] Metrics updated daily (no real-time, acceptable latency 1h)

### Tasks

1. Create analytics service (`services/analyticsService.ts`)
2. Create analytics endpoints (`routes/admin/analytics.ts`)
3. Implement overview endpoint with key metrics
4. Implement articles analytics (top by views/comments)
5. Implement users analytics (signups, active)
6. Implement comments analytics
7. Implement traffic chart (daily views)
8. Implement engagement chart (daily comments)
9. Create category breakdown
10. Add caching for analytics (1h TTL)

### Dependencies

- **Blocked by**: Story 5.1 (admin auth ready)
- **Blocks**: None

### Notes

- Metrics use denormalization (viewCount on article, commentCount, etc.)
- Caching: 1-hour TTL for analytics (not real-time)
- Charts: use data aggregation (group by date, sum)
- Performance: use database aggregation (not app-level)
- Consider Metabase/Superset integration (Phase 2)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Admin endpoints | 15+ endpoints | To verify |
| Dashboard response | <500ms | To measure |
| User permissions | 100% enforced | To verify |
| Audit log coverage | All actions logged | To verify |

---

## Epic Dependencies & Timeline

```
Sprint 5:
├── Story 5.1 (Admin Auth) ─┬──> Story 5.2 (Articles Dashboard)
│                           ├──> Story 5.3 (Users Dashboard)
└───────────────────────────┘

Sprint 6:
├── Stories 5.2, 5.3 complete
└──> Story 5.4 (Analytics)
     └──> Complete
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Analytics performance | Slow dashboard | Denormalize metrics, cache results |
| Audit log volume | Storage bloat | Implement log retention policy |
| User role conflicts | Complex logic | Clear permission hierarchy |

---

## Appendix: Files to Create/Modify

**New Files**:
- `server/middleware/adminAuth.ts`
- `server/routes/admin/index.ts`
- `server/routes/admin/articles.ts`
- `server/routes/admin/users.ts`
- `server/routes/admin/analytics.ts`
- `server/services/analyticsService.ts`
- `server/lib/metrics.ts`
- `types/admin.ts`

**Modified Files**:
- `prisma/schema.prisma` (AuditLog model)
- `server/index.ts` (admin route registration)

**New Dependencies**:
None (use existing)

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Aria (Architect)
