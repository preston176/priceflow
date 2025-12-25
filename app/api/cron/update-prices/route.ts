import { db } from "@/db";
import { gifts, profiles } from "@/db/schema";
import { isNull, not, eq } from "drizzle-orm";
import { sendPriceAlertEmail } from "@/lib/email";
import { extractMetadataFromScreenshot } from "@/lib/price-scraper";

export const maxDuration = 300; // 5 minutes max

export async function POST(req: Request) {
  // Verify QStash secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch gifts with URLs (limit to 100 per run to control costs)
    const giftsWithUrls = await db
      .select({
        gift: gifts,
        userEmail: profiles.email,
      })
      .from(gifts)
      .innerJoin(profiles, eq(gifts.userId, profiles.id))
      .where(not(isNull(gifts.url)))
      .limit(100);

    let updated = 0;
    let errors = 0;
    let priceDrops = 0;

    for (const { gift, userEmail } of giftsWithUrls) {
      try {
        // Rate limit: wait 2s between requests to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log(`Checking price for: ${gift.name} (${gift.url})`);

        // Take screenshot using Screenshot API
        const screenshot = await takeScreenshot(gift.url!);

        // Use Gemini AI to extract price from screenshot
        const result = await extractMetadataFromScreenshot(screenshot);

        if (result.success && result.price) {
          const oldPrice = parseFloat(gift.currentPrice || "0");
          const newPrice = result.price;
          const targetPrice = parseFloat(gift.targetPrice);

          console.log(`Price check: ${gift.name} - Old: $${oldPrice}, New: $${newPrice}, Target: $${targetPrice}`);

          // Update price in database
          await db
            .update(gifts)
            .set({
              currentPrice: newPrice.toString(),
              updatedAt: new Date(),
            })
            .where(eq(gifts.id, gift.id));

          updated++;

          // Send alert if price dropped below target
          if (newPrice < oldPrice && newPrice <= targetPrice) {
            console.log(`Price drop detected! Sending alert to ${userEmail}`);

            const savings = (oldPrice - newPrice).toFixed(2);

            await sendPriceAlertEmail({
              to: userEmail!,
              userName: userEmail!.split('@')[0], // Use email username as fallback
              giftName: gift.name,
              oldPrice: `$${oldPrice.toFixed(2)}`,
              newPrice: `$${newPrice.toFixed(2)}`,
              savings: `$${savings}`,
              productUrl: gift.url || undefined,
            });

            priceDrops++;
          }
        } else {
          console.error(`Failed to extract price for ${gift.name}: ${result.error}`);
          errors++;
        }
      } catch (error) {
        console.error(`Failed to update ${gift.name}:`, error);
        errors++;
      }
    }

    const summary = {
      success: true,
      total: giftsWithUrls.length,
      updated,
      errors,
      priceDrops,
      timestamp: new Date().toISOString(),
    };

    console.log("Price update summary:", summary);

    return Response.json(summary);
  } catch (error) {
    console.error("Price update cron failed:", error);
    return Response.json(
      { error: "Failed to update prices", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function takeScreenshot(url: string): Promise<string> {
  if (!process.env.SCREENSHOT_API_KEY) {
    throw new Error("SCREENSHOT_API_KEY not configured");
  }

  // Using Screenshot API (https://screenshotapi.net)
  const apiUrl = new URL("https://shot.screenshotapi.net/screenshot");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("token", process.env.SCREENSHOT_API_KEY);
  apiUrl.searchParams.set("output", "image");
  apiUrl.searchParams.set("file_type", "png");
  apiUrl.searchParams.set("wait_for_event", "load");
  apiUrl.searchParams.set("delay", "2000"); // Wait 2s for page to load

  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    throw new Error(`Screenshot API failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:image/png;base64,${base64}`;
}
