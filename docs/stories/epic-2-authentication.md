# EPIC 2: User Authentication & Authorization

**Epic ID**: EPIC-2  
**Status**: Draft  
**Sprints**: 2-3 (60 hours)  
**Priority**: P0 (Must-Have)  
**Product Manager**: Morgan  
**Technical Lead**: Aria (Architect)  
**Date Created**: 2026-04-16

---

## Epic Summary

Implement secure user authentication (JWT + OAuth 2.0), authorization middleware, user profiles, and role-based access control. Users can signup/login locally or via Google, maintain persistent sessions, and access personalized features.

**Rationale**: Core requirement for user system (Epics 3-5 depend on authenticated user context). Implements PRD section 2.4 (User system).

**Success Criteria**:
- [ ] Local authentication (email/password) working
- [ ] Google OAuth 2.0 integration functional
- [ ] JWT tokens generated, validated, and refreshed
- [ ] User profiles created and managed
- [ ] Authorization middleware protects endpoints
- [ ] All auth flows tested (signup, login, logout, OAuth)
- [ ] Zero authentication-related TypeScript errors

---

## Story 2.1: JWT Implementation & Token Generation

**Status**: Ready  
**Sprint**: 2  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement JWT token generation, validation, and refresh token mechanism. Tokens are secure, expirable, and include user claims for authorization.

**Reference**: PRD section 2.4 (User authentication), Technical Strategy section 2.4

### Acceptance Criteria

- [ ] JWT tokens generated on signup/login
- [ ] Access token: 15-minute expiration
- [ ] Refresh token: 7-day expiration (stored in secure httpOnly cookie)
- [ ] Token validation middleware works on protected routes
- [ ] Refresh token endpoint: `POST /auth/refresh` generates new access token
- [ ] Tokens include user ID and role claims
- [ ] Token signature verified with HMAC-SHA256
- [ ] Logout revokes refresh token (optional: blacklist)
- [ ] All crypto operations use `crypto` module (no bcrypt yet)

### Tasks

1. Create JWT utilities (`lib/jwt.ts`): sign, verify, decode
2. Generate RS256/HS256 key pair and store in `.env`
3. Create token types in TypeScript (`types/auth.ts`)
4. Implement refresh token storage (in-memory or database)
5. Create `POST /auth/token` endpoint for testing token generation
6. Implement token validation middleware
7. Test token expiration and refresh flow
8. Add logout endpoint with token revocation

### Dependencies

- **Blocked by**: Story 1.1 (server running)
- **Blocks**: Stories 2.2, 2.3, 2.4

### Notes

- Use `jsonwebtoken` library (v9+) for signing/verifying
- Store refresh tokens in database with expiration
- Access tokens in Authorization header: `Bearer {token}`
- Refresh tokens in httpOnly cookie (secure, sameSite=strict)
- Consider key rotation strategy (Phase 2)

---

## Story 2.2: Google OAuth 2.0 Integration

**Status**: Ready  
**Sprint**: 2-3  
**Effort**: L (32 hours)  
**Owner**: @dev (Dex)

### Description

Integrate Google OAuth 2.0 allowing users to authenticate via their Google account. Handle OAuth flow, token exchange, and user creation/linking.

**Reference**: PRD section 2.4 (OAuth), Technical Strategy section 2.5 (Third-party integrations)

### Acceptance Criteria

- [ ] Google OAuth app created (Google Cloud Console)
- [ ] OAuth callback: `GET /auth/oauth/google/callback`
- [ ] User can login via Google on frontend
- [ ] New Google user creates account automatically
- [ ] Existing email linked to new Google account
- [ ] User profile populated from Google (name, avatar)
- [ ] JWT tokens returned after OAuth success
- [ ] Error handling for revoked Google tokens
- [ ] Frontend redirect after OAuth complete

### Tasks

1. Create Google Cloud OAuth app and get credentials
2. Implement OAuth routes: `/auth/oauth/google` and callback
3. Create `GoogleOAuthService` for token exchange
4. Implement user auto-creation on first Google login
5. Store googleId in user record for linking
6. Create frontend OAuth redirect button
7. Handle OAuth errors gracefully (consent denied, etc.)
8. Test OAuth flow end-to-end

### Dependencies

- **Blocked by**: Story 2.1 (JWT working)
- **Blocks**: Story 2.3

### Notes

