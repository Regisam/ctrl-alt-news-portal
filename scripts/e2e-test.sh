#!/bin/bash
set -e

echo "🧪 Story 7.4 E2E Testing Automation"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  Warning: Not on main branch. Currently on: $CURRENT_BRANCH${NC}"
  echo "This script should be run from main or a feature branch."
  echo ""
fi

# Step 1: Verify local tests pass
echo -e "${BLUE}Step 1: Running local validation...${NC}"
echo "Running health endpoint tests..."
npm run test -- server/__tests__/health.test.ts --reporter=verbose || {
  echo -e "${YELLOW}⚠️  Local tests failed. Fix issues before proceeding.${NC}"
  exit 1
}
echo -e "${GREEN}✅ Local tests PASS${NC}"
echo ""

# Step 2: Check if GitHub Secrets are configured
echo -e "${BLUE}Step 2: Verifying GitHub Secrets configuration...${NC}"
echo "⚠️  Reminder: GitHub Secrets must be configured before CI will pass:"
echo "   - DEPLOY_URL"
echo "   - API_KEY"
echo "   - DB_URL"
echo "   - SLACK_WEBHOOK (optional)"
echo ""
read -p "Have you configured GitHub Secrets? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Please configure GitHub Secrets first:"
  echo "  Settings → Secrets and variables → Actions"
  exit 1
fi
echo -e "${GREEN}✅ GitHub Secrets configured${NC}"
echo ""

# Step 3: Create feature branch and push
echo -e "${BLUE}Step 3: Creating feature branch for E2E testing...${NC}"
TIMESTAMP=$(date +%s)
BRANCH_NAME="feat/story-7-4-e2e-$TIMESTAMP"

git checkout -b "$BRANCH_NAME" || {
  echo -e "${YELLOW}Branch already exists. Using existing branch.${NC}"
  git checkout "$BRANCH_NAME"
}

echo "Creating test marker file..."
mkdir -p .github
echo "E2E Testing triggered at $(date)" > .github/e2e-test-marker.txt

git add .github/e2e-test-marker.txt
git commit -m "test: trigger E2E pipeline for story 7.4

- Triggering CI pipeline execution
- Testing GitHub Actions workflows
- Validating health check endpoints
- Performance and rollback validation" || {
  echo "No changes to commit"
}

echo "Pushing branch to GitHub..."
git push origin "$BRANCH_NAME"
echo -e "${GREEN}✅ Branch pushed: $BRANCH_NAME${NC}"
echo ""

# Step 4: Display next steps
echo -e "${BLUE}Step 4: CI Pipeline Triggered!${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor CI Pipeline execution:"
echo "   https://github.com/<owner>/<repo>/actions"
echo ""
echo "2. Once CI completes (3-5 min), trigger staging deployment:"
echo "   Actions → Deploy → Run workflow → Select 'staging'"
echo ""
echo "3. Test health endpoints:"
echo "   bash scripts/e2e-validate.sh https://your-staging-domain.com"
echo ""
echo "4. Test rollback:"
echo "   bash scripts/rollback.sh production"
echo ""
echo "5. Check detailed guide:"
echo "   cat docs/qa/e2e-testing-7.4.md"
echo ""
echo -e "${GREEN}✅ E2E Testing automated setup complete!${NC}"
