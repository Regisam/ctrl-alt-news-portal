#!/bin/bash

# Health Endpoint Validation Script
# Usage: bash scripts/e2e-validate.sh https://your-domain.com

if [ -z "$1" ]; then
  echo "Usage: bash scripts/e2e-validate.sh <DEPLOY_URL>"
  echo "Example: bash scripts/e2e-validate.sh https://staging.example.com"
  exit 1
fi

DEPLOY_URL="$1"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Health Endpoint Validation${NC}"
echo "================================"
echo "Testing: $DEPLOY_URL"
echo ""

# Test 1: /health endpoint
echo -e "${BLUE}Test 1: GET /health${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$DEPLOY_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ HTTP 200${NC}"
  echo "Response: $BODY"

  # Verify JSON structure
  if echo "$BODY" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ Contains 'status: ok'${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ Missing 'status: ok'${NC}"
    ((FAIL++))
  fi
else
  echo -e "${RED}❌ HTTP $HTTP_CODE (expected 200)${NC}"
  echo "Response: $BODY"
  ((FAIL++))
fi
echo ""

# Test 2: /status endpoint
echo -e "${BLUE}Test 2: GET /status${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$DEPLOY_URL/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ HTTP 200${NC}"
  echo "Response: $BODY"

  # Verify JSON structure
  if echo "$BODY" | grep -q '"environment"'; then
    echo -e "${GREEN}✅ Contains environment${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ Missing environment field${NC}"
    ((FAIL++))
  fi
else
  echo -e "${RED}❌ HTTP $HTTP_CODE (expected 200)${NC}"
  echo "Response: $BODY"
  ((FAIL++))
fi
echo ""

# Test 3: /version endpoint
echo -e "${BLUE}Test 3: GET /version${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$DEPLOY_URL/version")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ HTTP 200${NC}"
  echo "Response: $BODY"

  # Verify JSON structure
  if echo "$BODY" | grep -q '"version"'; then
    echo -e "${GREEN}✅ Contains version${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ Missing version field${NC}"
    ((FAIL++))
  fi
else
  echo -e "${RED}❌ HTTP $HTTP_CODE (expected 200)${NC}"
  echo "Response: $BODY"
  ((FAIL++))
fi
echo ""

# Summary
echo -e "${BLUE}Test Summary${NC}"
echo "============="
echo -e "${GREEN}Passed: $PASS/3${NC}"
echo -e "${RED}Failed: $FAIL/3${NC}"

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ All health checks PASS${NC}"
  exit 0
else
  echo -e "${RED}❌ Some health checks FAILED${NC}"
  exit 1
fi
