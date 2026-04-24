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
- **Blocks**: Story 2.2

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
- **Blocks**: EPIC-3 (Articles), EPIC-5 (Admin)

### Notes

- Use `googleapis` or `google-auth-library` (v8+)
- Google OAuth requires frontend redirect to Google consent screen
- Handle user linking: existing email → new OAuth
- Store googleId securely (don't expose in API responses)
- PKCE flow for security (if using auth code flow)

---

**NOTE**: Stories 2.3 (User Profiles) and 2.4 (Authorization) were planned but not created. 
Their functionality is implemented in Stories 2.1-2.2 and utilized in EPIC-3, EPIC-5.

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
├── Story 2.1 (JWT) ──> Story 2.2 (Google OAuth + User Profiles)
│                            │
└──────────────────────> Ready for EPIC 3 & 5 (Articles, Comments, Admin)
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
