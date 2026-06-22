# Compliance & Audit Logging Guide

**Version**: 1.0  
**Last Updated**: 2026-06-22

## Overview

Audit logging and compliance management for GDPR, CCPA, and other regulations.

## Audit Logging

### What Gets Logged

**User Actions:**
- Login/Logout
- Create, edit, delete articles
- Comment creation/deletion
- Profile changes
- Consent preferences

**Not Logged:**
- Passwords
- Tokens
- API keys
- Payment information

### Data Sensitivity Classification

| Level | Examples |
|-------|----------|
| **Public** | Article titles, category names |
| **Internal** | User email, IP address |
| **Sensitive** | User preferences, edit history |
| **Confidential** | Deleted account data |

## GDPR Compliance

### Right to Data Portability

Users can request export of all personal data:

```bash
GET /api/compliance/user-data/:userId
```

Response includes:
- User profile data
- All audit logs
- Consent records
- Activity history

### Right to Be Forgotten

Users can request data deletion:

```bash
POST /api/compliance/deletion-request/:userId
```

Process:
1. User data deleted from databases
2. Audit logs **pseudonymized** (not deleted, for immutability)
3. User ID replaced with hash
4. Personal details removed (IP, user agent)
5. Deletion logged in audit trail

### Consent Management

Record user consent for data processing:

```bash
POST /api/compliance/consent
{
  "userId": "user123",
  "type": "marketing",
  "status": "given"
}
```

Consent types:
- **marketing**: Email marketing, newsletters
- **analytics**: Google Analytics, tracking
- **personalization**: Recommendation engine
- **third-party**: Third-party integrations

## Audit Log Search

Query audit logs by criteria:

```bash
GET /api/compliance/audit-logs?userId=user123&action=login&status=success
```

Parameters:
- `userId`: Filter by user
- `action`: Filter by action type
- `resource`: Filter by resource (e.g., "article")
- `status`: success/failure
- `startDate`: ISO date
- `endDate`: ISO date

## Compliance Reporting

### Generate GDPR Compliance Report

```bash
GET /api/compliance/compliance-report?days=30
```

Report includes:
- Number of users imported
- Consent requests processed
- Deletion requests fulfilled
- Data export requests handled
- Compliance status

## Audit Log Integrity

**Immutability:** Logs are append-only (cannot be modified)

**Verification:** Each log entry has integrity checksum

**Tampering Detection:** Sequence hashes allow detecting modified logs

## Privacy by Design

**No Sensitive Data in Logs:**
- Passwords never logged
- Tokens never logged
- Credit cards never logged
- API keys never logged

**Minimal Data:**
- User ID (pseudonymized after deletion)
- Timestamp
- Action
- Resource
- Success/failure

**Data Retention:**
- 365 days (configurable)
- Auto-cleanup of old logs
- User data deleted on request

## Compliance Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/compliance/audit-logs` | GET | Search audit logs |
| `/api/compliance/user-data/:userId` | GET | Export user data |
| `/api/compliance/deletion-request/:userId` | POST | Request GDPR deletion |
| `/api/compliance/consent` | POST | Record consent |
| `/api/compliance/user-consents/:userId` | GET | Get user consents |
| `/api/compliance/compliance-report` | GET | GDPR/CCPA report |
| `/api/compliance/audit-stats` | GET | Audit log statistics |
| `/api/compliance/consent-stats` | GET | Consent statistics |

## Best Practices

1. **Record all actions**: Every user action should be logged
2. **Include context**: IP, user agent, timestamps
3. **Classify sensitivity**: Mark sensitive data
4. **Review regularly**: Monthly compliance audits
5. **Test deletion**: Verify GDPR deletion works
6. **Monitor integrity**: Check log checksums monthly
7. **Retain evidence**: Keep audit logs for 1 year

## GDPR Checklist

- [ ] Audit logging implemented
- [ ] User data portability working
- [ ] Right to be forgotten (deletion) working
- [ ] Consent management active
- [ ] Privacy policy updated
- [ ] Data processing agreements signed
- [ ] DPA trained
- [ ] Incident response procedure documented
- [ ] Compliance report generated
- [ ] Third-party data sharing audited

---

**See also**: docs/guides/security-guide.md, docs/runbooks/incident-response.md
