import { NextResponse } from "next/server";
import { db } from "@/db";
import { gifts, marketplaceProducts, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { scrapePrice } from "@/lib/price-scraper";
import { searchAllMarketplaces } from "@/lib/marketplace-search";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { giftId, userId } = await request.json();

    // Get gift details
    const [gift] = await db
      .select()
      .from(gifts)
      .where(eq(gifts.id, giftId))
      .limit(1);

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    // Get user profile for email
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.clerkUserId, userId))
      .limit(1);

    const results: Array<{
      marketplace: string;
      method: "scraping" | "search";
      success: boolean;
      price?: number;
      error?: string;
    }> = [];

    let updatedPrices = false;
    let bestPrice: number | null = null;
    let bestMarketplace: string | null = null;

    // STEP 1: Try scraping existing marketplace products
    const mpProducts = await db
      .select()
      .from(marketplaceProducts)
      .where(eq(marketplaceProducts.giftId, giftId));

    for (const mp of mpProducts) {
      try {
        const scrapeResult = await scrapePrice(mp.productUrl);

        if (scrapeResult.success && scrapeResult.price) {
          // Scraping worked!
          await db
            .update(marketplaceProducts)
            .set({
              currentPrice: scrapeResult.price.toString(),
              lastPriceCheck: new Date(),
              inStock: true,
              updatedAt: new Date(),
            })
            .where(eq(marketplaceProducts.id, mp.id));

          results.push({
            marketplace: mp.marketplace || "unknown",
            method: "scraping",
            success: true,
            price: scrapeResult.price,
          });

          updatedPrices = true;

          if (bestPrice === null || scrapeResult.price < bestPrice) {
            bestPrice = scrapeResult.price;
            bestMarketplace = mp.marketplace;
          }
        } else {
          // Scraping failed, mark it
          results.push({
            marketplace: mp.marketplace || "unknown",
            method: "scraping",
            success: false,
            error: "Scraping failed",
          });
        }
      } catch (error) {
        results.push({
          marketplace: mp.marketplace || "unknown",
          method: "scraping",
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // STEP 2: If scraping failed for all, fallback to SerpAPI search
    const failedMarketplaces = results.filter((r) => !r.success);

    if (failedMarketplaces.length > 0 && process.env.SERPAPI_KEY) {
      try {
        // Search using SerpAPI
        const searchResults = await searchAllMarketplaces({
          query: gift.name,
          maxResults: 10,
          useCache: false, // Don't use cache for price updates
        });

        for (const failedMp of failedMarketplaces) {
          // Find matching result from search
          const searchResult = searchResults.results.find(
            (r) => r.marketplace === failedMp.marketplace
          );

          if (searchResult) {
            // Found a result! Update the marketplace product
            const [existingMp] = await db
              .select()
              .from(marketplaceProducts)
              .where(
                and(
                  eq(marketplaceProducts.giftId, giftId),
                  eq(marketplaceProducts.marketplace, failedMp.marketplace)
                )
              )
              .limit(1);

            if (existingMp) {
              await db
                .update(marketplaceProducts)
                .set({
                  currentPrice: searchResult.price.toString(),
                  productUrl: searchResult.url,
                  productImageUrl: searchResult.imageUrl,
                  lastPriceCheck: new Date(),
                  inStock: searchResult.inStock,
                  updatedAt: new Date(),
                })
                .where(eq(marketplaceProducts.id, existingMp.id));

              // Update result
              const resultIndex = results.findIndex(
                (r) => r.marketplace === failedMp.marketplace
              );
              results[resultIndex] = {
                marketplace: failedMp.marketplace,
                method: "search",
                success: true,
                price: searchResult.price,
              };

              updatedPrices = true;

              if (bestPrice === null || searchResult.price < bestPrice) {
                bestPrice = searchResult.price;
                bestMarketplace = failedMp.marketplace;
              }
            }
          }
        }
      } catch (error) {
        console.error("SerpAPI fallback failed:", error);
      }
    }

    // STEP 3: Update gift with best price
    if (updatedPrices && bestPrice !== null) {
      await db
        .update(gifts)
        .set({
          currentPrice: bestPrice.toString(),
          primaryMarketplace: bestMarketplace,
          lastMarketplaceSync: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(gifts.id, giftId));
    }

    // STEP 4: Send email notification
    if (profile?.email) {
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      const emailHtml = `
        <h2>Price Update Complete</h2>
        <p>Your automated price update for <strong>${gift.name}</strong> has completed.</p>

        <h3>Results:</h3>
        <ul>
          <li>✅ Successfully updated: ${successCount} marketplace${successCount !== 1 ? 's' : ''}</li>
          ${failCount > 0 ? `<li>❌ Failed to update: ${failCount} marketplace${failCount !== 1 ? 's' : ''}</li>` : ''}
        </ul>

        ${bestPrice ? `
          <h3>Best Price Found:</h3>
          <p><strong>$${bestPrice.toFixed(2)}</strong> at <strong>${bestMarketplace}</strong></p>
        ` : ''}

        <h3>Detailed Results:</h3>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <th>Marketplace</th>
            <th>Method</th>
            <th>Status</th>
            <th>Price</th>
          </tr>
          ${results.map(r => `
            <tr>
              <td>${r.marketplace}</td>
              <td>${r.method === 'scraping' ? '🔧 Scraping' : '🔍 Search'}</td>
              <td>${r.success ? '✅ Success' : '❌ Failed'}</td>
              <td>${r.price ? `$${r.price.toFixed(2)}` : r.error || 'N/A'}</td>
            </tr>
          `).join('')}
        </table>

        <p style="margin-top: 20px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Your Gifts
          </a>
        </p>
      `;

      await resend.emails.send({
        from: "GiftFlow <noreply@giftflow.app>",
        to: profile.email,
        subject: `Price Update Complete: ${gift.name}`,
        html: emailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      updatedPrices,
      bestPrice,
      bestMarketplace,
      results,
    });
  } catch (error) {
    console.error("Price update worker error:", error);
    return NextResponse.json(
      { error: "Failed to update prices" },
      { status: 500 }
    );
  }
}

