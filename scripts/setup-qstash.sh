#!/bin/bash

# QStash Schedule Setup Script
# This script helps you create QStash schedules for automated cron jobs

set -e

echo "🚀 QStash Schedule Setup for Zawadi"
echo "===================================="
echo ""

# Check if required env vars are set
if [ -z "$QSTASH_TOKEN" ]; then
  echo "❌ Error: QSTASH_TOKEN not found in environment"
  echo "Please add it to your .env file and run: source .env"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "❌ Error: CRON_SECRET not found in environment"
  echo "Please generate one with: openssl rand -base64 32"
  echo "Then add it to your .env file"
  exit 1
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_APP_URL not found in environment"
  echo "Please add your production URL to .env (e.g., https://zawadi.app)"
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
