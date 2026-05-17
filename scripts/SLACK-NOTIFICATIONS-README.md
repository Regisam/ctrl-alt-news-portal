# Story 13.6: Automated Slack Notifications

Send all team approval notifications automatically via Slack API.

## ⚡ Quick Start

### 1. Install dependency (one-time)
```bash
npm install @slack/web-api
```

### 2. Get your Slack Bot Token
1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Story Notifier" | Workspace: your workspace
4. Go to "OAuth & Permissions"
5. Scroll to "Scopes" → Add "chat:write" + "users:read"
6. Click "Install to Workspace"
7. Copy "Bot User OAuth Token" (starts with `xoxb-`)

### 3. Run the script
```bash
SLACK_BOT_TOKEN=xoxb-YOUR-TOKEN-HERE node scripts/post-story-13-6-approvals.js
```

That's it! All notifications sent automatically.

---

## 📋 What Gets Sent

✅ **#serendipity-alerts** (main channel)
- General announcement
- Mentions @devops, @qa, @pm, @dev

✅ **@devops DM** (Gage)
- Full briefing document
- Dashboard template link
- Deadline & estimated time

✅ **@qa mention** (Quinn)
- Approval checklist
- Document link
- Deadline reminder

✅ **@pm mention** (Morgan)
- Approval checklist
- Business metrics confirmation
- Deadline reminder

✅ **@dev mention** (Dex)
- Approval checklist
- Code quality confirmation
- Deadline reminder

---

## 🔒 Security Notes

- Bot token is **sensitive** — never commit to git
- Use environment variables: `SLACK_BOT_TOKEN=...`
- Token only needs `chat:write` scope
- Create a dedicated bot app for this (don't reuse personal tokens)

---

## 🆘 Troubleshooting

**Error: "SLACK_BOT_TOKEN not set"**
```bash
# Forgot the token? Add it:
SLACK_BOT_TOKEN=xoxb-YOUR-TOKEN node scripts/post-story-13-6-approvals.js
```

**Error: "not_in_channel"**
→ Bot needs to be in #serendipity-alerts (invite it manually)

**Error: "user_not_found"**
→ Check Slack usernames (@devops should be @devops, etc.)

**Error: "invalid_auth"**
→ Token is wrong or expired. Generate new one at https://api.slack.com/apps

---

## 📊 Verification

After running, check:
1. ✅ #serendipity-alerts has the announcement
2. ✅ @devops received DM with briefing
3. ✅ @qa saw the mention with checklist
4. ✅ @pm saw the mention with checklist
5. ✅ @dev saw the mention with checklist

---

## 🔄 Run Again?

To resend notifications (e.g., after 24 hours as reminder):
```bash
SLACK_BOT_TOKEN=xoxb-YOUR-TOKEN node scripts/post-story-13-6-approvals.js
```

Slack will post duplicate messages (not edits). If you need to update, run from different bot or edit manually.

---

## 📝 Customize Messages

Edit `scripts/post-story-13-6-approvals.js` → `messages` object to change content.

Re-run to send updated messages.

---

## ✨ Done!

Run the script → notifications sent → team approvals in motion → canary launch ready!

```bash
SLACK_BOT_TOKEN=xoxb-YOUR-TOKEN-HERE node scripts/post-story-13-6-approvals.js
```
