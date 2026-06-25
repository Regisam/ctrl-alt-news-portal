# Transactional Emails Guide

## Overview

Transactional emails for critical user actions: verification, password reset, welcome, confirmations.

## Email Types

### 1. Email Verification

```bash
POST /api/transactional/send-verification
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**What happens:**
1. Generate verification token (24h expiry)
2. Send email with verification link
3. User clicks link
4. Verify token: `POST /api/transactional/verify-token`

### 2. Password Reset

```bash
POST /api/transactional/send-password-reset
Content-Type: application/json

{
  "email": "user@example.com",
  "userId": "user-123"
}
```

**What happens:**
1. Generate reset token (1h expiry)
2. Send email with reset link
3. User clicks link and sets new password
4. Verify token before allowing password change

### 3. Welcome Email

```bash
POST /api/transactional/send-welcome
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Alice Johnson"
}
```

**Sent automatically:**
- On registration completion
- After email verification
- Personalized with user's name

### 4. Action Confirmations

```bash
POST /api/transactional/send-confirmation
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "user@example.com",
  "action": "Email Changed",
  "details": {
    "old_email": "old@example.com",
    "new_email": "new@example.com"
  }
}
```

**Sent for:**
- Email changes
- Password changes
- Account settings updates
- Important actions

## Token Management

### AC7: Token Validation

```bash
POST /api/transactional/verify-token
Content-Type: application/json

{
  "token": "abc123...",
  "type": "verification"  // or "password-reset", "email-change"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "user-123"
  }
}
```

### AC7: Token Usage

```bash
POST /api/transactional/use-token
Content-Type: application/json

{
  "token": "abc123..."
}
```

**After using token:**
- Token cannot be reused
- Next verification requires new token

### AC8: Token Expiration

- **Verification/Email Change**: 24 hours
- **Password Reset**: 1 hour
- **Auto-cleanup**: Hourly

## Email Flow Examples

### Registration Flow

1. User submits registration
2. User account created (not verified)
3. `POST /api/transactional/send-verification` 
4. User receives verification email
5. User clicks link (contains token)
6. `POST /api/transactional/verify-token` to validate
7. Account marked verified
8. `POST /api/transactional/send-welcome` for welcome email

### Password Reset Flow

1. User clicks "Forgot Password"
2. User enters email
3. `POST /api/transactional/send-password-reset`
4. User receives reset email with link
5. User clicks link (contains token)
6. `POST /api/transactional/verify-token` to validate
7. User sets new password
8. `POST /api/transactional/use-token` to mark token used

## API Reference

### Send Verification

```bash
POST /api/transactional/send-verification
```

**Auth:** Required (Bearer token)

**Body:**
```json
{
  "email": "user@example.com"
}
```

### Send Password Reset

```bash
POST /api/transactional/send-password-reset
```

**Auth:** Not required

**Body:**
```json
{
  "email": "user@example.com",
  "userId": "user-123"
}
```

### Send Welcome

```bash
POST /api/transactional/send-welcome
```

**Auth:** Required

**Body:**
```json
{
  "email": "user@example.com",
  "name": "Alice Johnson"
}
```

### Send Confirmation

```bash
POST /api/transactional/send-confirmation
```

**Auth:** Required

**Body:**
```json
{
  "email": "user@example.com",
  "action": "Email Changed",
  "details": {
    "old_email": "old@example.com",
    "new_email": "new@example.com"
  }
}
```

### Verify Token

```bash
POST /api/transactional/verify-token
```

**Auth:** Not required

**Body:**
```json
{
  "token": "abc123...",
  "type": "verification"
}
```

### Use Token

```bash
POST /api/transactional/use-token
```

**Auth:** Not required

**Body:**
```json
{
  "token": "abc123..."
}
```

### Get Email Log

```bash
GET /api/transactional/email-log
```

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "log": [
      {
        "type": "verification",
        "email": "user@example.com",
        "timestamp": "2026-06-26T10:00:00Z"
      }
    ],
    "count": 1
  }
}
```

## Best Practices

1. **Immediate Delivery**: Send transactional emails immediately
2. **Clear CTAs**: Action buttons should be prominent
3. **Token Expiry**: 24h for verification, 1h for password reset
4. **Security**: Never include sensitive data in email body
5. **Branding**: Use consistent templates and styling
6. **Tracking**: Log all transactional emails
7. **Fallback**: Provide alternative action if link fails
8. **Testing**: Test templates across email clients

## Troubleshooting

### Token Expired

- Generate new token: resend email
- User clicks new link

### Token Invalid

- Verify token type matches
- Check token wasn't already used
- Verify user ID is correct

### Email Not Received

1. Check email address is correct
2. Check email didn't go to spam
3. Resend from email log
4. Contact support for manual verification

## Templates

All templates are responsive and optimized for:
- Desktop clients
- Mobile clients
- Dark mode support
- Plain text fallback

