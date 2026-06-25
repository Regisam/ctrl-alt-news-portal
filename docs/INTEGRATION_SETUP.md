# Integration Setup — Tier 1 Real API Integration

This guide covers setting up real API integrations for email, push notifications, and database connectivity.

## Prerequisites

- PostgreSQL database running
- Node.js 18+
- SMTP credentials (Gmail, SendGrid, or similar)
- Web Push API credentials (VAPID keys)
- Prisma CLI installed

## 1. Database Setup

### 1.1 Create PostgreSQL Database

```bash
createdb ctrlaltnews
```

### 1.2 Configure Database URL

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with your PostgreSQL connection
DATABASE_URL=postgresql://user:password@localhost:5432/ctrlaltnews
```

### 1.3 Run Prisma Migrations

```bash
# Install Prisma if not already installed
npm install -D prisma @prisma/client

# Generate Prisma Client
npx prisma generate

# Create and apply migrations
npx prisma migrate deploy

# Verify schema
npx prisma studio
```

## 2. Email Setup (SMTP)

### Option A: Gmail (Recommended for Testing)

```bash
1. Go to myaccount.google.com/apppasswords
2. Generate an app password for Gmail
3. Copy the 16-character password
4. Add to .env:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   FROM_EMAIL=your-email@gmail.com
```

### Option B: SendGrid

```bash
1. Create account at sendgrid.com
2. Generate API key
3. Add to .env:
   SENDGRID_API_KEY=SG.xxx...
   FROM_EMAIL=noreply@ctrlaltnews.com
```

### Option C: Custom SMTP Server

```bash
# Configure in .env
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587  # or 465 for TLS
SMTP_USER=your-username
SMTP_PASS=your-password
FROM_EMAIL=noreply@yourdomain.com
```

### Test Email Integration

```bash
# Start server
npm run dev

# Call test endpoint
curl -X POST http://localhost:3000/api/transactional/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'

# Check email inbox
```

## 3. Push Notifications Setup

### 3.1 Generate VAPID Keys

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys

# Output will be:
# Public Key: ...
# Private Key: ...
```

### 3.2 Configure .env

```bash
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3.3 Test Push Notifications

```bash
# Start server
npm run dev

# In browser, go to http://localhost:3000
# Click "Enable Notifications" button
# Browser will ask for permission

# Get VAPID public key
curl http://localhost:3000/api/push/vapid-public-key

# Send test notification
curl -X POST http://localhost:3000/api/push/test \
  -H "Content-Type: application/json" \
  -d '{}' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. Application Configuration

### 4.1 JWT Configuration

```bash
# Generate JWT secret (random 32+ char string)
openssl rand -base64 32

# Add to .env
JWT_SECRET=your-generated-secret
JWT_EXPIRES_IN=7d
```

### 4.2 Base URL Configuration

```bash
# For production
BASE_URL=https://ctrlaltnews.com

# For local development
BASE_URL=http://localhost:3000
```

## 5. Service Verification

### 5.1 Health Check

```bash
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "cache": "ready",
  "timestamp": "2026-06-26T..."
}
```

### 5.2 Database Connection

```bash
# In your code
const result = await db.user.findMany();
console.log(`Connected: ${result.length >= 0}`);
```

### 5.3 Email Service

```bash
# Test email sending
curl -X POST http://localhost:3000/api/transactional/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check logs for "Email sent successfully"
```

### 5.4 Push Notifications

```bash
# Check subscription
curl http://localhost:3000/api/push/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get metrics
curl http://localhost:3000/api/push/metrics
```

## 6. Optional: Slack Integration

### 6.1 Create Slack Webhook

```bash
1. Go to api.slack.com/apps
2. Create New App → From scratch
3. Add name "Ctrl Alt News" and select workspace
4. Enable Incoming Webhooks
5. Click "Add New Webhook to Workspace"
6. Copy webhook URL
```

### 6.2 Configure .env

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_CHANNEL=#alerts
```

### 6.3 Test Slack Alerts

```bash
curl -X POST http://localhost:3000/api/alerts/test-slack \
  -H "Content-Type: application/json" \
  -d '{"message":"Test alert from Ctrl Alt News"}'

# Check Slack channel for message
```

## 7. Troubleshooting

### Email Not Sending

```
Error: SMTP connection failed
→ Check SMTP credentials in .env
→ Verify firewall allows SMTP port
→ Check Gmail app-specific password if using Gmail
```

### Push Notifications Not Working

```
Error: VAPID key invalid
→ Regenerate VAPID keys with web-push
→ Ensure both public and private keys are set
→ Check VAPID_SUBJECT is valid email
```

### Database Connection Failed

```
Error: ECONNREFUSED localhost:5432
→ Ensure PostgreSQL is running
→ Check DATABASE_URL in .env
→ Run: psql your-database-name (to verify)
```

### Service Worker Not Registering

```
Error: Service Worker registration failed
→ Check public/service-worker.js exists
→ Verify HTTPS in production (required for Push API)
→ Check browser console for errors
```

## 8. Production Deployment

### 8.1 Railway Deployment

```bash
# Connect repository
1. Go to railway.app
2. Create new project
3. Select GitHub repo: Regisam/ctrl-alt-news-portal
4. Authorize
```

### 8.2 Set Environment Variables on Railway

```bash
# In Railway Dashboard → Variables
DATABASE_URL=postgresql://...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
JWT_SECRET=...
BASE_URL=https://ctrlaltnews.railway.app
NODE_ENV=production
```

### 8.3 Run Migrations on Railway

```bash
# In Railway shell or via CLI
npx prisma migrate deploy
```

### 8.4 Verify Production Deployment

```bash
curl https://ctrlaltnews.railway.app/health
curl https://ctrlaltnews.railway.app/api/push/vapid-public-key
```

## 9. Monitoring

### View Real-time Metrics

```bash
# Analytics dashboard
curl http://localhost:3000/api/analytics-live/live | jq

# Email metrics
curl http://localhost:3000/api/analytics-live/email-metrics | jq

# Push metrics
curl http://localhost:3000/api/push/metrics | jq
```

### Check Error Logs

```bash
# In development
npm run dev > logs.txt 2>&1

# In production (Railway)
# View in Railway Dashboard → Logs
```

## 10. Next Steps

After completing integration setup:

1. ✅ Test all API endpoints
2. ✅ Verify email delivery
3. ✅ Test push notifications
4. ✅ Run database migrations
5. ✅ Configure monitoring
6. ✅ Deploy to production
7. ✅ Monitor for errors

---

**Ctrl Alt News Portal — Real API Integration Complete** ✅
