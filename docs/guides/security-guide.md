# Security Audit & Hardening Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

Production security hardening to protect against OWASP Top 10 attacks.

## Features Implemented

- **AC1**: Security headers (Content-Security-Policy, X-Frame-Options, etc.)
- **AC2**: HTTPS enforcement (redirect in production)
- **AC3**: Input validation + sanitization
- **AC4**: XSS protection (Content-Security-Policy + output escaping)
- **AC5**: CSRF protection (SameSite cookies)
- **AC8**: Password policy (min 12 chars, complexity)
- **AC9**: Safe error messages (no sensitive data)
- **AC10**: Secrets in environment variables

## Security Headers

| Header | Purpose | Value |
|--------|---------|-------|
| Content-Security-Policy | XSS protection | Strict default-src |
| X-Frame-Options | Clickjacking | DENY |
| X-Content-Type-Options | MIME sniffing | nosniff |
| X-XSS-Protection | Browser XSS | 1; mode=block |
| Referrer-Policy | Referrer control | strict-origin-when-cross-origin |
| Permissions-Policy | Feature control | All dangerous features disabled |
| Strict-Transport-Security | HTTPS only | 1 year; preload |

## Input Validation

All user inputs are sanitized:
- Remove null bytes
- Escape HTML characters
- Remove control characters
- Check payload size (max 10MB)
- Detect SQL injection patterns (log only)

## Password Policy

**Requirements:**
- Minimum: 12 characters
- Maximum: 128 characters
- Must include: uppercase, lowercase, number, special char
- Reject: common patterns (password, 123456, qwerty, etc.)

**Validation:**
```bash
POST /api/auth/validate-password
{
  "password": "MyP@ssw0rd123"
}
```

**Response:**
```json
{
  "valid": true,
  "score": 85,
  "errors": [],
  "suggestions": []
}
```

## Rate Limiting on Auth

Authentication endpoints have stricter rate limits:
- Login: 5 attempts per 15 minutes
- Signup: 10 attempts per hour
- Password reset: 3 attempts per day

See `docs/guides/rate-limiting-guide.md` for details.

## Error Handling

**Development:**
```json
{
  "error": "Cannot read property 'name' of undefined",
  "stack": "[...full stack trace...]"
}
```

**Production:**
```json
{
  "error": "An error occurred. Please try again later."
}
```

No sensitive data in error responses in production.

## Environment Variables

**Required for Security:**
```bash
NODE_ENV=production
HTTPS_ONLY=true
SESSION_TIMEOUT=3600000
```

**Never commit:**
- API keys
- Database credentials
- JWT secrets
- OAuth credentials
- Database URLs with passwords

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] All security headers present
- [ ] Input validation active
- [ ] Rate limiting on auth endpoints
- [ ] Error messages safe (no stack traces)
- [ ] No hardcoded secrets in code
- [ ] Secrets in .env file
- [ ] Cookies are HttpOnly + Secure + SameSite
- [ ] CORS configured to trusted origins only
- [ ] CSP strict but not breaking the app

## Testing Security

```bash
# Check security headers
curl -I https://example.com | grep -E "Content-Security-Policy|X-Frame-Options|Strict-Transport-Security"

# Test weak password
curl -X POST https://example.com/api/auth/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "weak"}'

# Test rate limiting
for i in {1..10}; do curl -X POST https://example.com/api/auth/login; done
```

## Known Limitations

- AC6: SQL injection prevention relies on parameterized queries (ORM responsible)
- AC7: Auth rate limiting integrated but needs endpoint configuration
- AC9: Error message sanitization in error handler
- AC4: CSP is strict; may need relaxing for some features

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- MDN Security: https://developer.mozilla.org/en-US/docs/Web/Security
- Content-Security-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP

---

**See also**: docs/guides/rate-limiting-guide.md