- Use `googleapis` or `google-auth-library` (v8+)
- Google OAuth requires frontend redirect to Google consent screen
- Handle user linking: existing email → new OAuth
- Store googleId securely (don't expose in API responses)
- PKCE flow for security (if using auth code flow)

---

## Story 2.3: User Profiles & Settings Management

**Status**: Ready  
**Sprint**: 3  
**Effort**: M (16 hours)  
**Owner**: @dev (Dex)

### Description

Implement user profile endpoints and settings management. Users can view/edit their profile, preferences, and account settings.

**Reference**: PRD section 2.4 (User system), UX/UI Analysis section 3.2

### Acceptance Criteria

- [ ] `GET /users/me` returns authenticated user profile
- [ ] `PUT /users/me` updates profile (name, bio, avatar)
- [ ] `PUT /users/me/preferences` updates user preferences
- [ ] `POST /users/me/password` changes password (with old password verify)
- [ ] `POST /users/me/avatar` uploads avatar image
- [ ] `GET /users/:id` returns public user profile (read-only)
- [ ] User profile includes: name, bio, avatar, joined date, article count
- [ ] Email change requires verification link (optional, Phase 2)
- [ ] All profile updates validated with Zod

### Tasks

1. Create profile endpoints in `routes/users.ts`
2. Implement user profile update logic
3. Add password hashing for local accounts (bcrypt)
4. Create settings preferences model (Prisma)
5. Implement avatar upload handling (file storage)
6. Add Zod validation for profile updates
7. Test profile update flows
8. Implement public profile view (limited data)

### Dependencies

- **Blocked by**: Story 2.2 (OAuth integrated)
- **Blocks**: Story 2.4, 5.1

### Notes

- Use `bcryptjs` for password hashing
- Avatar upload: store in `/public/avatars/` or cloud storage (Phase 2)
- Password change requires old password verification
- Don't expose password hash in API responses
- Rate limit password change endpoint (max 3x per day)

---

## Story 2.4: Authorization Middleware & Role-Based Access Control

**Status**: Ready  
**Sprint**: 3  
**Effort**: S (8 hours)  
**Owner**: @dev (Dex)

### Description

Implement authorization middleware protecting endpoints by user role (ADMIN, EDITOR, USER). Controllers check permissions before executing actions.

**Reference**: PRD section 2.4 (Authorization), Epics 3-5 (requires role checks)

### Acceptance Criteria

- [ ] `authMiddleware` validates JWT token
- [ ] `roleMiddleware` checks user role (ADMIN, EDITOR, USER)
- [ ] Admin-only endpoints protected: POST/PUT/DELETE articles
- [ ] Editor endpoints allow article management
- [ ] Public endpoints accessible without auth
- [ ] 401 (Unauthorized) returned for missing/invalid tokens
- [ ] 403 (Forbidden) returned for insufficient permissions
- [ ] Authorization logic in middleware (not repeated in controllers)
- [ ] Super admin can impersonate users (optional, Phase 2)

### Tasks

1. Create `authMiddleware` in `middleware/auth.ts`
2. Create `roleMiddleware` factory for flexible role checks
3. Protect admin routes: articles CRUD, user management
4. Protect editor routes: article creation, editing
5. Define role constants (`ROLES.ADMIN`, `ROLES.EDITOR`, `ROLES.USER`)
6. Test authorization on protected endpoints
7. Document role hierarchy and permissions
8. Add rate limiting on auth failures

### Dependencies

- **Blocked by**: Story 2.3 (user profiles ready)
- **Blocks**: Stories 3.1, 4.1, 5.1, 5.2

### Notes

- Role hierarchy: ADMIN > EDITOR > USER
- Authorization happens in middleware (fail-fast)
- Consider permission-based approach later (Phase 2)
- Track authorization failures in logs
- Rate limit repeated auth failures (DDoS protection)

---

## Epic Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Auth endpoints | 100% passing tests | To verify |
| OAuth integration | Google login working | To verify |
| Token security | No leaks in logs | To verify |
| Authorization coverage | All endpoints protected | To verify |

---

## Epic Dependencies & Timeline

```
Sprint 2:
├── Story 2.1 (JWT) ────┬──> Story 2.2 (Google OAuth)
│                       │
└──> Story 2.3 (User Profiles)

Sprint 3:
├── Story 2.2 + 2.3 complete
└──> Story 2.4 (Authorization) ──> Ready for EPIC 3 & 5
```

---

## Blockers & Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Google OAuth credentials not created | Blocks OAuth | Setup in Google Cloud Console early |
| JWT key rotation complex | Maintenance burden | Implement key versioning (Phase 2) |
| Password hashing performance | Slow auth | Use bcrypt defaults (cost=10) |

---

## Appendix: Files to Create/Modify

**New Files**:
- `server/lib/jwt.ts`
- `server/services/oauth.ts`
- `server/middleware/auth.ts`
- `server/routes/auth.ts`
- `server/routes/users.ts`
- `types/auth.ts`
- `types/user.ts`

**Modified Files**:
- `prisma/schema.prisma` (User model updates)
- `server/index.ts` (auth middleware)
- `package.json` (dependencies)

**New Dependencies**:
```json
{
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "googleapis": "^118.x",
  "google-auth-library": "^8.x"
}
```

---

**Last Updated**: 2026-04-16  
**Approvers**: Morgan (PM), Aria (Architect)
