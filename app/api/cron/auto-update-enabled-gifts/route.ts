import { NextResponse } from "next/server";
import { db } from "@/db";
import { gifts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Client } from "@upstash/qstash";

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

/**
 * Cron job that runs daily to auto-update all gifts with autoUpdateEnabled=true
 * Triggers background updates via QStash for each enabled gift
 */
export async function GET(request: Request) {
  try {
    // Verify this is coming from QStash (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all gifts with auto-update enabled
    const enabledGifts = await db
      .select()
      .from(gifts)
      .where(eq(gifts.autoUpdateEnabled, true));

    console.log(`Found ${enabledGifts.length} gifts with auto-update enabled`);

    if (enabledGifts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No gifts with auto-update enabled",
        giftsUpdated: 0,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL not configured");
    }

    // Queue background updates for each gift
    const updatePromises = enabledGifts.map(async (gift) => {
      try {
        // Trigger background update via QStash
        const result = await qstash.publishJSON({
          url: `${baseUrl}/api/workers/update-price`,
          body: {
            giftId: gift.id,
            userId: gift.userId,
          },
          // Add delay to stagger updates (avoid overwhelming the system)
          delay: Math.floor(Math.random() * 300), // Random delay 0-5 minutes
        });

        // Update lastAutoUpdate timestamp
        await db
          .update(gifts)
          .set({
            lastAutoUpdate: new Date(),
          })
          .where(eq(gifts.id, gift.id));

        return {
          giftId: gift.id,
          giftName: gift.name,
          success: true,
          messageId: result.messageId,
        };
      } catch (error) {
        console.error(`Failed to queue update for gift ${gift.id}:`, error);
        return {
          giftId: gift.id,
          giftName: gift.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`Auto-update cron completed: ${successCount} queued, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Queued ${successCount} auto-updates`,
      giftsUpdated: successCount,
      giftsFailed: failCount,
      results,
    });
  } catch (error) {
    console.error("Auto-update cron error:", error);
    return NextResponse.json(
      {
        error: "Failed to run auto-update cron",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
