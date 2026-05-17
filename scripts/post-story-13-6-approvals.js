#!/usr/bin/env node

/**
 * Story 13.6: Automated Slack Notifications
 * Posts approval requests to team via Slack API
 *
 * Usage:
 *   SLACK_BOT_TOKEN=xoxb-... node post-story-13-6-approvals.js
 *
 * Requires:
 *   - npm install @slack/web-api
 *   - SLACK_BOT_TOKEN environment variable
 */

const { WebClient } = require('@slack/web-api');

// Validate environment
if (!process.env.SLACK_BOT_TOKEN) {
  console.error('❌ ERROR: SLACK_BOT_TOKEN not set');
  console.error('Usage: SLACK_BOT_TOKEN=xoxb-... node post-story-13-6-approvals.js');
  process.exit(1);
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// Message templates
const messages = {
  channelGeneral: {
    channel: '#serendipity-alerts',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚀 Story 13.6 INFRASTRUCTURE READY FOR SETUP',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Infrastructure templates and briefing are complete and ready for @devops to execute!\n\n*📊 What\'s Ready:*\n✅ Grafana dashboard template (11 panels)\n✅ DevOps briefing with step-by-step setup\n✅ Code quality: TypeScript 0 errors, ESLint clean, 102/102 tests PASS\n✅ Approval request sent to all stakeholders',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📅 Timeline:*\n🎯 *TODAY (2026-05-17)*: Briefing & templates ✅\n🎯 *2026-05-18 EOD*: @qa, @pm, @dev approvals (CRITICAL!)\n🎯 *2026-05-19 EOD*: @devops infrastructure ready\n🎯 *2026-05-20 10:00 AM*: Canary launch (5% users) 🚀',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*@devops (Gage)* - Your detailed briefing is ready:\n👉 `docs/stories/13.6-DEVOPS-BRIEFING.md` (follow step-by-step)\n👉 `docs/monitoring/13.6-grafana-dashboard.json` (ready to import)\n\n*Estimated time: 4-6 hours. You have 48 hours available.*',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'Questions? Reply in thread! 👇',
          },
        ],
      },
    ],
  },

  devopsDirectMessage: {
    text: 'Hey @devops - Story 13.6 infrastructure briefing ready!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Hey @devops - Story 13.6 infrastructure briefing ready!\n\nI\'ve prepared everything you need for the canary launch setup:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📋 BRIEFING* (detailed walkthrough):\n`docs/stories/13.6-DEVOPS-BRIEFING.md`\n• Grafana dashboard setup (CTR, discovery rate, latency, engagement)\n• PagerDuty alert configuration (6 critical alerts)\n• Slack integration (#serendipity-alerts)\n• Feature flag verification\n• Rollback procedure testing\n• Go-live checklist (2026-05-20 morning)',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📊 DASHBOARD TEMPLATE* (ready to import):\n`docs/monitoring/13.6-grafana-dashboard.json`\n• 11 pre-configured panels\n• Alert thresholds built-in\n• Just import directly into Grafana',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*⏰ DEADLINE*: 2026-05-19 23:59 EOD\n*🎯 TARGET*: Canary launch 2026-05-20 10:00 AM\n*⏱️ Estimated time*: 4-6 hours total\n\nFollow the briefing checklist and you\'re golden! Let me know if you hit any blockers.',
        },
      },
    ],
  },

  qaApproval: {
    text: '@qa - Story 13.6 approval reminder',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '@qa - Quick reminder: Story 13.6 approval deadline is *2026-05-18 EOD* ⏰',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Your Checklist:*\n☐ Reviewed all 102 tests (42 serendipity + 38 flags + 22 integration)\n☐ Confirmed adequate coverage\n☐ CodeRabbit: 0 CRITICAL issues ✅\n☐ Reply with ✅ when done!',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '📄 Full details: `docs/stories/13.6-APPROVAL-REQUEST.md` (lines 41-63)\n\nThis is on the critical path for 2026-05-20 canary launch 🚀',
        },
      },
    ],
  },

  pmApproval: {
    text: '@pm - Story 13.6 approval reminder',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '@pm - Quick reminder: Story 13.6 business approval deadline is *2026-05-18 EOD* ⏰',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Your Checklist:*\n☐ Confirmed CTR lift target: +15-20% vs control\n☐ Discovery rate target: 30%+\n☐ Engagement lift target: +10-15% time-on-article\n☐ Stakeholders briefed on rollout plan\n☐ Reply with ✅ when done!',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '📄 Full details: `docs/stories/13.6-APPROVAL-REQUEST.md` (lines 92-114)\n\nThis is on the critical path for 2026-05-20 canary launch 🚀',
        },
      },
    ],
  },

  devApproval: {
    text: '@dev - Story 13.6 approval reminder',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '@dev - Quick reminder: Story 13.6 code quality approval deadline is *2026-05-18 EOD* ⏰',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Your Checklist:*\n☐ Code production-ready (102/102 tests PASS) ✅\n☐ All edge cases handled ✅\n☐ Performance targets met (<50ms p50) ✅\n☐ Reply with ✅ when done!',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '📄 Full details: `docs/stories/13.6-APPROVAL-REQUEST.md` (lines 26-38)\n\nThis is on the critical path for 2026-05-20 canary launch 🚀',
        },
      },
    ],
  },
};

// Send message helper
async function sendMessage(channelOrUser, messageConfig, isMention = false) {
  try {
    const result = await slack.chat.postMessage({
      channel: channelOrUser,
      ...messageConfig,
      metadata: {
        event_type: 'story_13_6_approval_notification',
        event_payload: {
          story_id: '13.6',
          phase: 'phase_4_approval_request',
          sent_at: new Date().toISOString(),
        },
      },
    });

    const userText = isMention ? `@${channelOrUser}` : channelOrUser;
    console.log(`✅ Message sent to ${userText}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send message to ${channelOrUser}:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('\n📱 Story 13.6: Sending Slack Notifications...\n');

  try {
    // 1. Send general message to channel
    console.log('📤 [1/5] Posting general announcement to #serendipity-alerts...');
    await sendMessage('#serendipity-alerts', messages.channelGeneral);

    // 2. Send DM to @devops
    console.log('📤 [2/5] Sending briefing to @devops (Gage)...');
    await sendMessage('@devops', messages.devopsDirectMessage);

    // 3. Send mention to @qa
    console.log('📤 [3/5] Sending approval reminder to @qa (Quinn)...');
    await sendMessage('@qa', messages.qaApproval, true);

    // 4. Send mention to @pm
    console.log('📤 [4/5] Sending approval reminder to @pm (Morgan)...');
    await sendMessage('@pm', messages.pmApproval, true);

    // 5. Send mention to @dev
    console.log('📤 [5/5] Sending approval reminder to @dev (Dex)...');
    await sendMessage('@dev', messages.devApproval, true);

    console.log('\n✅ All notifications sent successfully!\n');
    console.log('📊 Status:');
    console.log('   ✅ #serendipity-alerts: General announcement + mentions');
    console.log('   ✅ @devops: Full briefing + templates');
    console.log('   ✅ @qa: Approval checklist');
    console.log('   ✅ @pm: Approval checklist');
    console.log('   ✅ @dev: Approval checklist');
    console.log('\n🎯 Next step: Monitor approvals (deadline 2026-05-18 EOD)\n');
  } catch (error) {
    console.error('\n❌ Notification send failed:', error.message);
    process.exit(1);
  }
}

// Run
main();
