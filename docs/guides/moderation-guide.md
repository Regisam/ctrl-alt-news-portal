# Admin Dashboard & Moderation Tools Guide

## Overview

Comprehensive admin tools for content moderation, user management, and platform safety.

## Dashboard

### Real-time Metrics

```
Pending Reports: 12
Total Actions: 1,245
Banned Users: 5
Suspended Users: 8
Reports This Week: 34
```

**Access**: GET /api/admin/stats

## Content Moderation

### Approve Article

```bash
POST /api/admin/articles/:articleId/approve
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action": {
      "id": "action-1687000000",
      "type": "approve",
      "targetType": "article",
      "targetId": "article-123",
      "adminId": "admin-1",
      "adminName": "Admin",
      "timestamp": "2026-06-25T10:00:00Z"
    }
  }
}
```

### Reject Article

```bash
POST /api/admin/articles/:articleId/reject
Content-Type: application/json

{
  "reason": "Contains misinformation"
}
```

## User Management

### Ban User

```bash
POST /api/admin/users/:userId/ban
Content-Type: application/json

{
  "reason": "Spamming content",
  "duration": 2592000000  // 30 days in ms (optional)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "action": {
      "type": "ban",
      "targetType": "user",
      "status": "banned",
      "until": "2026-07-25T10:00:00Z"
    }
  }
}
```

### Suspend User

```bash
POST /api/admin/users/:userId/suspend
Content-Type: application/json

{
  "reason": "Terms of service violation",
  "duration": 604800000  // 7 days
}
```

### Restore User

```bash
POST /api/admin/users/:userId/restore
```

## Reports & Complaints

### Get Pending Reports

```bash
GET /api/admin/reports/pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-123",
        "type": "article",
        "targetId": "article-456",
        "reporterId": "user-789",
        "reason": "Offensive content",
        "status": "pending",
        "timestamp": "2026-06-25T09:30:00Z"
      }
    ],
    "count": 12
  }
}
```

### Resolve Report

```bash
POST /api/admin/reports/:reportId/resolve
Content-Type: application/json

{
  "action": "approved"  // or "dismissed"
}
```

## Bulk Operations

### Bulk Approve Articles

```bash
POST /api/admin/articles/bulk/approve
Content-Type: application/json

{
  "articleIds": ["article-1", "article-2", "article-3"]
}
```

### Bulk Reject Articles

```bash
POST /api/admin/articles/bulk/reject
Content-Type: application/json

{
  "articleIds": ["article-4", "article-5"],
  "reason": "Duplicate content"
}
```

### Bulk Ban Users

```bash
POST /api/admin/users/bulk/ban
Content-Type: application/json

{
  "userIds": ["user-1", "user-2"],
  "reason": "Bot network detected"
}
```

## Audit Logging

### View Audit Log

```bash
GET /api/admin/audit-log?adminId=admin-1&targetType=article&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "log": [
      {
        "id": "action-1687000000",
        "type": "approve",
        "targetType": "article",
        "targetId": "article-123",
        "adminId": "admin-1",
        "adminName": "Admin",
        "reason": "Approved by admin",
        "timestamp": "2026-06-25T10:00:00Z",
        "metadata": { "published": true }
      }
    ],
    "count": 45
  }
}
```

**Log is immutable:** All actions are permanently recorded for compliance.

## Search & Filtering

### Search Reports

```bash
GET /api/admin/reports/search?q=misinformation
```

## User Statuses

### Active
- Full platform access
- Can post, comment, like

### Suspended
- Temporary restriction (7-30 days)
- Auto-restored after duration
- Cannot post or comment

### Banned
- Permanent or long-term restriction
- Cannot access platform
- Can be manually restored

## Permissions & Roles

### Admin
- Full moderation access
- View/approve content
- Ban/suspend users
- View audit logs

### Moderator (future)
- Limited moderation
- Approve content only
- View reports

### SuperAdmin (future)
- All operations
- Manage other admins

## Real-time Updates

Admin dashboard receives WebSocket updates:

```typescript
socket.on('moderation:report-created', (report) => {
  // New report received
  console.log('New report:', report);
});

socket.on('moderation:action-taken', (action) => {
  // Admin action taken
  console.log('Action:', action);
});
```

## Best Practices

1. **Document Decisions**: Always provide reason for actions
2. **Fair & Consistent**: Apply policies uniformly
3. **Audit Trail**: All actions logged permanently
4. **Escalation**: Serious issues handled by senior admin
5. **Appeals**: Users can appeal suspensions/bans
6. **Privacy**: Never expose sensitive user data
7. **Quick Response**: Target <24 hour response to reports

## Moderation Workflow

1. **Report**: User files complaint
2. **Review**: Admin examines content
3. **Decide**: Approve or reject
4. **Act**: Ban/suspend if needed
5. **Log**: Record in audit trail
6. **Notify**: Inform user (for suspensions/bans)

## Safety Checks

- Cannot ban yourself
- Cannot undo actions (immutable log)
- All operations require admin permission
- Rate-limited to prevent abuse
- Cascading delete prevented

