#!/bin/bash

# QStash Schedule Setup Script
# This script helps you create QStash schedules for automated cron jobs

set -e

# TEMPORARY: Hardcoded values from .env (remove after setup)
QSTASH_TOKEN="${QSTASH_TOKEN}"
QSTASH_CURRENT_SIGNING_KEY="${QSTASH_CURRENT_SIGNING_KEY}"
QSTASH_NEXT_SIGNING_KEY="${QSTASH_NEXT_SIGNING_KEY}"
CRON_SECRET="${CRON_SECRET}"
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "🚀 QStash Schedule Setup for Zawadi"
echo "===================================="
echo ""

# Check if required vars are set
if [ -z "$QSTASH_TOKEN" ]; then
  echo "❌ Error: QSTASH_TOKEN not found"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "❌ Error: CRON_SECRET not found"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_APP_URL not found"
  exit 1
fi

echo "✓ Environment variables found"
echo ""
echo "📝 Creating QStash schedules for:"
echo "   App URL: $NEXT_PUBLIC_APP_URL"
echo ""

# Create daily AI price check schedule
echo "1️⃣  Creating daily AI price check schedule (2 AM UTC)..."
RESPONSE=$(curl -s -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"destination\": \"$NEXT_PUBLIC_APP_URL/api/cron/check-prices-ai\",
    \"cron\": \"0 2 * * *\",
    \"headers\": {
      \"Authorization\": \"Bearer $CRON_SECRET\"
    }
  }")

if echo "$RESPONSE" | grep -q "scheduleId"; then
  SCHEDULE_ID=$(echo "$RESPONSE" | grep -o '"scheduleId":"[^"]*"' | cut -d'"' -f4)
  echo "   ✅ Created! Schedule ID: $SCHEDULE_ID"
else
  echo "   ❌ Failed to create schedule"
  echo "   Response: $RESPONSE"
  exit 1
fi

echo ""

# Create weekly reminder schedule
echo "2️⃣  Creating weekly reminder schedule (Sunday 9 AM UTC)..."
RESPONSE=$(curl -s -X POST https://qstash.upstash.io/v2/schedules \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"destination\": \"$NEXT_PUBLIC_APP_URL/api/cron/weekly-reminders\",
    \"cron\": \"0 9 * * 0\",
    \"headers\": {
      \"Authorization\": \"Bearer $CRON_SECRET\"
    }
  }")

if echo "$RESPONSE" | grep -q "scheduleId"; then
  SCHEDULE_ID=$(echo "$RESPONSE" | grep -o '"scheduleId":"[^"]*"' | cut -d'"' -f4)
  echo "   ✅ Created! Schedule ID: $SCHEDULE_ID"
else
  echo "   ❌ Failed to create schedule"
  echo "   Response: $RESPONSE"
  exit 1
fi

echo ""
echo "🎉 QStash schedules created successfully!"
echo ""
echo "📊 Next steps:"
echo "   1. View schedules: https://console.upstash.com/qstash"
echo "   2. Test endpoints manually:"
echo "      curl -X GET \"$NEXT_PUBLIC_APP_URL/api/cron/check-prices-ai\" \\"
echo "        -H \"Authorization: Bearer \$CRON_SECRET\""
echo ""
echo "   3. Monitor execution logs in QStash dashboard"
echo ""
echo "📖 For more info, see CRON-SETUP.md"
