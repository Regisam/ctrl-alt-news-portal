#!/bin/bash
set -e

ENVIRONMENT=${1:-production}

echo "🔄 Initiating rollback for $ENVIRONMENT..."

PREVIOUS_COMMIT=$(git rev-parse HEAD~1)
CURRENT_COMMIT=$(git rev-parse HEAD)

echo "📌 Current commit: $CURRENT_COMMIT"
echo "📌 Reverting to: $PREVIOUS_COMMIT"

git revert --no-edit HEAD
git push origin main

echo "✅ Revert commit pushed to main"
echo "⏳ Triggering redeploy workflow..."

if command -v gh &> /dev/null; then
  gh workflow run deploy.yml \
    --ref main \
    -f environment=$ENVIRONMENT
  echo "✅ Redeploy workflow triggered"
else
  echo "⚠️  GitHub CLI not found. Manual workflow trigger required."
  echo "Go to GitHub Actions and manually trigger the deploy workflow for $ENVIRONMENT"
  exit 1
fi

echo "✅ Rollback initiated successfully"
