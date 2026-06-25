# Email Notifications & Daily Digest Guide

## Overview

Automated email delivery with personalized daily digests and performance tracking.

## Setup

### Environment Variables

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Configuration
FROM_EMAIL=noreply@ctrlaltnews.com
BASE_URL=https://ctrlaltnews.com

# For Gmail: Generate App Password (not regular password)
# https://myaccount.google.com/apppasswords
```

### SMTP Setup (Gmail)

1. Enable 2-factor authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `SMTP_PASS`

### Alternative: SendGrid

```bash
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@ctrlaltnews.com
```

## Daily Digest

### How It Works

1. **User subscribes**: Sets preferred send time
2. **Hourly job runs**: Checks if any users need digest
3. **Generate digest**: Get 5 personalized articles
4. **Render template**: Create HTML email
5. **Send email**: Queue and deliver async
6. **Track metrics**: Open/click rates

### User Preferences

```bash
# Enable/disable digest
POST /api/email/preferences
Content-Type: application/json

{
  "enabled": true,
  "sendTime": 8  // 8 AM user's timezone
}
```

### Email Example

```
Subject: Your Daily Digest - June 26, 2026

Hi Alice,

Here are 5 personalized articles for you today:

- AI Breakthroughs in 2026 [AI]
- Latest Tech News [Technology]
- Scientific Discovery [Science]
- Robotics Innovation [Robotics]
- Gadget Reviews [Gadgets]

View all articles →

---
Unsubscribe | Preferences
```

## API Endpoints

### Get Digest Preferences

```bash
GET /api/email/preferences
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "enabled": true,
      "sendTime": 8,
      "timezone": "America/New_York",
      "lastSentAt": "2026-06-25T08:15:00Z"
    }
  }
}
```

### Update Preferences

```bash
PUT /api/email/preferences
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true,
  "sendTime": 9,
  "timezone": "Europe/London"
}
```

### Unsubscribe

```bash
POST /api/email/unsubscribe
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "unsubscribe-token"
}
```

## Email Tracking

### Open Tracking

Open tracking uses a 1x1 pixel image:

```html
<img src="https://ctrlaltnews.com/api/email/track/open?id={{emailId}}" 
     width="1" height="1" alt="" />
```

### Click Tracking

All links wrapped with tracking:

```html
<a href="https://ctrlaltnews.com/api/email/track/click?url={{encodedUrl}}&id={{emailId}}">
  Article Title
</a>
```

## Performance

### Queue System

- **Async delivery**: Emails sent in background
- **Retry logic**: Exponential backoff
- **Max retries**: 3 attempts
- **Backoff intervals**: 1min, 2min, 4min

### Email Metrics

```bash
GET /api/email/metrics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "sent": 1245,
      "failed": 3,
      "opened": 456,
      "clicked": 123,
      "unsubscribed": 12,
      "queued": 5,
      "openRate": "36.6",
      "clickRate": "27.0"
    }
  }
}
```

## Compliance

### GDPR

- **Unsubscribe**: One-click unsubscribe link in footer
- **GDPR consent**: Stored in user preferences
- **Data retention**: Delete on request

### CAN-SPAM

- Clear sender info in From header
- Physical address in footer (or business address)
- Honor unsubscribe within 10 business days
- Accurate subject line

### Deliverability

**Authentication:**
- SPF: Sender Policy Framework
- DKIM: DomainKeys Identified Mail
- DMARC: Domain-based Message Authentication

**Configuration:**
```
SPF: v=spf1 include:sendgrid.net ~all
DKIM: Add via SendGrid/Gmail
DMARC: v=DMARC1; p=none; rua=mailto:admin@ctrlaltnews.com
```

## Personalization

### Template Variables

- `{{userName}}`: User's display name
- `{{articleCount}}`: Number of articles
- `{{articlesHtml}}`: HTML list of articles
- `{{date}}`: Current date
- `{{unsubscribeUrl}}`: Unsubscribe link

### Article Recommendations

Digest uses same recommendation engine:
- User preferences
- Category interests
- Read history
- Click patterns

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials
2. Verify FROM email domain
3. Check email queue: `GET /api/email/metrics`
4. Review server logs

### Low Open Rates

- Verify HTML rendering
- Check spam folder
- Test with different email clients
- Optimize subject line

### Delivery Issues

1. Check SPF/DKIM/DMARC records
2. Monitor bounce rates
3. Warm up domain (gradual sending)
4. Use dedicated IP (for high volume)

## Best Practices

1. **Timing**: Send at user's preferred time
2. **Content**: Personalized recommendations
3. **Frequency**: Daily (configurable)
4. **Mobile**: Responsive design
5. **CTA**: Clear call-to-action
6. **Unsubscribe**: Prominent unsubscribe link
7. **Testing**: A/B test subject lines
8. **Monitoring**: Track open/click rates

## JavaScript Usage

```typescript
import { emailService } from '../lib/emailService';
import { dailyDigestJob } from '../jobs/dailyDigest';

// Send custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Welcome to Ctrl Alt News</h1>',
});

// Add digest user
dailyDigestJob.addUser({
  id: 'user-1',
  email: 'user@example.com',
  name: 'Alice',
  timezone: 'America/New_York',
  sendTime: 8,
  enabled: true,
});

// Get metrics
const metrics = emailService.getMetrics();
console.log(`Open rate: ${metrics.openRate}%`);
```

