"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { items, profiles, priceHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { scrapePrice } from "@/lib/price-scraper";

/**
 * Manually check price for an item
 */
export async function checkPriceNow(itemId: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found");
  }

  // Get the item
  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, profile.id)))
    .limit(1);

  if (!item) {
    throw new Error("Item not found");
  }

  if (!item.url) {
    throw new Error("No product URL provided");
  }

  // Scrape the price
  const result = await scrapePrice(item.url);

  if (!result.success || !result.price) {
    return {
      success: false,
      error: result.error || "Failed to fetch price",
    };
  }

  const newPrice = result.price.toString();

  // Update item with new price
  await db
    .update(items)
    .set({
      currentPrice: newPrice,
      lastPriceCheck: new Date(),
      lowestPriceEver: item.lowestPriceEver
        ? Math.min(parseFloat(item.lowestPriceEver), result.price).toString()
        : newPrice,
      highestPriceEver: item.highestPriceEver
        ? Math.max(parseFloat(item.highestPriceEver), result.price).toString()
        : newPrice,
      updatedAt: new Date(),
    })
    .where(eq(items.id, itemId));

  // Add to price history
  await db.insert(priceHistory).values({
    itemId,
    price: newPrice,
    source: result.source,
  });

  revalidatePath("/dashboard");

  return {
    success: true,
    price: result.price,
    source: result.source,
  };
}

/**
 * Enable or disable price tracking for an item
 */
export async function togglePriceTracking(
  itemId: string,
  enabled: boolean,
  alertThreshold?: string
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Profile not found");
  }

  await db
    .update(items)
    .set({
      priceTrackingEnabled: enabled,
      priceAlertThreshold: alertThreshold || null,
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, itemId), eq(items.userId, profile.id)));

  revalidatePath("/dashboard");
}

/**
 * Get price history for an item
 */
export async function getPriceHistory(itemId: string) {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    return [];
  }

  // Verify ownership
  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.userId, profile.id)))
    .limit(1);

  if (!item) {
    return [];
  }

  const history = await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.itemId, itemId))
    .orderBy(desc(priceHistory.checkedAt))
    .limit(30); // Last 30 price checks

  return history;
}

/**
 * Get all items that need price checking
 * Used by cron job
 */
export async function getItemsForPriceCheck() {
  // Get all items with price tracking enabled that haven't been checked in 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const itemsToCheck = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.priceTrackingEnabled, true),
        eq(items.isPurchased, false)
      )
    )
    .limit(100); // Process 100 at a time to avoid timeouts

  // Filter for items that haven't been checked recently
  return itemsToCheck.filter(
    (item) =>
      !item.lastPriceCheck || new Date(item.lastPriceCheck) < twentyFourHoursAgo
  );
}

/**
 * Check prices for a batch of items
 * Used by cron job
 */
export async function checkPricesForItems(itemIds: string[]) {
  const results = [];

  for (const itemId of itemIds) {
    try {
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      if (!item || !item.url) {
        continue;
      }

      const result = await scrapePrice(item.url);

      if (result.success && result.price) {
        const newPrice = result.price.toString();

        // Update item
        await db
          .update(items)
          .set({
            currentPrice: newPrice,
            lastPriceCheck: new Date(),
            lowestPriceEver: item.lowestPriceEver
              ? Math.min(parseFloat(item.lowestPriceEver), result.price).toString()
              : newPrice,
            highestPriceEver: item.highestPriceEver
              ? Math.max(parseFloat(item.highestPriceEver), result.price).toString()
              : newPrice,
            updatedAt: new Date(),
          })
          .where(eq(items.id, itemId));

        // Add to price history
        await db.insert(priceHistory).values({
          itemId,
          price: newPrice,
          source: result.source,
        });

        // Check if we should send alert
        const shouldAlert =
          item.priceAlertThreshold &&
          result.price <= parseFloat(item.priceAlertThreshold);

        results.push({
          itemId,
          success: true,
          price: result.price,
          shouldAlert,
        });
      } else {
        results.push({
          itemId,
          success: false,
          error: result.error,
        });
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        itemId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

