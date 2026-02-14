#!/bin/bash

# API Base URL
API_BASE="https://dev-platform-eight.vercel.app/api"
USER_ID="test-user"
PROJECT_ID="simple-test"

echo "=========================================="
echo "Testing Vercel API Endpoints"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Read the files
DIAGRAM=$(cat simple-test/diagram.json)
CODE=$(cat simple-test/simple-test.ino)

echo -e "${BLUE}1. Creating project: ${PROJECT_ID}${NC}"
echo "POST /api/projects/${USER_ID}"
RESPONSE=$(curl -s -X POST "${API_BASE}/projects/${USER_ID}" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"${PROJECT_ID}\",
    \"name\": \"Simple Test Project\",
    \"diagram\": ${DIAGRAM},
    \"code\": $(echo "$CODE" | jq -Rs .)
  }")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

sleep 1

echo -e "${BLUE}2. Listing all projects for user: ${USER_ID}${NC}"
echo "GET /api/projects/${USER_ID}"
RESPONSE=$(curl -s "${API_BASE}/projects/${USER_ID}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

sleep 1

echo -e "${BLUE}3. Getting project metadata: ${PROJECT_ID}${NC}"
echo "GET /api/projects/${USER_ID}/${PROJECT_ID}"
RESPONSE=$(curl -s "${API_BASE}/projects/${USER_ID}/${PROJECT_ID}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

sleep 1

echo -e "${BLUE}4. Getting diagram JSON${NC}"
echo "GET /api/projects/${USER_ID}/${PROJECT_ID}/diagram"
RESPONSE=$(curl -s "${API_BASE}/projects/${USER_ID}/${PROJECT_ID}/diagram")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

sleep 1

echo -e "${BLUE}5. Getting code file${NC}"
echo "GET /api/projects/${USER_ID}/${PROJECT_ID}/code"
RESPONSE=$(curl -s "${API_BASE}/projects/${USER_ID}/${PROJECT_ID}/code")
echo "$RESPONSE" | head -20
echo ""

sleep 1

echo -e "${BLUE}6. Testing simple endpoint${NC}"
echo "GET /api/test"
RESPONSE=$(curl -s "${API_BASE}/test")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo -e "${GREEN}=========================================="
echo "Test Complete!"
echo "==========================================${NC}"
