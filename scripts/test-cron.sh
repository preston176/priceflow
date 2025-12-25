#!/bin/bash

# Cron Endpoint Testing Script
# Test your cron endpoints locally before deploying

set -e

echo "🧪 Cron Endpoint Testing"
echo "======================="
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "❌ Error: CRON_SECRET not found in environment"
  echo "Please add it to your .env file"
  exit 1
fi

# Default to localhost
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "Testing endpoints at: $APP_URL"
echo ""

# Test AI price check endpoint
echo "1️⃣  Testing AI price check endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$APP_URL/api/cron/check-prices-ai" \
  -H "Authorization: Bearer $CRON_SECRET")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Success (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "   ❌ Failed (HTTP $HTTP_CODE)"
  echo "$BODY"
fi

echo ""

# Test weekly reminder endpoint
echo "2️⃣  Testing weekly reminder endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$APP_URL/api/cron/weekly-reminders" \
  -H "Authorization: Bearer $CRON_SECRET")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Success (HTTP $HTTP_CODE)"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "   ❌ Failed (HTTP $HTTP_CODE)"
  echo "$BODY"
fi

echo ""

# Test authentication
echo "3️⃣  Testing authentication (should fail)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$APP_URL/api/cron/check-prices-ai" \
  -H "Authorization: Bearer wrong-secret")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
  echo "   ✅ Auth working correctly (HTTP $HTTP_CODE)"
else
  echo "   ⚠️  Unexpected response (HTTP $HTTP_CODE)"
  echo "$BODY"
fi

echo ""
echo "✅ Testing complete!"
echo ""
echo "💡 Tip: Install jq for pretty JSON output: brew install jq"
