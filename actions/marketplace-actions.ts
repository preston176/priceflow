"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { marketplaceProducts, gifts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  searchAllMarketplaces,
  clearExpiredCache,
  type ProductSearchResult,
  type MarketplaceSearchOptions,
} from "@/lib/marketplace-search";
import { scrapePrice } from "@/lib/price-scraper";

/**
 * Search for products across all marketplaces
 */
export async function searchProducts(
  query: string,
  options?: {
    marketplaces?: string[];
    maxResultsPerMarketplace?: number;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const searchOptions: MarketplaceSearchOptions = {
      query,
      maxResults: options?.maxResultsPerMarketplace || 10,
      useCache: true,
      marketplaces: options?.marketplaces,
    };

    const results = await searchAllMarketplaces(searchOptions);

    return {
      success: true,
      results: results.results,
      errors: results.errors,
      cached: results.cached,
    };
  } catch (error) {
    console.error("Search products error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
      results: [],
      errors: {},
      cached: false,
    };
  }
}

/**
 * Add a marketplace product to an existing gift
 */
export async function addMarketplaceProduct(
  giftId: string,
  marketplace: string,
  productUrl: string,
  options?: {
    productName?: string;
    productImageUrl?: string;
    confidenceScore?: number;
  }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify gift belongs to user
    const gift = await db.query.gifts.findFirst({
      where: eq(gifts.id, giftId),
      with: { profile: true },
    });

    if (!gift || gift.profile.clerkUserId !== userId) {
      throw new Error("Gift not found or unauthorized");
    }

    // Check if marketplace product already exists
    const existing = await db.query.marketplaceProducts.findFirst({
      where: and(
        eq(marketplaceProducts.giftId, giftId),
        eq(marketplaceProducts.marketplace, marketplace)
      ),
    });

    if (existing) {
      // Update existing
      await db
        .update(marketplaceProducts)
        .set({
          productUrl,
          productName: options?.productName,
          productImageUrl: options?.productImageUrl,
          confidenceScore: options?.confidenceScore?.toString(),
          updatedAt: new Date(),
        })
        .where(eq(marketplaceProducts.id, existing.id));
    } else {
      // Insert new
      await db.insert(marketplaceProducts).values({
        giftId,
        marketplace,
        productUrl,
        productName: options?.productName,
        productImageUrl: options?.productImageUrl,
        confidenceScore: options?.confidenceScore?.toString(),
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Add marketplace product error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add marketplace product",
    };
  }
}

/**
 * Remove a marketplace product from a gift
 */
export async function removeMarketplaceProduct(
  giftId: string,
  marketplace: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify gift belongs to user
    const gift = await db.query.gifts.findFirst({
      where: eq(gifts.id, giftId),
      with: { profile: true },
    });

    if (!gift || gift.profile.clerkUserId !== userId) {
      throw new Error("Gift not found or unauthorized");
    }

    await db
      .delete(marketplaceProducts)
      .where(
        and(
          eq(marketplaceProducts.giftId, giftId),
          eq(marketplaceProducts.marketplace, marketplace)
        )
      );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Remove marketplace product error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove marketplace product",
    };
  }
}

/**
 * Get all marketplace products for a gift
 */
export async function getMarketplaceProducts(giftId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify gift belongs to user
    const gift = await db.query.gifts.findFirst({
      where: eq(gifts.id, giftId),
      with: {
        profile: true,
        marketplaceProducts: true,
      },
    });

    if (!gift || gift.profile.clerkUserId !== userId) {
      throw new Error("Gift not found or unauthorized");
    }

    return {
      success: true,
      products: gift.marketplaceProducts,
    };
  } catch (error) {
    console.error("Get marketplace products error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get marketplace products",
      products: [],
    };
  }
}

/**
 * Sync prices across all marketplaces for a gift
 */
