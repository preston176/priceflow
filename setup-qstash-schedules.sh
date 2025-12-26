#!/bin/bash

# QStash Schedule Setup Script
# Make sure to source your .env file first: source .env

set -e

DOMAIN="https://giftflow-zeta.vercel.app"

# Check required environment variables
if [ -z "$QSTASH_TOKEN" ]; then
  echo "Error: QSTASH_TOKEN not set. Please run: source .env"
  exit 1
fi

if [ -z "$CRON_SECRET" ]; then
  echo "Error: CRON_SECRET not set. Please run: source .env"
  exit 1
fi

echo "Setting up QStash schedules for: $DOMAIN"
echo ""

# Schedule 1: Daily Price Check (2 AM UTC)
echo "Creating schedule: Daily Price Check (2 AM UTC)..."
ENDPOINT1="$DOMAIN/api/cron/check-prices-ai"
RESPONSE=$(curl -s -X POST "https://qstash.upstash.io/v2/schedules/$ENDPOINT1" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Upstash-Cron: 0 2 * * *" \
  -H "Upstash-Forward-Authorization: Bearer $CRON_SECRET")
echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Failed to create schedule"
  exit 1
fi
echo "✓ Daily Price Check schedule created"
echo ""

# Schedule 2: Auto-Update Enabled Gifts (6 AM UTC)
echo "Creating schedule: Auto-Update Enabled Gifts (6 AM UTC)..."
ENDPOINT2="$DOMAIN/api/cron/auto-update-enabled-gifts"
RESPONSE=$(curl -s -X POST "https://qstash.upstash.io/v2/schedules/$ENDPOINT2" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Upstash-Cron: 0 6 * * *" \
  -H "Upstash-Forward-Authorization: Bearer $CRON_SECRET")
echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Failed to create schedule"
  exit 1
fi
echo "✓ Auto-Update schedule created"
echo ""

# Schedule 3: Weekly Reminders (Sunday 9 AM UTC)
echo "Creating schedule: Weekly Reminders (Sunday 9 AM UTC)..."
ENDPOINT3="$DOMAIN/api/cron/weekly-reminders"
RESPONSE=$(curl -s -X POST "https://qstash.upstash.io/v2/schedules/$ENDPOINT3" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Upstash-Cron: 0 9 * * 0" \
  -H "Upstash-Forward-Authorization: Bearer $CRON_SECRET")
echo "$RESPONSE"
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Failed to create schedule"
  exit 1
fi
echo "✓ Weekly Reminders schedule created"
echo ""

echo "================================================"
echo "All QStash schedules created successfully!"
echo "================================================"
echo ""
echo "View your schedules at: https://console.upstash.com/qstash"
echo ""
echo "Schedules:"
echo "  1. Daily Price Check - Every day at 2 AM UTC"
echo "  2. Auto-Update Gifts - Every day at 6 AM UTC"
echo "  3. Weekly Reminders - Every Sunday at 9 AM UTC"
echo ""
