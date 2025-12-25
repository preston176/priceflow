/**
 * Setup QStash cron job for automatic price syncing
 * Run: bun run scripts/setup-price-sync-cron.ts
 */

const QSTASH_URL = "https://qstash.upstash.io/v2/schedules";
let QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const CRON_SECRET = process.env.CRON_SECRET;

if (!QSTASH_TOKEN) {
  console.error("❌ QSTASH_TOKEN not found in environment");
  process.exit(1);
}

// Remove quotes if they exist (from .env parsing)
QSTASH_TOKEN = QSTASH_TOKEN.replace(/^["']|["']$/g, '');

if (!APP_URL) {
  console.error("❌ NEXT_PUBLIC_APP_URL not found in environment");
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error("❌ CRON_SECRET not found in environment");
  process.exit(1);
}

async function setupCron() {
  console.log("🚀 Setting up QStash cron job for price syncing...");
  console.log(`🔑 Token (first 20 chars): ${QSTASH_TOKEN?.substring(0, 20)}...`);

  const destinationUrl = `${APP_URL}/api/cron/update-prices`;
  console.log(`📍 Target URL: ${destinationUrl}`);
  console.log(`⏰ Schedule: Daily at 6:00 AM`);

  const payload = {
    destination: destinationUrl,
    cron: "0 6 * * *", // Daily at 6am UTC
    body: JSON.stringify({ test: true }), // Required by QStash
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
      "Content-Type": "application/json",
    },
    retries: 3,
  };

  console.log("\n📦 Payload:");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(QSTASH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`QStash API error: ${error}`);
    }

    const result = await response.json();
    console.log("✅ Cron job created successfully!");
    console.log("📋 Schedule ID:", result.scheduleId);
    console.log("🔗 Destination:", result.destination);
    console.log("⏰ Cron:", result.cron);
    console.log("\n💡 To test manually, run:");
    console.log(`   curl -X POST ${APP_URL}/api/cron/update-prices -H "Authorization: Bearer ${CRON_SECRET}"`);
  } catch (error) {
    console.error("❌ Failed to setup cron job:");
    console.error(error);
    process.exit(1);
  }
}

setupCron();