export async function syncMarketplacePrices(giftId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify gift belongs to user
    const gift = await db.query.gifts.findFirst({
      where: eq(gifts.id, giftId),
      with: {
        profile: true,
        marketplaceProducts: true,
      },
    });

    if (!gift || gift.profile.clerkUserId !== userId) {
      throw new Error("Gift not found or unauthorized");
    }

    const errors: string[] = [];
    let updated = 0;

    // Check prices for all marketplace products with delays
    for (let i = 0; i < gift.marketplaceProducts.length; i++) {
      const mp = gift.marketplaceProducts[i];

      try {
        // Add 2-second delay between requests to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const result = await scrapePrice(mp.productUrl);

        if (result.success && result.price) {
          await db
            .update(marketplaceProducts)
            .set({
              currentPrice: result.price.toString(),
              lastPriceCheck: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(marketplaceProducts.id, mp.id));

          updated++;
        } else {
          errors.push(`${mp.marketplace}: ${result.error || "Price not found"}`);
        }
      } catch (error) {
        errors.push(
          `${mp.marketplace}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // Update gift's last sync timestamp
    await db
      .update(gifts)
      .set({
        lastMarketplaceSync: new Date(),
      })
      .where(eq(gifts.id, giftId));

    revalidatePath("/dashboard");

    return {
      success: true,
      updated,
      errors,
    };
  } catch (error) {
    console.error("Sync marketplace prices error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync prices",
      updated: 0,
      errors: [],
    };
  }
}

/**
 * Set the primary marketplace for a gift
 */
export async function setPrimaryMarketplace(
  giftId: string,
  marketplace: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify gift belongs to user
    const gift = await db.query.gifts.findFirst({
      where: eq(gifts.id, giftId),
      with: { profile: true },
    });

    if (!gift || gift.profile.clerkUserId !== userId) {
      throw new Error("Gift not found or unauthorized");
    }

    // Verify marketplace product exists
    const mp = await db.query.marketplaceProducts.findFirst({
      where: and(
        eq(marketplaceProducts.giftId, giftId),
        eq(marketplaceProducts.marketplace, marketplace)
      ),
    });

    if (!mp) {
      throw new Error("Marketplace product not found");
    }

    // Update gift's primary marketplace and current price
    await db
      .update(gifts)
      .set({
        primaryMarketplace: marketplace,
        currentPrice: mp.currentPrice,
        url: mp.productUrl,
      })
      .where(eq(gifts.id, giftId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Set primary marketplace error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set primary marketplace",
    };
  }
}

/**
 * Add multiple marketplace products at once (bulk operation)
 */
export async function addMultipleMarketplaceProducts(
  giftId: string,
  products: Array<{
    marketplace: string;
    productUrl: string;
    productName?: string;
    price?: number;
    imageUrl?: string;
    confidenceScore?: number;
  }>
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Verify gift belongs to user
    const gift = await db.query.gifts.findFirst({
      where: eq(gifts.id, giftId),
      with: { profile: true },
    });

    if (!gift || gift.profile.clerkUserId !== userId) {
      throw new Error("Gift not found or unauthorized");
    }

    // Insert all marketplace products
    const values = products.map((p) => ({
      giftId,
      marketplace: p.marketplace,
      productUrl: p.productUrl,
      productName: p.productName,
      productImageUrl: p.imageUrl,
      currentPrice: p.price?.toString(),
      confidenceScore: p.confidenceScore?.toString(),
    }));

    await db.insert(marketplaceProducts).values(values);

    // Find best price and set as primary
    const bestPrice = Math.min(...products.filter((p) => p.price).map((p) => p.price!));
    const bestProduct = products.find((p) => p.price === bestPrice);

    if (bestProduct) {
      await db
        .update(gifts)
        .set({
          primaryMarketplace: bestProduct.marketplace,
          currentPrice: bestPrice.toString(),
          url: bestProduct.productUrl,
        })
        .where(eq(gifts.id, giftId));
    }

    revalidatePath("/dashboard");
    return { success: true, added: products.length };
  } catch (error) {
    console.error("Add multiple marketplace products error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add marketplace products",
      added: 0,
    };
  }
}

/**
 * Clear expired search cache (called by cron job)
 */
export async function clearSearchCache() {
  try {
    const cleared = await clearExpiredCache();
    return { success: true, cleared };
  } catch (error) {
    console.error("Clear search cache error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cache",
      cleared: 0,
    };
  }
}
