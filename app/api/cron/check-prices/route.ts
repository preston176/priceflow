import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { getGiftsForPriceCheck, checkPricesForGifts } from "@/actions/price-actions";
import { db } from "@/db";
import { gifts, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPriceAlertEmail } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

/**
 * Cron job to check prices for all tracked gifts
 * Triggered daily by Upstash QStash
 *
 * Setup:
 * 1. Sign up at https://console.upstash.com/qstash
 * 2. Add QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY to .env
 * 3. Create schedule: POST https://qstash.upstash.io/v2/schedules
 *    - destination: https://your-app.vercel.app/api/cron/check-prices
 *    - cron: 0 10 * * * (10 AM daily)
 */
async function handler(request: Request) {

  try {
    // Get all gifts that need price checking
    const giftsToCheck = await getGiftsForPriceCheck();

    if (giftsToCheck.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No gifts to check",
        checked: 0,
      });
    }

    // Check prices for all gifts
    const giftIds = giftsToCheck.map((g) => g.id);
    const results = await checkPricesForGifts(giftIds);

    // Send email alerts for price drops
    const alertsSent = [];
    for (const result of results) {
      if (result.success && result.shouldAlert) {
        try {
          // Get gift and user details
          const [gift] = await db
            .select()
            .from(gifts)
            .where(eq(gifts.id, result.giftId))
            .limit(1);

          if (!gift) continue;

          const [profile] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.id, gift.userId))
            .limit(1);

          if (!profile || !profile.email) continue;

          const oldPrice = parseFloat(gift.targetPrice);
          const newPrice = result.price!;
          const savings = oldPrice - newPrice;

          await sendPriceAlertEmail({
            to: profile.email,
            userName: profile.name || "there",
            giftName: gift.name,
            oldPrice: formatCurrency(oldPrice),
            newPrice: formatCurrency(newPrice),
            savings: formatCurrency(savings),
            productUrl: gift.url || undefined,
          });

          alertsSent.push(result.giftId);
        } catch (error) {
          console.error(`Failed to send alert for ${result.giftId}:`, error);
        }
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      checked: results.length,
      successful,
      failed,
      alertsSent: alertsSent.length,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const GET = verifySignatureAppRouter(handler);
